# ADR-015: Workers use the provider the person configured

Date: 2026-11-12. Status: accepted (maintainer, 2026-11-12).
Amends [ADR-009](./ADR-009-run-budgets-continuations-and-model-routing.md) ("Codex workers use
subscription login", "A Codex worker's effective provider and login must establish subscription
routing") and [ADR-012](./ADR-012-step-sessions-and-harness-adapters.md) (the `claude -p`
pre-launch check).

## Context

ADR-009 and ADR-012 let Claude and Codex workers run only on a subscription login.

- **Claude.** `claude auth status` had to report `authMethod: claude.ai` and
  `apiProvider: firstParty`. The check refused `apiKeyHelper`, `ANTHROPIC_BASE_URL`,
  `CLAUDE_CODE_USE_BEDROCK`, and `CLAUDE_CODE_USE_VERTEX`, and the launch removed
  `ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN`.
- **Codex.** `codex login status` had to report a ChatGPT login. Every configuration layer had to
  leave `model_provider` absent or `openai`, with no `env_key`, `base_url`, custom headers, or
  bearer token, and no `openai_base_url`, `chatgpt_base_url`, or `OPENAI_BASE_URL`. The launch
  removed `CODEX_API_KEY` and `OPENAI_API_KEY` and forced `model_provider="openai"` and
  `forced_login_method="chatgpt"`.

That refused every worker for a person whose access is a gateway, a cloud provider, a custom
endpoint, or an API key. The maintainer does not want to limit those providers.

## Options

1. A worker uses whatever provider and login are configured for its harness, and the coordinator
   never changes them.
2. Allow cloud providers and gateways, and still refuse a plain API key. This only protects against
   direct API billing, and it keeps most of the checks' cost.
3. Option 1 for Claude only. The maintainer first chose this, then asked for Codex too on the same
   day.

## Decision

Option 1, for Claude and Codex. Kiro CLI already accepted any Kiro login.

A worker, native or headless, uses the provider and login the person configured, as the
coordinator's environment and settings give it. A headless start runs in the coordinator's
environment, removes no variable, and forces no provider or login. Kickoff shows the provider each
headless worker will use, so its billing is the person's choice. The coordinator never changes a
provider or login and never falls back to another one.

- **Claude pre-launch check.** `claude auth status --json` reports `loggedIn: true`. Read only
  `loggedIn`, `authMethod`, `apiProvider`, and `apiKeySource`, because the output also holds
  account details.
- **Codex pre-launch check.** Some credential is configured: `codex login status` reports a login,
  `CODEX_API_KEY` or `OPENAI_API_KEY` is set, or the effective `model_provider` is a custom
  provider. Read the effective `model_provider` and whether an endpoint override is set, by name
  only.

A model's canonical id is the vendor's model ID. A Bedrock or Vertex ID names the same Claude model
with a provider prefix or version suffix. A Claude alias on `firstParty` with no
`ANTHROPIC_BASE_URL` follows its family's newest release. On another provider or a gateway, an
alias follows that provider's configuration, so its canonical id is known only from evidence. A
Codex ID through a custom provider is the OpenAI model it names with a provider prefix; any other
name, such as a deployment name, has no known canonical id. Routing refuses a pair only on a known
match and never launches a probe to resolve a name.

## Consequences

A run can bill an API account, a cloud provider, or a third-party endpoint. Kickoff names the
provider before the run starts, and listing a harness in `headless_workers` accepts its billing.

A pair may name the same model twice without any check catching it, when a Claude alias resolves
through another provider or a Codex ID is a deployment name. For Claude, `modelUsage` evidence then
shows the resolved ID, and routing uses that from then on. For Codex, `--json` events name no
model, so a deployment name stays unresolved. The person who chooses such a name owns that risk.

The login checks prove less. With `CLAUDE_CODE_USE_BEDROCK` or `CLAUDE_CODE_USE_VERTEX` set,
`claude auth status` reports `loggedIn: true` without checking any credential. An API-key variable
for Codex may be set and invalid. A missing or wrong credential shows as an authentication error at
launch, which stops every worker and all dispatch (routing.md section 6).

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

`codex-cli` 0.167.2, `codex login status` on 2026-11-12, with no model session:

| Environment | Output | Exit |
|---|---|---|
| ChatGPT login stored | `Logged in using ChatGPT` | 0 |
| Empty `CODEX_HOME` | `Not logged in` | 1 |
| Empty `CODEX_HOME`, `OPENAI_API_KEY` or `CODEX_API_KEY` set | `Not logged in` | 1 |
| ChatGPT login stored, `OPENAI_API_KEY` set | `Logged in using ChatGPT` | 0 |

`codex login status` does not report the API-key variables, so the Codex check reads them
separately. `codex exec --help` still lists `-C`, `-m`, `--json`, `-o`, and
`--dangerously-bypass-approvals-and-sandbox`.
