# wkc-code-review decisions, and calls from wkc-yolo

[SKILL.md](./SKILL.md) points here for the decision formats, in every call, and section 7 reads
this file whole on a call with `--run <ref>`.

## Contents

- Decide first
- Open requests and answers
- Calls from wkc-yolo

## Decide first

When the ticket, PRD, SPEC, ROADMAP, and limits settle a choice the round has to make, decide, act,
and post the decision on the ticket with `wkc-tracker comment`:

```
Decision (wkc-code-review): <question>
Choice: <what was chosen>
Source: <PRD, SPEC, or ROADMAP section, the ticket, or the run limit>
```

A manual round lists its Decisions in its report, so the person can reverse one. It asks only when
the documents are silent or conflict, or the choice is costly or hard to undo: it gives a
recommendation and its reasons. When the round cannot finish without that answer, such as more AI
test sessions, a check only a person can confirm, or a choice the documents leave undecided, its
verdict is `needs-decision` (SKILL.md section 5). Deciding never approves a head the review did not
clear, and never makes a change the review would not make.

## Open requests and answers

A request is open from a `needs-decision` verdict until an `Answer:` comment follows it from an
account with write access, or a later head or config change resolves it, such as a raised
`max_ai_test_sessions_per_attempt`. A person answers on the pull request:

```
Answer: <the decision>
To: <link to the needs-decision record, verdict, or finish comment>
```

A round that finds the latest verdict an open `needs-decision` reports the request and posts
nothing (SKILL.md section 2). With an answer, the next round reads it as its input for that choice,
and never treats it as a finding or a change of scope.

## Calls from wkc-yolo

A call is unattended only when it passes `--run <ref>`; without it, the call is manual, whatever
its text says. First read the run config with `wkc-tracker run show <ref>`. When that refuses, stop:
report the refusal, post nothing, and ask nothing. The config holds the run's limits, and a lower
`max_fix_attempts` there replaces the project config's. Such a call never ends a turn on a question.

Wherever this skill would ask, decide from the ticket, PRD, SPEC, ROADMAP, and limits, as **Decide
first** says. Limits stay ceilings. With the AI test sessions spent, a check still unrun is SKIP, on
the verdict's `SKIP:` line, and a finding it would have confirmed is a suggestion that says what is
unconfirmed. Leave `needs-decision` for a choice the documents and limits leave truly undecided.
Then post the `needs-decision` verdict with its `Open requests:` line naming who must answer, make
no change, stop, and return `needs-decision`. That verdict parks the ticket; its status stays.

`Discovered:` comments are posted as in SKILL.md section 3. Then call `wkc-backlog <the item and its
evidence> --run <ref>` for each one, in this session: from a step it only creates a ticket or
reuses one that matches, and returns a needed SPEC or ROADMAP change instead of making it. Return
each ticket's id, why the work is out of scope, and whether it blocks the ticket. Post no `Run:`
comment and move no ticket you filed. A blocker is filed at once, and the round stops with no fix
and no verdict.
