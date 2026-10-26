# wkc-setup validation

Follow [Validation](../AGENTS.md#validation). This catalog covers the review-round field added by #54 and the
`run_config` field added by #78. It does not claim baseline coverage of the rest of setup.

## Cases

1. **Review-round field.** Direct. Read Section D and parse the config template's YAML frontmatter.
   PASS: Section D asks for `max_fix_attempts` as an integer, 0 or more, recommends `3`, and explains the final
   review-only round. The template contains integer `3` and documents the allowed values and default.
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
