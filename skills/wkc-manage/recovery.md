# Backups and recovery

Read this before any mutation, including update, replacement, removal, and rollback.

Use a unique operation directory under `~/.cache/wkc-manage/backups/<repo>-<timestamp>/`.
Use a filesystem-safe repository label and avoid collisions without overwriting earlier backups.
Resolve the checkout, backup root, backup parent, and all discovery roots before copying.
Require the resolved backup location outside the checkout and every project and global harness discovery directory.
Include `~/.claude/skills`, `~/.agents/skills`, `~/.codex/skills`, and `~/.kiro/skills`, plus configured or discovered alternatives.
Stop on a symlink or path relationship that places backups inside any such directory.
Never use temporary storage for durable backups.

Preserve complete affected contents, independent copies, symlink targets and link text, placement information, and the raw lock.
Back up resolved canonical contents as well as links, without copying unrelated skills.
Record which files and lock entries the operation intends to change.
Verify the backup against current content and link evidence before proceeding; report its path.
Fresh installation still records prior absence and relevant lock evidence before writing.
Do not store backup `SKILL.md` files in a consumer discovery directory.

On failure, stop later mutation and inspect actual files, links, and raw lock state.
Retain the backup after every failed operation, including after a successful recovery.
Recover only affected installations and lock entries, using explicit names and harnesses for installer mutations.
Prefer verified source reinstallations with the original modes and refs where content is unchanged from that source.
Restore backed-up local contents and links only when that restoration is authorized and confined to affected paths.
Never restore the entire old lock over unrelated concurrent changes.
Re-read a valid schema `1` lock before restoring only affected entries; stop if the current lock became incompatible.
If concurrent edits affect recovery destinations, retain evidence and ask before overwriting them.
Verify recovered files, links, accessibility, and affected provenance independently.
Report completed steps, actual remaining state, and any recovery conflict.

After a wholly successful and verified operation, delete only that operation's backup.
Do not delete earlier backups or backups from a failed attempt.
