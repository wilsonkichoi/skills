# Run config: review-r2
Started: 2026-11-05T05:58:46Z. By: wilsonkichoi.
- Milestone: review-r2
- Scope: milestone
- Initial tickets: #13
- Run branch: run/review-r2-20261105T0558
- Run PR: https://github.com/wilsonkichoi/wkc-yolo-fixture-r2-cloud-20261104/pull/14
- Supersedes: none
- max_fix_attempts: 3
- max_additional_tickets: 5
- max_parallel_workers: 3
- Execution models: claude-code/sonnet/medium; claude-code/opus/medium
- Coordinator model: not used
- Headless workers: claude-code
- Planning: delegated
- New prerequisites: run
- Grants: 
- Grant 1: r23. Target: disposable shared test marker. Impact: writes only /tmp/wkc-yolo-env/r23.deployed and r23.cleaned. Operations: sh scripts/env.sh deploy r23; sh scripts/env.sh smoke r23. Limits: 1 deploy, local only, no cost, no retries. Cleanup: sh scripts/env.sh cleanup r23. Expires: 2026-11-12T23:59:00Z.
- Moved by the person: none
- Changes: none
