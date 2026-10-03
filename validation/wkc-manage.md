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
   PASS: paginated complete listing selects the fixture's numeric stable maximum despite Latest `v0.0.9`;
   ineligible or unreadable targets stop without mutation. Remote refs and releases remain unchanged.

5. **Add all and explicit maintainer.** Add all public skills into named harnesses, then explicitly add `wkc-skills-release`.
   Repeat add-all with a separate fixture export lacking only boolean internal metadata.
   PASS: explicit names and `-a` arguments, public set present, maintainer absent from add-all even under fallback,
   explicit maintainer present afterward; every actual directory matches its target archive.

6. **Layouts and set preservation.** Install symlink and independent-copy consumers, plus a mixed layout.
   Update only the installed set while the target ships an additional public skill.
   PASS: names, accessible harnesses, and per-placement mode remain unchanged; pins advance to the exact target;
   no new skill is installed; every copy and canonical directory matches the target archive.
   Require complete per-copy comparisons when a shared lock ref advances between installer groups.

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
   manual bootstrap checks raw lock compatibility before invoking the installer;
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
    Require actual agent detection checks; absent global copies of the selected skill cannot establish absent project consumers.

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

### Initial behavioral failure

Candidate `37c91719460e323e6552ce5e9b5fa831d97a2d1e`, Kiro CLI case 12: **FAIL**.
Kiro inspected global skill directories, but did not inspect the other harnesses' detection directories.
It falsely reported no other canonical consumers and proposed a removal sequence that would leave canonical files behind.
It also requested redundant confirmation despite advance authorization for the concrete conversion.
No mutation occurred; locks, canonical files, and retained links remained unchanged.
The removal reference now distinguishes global skill installation from agent detection and requires checking installer definitions.
It also requires source archive comparisons before declaring removal safe. The main skill clarifies conversion authorization.
This initial FAIL remains part of the report after corrected-candidate checks.

## Behavioral report: 2026-10-02 to 2026-10-03

### Sources and transport

The branch started at `5116ec83c6397015b03b517ab4aca7ba9ad7945a`.
Every candidate came from a clean `git archive`, not a populated checkout.

| Candidate | Source commit | Changes tested |
|---|---|---|
| Initial | `37c91719460e323e6552ce5e9b5fa831d97a2d1e` | Initial package and management behavior |
| Corrected | `3575b5bb19dc5fb0907be23d4467212a139e797d` | Actual installer detection and removal preflight |
| Final package | `19120bd171f1d1ca3f74634bf10b166911e536a3` | Bootstrap schema gate and independent comparisons across installer groups |

Export, installation, and independent verification used these commands, with the candidate and consumer substituted:

```sh
git archive 19120bd171f1d1ca3f74634bf10b166911e536a3 | tar -xf - -C <empty-export>
npx skills@1.7.0 add <empty-export> --skill wkc-manage -a claude-code -a codex -a kiro-cli -y
diff -r <empty-export>/skills/wkc-manage <consumer>/.agents/skills/wkc-manage
diff -r <empty-export>/skills/wkc-manage <consumer>/.claude/skills/wkc-manage
diff -r <empty-export>/skills/wkc-manage <consumer>/.kiro/skills/wkc-manage
```

All manager comparisons returned `0` before invocation.
Test copies changed only the labeled Repository identity from `wilsonkichoi/skills` to the fixture below.
No manager instruction or harness setting was changed for a test.
The final fixture manager differs from the final export in that one line only; all sibling files and YAML are identical.

Observed tools: Codex CLI `0.160.0`, Claude Code `2.1.288`, Kiro CLI `2.27.0`, Git `2.54.0 (Apple Git-157)`.
The login shell reported Node.js `24.11.1`; scratch Node execution also reported `26.7.0` in error stacks.
GitHub CLI reported `2.97.0` during initial preparation and `2.102.0` during the final checks.
All installer commands pinned `skills@1.7.0`.
Claude reported `claude-opus-5-5`; Codex always used `gpt-6-luna`.

Actual harness transport, run from each disposable consumer:

```sh
codex exec --ephemeral --json -m gpt-6-luna -s danger-full-access --color never '$wkc-manage <request>'
claude -p '/wkc-manage <request>' --output-format stream-json --verbose --dangerously-skip-permissions
kiro-cli chat --no-interactive --trust-all-tools --output-format stream-json '/wkc-manage <request>'
```

The scratch runner substituted complete natural-language requests for `<request>` and saved stream events.
The downgrade conversation omitted Codex's `--ephemeral`; Claude's approved continuation used `--resume` and the exact reply `2`.
Requests authorized only concrete consumer operations, required unrelated-file preservation, and prohibited remote and production writes.
Source archives remained permitted; the authoring worktree was not test input.
No runner, wrapper, helper script, or log was added to the shipped package.

### Final packaged hashes

SHA-256 hashes of every file under `skills/wkc-manage/` in source `19120bd`:

| File | SHA-256 |
|---|---|
| `SKILL.md` | `dac824f40ba706a790f2db480b246e619cc5a620b66f116d9b54e15a3a778c44` |
| `agents/openai.yaml` | `3cbc13c9fa308f1fc586d138de4b0170f74f2d6b05daf64d9bdae4ec3c850e3d` |
| `migration.md` | `061c9365adc8729d86ff0104c28b621ba0080b3b37653f9e1875673e2b766402` |
| `recovery.md` | `0822a9f7644851af92d50414856a9daa33fc00d3719fdde60711a3efc6e81edc` |
| `removal.md` | `0b88f4497a60513c391aff383a157f6cd4a691dda4afca9af7259cca70d1b817` |
| `verification.md` | `3a5d8211099a6d5caa062e847fed992cc410dcfccbe699cd35e0427d51fc7630` |

The fixture's substituted `SKILL.md` hash is `9154d5b81cfa8b641be70b9e16c8aa7deb989e2a6e9bce10dbc3d3f1d6e415cc`.
The initial candidate's main hash was `fa13f8deeff39d8e493bbbf3be90e0748f5f308a518ab2c6c75ac50f9a241e59`.
Its removal hash was `adf3d5598278081a0797d0da140ed4de502fb4a045ca5096c8e0cbbd2c98b8b8`.
Its migration hash was `6dea6f4d6de29bfabb8588e370f20a6491409edc2ed2e560f92d8cb01376b57e`.
Its verification hash was `df65f1708fe41002ab5fe7d74e78e366a93a2860c08d2e244865f2f606f54c43`.
YAML and recovery hashes were unchanged across candidates.
The corrected candidate already had the final main and removal hashes; migration and verification changed in the final package.

### Public fixture and release evidence

The public fixture is [wilsonkichoi/skills-manage-validation-20261002](https://github.com/wilsonkichoi/skills-manage-validation-20261002).
It remains available for review. No repository was deleted.
Fixture publication supplied the requested release-dependent test data; no collection tag or release was written.

| Tag | Commit | Release ID and eligibility |
|---|---|---|
| `v0.0.8` | `94e4c9916100f94a16b59f11577d7881a7d22648` | `402336590`, stable legacy |
| `v0.0.9` | `22775879fb71c5fbb48033d62e85df608c7f2ab6` | `402336603`, stable, deliberately Latest |
| `v0.0.10` | `bddcd18c3ac77b36df65003c5f394080d6d3a7f7` | `402336596`, stable, initially numeric maximum |
| `v0.0.11` | `bddcd18c3ac77b36df65003c5f394080d6d3a7f7` | No release, orphan tag |
| `v0.0.12` | `bddcd18c3ac77b36df65003c5f394080d6d3a7f7` | `402336611`, prerelease |
| `v0.0.13` | `bddcd18c3ac77b36df65003c5f394080d6d3a7f7` | `402336618`, draft |
| `v0.0.14` | `7f75f8ab73714a0cd38c903e8015836d7eed95e7` | `402348050`, stable corrected candidate |
| `v0.0.15` | `24d8bc0c3217574c55395b5744edd58039d39763` | `402359175`, stable final package |

Legacy fixture content came from collection `v0.0.8`, commit `aa59566adb1f21ef885b2cf046a7783c325065b1`.
Tags `9` and `10` ship identical initial skill contents; `14` ships the corrected candidate.
Tag `15` ships the final package plus a fixture-only supporting-file marker in `wkc-setup/config-template.md`.
That marker forces a real byte difference between installer groups, rather than testing only changing lock refs.
It is not a change to any manager test copy or collection source.

Independent release and tag reads used:

```sh
gh api --paginate 'repos/wilsonkichoi/skills-manage-validation-20261002/releases?per_page=100'
gh api repos/wilsonkichoi/skills-manage-validation-20261002/releases/latest --jq .tag_name
git ls-remote https://github.com/wilsonkichoi/skills-manage-validation-20261002.git 'refs/tags/v*'
git archive <resolved-fixture-commit> | tar -xf - -C <empty-archive>
diff -r <empty-archive>/skills/<name> <actual-installed-directory>
```

Latest stayed `v0.0.9`. The complete list, not Latest, supplied target eligibility.
After creating `14`, the first immediate list did not yet contain it; a subsequent complete list did.
Tests requiring `14` started only after the permitting read confirmed it.

### Completed checks and actual state

**Package and loading.** Final local discovery returned four public names: manager, setup, tracker, and workflow diagram.
Explicit internal discovery returned five total names including `wkc-skills-release`; the template was absent.
Source counting independently found five `SKILL.md` files.
Repository-aware YAML checks passed manual settings, names, ordered opening fields, one identity, six packaged files, and 130 main lines.
All three harnesses actually read installed manager instructions; final-package mixed-layout runs also showed actual loading on all three.

**Schema gates.** Initial Codex and Claude runs each covered twelve independent consumers:
malformed JSON, schema `0`, schema `2`, and schema `1` with numeric `source: 42`, each under status, reconcile, and add.
All refused before installer calls. Parent checks compared raw locks and exclusion bytes, preserved sentinels,
and confirmed no discovery directory or report appeared. Valid schema `1` operated in the successful flows.
Kiro stopped from service throttling before completing this suite.

**Initial update and reconcile.** Each harness updated owned manager and setup from fixture `9` to numeric maximum `10`.
The canonical directories and four links matched the complete archive; both refs became `10`, with exactly two owned entries.
Tracker and workflow diagram were reported as newly available, never added.
Each preserved the unrelated sentinel and created an ignored, untracked report only for explicit reconcile.
Each self-update reported previously loaded instructions.

**Additions.** Codex and Claude enumerated four explicit public names with all three harness arguments and `--copy`.
Independent copies matched the complete `10` archive in all twelve paths; maintainer files and provenance were absent.
Each then explicitly added `wkc-skills-release`; all fifteen directories matched the archive.
The source sentinel under consumer `skills/wkc-setup/` survived.
The metadata-removed fallback variant was not run, so the complete case remains SKIP.
Kiro was throttled after preparation, before any addition; its lock retained only manager at `9`.

**Release refusal.** Codex and Claude each requested orphan `11`, prerelease `12`, and draft `13` in independent consumers.
Both refused all three. The controlled release-list failure returned exit `56` with:

```text
CONTROLLED_API_FAILURE: fixture release listing unavailable
```

Both stopped that update without falling back to another consumer's successful listing.
Independent checks found both owned refs still `9`, complete directories equal to the original archive, and no reports.
No installer ran. Kiro's same suite was throttled before completion.

**Both renames.** Preparation installed legacy `setup` and `tracker` at `8` as independent Claude and Kiro copies,
then bootstrapped only manager at `9` with canonical content and two links.
Codex and Claude completed the expressly approved migration to `10`, using target guidance and verified replacements before removal.
Parent archive checks found four replacement copies and the canonical manager correct; both old names were absent everywhere.
The final schema `1` lock contained only manager, `wkc-setup`, and `wkc-tracker`, all at `10`.
No Codex access was introduced for setup or tracker. Sentinels survived.
Kiro was throttled after replacement and legacy removal, before final harness verification and reporting.
Parent checks found the same final files and refs, but that partial run is SKIP and its backup remained.
Withheld migration approval and controlled replacement failure were not run.

**Canonical constraints.** Initial Kiro case 12 failed as recorded above.
Corrected Codex and Claude inspected pinned installer definitions and the actual five other detection directories.
They refused both selective and all-three removal before backups or writes.
Parent checks found canonical files, links, raw lock, and unrelated files unchanged.
Claude also verified complete original source content; Codex reported that its restrictive test prompt prevented that comparison.
That refusal still occurred before mutation. Kiro's corrected run was throttled.
Successful canonical conversion cannot run on this host while preserving the other detected consumers.
No detection directory was renamed, deleted, or hidden to manufacture success.

**Self-removal.** Corrected Codex and Claude removed the explicitly selected independent manager copies in Claude and Kiro.
Both selected paths were absent. Codex's retained canonical directory matched the exact `14` archive.
The raw lock retained manager at `14`, and the source sentinel under `skills/wkc-manage/` survived.
Both reported other canonical consumers accurately. Kiro was throttled before completing this test.
Complete manager removal from Codex was not claimed or tested around the host's constraint.

**Downgrade.** Claude requested `9` from installed `10` without downgrade authorization.
It ended on numbered options with the recommended keep-current option first. No files or lock changed.
Resuming the same conversation with `2` completed the exact authorized downgrade.
Both refs became `9`; complete directories matched archive `9`, with placement unchanged and the old report untouched.
Codex and Kiro did not run this conversation.

**Controlled partial failure.** Codex and Claude used a disposable installer transport that performed the setup update,
added an unrelated `foreign-sentinel` lock entry and `concurrent.txt`, then returned exit `42`.
Both stopped later updates, inspected actual files and raw lock, and safely recovered only setup at original `9`.
Claude reinstalled setup. Codex found its bytes already equal to both `9` and `10`, then restored only the affected lock entry.
Because tags `9` and `10` have identical skill bytes, this injection proves interrupted writes and provenance recovery, not changed-byte recovery.
Codex batched its final permitting read with that lock write in one tool command, contrary to the required separate-call boundary.
The resulting recovery state passed independent comparisons, but that execution subcheck is FAIL.
Parent checks found both owned skills matching archive `9`, all four links intact, and concurrent changes preserved.
Claude's failed-operation backup remained at:

```text
~/.cache/wkc-manage/backups/wilsonkichoi-skills-manage-validation-20261002-20261003T051630Z
```

It contains original skill directories, links, the original raw lock, the post-failure lock, and `plan.txt`.
Codex retained its independently verified backup under the same durable root:

```text
~/.cache/wkc-manage/backups/wilsonkichoi-skills-manage-validation-20261002-20261002ToaIZ4a
```
Resolved backup placement was outside the checkout and discovery roots.
The unsafe-root variant was not run because changing the shared durable root would affect earlier retained backups.
The injected command failure is a passing recovery subcase, not a successful update.

**Linked worktrees.** Codex and Claude each reconciled twice in a linked worktree with a `.git` file.
Git resolved exclusions to the parent worktree's `.git/info/exclude`.
Only the exact report exclusion was appended, once; `/prior-exclusion-sentinel` remained unchanged.
After each write, `git check-ignore` matched and `git ls-files` returned no report.
Owned files still matched archive `9`; locks and sentinels were unchanged.
Tracked-report and symlink-destination conflicts were not run, so the whole case remains SKIP.

**Offline status and provenance.** All three harnesses invoked the default operation offline after external changes.
Final Codex status also inspected the mixed-layout `15` consumer; a complete parent snapshot stayed byte-identical.
They reported current local refs without fresh remote claims. Raw lock, report, and exclusions stayed unchanged.
Claude separately inspected six independent consumers: edited supporting file plus extra canonical file and broken Kiro link,
unpinned identical content, mixed pins `9` and `10`, stale setup entry, foreign-owner identical files, and missing lock.
It detected each condition and preserved complete consumer bytes.
Equal bytes never supplied ownership or a historical pin. Mixed and unpinned refs produced no common release.
Stale and foreign entries were unresolved; only actually installed, owned, verified manager content supported their limited common-release claim.
Mutation refusals for all edit and collision variants were not run.

### Retained failures and limitations

The initial Kiro detection failure is FAIL, even though corrected Codex and Claude runs passed.
Codex's first migration comparison command also failed before writes because zsh treated the comparison pair as one argument.
It reran explicit paths and completed verification; the failed attempt remains recorded as FAIL.
Automatic approval review rejected that run's recursive backup deletion.
Codex used the supported system Trash operation for only its verified successful backup; source and recovery work were already complete.
No production action was attempted through that rejection.

The generic skill validator first failed because PyYAML was unavailable, then rejected required Claude extensions after PyYAML was supplied.
Those tool attempts are FAIL, not schema defects: this repository explicitly requires the extensions.
Repository-aware checks and actual harness loading passed.
Scratch preparation also had an unmatched JavaScript brace, and one check compared retained `14` content with the later fixture tip.
Both check attempts failed; corrected syntax and the exact `14` archive then passed independently.
An opening-field check omitted the colon in the template's bold field marker and failed before completion.
The corrected check passed without any skill change.

Kiro repeatedly returned exit `1` with service throttling, including final candidate loading:

```text
Internal error (code -32603): Encountered an error in the response stream: The request was throttled by the service (request_id: 671ca98e-0991-461d-9fca-d855f7b7e06a)
```

The final mixed-layout Kiro run read the raw lock and instructions, but stopped before mutation.
Independent comparisons found manager still at `15`, setup still at `14`, all six paths unchanged, and the sentinel preserved.
Provider interruption is SKIP, never a behavioral PASS.
Historical initial-candidate successes are identified above; they do not certify every changed final reference on every harness.

### Final-package mixed layout and dependency checks

Preparation installed manager at `15` in all three harnesses, then setup at `14` with Codex/Kiro symlinks and a Claude copy.
The request was update without a release, expressly approved, preserving every placement and mode.
Codex and Claude selected stable `15`, resolved commit `24d8bc0c3217574c55395b5744edd58039d39763`, and completed the update.
Both used explicit manager, canonical-setup, and copy-setup installer groups:

```sh
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills-manage-validation-20261002.git#v0.0.15' --skill wkc-manage -a claude-code -a codex -a kiro-cli -y
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills-manage-validation-20261002.git#v0.0.15' --skill wkc-setup -a codex -a kiro-cli -y
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills-manage-validation-20261002.git#v0.0.15' --skill wkc-setup --copy -a claude-code -y
```

Independent parent comparisons returned `0` for all six complete directories, including supporting files.
The installed set remained exactly manager and setup; both owned refs became `15`.
The sentinel remained `preserve final sentinel` and no diagnostic report appeared.

| Placement | Manager | Setup |
|---|---|---|
| `.agents/skills/` | Canonical directory | Canonical directory |
| `.claude/skills/` | Link `../../.agents/skills/wkc-manage` | Independent copy |
| `.kiro/skills/` | Link `../../.agents/skills/wkc-manage` | Link `../../.agents/skills/wkc-setup` |

Claude checked the intermediate shared ref: canonical setup was `15`, but the untouched Claude copy was still `14`.
It then verified that independent copy after its own installer group.
Setup's `config-template.md` SHA-256 changed from `dbce9d885fbd5b3497eeaba634639b428f7d46776aecfdd6de2680693c277975`
to `e5394f72f1619735b10891158b3345aaf1796396bc79a2e9194004a1da0c23b2` in every setup placement.
Claude reported previously loaded instructions. Codex's final summary omitted that statement for the unchanged manager reinstall.
That reporting subcheck is FAIL; its initial actual self-update included the required statement.
No content or placement failure occurred in the final update.

Final dependency consumers had manager `15` installed in the parent and independent setup or tracker copies in child projects.
Each child started without a canonical copy. The setup child included generated configuration, its context reference, and a sentinel.
The runtime child contained an unowned `foreign-dependent` skill declaring a call to `wkc-tracker`.
Codex and Claude each completed the approved setup removal with:

```sh
npx skills@1.7.0 remove wkc-setup -a claude-code -a kiro-cli -y
```

Parent checks found both setup placements absent and a valid schema `1` lock with an empty skills mapping.
Generated `docs/dev-agents/config.md`, `AGENTS.md`, and `sentinel.txt` remained byte-identical.
Both then warned that tracker removal would break the runtime call and ended on numbered options, with keep-current first.
No runtime backup or mutation occurred. Both tracker copies still matched archive `15`, and the dependent remained intact.
The short setup report reference was checked statically; no configuration field or implicit call was added.

### Per-case results

The matrix records complete numbered cases. SKIP includes unrun variants and provider-interrupted partial runs.
FAIL preserves observed failures even where other subchecks passed or a corrected candidate passed later.
The source and observed states above distinguish historical and final-package coverage.
Case 20's static integration checks passed; PR creation was pending when this report was committed.

| Case | Codex | Claude Code | Kiro CLI | Remaining coverage or failure |
|---|---|---|---|---|
| 1 | PASS | PASS | PASS | Package, loading, and default status completed; final loading also observed on all three |
| 2 | PASS | PASS | SKIP | Kiro provider interruption |
| 3 | SKIP | SKIP | SKIP | Offline/read-only checks completed; failing-API status variant unrun |
| 4 | PASS | PASS | SKIP | Highest numeric target and four negative requests completed; Kiro interrupted |
| 5 | SKIP | SKIP | SKIP | Public exclusion and explicit maintainer passed Codex/Claude; metadata fallback unrun |
| 6 | SKIP | SKIP | SKIP | Symlink and mixed updates passed; all-three independent-copy update unrun |
| 7 | SKIP | SKIP | SKIP | Claude status detected differences; all mutation/approval variants unrun |
| 8 | SKIP | SKIP | SKIP | Claude ownership and missing-lock status completed; fresh/conflict mutations unrun |
| 9 | FAIL | SKIP | SKIP | Codex comparison attempt failed then corrected; withheld approval unrun; Kiro interrupted after removal |
| 10 | SKIP | SKIP | SKIP | Controlled failed rename replacement unrun |
| 11 | SKIP | SKIP | SKIP | Host consumers prevent safe successful conversion; withheld approval unrun |
| 12 | PASS | PASS | FAIL | Corrected preflight passed Codex/Claude; initial Kiro failure retained, corrected Kiro interrupted |
| 13 | PASS | PASS | SKIP | Setup removal and runtime warning passed Codex/Claude; Kiro monthly usage limit |
| 14 | FAIL | SKIP | SKIP | Self-update and selected self-removal completed; Codex unchanged-reinstall report omitted required statement; complete removal constrained |
| 15 | SKIP | PASS | SKIP | Only Claude completed question and digit-approved downgrade |
| 16 | FAIL | SKIP | SKIP | Recovery state passed; Codex batched a permitting read with its lock write; unsafe-root variant unrun |
| 17 | PASS | PASS | SKIP | Explicit additions/removals preserved source sentinels; Kiro mutation runs interrupted |
| 18 | SKIP | SKIP | SKIP | Linked-worktree repeat passed Codex/Claude; tracked/link destination negatives unrun |
| 19 | SKIP | PASS | SKIP | Only Claude completed six provenance consumers |
| 20 | SKIP | SKIP | SKIP | Shared static integration passed; PR creation pending at report commit |

The final Kiro dependency attempt stopped at the provider's monthly usage limit before any tool call:

```text
Internal error (code -32603): Encountered an error in the response stream: The monthly usage limit has been reached (request_id: fd07e5b9-520d-4faf-84c2-f0369c1f44cf)
```

Independent checks found its setup and tracker copies unchanged. Further Kiro execution requires restored provider capacity.
Unrun variants remain in the numbered runbook for later execution, not as claims that they are unnecessary.
Production merge, publication, and a pinned management install remain outside this PR's authorized work.
