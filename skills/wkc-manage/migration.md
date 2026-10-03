# Rename migration

Read this when a target release replaces installed identifiers.
These documented collection renames have no compatibility aliases:

| Legacy identifier | Replacement |
|---|---|
| `setup` | `wkc-setup` |
| `tracker` | `wkc-tracker` |

Confirm these mappings against migration guidance in the exact target archive, including its root README.
Do not infer other renames from similar names or missing target directories.
If the target provides no usable guidance, stop and ask rather than dropping an installed skill.
Ownership still requires matching lock source evidence for legacy identifiers.

Show each replacement, recorded source, target commit, affected harnesses, placement, and dependency effects.
Check replacement destinations and local modifications before seeking confirmation.
Explain that installed runtime references to legacy names can break; do not rewrite unrelated project files automatically.
Obtain confirmation for this concrete migration, then back up under the durable root described in `recovery.md`.

Install replacements from the exact target tag with explicit names and harnesses, preserving copy or symlink mode.
Verify every replacement against the complete archive before removing any legacy installation.
A failed replacement leaves the original available. Stop subsequent migration and retain recovery evidence.
After verified replacement, apply the removal checks in `removal.md` to the legacy identifiers.
Installer removal can retain canonical legacy files because other detected harnesses use that path.
Report that constraint; do not claim migration completed while legacy files remain accessible.
Finally verify replacements, remaining legacy accessibility, link relationships, and both sets of lock entries.
Never delete legacy configuration previously produced by setup.

## Legacy bootstrap

Adopters on `v0.0.8` have `setup` and `tracker`, without this manager.
Install only `wkc-manage` from a published release containing it, using the full Git URL with that exact tag.
Name the intended harnesses explicitly, then compare the complete installed manager with that tag's archive.
Use the root README's bootstrap command. Do not reinstall the collection wholesale as bootstrap.
Invoke the verified manager to inspect legacy ownership and prepare an update with confirmed migration.
