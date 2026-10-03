# Token usage

## Default

Use the current session for the requested work.
Do not launch additional AI harness sessions for testing without explicit user authorization.
Do not treat a validation requirement as authorization for an unrestricted matrix of AI sessions.

These controls reduce avoidable usage; they do not make model work consume zero tokens.

## Bound additional sessions

Before an authorized run, agree on the harness, test cases, maximum session count, and available token or cost limits.
State when the harness cannot enforce a token limit.
Use a session limit in that case, without describing it as a token cap.
Count pilot runs, retries, and failed starts against the session limit.
Include any authorized test subagents in the budget; do not bypass limits through delegation.
Do not exceed the agreed limits without further authorization.
Do not change models or reasoning settings without explicit user authorization.

Run one pilot before starting multiple cases.
Inspect its usage from existing local logs when usage data is available.
Do not invoke another model to calculate usage.
If usage is unavailable, report that limitation before expanding the run.
Run AI test sessions one at a time.

## Use direct checks first

Use direct commands for installer behavior, file comparisons, hashes, schemas, and other mechanical checks.
Reserve AI test sessions for instruction interpretation and behavior that direct checks cannot establish.
Select cases from changed behavior and known regressions instead of repeating every scenario on every harness.
Reuse recorded evidence only when the relevant instructions, fixture, and harness configuration remain unchanged.
Identify reused evidence; do not describe it as a new run.
Keep required coverage visible and record unrun checks as SKIP.

## Limit context and output

Search for relevant files and read the sections needed for the current decision.
Avoid repeated full-file reads when the required content is already available and unchanged.
Select needed JSON fields and bound search output before returning results to the model.
Save full logs on disk and return concise findings with paths to the evidence.
Do not paste complete logs, archives, or release responses into prompts when selected evidence is sufficient.
Keep prompts focused on the test contract, inputs, and expected result.
Do not start a new AI session for a check that a direct command can perform.

## Stop failed runs

Check authentication, fixture paths, permissions, and required tools without model calls before starting AI tests.
Stop the test runner at the first quota, authentication, or setup failure.
Do not continue queued AI sessions after that failure.
Fix the known cause before retrying, and keep retries within the agreed limits.
Record the failure and any unavailable checks instead of silently restarting the matrix.
