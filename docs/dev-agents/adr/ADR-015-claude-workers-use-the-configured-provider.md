# ADR-015: Claude workers use the Claude provider the person configured

Date: 2026-11-12. Status: accepted (maintainer, 2026-11-12).
Amends [ADR-009](./ADR-009-run-budgets-continuations-and-model-routing.md) ("Codex workers use
subscription login") and [ADR-012](./ADR-012-step-sessions-and-harness-adapters.md) (the
`claude -p` pre-launch check).

## Context

ADR-012 let `claude -p` join the default headless workers behind a check that the worker would run
on a claude.ai subscription. `claude auth status` had to report `authMethod: claude.ai` and
`apiProvider: firstParty`. The check refused `apiKeyHelper`, `ANTHROPIC_BASE_URL`,
`CLAUDE_CODE_USE_BEDROCK`, and `CLAUDE_CODE_USE_VERTEX`, and the launch removed
`ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN`.

That refused every Claude worker for a person whose Claude access is a gateway, Bedrock, Vertex, or
an API key. The maintainer does not want to limit those providers.

## Options

1. A Claude worker uses whatever Claude provider is configured, and the coordinator never changes
   it.
2. Allow Bedrock, Vertex, and gateways, and still refuse a plain API key and `apiKeyHelper`. This
   only protects against direct Anthropic API billing, and it keeps most of the check's cost.
3. Option 1 for Codex too. Not requested: Codex keeps its ChatGPT-login rule.

## Decision

Option 1. A Claude worker, native or `claude -p`, uses the Claude provider the person configured,
as the coordinator's environment and settings give it. The headless start runs in the coordinator's
environment and removes no variable. The pre-launch check requires `loggedIn: true` and reads only
`loggedIn`, `authMethod`, `apiProvider`, and `apiKeySource`, because the output also holds account
details. Kickoff shows the provider each headless worker will use, so its billing is the person's
choice. The coordinator never changes a provider or login and never falls back to another one.

A model's canonical id is its Anthropic model ID. A Bedrock or Vertex ID names the same model with
a provider prefix or version suffix. An alias on `firstParty` with no `ANTHROPIC_BASE_URL` follows
its family's newest release. On another provider or a gateway, an alias follows that provider's
configuration, so its canonical id is known only from evidence. Routing already refuses a pair only
on a known match and never launches a probe to resolve an alias.

## Consequences

A run can bill an API account or a cloud provider. Kickoff names the provider before the run
starts, and listing `claude-code` in `headless_workers` accepts that billing.

A pair whose Claude entry is an alias on Bedrock, Vertex, or a gateway may name the same model as
the other entry without either check catching it before the first worker runs. Its `modelUsage`
evidence then shows the resolved ID, and routing uses that resolution from then on.

`loggedIn: true` proves less on a cloud provider. With `CLAUDE_CODE_USE_BEDROCK` or
`CLAUDE_CODE_USE_VERTEX` set, `claude auth status` reports it without checking any credential. A
missing or wrong credential shows as an authentication error at launch, which stops every worker
and all dispatch (routing.md section 6).

## Evidence

`claude` 2.1.322, `claude auth status --json` on 2026-11-12, with no model session:

| Environment | `loggedIn` | `authMethod` | `apiProvider` | `apiKeySource` |
|---|---|---|---|---|
| claude.ai login | `true` | `claude.ai` | `firstParty` | absent |
| `CLAUDE_CODE_USE_BEDROCK=1` | `true` | `third_party` | `bedrock` | absent |
| `CLAUDE_CODE_USE_VERTEX=1` | `true` | `third_party` | `vertex` | absent |
| `ANTHROPIC_API_KEY` set, claude.ai login stored | `true` | `claude.ai` | `firstParty` | `ANTHROPIC_API_KEY` |
| `ANTHROPIC_BASE_URL` and `ANTHROPIC_AUTH_TOKEN` set | `true` | `oauth_token` | `firstParty` | absent |
| Empty `HOME`, no login | `false` | `none` | `firstParty` | absent |

With an API key set, `authMethod` still reads `claude.ai`. Only `apiKeySource` shows that the key
takes over.
