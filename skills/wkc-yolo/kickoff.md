# wkc-yolo kickoff

Read this file whole when [SKILL.md](./SKILL.md) section 1 starts a new run. It ends with the run
branch and the run config written; SKILL.md section 2 then runs the tickets.

## Contents

- 1. One round of questions
- 2. Start the run

## 1. One round of questions

Before asking, read without writing anything:

- Run `push_check` once in the current checkout. With no `push_check`, or a non-zero exit, the run
  cannot start: show the command and its output first, ask nothing else, and end. No branch, no
  config.
- Push protection: `gh api repos/<owner>/<repo> --jq '.security_and_analysis.secret_scanning_push_protection.status // "unverifiable"'`.
  `enabled` confirms on and `disabled` confirms off. A missing field or a failed read is
  `unverifiable`, with its reason, such as no admin access. An authentication error stops.
- The `gh` identity the run will push as (`gh api user --jq .login`), the repository's visibility,
  and `sandbox.enabled` and `permissions.disableBypassPermissionsMode` as
  [routing.md](../wkc-implement/routing.md) section 4 reads them. A forced sandbox or disabled
  bypass mode stops routed dispatch.
- The scope: `wkc-tracker milestone show`, `list --milestone`, and `show` on every ticket in it, the
  PRD, SPEC, and ROADMAP, and the milestone's exit check. A wave is the milestone's tickets in
  `wkc-tracker next`'s frontier. A closed, unmerged run the person may name to supersede, by its
  config and run PR.
- Whether this harness can start a fresh worker: a native subagent, or a headless CLI that
  `headless_workers` lists. With neither, a run gets no independent review: stop, create nothing.

Then ask everything in one message, as numbered questions, each with numbered options and the
recommended one first, a digit accepted:

1. **Scope and initial IDs.** Every ticket the run will take, later waves of a milestone included.
   An initial scope larger than five is valid. Each `backlog` ticket is included, moved to `ready`
   after kickoff, or left out. Each held ticket, by another person or another run's `Run:` comment,
   is adopted or left out; adopting from another run needs evidence that it stopped.
2. **Readiness problems and blind spots**, each named with its ticket: an unapproved PRD, SPEC, or
   ROADMAP; an open decision ticket that blocks scope; a SPEC section a ticket cites that does not
   exist; a criterion with no check; tickets that change the same files with no coordination note,
   which the run serializes; a missing prerequisite. Each is fixed first, accepted, or left out.
3. **Planning:** `delegated` (recommended) or `none`. **New prerequisites:** `run` (recommended) or
   `record only`. **Additional allowance:** the project's `max_additional_tickets`, or lower. Explain
   it apart from the initial scope: initial work costs no slot, and only new prerequisites and
   readiness repairs spend one. **`max_fix_attempts`:** the project's, or lower.
4. **Gates.** Classify every `## After merge` step, every post-merge criterion, and every exit-check
   item, by its `Target:`, command, and **Conventions**, never by its verb: **local** runs with no
   grant; **shared non-production** runs only under a grant; **production-affecting** never runs.
   Ask when the class is unclear; unanswered, it is not granted. Name the exit-check items that a
   command can decide; readiness runs those.
5. **Grants**, one per shared non-production environment: show its exact commands, limits (count,
   cost, duration, retries), cleanup command, and expiry, and whether it lacks its own expiry.
   Default none. Offer none when the store cannot detect edits: `tracker` on Linear or local.
6. **Moves.** For each production step, propose moving it word for word to a separate release
   ticket. For each acceptance or release approval only a person gives, such as "A person
   confirms", propose the run PR's review checklist. Engineering verification that needs a person
   stays on its ticket; propose no move. Only a yes moves anything. A ticket left needing
   production or a person keeps the run PR a draft.
7. **Execution.** The project's model pair, or the default `claude-code`/`opus` then
   `codex`/`gpt-6.1-sol`, both effort `medium`, or none. List each ticket's `## Execution` override
   as read; a run never freezes it. Headless workers: the project's list or fewer. With no pair,
   confirm the coordinator's harness, model, and effort; a session cannot read its own. When native
   workers will run, record the model as an alias, such as `sonnet`. Confirm the
   coordinator runs with full permissions and no sandbox: `claude --dangerously-skip-permissions`,
   `codex --dangerously-bypass-approvals-and-sandbox`, or `kiro-cli chat --trust-all-tools`.
8. **Security.** The push protection status and its reason; accept a `disabled` or `unverifiable`
   status, or stop. The acceptance goes in the session report, never the config or the run PR. The
   identity pushes use. With `run_config: tracker` on a public repository, say the config will be
   public; with `github-variable`, that every Actions workflow can read it.
9. **Supersede** a closed, unmerged run, or none.

End the turn. There is no elapsed-time budget; command limits, grant expiry, 5 concurrent workers,
and quota stops still apply.

## 2. Start the run

With the answers, ask nothing more in this phase.

1. **Run branch.** `run/<milestone-slug>-<YYYYMMDDTHHMM>`, local time, or `run/ticket-<id>-...` for
   a ticket with no milestone. Push it at the remote default branch's sha after running
   `push_check`. To supersede, start it from the closed run's branch with `origin/<default>`
   merged in; when `git merge-tree --write-tree` shows a conflict, stop before creating anything.
   Its `done` tickets are carried, never rebuilt: they are no initial IDs, and readiness verifies
   them with the rest.
2. **Config.** Fill the run config template (SKILL.md section 5) from the answers, and store it with
   `wkc-tracker run create`. It holds no credentials, scan command, push protection status, or
   ticket status. Read it back with `run show`; this ref is the active ref.
3. **Moves.** For each approved move, one at a time, call `wkc-backlog <the move> --run <ref>`. It
   posts the `Decision (wkc-yolo):` comment citing `Moved by the person:`. Release tickets stay at
   `backlog`, outside the run.
4. **Statuses.** Move each included `backlog` ticket to `ready`.
