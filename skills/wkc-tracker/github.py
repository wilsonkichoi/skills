#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///

"""GitHub Issues backend for wkc-tracker.

Runs one wkc-tracker verb against GitHub through the authenticated `gh` CLI and
prints one JSON object on stdout. Every write reads first, checks the verb's
precondition, writes, and verifies with a separate read. github.md maps the
verbs to these commands; SKILL.md owns what each verb means.

Exit codes:
  0  done: the read succeeded, or the write verified
  1  refused: a precondition failed, nothing was written
  2  usage error
  3  unverified: a write ran, and the re-read does not match or only part landed
  4  read failed: gh failed, or data was missing, malformed, or incomplete; nothing written
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from typing import Any, Iterable, NoReturn

OPEN_STATUSES = ("backlog", "ready", "in-progress", "in-review")
CLOSED_REASONS = {"COMPLETED": "done", "NOT_PLANNED": "cancel", "DUPLICATE": "duplicate"}
STATUSES = OPEN_STATUSES + tuple(CLOSED_REASONS.values())
CLOSE_ARGS = {"done": "completed", "cancel": "not planned", "duplicate": "duplicate"}
RUN_LABEL = "wkc-run"

EXIT_REFUSED, EXIT_UNVERIFIED, EXIT_READ_FAILED = 1, 3, 4
ERROR_NAMES = {EXIT_REFUSED: "refused", EXIT_UNVERIFIED: "unverified", EXIT_READ_FAILED: "read_failed"}


class TrackerError(Exception):
    def __init__(self, code: int, message: str, **details: Any) -> None:
        super().__init__(message)
        self.code = code
        self.details = details


def refuse(message: str, **details: Any) -> NoReturn:
    raise TrackerError(EXIT_REFUSED, message, **details)


def unverified(message: str, **details: Any) -> NoReturn:
    raise TrackerError(EXIT_UNVERIFIED, message, **details)


def read_failed(message: str, **details: Any) -> NoReturn:
    raise TrackerError(EXIT_READ_FAILED, message, **details)


# ---------------------------------------------------------------- data model


@dataclass(frozen=True, eq=False)
class Ref:
    """One issue, named by repository and number. GitHub repository names are
    case-insensitive, so two Refs are equal whatever case each was written in."""

    repo: str
    number: int

    def _key(self) -> tuple[str, int]:
        return (self.repo.lower(), self.number)

    def __eq__(self, other: object) -> bool:
        return isinstance(other, Ref) and self._key() == other._key()

    def __hash__(self) -> int:
        return hash(self._key())

    def __str__(self) -> str:
        return f"{self.repo}#{self.number}"


@dataclass
class Issue:
    ref: Ref
    title: str
    state: str  # OPEN or CLOSED
    state_reason: str
    labels: list[str]
    assignees: list[str]
    milestone: dict[str, Any] | None = None
    body: str | None = None
    url: str = ""
    comments: list[dict[str, Any]] | None = None
    # Blockers as Refs with state, None when the host has no issue dependencies.
    blocked_by: list[dict[str, Any]] | None = field(default_factory=list)
    blocked_by_total: int = 0
    duplicate_of: Ref | None = None

    @property
    def status(self) -> str:
        if self.state == "CLOSED":
            return CLOSED_REASONS.get(self.state_reason or "", "closed, no reason")
        found = [name for name in self.labels if name in OPEN_STATUSES]
        if len(found) > 1:
            return "inconsistent"
        return found[0] if found else "backlog"

    @property
    def status_labels(self) -> list[str]:
        return [name for name in self.labels if name in OPEN_STATUSES]

    @property
    def is_run_config(self) -> bool:
        return RUN_LABEL in self.labels

    @property
    def blockers_truncated(self) -> bool:
        return self.blocked_by is not None and self.blocked_by_total != len(self.blocked_by)

    def summary(self) -> dict[str, Any]:
        return {
            "number": self.ref.number,
            "title": self.title,
            "status": self.status,
            "assignees": self.assignees,
            "milestone": self.milestone["title"] if self.milestone else None,
        }


def parse_ref(text: str, repo: str) -> Ref:
    """Read `12`, `#12`, `owner/repo#12`, or an issue URL."""
    text = text.strip()
    match = re.fullmatch(r"#?(\d+)", text)
    if match:
        return Ref(repo, int(match.group(1)))
    match = re.fullmatch(r"([\w.-]+/[\w.-]+)#(\d+)", text)
    if match:
        return Ref(match.group(1), int(match.group(2)))
    match = re.fullmatch(r"https://[^/\s]+/([\w.-]+/[\w.-]+)/issues/(\d+)/?", text)
    if match:
        return Ref(match.group(1), int(match.group(2)))
    refuse(f"cannot read an issue reference from {text!r}")


def refs_given(texts: Iterable[str], repo: str) -> list[Ref]:
    """The edge set a caller gave, each reference once."""
    refs: list[Ref] = []
    for text in texts:
        ref = parse_ref(text, repo)
        if ref not in refs:
            refs.append(ref)
    return refs


# ---------------------------------------------------------------- body text


def body_digest(body: str) -> str:
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def changed_body(body: str, *, old: str | None = None, new: str | None = None, append: str | None = None,
                 whole: str | None = None, expected_sha256: str | None = None) -> str:
    """The body after one exact text change. Text is matched byte for byte and
    never read as Markdown: what to change is the caller's decision."""
    if expected_sha256 is not None and body_digest(body) != expected_sha256.lower():
        refuse("the body changed since it was read: its SHA-256 is not --expected-sha256",
               body_sha256=body_digest(body))
    if whole is not None:
        return whole
    if append is not None:
        if not append:
            refuse("the text to append is empty")
        return body + append
    if not old or new is None:
        refuse("a replacement needs a non-empty old text and its new text")
    first = body.find(old)
    if first < 0:
        refuse("the old text is not in the body; it must match exactly, line endings included")
    if body.find(old, first + 1) >= 0:
        refuse("the old text appears more than once in the body; give text that appears exactly once")
    return body[:first] + new + body[first + len(old):]


# ---------------------------------------------------------------- gh access

ISSUE_LIST_FIELDS = "number,title,state,stateReason,assignees,labels,milestone,blockedBy,url"
ISSUE_VIEW_FIELDS = "number,title,body,state,stateReason,assignees,labels,milestone,blockedBy,comments,url"

NODE_FIELDS = """
  number title url state stateReason(enableDuplicate: true)
  repository { nameWithOwner }
  duplicateOf { number repository { nameWithOwner } }
  labels(first: 100) { nodes { name } }
  assignees(first: 100) { nodes { login } }
"""

BLOCKERS_QUERY = (
    "query($owner: String!, $name: String!, $n: Int!, $after: String) {"
    " repository(owner: $owner, name: $name) { issue(number: $n) {"
    " blockedBy(first: 100, after: $after) { totalCount"
    " pageInfo { hasNextPage endCursor } nodes {" + NODE_FIELDS + "} } } } }"
)

NODE_QUERY = (
    "query($owner: String!, $name: String!, $n: Int!) {"
    " repository(owner: $owner, name: $name) { issue(number: $n) {" + NODE_FIELDS + "} } }"
)

RUN_QUERY = (
    "query($owner: String!, $name: String!, $n: Int!) {"
    " repository(owner: $owner, name: $name) { issue(number: $n) {"
    " number state body lastEditedAt labels(first: 100) { nodes { name } } } } }"
)


def split_repo(repo: str) -> tuple[str, str]:
    owner, _, name = repo.partition("/")
    return owner, name


def issue_from_gh(raw: dict[str, Any], repo: str) -> Issue:
    """Normalize `gh issue list/view --json` output."""
    blocked = raw.get("blockedBy")
    nodes = None
    total = 0
    if blocked is not None:
        nodes = []
        for node in blocked.get("nodes") or []:
            node_repo = _repo_from_url(node.get("url", "")) or repo
            nodes.append({"ref": Ref(node_repo, node["number"]), "state": node["state"]})
        total = blocked.get("totalCount", len(nodes))
    return Issue(
        ref=Ref(repo, raw["number"]),
        title=raw.get("title", ""),
        state=raw["state"],
        state_reason=raw.get("stateReason") or "",
        labels=[label["name"] for label in raw.get("labels") or []],
        assignees=[person["login"] for person in raw.get("assignees") or []],
        milestone=_milestone(raw.get("milestone")),
        body=raw.get("body"),
        url=raw.get("url", ""),
        comments=[
            {"author": (c.get("author") or {}).get("login"), "createdAt": c.get("createdAt"), "body": c.get("body")}
            for c in raw["comments"]
        ]
        if "comments" in raw
        else None,
        blocked_by=nodes,
        blocked_by_total=total,
    )


def issue_from_node(node: dict[str, Any]) -> Issue:
    """Normalize a GraphQL issue node from NODE_FIELDS."""
    duplicate = node.get("duplicateOf")
    return Issue(
        ref=Ref(node["repository"]["nameWithOwner"], node["number"]),
        title=node.get("title", ""),
        state=node["state"],
        state_reason=node.get("stateReason") or "",
        labels=[label["name"] for label in node["labels"]["nodes"]],
        assignees=[person["login"] for person in node["assignees"]["nodes"]],
        url=node.get("url", ""),
        duplicate_of=Ref(duplicate["repository"]["nameWithOwner"], duplicate["number"]) if duplicate else None,
    )


def _milestone(raw: dict[str, Any] | None) -> dict[str, Any] | None:
    if not raw:
        return None
    return {"number": raw.get("number"), "title": raw.get("title")}


def _repo_from_url(url: str) -> str | None:
    match = re.match(r"https://[^/]+/([^/]+/[^/]+)/issues/\d+", url)
    return match.group(1) if match else None


class GitHub:
    """Every gh call the verbs make. Arguments are arrays and text goes on stdin,
    so no title, body, or name is ever part of shell, jq, or GraphQL source."""

    def __init__(self, repo: str) -> None:
        self.repo = repo
        self._login: str | None = None
        self.write_attempted = False

    # -- plumbing

    def gh(self, args: list[str], stdin: str | None = None) -> str:
        # gh reads and writes UTF-8 whatever the locale says.
        try:
            result = subprocess.run(
                ["gh", *args], input=stdin.encode("utf-8") if stdin is not None else None,
                capture_output=True, check=False
            )
        except OSError as error:
            read_failed(f"cannot run gh: {error}")
        if result.returncode != 0:
            detail = result.stderr.decode("utf-8").strip() or result.stdout.decode("utf-8").strip() or "no output"
            raise GhError(args, detail)
        return result.stdout.decode("utf-8")

    def gh_json(self, args: list[str], stdin: str | None = None) -> Any:
        out = self.gh(args, stdin)
        try:
            return json.loads(out)
        except json.JSONDecodeError as error:
            read_failed(f"gh {args[0]} returned invalid JSON: {error.msg}")

    def graphql(self, query: str, **variables: Any) -> dict[str, Any]:
        args = ["api", "graphql", "-f", f"query={query}"]
        for key, value in variables.items():
            if value is None:
                continue
            args += ["-F" if isinstance(value, int) else "-f", f"{key}={value}"]
        data = self.gh_json(args)
        if data.get("errors"):
            read_failed("GraphQL read failed", errors=data["errors"])
        return data["data"]

    # -- reads

    def login(self) -> str:
        if self._login is None:
            self._login = self.gh_json(["api", "user"])["login"]
        return self._login

    def issue_list(self, state: str) -> list[Issue]:
        """Every issue in `state`, read without filters. The limit grows until a
        page comes back short, so the result is never a full, truncated page."""
        limit = 500
        while True:
            rows = self.gh_json(
                ["issue", "list", "--repo", self.repo, "--state", state,
                 "--limit", str(limit), "--json", ISSUE_LIST_FIELDS]
            )
            if len(rows) < limit:
                return [issue_from_gh(row, self.repo) for row in rows]
            limit *= 4

    def issue(self, number: int) -> Issue:
        try:
            raw = self.gh_json(["issue", "view", str(number), "--repo", self.repo, "--json", ISSUE_VIEW_FIELDS])
        except GhError as error:
            if "Could not resolve to an issue" in error.detail or "not found" in error.detail.lower():
                refuse(f"{self.repo}#{number} does not exist", gh=error.detail)
            raise
        if re.search(r"/pull/\d+$", raw.get("url", "")):
            refuse(f"{self.repo}#{number} is a pull request, not a ticket")
        return issue_from_gh(raw, self.repo)

    def node(self, ref: Ref) -> Issue:
        owner, name = split_repo(ref.repo)
        try:
            data = self.graphql(NODE_QUERY, owner=owner, name=name, n=ref.number)
        except GhError as error:
            if "Could not resolve" in error.detail:
                refuse(f"{ref} does not exist", gh=error.detail)
            raise
        node = (data.get("repository") or {}).get("issue")
        if not node:
            refuse(f"{ref} does not exist")
        return issue_from_node(node)

    def blockers(self, ref: Ref) -> list[Issue]:
        """Every blocker of one issue, all pages, each with its repository."""
        owner, name = split_repo(ref.repo)
        found: list[Issue] = []
        after = None
        while True:
            data = self.graphql(BLOCKERS_QUERY, owner=owner, name=name, n=ref.number, after=after)
            issue = (data.get("repository") or {}).get("issue")
            if not issue:
                read_failed(f"{ref} could not be read")
            page = issue["blockedBy"]
            found += [issue_from_node(node) for node in page["nodes"]]
            if not page["pageInfo"]["hasNextPage"]:
                if len(found) != page["totalCount"]:
                    read_failed(f"{ref} reports {page['totalCount']} blockers, read {len(found)}")
                return found
            after = page["pageInfo"]["endCursor"]

    def milestones(self) -> list[dict[str, Any]]:
        pages = self.gh_json(
            ["api", "--paginate", "--slurp", f"repos/{self.repo}/milestones?state=all&per_page=100"]
        )
        return [
            {"number": m["number"], "title": m["title"], "state": m["state"], "url": m.get("html_url", "")}
            for page in pages
            for m in page
        ]

    def label_names(self) -> list[str]:
        pages = self.gh_json(["api", "--paginate", "--slurp", f"repos/{self.repo}/labels?per_page=100"])
        return [label["name"] for page in pages for label in page]

    def run_node(self, number: int) -> dict[str, Any] | None:
        owner, name = split_repo(self.repo)
        try:
            data = self.graphql(RUN_QUERY, owner=owner, name=name, n=number)
        except GhError as error:
            if "Could not resolve to an Issue" in error.detail:
                return None
            raise
        return (data.get("repository") or {}).get("issue")

    def issue_id(self, ref: Ref) -> int:
        return self.gh_json(["api", f"repos/{ref.repo}/issues/{ref.number}"])["id"]

    # -- writes

    def write(self, args: list[str], stdin: str | None = None, *, json_result: bool = False) -> Any:
        # Once a request starts, a later failure cannot promise nothing was written.
        self.write_attempted = True
        return self.gh_json(args, stdin) if json_result else self.gh(args, stdin)

    def create_issue(self, title: str, body: str, milestone: int | None, labels: list[str]) -> int:
        payload: dict[str, Any] = {"title": title, "body": body, "labels": labels}
        if milestone is not None:
            payload["milestone"] = milestone
        out = self.write(["api", "--method", "POST", f"repos/{self.repo}/issues", "--input", "-"], json.dumps(payload), json_result=True)
        return out["number"]

    def update_issue(self, number: int, fields: dict[str, Any]) -> None:
        self.write(["api", "--method", "PATCH", f"repos/{self.repo}/issues/{number}", "--input", "-"], json.dumps(fields))

    def edit_issue(self, number: int, add_labels: Iterable[str] = (), remove_labels: Iterable[str] = (),
                   add_assignees: Iterable[str] = (), remove_assignees: Iterable[str] = ()) -> None:
        args = ["issue", "edit", str(number), "--repo", self.repo]
        for flag, values in (("--add-label", add_labels), ("--remove-label", remove_labels),
                             ("--add-assignee", add_assignees), ("--remove-assignee", remove_assignees)):
            for value in values:
                args += [flag, value]
        if len(args) > 5:
            self.write(args)

    def close_issue(self, number: int, reason: str, duplicate_of: Ref | None = None) -> None:
        args = ["issue", "close", str(number), "--repo", self.repo, "--reason", reason]
        if duplicate_of is not None:
            args += ["--duplicate-of", _issue_url(duplicate_of) if duplicate_of.repo != self.repo else str(duplicate_of.number)]
        self.write(args)

    def comment(self, number: int, body: str) -> None:
        self.write(["issue", "comment", str(number), "--repo", self.repo, "--body-file", "-"], body)

    def add_blocked_by(self, number: int, blocker_id: int) -> None:
        self.write(["api", "--method", "POST", f"repos/{self.repo}/issues/{number}/dependencies/blocked_by",
                 "-F", f"issue_id={blocker_id}"])

    def remove_blocked_by(self, number: int, blocker_id: int) -> None:
        self.write(["api", "--method", "DELETE", f"repos/{self.repo}/issues/{number}/dependencies/blocked_by/{blocker_id}"])

    def create_milestone(self, title: str) -> None:
        self.write(["api", "--method", "POST", f"repos/{self.repo}/milestones", "--input", "-"], json.dumps({"title": title}))

    def close_milestone(self, number: int) -> None:
        self.write(["api", "--method", "PATCH", f"repos/{self.repo}/milestones/{number}", "--input", "-"],
                json.dumps({"state": "closed"}))

    def create_label(self, name: str, description: str) -> None:
        self.write(["api", "--method", "POST", f"repos/{self.repo}/labels", "--input", "-"],
                json.dumps({"name": name, "description": description}))


class GhError(TrackerError):
    def __init__(self, args: list[str], detail: str) -> None:
        super().__init__(EXIT_READ_FAILED, f"gh {' '.join(args[:2])} failed: {detail}")
        self.detail = detail


def _issue_url(ref: Ref) -> str:
    return f"https://github.com/{ref.repo}/issues/{ref.number}"


# ---------------------------------------------------------------- shared checks


def ticket(gh: GitHub, number: int) -> Issue:
    issue = gh.issue(number)
    if issue.is_run_config:
        refuse(f"#{number} is a run config ({RUN_LABEL}), not a ticket")
    if issue.blocked_by is None:
        no_dependencies()
    return issue


def ticket_node(gh: GitHub, ref: Ref) -> Issue:
    node = gh.node(ref)
    if node.is_run_config:
        refuse(f"{ref} is a run config ({RUN_LABEL}), not a ticket")
    return node


def no_dependencies() -> NoReturn:
    read_failed("blockedBy is null: this host does not expose issue dependencies; use the local backend")


def tickets(gh: GitHub, state: str) -> list[Issue]:
    issues = [issue for issue in gh.issue_list(state) if not issue.is_run_config]
    if any(issue.blocked_by is None for issue in issues):
        no_dependencies()
    return issues


def resolve_milestone(gh: GitHub, title: str, *, must_be_open: bool) -> dict[str, Any]:
    """Exactly one milestone with exactly this title, closed ones included."""
    every = gh.milestones()
    matches = [m for m in every if m["title"] == title]
    names = sorted(m["title"] for m in every)
    if not matches:
        refuse(f"no milestone is named exactly {title!r}", milestones=names)
    if len(matches) > 1:
        refuse(f"{len(matches)} milestones are named {title!r}", milestones=matches)
    if must_be_open and matches[0]["state"] != "open":
        refuse(f"milestone {title!r} is closed", milestones=names)
    return matches[0]


def blocker_verdict(gh: GitHub, blocker: Issue) -> dict[str, Any]:
    """Whether one blocker is met, with the reason when it is not."""
    out = {"ref": str(blocker.ref), "status": blocker.status, "assignees": blocker.assignees}
    chain = [blocker.ref]
    current = blocker
    while current.status == "duplicate":
        original = current.duplicate_of
        if original is None:
            return out | {"met": False, "reason": f"{current.ref} is a duplicate with no original", "chain": _s(chain)}
        if original in chain:
            return out | {"met": False, "reason": "the duplicate chain loops", "chain": _s(chain + [original])}
        chain.append(original)
        try:
            current = gh.node(original)
        except TrackerError as error:
            return out | {"met": False, "reason": f"{original} could not be read: {error}", "chain": _s(chain)}
    reasons = {
        "done": None,
        "cancel": "canceled: the work was dropped; the caller decides whether it is still needed",
        "closed, no reason": "closed with no close reason",
    }
    reason = reasons.get(current.status, f"open, {current.status}")
    verdict = out | {"met": reason is None}
    if reason:
        verdict["reason"] = reason
    if len(chain) > 1:
        verdict["chain"] = _s(chain)
        verdict["ends_at"] = {"ref": str(current.ref), "status": current.status, "assignees": current.assignees}
    return verdict


def _s(refs: list[Ref]) -> list[str]:
    return [str(ref) for ref in refs]


def find_cycle(gh: GitHub, blocked: Ref, blocker: Ref) -> list[str] | None:
    """Walk from `blocker` through its blockers; reaching `blocked` is a cycle.
    A done or canceled issue ends a branch; a duplicate continues at its original."""
    parent: dict[Ref, Ref | None] = {blocker: None}
    stack = [blocker]
    while stack:
        current = stack.pop()
        if current == blocked:
            path = [current]
            while parent[path[-1]] is not None:
                path.append(parent[path[-1]])
            return [str(blocked)] + _s(list(reversed(path)))
        for nxt in _walk_next(gh, current):
            if nxt not in parent:
                parent[nxt] = current
                stack.append(nxt)
    return None


def _walk_next(gh: GitHub, ref: Ref) -> list[Ref]:
    node = gh.node(ref)
    if node.status in ("done", "cancel"):
        return []
    if node.status == "duplicate":
        return [node.duplicate_of] if node.duplicate_of else []
    return [b.ref for b in gh.blockers(ref)]


def blocker_refs(gh: GitHub, ref: Ref) -> list[Ref]:
    return [b.ref for b in gh.blockers(ref)]


# ---------------------------------------------------------------- reads


def cmd_list(gh: GitHub, status: str | None, milestone: str | None) -> dict[str, Any]:
    terminal = status in CLOSED_REASONS.values()
    issues = tickets(gh, "closed" if terminal else "open")
    if milestone is not None:
        number = resolve_milestone(gh, milestone, must_be_open=False)["number"]
        issues = [i for i in issues if i.milestone and i.milestone["number"] == number]
    if status is None:
        chosen = [i for i in issues if i.status != "inconsistent"]
    else:
        chosen = [i for i in issues if i.status == status]
    result: dict[str, Any] = {"tickets": [_listed(gh, i) for i in sorted(chosen, key=lambda i: i.ref.number)]}
    if not terminal:
        result["inconsistent"] = sorted(i.ref.number for i in issues if i.status == "inconsistent")
    return result


def _listed(gh: GitHub, issue: Issue) -> dict[str, Any]:
    if issue.blockers_truncated:
        blockers = [{"ref": str(b.ref), "state": b.state} for b in gh.blockers(issue.ref)]
    else:
        blockers = [{"ref": str(b["ref"]), "state": b["state"]} for b in issue.blocked_by or []]
    return issue.summary() | {"blockers": blockers}


def cmd_show(gh: GitHub, number: int) -> dict[str, Any]:
    issue = ticket(gh, number)
    result = issue.summary() | {
        "url": issue.url,
        "labels": issue.labels,
        "body": issue.body,
        "body_sha256": body_digest(issue.body or ""),
        "comments": issue.comments,
        "blockers": [blocker_verdict(gh, b) for b in gh.blockers(issue.ref)],
    }
    if issue.status == "duplicate":
        node = gh.node(issue.ref)
        chain = blocker_verdict(gh, node)
        result["duplicate_of"] = {
            "original": str(node.duplicate_of) if node.duplicate_of else None,
            "chain": chain.get("chain", [str(issue.ref)]),
            "ends_at": chain.get("ends_at"),
            "ends_done": chain["met"],
        } | ({"reason": chain["reason"]} if "reason" in chain else {})
    elif issue.status == "inconsistent":
        result["status_labels"] = issue.status_labels
    return result


def cmd_next(gh: GitHub) -> dict[str, Any]:
    issues = tickets(gh, "open")
    by_number = {i.ref.number: i for i in issues}
    frontier, held = [], []
    for issue in sorted((i for i in issues if i.status == "ready"), key=lambda i: i.ref.number):
        local = [b for b in issue.blocked_by or [] if b["state"] == "OPEN" and Ref(gh.repo, b["ref"].number) == b["ref"]]
        if not issue.blockers_truncated and len(local) == len(issue.blocked_by or []):
            # Every blocker is open in this repository: unmet, and the list has its status.
            unmet = [_open_verdict(by_number[b["ref"].number]) for b in local if b["ref"].number in by_number]
            if len(unmet) != len(local):
                unmet = [v for v in (blocker_verdict(gh, b) for b in gh.blockers(issue.ref)) if not v["met"]]
        else:
            unmet = [v for v in (blocker_verdict(gh, b) for b in gh.blockers(issue.ref)) if not v["met"]]
        if issue.assignees or unmet:
            held.append(issue.summary() | {"reserved_for": issue.assignees, "unmet": unmet})
        else:
            frontier.append(issue.summary())
    counts: dict[str, int] = {}
    for issue in issues:
        counts[issue.status] = counts.get(issue.status, 0) + 1
    graph, cycles = _blocking_graph(gh, issues)
    return {
        "frontier": frontier,
        "held": held,
        "inconsistent": sorted(i.ref.number for i in issues if i.status == "inconsistent"),
        "open_counts": counts,
        "cycles": cycles,
        "blocker_graph": graph,
    }


def _open_verdict(blocker: Issue) -> dict[str, Any]:
    return {"ref": str(blocker.ref), "status": blocker.status, "assignees": blocker.assignees,
            "met": False, "reason": f"open, {blocker.status}"}


def _blocking_graph(gh: GitHub, issues: list[Issue]) -> tuple[list[dict[str, Any]], list[list[Any]]]:
    """Expand complete dependency paths, including duplicates and other repositories."""
    known = {i.ref: i for i in issues}
    graph: dict[Ref, list[Ref]] = {}
    unreadable: list[dict[str, Any]] = []
    pending = list(reversed(list(known)))
    while pending:
        ref = pending.pop()
        if ref in graph:
            continue
        node = known.get(ref)
        if node is None:
            try:
                node = gh.node(ref)
                if node.status in ("done", "cancel"):
                    children = []
                elif node.status == "duplicate":
                    children = [node.duplicate_of] if node.duplicate_of else []
                else:
                    children = blocker_refs(gh, ref)
            except TrackerError as error:
                graph[ref] = []
                unreadable.append({"ref": str(ref), "error": str(error)})
                continue
            known[ref] = node
        elif node.blockers_truncated:
            children = blocker_refs(gh, ref)
        else:
            children = [b["ref"] for b in node.blocked_by or []]
        graph[ref] = children
        pending.extend(reversed(children))

    # A depth-first walk visits each edge once, even in a dense acyclic graph.
    cycles: list[list[Any]] = []
    finished: set[Ref] = set()
    for start in graph:
        if start in finished:
            continue
        path = [start]
        active = {start: 0}
        stack = [iter(graph[start])]
        while stack:
            nxt = next(stack[-1], None)
            if nxt is None:
                finished.add(path[-1])
                active.pop(path.pop())
                stack.pop()
            elif nxt in active:
                cycle = path[active[nxt]:] + [nxt]
                cycles.append([r.number for r in cycle] if all(r.repo.lower() == gh.repo.lower() for r in cycle)
                              else _s(cycle))
            elif nxt not in finished:
                active[nxt] = len(path)
                path.append(nxt)
                stack.append(iter(graph[nxt]))
    return ([node.summary() | {"ref": str(ref), "blockers": _s(graph[ref])}
             for ref, node in known.items()] + unreadable, cycles)


# ---------------------------------------------------------------- ticket writes


def cmd_create(gh: GitHub, title: str, body: str, milestone: str | None,
               blocked_by: Iterable[str] = ()) -> dict[str, Any]:
    if not title.strip():
        refuse("a ticket needs a title")
    edges = refs_given(blocked_by, gh.repo)
    for edge in edges:
        ticket_node(gh, edge)
    target = resolve_milestone(gh, milestone, must_be_open=True) if milestone is not None else None
    try:
        number = gh.create_issue(title, body, target["number"] if target else None, [])
    except GhError as error:
        unverified("the create request failed; it may still have landed. List the tickets before trying again",
                   gh=error.detail)
    landed_edges: list[str] = []
    for edge in edges:
        try:
            _write_link(gh, number, edge)
        except TrackerError as error:
            unverified(f"#{number} was created, but the edge to {edge} did not land: {error}",
                       number=number, landed_edges=landed_edges, missing_edges=_s(edges[len(landed_edges):]))
        landed_edges.append(str(edge))
    try:
        after = gh.issue(number)
    except TrackerError as error:
        unverified(f"the create reported #{number}, but it does not read back: {error}", number=number)
    problems = []
    if after.title != title:
        problems.append("title")
    if after.body != body:
        problems.append("body")
    if after.status != "backlog" or after.status_labels:
        problems.append("status")
    if (after.milestone or {}).get("number") != (target["number"] if target else None):
        problems.append("milestone")
    if {b.ref for b in gh.blockers(after.ref)} != set(edges):
        problems.append("blockers")
    if problems:
        unverified(f"#{number} was created, but the re-read differs in: {', '.join(problems)}", number=number,
                   actual=after.summary())
    return after.summary() | {"url": after.url, "blockers": _s(edges)}


def cmd_edit(gh: GitHub, number: int, *, title: str | None = None, old: str | None = None,
             new: str | None = None, append: str | None = None, body: str | None = None,
             expected_sha256: str | None = None, blocked_by: list[str] | None = None,
             milestone: str | None = None, clear_milestone: bool = False) -> dict[str, Any]:
    """`blocked_by` None leaves the edges alone; a list, empty or not, is the new edge set."""
    before = ticket(gh, number)
    text = {"old": old, "new": new, "append": append, "whole": body, "expected_sha256": expected_sha256}
    changes_text = old is not None or append is not None or body is not None
    if title is None and not changes_text and blocked_by is None and milestone is None and not clear_milestone:
        refuse("edit was given nothing to change")
    if title is not None and not title.strip():
        refuse("a ticket needs a title")
    if changes_text:
        changed_body(before.body or "", **text)
    target = resolve_milestone(gh, milestone, must_be_open=True) if milestone is not None else None
    current_edges = blocker_refs(gh, before.ref)
    new_edges = refs_given(blocked_by, gh.repo) if blocked_by is not None else current_edges
    added = [e for e in new_edges if e not in current_edges]
    removed = [e for e in current_edges if e not in new_edges]
    for edge in added:
        _check_link(gh, before.ref, edge)
    fields: dict[str, Any] = {}
    if title is not None:
        fields["title"] = title
    new_body = None
    if changes_text:
        # GitHub has no conditional write: apply the change to a read taken right
        # before the write, so a change made during the checks above is kept or refused.
        new_body = changed_body(gh.issue(number).body or "", **text)
        fields["body"] = new_body
    if target is not None:
        fields["milestone"] = target["number"]
    elif clear_milestone:
        fields["milestone"] = None
    landed: list[str] = []
    if fields:
        try:
            gh.update_issue(number, fields)
        except GhError as error:
            unverified(f"the edit of #{number} failed; read the ticket before trying again", gh=error.detail)
        landed.append("fields")
    for edge in removed:
        try:
            _write_unlink(gh, number, edge)
        except TrackerError as error:
            unverified(f"removing {edge} from #{number} failed: {error}", landed=landed)
        landed.append(f"unlink {edge}")
    for edge in added:
        try:
            _write_link(gh, number, edge)
        except TrackerError as error:
            unverified(f"adding {edge} to #{number} failed: {error}", landed=landed)
        landed.append(f"link {edge}")
    after = gh.issue(number)
    problems = []
    if after.title != fields.get("title", before.title):
        problems.append("title")
    if after.body != (new_body if new_body is not None else before.body):
        problems.append("body")
    want_milestone = fields["milestone"] if "milestone" in fields else (before.milestone or {}).get("number")
    if (after.milestone or {}).get("number") != want_milestone:
        problems.append("milestone")
    if set(blocker_refs(gh, after.ref)) != set(new_edges):
        problems.append("blockers")
    if (after.state, after.state_reason) != (before.state, before.state_reason):
        problems.append("state")
    if sorted(after.labels) != sorted(before.labels):
        problems.append("labels")
    if sorted(after.assignees) != sorted(before.assignees):
        problems.append("assignees")
    if problems:
        unverified(f"the edit of #{number} did not verify: {', '.join(problems)}", landed=landed,
                   actual=after.summary())
    return after.summary() | {"changed": landed, "blockers": _s(new_edges),
                              "body_sha256": body_digest(after.body or "")}


def cmd_assign(gh: GitHub, number: int, who: str | None, holders: list[str]) -> dict[str, Any]:
    before = ticket(gh, number)
    if before.state != "OPEN":
        refuse(f"#{number} is {before.status}, a terminal status")
    me = gh.login()
    if who in (None, "me") and not holders:
        return _assign_bare(gh, before, me)
    target = me if who in (None, "me") else (None if who == "none" else who.lstrip("@"))
    named = {h.lstrip("@").lower() for h in holders}
    replaced = [a for a in before.assignees if target is None or a.lower() != target.lower()]
    unnamed = [a for a in replaced if a.lower() not in named and a.lower() != me.lower()]
    if unnamed:
        refuse(f"#{number} is held by {', '.join(unnamed)}; name them with --from", assignees=before.assignees)
    try:
        gh.edit_issue(number, add_assignees=[target] if target else [], remove_assignees=replaced)
    except GhError as error:
        unverified(f"the assignment of #{number} failed; read the ticket before trying again", gh=error.detail)
    after = gh.issue(number)
    if after.state != "OPEN":
        unverified(f"#{number} closed during the assignment", actual=after.summary())
    want = [target.lower()] if target else []
    if sorted(a.lower() for a in after.assignees) != want:
        unverified(f"#{number} is assigned to {after.assignees or 'nobody'}, expected {target or 'nobody'}"
                   " (gh drops a user without push access and still exits 0)", actual=after.summary())
    if sorted(after.labels) != sorted(before.labels):
        unverified(f"the labels of #{number} changed during the assignment", actual=after.summary())
    return after.summary()


def _assign_bare(gh: GitHub, before: Issue, me: str) -> dict[str, Any]:
    number = before.ref.number
    if before.status_labels != ["ready"] or before.assignees:
        refuse(f"#{number} is {before.status} held by {before.assignees or 'nobody'}; taking it needs `ready`"
               " with no assignee", actual=before.summary())
    try:
        gh.edit_issue(number, add_labels=["in-progress"], remove_labels=["ready"], add_assignees=["@me"])
    except GhError as error:
        unverified(f"taking #{number} failed; read the ticket before trying again", gh=error.detail)
    after = gh.issue(number)
    if after.state != "OPEN":
        unverified(f"#{number} closed while it was being taken", actual=after.summary())
    if after.status_labels != ["in-progress"]:
        gh.edit_issue(number, remove_labels=["in-progress"], remove_assignees=["@me"])
        unverified(f"#{number} changed status while it was being taken; the claim was taken back",
                   actual=gh.issue(number).summary())
    if me.lower() not in (a.lower() for a in after.assignees):
        gh.edit_issue(number, add_labels=["ready"], remove_labels=["in-progress"])
        unverified(f"the assignment to {me} did not land on #{number}; the status was put back to ready",
                   actual=gh.issue(number).summary())
    if len(after.assignees) > 1:
        keeper = sorted(after.assignees, key=str.lower)[0]
        if keeper.lower() != me.lower():
            gh.edit_issue(number, remove_assignees=["@me"])
            refuse(f"another session took #{number} at the same time; {keeper} keeps it",
                   actual=gh.issue(number).summary())
    return after.summary()


def cmd_move(gh: GitHub, number: int, status: str, original: str | None) -> dict[str, Any]:
    if status not in STATUSES:
        refuse(f"{status!r} is not a status", statuses=list(STATUSES))
    before = ticket(gh, number)
    if before.state != "OPEN":
        refuse(f"#{number} is {before.status}, a terminal status; reopening it is a person's decision")
    if status in OPEN_STATUSES:
        remove = [label for label in before.status_labels if label != status]
        clear = before.assignees if status in ("backlog", "ready") else []
        try:
            gh.edit_issue(number, add_labels=[status], remove_labels=remove, remove_assignees=clear)
        except GhError as error:
            unverified(f"the move of #{number} failed; read the ticket before trying again", gh=error.detail)
        after = gh.issue(number)
        want_assignees = [] if clear else before.assignees
        topics = sorted(label for label in before.labels if label not in OPEN_STATUSES)
        if (after.state != "OPEN" or after.status_labels != [status] or sorted(after.assignees) != sorted(want_assignees)
                or sorted(label for label in after.labels if label not in OPEN_STATUSES) != topics):
            unverified(f"#{number} did not move to {status}", actual=after.summary())
        return after.summary() | {"note": _holder_note(after, gh.login())}
    duplicate = None
    if status == "duplicate":
        if original is None:
            refuse("a move to duplicate needs --original")
        duplicate = parse_ref(original, gh.repo)
        if duplicate == before.ref:
            refuse("a ticket cannot duplicate itself")
        ticket_node(gh, duplicate)
    try:
        gh.close_issue(number, CLOSE_ARGS[status], duplicate)
    except GhError as error:
        unverified(f"closing #{number} failed; read the ticket before trying again", gh=error.detail)
    landed = ["closed"]
    if before.status_labels:
        try:
            gh.edit_issue(number, remove_labels=before.status_labels)
        except GhError as error:
            unverified(f"#{number} closed, but its status labels were not removed", landed=landed, gh=error.detail)
        landed.append("status labels removed")
    after = gh.issue(number)
    if after.status != status or after.status_labels:
        unverified(f"#{number} did not move to {status}", landed=landed, actual=after.summary())
    if duplicate is not None and gh.node(before.ref).duplicate_of != duplicate:
        unverified(f"#{number} closed as duplicate, but not of {duplicate}", landed=landed)
    return after.summary()


def _holder_note(issue: Issue, me: str) -> str | None:
    if not issue.assignees:
        return "nobody holds it"
    others = [a for a in issue.assignees if a.lower() != me.lower()]
    return f"held by {', '.join(others)}" if others else None


def cmd_comment(gh: GitHub, number: int, body: str) -> dict[str, Any]:
    if not body.strip():
        refuse("a comment needs a body")
    before = ticket(gh, number)
    matches_before = sum(c["body"] == body for c in before.comments or [])
    try:
        gh.comment(number, body)
    except GhError as error:
        landed = sum(c["body"] == body for c in gh.issue(number).comments or []) > matches_before
        unverified(f"gh reported a failure; the comment {'did' if landed else 'did not'} land. Do not retry blindly",
                   landed=landed, gh=error.detail)
    if sum(c["body"] == body for c in gh.issue(number).comments or []) <= matches_before:
        unverified(f"a new comment with the given body is not on #{number}")
    return {"number": number, "commented": True}


def _check_link(gh: GitHub, blocked: Ref, blocker: Ref) -> None:
    if blocked == blocker:
        refuse("a ticket cannot block itself")
    ticket_node(gh, blocker)
    cycle = find_cycle(gh, blocked, blocker)
    if cycle:
        refuse(f"the edge would close a cycle: {' → '.join(cycle)}", cycle=cycle)


def _write_link(gh: GitHub, number: int, blocker: Ref) -> None:
    blocked = Ref(gh.repo, number)
    blockers_before = blocker_refs(gh, blocker)
    gh.add_blocked_by(number, gh.issue_id(blocker))
    if blocker not in blocker_refs(gh, blocked):
        unverified(f"{blocker} is not among the blockers of #{number}")
    if set(blocker_refs(gh, blocker)) != set(blockers_before):
        unverified(f"the blockers of {blocker} changed")


def _write_unlink(gh: GitHub, number: int, blocker: Ref) -> None:
    blocked = Ref(gh.repo, number)
    others = [r for r in blocker_refs(gh, blocked) if r != blocker]
    gh.remove_blocked_by(number, gh.issue_id(blocker))
    remaining = blocker_refs(gh, blocked)
    if blocker in remaining or set(remaining) != set(others):
        unverified(f"unlinking {blocker} from #{number} did not verify", blockers=_s(remaining))


def cmd_link(gh: GitHub, number: int, blocker_text: str) -> dict[str, Any]:
    blocked = ticket(gh, number).ref
    blocker = parse_ref(blocker_text, gh.repo)
    _check_link(gh, blocked, blocker)
    if blocker in blocker_refs(gh, blocked):
        return {"number": number, "blocked_by": str(blocker), "note": "the edge already exists"}
    _write_link(gh, number, blocker)
    return {"number": number, "blocked_by": str(blocker), "blockers": _s(blocker_refs(gh, blocked))}


def cmd_unlink(gh: GitHub, number: int, blocker_text: str) -> dict[str, Any]:
    blocked = ticket(gh, number).ref
    blocker = parse_ref(blocker_text, gh.repo)
    if blocker not in blocker_refs(gh, blocked):
        refuse(f"#{number} is not blocked by {blocker}; the edge does not exist")
    ticket_node(gh, blocker)
    _write_unlink(gh, number, blocker)
    return {"number": number, "unlinked": str(blocker), "blockers": _s(blocker_refs(gh, blocked))}


# ---------------------------------------------------------------- milestones


def cmd_milestone_ensure(gh: GitHub, title: str) -> dict[str, Any]:
    if not title.strip():
        refuse("a milestone needs a name")
    matches = [m for m in gh.milestones() if m["title"] == title]
    if len(matches) > 1:
        refuse(f"{len(matches)} milestones are named {title!r}", milestones=matches)
    if matches:
        if matches[0]["state"] != "open":
            refuse(f"milestone {title!r} is closed; reopening it is a person's decision", milestone=matches[0])
        return {"milestone": matches[0], "created": False}
    try:
        gh.create_milestone(title)
    except GhError as error:
        unverified("creating the milestone failed; it may still have landed. List milestones first", gh=error.detail)
    matches = [m for m in gh.milestones() if m["title"] == title]
    if len(matches) != 1 or matches[0]["state"] != "open":
        unverified(f"milestone {title!r} does not read back as one open milestone", milestones=matches)
    return {"milestone": matches[0], "created": True}


def cmd_milestone_close(gh: GitHub, title: str) -> dict[str, Any]:
    target = resolve_milestone(gh, title, must_be_open=False)
    if target["state"] == "closed":
        return {"milestone": target, "closed": False, "note": "it was already closed"}
    try:
        gh.close_milestone(target["number"])
    except GhError as error:
        unverified("closing the milestone failed; read it before trying again", gh=error.detail)
    after = [m for m in gh.milestones() if m["number"] == target["number"]]
    if not after or after[0]["state"] != "closed" or after[0]["title"] != title:
        unverified(f"milestone {title!r} does not read back closed", milestone=after)
    return {"milestone": after[0], "closed": True}


def cmd_milestone_list(gh: GitHub) -> dict[str, Any]:
    return {"milestones": sorted(gh.milestones(), key=lambda m: m["number"])}


def cmd_milestone_show(gh: GitHub, title: str) -> dict[str, Any]:
    target = resolve_milestone(gh, title, must_be_open=False)
    issues = [i for i in tickets(gh, "all") if i.milestone and i.milestone["number"] == target["number"]]
    counts = {status: 0 for status in STATUSES} | {"inconsistent": 0, "closed, no reason": 0}
    for issue in issues:
        counts[issue.status] += 1
    unclean_or_open = sum(counts[s] for s in OPEN_STATUSES + ("inconsistent", "closed, no reason"))
    return {"milestone": target, "total": len(issues), "counts": counts, "open_or_unclean": unclean_or_open}


# ---------------------------------------------------------------- run configs


def cmd_run_create(gh: GitHub, run_branch: str, text: str) -> dict[str, Any]:
    if not run_branch.strip() or not text.strip():
        refuse("run create needs the run branch and the config text")
    if RUN_LABEL not in gh.label_names():
        gh.create_label(RUN_LABEL, "wkc-yolo run config")
    try:
        number = gh.create_issue(f"Run config: {run_branch}", text, None, [RUN_LABEL])
    except GhError as error:
        unverified("the run config create failed; it may still have landed", gh=error.detail)
    shown = cmd_run_show(gh, number)
    if shown["text"] != text:
        unverified(f"run config #{number} does not read back as the text given", reference=number)
    return {"reference": number, "url": f"https://github.com/{gh.repo}/issues/{number}"}


def cmd_run_show(gh: GitHub, number: int) -> dict[str, Any]:
    node = gh.run_node(number)
    if not node:
        refuse(f"#{number} does not exist")
    if RUN_LABEL not in [label["name"] for label in node["labels"]["nodes"]]:
        refuse(f"#{number} is not a run config: it lacks the {RUN_LABEL} label")
    if node["lastEditedAt"] is not None:
        refuse(f"run config #{number} was edited after it was written", lastEditedAt=node["lastEditedAt"])
    return {"reference": number, "state": node["state"], "text": node["body"]}


def cmd_run_close(gh: GitHub, number: int) -> dict[str, Any]:
    cmd_run_show(gh, number)
    try:
        gh.close_issue(number, "completed")
    except GhError as error:
        unverified(f"closing run config #{number} failed; read it before trying again", gh=error.detail)
    shown = cmd_run_show(gh, number)
    if shown["state"] != "CLOSED":
        unverified(f"run config #{number} does not read back closed")
    return {"reference": number, "closed": True}


# ---------------------------------------------------------------- CLI


def origin_repo() -> str:
    try:
        url = subprocess.run(["git", "remote", "get-url", "origin"], text=True, capture_output=True,
                             check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        refuse("no --repo given and no `origin` remote in the current directory")
    match = re.search(r"[:/]([^/:]+/[^/]+?)(?:\.git)?/?$", url)
    if not match:
        refuse(f"cannot read OWNER/REPO from origin {url!r}")
    return match.group(1)


def read_text(path: str) -> str:
    if path == "-":
        return sys.stdin.read()
    try:
        with open(path, encoding="utf-8", newline="") as handle:
            return handle.read()
    except OSError as error:
        refuse(f"cannot read {path}: {error.strerror}")


def number_arg(text: str) -> int:
    match = re.fullmatch(r"#?(\d+)", text.strip())
    if not match:
        raise argparse.ArgumentTypeError(f"{text!r} is not an issue number")
    return int(match.group(1))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="github.py", description="wkc-tracker GitHub backend")
    parser.add_argument("--repo", help="OWNER/REPO; defaults to the origin remote of the current directory")
    verbs = parser.add_subparsers(dest="verb", required=True)

    p = verbs.add_parser("list")
    p.add_argument("--status", choices=STATUSES)
    p.add_argument("--milestone")
    verbs.add_parser("show").add_argument("number", type=number_arg)
    verbs.add_parser("next")
    p = verbs.add_parser("create")
    p.add_argument("--title", required=True)
    p.add_argument("--body-file", required=True)
    p.add_argument("--milestone")
    p.add_argument("--blocked-by", action="append", default=[])
    p = verbs.add_parser("edit")
    p.add_argument("number", type=number_arg)
    p.add_argument("--title")
    group = p.add_mutually_exclusive_group()
    group.add_argument("--old-text-file")
    group.add_argument("--append-file")
    group.add_argument("--body-file")
    p.add_argument("--new-text-file")
    p.add_argument("--expected-sha256")
    group = p.add_mutually_exclusive_group()
    group.add_argument("--blocked-by", action="append")
    group.add_argument("--no-blockers", action="store_true")
    group = p.add_mutually_exclusive_group()
    group.add_argument("--milestone")
    group.add_argument("--no-milestone", action="store_true")
    p = verbs.add_parser("assign")
    p.add_argument("number", type=number_arg)
    p.add_argument("who", nargs="?")
    p.add_argument("--from", dest="holders", action="append", default=[])
    p = verbs.add_parser("move")
    p.add_argument("number", type=number_arg)
    p.add_argument("status")
    p.add_argument("--original")
    p = verbs.add_parser("comment")
    p.add_argument("number", type=number_arg)
    p.add_argument("--body-file", required=True)
    for name in ("link", "unlink"):
        p = verbs.add_parser(name)
        p.add_argument("number", type=number_arg)
        p.add_argument("blocker")

    milestone = verbs.add_parser("milestone").add_subparsers(dest="action", required=True)
    milestone.add_parser("ensure").add_argument("title")
    milestone.add_parser("close").add_argument("title")
    milestone.add_parser("list")
    milestone.add_parser("show").add_argument("title")

    run = verbs.add_parser("run").add_subparsers(dest="action", required=True)
    p = run.add_parser("create")
    p.add_argument("--run-branch", required=True)
    p.add_argument("--body-file", required=True)
    run.add_parser("show").add_argument("number", type=number_arg)
    run.add_parser("close").add_argument("number", type=number_arg)
    return parser


def dispatch(gh: GitHub, args: argparse.Namespace) -> dict[str, Any]:
    verb = args.verb
    if verb == "list":
        return cmd_list(gh, args.status, args.milestone)
    if verb == "show":
        return cmd_show(gh, args.number)
    if verb == "next":
        return cmd_next(gh)
    if verb == "create":
        return cmd_create(gh, args.title, read_text(args.body_file), args.milestone, args.blocked_by)
    if verb == "edit":
        def text(path: str | None) -> str | None:
            return read_text(path) if path is not None else None
        return cmd_edit(gh, args.number, title=args.title, old=text(args.old_text_file),
                        new=text(args.new_text_file), append=text(args.append_file), body=text(args.body_file),
                        expected_sha256=args.expected_sha256, blocked_by=[] if args.no_blockers else args.blocked_by,
                        milestone=args.milestone, clear_milestone=args.no_milestone)
    if verb == "assign":
        return cmd_assign(gh, args.number, args.who, args.holders)
    if verb == "move":
        return cmd_move(gh, args.number, args.status, args.original)
    if verb == "comment":
        return cmd_comment(gh, args.number, read_text(args.body_file))
    if verb == "link":
        return cmd_link(gh, args.number, args.blocker)
    if verb == "unlink":
        return cmd_unlink(gh, args.number, args.blocker)
    if verb == "milestone":
        if args.action == "list":
            return cmd_milestone_list(gh)
        handler = {"ensure": cmd_milestone_ensure, "close": cmd_milestone_close, "show": cmd_milestone_show}
        return handler[args.action](gh, args.title)
    if args.action == "create":
        return cmd_run_create(gh, args.run_branch, read_text(args.body_file))
    return {"show": cmd_run_show, "close": cmd_run_close}[args.action](gh, args.number)


def check_edit_args(parser: argparse.ArgumentParser, args: argparse.Namespace) -> None:
    if (args.old_text_file is None) != (args.new_text_file is None):
        parser.error("--old-text-file and --new-text-file go together")
    if args.body_file is not None and args.expected_sha256 is None:
        parser.error("--body-file replaces the whole body and needs --expected-sha256 from show")
    if args.expected_sha256 is not None and not (args.old_text_file or args.append_file or args.body_file):
        parser.error("--expected-sha256 checks a body change; give one")
    files = [args.old_text_file, args.new_text_file, args.append_file, args.body_file]
    if files.count("-") > 1:
        parser.error("only one text file can be standard input")


def main(argv: list[str] | None = None, gh: GitHub | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.verb == "edit":
        check_edit_args(parser, args)
    label = args.verb + (f" {args.action}" if getattr(args, "action", None) else "")
    try:
        gh = gh or GitHub(args.repo or origin_repo())
        gh.write_attempted = False
        result = {"ok": True, "verb": label, "repo": gh.repo} | dispatch(gh, args)
        code = 0
    except TrackerError as error:
        if gh is not None and gh.write_attempted and error.code != EXIT_UNVERIFIED:
            error = TrackerError(EXIT_UNVERIFIED,
                                 f"A write was attempted; read the remote state before retrying: {error}",
                                 **error.details)
        result = {"ok": False, "verb": label, "error": ERROR_NAMES[error.code], "message": str(error)}
        result |= error.details
        code = error.code
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False, default=str)
    sys.stdout.write("\n")
    return code


if __name__ == "__main__":
    # Text in and out is UTF-8, as gh's is, so a non-UTF-8 locale cannot change it.
    sys.stdin.reconfigure(encoding="utf-8", newline="")
    sys.stdout.reconfigure(encoding="utf-8", newline="")
    sys.exit(main())
