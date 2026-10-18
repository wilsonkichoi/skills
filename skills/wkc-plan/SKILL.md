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
- Open tickets, with `wkc-tracker list`, and the milestone being planned read whole, as section 4
  says for earlier milestones.

Reach tickets only by invoking the `wkc-tracker` skill's verbs. Never read or write ticket files,
`gh`, or Linear yourself, even when they are in plain view. If `wkc-tracker` cannot run, say why,
and plan without publishing.

The SPEC is approved only when the line under its title reads `Status: approved (YYYY-MM-DD)`.
With no SPEC, or a draft one, stop and ask. Recommend finishing and approving it with
`wkc-architect` first, and offer to plan from intent the user states here. If the user already said
to go ahead, do not ask again. Approving the PRD or SPEC belongs to `wkc-research` and
`wkc-architect`: never offer to approve one here.

Where a ticket would need a decision the SPEC does not make, such as a missing contract field or an
unchosen option, do not make it. It becomes an unresolved prerequisite (section 4), settled by
`wkc-architect` or by a spike.

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
tickets do not cover. Later milestones get tickets when they come up; do not draft them now, even
to show the graph.

Compare the milestone's scope with the existing tickets by substance, not by title. Reuse one that
already covers part of it and name it by its tracker id instead of writing a duplicate. Never
change a reused ticket; if it needs changing, say so in the report.

Write each new ticket in the shape `wkc-tracker` uses (**What to build**, **Acceptance criteria**,
**Blocked by**, **Related**, **Notes**), with draft ids such as T1 and T2, kept apart from tracker ids:

- One outcome that can be checked on its own, sized for one pull request. Do not split tightly
  coupled work, or invent tickets, to get more of them.
- Acceptance criteria someone else can check: a command and its expected output, a request and its
  response, a file, or a named manual check. Broad criteria, such as validation or error handling,
  list their cases.
- **Notes** copy the SPEC excerpt the work needs, such as a contract's fields and error responses,
  with the section it came from, so a fresh session does not have to go looking.
- A spike for an unknown names the question, the evidence that settles it, and where the answer
  goes, usually a SPEC update through `wkc-architect`. Its code is thrown away, not shipped.
- A decision ticket holds a question only a person or `wkc-architect` can answer, in its body. It
  stays at `backlog`, unassigned, and is `done` once the SPEC records the answer.

## 4. Build the dependency graph

Give each ticket its direct prerequisites: the tickets whose work it builds on and cannot start
without. "T3 is **Blocked by** T1" is the edge T1 → T3. Never add an edge for priority, a preferred
order, or because two tickets touch the same files, and drop a blocker that another blocker already
implies.

A blocker is a draft id, a reused ticket, or a ticket in an earlier milestone. When the ROADMAP
says this milestone **Depends on** another, read that milestone whole: `wkc-tracker milestone show
<milestone>` for its counts, then `list <milestone>` for open tickets, and `list done <milestone>`,
`list cancel <milestone>`, and `list duplicate <milestone>`, with `show <id>` where substance
matters. What you read must add up to the counts; when it does not, say so. No open tickets never
means the milestone is empty or finished. Then, for each piece of work this milestone needs:

- a `done` ticket delivered it: the prerequisite is met and needs no edge;
- an open ticket will deliver it: link that ticket;
- a `duplicate`: follow `show` to its original and treat it as that ticket. Link the original,
  never the duplicate, and when the original cannot be found, the work is unresolved;
- a `cancel` ticket: the work was dropped, not delivered, so it is not met. Plan it in this
  milestone or name it as unresolved. Never link to, reuse, or reopen a canceled ticket.

The ROADMAP keeps its milestone-level **Depends on**; ticket edges live only in the tracker.

**Unresolved prerequisites** are work this milestone needs that no ticket delivers, such as a
decision the SPEC has not made. Never invent an id. Prefer a real ticket and a real edge: a decision
ticket, or a spike, drafted with this milestone. When two tickets share an undecided contract, both
are blocked by that one decision or spike ticket; no edge between the two stands in for it. When
the user would rather not add a ticket, record the gap in the dependent's **Notes** and keep that
ticket at `backlog`: a note is not an edge, and `wkc-tracker next` cannot see it. A person who
moves it to `ready` puts it on the frontier anyway.

Check the graph before showing it: every id resolves to a draft or a real ticket, no ticket blocks
itself, and there is no cycle. Fix a graph that fails; never publish one. Then derive:

- **Creation order**: a topological order, so a new ticket is created after its new blockers. It
  is publishing order, not execution order.
- **Waves**: wave 1 is every ticket with no unmet blocker; each later wave is the tickets whose
  blockers all sit in earlier waves. A wave is a possible schedule once its prerequisites finish,
  not a promise that its tickets run at once, a duration, or a count of people or agents.
- **Coordination risks**: tickets that can run side by side but edit the same schema, migration,
  generated file, or config. Name the risk; it is not an edge.

What can start is decided later by `wkc-tracker next`, which returns every eligible ticket, lowest
id first only as a tie-break.

## 5. Approval

Show the ROADMAP or what changed in it, the milestone being planned, and:

- every new ticket with its criteria, and the reused tickets by tracker id;
- the edges as a table (ticket, blocked by), plus a Mermaid `graph LR` when it helps;
- the waves, the tickets that would be on the frontier first, the coordination risks, and any
  unresolved prerequisites with the tickets they hold back;
- what publishing will do: create the milestone in the tracker if it has none, create N tickets at
  `backlog` with M edges, then move them to `ready`.

Decision tickets, and tickets whose unresolved prerequisite has no ticket, are not safe to start,
so option 1 must say they stay at `backlog`, and why. The diagram is for review, not a file to keep.

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

## 6. Publish

Tracker writes are hard to take back, so run them in this order, through `wkc-tracker`, and stop at
the first failure:

1. `wkc-tracker milestone <name>`, so the milestone exists. If it cannot, create nothing and say
   what the user needs to do.
2. `wkc-tracker create` each ticket in creation order, with its milestone, and its `## Blocked by`
   entries rewritten from draft ids to the tracker ids already returned.
3. `wkc-tracker list <milestone>` once, and compare it with the draft: every new ticket present, at
   `backlog`, with exactly the blockers in the approved table. A created ticket missing from the
   list landed outside the milestone: `show` it, report it as a failed write, and never move it.
4. Only when all of that matched, `wkc-tracker move <id> ready` for each ticket the user approved
   for `ready`. Half-published work never reaches the frontier. If something learned while
   publishing makes a ticket unsafe to start, leave it at `backlog` and ask.

On a failure, report the ids created, their milestones, the edges that landed, and what is missing.
On a rerun, read the milestone and `show` each id the failed run reported, then create only what is
missing; never recreate a ticket that exists. Tickets an earlier run of this milestone left at
`backlog` are part of this publication, not reused tickets: check them like new ones, and option 1
moves them to `ready` too.

## 7. Report

Say what changed in the ROADMAP and its status line, the tickets created with their ids or URLs and
edges, which are `ready` and which stay at `backlog` and why, unresolved prerequisites, anything that failed, and the open decisions
for `wkc-architect`. Run `wkc-plan` again when the next milestone needs tickets.
