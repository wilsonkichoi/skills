# Simplicity

## Rule

Build the smallest design that delivers the requested behavior.
Every added step, check, file, or guarantee must prevent a concrete failure that someone has observed or can reproduce.
A failure that is only imaginable does not justify new machinery.

This rule limits how work is done. It never removes requested scope.
If a requested goal seems costly, deliver a simpler version of it, or ask; do not drop it.

## Why

The first `wkc-manage` design added provenance verification, archive comparisons, backups, recovery,
automatic migration, and saved reports. Nobody asked for them.
It grew to 335 lines across five runtime files and needed a long validation matrix.
The user then asked for a thin wrapper around the installer, and the skill was rewritten at about 100 lines.
The extra machinery cost review time, validation sessions, and tokens, and then had to be removed.

## Before adding machinery

- Name the user request it serves. If none, do not add it.
- Name the concrete failure it prevents and the evidence for it.
- Prefer reporting a limitation over building a workaround for it.
- Prefer one file. Add a supporting file only when the main file cannot carry the content within its budget.
- Do not add verification, backup, recovery, migration, or audit workflows unless the user asks for them.
- When a safeguard would block ordinary use, ask the user before adding it.

## Size check

Keep a `SKILL.md` near 100 lines and well under the 150-line limit in [AGENTS.md](../../../AGENTS.md#prose).
When a draft grows past that, cut machinery first, then wording.
Ask whether a senior engineer would call the design overcomplicated. If yes, simplify it before review.

## Validation

Validation effort follows the size of the change. Follow [Validation](../../../AGENTS.md#validation) and [Token usage](./token-usage.md).
Every guarantee a skill makes needs validation, so each extra guarantee adds validation cost.
