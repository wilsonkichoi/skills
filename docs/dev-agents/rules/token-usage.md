# Token usage

## Default

Use the current session for the requested work.
Additional AI test sessions in the current harness run within each attempt's allowance below, without asking.
Do not treat a validation requirement as authorization for an unrestricted matrix of AI sessions.

These controls reduce avoidable usage; they do not make model work consume zero tokens.

## Bound additional sessions

AI test sessions in the current harness may run without asking, within `max_ai_test_sessions_per_attempt`
from the [project config](../config.md), which is 6.
An attempt is one build by `wkc-implement` or one review round by `wkc-code-review`, the final review-only round included.
Each attempt has its own allowance. With five fixing rounds and a final review, a full loop allows at most 42.
The allowance is a ceiling, never a target. Select only the checks the change needs, use direct checks first,
and start no AI test session when direct checks suffice.
Count pilots, retries, failed starts, and test subagents against the current attempt; do not bypass it through delegation.
The session doing the build or the review is not an AI test session.
Record each session on the ticket before it starts, as the skills say, so a resumed or restarted attempt keeps its count.
Unused allowance does not carry into the next attempt.
Choose each session's model and reasoning effort to fit the cases it runs, and record them in the report.
Ask before exceeding the allowance or launching another harness for testing. The approved mixed-model
workflow and its integration pilot follow the narrow exception in [AI harness testing](./ai-harness-testing.md).
Native agents and headless workers (`codex exec`, `claude -p`, `kiro-cli chat --no-interactive`)
share the same session count; a new process is not free.
The limit counts sessions, not tokens. Also set a per-session cost cap where the harness has one.

Run one pilot before a batch.
Inspect its usage from existing local logs when usage data is available.
Do not invoke another model to calculate usage.
If usage is unavailable, report that limitation before expanding the run.
Run AI test sessions one at a time.

## Use direct checks first

Use direct commands for installer behavior, file comparisons, hashes, schemas, and other mechanical checks.
Reserve AI test sessions for instruction interpretation and behavior that direct checks cannot establish.
Select cases from changed behavior and known regressions instead of repeating every scenario on every harness.
State selected cases or subchecks, backends, and harnesses before testing.
Follow [Validation](../../../AGENTS.md#validation) for baseline and focused coverage.
Reuse recorded evidence only when the relevant instructions, fixture, and harness configuration remain unchanged.
Identify reused evidence; do not describe it as a new run.
Keep required coverage within the selected scope visible and record unavailable checks as SKIP.
Cases outside the selected scope are not new SKIPs; focused success does not certify the whole skill.

## Limit context and output

Search for relevant files and read the sections needed for the current decision.
Avoid repeated full-file reads when the required content is already available and unchanged.
Select needed JSON fields and bound search output before returning results to the model.
Save full logs on disk and return concise findings with paths to the evidence.
Keep tracked reports concise and cite reused results; do not duplicate setup instructions, full logs, or prior result tables.
Do not paste complete logs, archives, or release responses into prompts when selected evidence is sufficient.
Keep prompts focused on the test contract, inputs, and expected result.
Do not start a new AI session for a check that a direct command can perform.

## Stop failed runs

Check authentication, fixture paths, permissions, and required tools without model calls before starting AI tests.
Stop the test runner at the first quota, authentication, or setup failure.
Do not continue queued AI sessions after that failure.
Do not retry automatically. Fix the known cause first, and keep retries within the attempt's allowance.
Record the failure and any unavailable checks instead of silently restarting the matrix.
