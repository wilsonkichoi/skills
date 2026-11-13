# ADR-012: Each step runs in its own session, through harness adapters

Date: 2026-11-03. Status: accepted (maintainer, PR #100 review notes 10 to 15).
Amends [ADR-009](./ADR-009-run-budgets-continuations-and-model-routing.md): the coordinator, the
harness list, manual routing, the unknown-reviewer park, and the quota stop.
Amended by [ADR-015](./ADR-015-workers-use-the-configured-provider.md): the `claude -p`
pre-launch check no longer requires a claude.ai login, and the Codex adapter no longer requires a
ChatGPT login.

## Context

The PR #100 review found six problems in the model-routing design that ADR-009 set out.

- **The coordinator did the skills' work.** `wkc-implement` and `wkc-code-review` ran inside the
  run's coordinator: their reads, mode choice, claim, and branch. Only the build, update, and
  review workers were fresh, and `finish` and `verify` never dispatched. The coordinator also
  received every handoff and verdict and reread tickets and PRs each cycle, so a 10-ticket run
  would likely compact mid-ticket (note 10).
- **The coordinator was tied to harness names.** With a pair, it had to be Claude Code, or Codex
  when `headless_workers` listed `claude-code`, which was off by default. Kiro CLI could not
  coordinate a pair, and pair entries were limited to `claude-code` and `codex` (notes 11, 12).
  That rested on the recorded claim that `claude -p` was unreliable on the maintainer's
  subscription. The claim came from a mistaken belief that a third-party harness could not launch
  `claude -p` locally on a subscription (PRD Changes, 2026-11-03).
- **Manual calls turned into coordinators.** A configured pair made a manual call start a worker,
  possibly on another harness. The person had already chosen the harness and model by opening the
  session (note 15).
- **An unknown preceding model parked a run ticket**, though an unattended run should decide
  (note 13).
- **One harness's quota stopped the whole run**, including workers mid-step on other tickets
  (note 14).

## Options

For where a skill call runs:

1. **Step sessions.** The coordinator picks the step's model, then starts one fresh session on it
   that runs the whole skill call and returns a short result. Nothing nests.
2. **A delegated skill session that starts its own worker.** The skill session runs the reads and
   the claim, then starts the build or review worker. This nests workers, which the PRD prohibits.
   Enforcement also differs: `claude -p` takes `--disallowed-tools Agent`, and a native Claude agent
   is blocked from nesting only when `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` is `1`.
3. **Keep the split.** The coordinator keeps the skill logic and its context cost.

For harnesses: an adapter contract per harness in the SPEC, a hard-coded harness list, or a
generic runner. A runner adds a runtime the PRD rules out.

## Decision

Option 1, with an adapter contract.

- **Step sessions.** Under `--run`, every `wkc-implement` call (build, follow-up, pre-merge update,
  `finish`, `verify`), every `wkc-code-review` round, and every planning `wkc-backlog` call runs
  in its own fresh session. The coordinator resolves the selection and runs the pre-launch checks
  first, so a step that cannot start leaves the ticket unclaimed. The session runs the skill's
  steps itself, once, and returns a short result: the state, the PR and head sha, the verdict or
  finish result, the discovered tickets, and any open request. The coordinator checks that claim
  against the records before it advances.
- **The review turn.** A build, follow-up, or pre-merge update uses the pair's first entry. A
  review uses the other entry from the preceding completed step. `finish`, `verify`, and planning
  calls use the first entry, or `Coordinator model:` with no pair, and never change the turn.
- **Unknown preceding model, under `--run`.** Review with the entry that did not make the latest
  recorded step, or the second entry when none is recorded, and post a Decision with the reason.
  The run stops only for commits past the recorded head whose GitHub commit author is not the
  config's `By:` login, because they may come from outside the run. A person answers with the
  `Answer:` record of [ADR-014](./ADR-014-decisions-and-open-requests.md).
- **The coordinator is defined by capability.** Any harness that can start a fresh worker for each
  selection the run needs, through that selection's adapter, can coordinate a run, with or without
  a pair.
- **Harness adapters.** Each harness the SPEC lists supplies: native start, headless start, or
  both; how the model and effort are passed; how a model name is checked; a canonical model id;
  pre-launch checks for login, provider routing, and sandbox; how a quota or rate-limit error
  shows, with its reset time; runtime evidence of the model; and resume by session id. Any harness
  with a complete adapter can be a pair entry, a worker, or a coordinator. The first adapters are
  `claude-code`, `codex`, and `kiro-cli`. Two pair entries are one model when their canonical ids
  match, whatever the harness.
- **`claude -p` joins the default headless workers.** The default `headless_workers` is
  `[claude-code, codex, kiro-cli]`. The only remaining reason to leave `claude-code` out was that
  `claude -p` uses whatever login it finds. A pre-launch check closes that: `claude auth status`
  must report `authMethod: claude.ai` and `apiProvider: firstParty`, and the launch removes
  `ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN`.
- **Manual calls run in the calling session**, whatever pair is configured. They never dispatch.
  They write `Execution:` lines with the session's harness, its model and effort as the session
  reports them or `unknown`, and `Observed execution: unavailable`. A manual review warns when the
  preceding record names the same harness and model. It does not block.
- **Quota.** A quota or rate-limit error marks only that harness paused, with a Decision naming
  it and its reset time when known. Running workers finish. Steps whose turn needs the paused
  harness wait, so a pair never reviews its own work. When nothing can move, the run ends the
  cycle as waiting. An authentication error, or a quota error on the coordinator's own harness,
  still stops all work.

OpenCode is deferred to a backlog ticket. On the maintainer's install it reaches models through
two credentials: `claude-agent`, which duplicates `claude-code`, and the OpenCode Console API key,
which bills per token. No ChatGPT subscription provider was configured. Its effort, permission,
and nesting controls were not verified.

## Consequences

The coordinator holds run state, selections, merges, admission, and readiness, not the skills'
reading. A step's result is a claim, and the records stay the evidence. `finish` and `verify` now
cost a session each, and they count toward `max_parallel_workers` and, during validation, the AI
test allowance. Validation measures coordinator context on a multi-ticket fixture before and after.

Manual calls lose automatic alternation. A person who wants a different model opens that session,
and the warning tells them when a review is not model-independent.

A Kiro-only pair depends on the account's models. The maintainer states that Kiro offers Opus 5.5
and GPT Sol once credits are added. The 2026-11-03 model list on this machine showed neither.

`codex exec --json` in `codex-cli 0.166.0` names no model in its events, so a Codex worker's
`Observed execution` is `unavailable`.

## Evidence

- Live checks on 2026-11-03, approved by the maintainer. `claude auth status` reported
  `authMethod: claude.ai` and `apiProvider: firstParty`, with no Anthropic API-key variable set.
  `claude -p --model haiku --output-format json --disallowed-tools Agent`, prompt on standard
  input, returned `is_error: false` and `modelUsage` `claude-haiku-5-5`. One `codex exec` session
  on `gpt-6-luna`, with the routing.md flags and a ChatGPT login, ran the same `claude -p` command
  with the same result.
- `--disallowed-tools` takes several values, so a prompt given as an argument after it is read as
  a tool name and `claude -p` exits with "Input must be provided". The prompt goes on standard input.
- Local CLI help, read 2026-11-03: `claude` 2.1.318 (`auth status --json`); `codex-cli` 0.166.0;
  `kiro-cli` 2.33.0 (`chat --model`, `--effort`, `--trust-all-tools`, `--no-interactive`,
  `--resume-id`, `--output-format stream-json`, `--list-models`); `opencode` v2.2.5 (`run --model
  provider/model#variant`, `--format json`, `--auto`, `--session`).
- `kiro-cli chat --list-models` on 2026-11-03 listed `auto`, `claude-sonnet-4.5`,
  `claude-haiku-4.5`, `deepseek-3.2`, `minimax-m2.5`, `minimax-m2.1`, `glm-5`, and
  `qwen3-coder-next`. The command signed the machine in to Kiro through a browser first.
- `opencode auth list` on 2026-11-03: `Claude Agent` and `OpenCode Console` API key stored.
