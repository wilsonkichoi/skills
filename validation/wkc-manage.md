# wkc-manage validation

Run installed copies from a clean candidate export on Codex, Claude Code, and Kiro CLI.
Use `skills@1.7.0`. Codex behavioral runs use `gpt-6-luna`.
Each numbered case has an independent check. Record PASS, FAIL, or SKIP per harness.
A partial case is SKIP, with completed checks listed. Keep initial failures when a later candidate fixes them.
Installer messages, lock entries, source inspection, and manual commands alone do not prove harness behavior.

## Preparation

Record source commit, export method, all packaged file hashes, tools, commands, and exact test-only identity substitution.
Keep scratch data outside the repository. Never install a populated working tree, because ignored files can be copied.
Export the candidate with `git archive`, then install it into independent consumer repositories:

```sh
npx skills@1.7.0 add "<clean-candidate>" --skill wkc-manage -a claude-code -a codex -a kiro-cli -y
```

Compare every installed manager directory recursively against the candidate archive before invocation.
Create a disposable public fixture repository for release-dependent cases. Record its name; never delete it.
Change only the test manager's labeled Repository identity field to that repository.
Include equivalent test copies in fixture tags so target archive comparisons include that same identity substitution.
Keep an unmodified installed copy for ownership isolation checks against the real collection.
Use legacy `setup` and `tracker` from collection `v0.0.8` for the fixture's legacy tag.
Publish stable fixture `v0.0.9` and `v0.0.10`, make Latest point below the numeric maximum, and include a draft,
prerelease, and orphan tag above both. Read the complete release list independently.
Keep extra source sentinels and unrelated lock entries in consumers to detect unintended writes.

Before designing the skill, probe the installer directly in disposable consumers:
unpinned, exact-tag, legacy, symlink, all-three copy, retained-harness copy, selective removal, unsupported locks, and wildcard internal exclusion.
Record exact commands, raw locks, link targets, resolved paths, and complete archive comparisons.
Stop on an observation contradicting the approved design; settle it before writing the skill.

## Cases

1. **Package and actual loading.** List public and explicit internal discovery. Count source skill definitions separately.
   Invoke the installed manager on each harness, with no operation.
   PASS: four public skills, five shipped skills, no template; five opening fields, matching identifiers, manual settings,
   no scripts; every packaged file matches the clean archive; transcript shows actual skill loading and status behavior.

2. **Lock schema gate.** Independently use schema `1`, malformed JSON, schema `0`, and schema `2`.
   Invoke `status`, `reconcile`, and a mutation on each invalid lock; also test malformed entries under schema `1`.
   PASS: valid schema operates; every invalid variant stops without installer execution, report, exclusion, or lock writes.
   Compare raw lock bytes, complete consumer files, and Git exclusions before and after.

3. **Read-only status and external changes.** Invoke without an operation, then change an owned installation with the external installer.
   Invoke again, including offline status and a failing remote API read.
   PASS: each recomputes current paths and provenance, creates no report or exclusion, preserves checkout bytes,
   and never interprets failed remote verification as absent releases or ownership.

4. **Target selection.** Request update without a release against the fixture's stable, draft, prerelease, and orphan tags.
   Also request each ineligible target explicitly, and interrupt release-list access.
   PASS: paginated complete listing selects numeric stable `v0.0.10` despite Latest `v0.0.9`;
   ineligible or unreadable targets stop without mutation. Remote refs and releases remain unchanged.

5. **Add all and explicit maintainer.** Add all public skills into named harnesses, then explicitly add `wkc-skills-release`.
   Repeat add-all with a separate fixture export lacking only boolean internal metadata.
   PASS: explicit names and `-a` arguments, public set present, maintainer absent from add-all even under fallback,
   explicit maintainer present afterward; every actual directory matches its target archive.

6. **Layouts and set preservation.** Install symlink and independent-copy consumers, plus a mixed layout.
   Update only the installed set while the target ships an additional public skill.
   PASS: names, accessible harnesses, and per-placement mode remain unchanged; pins advance to the exact target;
   no new skill is installed; every copy and canonical directory matches the target archive.

7. **Divergent copies and edits.** Modify a supporting file in one independent copy; separately add an extra file and break a link.
   Request update and removal without authorizing edit loss.
   PASS: differences are named, mutation stops, and every original byte and placement remains intact.

8. **Unknown ownership and missing locks.** Use a foreign owner with a `wkc-` name, an unprefixed owned legacy name,
   a destination without a lock, and an empty fresh consumer.
   PASS: source evidence determines ownership; existing unowned files are preserved;
   fresh named installation works without claiming pre-existing files. Compare unrelated lock entries and files.

9. **Legacy bootstrap and both renames.** Install fixture legacy `v0.0.8`, then bootstrap only the manager from a published candidate tag.
   Inspect and request update, first withholding migration approval, then confirming the exact migration.
   PASS: numbered question ends the first turn without writes; verified backups precede mutation;
   target guidance supplies both mappings; replacements verify before legacy removal; final content, links, and lock entries are correct.
   If other canonical consumers prevent cleanup, record the completed steps as partial SKIP, not migration success.

10. **Failed replacement [MANUAL when controlled failure is unavailable].** Fail one replacement installation after backup.
    PASS: legacy originals remain accessible, later removals do not run, failure state is reported,
    and durable backups survive. Independently inspect files, links, and lock evidence.

11. **Shared canonical selective removal.** Request Codex-only removal while Claude Code and Kiro retain links.
    First withhold mode-change approval; then approve concrete conversion in a consumer without other canonical users.
    PASS: the first turn ends on a numbered question; after approval retained placements become independent copies;
    complete retained content matches original tags; canonical files are absent and Codex cannot access the removed skill.

12. **Other canonical consumers.** Use an environment where another detected harness shares `.agents/skills/`.
    Request selective and complete supported-harness removal.
    PASS: the constraint is identified before destructive conversion, remaining users and global directories stay intact,
    and the skill never treats installer success or a surviving lock entry as proof of removal.

13. **Dependencies and setup configuration.** Install a skill declaring a runtime dependency on a selected removal target.
    Separately remove setup after it produced project configuration.
    PASS: dependency warning precedes an informed approval question; setup's generated configuration and context reference survive.
    Verify the short setup report reference without adding installation-state configuration or implicit calls.

14. **Self-update and self-removal.** Update the installed manager to an exact published target, then remove it in a fresh invocation.
    PASS: complete manager content and provenance verify; update reports previously loaded instructions;
    removal verifies actual absence and preserves unrelated skills. Layout constraints must be reported accurately.

15. **Unintended downgrade.** Install a higher fixture release, then request a lower target without downgrade authorization.
    PASS: the turn ends on a numbered question with exact old and proposed versions; files and lock remain unchanged.
    Approve that exact downgrade separately and require complete matching lower-release content afterward.

16. **Durable backups and partial failure [MANUAL when controlled interruption is unavailable].** Fail after one affected write.
    Also point the backup root through a link into a discovery directory or checkout.
    PASS: unsafe backup location stops before copying; valid backup lies under the durable root outside all discovery roots,
    preserves contents, links, and raw lock; survives failure and safe recovery without overwriting unrelated concurrent changes.

17. **Explicit harnesses and source preservation.** Put source sentinels under consumer `skills/<selected-name>/`.
    Add and remove owned placements with explicit names and harnesses.
    PASS: transcript uses no wildcard, broad, global, or `-a`-less mutation;
    source sentinels and unrelated skills survive, with complete intended file comparisons.

18. **Linked-worktree reconciliation.** Invoke `reconcile` in a linked worktree with an existing exclusion sentinel.
    Repeat it, and separately present a tracked report or a symlink destination.
    PASS: only the optional report and resolved local exclusion change; prior exclusions remain;
    report is ignored and untracked before and after writing; conflicts stop; report fields describe actual evidence.

19. **Provenance verification.** Compare pinned copies with the exact archive, then inspect equal unpinned content,
    a stale lock entry, mixed release pins, and differing supporting files.
    PASS: complete differences are detected, unpinned matching bytes do not become a historical pin,
    and a common release is reported only when every managed installation verifies against it.

20. **Repository integration.** Re-read issue #13, its corrections, and the pre-commit checklist.
    PASS: next patch version once, one timestamped changelog row, shipped roster, Install/Uninstall and bootstrap documentation,
    authoring policy separated from runtime rules, release fallback cross-reference, short setup report reference,
    and no scripts, hooks, build steps, or per-skill versions. PR uses `Refs #13`, lists deviations and SKIPs, and remains unmerged.

## Report

Record commands, source commit, packaged hashes, fixture names, release IDs, archive SHAs, and observed files and links here.
Give each case a per-harness result. Partial coverage is SKIP; failed attempts remain FAIL after correction.
Do not cite absolute paths to ignored logs as evidence. This report must be readable without scratch files.
Production merge and publication are outside this PR. No production release is authorized by validation.

## Installer observations: 2026-10-02

Base: `5116ec83c6397015b03b517ab4aca7ba9ad7945a`, collection VERSION `0.0.13`.
Pinned archive: `v0.0.13`, commit `57276ceb4a73b8b69a564ab9073a10ee48e70999`.
All probes used disposable consumers under `~/tmp/wkc-manage-installer-20261002/`.

Exact install commands, each in its independently initialized consumer:

```sh
npx skills@1.7.0 add wilsonkichoi/skills --skill wkc-setup -a claude-code -a codex -a kiro-cli -y
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills.git#v0.0.13' --skill wkc-setup -a claude-code -a codex -a kiro-cli -y
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills.git#v0.0.8' --skill setup tracker -a claude-code -a codex -a kiro-cli -y
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills.git#v0.0.13' --skill wkc-setup --copy -a claude-code -a codex -a kiro-cli -y
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills.git#v0.0.13' --skill wkc-setup --copy -a claude-code -a kiro-cli -y
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills.git#v0.0.13' --skill '*' -a claude-code -a codex -a kiro-cli -y
```

The wildcard above is an explicitly requested installer compatibility probe, not a manager mutation pattern.
All returned exit `0`. The wildcard selected exactly `wkc-setup`, `wkc-tracker`, and `wkc-workflow-diagram`.
Boolean-internal `wkc-skills-release` was absent from both installed files and the lock.

Unpinned lock, complete shape:

```json
{"version":1,"skills":{"wkc-setup":{"source":"wilsonkichoi/skills","sourceType":"github","skillPath":"skills/wkc-setup/SKILL.md","computedHash":"7e3a08b0818206788673cd9db0bef38a3e859d332ecd840a76a5c31aa05417d6"}}}
```

Pinned installation added only `"ref":"v0.0.13"` to that entry. Copy mode had the same lock entry.
Legacy entries retained the same owner and `ref: v0.0.8`, with paths `skills/setup/SKILL.md` and `skills/tracker/SKILL.md`.
Their hashes were `46a2f5b2a0c1f403a88acb212f467a58bbd7e1f1062f4cdb1cfb945956de378e` and
`ae7f637e8a0f77baef10afb5de84383923be311301d596f491f42d1661182c88` respectively.
No lock contained harness selection or installation mode.

Symlink installation produced canonical `.agents/skills/<name>` directories and links at `.claude/skills/<name>` and `.kiro/skills/<name>`.
Both links contained `../../.agents/skills/<name>` and resolved to the canonical directory.
All-three copy installation produced three independent directories, including Codex's `.agents/skills/<name>`.
Claude Code and Kiro copy installation alone produced independent directories with no canonical entry.
Recursive `diff -r` against `git archive` of the pinned commit returned `0` for every current installed path,
including unpinned setup and all wildcard selections. Legacy archive comparisons are recorded with the later validation runs.

Selective and complete supported-harness removal commands:

```sh
npx skills@1.7.0 remove wkc-setup -a codex -y
npx skills@1.7.0 remove wkc-setup -a claude-code -a codex -a kiro-cli -y
npx skills@1.7.0 remove wkc-setup -a codex -y
npx skills@1.7.0 list -a codex
```

Each removal returned `0` and printed `Successfully removed 1 skill(s)`.
The first preserved canonical files, both retained links, and the lock entry.
The second removed both links but preserved canonical files and provenance. The third still preserved them.
The final list reported `wkc-setup` accessible to Codex with the original owner.
Installer source skips direct canonical deletion, then checks other detected agents before deleting canonical files or provenance.
This machine has Antigravity, Antigravity CLI, Gemini CLI, GitHub Copilot, and OpenCode detection directories.
Those harnesses also use canonical project paths. This is the issue's permitted layout constraint, not successful selective removal.
No global directory was modified. No broad removal or manual canonical deletion was used.

For schema probes, independently seeded locks used versions `0` and `2`, an owned setup entry, and a foreign sentinel entry.
Each ran the following command:

```sh
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills.git#v0.0.13' --skill wkc-tracker -a codex -y
```

Schema `0`: exit `0`; output lock became version `1`, with only the new tracker entry. Existing setup and sentinel provenance vanished.
Schema `2`: exit `0`; output lock kept version `2`, setup, and sentinel, then added tracker without schema rejection.
Both created tracker files. These observations require the manager's pre-installer raw lock gate on all operations.
