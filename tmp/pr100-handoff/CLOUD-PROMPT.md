# Starting S2 or M2 in a Claude cloud session

R2's prompt is on its own branch, test/pr100-r2-claude-cloud. S2 and M2 are separate sessions,
each on its own fixtures and branch, so they can run beside R2 and each other. All of them share
one Claude usage limit, so a quota error in one will likely stop the others too.

## Before each session

1. The Claude GitHub App (or your `/web-setup` token) must reach every repository below. If the
   App is installed on selected repositories only, add the new ones.
2. Attach the repositories:
   - S2: `wilsonkichoi/skills`, `wilsonkichoi/wkc-yolo-fixture-s2-cloud-20261104`, and
     `wilsonkichoi/wkc-yolo-fixture-s2-local-cloud-20261104`.
   - M2: `wilsonkichoi/skills` and `wilsonkichoi/wkc-yolo-fixture-m2-cloud-20261104`.
3. Trusted network access (the default), so `apt` or `go` can install `gitleaks`.
4. Enable the GitHub MCP connector. For S2's Linear arm of implement 64 only, also enable a Linear
   connector on the wkc sandbox team, if you have one.
5. `/model opus`, then `/effort high`.

S2 will pause and ask you to post a few comments from your second account, because those cases
need an account without write access. It gives the text, the target, and the command to run on
your machine.

## S2 prompt

```
Run batch S2 of the PR #100 step 5 validation, and only that batch. You are the validation driver, not a skill under test. In the wilsonkichoi/skills checkout, switch to branch test/pr100-s2-claude-cloud. Read tmp/pr100-handoff/HANDOFF.md whole, then tmp/pr100-handoff/S2.md and tmp/pr100-handoff/MCP-TRANSPORT.md; S2.md governs where they differ. Use GitHub only through the GitHub MCP tools, and git for clones, commits, and branch pushes; never github.py, gh, or your own REST or GraphQL calls. Read the wkc-* skills as workflow references. Run each test session as a fresh native subagent with model sonnet and effort medium, as S2.md says, and continue a case's later turns with SendMessage. Run S2.md's preflight first, and stop where it says stop. Prepare each case's fixture state yourself. Do not edit skills/, docs/, or validation/. Score from MCP reads and tool-call extracts, never from a session's report, against each case's PASS list in validation/. There is no session cap; log every AI session in the ledger. Stop all test sessions at the first real quota, rate-limit, or authentication error, and do not retry. For each FAIL or PARTIAL, record the observed behaviour, the rule it breaks, and the evidence path, and suggest no fix. Push after every test session. Before ending, re-read HANDOFF.md, update only the S2 row and S2 ledger lines, push both branches, and report results and sessions used.
```

## M2 prompt

```
Run batch M2 of the PR #100 step 5 validation, and only that batch. You are the validation driver, not a skill under test. In the wilsonkichoi/skills checkout, switch to branch test/pr100-m2-claude-cloud. Read tmp/pr100-handoff/HANDOFF.md whole, then tmp/pr100-handoff/M2.md and tmp/pr100-handoff/MCP-TRANSPORT.md; M2.md governs where they differ. Use GitHub only through the GitHub MCP tools, and git for clones, commits, and branch pushes; never github.py, gh, or your own REST or GraphQL calls. Read the wkc-* skills as workflow references. Run each test session as a fresh native subagent with model sonnet and effort medium, as M2.md says, and continue a case's later turns with SendMessage. Run M2.md's preflight first, and stop where it says stop. Prepare each case's fixture state yourself. Do not edit skills/, docs/, or validation/. Score from MCP reads and tool-call extracts, never from a session's report, against each case's PASS list in validation/. There is no session cap; log every AI session in the ledger. Stop all test sessions at the first real quota, rate-limit, or authentication error, and do not retry. For each FAIL or PARTIAL, record the observed behaviour, the rule it breaks, and the evidence path, and suggest no fix. Push after every test session. Before ending, re-read HANDOFF.md, update only the M2 row and M2 ledger lines, push both branches, and report results and sessions used.
```
