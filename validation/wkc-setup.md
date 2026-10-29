# wkc-setup validation

Follow [Validation](../AGENTS.md#validation). This catalog covers the review-round field added by #54, the
`run_config` field added by #78, the `push_check` field added by #76, and the AI test allowance added by #91. It does not claim baseline coverage of the
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
   rule names Sections A to E.
5. **Write the store.** In a throwaway public GitHub project, run setup and choose `github-variable`.
   PASS: the warning about the public repository appears before the choice is taken, and the written config holds
   `run_config: github-variable`.

6. **Push check field.** Direct. `grep -n push_check skills/wkc-setup/SKILL.md skills/wkc-setup/config-template.md`,
   and parse the template's YAML frontmatter.
   PASS: Section D asks for `push_check`, offers the gitleaks command first with a check that `gitleaks` is installed,
   then the project's own command and none, and says a manual push without one only warns. PyYAML parses the template
   value as the gitleaks command string, and its comment says the default is none.

7. **AI test allowance field.** Direct. Read Section D and parse the config template's YAML frontmatter.
   PASS: Section D asks for `max_ai_test_sessions_per_attempt` as an integer, 0 or more, recommends `6`, says each
   build and each review round has its own allowance, that it is a ceiling, and that `0` starts none. The template
   parses it as integer `6`, and this repository's config parses `max_fix_attempts: 5` and
   `max_ai_test_sessions_per_attempt: 6`.
8. **Existing allowance.** Run setup on a fixture whose config has `max_ai_test_sessions_per_attempt: 2` and no
   `max_fix_attempts`.
   PASS: the value stays `2`, setup asks only for the missing `max_fix_attempts`, and the body is unchanged.

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
