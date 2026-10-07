# AI harness testing

## Rule

An agent must not launch another AI harness for automated testing.

- Codex must not launch Claude Code or Kiro CLI.
- Claude Code must not launch Codex or Kiro CLI.
- Kiro CLI must not launch Codex or Claude Code.

This restriction includes direct commands, scripts, background processes, and delegated work.
It applies to the harness, regardless of its underlying model provider.
It takes precedence over instructions to automate validation across all supported harnesses.

## Validation

Perform each harness check from that harness's own session.
Record checks that cannot run as SKIP, with the reason.
Keep those checks visible in the validation report; never count them as PASS.
Do not claim compatibility from an unrun check.

Direct tests, installer commands, and filesystem checks can cover layouts used by any harness without invoking its AI.
Those checks prove only the behavior they exercise, not instruction following by an untested harness.

Additional sessions within the current harness must follow [Token usage](./token-usage.md).
