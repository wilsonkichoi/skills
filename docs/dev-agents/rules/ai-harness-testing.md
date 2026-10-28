# AI harness testing

## Rule

An agent must not launch another AI harness for automated testing, except for the explicitly
authorized mixed-model pilot below.

- Codex must not launch Claude Code or Kiro CLI.
- Claude Code must not launch Codex or Kiro CLI.
- Kiro CLI must not launch Codex or Claude Code.

This restriction includes direct commands, scripts, background processes, and delegated work.
It applies to the harness, regardless of its underlying model provider.
It takes precedence over instructions to automate validation across all supported harnesses.

## Approved mixed-model workflow

Once the model-routing contract in the approved SPEC ships, a person may authorize the main
Claude Code coordinator to dispatch Codex through `codex exec` for the selected implementation or
review step. Claude work uses native Claude agents. A project that lists `claude-code` in
`headless_workers` may also use `claude -p` workers or a Codex coordinator, and a run without a
model pair may start its own harness's headless CLI for fresh sessions. This exception applies to
the configured wkc workflow only, in manual calls and YOLO runs. It does not authorize arbitrary
cross-harness runs, `claude -p` without that opt-in, API billing fallback, or a worker starting
another worker or harness.

A pilot may exercise a candidate implementation before shipment. It requires explicit approval
of the fixture, session count, and any concurrent execution before the first launch. A development request or this planning document
is not that approval. Count every worker kind together against the standing limits.
Unrelated harness validation remains in each harness's own session. Quota, rate-limit, or
authentication errors stop all work without retry.

## Validation

Perform each harness check from that harness's own session.
Record checks that cannot run as SKIP, with the reason.
Keep those checks visible in the validation report; never count them as PASS.
Do not claim compatibility from an unrun check.

Direct tests, installer commands, and filesystem checks can cover layouts used by any harness without invoking its AI.
Those checks prove only the behavior they exercise, not instruction following by an untested harness.

Additional sessions within the current harness must follow [Token usage](./token-usage.md).
