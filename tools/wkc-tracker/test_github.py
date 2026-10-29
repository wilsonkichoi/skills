#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

"""Contract tests for skills/wkc-tracker/github.py.

FakeGitHub keeps issues, milestones, and labels in memory behind the same
methods the verbs call, so each test states one rule from SKILL.md or github.md
and checks what the backend holds afterwards. A few tests drive the real
GitHub class with gh stubbed, to check paging and argument handling.

Run: make test-tracker   (or: uv run --script tools/wkc-tracker/test_github.py)
"""

from __future__ import annotations

import importlib.util
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock

SOURCE = Path(__file__).resolve().parents[2] / "skills" / "wkc-tracker" / "github.py"
spec = importlib.util.spec_from_file_location("github_backend", SOURCE)
g = importlib.util.module_from_spec(spec)
sys.modules["github_backend"] = g
spec.loader.exec_module(g)

REPO = "o/r"


def ref(n: int, repo: str = REPO) -> g.Ref:
    return g.Ref(repo, n)


class FakeGitHub(g.GitHub):
    """In-memory GitHub. `drop` names write methods that report success and change
    nothing; `fail` names write methods that raise as gh would."""

    def __init__(self, login: str = "me") -> None:
        super().__init__(REPO)
        self._login = login
        self.issues: dict[g.Ref, dict] = {}
        self.ms: list[dict] = []
        self.labels = {"backlog", "ready", "in-progress", "in-review"}
        self.drop: set[str] = set()
        self.fail: set[str] = set()
        self.writes: list[tuple] = []
        self.list_node_cap: int | None = None
        self.no_dependencies = False
        self.after_edit = None  # hook run after edit_issue, to simulate another session

    # -- fixture helpers

    def add(self, n: int, title: str = "", status: str = "backlog", repo: str = REPO, **kw) -> dict:
        state, reason, labels = "OPEN", "", []
        if status in g.OPEN_STATUSES and status != "backlog":
            labels = [status]
        elif status == "done":
            state, reason = "CLOSED", "COMPLETED"
        elif status == "cancel":
            state, reason = "CLOSED", "NOT_PLANNED"
        elif status == "duplicate":
            state, reason = "CLOSED", "DUPLICATE"
        elif status == "closed, no reason":
            state = "CLOSED"
        issue = {"title": title or f"T{n}", "body": kw.pop("body", ""), "state": state, "reason": reason,
                 "labels": labels + kw.pop("labels", []), "assignees": kw.pop("assignees", []),
                 "milestone": kw.pop("milestone", None), "comments": [], "blockers": kw.pop("blockers", []),
                 "duplicate_of": kw.pop("duplicate_of", None), "edited": False}
        assert not kw, kw
        self.issues[ref(n, repo)] = issue
        return issue

    def milestone(self, title: str, state: str = "open") -> int:
        number = len(self.ms) + 1
        self.ms.append({"number": number, "title": title, "state": state, "url": f"u/{number}"})
        return number

    def _write(self, name: str, *args) -> bool:
        self.write_attempted = True
        self.writes.append((name, *args))
        if name in self.fail:
            raise g.GhError([name], f"{name} failed")
        return name not in self.drop

    def _issue(self, r: g.Ref) -> g.Issue:
        if r not in self.issues:
            g.refuse(f"{r} does not exist")
        d = self.issues[r]
        ms = next(({"number": m["number"], "title": m["title"]} for m in self.ms if m["number"] == d["milestone"]), None)
        nodes = [{"ref": b, "state": self.issues[b]["state"]} for b in d["blockers"]]
        total = len(nodes)
        if self.list_node_cap is not None:
            nodes = nodes[: self.list_node_cap]
        return g.Issue(ref=r, title=d["title"], state=d["state"], state_reason=d["reason"], labels=list(d["labels"]),
                       assignees=list(d["assignees"]), milestone=ms, body=d["body"], url=f"https://x/{r.number}",
                       comments=[dict(c) for c in d["comments"]], blocked_by=None if self.no_dependencies else nodes,
                       blocked_by_total=total, duplicate_of=d["duplicate_of"])

    # -- reads

    def login(self) -> str:
        return self._login

    def issue_list(self, state: str) -> list[g.Issue]:
        want = {"open": ("OPEN",), "closed": ("CLOSED",), "all": ("OPEN", "CLOSED")}[state]
        return [self._issue(r) for r in self.issues if r.repo == REPO and self.issues[r]["state"] in want]

    def issue(self, number: int) -> g.Issue:
        return self._issue(ref(number))

    def node(self, r: g.Ref) -> g.Issue:
        return self._issue(r)

    def blockers(self, r: g.Ref) -> list[g.Issue]:
        return [self._issue(b) for b in self.issues[r]["blockers"]]

    def milestones(self) -> list[dict]:
        return [dict(m) for m in self.ms]

    def label_names(self) -> list[str]:
        return sorted(self.labels)

    def run_node(self, number: int):
        r = ref(number)
        if r not in self.issues:
            return None
        d = self.issues[r]
        return {"number": number, "state": d["state"], "body": d["body"],
                "lastEditedAt": "2026-01-01" if d["edited"] else None,
                "labels": {"nodes": [{"name": n} for n in d["labels"]]}}

    def issue_id(self, r: g.Ref) -> int:
        if r not in self.issues:
            raise g.GhError(["api"], "Not Found")
        return 1000 + r.number

    # -- writes

    def create_issue(self, title, body, milestone, labels) -> int:
        number = max([r.number for r in self.issues if r.repo == REPO] + [0]) + 1
        if self._write("create_issue", title, body, milestone, labels):
            self.add(number, title, body=body, milestone=milestone, labels=list(labels))
        return number

    def update_issue(self, number, fields) -> None:
        if self._write("update_issue", number, dict(fields)):
            d = self.issues[ref(number)]
            for key, value in fields.items():
                d[key] = value

    def edit_issue(self, number, add_labels=(), remove_labels=(), add_assignees=(), remove_assignees=()) -> None:
        add_labels, remove_labels = list(add_labels), list(remove_labels)
        add_assignees = [self._login if a == "@me" else a for a in add_assignees]
        remove_assignees = [self._login if a == "@me" else a for a in remove_assignees]
        if self._write("edit_issue", number, add_labels, remove_labels, add_assignees, remove_assignees):
            d = self.issues[ref(number)]
            d["labels"] = [x for x in d["labels"] if x not in remove_labels] + [x for x in add_labels if x not in d["labels"]]
            d["assignees"] = [x for x in d["assignees"] if x not in remove_assignees] + [
                x for x in add_assignees if x not in d["assignees"]]
        if self.after_edit:
            hook, self.after_edit = self.after_edit, None
            hook(self.issues[ref(number)])

    def close_issue(self, number, reason, duplicate_of=None) -> None:
        if self._write("close_issue", number, reason, duplicate_of):
            d = self.issues[ref(number)]
            d["state"] = "CLOSED"
            d["reason"] = {"completed": "COMPLETED", "not planned": "NOT_PLANNED", "duplicate": "DUPLICATE"}[reason]
            d["duplicate_of"] = duplicate_of

    def comment(self, number, body) -> None:
        if "comment_lands" in self.fail:
            self.issues[ref(number)]["comments"].append({"author": self._login, "body": body})
        if self._write("comment", number, body):
            self.issues[ref(number)]["comments"].append({"author": self._login, "body": body})

    def add_blocked_by(self, number, blocker_id) -> None:
        blocker = next(r for r in self.issues if 1000 + r.number == blocker_id)
        if self._write("add_blocked_by", number, blocker_id):
            self.issues[ref(number)]["blockers"].append(blocker)

    def remove_blocked_by(self, number, blocker_id) -> None:
        if self._write("remove_blocked_by", number, blocker_id):
            d = self.issues[ref(number)]
            d["blockers"] = [b for b in d["blockers"] if 1000 + b.number != blocker_id]

    def create_milestone(self, title) -> None:
        if self._write("create_milestone", title):
            self.milestone(title)

    def close_milestone(self, number) -> None:
        if self._write("close_milestone", number):
            next(m for m in self.ms if m["number"] == number)["state"] = "closed"

    def create_label(self, name, description) -> None:
        if self._write("create_label", name, description):
            self.labels.add(name)


def code_of(call) -> int:
    try:
        call()
    except g.TrackerError as error:
        return error.code
    return 0


class Statuses(unittest.TestCase):
    def test_each_status_maps_from_labels_and_close_reasons(self):
        f = FakeGitHub()
        for n, status in enumerate(["backlog", "ready", "in-progress", "in-review", "done", "cancel",
                                    "duplicate", "closed, no reason"], 1):
            f.add(n, status=status)
        f.add(9, labels=["ready", "in-review"])
        f.add(10, labels=["bug"])
        got = {r.number: f._issue(r).status for r in f.issues}
        self.assertEqual(got, {1: "backlog", 2: "ready", 3: "in-progress", 4: "in-review", 5: "done", 6: "cancel",
                               7: "duplicate", 8: "closed, no reason", 9: "inconsistent", 10: "backlog"})


class Reads(unittest.TestCase):
    def setUp(self):
        self.f = FakeGitHub()
        m4 = self.f.milestone("M4: Busy")
        self.f.add(1, status="ready", milestone=m4)
        self.f.add(2, status="in-review", assignees=["ann"])
        self.f.add(3, labels=["ready", "in-progress"])
        self.f.add(4, labels=[g.RUN_LABEL])
        self.f.add(5, status="done", milestone=m4)

    def test_list_open_excludes_run_configs_and_names_inconsistent_apart(self):
        out = g.cmd_list(self.f, None, None)
        self.assertEqual([t["number"] for t in out["tickets"]], [1, 2])
        self.assertEqual(out["inconsistent"], [3])

    def test_list_terminal_status_reads_closed_issues(self):
        self.assertEqual([t["number"] for t in g.cmd_list(self.f, "done", None)["tickets"]], [5])

    def test_list_milestone_matches_exactly_and_refuses_a_near_match(self):
        self.assertEqual([t["number"] for t in g.cmd_list(self.f, None, "M4: Busy")["tickets"]], [1])
        with self.assertRaises(g.TrackerError) as caught:
            g.cmd_list(self.f, None, "M4: busy")
        self.assertEqual(caught.exception.code, g.EXIT_REFUSED)
        self.assertEqual(caught.exception.details["milestones"], ["M4: Busy"])

    def test_show_refuses_a_run_config(self):
        self.assertEqual(code_of(lambda: g.cmd_show(self.f, 4)), g.EXIT_REFUSED)

    def test_show_names_an_inconsistent_tickets_labels(self):
        self.assertEqual(g.cmd_show(self.f, 3)["status_labels"], ["ready", "in-progress"])

    def test_a_host_without_dependencies_stops(self):
        self.f.no_dependencies = True
        self.assertEqual(code_of(lambda: g.cmd_next(self.f)), g.EXIT_READ_FAILED)
        self.assertEqual(code_of(lambda: g.cmd_show(self.f, 1)), g.EXIT_READ_FAILED)


class Blockers(unittest.TestCase):
    def setUp(self):
        f = self.f = FakeGitHub()
        f.add(10, status="done")
        f.add(11, status="cancel")
        f.add(12, status="duplicate", duplicate_of=ref(10))
        f.add(13, status="duplicate", duplicate_of=ref(14))
        f.add(14, status="duplicate", duplicate_of=ref(13))
        f.add(15, status="duplicate")
        f.add(16, status="in-progress", assignees=["bob"])
        f.add(7, status="done", repo="x/other")

    def verdict(self, n, repo=REPO):
        return g.blocker_verdict(self.f, self.f.node(ref(n, repo)))

    def test_done_is_met_and_cancel_is_not(self):
        self.assertTrue(self.verdict(10)["met"])
        self.assertIn("canceled", self.verdict(11)["reason"])

    def test_duplicate_follows_its_chain(self):
        self.assertTrue(self.verdict(12)["met"])
        self.assertEqual(self.verdict(12)["chain"], ["o/r#12", "o/r#10"])
        self.assertIn("loops", self.verdict(13)["reason"])
        self.assertIn("no original", self.verdict(15)["reason"])

    def test_open_blocker_names_status_and_holder(self):
        v = self.verdict(16)
        self.assertEqual((v["met"], v["status"], v["assignees"]), (False, "in-progress", ["bob"]))

    def test_cross_repository_blocker_keeps_its_repository(self):
        self.f.add(1, status="ready", blockers=[ref(7, "x/other")])
        out = g.cmd_show(self.f, 1)
        self.assertEqual(out["blockers"][0]["ref"], "x/other#7")
        self.assertTrue(out["blockers"][0]["met"])


class Next(unittest.TestCase):
    def setUp(self):
        f = self.f = FakeGitHub()
        f.add(1, status="ready")
        f.add(2, status="ready", assignees=["ann"])
        f.add(3, status="in-progress", assignees=["bob"])
        f.add(4, status="ready", blockers=[ref(3)])
        f.add(5, status="done")
        f.add(6, status="ready", blockers=[ref(5)])
        f.add(7, status="cancel")
        f.add(8, status="ready", blockers=[ref(7)])
        f.add(9, labels=["ready", g.RUN_LABEL])

    def test_frontier_and_reasons(self):
        out = g.cmd_next(self.f)
        self.assertEqual([t["number"] for t in out["frontier"]], [1, 6])
        held = {h["number"]: h for h in out["held"]}
        self.assertEqual(held[2]["reserved_for"], ["ann"])
        self.assertEqual(held[4]["unmet"][0]["status"], "in-progress")
        self.assertEqual(held[4]["unmet"][0]["assignees"], ["bob"])
        self.assertIn("canceled", held[8]["unmet"][0]["reason"])
        self.assertNotIn(9, [t["number"] for t in out["frontier"]])

    def test_truncated_blocker_list_is_read_in_full(self):
        self.f.issues[ref(1)]["blockers"] = [ref(5), ref(3)]
        self.f.list_node_cap = 1  # the list shows only the done blocker
        out = g.cmd_next(self.f)
        self.assertNotIn(1, [t["number"] for t in out["frontier"]])

    def test_cycle_is_named(self):
        self.f.add(20, status="backlog", blockers=[ref(21)])
        self.f.add(21, status="backlog", blockers=[ref(22)])
        self.f.add(22, status="backlog", blockers=[ref(20)])
        self.assertIn([20, 21, 22, 20], g.cmd_next(self.f)["cycles"])

    def test_cycles_follow_duplicate_and_cross_repository_blockers(self):
        self.f.add(20, status="ready", blockers=[ref(21)])
        self.f.add(21, status="duplicate", duplicate_of=ref(22, "other/r"))
        self.f.add(22, repo="other/r", blockers=[ref(20)])
        out = g.cmd_next(self.f)
        self.assertIn(["o/r#20", "o/r#21", "other/r#22", "o/r#20"], out["cycles"])

    def test_cycles_use_complete_blocker_lists(self):
        self.f.add(20, status="ready", blockers=[ref(5), ref(21)])
        self.f.add(21, blockers=[ref(20)])
        self.f.list_node_cap = 1
        self.assertIn([20, 21, 20], g.cmd_next(self.f)["cycles"])

    def test_missing_duplicate_original_stays_unmet(self):
        self.f.add(20, status="ready", blockers=[ref(21)])
        self.f.add(21, status="duplicate", duplicate_of=ref(99))
        out = g.cmd_next(self.f)
        self.assertNotIn(20, [t["number"] for t in out["frontier"]])
        self.assertTrue(any(n.get("error") for n in out["blocker_graph"]))

    def test_counts_open_statuses(self):
        self.assertEqual(g.cmd_next(self.f)["open_counts"], {"ready": 5, "in-progress": 1})


class MilestoneShow(unittest.TestCase):
    def setUp(self):
        f = self.f = FakeGitHub()
        self.m = f.milestone("M5: Last open")
        f.milestone("M5: Last open plus")
        f.milestone("Old", state="closed")
        f.add(1, status="done", milestone=self.m)
        f.add(2, status="cancel", milestone=self.m)
        f.add(3, status="duplicate", milestone=self.m)
        f.add(4, status="in-review", milestone=self.m)
        f.add(5, labels=[g.RUN_LABEL], milestone=self.m)
        f.add(6, status="ready", milestone=2)

    def test_counts_each_status_apart_and_skips_run_configs(self):
        out = g.cmd_milestone_show(self.f, "M5: Last open")
        self.assertEqual(out["total"], 4)
        self.assertEqual((out["counts"]["done"], out["counts"]["cancel"], out["counts"]["duplicate"],
                          out["counts"]["in-review"]), (1, 1, 1, 1))
        self.assertEqual(out["open_or_unclean"], 1)

    def test_last_open_ticket_done_leaves_nothing_open(self):
        self.f.issues[ref(4)].update(state="CLOSED", reason="COMPLETED", labels=[])
        self.assertEqual(g.cmd_milestone_show(self.f, "M5: Last open")["open_or_unclean"], 0)

    def test_near_match_is_refused_and_closed_milestone_is_shown(self):
        self.assertEqual(code_of(lambda: g.cmd_milestone_show(self.f, "M5: last open")), g.EXIT_REFUSED)
        self.assertEqual(g.cmd_milestone_show(self.f, "Old")["milestone"]["state"], "closed")

    def test_show_never_closes(self):
        g.cmd_milestone_show(self.f, "M5: Last open")
        self.assertEqual(self.f.writes, [])


class Create(unittest.TestCase):
    def setUp(self):
        self.f = FakeGitHub()
        self.m = self.f.milestone("M1")
        self.f.milestone("Done", state="closed")
        self.f.add(1, status="done")

    def test_body_title_milestone_and_edges(self):
        title = "Quote ' \" $(rm -rf) `x` & ünïcode"
        body = "## What to build\nIt.\n\n## Blocked by\n- #1\n"
        out = g.cmd_create(self.f, title, body, "M1", ["#1"])
        d = self.f.issues[ref(out["number"])]
        self.assertEqual((d["title"], d["body"], d["milestone"], d["labels"]), (title, body, self.m, []))
        self.assertEqual(d["blockers"], [ref(1)])

    def test_edges_come_only_from_the_arguments(self):
        out = g.cmd_create(self.f, "t", "## Blocked by\n- #1\n", None)
        self.assertEqual(self.f.issues[ref(out["number"])]["blockers"], [])
        out = g.cmd_create(self.f, "t", "No dependency section.", None, ["#1", "o/r#1", "https://github.com/o/r/issues/1"])
        self.assertEqual(self.f.issues[ref(out["number"])]["blockers"], [ref(1)])

    def test_blocker_verification_ignores_repository_case(self):
        out = g.cmd_create(self.f, "t", "b", None, ["O/R#1", "o/r#1"])
        self.assertEqual(self.f.issues[ref(out["number"])]["blockers"], [ref(1)])

    def test_any_markdown_body_is_kept_exactly(self):
        body = ("## What to build\r\n- ```\r\n  ## Blocked by\r\n  - #99\r\n  ```\r\n<!--\n## Notes\n-->\n"
                "\t~~~\n## Blocked by ##\ncafé\u2028→ 🎉")
        out = g.cmd_create(self.f, "t", body, None)
        d = self.f.issues[ref(out["number"])]
        self.assertEqual((d["body"], d["blockers"]), (body, []))

    def test_closed_or_near_match_milestone_writes_nothing(self):
        self.assertEqual(code_of(lambda: g.cmd_create(self.f, "t", "b", "Done")), g.EXIT_REFUSED)
        self.assertEqual(code_of(lambda: g.cmd_create(self.f, "t", "b", "m1")), g.EXIT_REFUSED)
        self.assertEqual(self.f.writes, [])

    def test_an_invalid_blocker_writes_nothing(self):
        self.f.add(2, labels=[g.RUN_LABEL])
        for blocker in ("#99", "the auth work", "#2"):
            with self.subTest(blocker=blocker):
                self.assertEqual(code_of(lambda: g.cmd_create(self.f, "t", "b", None, [blocker])), g.EXIT_REFUSED)
        self.assertEqual(self.f.writes, [])

    def test_a_create_that_changes_nothing_is_unverified(self):
        self.f.drop.add("create_issue")
        self.assertEqual(code_of(lambda: g.cmd_create(self.f, "t", "b", None)), g.EXIT_UNVERIFIED)

    def test_a_failed_create_is_not_retried(self):
        self.f.fail.add("create_issue")
        self.assertEqual(code_of(lambda: g.cmd_create(self.f, "t", "b", None)), g.EXIT_UNVERIFIED)
        self.assertEqual([w[0] for w in self.f.writes], ["create_issue"])

    def test_a_failed_edge_reports_what_landed(self):
        self.f.fail.add("add_blocked_by")
        with self.assertRaises(g.TrackerError) as caught:
            g.cmd_create(self.f, "t", "b", None, ["#1"])
        self.assertEqual(caught.exception.code, g.EXIT_UNVERIFIED)
        self.assertEqual(caught.exception.details["missing_edges"], ["o/r#1"])


BODY = """Intro line.

## What to build
Old text.

```
## Not a heading
```

### Detail
Belongs to What to build.

## Notes
Keep me.
"""


class Edit(unittest.TestCase):
    def setUp(self):
        f = self.f = FakeGitHub()
        f.milestone("M1")
        f.add(1, status="in-progress", body=BODY, assignees=["me"], labels=["bug"])
        f.add(2, status="ready")
        f.add(3, status="ready", blockers=[ref(1)])
        f.add(4, status="ready")

    def body(self, n=1):
        return self.f.issues[ref(n)]["body"]

    def test_exact_replacement_changes_only_that_text(self):
        out = g.cmd_edit(self.f, 1, old="Old text.\n", new="New text.\n")
        self.assertEqual(self.body(), BODY.replace("Old text.", "New text."))
        self.assertEqual(out["body_sha256"], g.body_digest(self.body()))

    def test_blocker_verification_ignores_repository_case(self):
        for blocker in ("O/R#2", "o/r#2"):
            with self.subTest(blocker=blocker):
                g.cmd_edit(self.f, 1, blocked_by=[blocker])
                self.assertEqual(self.f.issues[ref(1)]["blockers"], [ref(2)])

    def test_missing_ambiguous_or_empty_old_text_writes_nothing(self):
        for old in ("Absent.", "\n\n", "", "old text."):
            with self.subTest(old=old):
                self.assertEqual(code_of(lambda: g.cmd_edit(self.f, 1, old=old, new="x")), g.EXIT_REFUSED)
        self.assertEqual(self.f.writes, [])

    def test_old_text_matches_line_endings_exactly_and_the_rest_is_kept(self):
        body = "## What to build\r\nKeep café\u2028this.\u0085\r\n\r\n## Notes\nOld.\r\n## Related\rKeep.\r"
        self.f.issues[ref(1)]["body"] = body
        self.assertEqual(code_of(lambda: g.cmd_edit(self.f, 1, old="## Notes\nOld.\n", new="x")), g.EXIT_REFUSED)
        g.cmd_edit(self.f, 1, old="## Notes\nOld.\r\n", new="## Notes\r\nNew.\r\n")
        self.assertEqual(self.body(), body.replace("## Notes\nOld.\r\n", "## Notes\r\nNew.\r\n"))

    def test_markdown_in_the_text_is_never_interpreted(self):
        g.cmd_edit(self.f, 1, old="## Not a heading\n", new="## Blocked by\n- #4\n")
        self.assertEqual(self.body(), BODY.replace("## Not a heading", "## Blocked by\n- #4"))
        self.assertEqual(self.f.issues[ref(1)]["blockers"], [])

    def test_append_adds_text_at_the_end(self):
        g.cmd_edit(self.f, 1, append="\n## Acceptance criteria\n- [ ] Works.\n")
        self.assertEqual(self.body(), BODY + "\n## Acceptance criteria\n- [ ] Works.\n")

    def test_whole_body_needs_the_digest_of_the_body_it_replaces(self):
        self.assertEqual(code_of(lambda: g.cmd_edit(self.f, 1, body="New.", expected_sha256="0" * 64)), g.EXIT_REFUSED)
        self.assertEqual(self.f.writes, [])
        g.cmd_edit(self.f, 1, body="New.\r\n", expected_sha256=g.body_digest(BODY))
        self.assertEqual(self.body(), "New.\r\n")

    def test_a_stale_body_is_refused_before_writing(self):
        d = self.f.issues[ref(1)]
        read = self.f.milestones

        def milestones():
            d["body"] = d["body"].replace("Keep me.", "Changed by another session.")
            return read()

        self.f.milestones = milestones
        for change in ({"body": "Mine.", "expected_sha256": g.body_digest(BODY)},
                       {"old": "Keep me.", "new": "Mine."}):
            with self.subTest(change=change):
                d["body"] = BODY
                self.assertEqual(code_of(lambda: g.cmd_edit(self.f, 1, milestone="M1", **change)), g.EXIT_REFUSED)
        self.assertEqual(self.f.writes, [])

    def test_a_body_change_made_during_the_checks_is_kept(self):
        d = self.f.issues[ref(1)]
        read = self.f.milestones

        def milestones():
            d["body"] = d["body"].replace("Keep me.", "Changed by another session.")
            return read()

        self.f.milestones = milestones
        g.cmd_edit(self.f, 1, old="Old text.", new="New text.", milestone="M1")
        self.assertIn("Changed by another session.", d["body"])
        self.assertIn("New text.", d["body"])

    def test_explicit_blockers_replace_clear_or_keep_the_edge_set(self):
        d = self.f.issues[ref(1)]
        d["blockers"] = [ref(2)]
        g.cmd_edit(self.f, 1, title="Kept edges")
        self.assertEqual(d["blockers"], [ref(2)])
        g.cmd_edit(self.f, 1, blocked_by=["#4", "#4"])
        self.assertEqual(d["blockers"], [ref(4)])
        g.cmd_edit(self.f, 1, blocked_by=[])
        self.assertEqual((d["blockers"], d["body"]), ([], BODY))

    def test_cycle_refuses_the_whole_edit(self):
        with self.assertRaises(g.TrackerError) as caught:
            g.cmd_edit(self.f, 1, title="New title", blocked_by=["#3"], old="Old text.", new="x")
        self.assertEqual(caught.exception.code, g.EXIT_REFUSED)
        self.assertEqual(caught.exception.details["cycle"], ["o/r#1", "o/r#3", "o/r#1"])
        self.assertEqual(self.f.writes, [])

    def test_an_invalid_text_change_refuses_the_whole_edit(self):
        self.assertEqual(code_of(lambda: g.cmd_edit(self.f, 1, title="New", blocked_by=["#4"], old="Absent.", new="x")),
                         g.EXIT_REFUSED)
        self.assertEqual(self.f.writes, [])

    def test_title_and_milestone_change_nothing_else(self):
        g.cmd_edit(self.f, 1, title="New", milestone="M1")
        d = self.f.issues[ref(1)]
        self.assertEqual((d["title"], d["milestone"], d["body"], d["labels"], d["assignees"]),
                         ("New", 1, BODY, ["in-progress", "bug"], ["me"]))
        g.cmd_edit(self.f, 1, clear_milestone=True)
        self.assertIsNone(d["milestone"])

    def test_closed_ticket_takes_the_edit_and_stays_closed(self):
        self.f.add(5, status="done")
        g.cmd_edit(self.f, 5, title="Renamed")
        self.assertEqual(self.f.issues[ref(5)]["state"], "CLOSED")

    def test_an_edit_that_changes_nothing_is_unverified(self):
        self.f.drop.add("update_issue")
        self.assertEqual(code_of(lambda: g.cmd_edit(self.f, 1, title="X")), g.EXIT_UNVERIFIED)
        self.assertEqual(code_of(lambda: g.cmd_edit(self.f, 1, old="Old text.", new="New.")), g.EXIT_UNVERIFIED)


class Assign(unittest.TestCase):
    def setUp(self):
        f = self.f = FakeGitHub()
        f.add(1, status="ready")
        f.add(2, status="in-progress", assignees=["ann"])
        f.add(3, status="done")

    def test_bare_form_takes_a_ready_ticket(self):
        out = g.cmd_assign(self.f, 1, None, [])
        self.assertEqual((out["status"], out["assignees"]), ("in-progress", ["me"]))

    def test_bare_form_refuses_anything_but_unheld_ready(self):
        self.assertEqual(code_of(lambda: g.cmd_assign(self.f, 2, None, [])), g.EXIT_REFUSED)
        self.assertEqual(code_of(lambda: g.cmd_assign(self.f, 3, None, [])), g.EXIT_REFUSED)
        self.assertEqual(self.f.writes, [])

    def test_another_holder_must_be_named(self):
        self.assertEqual(code_of(lambda: g.cmd_assign(self.f, 2, "bob", [])), g.EXIT_REFUSED)
        g.cmd_assign(self.f, 2, "bob", ["ann"])
        self.assertEqual(self.f.issues[ref(2)]["assignees"], ["bob"])
        self.assertEqual(self.f.issues[ref(2)]["labels"], ["in-progress"])

    def test_none_unassigns(self):
        g.cmd_assign(self.f, 2, "none", ["ann"])
        self.assertEqual(self.f.issues[ref(2)]["assignees"], [])

    def test_dropped_assignee_is_unverified_and_status_goes_back(self):
        self.f.issues[ref(1)]["assignees"] = []
        f = self.f
        f.after_edit = lambda d: d["assignees"].remove("me")
        self.assertEqual(code_of(lambda: g.cmd_assign(f, 1, None, [])), g.EXIT_UNVERIFIED)
        self.assertEqual(f.issues[ref(1)]["labels"], ["ready"])

    def test_concurrent_status_change_takes_the_claim_back(self):
        self.f.after_edit = lambda d: d["labels"].append("in-review")
        self.assertEqual(code_of(lambda: g.cmd_assign(self.f, 1, None, [])), g.EXIT_UNVERIFIED)
        d = self.f.issues[ref(1)]
        self.assertEqual((d["labels"], d["assignees"]), (["in-review"], []))

    def test_tie_break_keeps_the_first_login(self):
        self.f.after_edit = lambda d: d["assignees"].append("abe")
        self.assertEqual(code_of(lambda: g.cmd_assign(self.f, 1, None, [])), g.EXIT_REFUSED)
        self.assertEqual(self.f.issues[ref(1)]["assignees"], ["abe"])


class Move(unittest.TestCase):
    def setUp(self):
        f = self.f = FakeGitHub()
        f.add(1, labels=["ready", "in-review", "bug"], assignees=["ann"])
        f.add(2, status="in-progress", assignees=["me"])
        f.add(3, status="done")

    def test_open_move_repairs_inconsistent_and_keeps_topic_labels(self):
        g.cmd_move(self.f, 1, "in-progress", None)
        d = self.f.issues[ref(1)]
        self.assertEqual((sorted(d["labels"]), d["assignees"]), (["bug", "in-progress"], ["ann"]))

    def test_backlog_and_ready_clear_every_assignee(self):
        g.cmd_move(self.f, 1, "ready", None)
        self.assertEqual(self.f.issues[ref(1)]["assignees"], [])

    def test_terminal_move_closes_and_strips_status_labels(self):
        g.cmd_move(self.f, 2, "done", None)
        d = self.f.issues[ref(2)]
        self.assertEqual((d["state"], d["reason"], d["labels"], d["assignees"]), ("CLOSED", "COMPLETED", [], ["me"]))

    def test_duplicate_needs_and_records_its_original(self):
        self.assertEqual(code_of(lambda: g.cmd_move(self.f, 2, "duplicate", None)), g.EXIT_REFUSED)
        g.cmd_move(self.f, 2, "duplicate", "#3")
        self.assertEqual(self.f.issues[ref(2)]["duplicate_of"], ref(3))

    def test_terminal_tickets_and_non_statuses_are_refused(self):
        self.assertEqual(code_of(lambda: g.cmd_move(self.f, 3, "ready", None)), g.EXIT_REFUSED)
        self.assertEqual(code_of(lambda: g.cmd_move(self.f, 2, "blocked", None)), g.EXIT_REFUSED)
        self.assertEqual(self.f.writes, [])

    def test_half_landed_close_reports_what_landed(self):
        self.f.fail.add("edit_issue")
        with self.assertRaises(g.TrackerError) as caught:
            g.cmd_move(self.f, 2, "cancel", None)
        self.assertEqual((caught.exception.code, caught.exception.details["landed"]), (g.EXIT_UNVERIFIED, ["closed"]))

    def test_a_move_that_changes_nothing_is_unverified(self):
        self.f.drop.add("edit_issue")
        self.assertEqual(code_of(lambda: g.cmd_move(self.f, 2, "in-review", None)), g.EXIT_UNVERIFIED)


class Comment(unittest.TestCase):
    def setUp(self):
        self.f = FakeGitHub()
        self.f.add(1)

    def test_exact_body_lands(self):
        body = "wkc-implement: done\nMerged: x\n`$(no)` 'q' \"q\"\n"
        g.cmd_comment(self.f, 1, body)
        self.assertEqual(self.f.issues[ref(1)]["comments"][-1]["body"], body)

    def test_dropped_comment_is_unverified(self):
        self.f.drop.add("comment")
        self.assertEqual(code_of(lambda: g.cmd_comment(self.f, 1, "x")), g.EXIT_UNVERIFIED)

    def test_identical_comments_are_appended(self):
        g.cmd_comment(self.f, 1, "x")
        g.cmd_comment(self.f, 1, "x")
        self.assertEqual([c["body"] for c in self.f.issues[ref(1)]["comments"]], ["x", "x"])

    def test_an_earlier_identical_comment_cannot_verify_a_dropped_write(self):
        g.cmd_comment(self.f, 1, "x")
        for failure in ("drop", "fail"):
            with self.subTest(failure=failure):
                self.f.drop.clear()
                self.f.fail.clear()
                getattr(self.f, failure).add("comment")
                with self.assertRaises(g.TrackerError) as caught:
                    g.cmd_comment(self.f, 1, "x")
                self.assertEqual(caught.exception.code, g.EXIT_UNVERIFIED)
                if failure == "fail":
                    self.assertFalse(caught.exception.details["landed"])
        self.assertEqual(len(self.f.issues[ref(1)]["comments"]), 1)

    def test_failed_call_that_landed_is_reported_and_not_retried(self):
        g.cmd_comment(self.f, 1, "x")
        self.f.fail |= {"comment", "comment_lands"}
        with self.assertRaises(g.TrackerError) as caught:
            g.cmd_comment(self.f, 1, "x")
        self.assertTrue(caught.exception.details["landed"])
        self.assertEqual(len(self.f.issues[ref(1)]["comments"]), 2)


class Links(unittest.TestCase):
    def setUp(self):
        f = self.f = FakeGitHub()
        f.add(1, status="ready")
        f.add(2, status="ready", blockers=[ref(1)])
        f.add(3, status="done", blockers=[ref(2)])
        f.add(4, status="duplicate", duplicate_of=ref(2))
        f.add(5, status="ready", blockers=[ref(1)])

    def test_self_link_and_cycle_are_refused(self):
        self.assertEqual(code_of(lambda: g.cmd_link(self.f, 1, "#1")), g.EXIT_REFUSED)
        with self.assertRaises(g.TrackerError) as caught:
            g.cmd_link(self.f, 1, "#2")
        self.assertEqual(caught.exception.details["cycle"], ["o/r#1", "o/r#2", "o/r#1"])
        self.assertEqual(self.f.writes, [])

    def test_done_ends_the_walk_and_duplicate_continues(self):
        g.cmd_link(self.f, 1, "#3")  # 3 is done: no cycle through it
        self.assertEqual(code_of(lambda: g.cmd_link(self.f, 1, "#4")), g.EXIT_REFUSED)  # 4 → 2 → 1

    def test_link_leaves_the_blockers_own_edges(self):
        g.cmd_link(self.f, 5, "#2")
        self.assertEqual(self.f.issues[ref(5)]["blockers"], [ref(1), ref(2)])
        self.assertEqual(self.f.issues[ref(2)]["blockers"], [ref(1)])

    def test_dropped_link_is_unverified(self):
        self.f.drop.add("add_blocked_by")
        self.assertEqual(code_of(lambda: g.cmd_link(self.f, 5, "#2")), g.EXIT_UNVERIFIED)

    def test_unlink_needs_the_edge_and_keeps_the_others(self):
        self.assertEqual(code_of(lambda: g.cmd_unlink(self.f, 1, "#2")), g.EXIT_REFUSED)
        self.f.issues[ref(5)]["blockers"].append(ref(2))
        g.cmd_unlink(self.f, 5, "o/r#1")
        self.assertEqual(self.f.issues[ref(5)]["blockers"], [ref(2)])

    def test_dropped_unlink_is_unverified(self):
        self.f.drop.add("remove_blocked_by")
        self.assertEqual(code_of(lambda: g.cmd_unlink(self.f, 2, "#1")), g.EXIT_UNVERIFIED)


class Milestones(unittest.TestCase):
    def setUp(self):
        self.f = FakeGitHub()
        self.f.milestone("Open one")
        self.f.milestone("Closed one", state="closed")

    def test_ensure(self):
        self.assertFalse(g.cmd_milestone_ensure(self.f, "Open one")["created"])
        self.assertEqual(code_of(lambda: g.cmd_milestone_ensure(self.f, "Closed one")), g.EXIT_REFUSED)
        self.assertEqual(self.f.writes, [])
        self.assertTrue(g.cmd_milestone_ensure(self.f, "M3: New")["created"])

    def test_ensure_that_changes_nothing_is_unverified(self):
        self.f.drop.add("create_milestone")
        self.assertEqual(code_of(lambda: g.cmd_milestone_ensure(self.f, "x")), g.EXIT_UNVERIFIED)

    def test_close(self):
        self.assertFalse(g.cmd_milestone_close(self.f, "Closed one")["closed"])
        self.assertEqual(code_of(lambda: g.cmd_milestone_close(self.f, "open one")), g.EXIT_REFUSED)
        self.f.add(1, status="ready", milestone=1)
        self.assertTrue(g.cmd_milestone_close(self.f, "Open one")["closed"])
        self.assertEqual([w[0] for w in self.f.writes], ["close_milestone"])
        self.assertEqual(self.f.issues[ref(1)]["state"], "OPEN")

    def test_list_is_sorted_and_includes_closed(self):
        out = g.cmd_milestone_list(self.f)["milestones"]
        self.assertEqual([(m["title"], m["state"]) for m in out], [("Open one", "open"), ("Closed one", "closed")])


class RunConfigs(unittest.TestCase):
    def setUp(self):
        self.f = FakeGitHub()
        self.f.labels.discard(g.RUN_LABEL)

    def test_create_show_close(self):
        text = "Run branch: run/m4\nLimits: none\n"
        number = g.cmd_run_create(self.f, "run/m4", text)["reference"]
        self.assertIn(g.RUN_LABEL, self.f.labels)
        d = self.f.issues[ref(number)]
        self.assertEqual((d["title"], d["labels"], d["milestone"], d["assignees"]),
                         ("Run config: run/m4", [g.RUN_LABEL], None, []))
        self.assertEqual(g.cmd_run_show(self.f, number)["text"], text)
        g.cmd_run_close(self.f, number)
        self.assertEqual(g.cmd_run_show(self.f, number)["state"], "CLOSED")

    def test_show_refuses_edited_unlabeled_and_missing(self):
        self.f.add(1, labels=[g.RUN_LABEL])["edited"] = True
        self.f.add(2)
        for n in (1, 2, 99):
            self.assertEqual(code_of(lambda: g.cmd_run_show(self.f, n)), g.EXIT_REFUSED)

    def test_run_close_refuses_a_ticket(self):
        self.f.add(2)
        self.assertEqual(code_of(lambda: g.cmd_run_close(self.f, 2)), g.EXIT_REFUSED)
        self.assertEqual(self.f.writes, [])

    def test_ticket_verbs_refuse_a_run_config(self):
        self.f.add(1, labels=[g.RUN_LABEL])
        for call in (lambda: g.cmd_comment(self.f, 1, "x"), lambda: g.cmd_move(self.f, 1, "ready", None),
                     lambda: g.cmd_assign(self.f, 1, None, []), lambda: g.cmd_edit(self.f, 1, title="x")):
            self.assertEqual(code_of(call), g.EXIT_REFUSED)
        self.assertEqual(self.f.writes, [])


class Parsing(unittest.TestCase):
    def test_refs(self):
        self.assertEqual(g.parse_ref("#12", REPO), ref(12))
        self.assertEqual(g.parse_ref("A/B#3", REPO), ref(3, "a/b"))
        self.assertEqual(g.parse_ref("https://github.com/a/b/issues/4", REPO), ref(4, "a/b"))
        self.assertEqual(g.refs_given(["#1", "1", "a/b#2", "A/B#2"], REPO), [ref(1), ref(2, "a/b")])
        self.assertEqual(code_of(lambda: g.parse_ref("the auth work", REPO)), g.EXIT_REFUSED)
        self.assertEqual(code_of(lambda: g.parse_ref("https://github.com/a/b/pull/4", REPO)), g.EXIT_REFUSED)


class RealGitHub(unittest.TestCase):
    """The real class with gh stubbed: paging and argument handling."""

    def test_ticket_verbs_refuse_pull_requests_before_writing(self):
        raw = {"number": 1, "title": "A pull request", "state": "OPEN", "stateReason": "",
               "labels": [], "assignees": [], "milestone": None, "body": "PR body",
               "blockedBy": {"nodes": [], "totalCount": 0}, "comments": [],
               "url": "https://github.com/o/r/pull/1"}
        verbs = (["show", "1"], ["edit", "1", "--title", "new"], ["assign", "1", "alice"],
                 ["move", "1", "ready"], ["comment", "1", "--body-file", "-"],
                 ["link", "1", "2"], ["unlink", "1", "2"])
        for verb in verbs:
            with self.subTest(verb=verb):
                f = FakeGitHub()
                f.add(1)
                f.add(2)
                reader = g.GitHub(REPO)
                output = io.StringIO()
                with mock.patch.object(reader, "gh_json", return_value=raw), \
                     mock.patch.object(f, "issue", side_effect=reader.issue), \
                     mock.patch.object(sys, "stdin", io.StringIO("A comment")), \
                     redirect_stdout(output):
                    code = g.main(verb, gh=f)
                result = json.loads(output.getvalue())
                self.assertEqual((code, result.get("error")), (1, "refused"))
                self.assertIn("pull request", result["message"])
                self.assertEqual(f.writes, [])

    def test_issue_list_raises_the_limit_on_a_full_page(self):
        rows = [{"number": n, "title": "", "state": "OPEN", "labels": [], "assignees": [],
                 "blockedBy": {"nodes": [], "totalCount": 0}} for n in range(1, 701)]
        limits = []

        def fake(args, stdin=None):
            limit = int(args[args.index("--limit") + 1])
            limits.append(limit)
            return rows[:limit]

        gh = g.GitHub(REPO)
        with mock.patch.object(gh, "gh_json", side_effect=fake):
            self.assertEqual(len(gh.issue_list("all")), 700)
        self.assertEqual(limits, [500, 2000])

    def test_milestones_flatten_every_page(self):
        pages = [[{"number": n, "title": f"M{n}", "state": "open"} for n in range(1, 101)],
                 [{"number": 101, "title": "M101", "state": "closed"}]]
        gh = g.GitHub(REPO)
        with mock.patch.object(gh, "gh_json", return_value=pages) as stub:
            self.assertEqual(len(gh.milestones()), 101)
        args = stub.call_args.args[0]
        self.assertIn("--paginate", args)
        self.assertIn("state=all&per_page=100", args[-1])

    def test_blockers_page_through_and_fail_when_counts_differ(self):
        node = lambda n: {"number": n, "title": "", "url": "", "state": "OPEN", "stateReason": None,
                          "repository": {"nameWithOwner": REPO}, "duplicateOf": None,
                          "labels": {"nodes": []}, "assignees": {"nodes": []}}
        page = lambda nodes, more, total: {"repository": {"issue": {"blockedBy": {
            "totalCount": total, "pageInfo": {"hasNextPage": more, "endCursor": "c"}, "nodes": nodes}}}}
        gh = g.GitHub(REPO)
        with mock.patch.object(gh, "graphql", side_effect=[page([node(1)], True, 2), page([node(2)], False, 2)]):
            self.assertEqual([b.ref.number for b in gh.blockers(ref(9))], [1, 2])
        with mock.patch.object(gh, "graphql", return_value=page([node(1)], False, 3)):
            self.assertEqual(code_of(lambda: gh.blockers(ref(9))), g.EXIT_READ_FAILED)

    def test_text_goes_on_stdin_never_into_arguments(self):
        calls = []

        def run(cmd, input=None, **kw):
            calls.append((cmd, input))
            return subprocess.CompletedProcess(cmd, 0, stdout=b'{"number": 7}', stderr=b"")

        title, body = "a'b\"$(c)", "## X\r\ncafé → 🎉 `y`\r\n"
        with mock.patch.object(g.subprocess, "run", side_effect=run):
            gh = g.GitHub(REPO)
            gh.create_issue(title, body, 3, [])
            gh.comment(7, body)
        (create, create_in), (comment, comment_in) = calls
        self.assertEqual(json.loads(create_in), {"title": title, "body": body, "labels": [], "milestone": 3})
        self.assertNotIn(title, " ".join(create))
        self.assertEqual((comment[-2:], comment_in), (["--body-file", "-"], body.encode("utf-8")))

    def test_real_writes_mark_attempts_before_transport_failure(self):
        for method, args in (("create_issue", ("t", "b", None, [])),
                             ("comment", (1, "b")), ("add_blocked_by", (1, 2)),
                             ("close_milestone", (1,))):
            with self.subTest(method=method):
                gh = g.GitHub(REPO)
                with mock.patch.object(gh, "gh", side_effect=g.GhError(["api"], "transport failure")):
                    self.assertRaises(g.TrackerError, getattr(gh, method), *args)
                self.assertTrue(gh.write_attempted)

    def test_run_show_of_a_missing_issue_refuses(self):
        gh = g.GitHub(REPO)
        missing = g.GhError(["api", "graphql"], "gh: Could not resolve to an Issue with the number of 99.")
        with mock.patch.object(gh, "gh", side_effect=missing):
            self.assertEqual(code_of(lambda: g.cmd_run_show(gh, 99)), g.EXIT_REFUSED)

    def test_graphql_variables_are_arguments_not_query_text(self):
        gh = g.GitHub(REPO)
        with mock.patch.object(gh, "gh_json", return_value={"data": {}}) as stub:
            gh.graphql(g.NODE_QUERY, owner="o", name="r'x", n=5)
        args = stub.call_args.args[0]
        self.assertIn("name=r'x", args)
        self.assertIn("n=5", args)
        self.assertEqual(args[args.index("n=5") - 1], "-F")


class Cli(unittest.TestCase):
    def run_cli(self, argv, f):
        out = io.StringIO()
        with redirect_stdout(out):
            code = g.main(argv, gh=f)
        return code, json.loads(out.getvalue())

    def test_success_and_refusal_are_json_with_exit_codes(self):
        f = FakeGitHub()
        f.milestone("M1")
        code, out = self.run_cli(["milestone", "show", "M1"], f)
        self.assertEqual((code, out["ok"], out["verb"], out["total"]), (0, True, "milestone show", 0))
        code, out = self.run_cli(["milestone", "show", "m1"], f)
        self.assertEqual((code, out["ok"], out["error"]), (1, False, "refused"))

    def test_file_bodies_keep_their_line_endings(self):
        body = "## Notes\r\nKeep café → 🎉.\r\n"
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "body.md"
            path.write_bytes(body.encode("utf-8"))
            for verb in (["create", "--title", "T"], ["comment", "1"],
                         ["run", "create", "--run-branch", "run/test"]):
                with self.subTest(verb=verb):
                    f = FakeGitHub()
                    f.add(1)
                    code, out = self.run_cli([*verb, "--body-file", str(path)], f)
                    self.assertEqual(code, 0, out)
                    actual = (f.issues[ref(1)]["comments"][-1]["body"] if verb[0] == "comment"
                              else f.issues[ref(2)]["body"])
                    self.assertEqual(actual, body)

    def test_text_that_is_not_utf8_is_refused_as_json(self):
        with tempfile.TemporaryDirectory() as directory:
            utf16 = Path(directory) / "body.md"
            utf16.write_bytes("Body.\n".encode("utf-16"))
            for name, path, stdin in (("UTF-16 file", str(utf16), b""), ("Latin-1 stdin", "-", "café".encode("latin-1"))):
                with self.subTest(name), mock.patch.object(
                        sys, "stdin", io.TextIOWrapper(io.BytesIO(stdin), encoding="utf-8", newline="")):
                    f = FakeGitHub()
                    f.add(1)
                    code, out = self.run_cli(["comment", "1", "--body-file", path], f)
                    self.assertEqual((code, out["error"], f.writes), (1, "refused", []))

    def test_edit_text_files_keep_their_line_endings_and_edges_are_explicit(self):
        with tempfile.TemporaryDirectory() as directory:
            old, new = Path(directory) / "old.txt", Path(directory) / "new.txt"
            old.write_bytes("Old.\r\n".encode("utf-8"))
            new.write_bytes("New → 🎉.\r\n".encode("utf-8"))
            f = FakeGitHub()
            f.add(1, body="## Notes\r\nOld.\r\n", blockers=[])
            f.add(2)
            f.add(3)
            code, out = self.run_cli(["edit", "1", "--old-text-file", str(old), "--new-text-file", str(new),
                                      "--blocked-by", "2", "--blocked-by", "#3"], f)
            self.assertEqual(code, 0, out)
            self.assertEqual((f.issues[ref(1)]["body"], f.issues[ref(1)]["blockers"]),
                             ("## Notes\r\nNew → 🎉.\r\n", [ref(2), ref(3)]))
            code, out = self.run_cli(["edit", "1", "--no-blockers"], f)
            self.assertEqual((code, f.issues[ref(1)]["blockers"]), (0, []))
            code, out = self.run_cli(["create", "--title", "T", "--body-file", str(new), "--blocked-by", "2"], f)
            self.assertEqual((code, f.issues[ref(4)]["blockers"]), (0, [ref(2)]))

    def test_edit_argument_rules_are_usage_errors(self):
        for argv in (["edit", "1", "--old-text-file", "a"], ["edit", "1", "--body-file", "a"],
                     ["edit", "1", "--expected-sha256", "0", "--title", "t"],
                     ["edit", "1", "--old-text-file", "-", "--new-text-file", "-"],
                     ["edit", "1", "--old-text-file", "a", "--new-text-file", "b", "--append-file", "c"],
                     ["edit", "1", "--blocked-by", "2", "--no-blockers"], ["edit", "1", "--sections-file", "a"]):
            with self.subTest(argv=argv), redirect_stdout(io.StringIO()), \
                 mock.patch.object(sys, "stderr", io.StringIO()), self.assertRaises(SystemExit) as caught:
                g.main(argv, gh=FakeGitHub())
            self.assertEqual(caught.exception.code, 2)

    def test_post_write_read_failures_are_unverified(self):
        for verb in (["assign", "1", "alice"], ["move", "1", "ready"],
                     ["edit", "1", "--title", "new"]):
            for failure in (g.GhError(["issue", "view"], "read failed"),
                            g.TrackerError(g.EXIT_REFUSED, "missing issue")):
                with self.subTest(verb=verb, failure=failure):
                    f = FakeGitHub()
                    f.add(1)
                    before = f.issue(1)
                    with mock.patch.object(f, "issue", side_effect=[before, failure]):
                        code, out = self.run_cli(verb, f)
                    self.assertTrue(f.writes)
                    self.assertEqual((code, out.get("error")), (3, "unverified"))

    def test_failed_link_request_is_unverified(self):
        f = FakeGitHub()
        f.add(1)
        f.add(2)
        f.fail.add("add_blocked_by")
        code, out = self.run_cli(["link", "1", "2"], f)
        self.assertEqual((code, out.get("error")), (3, "unverified"))

    def test_closed_issue_cannot_verify_an_open_move_or_assignment(self):
        for verb in (["move", "1", "ready"], ["assign", "1", "alice"], ["assign", "1"]):
            with self.subTest(verb=verb):
                f = FakeGitHub()
                f.add(1, status="ready")
                f.after_edit = lambda d: d.update(state="CLOSED", reason="COMPLETED")
                code, out = self.run_cli(verb, f)
                self.assertEqual((code, out.get("error")), (3, "unverified"))
                self.assertEqual(f.issues[ref(1)]["state"], "CLOSED")

    def test_run_configs_cannot_be_ticket_edge_targets(self):
        for verb in (["link", "1", "2"], ["move", "1", "duplicate", "--original", "2"]):
            with self.subTest(verb=verb):
                f = FakeGitHub()
                f.add(1)
                f.add(2, labels=[g.RUN_LABEL])
                code, out = self.run_cli(verb, f)
                self.assertEqual((code, out.get("error")), (1, "refused"))
                self.assertEqual(f.writes, [])

    def test_origin_repo_parsing(self):
        for url in ("git@github.com:a/b.git", "https://github.com/a/b", "https://github.com/a/b.git"):
            with mock.patch.object(g.subprocess, "run",
                                   return_value=subprocess.CompletedProcess([], 0, stdout=url + "\n")):
                self.assertEqual(g.origin_repo(), "a/b")


class Locale(unittest.TestCase):
    """The script as a process, with a fake gh that speaks UTF-8 as the real one
    does, under a Latin-1 locale such as a Windows code page gives."""

    TEXT = "café → 🎉\r\nSecond line.\r\n"
    FAKE_GH = """\
import json, os, sys
text, state = {text}, os.environ["FAKE_GH_STATE"]
if sys.argv[1:3] == ["issue", "comment"]:
    open(state, "wb").write(sys.stdin.buffer.read())
    sys.exit(0)
said = open(state, "rb").read().decode("utf-8") if os.path.exists(state) else None
if sys.argv[1:3] == ["issue", "view"]:
    result = {{"number": 1, "title": text, "body": "", "state": "OPEN", "stateReason": "", "labels": [],
              "assignees": [], "milestone": None, "blockedBy": {{"nodes": [], "totalCount": 0}},
              "comments": [{{"author": {{"login": "me"}}, "body": said}}] if said else [],
              "url": "https://github.com/o/r/issues/1"}}
else:
    result = {{"data": {{"repository": {{"issue": {{"number": 1, "state": "OPEN", "body": text,
              "lastEditedAt": None, "labels": {{"nodes": [{{"name": "wkc-run"}}]}}}}}}}}}}
sys.stdout.buffer.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))
"""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp)
        fake = self.tmp / "gh"
        fake.write_text(f"#!{sys.executable}\n" + self.FAKE_GH.format(text=ascii(self.TEXT)), encoding="utf-8")
        fake.chmod(0o755)
        self.state = self.tmp / "said"
        self.env = {k: v for k, v in os.environ.items() if k not in ("PYTHONUTF8", "PYTHONIOENCODING")}
        self.env |= {"PATH": f"{self.tmp}{os.pathsep}{os.environ['PATH']}", "LC_ALL": "en_US.ISO8859-1",
                     "FAKE_GH_STATE": str(self.state)}
        probe = self.python(["-c", "import locale; print(locale.getpreferredencoding(False))"])
        if "utf" in probe.stdout.decode().lower():
            self.skipTest("no Latin-1 locale on this machine")

    def python(self, args, stdin=b""):
        return subprocess.run([sys.executable, "-X", "utf8=0", *args], input=stdin, capture_output=True,
                              env=self.env, check=False)

    def test_text_in_and_out_is_utf8(self):
        body = self.tmp / "body.md"
        body.write_bytes(self.TEXT.encode("utf-8"))
        for name, args, stdin in (("comment from a file", ["comment", "1", "--body-file", str(body)], b""),
                                  ("comment from stdin", ["comment", "1", "--body-file", "-"],
                                   self.TEXT.encode("utf-8"))):
            with self.subTest(name):
                self.state.unlink(missing_ok=True)
                run = self.python([str(SOURCE), "--repo", REPO, *args], stdin)
                self.assertEqual(run.returncode, 0, run.stdout.decode(errors="replace") + run.stderr.decode(errors="replace"))
                self.assertEqual(self.state.read_bytes(), self.TEXT.encode("utf-8"))
        with self.subTest("run show"):
            run = self.python([str(SOURCE), "--repo", REPO, "run", "show", "1"])
            self.assertEqual(run.returncode, 0, run.stderr.decode(errors="replace"))
            self.assertEqual(json.loads(run.stdout.decode("utf-8"))["text"], self.TEXT)


if __name__ == "__main__":
    unittest.main()
