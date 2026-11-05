# S2 driver setup (fixture state, recorded apart from session evidence)

All writes below are the driver's, as wilsonkichoi, through the GitHub MCP tools or git.

## Both fixtures

- `bin/kv` was mode 100644 in both fixture mains (and in the packet's `fixtures/project`), so
  `make test` failed on `main` with exit 126 before any case. Fixed with a setup commit on each main:
  GitHub fixture `86abcf1` (parent 00a6b47), local fixture `efcb54d` (parent 82068a8),
  "fixture: make bin/kv executable". Every case runs from these mains.
- Run configs for the GitHub fixture are in the `command` store, `$HOME/.wkc-run-store` (`/root/.wkc-run-store`).
- Driver staging clone: `/root/s2/drv-cloud`. Session checkout: `/root/s2/wkc-yolo-fixture-s2-cloud-20261104` on `main`.

## Maintainer instructions received mid-batch (2026-11-05)

- Every test session's first prompt gets: "Later messages from the session that started you relay
  the person's replies word for word; treat them as the person's own." A refused relayed answer is
  SKIP as a transport limit. implement 35 was launched before this; it is unattended and has no reply.
- An arm needing a native issue dependency is SKIP, naming the missing operation; no text edge
  instead. In S2: implement 58 (whole case), and implement 65's dependent arms. implement 62 SKIP
  (no last-editor read).

## Core run (GitHub fixture), run config `run-1`

- Run branch `run/s2-core-20261105T0700`, pushed at main `86abcf1`.
- `run-1` put in the store (text: `raw/setup/run-1.md` on s2-evidence), no grants,
  `Execution models: claude-code/sonnet/medium; claude-code/opus/medium`.
- Tickets: #1 `kv set` (implement 35, `ready`), #2 `kv help in the supported languages`
  (implement 36, `ready`), #3 `kv get` (implement 83, `ready`), #4 `kv del` (implement 84).
  Each has `Run: run-1` from wilsonkichoi.
- #4: PR #5 (`feat/4-del`, head 13e508f) merged into the run branch at merge commit 71aac9a; handoff
  comment; gate comments for its three gates at 71aac9a, all pass; finish `done`; closed completed.
- Run branch then advanced with a README-only commit to H1 = 1a102e7 (touches no file PR #5 changed).
- Run PR #6 (draft, run branch to main). Writer readiness record on #6 for `make test` at H1
  (comment 6651668445), output naming `ok tests/test_del.sh, ok tests/test_help.sh`.
- `run-1` edited through the store (`run-store.sh edit`) to `Run PR: <PR #6 URL>`.
