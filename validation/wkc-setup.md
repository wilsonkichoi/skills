# wkc-setup validation

Follow [Validation](../AGENTS.md#validation). This catalog covers the review-round field added by #54, the
`run_config` field added by #78, the `security_scan` field added by #76 (named `push_check` until PR #100), the AI test allowance added by #91, the `uv` prerequisite added by #94, the execution model fields added by #83, and the required fields and `max_parallel_workers` added by PR #100. It does not claim baseline coverage of the
rest of setup.

## Cases

1. **Review-round field.** Direct. Read Section D and parse the config template's YAML frontmatter.
   PASS: Section D asks for `max_fix_attempts` as an integer, 0 or more, recommends `5`, and explains the final
   review-only round. The template contains integer `5` and documents the allowed values and default.
   The #54 branch diff adds no `merge_gate`.
2. **Write the answer.** In a throwaway project, run setup with `max_fix_attempts` missing. Choose `0`, then repeat
   in another fixture choosing `1`.
   PASS: each written config contains the chosen integer, parsed independently with YAML. A project without tests
   omits `test_command` but still gets `max_fix_attempts`. No later interview question appears before the answer.
3. **Existing choice.** Run setup on a fixture that already has `max_fix_attempts: 1` and a custom config body.
   PASS: the value and body remain unchanged, and setup does not ask for a replacement value.
4. **Run config store.** Direct. Read Section E and parse the config template's YAML frontmatter.
   PASS: Section E offers `tracker`, `github-variable`, and `command <cmd>` with `tracker` first, warns that a
   `tracker` issue on a public GitHub repository is public, that Linear and local cannot detect an edit, and that
   every Actions workflow can read a variable; the template parses `run_config` as `tracker`; the multi-question
   rule names Sections A to F (A to E before #83).
5. **Write the store.** In a throwaway public GitHub project, run setup and choose `github-variable`.
   PASS: the warning about the public repository appears before the choice is taken, and the written config holds
   `run_config: github-variable`.

6. **Security scan field.** Direct. `grep -n security_scan skills/wkc-setup/SKILL.md skills/wkc-setup/config-template.md`,
   and parse the template's YAML frontmatter.
   PASS: Section D asks for `security_scan`, offers the gitleaks command first with a check that `gitleaks` is installed,
   then the project's own command and none, says a manual push without one only warns, and offers to rename an
   existing `push_check` key, keeping its value. PyYAML parses the template value as the gitleaks command string, and
   its comment says the field is optional and absent means no scan. Updated for PR #100 note 20.

7. **AI test allowance field.** Direct. Read Section D and parse the config template's YAML frontmatter.
   PASS: Section D asks for `max_ai_test_sessions_per_attempt` as an integer, 0 or more, recommends `6`, says each
   build and each review round has its own allowance, that it is a ceiling, and that `0` starts none. The template
   parses it as integer `6`, and this repository's config parses `max_fix_attempts: 5` and
   `max_ai_test_sessions_per_attempt: 6`.
8. **Existing allowance.** Run setup on a fixture whose config has `max_ai_test_sessions_per_attempt: 2` and no
   `max_fix_attempts`.
   PASS: the value stays `2`, setup asks only for the missing `max_fix_attempts`, and the body is unchanged.
9. **`uv` for the GitHub backend.** Direct. Read Section A's prerequisite table.
   PASS: the `github` row checks `uv --version` beside `gh auth status` and the remote, and says `wkc-tracker`
   cannot run on GitHub without it. New, from #94 (ADR-011).

10. **Execution model fields.** Direct. Read Section F and parse the config template's YAML frontmatter.
   PASS: Section F says the pair is for `wkc-yolo` runs and a manual call runs in its own session; it offers the
   default pair first, another pair, and none; it says a missing `effort` is `medium`, that a pinned Claude ID runs
   through `claude -p`, that a pair entry may be `claude-code`, `codex`, or `kiro-cli`, that each headless launch
   checks the CLI's login, that `codex` must use a ChatGPT login and no API key, and that `claude-code` uses the
   configured Claude provider, whether a subscription, an API key, a gateway, Bedrock, or Vertex; it gives the `claude --dangerously-skip-permissions`,
   `~/.claude/settings.json` `bypassPermissions`, Codex, and Kiro CLI launches, and that project settings cannot turn
   bypass mode on. The template parses `execution_models` as two maps, `claude-code`/`opus`/`medium` then
   `codex`/`gpt-6.1-sol`/`medium`, and `headless_workers` as `[claude-code, codex, kiro-cli]`; the multi-question rule
   names Sections A to F. Updated for PR #100 notes 11, 12, and 15.

11. **Write the pair.** In a throwaway project, run setup with both fields missing and choose the default pair and
   the default workers.
   PASS: the written config parses as case 10's template values. Updated for PR #100 note 11.

12. **Additional-ticket allowance.** Direct, then a throwaway project. Read Section D and parse the template.
   PASS: Section D asks for `max_additional_tickets` after `max_ai_test_sessions_per_attempt`, an integer, 0 or
   more, `5` recommended, and says initial tickets never count and `0` admits nothing new; the template parses it
   as `5`; Section E names initial tickets and the allowance, not a budget. In the project, accepting the default
   writes `max_additional_tickets: 5`. New, from #74.

13. **Required fields and the worker limit.** Direct, then a throwaway project. Parse the template, and run setup
   on a config that has `issue_tracker` and `push_check` only.
   PASS: every field the SPEC's Config fields table marks required carries `required` in its template comment, with
   its setup default; `max_parallel_workers` parses as `5`, `integer, 1 or more`. Setup asks for each missing
   required field, writes them all, offers the `push_check` rename, and leaves the body unchanged. New, PR #100
   notes 1, 2, and 20.

## Dated report: 2026-10-22

Scope: #54's new field only. Selected case 1 directly and cases 2 and 3 as unavailable behavior checks.
No backend writes or AI sessions ran. Review source: PR #58 at `af1dcf0`.

| Case | Result | Evidence |
|---|---|---|
| 1 | PASS, direct | Section D asks for the field, states integer 0 or more, recommends 3, and explains the review-only round. PyYAML parses the template value as integer 3. The branch diff adds no `merge_gate`. |
| 2 | SKIP | No new AI sessions or fixture writes allowed in this review. Writing a chosen value was not established by the original code-review report's field-presence check. |
| 3 | SKIP | The same review limits apply. Existing-value preservation has not been exercised for this new field. |

## Dated report: 2026-10-26, run branch and run config (#78)

Scope: Section E and the `run_config` template line. Candidate `455f4e8`. No AI sessions: the change's approved
sessions went to the callers.

| Case | Result | Evidence |
|---|---|---|
| 4 | PASS, direct | Section E lists `tracker`, `github-variable`, and `command <cmd>`, `tracker` first, with the public-issue, undetected-edit, and Actions-workflow warnings; PyYAML parses `run_config` as `tracker`; the picker rule names Sections A to E. |
| 5 | SKIP | No session left in the approved budget to run the interview. |

## Dated report: 2026-10-28, push check field (#76)

Scope: Section D's `push_check` question and the template line. Candidate `8592d7e`. No AI sessions: the change's
sessions went to the callers.

| Case | Result | Evidence |
|---|---|---|
| 6 | PASS, direct | `grep -n push_check` shows Section D lines 143 and 150 and template line 14. Section D offers the gitleaks command first with `command -v gitleaks`, then the project's own command and none, and says a manual push without one only warns. PyYAML parses the template value as `gitleaks git --redact --log-opts="origin/main..HEAD"`, and its comment says default none. |

## Dated report: 2026-10-28, AI test allowances (#91)

Candidate `ee9c162`. Direct checks only; no AI sessions.

| Case | Result | Evidence |
|---|---|---|
| 1 | PASS, direct | Section D recommends `5`; PyYAML parses the template's `max_fix_attempts` as integer `5`. |
| 7 | PASS, direct | Section D asks for `max_ai_test_sessions_per_attempt`, recommends `6`, names both attempt kinds, and says it is a ceiling and `0` starts none. PyYAML parses the template value as integer `6`, and this repository's config as `5` and `6`. |
| 8 | SKIP | Needs a setup session; the allowance went to the skill cases. |

## Dated report: 2026-11-05, step 5 validation (PR #100)

Final candidate `582ec14`. Static checks at `c028642`; model calls in M (`codex exec`
gpt-6.1-sol medium on the Codex fixture, `582ec14`) and M2 (Claude cloud subagent sonnet medium,
`0e649b2`). Evidence under `~/tmp/pr100-handoff/evidence/M/` and `M2/`.

| Case | Result | Evidence |
|---|---|---|
| 6, 10, 12 | PASS, direct | Section D and F reads; the template parses as each PASS list says. |
| 11 | PASS | M (after one unscored launch on a fixture whose `AGENTS.md` preselected the pair) and M2. M appended a repository body note, outside this PASS list. M2 made a `head`-truncated config read, asked for two existing fields, and reverted them before the end. |
| 13 | PASS | Static part, then M and M2: every missing required field asked and written, the `push_check` rename offered with its value kept, body unchanged. M2 also ran `gh auth status` once. |

Case 12's throwaway-project write was not run as its own case.
