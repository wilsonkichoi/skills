# Harness adapters

[routing.md](./routing.md) reads this file whole with it. Each section is one harness a pair entry,
a worker, or a coordinator may use: how to start a fresh worker, how to pass the model and effort,
which model names it takes, its canonical model id, its checks, how its quota errors show, what
evidence shows the model, and how to resume a worker by id. A harness with no section here is
refused, never replaced. OpenCode has none yet.

Two selections are one model when their canonical ids match, whatever their harnesses. Every
check reads only the names of keys and variables, and never prints a value: use `grep -o` or a
parser that prints names, never `cat`. Never use `claude -p --continue`, `codex review`, `codex exec
review`, `resume --last`, or a fork.

## Contents

- claude-code
- codex
- kiro-cli

## claude-code

**Native start**, only from a Claude Code coordinator: an agent, not a fork, type
`general-purpose`, with `model` the alias and `effort` the resolved effort. Never an unset model,
which can run another model than the session's. A pinned ID always takes the headless start.

**Headless start**, from the checkout, with the prompt on standard input. `--disallowed-tools` takes
several values, so a prompt written after it would be read as a tool name:

```
claude -p --model <model> --effort <effort> --dangerously-skip-permissions --settings '{"sandbox":{"enabled":false}}' --disallowed-tools Agent --output-format json < <prompt file>
```

**Provider:** a Claude worker uses the Claude provider the person configured, as the coordinator's
environment and settings give it: a claude.ai login, an API key or `apiKeyHelper`, a gateway
through `ANTHROPIC_BASE_URL`, Bedrock, or Vertex. Never change it, and never fall back to another.

**Model names:** `opus`, `sonnet`, `haiku`, or a pinned ID: an Anthropic ID such as
`claude-opus-5-5`, or the provider's own model ID on Bedrock, Vertex, or a gateway. **Canonical
id:** the Anthropic model ID, such as `claude-opus-5-5`; a Bedrock or Vertex ID names the same model
with a provider prefix or version suffix. It is the resolved ID when evidence shows it. Otherwise,
with `apiProvider: firstParty` and no `ANTHROPIC_BASE_URL`, an alias is its family at its newest
release. On any other provider or gateway, an alias follows that provider's configuration, so its
canonical id is known only from evidence.

**Coordinator checks**, once before a Claude Code coordinator's first worker: read
`sandbox.enabled` and `permissions.disableBypassPermissionsMode` from every Claude Code settings
file you can see: `~/.claude/settings.json`, the project's `.claude/settings.json` and
`.claude/settings.local.json`, and the managed settings file (`/Library/Application
Support/ClaudeCode/managed-settings.json` on macOS, `/etc/claude-code/managed-settings.json` on
Linux). A sandbox that is on, or bypass mode disabled, makes Claude workers unsupported: report the
file and setting. An outer Claude sandbox would also constrain any process it starts. The person
launches the coordinator with `claude --dangerously-skip-permissions`, or
`permissions.defaultMode: "bypassPermissions"` in `~/.claude/settings.json`.

**Pre-launch checks**, before every launch or resume:

- `claude auth status --json` reports `loggedIn: true`. Read only `loggedIn`, `authMethod`,
  `apiProvider`, and `apiKeySource`, because the output also holds account details. The last three
  name the provider and billing the worker will use; `apiKeySource` appears only when an API key
  takes over from a claude.ai login.
- `CLAUDE_CODE_EFFORT_LEVEL`, when set, equals the resolved effort; it would override the worker's.
  Record `CLAUDE_CODE_SUBAGENT_MODEL` when set: it picks the model only of a native agent with no
  `model`, which routing never starts.

**Quota:** an error result naming a usage or rate limit, with its reset time when given.
**Evidence:** a native agent's result; `modelUsage` in the headless JSON output. **Resume:** the
native agent by its id; `claude -p --resume <id>` with the headless flags.

## codex

**Native start**, only from a Codex coordinator: `spawn_agent` with `fork_turns: "none"`, `model`,
and `reasoning_effort` set explicitly. The person launches a Codex coordinator with `codex
--dangerously-bypass-approvals-and-sandbox`.

**Headless start**, with the prompt on standard input:

```
env -u CODEX_API_KEY -u OPENAI_API_KEY codex exec -C <checkout> -m <model> -c model_reasoning_effort=<effort> -c model_provider="openai" -c forced_login_method="chatgpt" --dangerously-bypass-approvals-and-sandbox --json -o <last message file> - < <prompt file>
```

**Model names:** the exact ID `codex exec -m` takes. **Canonical id:** that ID.

**Pre-launch checks**, before every launch or resume, in the worker's checkout:

- `codex login status` reports a ChatGPT login.
- Every effective configuration layer: system and cloud-managed defaults when present
  (`/etc/codex/config.toml` on Unix), `~/.codex/config.toml` or `$CODEX_HOME/config.toml`, the
  selected profile, and trusted project layers from the project root to the worker's directory.
  `model_provider` is absent or `openai`, and no provider for it sets `env_key`, `base_url`,
  `http_headers`, `env_http_headers`, or bearer-token authentication. Reject unverified endpoint
  overrides, including top-level `openai_base_url` and `chatgpt_base_url`; forcing
  `model_provider` does not clear them. `OPENAI_BASE_URL` is unset. When effective routing cannot
  be verified, block the launch.

**Quota:** a failed turn or error event naming a usage or rate limit. **Evidence:** the `--json`
events; `codex-cli` 0.166.0 names no model there, so `Observed execution` is `unavailable`.
**Resume:** `-C` goes before `resume`, which does not accept it:

```
env -u CODEX_API_KEY -u OPENAI_API_KEY codex exec -C <checkout> resume <session id> -m <model> -c model_reasoning_effort=<effort> -c model_provider="openai" -c forced_login_method="chatgpt" --dangerously-bypass-approvals-and-sandbox --json -o <last message file> - < <prompt file>
```

## kiro-cli

**Native start:** none yet, until a Kiro subagent's model and effort can be set explicitly.

**Headless start**, from the checkout, with the prompt as the argument:

```
kiro-cli chat --no-interactive --model <model> --effort <effort> --trust-all-tools --output-format stream-json "$(cat <prompt file>)"
```

The person launches a Kiro coordinator with `kiro-cli chat --trust-all-tools`.

**Model names:** an ID that `kiro-cli chat --list-models` lists for the account. **Canonical id:**
the vendor model its list entry names, such as Claude Sonnet 4.5 for `claude-sonnet-4.5`.

**Pre-launch checks**, before every launch or resume: `kiro-cli whoami` reports a login. Never start
a login: `--list-models` opens a browser sign-in when the machine is signed out, so run it only
after `whoami` passes.

**Quota:** an error naming exhausted credits or a rate limit. **Evidence:** the `stream-json`
events, when they name the model; otherwise `unavailable`. **Resume:** `kiro-cli chat --resume-id
<id>` with the headless flags.

Kiro CLI as a pair entry or a coordinator is unvalidated. Validate it from Kiro's own session before
claiming support.
