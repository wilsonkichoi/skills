---
name: wkc-backlog
description: Draft tickets for one ROADMAP milestone, or one change (a request, a bug, discovered work, or a refinement, split, re-block, or cancel of existing tickets), from the approved PRD, SPEC, and ROADMAP, then publish through wkc-tracker once the user approves. Use when a milestone needs tickets, or when work between planning runs needs a ticket or changes existing ones.
argument-hint: "[milestone name or number, or one change] [--run <ref>]"
disable-model-invocation: false
---

# wkc-backlog

- **What it does:** turns approved project intent into tickets. Drafts tickets for one ROADMAP
  milestone, or for one change, checks the dependency graph, and once the user approves, writes
  them through `wkc-tracker` with their dependency edges.
- **When to use it:** after `wkc-plan` approves a ROADMAP, when the next milestone needs tickets, or
  for one change between planning runs. Callers are people, `wkc-plan`, `wkc-yolo`, and a model
  acting on a person's request. A model runs it only when a person or `wkc-yolo` asked for that work.
- **Dependencies:** `prd_file`, `spec_file`, and `roadmap_file` from `docs/dev-agents/config.md`,
  falling back to `docs/dev-agents/PRD.md`, `SPEC.md`, and `ROADMAP.md` when there is no config.
  The `wkc-tracker` skill for every ticket read and write: `list`, `show`, `milestone`, `create`,
  `edit`, `link`, `unlink`, `move`, and `comment`. The `wkc-architect` and `wkc-plan` skills for a
  SPEC or a ROADMAP change.
- **Input:** free text: a milestone name or number to plan, or one change: a request, a bug, a
  `Discovered:` comment, or a refinement, split, re-block, or cancel of existing tickets. With
  nothing given, read the documents and the tracker, and draft tickets for the first milestone in
  ROADMAP order whose scope has no tickets yet. A call from `wkc-yolo` gives one change and
  `--run <ref>`, naming its run config (section 7).
- **Output:** a draft for one milestone or one change, and after approval the created and changed
  tickets with their tracker ids and edges, plus a short report. Under `wkc-yolo`, no draft to
  approve: the published tickets, or `parked`.

Writes only tickets, by invoking the `wkc-tracker` skill's verbs. Never read or write ticket files,
`gh`, or Linear yourself, even when they are in plain view. Never edits the PRD, SPEC, or ROADMAP,
their status lines included, and writes no code or config. An existing ticket changes only as
shown in the approved draft. Under a run, section 7 is the approval.

## 1. Read before asking

Read, in this order, whatever exists: `docs/dev-agents/config.md`, the configured `context_file`,
and the rule files in `rules_dir`; the PRD, the SPEC, and the ROADMAP; open tickets with
`wkc-tracker list`, and the milestone being planned read whole, as section 3 says for earlier
milestones. A document this session already read and has not changed since needs no second read.
For a change, `show` each ticket it names; `list` shows what each one blocks. If `wkc-tracker`
cannot run, say why, and draft without publishing.

The SPEC and the ROADMAP are approved only when the line under each title reads `Status: approved
(YYYY-MM-DD)`. Planning a milestone needs both approved, and the milestone in the ROADMAP. A
change needs neither approved, but is still read against them. For a milestone with one missing or
draft, stop and ask: recommend `wkc-architect` for the SPEC or `wkc-plan` for the ROADMAP
first, and offer to plan from intent the user states here, unless they already said to go ahead. Never offer to approve the PRD, SPEC, or ROADMAP.

Classify a change against those documents before drafting it:

- Work they already cover, or a bug against them: tickets, drafted here.
- A change to what the PRD or SPEC says, such as a new goal, a dropped requirement, or a different
  contract: not a ticket change. Name it, send a PRD change to `wkc-research`, invoke the
  `wkc-architect` skill with a SPEC change, and draft nothing that depends on it.
- A change that adds, moves, or drops milestone scope: a ROADMAP change. Invoke the `wkc-plan`
  skill with it, and draft nothing that depends on it.

Under `wkc-yolo`, name a SPEC or ROADMAP change in the return instead of invoking either skill,
because `wkc-yolo` is not their caller.

Where the SPEC leaves a detail open, make the conventional, low-risk choice an experienced engineer
would, if nothing approved says otherwise. Write each choice that sets behaviour in **Notes** as
`Assumption: <choice>, because <reason>.`, never as a SPEC excerpt. A gap is an unresolved
prerequisite (section 3) when it has no conventional answer, shapes data exchanged with another
system, or materially risks product behaviour, security, compatibility, architecture, or data integrity.

## 2. Draft tickets

**A milestone.** Plan the one the user named, or else the first in ROADMAP order whose scope
existing tickets do not cover. Later milestones get tickets when they come up; do not draft them
now, even to show the graph. Compare the scope with existing tickets by substance, not by title,
and reuse one that already covers part of it by its tracker id instead of writing a duplicate.

**One change.** Draft only what it needs, and reuse an existing ticket that already covers it.
Its new tickets, split children included, stay at `backlog` whatever the parent's status:

- A request or a bug: new tickets, in the milestone whose scope it falls in, or in none.
- A comment `Discovered: <what>. Out of scope because <why>. Blocks this ticket: yes | no.`, read
  with `show` on the ticket that carries it: a new ticket for the work. With `yes`, the carrier is
  **Blocked by** it and keeps its status and holder.
- A refinement or re-block: the changed title, milestone, sections, or edges of each ticket, before
  and after.
- A split: children by the split rule below. Each open ticket blocked by the parent is blocked by
  the children it needs instead, then the parent moves to `cancel`.
- A cancel: the ticket to move to `cancel`, and each open ticket that would be left with a `cancel`
  blocker. Offer to `unlink` each, or to block it by a ticket that delivers the work.

Write every new ticket in one of these templates, exactly, and drop a section that would say nothing.
Give new tickets draft ids such as T1 and T2, kept apart from tracker ids. A work ticket, titled
`<area>: <outcome in a few words>`:

```markdown
## What to build
<One to three sentences on what exists when this is done.>

## Why
<The problem it solves or the outcome it serves, in one or two sentences>, from <PRD goal or SPEC section>.

## Acceptance criteria
- [ ] <What is checked before merge>: `<command>` gives <expected result>.
- [ ] A person confirms <what>.          <!-- only when a person's sign-off is part of done -->

## After merge                           <!-- only when the ticket has post-merge steps -->
- [ ] <step>, using <command or Conventions entry>. Target: <local | environment name | production>. Check: <expected result>. (needs authorization)

## Blocked by
- #<id>

## Related
- #<id>

## Notes
<SPEC section>: <the excerpt the work needs, copied in>.
Evidence, from <the Discovered comment's URL, or the report it came from>: <its Observed, Reproduce, Because, and Verified lines, copied in>.   <!-- only for a reported problem -->
```

When writing **Notes** for a reported problem, keep the template's `Evidence, from <source>:` line
with the link to the comment or report. Then copy its `Observed`, `Reproduce`, `Because`, and
`Verified` lines word for word. For a `Discovered:` item, copy from the original comment returned
by `wkc-tracker show <id>`, including a handoff from `wkc-code-review`. Never use the caller's
summary in place of those lines.

A spike, titled `Spike: <question>`. Its code is thrown away, never shipped:

```markdown
## What to build
Answer: <question>. Timebox: <limit>.

## Acceptance criteria
- [ ] The answer, with <the evidence that settles it>.
- [ ] The answer is recorded in <SPEC section>, through `wkc-architect`.

## Notes
Blocks: <the tickets or SPEC section waiting on the answer>.
```

A decision ticket, titled `Decision: <question>`, stays at `backlog` and unassigned:

```markdown
## What to build
Decide: <question>.

## Acceptance criteria
- [ ] The SPEC records the answer in <section>.

## Notes
Options: <each with its gains and costs>. Who decides: a person | `wkc-architect`.
```

- **Split rule.** Split work into separate tickets only when a piece has its own deliverable or must
  happen at a different time: an infra change that must land first becomes a blocker ticket; a
  release bundling several tickets becomes its own ticket blocked by them. Testing and validating a
  change never become their own ticket. Otherwise one ticket is one outcome, sized for one pull request.
  Moving a requirement out of an existing ticket changes its definition of done, which only the
  person approves, in a run too.
- Criteria someone else can check: a command and its output, a request and its response, a file,
  or a manual check for what only a person can judge. Broad criteria, like error handling, list
  cases, but never invent consequential behaviour to add one.
- Integration tests that can run before merge are acceptance criteria. Tests that need the merged
  or deployed build are `## After merge` checks.
- Every step that publishes, deploys, or touches a shared environment ends with `(needs authorization)`.
- `Target:` names what a step acts on, so a run can classify it: `local`, the environment's name,
  or `production`.
- Later skills judge choices against **Why**. With no PRD or SPEC behind a change, cite the request.
- A ticket that sets up the project or its tooling is done when that tooling is shown working, such
  as its test runner passing a real test, not when the files exist.

## 3. Build the dependency graph

Give each ticket its direct prerequisites: the tickets whose work it builds on and cannot start
without. "T3 is **Blocked by** T1" is the edge T1 → T3. Never add an edge for priority, a preferred
order, or shared files, and drop a blocker another implies. Edges live only in the tracker; the
ROADMAP keeps its milestone-level **Depends on**.

When the ROADMAP says this milestone **Depends on** another, read that one whole: `wkc-tracker
milestone show <milestone>` for its counts, then `list`, `list done`, `list cancel`, and `list
duplicate` for it, with `show <id>` where substance matters. What you read must add up to the
counts; say so when it does not. No open tickets never means a milestone is empty or finished. Work
a `done` ticket delivered is met and needs no edge; work an open ticket will deliver links to it.
Follow a `duplicate` to its original with `show` and link the original, never the duplicate; a
missing original leaves the work unresolved. A `cancel` ticket's work was dropped, not delivered:
plan it here or name it as unresolved, and never link to, reuse, or reopen the canceled ticket.

**Unresolved prerequisites** are work that no ticket delivers, such as a decision the SPEC has not
made. Never invent an id. Prefer a real ticket and edge, drafted now: a spike when evidence can
settle the question, as for an **Open unknowns** entry, or a decision ticket when only a person or
`wkc-architect` can choose. Tickets sharing an undecided contract are blocked by that one ticket,
not by each other. When the user would rather not add one, record the gap in the dependent's
**Notes** and keep it at `backlog`: a note is not an edge, and `wkc-tracker next` cannot see it. A
person who moves it to `ready` puts it on the frontier anyway.

Check the graph as it will stand, existing edges included: every id resolves to a draft or a real
ticket, no ticket blocks itself, and there is no cycle. Never publish a graph that fails. Derive:

- **Creation order**: topological, new blockers first. It is publishing order, not execution order.
- **Waves**, for two or more new tickets: wave 1 has no unmet blocker; each later wave's blockers
  sit in earlier waves. A possible schedule, never a promise of simultaneous work, time, or headcount.
- **Coordination risks**: side-by-side tickets that edit one schema, migration, generated file, or
  config. Name the risk; it is not an edge.
- **Edge order** for existing tickets: no write may leave a cycle, or leave a ticket with no unmet
  blocker when the approved graph gives it one. If none avoids both, name the exposed ticket.

What can start is decided later by `wkc-tracker next`, which returns every eligible ticket, lowest
id first only as a tie-break.

## 4. Approval

Show the milestone or change being planned, and:

- every new ticket in full, the reused tickets by id, and each existing ticket the draft changes,
  before and after. Name the holder of each `in-progress` or `in-review` ticket it changes, and
  each ticket a cancel or split leaves with a `cancel` blocker;
- the edges as a table (ticket, blocked by), the edge order, a Mermaid `graph LR` when it helps,
  the waves, the first frontier, coordination risks, and unresolved prerequisites with what they hold;
- each `Assumption:`, which approval makes a ticket criterion, never a change to the SPEC;
- what publishing will do: the milestone it creates, if any, N tickets at `backlog` with M edges,
  each existing ticket it edits, links, unlinks, or cancels, and the tickets it moves to `ready`.
  Option 1 says why decision tickets, and ones whose prerequisite has no ticket, stay at `backlog`;
- work sent to `wkc-research`, `wkc-architect`, or `wkc-plan`, and what waits on it.

A question ends its turn. Number the options, put the recommended one first, and accept a digit.
For a milestone:

1. Publish the tickets at `ready`.
2. Publish the tickets at `backlog`.
3. Change something first.
4. Publish nothing.

For a change: 1. Publish it, new tickets at `backlog`. 2. Change something first. 3. Publish nothing.

Publish only on approval in this conversation, or under a run as section 7 says. The diagram is for
review, not a file to keep.

## 5. Publish

Before the first write, `show` each existing ticket the draft changes. If its title, milestone,
status, holder, sections, or edges differ from the draft's before, write nothing, and show the
difference and a new question. Then run the tracker writes in this order and stop at the first failure; they are
hard to take back:

1. `wkc-tracker milestone <name>` for each milestone the new tickets need. If that fails, stop.
2. `create` each new ticket in creation order, with its milestone, and its `## Blocked by` entries
   rewritten from draft ids to the tracker ids already returned.
3. On existing tickets, `link` and `unlink` in the edge order, and `edit` each refined ticket. A
   `move <id> cancel` runs last, after the edges that replace that ticket have landed.
4. Read back: `list <milestone>` once for a milestone, and `show` each ticket a change touched.
   Every new ticket is there, at `backlog`, with exactly the approved blockers; every existing one
   shows exactly the drafted change, and its status and holder unless the draft changes them. A
   ticket missing from its milestone is a failed write: `show` it, report it, and never move it.
5. Only when all of that matched, `move <id> ready` for each ticket approved for `ready`. If
   publishing showed one is unsafe to start, leave it at `backlog` and ask.

On a failure, report what landed and what is missing. A rerun reads the milestone and `show`s each
reported id, then creates only what is missing; never recreate a ticket that exists. Tickets an
earlier run left at `backlog` are part of this publication, not reused: check them like new ones,
`link` any approved edge they lack before step 4, and option 1 moves them to `ready` too. Report,
never remove, an edge not in the table.

## 6. Report

Report the tickets created or changed with ids or URLs and edges, which are `ready` and which stay
at `backlog` and why, unresolved prerequisites, failures, and work sent to `wkc-research`,
`wkc-architect`, or `wkc-plan`. Run `wkc-backlog` again when the next milestone needs tickets.

## 7. Calls from wkc-yolo

A call is unattended only when it passes `--run <ref>`; without it, the call is manual, whatever
its text says. First read the run config with `wkc-tracker run show <ref>`. When that refuses, stop:
report the refusal, publish nothing, and ask nothing. The config holds the run's limits. Such a call
brings one change and never ends a turn on a question. The run is the approval: once the graph check in section 3 passes, publish as section 5
says, with no section 4 question. New tickets stay at `backlog`, and no ticket moves to `ready`,
because which new tickets run is `wkc-yolo`'s decision. Wherever this skill would ask, decide from
the tickets, PRD, SPEC, ROADMAP, and limits, and post the decision with `wkc-tracker comment` on the
ticket the change came from:

```
Decision (wkc-yolo): <question>
Choice: <what was chosen>
Source: <PRD, SPEC, or ROADMAP section, the ticket, or the run limit>
```

When they leave it undecided, park: post this on that ticket, publish nothing, keep every status,
stop, and return `parked`:

```
Parked (wkc-yolo): <question>
Open because: <what the documents and limits leave undecided>
Needs: <who must answer>
```

**Moving a requirement.** A change that moves a requirement out of a ticket's definition of done,
such as a production step, runs only for a ticket the config's `Moved by the person:` line names,
and only as that line says. Any other such move parks that ticket with `Needs: a person` and
changes nothing. For a move to a release ticket, create one at `backlog`, blocked by and related to
the original, with the moved text word for word in its **Notes**. Then `edit` the original to drop
that text and list the release ticket under `## Related`. A move to the run PR's review checklist
drops the text from the original and returns it to `wkc-yolo`. Post the decision on the original,
with a `Source:` that names the `Moved by the person:` line.

Return what section 6 reports.
