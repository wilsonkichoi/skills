# Porting a skill from agent-toolkit

The skills come from `wilsonkichoi/agent-toolkit` one at a time, one pull request each, so every
one gets read and validated against its runbook before the next starts. `README.md` holds the roster
and the order.

1. **Read the source** `SKILL.md` and list its dependencies: runtime contracts, `scripts/*.py`,
   subagent definitions, `assets/`.
2. **Rule on each dependency** before writing anything. Inline it into `SKILL.md`, keep it as a
   sibling `.md` in the skill directory, replace it with a call to the `wkc-tracker` skill, or drop it.
   A ported script needs a written reason.
3. **Rewrite, do not copy.** Cut agent-toolkit-specific policy on sight: fork contributions,
   canonical-repository permission boundaries, version migration sections, tuning knobs like
   `work_in_progress_limit`. `max_fix_attempts` is the exception, kept as a config field by
   [ADR-003](adr/ADR-003-review-and-fix-rounds.md). Something re-earns its place only when its
   absence breaks the skill.
4. **Apply the conventions in `AGENTS.md`**: the [Skill template](../../AGENTS.md#skill-template),
   every invocation setting, `agents/openai.yaml`.
5. **Feed the contract back into `wkc-setup`.** A new config field means editing
   `skills/wkc-setup/config-template.md` and the `wkc-setup` interview in the same pull request. No skill
   reads a field `wkc-setup` never writes.
6. **Validate** under [Validation](../../AGENTS.md#validation): establish baseline coverage with the skill's
   runbook at `validation/wkc-<name>.md`, including installed invocation on each supported harness where available.
   Run installer and filesystem checks directly in throwaway projects. A runbook is a
   numbered list of cases, each with an independent check that decides PASS or FAIL, ending in a
   report. A case that could not run is SKIP and never PASS: an untested claim recorded as a pass is
   how a defect reaches a user. Cases needing a second terminal, a second account, or a service with
   no credentials here are marked `[MANUAL]` and are expected to be skipped on an unattended run.
   Write one for every skill that gets ported.

   Runbooks are tracked and public on purpose. A reviewer can read what the skill was tested against
   without installing anything, and disagree with the coverage rather than only with the code. The
   cost is that a runbook rots like any other checked-in file, which is what
   [pre-commit item 5](../../AGENTS.md#pre-commit-checklist) is for: a stale runbook is worse than
   none, because it reports PASS.
7. **Run the pre-commit checklist**, then branch, push, and open the pull request.
