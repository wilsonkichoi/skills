# wkc-setup validation

Follow [Validation](../AGENTS.md#validation). This catalog covers the review-round field added by #54.
It does not claim baseline coverage of the rest of setup.

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

## Dated report: 2026-10-22

Scope: #54's new field only. Selected case 1 directly and cases 2 and 3 as unavailable behavior checks.
No backend writes or AI sessions ran. Review source: PR #58 at `af1dcf0`.

| Case | Result | Evidence |
|---|---|---|
| 1 | PASS, direct | Section D asks for the field, states integer 0 or more, recommends 3, and explains the review-only round. PyYAML parses the template value as integer 3. The branch diff adds no `merge_gate`. |
| 2 | SKIP | No new AI sessions or fixture writes allowed in this review. Writing a chosen value was not established by the original code-review report's field-presence check. |
| 3 | SKIP | The same review limits apply. Existing-value preservation has not been exercised for this new field. |
