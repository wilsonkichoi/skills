---
name: wkc-plan
description: Write or update the ROADMAP, the ordered milestones that deliver an approved SPEC, then draft tickets for one milestone and publish them through wkc-tracker once the user approves. Use when a design is ready to be broken into milestones and tickets, or when the next milestone needs tickets.
argument-hint: "[milestone name or number, or a change to plan]"
disable-model-invocation: true
---

# wkc-plan

- **What it does:** writes the ROADMAP at `roadmap_file`: milestones in delivery order, each with an
  outcome someone can check. Then drafts tickets for one milestone and, once the user approves,
  creates them through `wkc-tracker` with their dependency edges.
- **When to use it:** after `wkc-architect` approves a SPEC, when a PRD or SPEC change moves
  milestones, or when the next milestone needs tickets. A small feature or fix does not need it:
  write the one ticket, or do the work. Callers are people.
- **Dependencies:** `prd_file`, `spec_file`, and `roadmap_file` from `docs/dev-agents/config.md`,
  falling back to `docs/dev-agents/PRD.md`, `SPEC.md`, and `ROADMAP.md` when there is no config.
  The `wkc-tracker` skill for every ticket read and write: `list`, `show`, `milestone`, `create`,
  and `move`.
- **Input:** free text: a milestone name or number to plan, or a change to the plan. With nothing
  given, read the documents and the tracker, write or update the ROADMAP, and draft tickets for the
  first milestone in order whose scope has no tickets yet.
- **Output:** the ROADMAP file, a ticket draft for one milestone, and after approval the created
  tickets with their tracker ids and edges, plus a short report. `ready` tickets are then on the
  tracker's frontier, which `wkc-tracker next` returns.

Writes only the ROADMAP, and tickets through `wkc-tracker`. Never edits the PRD or SPEC, their
status lines included, and writes no code or config. Keep what the user wrote in the ROADMAP unless
they ask to change it.

## 1. Read before asking

Read, in this order, whatever exists:

- `docs/dev-agents/config.md`, the configured `context_file`, and the rule files in `rules_dir`.
- The PRD, the SPEC, and the current ROADMAP.
- Open tickets, with `wkc-tracker list`, and a milestone's tickets with `wkc-tracker list <milestone>`.

Reach tickets only by invoking the `wkc-tracker` skill's verbs. Never read or write ticket files,
`gh`, or Linear yourself, even when they are in plain view. If `wkc-tracker` cannot run, say why,
and plan without publishing.

The SPEC is approved only when the line under its title reads `Status: approved (YYYY-MM-DD)`.
With no SPEC, or a draft one, stop and ask. Recommend finishing and approving it with
`wkc-architect` first, and offer to plan from intent the user states here. If the user already said
to go ahead, do not ask again. Approving the PRD or SPEC belongs to `wkc-research` and
`wkc-architect`: never offer to approve one here.

Where a ticket would need a decision the SPEC does not make, such as a missing contract field or an
unchosen option, do not make it. Name it in the report as work for `wkc-architect`, or plan a spike
when only an experiment can settle it.

## 2. Write the ROADMAP

Milestones in the order they ship. Each is a slice someone can check working end to end, not a
layer such as "database" or "API". Order by real dependencies first, then put what the SPEC's
**Risks and dependencies** and **Open unknowns** flag as risky early. One milestone is a valid
ROADMAP. Use the outline as a guide and drop lines that say nothing.

```markdown
# <Product> ROADMAP

Status: draft

## M1: <name>
Outcome: <what a person can do or see once it ships>
Scope: <PRD goals and SPEC sections it delivers>
Depends on: <earlier milestones, outside dependencies>
Exit check: <how to tell it is done: a command, a demo, a measure>

## Changes   <!-- dated, newest first, for updates -->
```

The heading after `## ` is the milestone's name in the tracker too. The ROADMAP holds intent and
order, never progress: no status, checkboxes, assignees, completion dates, or ticket lists. The
tracker owns those, and `wkc-tracker list <milestone>` shows a milestone's tickets.

The ROADMAP states the current plan, like the PRD and SPEC. When updating it, rewrite only the
affected milestones, then add a one-line **Changes** entry: the date, what changed and why, and what
it replaced. Do not rename a milestone that already has tickets; the tracker cannot rename one.

## 3. Draft tickets for one milestone

Plan the milestone the user named, or else the first one in ROADMAP order whose scope existing
tickets do not cover. Later milestones get tickets when they come up.

Compare the milestone's scope with the existing tickets by substance, not by title. Reuse one that
already covers part of it and name it in the draft instead of writing a duplicate.

Write each ticket in the shape `wkc-tracker` uses (**What to build**, **Acceptance criteria**,
**Blocked by**, **Related**, **Notes**), with draft ids such as T1 and T2:

- One outcome that can be checked on its own, sized for one pull request.
- Acceptance criteria someone else can check: a command and its expected output, a request and its
  response, a file, or a named manual check. Broad criteria, such as validation or error handling,
  list their cases.
- **Notes** copy the SPEC excerpt the work needs, such as a contract's fields and error responses,
  with the section it came from, so a fresh session does not have to go looking.
- **Blocked by** only for a real prerequisite: work this ticket builds on. Never to encode priority.
- A spike for an unknown names the question, the evidence that settles it, and where the answer
  goes, usually a SPEC update through `wkc-architect`. Its code is thrown away, not shipped.

Order the draft so every ticket follows its blockers, then by what to build first. Tickets are
created in that order, and `wkc-tracker next` returns the lowest id first, so the draft order is the
build order.

## 4. Approval

Show the ROADMAP or what changed in it, the milestone being planned, every ticket with its criteria
and edges, the existing tickets reused, and what publishing will do: create the milestone in the
tracker if it has none, create N tickets at `backlog` with M edges, then move them to `ready`.

A question ends its turn. Number the options, put the recommended one first, and accept a digit:

1. Approve the ROADMAP and publish the tickets at `ready`.
2. Approve the ROADMAP and publish the tickets at `backlog`.
3. Change something first.
4. Approve the ROADMAP only and publish nothing.

When the ROADMAP is already approved and unchanged, the options are about the tickets alone.

The line under the title records approval: `Status: draft` until the user approves the ROADMAP,
then `Status: approved (YYYY-MM-DD)` with that day's date. Write it, and publish, only on approval
in this conversation. Adding, removing, or reordering milestones sets an approved ROADMAP back to
`Status: draft`.

## 5. Publish

Tracker writes are hard to take back, so run them in this order, through `wkc-tracker`, and stop at
the first failure:

1. `wkc-tracker milestone <name>`, so the milestone exists. If it cannot, create nothing and say
   what the user needs to do.
2. `wkc-tracker create` each ticket in draft order, with its milestone, and its `## Blocked by`
   entries rewritten from draft ids to the ids already returned.
3. `wkc-tracker list <milestone>` once, and compare it with the draft: every ticket present, with
   the blockers it was given.
4. Only when all of that matched, `wkc-tracker move <id> ready` for each ticket, if the user chose
   `ready`. Half-published work never reaches the frontier.

On a failure, report the ids created, the edges that landed, and what is missing. On a rerun, list
the milestone first and create only what is missing; never recreate a ticket that exists.

## 6. Report

Say what changed in the ROADMAP and its status line, the tickets created with their ids or URLs and
edges, which are `ready`, anything that failed, and the open decisions for `wkc-architect`. Run
`wkc-plan` again when the next milestone needs tickets.
