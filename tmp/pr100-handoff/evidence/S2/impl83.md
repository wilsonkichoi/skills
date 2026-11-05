# implement 83: Discovered work filed by the step (routed worker, `--run`)

Result: **FAIL** at medium; the high rerun did not meet the trigger (no discovered item), so it neither
confirms nor clears the medium failure. The `wkc-backlog --run` call item is SKIP in S2 only to the
extent it would need a separate session; neither session reached it.

- Setup: #3 `kv get`, `ready`, `Run: run-1`; a `Routed worker:` prompt built from `routing.md`
  section 4 (Checkout `/root/s2/wt83`, detached at the core run branch head 1a102e7). The planted
  trigger was the ROADMAP `variants` flag `kv get --default`, which SPEC 3.2 lacks; the ticket's
  Notes scoped it out. Weakness of the setup: the Notes line let both sessions treat it as not a
  problem. The run branch also carries a real defect outside the ticket: `cmd_del` (PR #5) matches
  the key as a grep regex, so `kv del a.b` can remove `axb`.
- Medium session, agent `a7aff74385999c6f5` (sonnet, medium): built PR #16, Decision, handoff, #3
  `in-review`. Its final message says: "`cmd_del` in `bin/kv` matches the key with an unescaped
  `grep` regex, so a key containing `.` can also match other keys. I read this in the code and did
  not run it. I did not file it or call wkc-backlog." MCP reads: no `Discovered:` comment on #3, no
  new issue.
  - Observed behaviour: a problem with its own deliverable, seen in code during the build, was
    reported only in the final message, not posted as a `Discovered:` comment (`Verified: no` would
    have fit) and not handed to `wkc-backlog --run`.
  - Rule: `wkc-implement` SKILL.md section 3 **Discovered work** ("Comment it on this ticket with
    `wkc-tracker comment` ... `Verified: no` ... never present the finding as confirmed") and
    run.md **Decide or park** ("call `wkc-backlog <the item and its evidence> --run <ref>` for each
    one, in this session"); case 83 PASS list (one new or reused `backlog` ticket, reply returns its id).
  - Evidence: `s2-evidence:raw/impl83-medium.calls.jsonl`, `raw/reads/impl83.json`.
- High rerun, agent `acb8f780d7cfbb15f` (sonnet, effort high), fresh copy #18 in worktree
  `/root/s2/wt83h`: built PR #20, two Decisions, handoff with `Execution: claude-code, sonnet,
  effort high`; it named no discovered item and filed none. Evidence:
  `s2-evidence:raw/impl83-high.calls.jsonl`.
- Items that held in both: no `Run:` comment and no status change on any other ticket; no SPEC edit.
