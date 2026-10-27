# ADR-007: A run merges into its own branch, and a person merges the run

Date: 2026-10-26. Status: accepted. Amends [ADR-006](./ADR-006-delegated-run-authority.md):
`merge_gate` and the run record are replaced. Amended by
[ADR-008](./ADR-008-run-completes-its-tickets.md): tickets finish on the run branch before the
person's merge, the closing round is gone, and a same-run blocker needs its finish to find no failed
gate. The run branch, the run config, its stores, `--run`, and the person's merge stay.

## Context

The maintainer's review of PR #78 (2026-10-26) found three gaps in the approved `wkc-yolo` design.

- **The final call came after the fact.** With `merge_gate: agent`, the default, a run merged every
  approved ticket into the default branch during the run. A person reviewed the outcome only after
  it had landed. The maintainer wants a person to be accountable for the final merge of everything
  a run did, while subagents keep full autonomy inside the run.
- **Deploys were approved before the work existed.** The kickoff round approved every
  `(needs authorization)` step up front, default all, so a release could run during the run.
- **The run record could not be shared.** It was a gitignored file passed by absolute path. A
  subagent in another sandbox, VM, or container cannot open that path, and the delegated approval
  line wrote it into a committed SPEC, where nobody else can open it and it exposes a home directory.

A related question: a skill switched to unattended mode when the call "says it comes from
`wkc-yolo`" and gives a path. That is wording a model interprets, and no skill read the record
before acting on it, though the record grants authority.

Facts that shape any design:

- A GitHub pull request into a branch other than the default branch reports `MERGED` like any
  other, so "merged" alone no longer means the change reached the default branch.
- GitHub repository secrets cannot be read back through the API; only Actions workflows read them.
  Repository variables can be read back by collaborators with the `repo` scope, are not shown on a
  public repository, hold 48 KB each, and record `created_at` and `updated_at` but not who edited
  them. Any Actions workflow in the repository can read them, and their values are not masked in
  logs. Whether workflows from fork pull requests receive them is not documented
  ([variables](https://docs.github.com/en/actions/reference/workflows-and-actions/variables),
  [REST variables](https://docs.github.com/en/rest/actions/variables)).
- A GitHub issue body is public on a public repository. Only collaborators can edit it or label
  it, and GraphQL reports `lastEditedAt` and `editor` (checked on #74, 2026-10-26).

## Options

Where a run merges:

1. **A run branch.** The run creates `run/<slug>` from the default branch. Ticket and planning PRs
   target it, and the run merges each approved one into it. At the end the run opens one PR from
   the run branch into the default branch and stops; a person reviews and merges it. Gains: a
   person makes the final call on everything, every time; ticket PRs stay reviewed units. Costs: a
   milestone-sized final PR to review; tickets reach `done` only after that merge.
2. **`merge_gate: human`.** A person merges each ticket PR. Gains: no new branch. Costs: the run
   stops at every merge, and a blocked ticket waits for a person mid-run.
3. **Keep `merge_gate: agent` as the default.** Gains: fastest. Costs: no final call before the
   default branch changes.

Where the run config lives:

1. **One store per project, chosen in the config:** `tracker` (an issue per run, the default),
   `github-variable` (a repository variable per run), or `command <cmd>` (the adopter's own). Gains:
   shared across sandboxes; each project picks its own exposure and permissions. Costs: one
   mechanism per store.
2. **Tracker only.** Gains: one mechanism. Costs: public on a public repository.
3. **Inline in every call.** Gains: nothing stored. Costs: a resumed run needs the original
   machine, and nothing durable records what was authorized.

## Decision

Merge option 1 and config option 1 (maintainer, 2026-10-26).

- A run merges only into its own run branch, never into the default branch. A person merges the
  run PR. `merge_gate` is dropped: it never shipped, so nothing migrates.
- Inside the run, a ticket whose PR merged into the run branch counts as a met blocker for other
  tickets of that run. Its status stays `in-review` until finish.
- A PR merged into another branch counts for `wkc-implement finish` only once a PR from that branch
  into the default branch has merged. Finish never runs before the person's merge.
- After the person merges the run PR, `wkc-yolo` asks one closing round: each
  `(needs authorization)` step in the run's tickets, approved or not. Then it finishes the tickets.
  The kickoff round no longer asks for steps.
- Renamed from run record to **run config**, because it holds the authorization, not a log. It
  holds limits only: never credentials, push protection status, or the scan command. It is written
  once and never edited. The `run_config` field picks the store, default `tracker`. `wkc-setup`
  warns that on a public repository the tracker store is public.
- Unattended mode is an explicit argument, `--run <ref>`, never wording. The skill reads the config
  through `wkc-tracker run show <ref>`, which refuses an unreadable or edited config. A refusal stops
  the call with the error and asks nothing.
- The kickoff round also reviews the work in scope for blind spots and names them, so the person
  approves the run knowing them.
- A run still never edits the PRD, even on its branch, because it would then act on a boundary it
  rewrote before a person saw it.

## Consequences

- No run can change the default branch. A person approves every change there, as compliance
  constraints require, so the per-project merge setting has no reason to exist.
- The final PR for a milestone is large. Each ticket PR inside it was reviewed and stays linked from
  the run PR's body; a wave or ticket run gives a smaller one.
- Releases and deploys follow the person's merge, not the run's.
- A store's exposure is the adopter's choice. The tracker store on a public repository makes the run
  config public, but it carries no security posture. Only GitHub reports an edited issue body; the
  Linear and local tracker stores cannot detect an edit, and `wkc-setup` says so.
- `github-variable` exposes the config to the repository's Actions workflows. A project with
  workflows that print variables should choose another store.
- Revisit `merge_gate` if a project wants agent merges into the default branch again; that needs a
  PRD change, because the PRD now forbids it.
