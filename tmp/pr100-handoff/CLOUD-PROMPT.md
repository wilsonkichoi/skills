# Starting R2 in a Claude cloud session

## Before the session

1. The Claude GitHub App (or your `/web-setup` token) must reach the private fixture
   `wilsonkichoi/wkc-yolo-fixture-r2-cloud-20261104`. If the App is installed on selected
   repositories only, add this one.
2. Start a session at claude.ai/code with two repositories attached:
   `wilsonkichoi/skills` and `wilsonkichoi/wkc-yolo-fixture-r2-cloud-20261104`. The GitHub proxy
   serves git only for attached repositories, so the fixture clone fails without it.
3. Use an environment with Trusted network access (the default), so `apt` or `go` can install
   `gitleaks`.
4. Enable the GitHub MCP connector for the session.
5. Set the model and effort: `/model opus`, then `/effort high`.

## Prompt

```
Run batch R2 of the PR #100 step 5 validation for wkc-yolo, and only that batch. You are the validation driver, not a skill under test. In the wilsonkichoi/skills checkout, switch to branch test/pr100-r2-claude-cloud. Read tmp/pr100-handoff/HANDOFF.md whole, then tmp/pr100-handoff/R2.md and tmp/pr100-handoff/MCP-TRANSPORT.md; R2.md governs where they differ. Use GitHub only through the GitHub MCP tools, and git for clones, commits, and branch pushes; never github.py, gh, or your own REST or GraphQL calls. Read the wkc-* skills as workflow references. Run R2.md's preflight first, and stop where it says stop. Do not edit skills/, docs/, or validation/. Score from MCP reads and transcripts, never from a coordinator's report, against each case's PASS list in validation/wkc-yolo.md. At most 3 workers at once. There is no session cap; log every AI session in the ledger. Stop all test processes at the first real quota, rate-limit, or authentication error, and do not retry. For each FAIL or PARTIAL, record the observed behaviour, the rule it breaks, and the evidence path, and suggest no fix. Push after every coordinator turn. Before ending, re-read HANDOFF.md, update only the R2 row and R2 ledger lines, push both branches, and report results and sessions used.
```
