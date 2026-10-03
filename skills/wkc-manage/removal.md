# Removal and shared canonical files

Read this for removal, including migration cleanup and self-removal.

Inspect installed skill declarations and references for runtime dependencies on the selected identifiers.
Distinguish a runtime call to another skill from configuration that setup produced earlier.
Show broken runtime dependencies and obtain informed confirmation before removal.
Removing `wkc-setup` leaves generated configuration and its context reference intact.
Load all needed instructions before removing the manager itself.

Require lock ownership, known content, and a verified backup before deleting a placement.
Every removal names individual skills and selected harnesses. For example:

```sh
npx skills@1.7.0 remove wkc-setup -a claude-code -a codex -a kiro-cli -y
```

Never use broad, wildcard, global, or `-a`-less removal.
OpenClaw uses a bare project `skills/` directory; broad removal can delete collection source directories.
Check source sentinels and unrelated placements independently after removal.

## Codex-only removal with retained links

Canonical `.agents/skills/<name>` files are visible to Codex.
Retaining those files while removing only a nominal Codex selection does not remove Codex access.
The installer can print success while retaining the canonical directory and its lock entry.

Propose independent copies for retained Claude Code and Kiro CLI placements.
Show affected retained harnesses and explain the mode change; obtain approval before backup or mutation.
Check other consumers of the canonical directory, including the installer's globally detected universal harnesses.
If another harness requires the canonical path, report the layout constraint and stop before removing placements.
Do not broaden the harness list, disable detection, remove global directories, or delete canonical files manually to bypass it.

After approval and revalidation, back up files, link information, and relevant lock evidence.
Remove the selected skill from all affected supported placements through the installer.
Independently check that the canonical directory and affected links are absent before reinstalling retained copies.
If canonical files remain, stop and report incomplete removal; retain backups and recover affected placements when safe.
Install retained skills from their verified source tags with `--copy`, explicit names, and only retained harness arguments.
Claude Code and Kiro CLI copy installation alone creates no canonical directory.
Preserve retained contents; do not use removal as an implicit update to a different release.
If immutable source provenance is unavailable, stop before removal rather than promise an unverifiable reinstall.

Verify retained copies against their complete source archives, and require canonical absence and no Codex accessibility.
Retained copies require their ownership entry to remain in the lock; complete removal requires the owned entry to be absent.
Inspect each result, not just the installer's return code. Self-removal has the same requirements.
Report any detected remaining consumer or broken dependency, never a selective-removal success while canonical files remain.
