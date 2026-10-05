# wkc-manage validation

Follow [Validation](../AGENTS.md#validation). These six cases cover the simplified four-operation contract.
Select affected subchecks; do not rerun historical scenarios for removed features.
Use `skills@1.7.0` and disposable projects outside the source checkout and real skill discovery directories.
Direct checks establish installer behavior. They do not prove skill loading or instruction following by an untested harness.
Additional AI sessions need explicit authorization and a budget; do not launch another harness for testing.

## Preparation

Export the current candidate, including uncommitted skill changes, into a disposable source directory.
Keep only shipped skill files in that export; never install the authoring template or historical validation material.
Prepare only layouts needed by the selected case: canonical links, independent copies, or a conflicting destination.
Use isolated homes and harness configuration paths for installer probes; never modify the maintainer’s global directories.
Keep source sentinels under `skills/<name>/` and unrelated installed skills and lock entries in consumers.
Use local sources or controlled HTTP responses for mechanical checks. Public release access needs no login.
Do not create remote repositories, publish releases, or change real installations for these checks.
Read historical observations only when a specific unchanged installer behavior needs supporting evidence.

## Cases

1. **Local status and recorded versions.** Prepare owned entries with an exact tag, no ref, `main`, and mixed refs.
   Include a stale entry, broken link, unknown destination, and two independent copies with different contents.
   Also exercise a missing lock, unreadable JSON, and an unsupported lock format.
   PASS: status reports refs literally, absent refs as “Unpinned, default branch”, and actual locations and missing paths.
   It reports unavailable ownership or version information honestly, without claiming each copy matches its recorded ref.
   It makes no network requests, installer calls, report writes, or exclusion changes. Compare consumer bytes before and after.

2. **Scoped installation and update.** Exercise a fresh add, then updates in symlink, copy, and mixed layouts.
   Use a target containing an additional public skill; update only existing selected skills.
   Exercise GitHub Latest below the numeric maximum, a direct explicit release lookup, and explicit `main` without release lookup.
   Cover a failed release lookup and an absent target skill. Neither may silently fall back or infer a rename.
   PASS: release commands use the exact selected tag; `main` uses an unpinned source; public access needs no login.
   No release listing or body enters context. Names, paths, modes, and recorded refs match the requested operation.
   No new skill appears during update. An ordinary update replaces edited installed files without backup or approval ceremony.
   Check actual files and relevant lock entries; do not require runtime archive comparisons or recovery workflows.

3. **Public all and explicit maintainer.** Enumerate public skills at the target and install them with explicit names and harnesses.
   Repeat discovery with only the maintainer’s internal metadata removed; also request that skill explicitly.
   PASS: `add all` excludes internal skills and `wkc-skills-release` by name, including under metadata fallback.
   Explicit maintainer installation succeeds. No wildcard, global flag, or `--all` is used for writes.

4. **Ownership and incompatible locks.** Prepare a foreign `wkc-` entry, an owned legacy entry, and an unowned destination.
   Include an occupied canonical destination, a missing lock with existing files, malformed JSON, and lock versions `0` and `2`.
   PASS: write operations reject unknown ownership, malformed entries, and unsupported locks before invoking the installer.
   A prefix does not establish ownership. Existing files and foreign entries remain unchanged; an empty project permits fresh installation.
   Legacy ownership can be reported or removed, but absent target names never cause automatic migration.

5. **Explicit removal and preservation.** Remove an owned skill from all requested existing supported placements.
   Include source sentinels, unrelated skills, and setup-generated configuration. Exercise the manager’s own removal as a selected name.
   PASS: every write names individual skills and explicit `-a` arguments. Source directories and unrelated content survive unchanged.
   Inspect actual selected paths and lock entries; report retained files or ownership as incomplete removal.
   Never run broad or agent-less removal, even as a destructive reproduction. Existing historical evidence covers that installer defect.

6. **Retained placements and incomplete operations.** Request selective removal with retained links, then retained independent copies.
   PASS: the manager stops before any installer call and explains the shared-file or lock-ownership risk.
   It does not inspect global detection settings, convert copies, broaden the request, or reinstall retained skills.
   For a complete-removal probe, use an isolated environment where an additional detected harness keeps canonical files.
   PASS: actual remaining files and lock ownership produce an incomplete result despite an installer success message.
   Exercise a failed installer call in a disposable consumer; later calls stop, actual state is reported, and no rollback begins.
   Include a scoped update where one placement fails, the installer exits zero, and the lock ref still advances.
   PASS: the printed failure makes the update incomplete although the path exists and the recorded ref changed.
   Also inject a placement deletion failure that prints a warning and success, removes ownership, and leaves a broken link.
   PASS: report incomplete removal from the warning and remaining link, even when its target and lock entry are absent.

## Rewrite report

The simplified contract replaces the former reconciliation, provenance, backup, migration, and recovery requirements.
The initial rewrite ran no checks at the user's request. The focused checks below supersede that initial SKIP for their stated scope.
Historical results below describe earlier instructions and do not validate this candidate.

### Focused checks, 2026-10-04

Authorization: `.local/wkc-manage-focused-checks-prompt.md`, using disposable fixtures and the current session only.
Selected scope: current cases 1–6, including recorded refs, scoped updates, public discovery, ownership refusals,
source preservation, retained placements, canonical retention, and controlled installer failure.
Backends: local Git sources and a loopback HTTP fixture. Installer targets: Claude Code, Codex, and Kiro CLI project directories.
No subagents, additional AI sessions, other harnesses, historical matrix, real installations, or remote writes were used.

Candidate: working tree over `b694f8387e57c17f39e553cbbaeb4eb9660f8ec1`, version `0.0.14`.
The export contains existing tracked files under `skills/`, including uncommitted bytes and excluding deleted files.
No authoring template, ignored files, historical reports, or validation scripts were included.
Manager SHA-256: `7e29af51448dd19b21d24af63ea3a742a1d5949f2a5d3d70debe601739fa9957`.
Invocation metadata SHA-256: `3cbc13c9fa308f1fc586d138de4b0170f74f2d6b05daf64d9bdae4ec3c850e3d`.

Disposable evidence root: `/private/tmp/wkc-manage-focused-rOZQFi/`.
Local fixture commits: candidate `db811c794c06cb9c260bcee1cd06bae032b280be`;
update `f721d8d4762451313feaeb8622e46789e88e9d49`.
The update adds `wkc-added-fixture` and a tracker file. Candidate manager bytes and repository identity remain unchanged.
Fixture tags `v0.0.14`, `v0.0.15`, and `v0.0.99` are local, not public collection releases.
An isolated Git configuration redirects the collection URL to that local source.
Controlled installer fetch responses prevent public API access; telemetry is disabled.
These fixture locks establish no facts about a real public installation. No public exact-tag probe ran.
The HTTP fixture returns Latest `v0.0.14`, below available fixture tag `v0.0.99`, and direct explicit-release responses.
Its server was stopped after testing. Homes, harness configuration paths, Git configuration, npm cache, and temporary files are isolated.
Tools: `skills@1.7.0`, Node `v24.11.1`, npm `11.19.0`, Git `2.54.0 (Apple Git-157)`; YAML parsed with the installer's dependency.

### Direct checks

These observations establish installer, transport, packaging, or filesystem behavior, not model behavior.
`logs/installer.jsonl` records 24 commands, including discovery and three explicit removal calls.
Every mutation names individual skills and explicit `-a` arguments. No wildcard, `--all`, global flag, or generic update command ran.

| Scope | Result | Independent observation |
|---|---|---|
| 1, read-only inspection | PASS, focused | Five status consumers retain identical file hashes, modes, and link text. Installer and fetch journals remain unchanged during status inspection; exclusion sentinels survive. |
| 2, fresh installation | PASS, focused | Valid-lock and missing-lock consumers install into unoccupied destinations. The latter receives numeric lock version `1`. |
| 2, symlink, copy, and mixed updates | PASS, focused | Exact-tag scoped adds preserve installed names, locations, and per-placement modes. Edited files are replaced, refs advance to `v0.0.15`, and `wkc-added-fixture` is absent. Unrelated entries and sentinels survive. |
| 2, release transport | PASS, controlled | Anonymous requests use one `/releases/latest` lookup and direct `/releases/tags/v0.0.15` lookup. No release listing occurs. Output contains selected tags or bounded errors; release bodies stay in external logs. HTTP 503, 404, malformed JSON, draft, and prerelease responses reject selection. |
| 2, explicit main and absent name | PASS, focused | Unpinned shorthand installation records no ref and makes no release lookup. Target discovery lacks legacy `setup`; discovery changes no consumer files. |
| 3, public discovery and exclusions | PASS, focused | Five source definitions produce four public names. Removing only maintainer internal metadata exposes five names; explicit installation of the four public names still excludes the maintainer. Explicit maintainer installation succeeds. |
| 4 and 6, refusal integrity | PASS, focused | Twelve unsafe-write consumers and two retained-placement consumers remain identical to their snapshots. Their installer invocation count is zero. |
| 5, complete removal and self-removal | PASS, focused | Explicit removal of setup and manager across all three harnesses deletes selected paths and entries. Source sentinels under both `skills/<name>/` directories, unrelated installation and entry, setup configuration, context reference, and exclusion sentinel survive. |
| 6, canonical retention | PASS, reproduction; removal incomplete | An isolated Amp detection marker makes the installer retain canonical setup files and ownership despite exit zero and a success message. Claude and Kiro links are absent. No further mutation occurs in that consumer. |
| 6, controlled deletion failure | PASS, reproduction; operation failed | Injected EIO at canonical deletion leaves setup files and ownership after both links disappear. Manager and unrelated content survive. No subsequent installer call, conversion, reinstallation, or rollback occurs in that consumer. |
| 6, installer failure exit status | FAIL, installer defect | The controlled failure prints `Failed to remove 1 skill(s)` but exits zero. Exit status alone does not establish success. |
| Packaging, metadata, and active documentation | PASS, static | Manager is 101 lines with five opening fields and matching identifiers. YAML preserves quoted `argument-hint`, `disable-model-invocation: true`, and `allow_implicit_invocation: false`. All three installed manager directories match the candidate. Active relative links resolve; callers to deleted runtime references are absent; version remains `0.0.14`. |

Primary evidence: `logs/*-check.json`, `logs/refusal-checks.json`, `logs/*-preupdate.json`,
`logs/*-before-removal.json`, `logs/package-check.json`, `logs/static-links-check.json`,
`logs/status-journal-check.json`, `logs/api.jsonl`, and `logs/failure-injection.jsonl`.
Raw command output and response bodies remain outside the repository.

### Observed application in this session

The current session read the candidate instructions and applied them to the prepared requests.
Fixture helpers created states, invoked selected commands, and checked results; they did not implement a replacement manager.
This is bounded application of the instructions, not an installed skill invocation or a harness compatibility result.

| Scope | Result | Observed decision or report |
|---|---|---|
| 1, local status | PASS, session only | Reported literal tag, `main`, and another branch ref separately; missing ref as “Unpinned, default branch”; stale entry as missing; broken link as inaccessible. Foreign and unknown destinations were unmanaged. Missing, malformed, unsupported, and unreadable locks supplied unavailable ownership information. No content or public-release identity was claimed for divergent copies. |
| 2, selection and update | PASS, session only | Selected designated Latest and direct explicit release; used unpinned main; preserved existing sets and modes; allowed replacement of local edits. Failed lookups stopped installation without fallback. Absent `setup` stopped without inferred rename. After manager update, stated that this session retains previously loaded instructions. |
| 3, add all | PASS, session only | Expanded discovery into four explicit public names and explicit harnesses. Excluded the maintainer both by metadata and by name under fallback; installed it only on explicit request. |
| 4, unsafe writes | PASS, session only | Rejected foreign ownership, unowned destinations including canonical paths, missing lock with occupied files, malformed JSON, versions `0` and `2`, string version, array skills mapping, null entry, and missing or non-string source. Owned legacy `setup` was recognized during status. No installer ran for rejected writes. |
| 5 and 6, result handling | PASS, session only | Reported complete removal only after path and lock inspection. Reported canonical retention as incomplete and controlled failure as partial removal, despite zero exit codes. Stopped changes in affected consumers without rollback. |
| 6, selective removal | PASS, session only | Rejected retained links and independent copies before installer calls because canonical files or shared lock ownership can be lost. No global detection inspection, conversion, broadened removal, or retained-skill reinstallation was used for these decisions. |

### Reproduction and limits

For canonical retention, install setup into all three directories, enable only isolated Amp detection, then remove setup with all three explicit harness arguments.
For failure, use the same installation and inject `EIO` from `fs.promises.rm` at canonical setup deletion.
The direct removal command in both probes is:

```sh
npx skills@1.7.0 remove wkc-setup -a claude-code -a codex -a kiro-cli -y
```

Both probes leave `.agents/skills/wkc-setup/` and its lock entry, with Claude and Kiro links absent.
Retention prints success; failure prints an error; both exit zero. These installer limitations are not successful removal.
The retained fixture helper reproduces each probe in a new disposable consumer with isolated transports and configuration:

```sh
node /private/tmp/wkc-manage-focused-rOZQFi/reproduce-removal.mjs retention
```

```sh
node /private/tmp/wkc-manage-focused-rOZQFi/reproduce-removal.mjs failure
```

**SKIP:** installed invocation and actual loading on Codex, Claude Code, and Kiro CLI.
The current session cannot retroactively demonstrate installed activation; additional sessions and other harness launches were prohibited.
Public GitHub release integration and public exact-tag installation were outside this local focused scope, not claimed as tested.
Optional rejected-authentication fallback was not exercised; all controlled release requests were anonymous.
Unreadable-lock coverage uses an `EISDIR` read failure, not a permission-denied file.
No full-case or cross-harness compatibility verdict follows from these focused results.
Historical broad-removal damage evidence remains unchanged; no broad or agent-less reproduction ran.
All initial tracked bytes were unchanged before the report edit. Only this report was edited during validation;
the historical section remains byte-identical to its initial working-tree content.

### Review and fix, 2026-10-04

An independent review ran in one Claude Code session, without subagents, other harnesses, or additional AI sessions.
The focused checks above ran in Codex CLI `0.160.0`, session `01a10714-726b-7093-8cdc-0b14ac6a0ef2`.
“This session” in those sections means that Codex session. Its local transcript supports the session-only rows.

**Defect, fixed.** The installer prints per-skill failures and exits zero after both `add` and `remove`.
A failed copy can leave an existing path while the lock ref still advances, so path and lock checks alone report success.
`SKILL.md` section 4 now states that fact and treats any reported failure as an incomplete operation. Case 6 covers it.

**Report corrections.** The cited `reproduce-removal.mjs` helper was written but never run during the focused checks.
This review ran it once in a path-rewritten copy of the evidence root; it reproduced both recorded outcomes.
It appends to that root's installer journal and reuses fixed consumer names, so later runs are not new consumers.
The focused fixture inherited Codex session variables, so the installer reported “codex Agent detected” and forced non-interactive mode.
Every mutation already passed `-y` and explicit `-a`; discovery calls did not need those flags.
The manager-entry assertion in `final-direct.mjs` compared the lock with itself. Direct inspection confirms the manager entries and links survived.

Candidate: working tree over `b694f8387e57c17f39e553cbbaeb4eb9660f8ec1`, version `0.0.14`, with only section 4 of the manager changed.
Manager SHA-256: `0e8bb5a2d0d69d86f95e84ae49a554b8643045d380917eb1a53f77900146975f`. Invocation metadata is unchanged.
Disposable root: `/private/tmp/wkc-manage-review-34qVzs/`, with a new export, local Git tags `v0.0.14` and `v0.0.15`, and isolated configuration.
R1 and R3 started with empty environments. R2 reused the focused fixture's environment, including Codex session variables.
The R1 initial install made one anonymous installer request to the public repository metadata endpoint; telemetry was disabled.

| Check | Result | Independent observation |
|---|---|---|
| R1, partial update failure | PASS, reproduction; update incomplete | Copy-mode update of `wkc-tracker` for Claude Code and Kiro CLI, with EIO injected at one Kiro file. Exit `0`; output names the Kiro failure; ref advances to `v0.0.15`. The Kiro copy keeps `SKILL.md` but lacks the new file. Sentinels and the unrelated entry survive. |
| R2, removal reproduction helper | PASS, direct | Retention and failure modes both exit `0`, remove Claude and Kiro links, and leave canonical `wkc-setup` with its `v0.0.14` entry. |
| R3, packaging | PASS, static and installer | Discovery lists four public names. Installed manager directories in all three harness paths match the candidate. Frontmatter, metadata, opening fields, 103 lines, links, `VERSION`, and `git diff --check` pass. |
| R4, result handling | PASS, session only | This Claude Code session applied the revised section 4 to R1. It reported the update as incomplete, stopped further changes, and began no rollback. |

Evidence: `logs/r1-check.json`, `logs/r3-check.json`, `logs/installer.jsonl`, and raw installer logs under that root.
Reused without rerun: the direct installer rows above, because installer, fixtures, and configuration are unchanged.
R3 replaces the earlier packaging row, which described the 101-line candidate.
Session rows for status, selection, `add all`, unsafe writes, and selective removal apply to unchanged sections 1 to 3.
The earlier result-handling session row applied the previous section 4 wording; R4 covers the revised wording.
**SKIP:** installed invocation and loading on Codex, Claude Code, and Kiro CLI; public release integration.

### Independent audit, 2026-10-04

Scope announced before testing: inspect prior raw evidence, hashes, locks, snapshots, and add/remove source;
repeat case 6 failure subchecks and packaging with an empty environment. Use the current Codex session only.
No additional AI sessions, subagents, other harnesses, real installations, or remote writes ran.

**Finding:** no further runtime defect was confirmed. Section 4's failure rule is necessary and within the rewrite plan.
The pinned [add source](https://github.com/vercel-labs/skills/blob/v1.7.0/src/add.ts) writes the shared lock after any successful placement.
Its ordinary text-output path prints placement failures without setting a failing exit status; JSON mode has different exit handling.
The [remove source](https://github.com/vercel-labs/skills/blob/v1.7.0/src/remove.ts) also prints failures without setting a failing exit status.
It catches individual placement deletion errors as warnings and can then print success and remove shared ownership.
The cached `skills@1.7.0` executable and fresh probes confirm these paths. No installer change or workaround is needed.

**Report fixes:** narrowed the empty-environment claim to R1 and R3; R2's raw logs still show Codex detection.
Changed “every command” to “every mutation” because discovery commands omit `-y` and `-a`.
Case 6 now explicitly checks warning-only removal with a broken link. Runtime instructions, metadata, README, CHANGELOG, and VERSION are unchanged.

Evidence root: `/private/tmp/wkc-manage-audit-Q7MZ8j/`.
The fresh export matches the current shipped tree; no runtime change invalidated the prior review export.
Manager SHA-256 remains `0e8bb5a2d0d69d86f95e84ae49a554b8643045d380917eb1a53f77900146975f`;
metadata remains `3cbc13c9fa308f1fc586d138de4b0170f74f2d6b05daf64d9bdae4ec3c850e3d`.
The earlier `7e29af51448dd19b21d24af63ea3a742a1d5949f2a5d3d70debe601739fa9957` matches only the earlier export.
New local fixture commits: candidate `819105be4dbdb5a4fa2b28b9faaa812d78c7f6b2`, update `4018151653da614d19364bcb790f4310b8d6ed3b`.
All new installer processes used an explicit environment, isolated homes/configuration/cache, local Git redirection, and stubbed fetch responses.
Only executable lookup inherited the parent PATH. No new installer log reports agent detection.
Local tags and redirected URLs provide no public installation evidence. Node `v24.11.1` and the pinned cached installer were used.

| Check | Result | Independent evidence |
|---|---|---|
| Prior evidence audit | PASS, focused direct checks | `audit.mjs` rechecks raw journals and existing consumers against snapshots: 24 scoped commands, five unchanged status consumers, fourteen untouched refusal consumers, preserved update modes/names, public exclusions, removal state, and R1–R3 artifacts. Unchanged full lock hashes establish manager-entry preservation after incomplete removals without the earlier self-comparison. |
| Case 6, partial copy update | PASS, reproduction; incomplete update | New EIO probe exits `0`; Claude receives the new file, Kiro retains `SKILL.md` without that file, and the shared ref advances to `v0.0.15`. The output reports Kiro's failure. |
| Case 6, canonical deletion failure and retention | PASS, two focused reproductions; incomplete removals | Both exit `0`, remove Claude/Kiro links, and retain canonical files and ownership. One prints failure; isolated Amp detection causes the other to print success. |
| Case 6, placement warning | PASS, reproduction; incomplete removal | Injected Kiro unlink failure prints a warning plus success and exits `0`. Canonical files and ownership disappear, but `lstat` still finds the broken Kiro link. |
| Packaging and active links | PASS, focused direct checks | Four public names; all three installed manager paths match exported bytes. Manual invocation metadata, five opening fields, local links, version `0.0.14`, and `git diff --check` pass. |
| Revised section 4 | PASS, current session only | This session reports all four probe operations as incomplete. Their journals contain no later changes in those consumers, rollback, conversion, or reinstallation. |

Raw evidence: `audit.json`, `probes.mjs`, `probes.json`, `environment.json`, `logs/installer.jsonl`, and numbered command logs.
Prior scripts and evidence roots were read without rerunning or modifying them. Prior controlled release transport and unchanged sections 1–3 reuse their recorded evidence.
The Codex transcript `01a10714-726b-7093-8cdc-0b14ac6a0ef2` supports the recorded status, release-selection, and result reports.
The Claude Code transcript `7105576d-a312-4085-b6bd-d1b035a0077b` supports R4's incomplete-update report.
These are bounded session observations; filesystem checks alone do not establish those decisions or installed activation.
Two initial audit assertions were corrected: updates add the fixture file, and internal discovery lists all five visible names.
Those were audit assumptions, not candidate failures. Prior failures and the historical section remain preserved.
**SKIP:** installed invocation/loading on all three harnesses and public release integration remain untested.
Rejected-authentication fallback and permission-denied lock reads remain outside the exercised evidence; earlier limits still apply.

## Historical validation

The following case catalog and reports are retained as historical evidence only.
Their numbered cases refer to the previous design, not the six current cases above.
Instructions and acceptance criteria within this section are superseded by the current contract.

<details>
<summary>Previous case catalog and preparation, superseded by the rewrite</summary>

# wkc-manage validation

Follow [Validation](../AGENTS.md#validation): select affected cases and harnesses, use direct checks first, and reuse unchanged evidence.
This is a case catalog, not a full test sequence for each change.
Read [Cases](#cases) and selected report sections; do not load the historical reports as routine context.
Use `skills@1.7.0`. Record the actual model and reasoning configuration only when running a harness.
Perform each harness check from that harness's own session. Do not launch another AI harness for automated testing.
Additional AI test sessions require an agreed budget. Required checks that cannot run remain SKIP.
Each selected case has an independent check. Separate direct results from results for each selected harness.
Identify selected subchecks explicitly; do not claim a full-case PASS from partial coverage. Preserve failures after correction.
Installer messages, lock entries, source inspection, and manual commands alone do not prove harness behavior.

## Preparation

Prepare only fixtures required by selected cases. Reuse suitable existing fixtures and recorded setup evidence.
Use local files or controlled HTTP responses for mechanical checks; real release fixtures are needed for GitHub integration and installation cases.
Record source commit, relevant tools and commands, and fixture identifiers; record packaged hashes and identity substitutions when installing test copies.
Keep scratch data outside the repository. Never install a populated working tree, because ignored files can be copied.
When testing installed behavior, export the candidate with `git archive`, then install it into independent consumer repositories:

```sh
npx skills@1.7.0 add "<clean-candidate>" --skill wkc-manage -a claude-code -a codex -a kiro-cli -y
```

Compare every installed manager directory recursively against the candidate archive before invocation.
Use only the states needed by selected integration cases from the following baseline fixture recipe.
For cases requiring real GitHub integration, use a suitable existing disposable public repository or create an authorized fixture.
Record its name; never delete it without separate authorization.
Change only the test manager's labeled Repository identity field to that repository.
Include equivalent test copies in fixture tags so target archive comparisons include that same identity substitution.
Keep an unmodified installed copy for ownership isolation checks against the real collection.
For legacy cases, use `setup` and `tracker` from collection `v0.0.8` for the fixture's legacy tag.
Publish stable fixture `v0.0.9` and `v0.0.10`, make Latest point below the numeric maximum, and include a draft,
prerelease, and orphan tag above both. Read the complete release list independently.
Keep extra source sentinels and unrelated lock entries in consumers to detect unintended writes.

Probe changed installer behavior directly in disposable consumers before model testing.
Select relevant layouts from unpinned, exact-tag, legacy, symlink, independent-copy, retained-harness, removal, lock, and internal-exclusion cases.
Record exact commands, raw locks, link targets, resolved paths, and complete archive comparisons.
Stop on an observation contradicting the approved design; settle it before writing the skill.

## Cases

1. **Package and actual loading.** List public and explicit internal discovery. Count source skill definitions separately.
   Invoke the installed manager on each selected harness, with no operation.
   PASS: four public skills, five shipped skills, no template; five opening fields, matching identifiers, manual settings,
   no scripts; every packaged file matches the clean archive; transcript shows actual skill loading and status behavior.

2. **Lock format version gate.** Independently use locks whose top-level numeric `version` field is `1`, `0`, or `2`, plus malformed JSON.
   Invoke `status`, `reconcile`, and a mutation on each invalid lock; also test malformed entries with `version` equal to `1`.
   PASS: valid version `1` operates; every invalid variant stops without installer execution, report, exclusion, or lock writes.
   Compare raw lock bytes, complete consumer files, and Git exclusions before and after.

3. **Read-only status and external changes.** Invoke without an operation, then change an owned installation with the external installer.
   Invoke again, including offline status and a failing remote API read.
   PASS: each recomputes current paths and provenance, creates no report or exclusion, preserves checkout bytes,
   and never interprets failed remote verification as absent releases or ownership.
   Local-only status makes no release-list request; check the transport journal independently.

4. **Target selection.** Request update without a release against the fixture's stable, draft, prerelease, and orphan tags.
   Repeat without credentials and with rejected optional credentials; public access must proceed anonymously without a login request.
   Request an older stable version and each ineligible target explicitly; check direct tag lookup without release enumeration.
   Exercise multiple release pages with hundreds of records and large release bodies through a controlled paginated API transport.
   Include unsupported stable tags; check bounded diagnostics without invented ordering.
   Interrupt a later page and separately return malformed JSON; neither may produce a partial target or installer call.
   PASS: complete listing selects the fixture's numeric stable maximum despite Latest `v0.0.9`; explicit selection verifies only its release.
   Public access requires no authentication. API responses stay in external scratch files and shell processing.
   Tool output contains only the selected tag, publication status, resolved commit, and bounded diagnostics, never history or release bodies.
   Ineligible or unreadable targets stop without mutation. Remote refs and releases remain unchanged.

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
   Repeat approved migration with unpinned legacy canonical files and retained project links in an isolated detection environment.
   PASS: content and ownership verify before replacement; both renames complete without claiming historical installation pins.

10. **Failed replacement [MANUAL when controlled failure is unavailable].** Fail one replacement installation after backup.
    PASS: legacy originals remain accessible, later removals do not run, failure state is reported,
    and durable backups survive. Independently inspect files, links, and lock evidence.

11. **Shared canonical selective removal.** Request Codex-only removal while Claude Code and Kiro retain links.
    First withhold mode-change approval; then approve concrete conversion in a consumer without other canonical users.
    PASS: the first turn ends on a numbered question; after approval retained placements become independent copies;
    complete retained content matches original tags; canonical files are absent and Codex cannot access the removed skill.
    Also request Claude-only removal in disposable environments with isolated HOME, CODEX_HOME, and CLAUDE_CONFIG_DIR.
    Cover both a detected retained consumer and no detected retained consumer, using the pinned installer without changing real global directories.
    PASS: the plan predicts canonical and lock retention or deletion before writes; unsafe partial removal stops or obtains informed preservation approval.
    Approved preservation must restore complete retained placements, original modes, accessibility, and ownership from verified original tags.

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
    Include same-version manager reinstallation and complete canonical self-removal in an isolated detection environment.
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
    Request update of an unpinned canonical installation with matching bytes, then with unknown bytes, withholding replacement approval.
    Separately approve the concrete replacement of the matching installation.
    PASS: withheld approval preserves all bytes; approved replacement preserves placement and records only the new exact ref.

20. **Repository integration.** Re-read issue #13, its corrections, and the pre-commit checklist.
    PASS: next patch version once, one timestamped changelog row, shipped roster, Install/Uninstall and bootstrap documentation,
    authoring policy separated from runtime rules, release fallback cross-reference, short setup report reference,
    and no scripts, hooks, build steps, or per-skill versions. PR uses `Refs #13`, lists deviations and SKIPs, and remains unmerged.

## Report

Record source and fixture identifiers, selected cases, independent checks, observed outcomes, and unresolved limits here.
Include relevant packaged hashes, release IDs, and archive SHAs when checking installation or release identity.
Separate direct checks, new harness results, and explicitly reused evidence. Do not duplicate prior setup instructions or result tables.
Unavailable required checks within selected scope are SKIP; failed attempts remain FAIL after correction.
Do not cite absolute paths to ignored logs as evidence. This report must be readable without scratch files.
Production merge and publication are outside this PR. No production release is authorized by validation.


</details>

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
The Codex directory suffix is not a timestamp and fails the required naming pattern. This historical failure remains recorded.
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
That reporting subcheck remains FAIL; the old phrase "after self-update" did not explicitly include unchanged reinstallation.
This was an instruction ambiguity, not established evidence of a harness defect. The revised instruction includes every installer write to the manager.
Its initial actual self-update included the required statement.
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

## Review follow-up: 2026-10-03

This section addresses [Review 1](https://github.com/wilsonkichoi/skills/pull/17#issuecomment-5969661918)
and [Review 2](https://github.com/wilsonkichoi/skills/pull/17#issuecomment-5969752393).
The preceding matrix is the historical report, not the results for the revised package.
Historical FAIL results remain. New passing subcases do not erase them or establish full coverage of an expanded case.

### Corrections and candidate

The removal reference now predicts canonical retention and deletion from the pinned installer's exact detection rules.
It checks `lstat` at each detected, unselected agent's project install path.
A retained project link does not establish detection. With no qualifying detected consumer, removal deletes canonical files and the lock entry.
The manager stops before that loss unless a concrete source reinstallation plan is approved.
The plan preserves original content, mode, accessibility, and ownership; it is not described as link-only removal.

The README restores manual configuration cleanup for a full uninstall and describes constrained canonical legacy cleanup.
The reporting instruction explicitly includes same-version manager reinstallation and recovery writes.
The old unchanged-reinstallation FAIL is retained as an instruction ambiguity.
The old Codex backup suffix is recorded as a naming failure, in addition to the historical recovery ordering failure.

The clean candidate is Git tree `72524b1a1d8f38907faa381caafde8e94cfe284a`, exported with `git archive` through an alternate index.
The tree contains only tracked candidate files. No populated checkout was supplied to the installer.
The final report and PR description are outside the packaged manager files.

| Packaged file | SHA-256 |
|---|---|
| `SKILL.md` | `c1f9e46d7c3e2b11f2eb3d5a6b7906020ac3374ad98e49b105e8d73dcee244ba` |
| `agents/openai.yaml` | `3cbc13c9fa308f1fc586d138de4b0170f74f2d6b05daf64d9bdae4ec3c850e3d` |
| `migration.md` | `061c9365adc8729d86ff0104c28b621ba0080b3b37653f9e1875673e2b766402` |
| `removal.md` | `008b9fd940109bcab71f45a55f3f47c66e3298d466a56a5bf263be6d9f08ca1e` |
| `recovery.md` | `0822a9f7644851af92d50414856a9daa33fc00d3719fdde60711a3efc6e81edc` |
| `verification.md` | `3a5d8211099a6d5caa062e847fed992cc410dcfccbe699cd35e0427d51fc7630` |

The retained public fixture is `wilsonkichoi/skills-manage-validation-20261002`.
Two additional test-only releases were published with `--latest=false`; existing tags were not moved or deleted.
Latest remains `v0.0.9`. The ordinary fixture maximum is now `v0.0.17`.

| Tag | Commit | Release ID | Purpose |
|---|---|---|---|
| `v0.0.16` | `4bc0a13abe6de85684ae35060f6f6a75447ff7e0` | `402534295` | Revised manager and changed setup supporting file |
| `v0.0.17` | `db5da4317731dd03d484b150bf70f5d22e6353c3` | `402534303` | Same package with only release skill's boolean internal metadata removed, plus fixture VERSION |

Fixture `16` uses the candidate's complete manager directory, with only its labeled repository identity changed.
Its setup `config-template.md` adds one test comment compared with fixture `15`.
Fixture `17` makes the metadata fallback test possible without changing the collection's production metadata.
Each manager's pre-invocation snapshot was independently compared with its complete source archive.

### Isolation and actual transport

Disposable consumers and their persistent synthetic home directories live under `~/tmp/wkc-manage-review-20261003/`.
No real harness detection directory was hidden, renamed, or deleted.
Each consumer has unrelated `sentinel.txt` and `skills/wkc-setup/sentinel.txt` files.
Initial owned installations used the pinned installer and full fixture URLs with exact tags.
Unknown ownership, missing locks, unpinned refs, edits, and conflicts were then seeded as explicit test conditions.

Codex used its configured `gpt-6.1-sol`, high reasoning, without a model override.
Claude Code reported `claude-opus-5-5`. CLI versions remain Codex `0.160.0`, Claude Code `2.1.288`, and Kiro CLI `2.27.0`.
Actual invocation commands were:

```sh
codex exec --ephemeral -c 'shell_environment_policy.inherit="all"' --json -s danger-full-access --color never '$wkc-manage <request>'
claude -p '/wkc-manage <request>' --output-format stream-json --verbose --dangerously-skip-permissions
kiro-cli chat --no-interactive --trust-all-tools --output-format stream-json '/wkc-manage update wkc-setup to v0.0.16'
```

The test launcher set child-process HOME and XDG_CONFIG_HOME to each synthetic home.
Codex retained its existing CODEX_HOME for authentication; Claude used an absent CODEX_HOME and its existing CLAUDE_CONFIG_DIR.
Thus Codex runs detect Codex alone, while Claude runs detect Claude alone, unless a test explicitly creates synthetic `~/.kiro`.
The pinned installer uses those same detection inputs.
Claude's OAuth credential was passed in process memory for isolated authentication, never printed or stored in the report.
The `gh` transport uses existing authentication without changing installer detection inputs.
Initial authentication failures and an overly restrictive instrumentation-write permission were test setup failures, not skill PASS results.

The `npx` transport accepts only `skills@1.7.0`, journals arguments, and invokes the unmodified cached `1.7.0` package.
The corrected request explicitly permits instrumentation logs and comparison archives, as well as confined consumer and backup writes.
The changed-byte recovery transport performs the requested setup write, adds an unrelated lock entry and concurrent file, then exits `42` once.
The replacement-failure transport exits `42` on the replacement add call after backup; it never runs a later legacy removal.
These transports do not replace installer logic or alter the manager's instructions.

The pagination transport runs real `gh api --paginate` against a loopback HTTP fixture.
Page one contains 100 records: stable `v0.0.9` and `v0.0.15`, plus 98 distinct synthetic drafts above them.
Its HTTP Link header points to page two, which contains the real stable `v0.0.16` record.
Every request is recorded independently. This tests a second HTTP page without publishing 100 disposable GitHub releases.
The controlled listing's maximum is `16`; it is not a claim that the ordinary fixture listing lacks release `17`.

Independent checks compare file hashes and link text before and after each refusal.
They also compare exclusion bytes, installer journals, complete source directories, raw lock entries, and unrelated sentinels.
Mutation checks require expected directory types, accessibility, refs, retained ownership, and complete archive matches.
Recovered content must match fixture `15`, while the interrupted write used differing fixture `16` bytes.

### Recorded behavioral results

These runs occurred before the cross-harness testing restriction was added.
Resumed work parsed existing transcripts and checked files directly; it launched no further AI harness sessions.
The table records the named subcases, not complete passes for every expanded numbered case.
Kiro completed no tool call against this revised package. Every revised Kiro behavioral subcase is SKIP.

| Case | Review subcase | Codex | Claude Code | Independent evidence |
|---|---|---|---|---|
| 3 | Status with failing release API | PASS | PASS | API transport exits `42`; local evidence is reported without fresh release claims; checkout and exclusions remain unchanged |
| 4 | Second-page release selection and update | SKIP | SKIP | Both stop at the authentication gate; installed setup remains at `15`; direct pagination is recorded separately below |
| 5 | Metadata-removed add-all fallback | PASS | SKIP | Codex installs the four public names as eight complete copies matching archive `17`; maintainer remains absent; Claude ends on a mode-change question without writes |
| 6 | Update all three independent copies | PASS | PASS | Every setup directory matches archive `16`, remains a real directory, and records ref `16`; unrelated manager and sentinels remain unchanged |
| 7 | Supporting-file edit blocks update | PASS | PASS | Edited Claude copy, other copies, links, lock bytes, and exclusions remain unchanged; no installer runs |
| 7 | Supporting-file edit blocks removal | PASS | PASS | All affected content survives; neither run begins removal or backup before approval |
| 7 | Extra file blocks update | PASS | PASS | The extra file survives; no installer or exclusion write occurs |
| 7 | Broken retained link blocks removal | PASS | PASS | Broken link text and all other placements remain unchanged while the manager asks for a concrete resolution |
| 8 | Unowned destination collision | PASS | PASS | Existing tracker destination and raw lock remain unchanged; no installer runs |
| 8 | Missing lock with existing destination | PASS | PASS | Existing setup content remains unowned and unchanged; no new lock or installer call |
| 8 | Fresh named copy installation without lock | SKIP | PASS | Claude creates only the requested setup copies, matching archive `16`; Codex correctly stops on missing authorization for the instrumentation log |
| 8 | Foreign-source removal refusal | SKIP | PASS | Claude preserves the `example/foreign` lock entry and files; Codex stops at its quota limit |
| 9 | Withheld migration approval | PASS | PASS | Both end on numbered options with unchanged canonical legacy files, retained links, locks, and exclusions |
| 9, 19 | Unpinned canonical legacy inspection | PASS | PASS | Owned `setup` and `tracker` match archive `8`; neither claims historical pins or begins migration without confirmation |
| 10 | Replacement failure after backup | PASS | PASS | Controlled add exits `42`; both complete legacy directories still match archive `8`; no later removal runs; backups survive |
| 11 | Codex-only conversion without approval | SKIP | PASS | Claude explains canonical visibility and requests concrete copy conversion; files remain unchanged; Codex is quota-blocked |
| 11 | Approved Codex-only conversion | PASS | PASS | Canonical setup is absent; retained Claude/Kiro placements are real copies matching archive `15`; ownership and original ref remain |
| 11 | Undetected retained consumers, approval withheld | SKIP | PASS | Claude predicts deletion of canonical files and ownership before removal; no mutation occurs; Codex is quota-blocked |
| 11 | Approved preservation after predicted deletion | SKIP | PASS | Claude removes its selected link, then reinstalls original-tag canonical files and Kiro link; lock bytes match the original; Codex is quota-blocked |
| 11 | Detected retained consumer keeps canonical files | SKIP | PASS | With synthetic Kiro detection, Claude removes only its selected link; canonical setup, retained link, and raw lock survive; Codex is quota-blocked |
| 14 | Same-version manager reinstallation | PASS | PASS | Each journal contains the exact tagged installer call; all manager placements match archive `16`; both report previously loaded instructions |
| 14 | Complete canonical self-removal | PASS | PASS | All three manager placements and its lock entry are absent; setup, its original ref, and source sentinels survive |
| 16 | Recovery after changed-file write | PASS | PASS | Failed update writes differing `16` bytes, then recovery restores complete archive `15` content and original affected ownership; concurrent file and foreign lock entry survive |
| 16 | Unsafe backup-root rejection | PASS | PASS | A backup-root link resolves into project discovery; neither run copies a backup or executes the installer |
| 18 | Tracked report destination | PASS | PASS | Tracked bytes and index state survive; neither exclusions nor report change |
| 18 | Report destination through symlink | PASS | PASS | Link text, external target, and exclusions survive; no report write |
| 19 | Matching unpinned canonical content | PASS | PASS | Missing ref is reported; matching bytes do not become a historical pin; update waits for concrete replacement approval |
| 19 | Unpinned canonical content with unknown bytes | PASS | PASS | Unknown supporting-file bytes survive; both end on a concrete replacement question without mutation |

No new full-case totals replace the historical matrix. Broader cases still include unrun variants.
The two approved unpinned mutation variants added above remain SKIP on every harness.
Their refusal paths passed, but that does not establish successful update or migration of the unpinned shared layout.
Codex fresh installation, Codex's five quota-blocked subcases, Claude metadata fallback completion,
and both harnesses' behavioral pagination updates remain SKIP.
Unrun Kiro checks remain SKIP under the harness restriction, in addition to its recorded monthly limit.

The failed metadata-fallback assertion initially expected a completed installation from Claude's approval question.
The fresh-install assertion similarly expected files after Codex correctly stopped on an instrumentation permission conflict.
Neither is a skill failure or a successful mutation. Both are blocked validation setups.
The same-version Claude statement was initially rejected by a literal phrase matcher despite explicitly describing loaded instructions.
Correcting that checker and comparing the recorded installer call, files, and final statement establishes the reported subcase PASS.
These checker corrections do not change any transcript or erase historical execution failures.

Claude's pagination attempt wrote `/tmp/claude-pagination-releases.raw` and `.err` outside the supplied scratch location.
It later moved or removed them. That confinement subcheck is FAIL; cleanup does not erase the unauthorized writes.
Its authentication gate still prevents a pagination-update PASS.

### Direct checks after resumption

No AI harness was invoked for these checks. Installer and transport results do not count as model behavior.

The isolated pinned-installer probe covers the high-severity removal finding with the same canonical-plus-links layout:

| Detection environment | Selected Claude link afterward | Canonical setup | Owned lock entry | Retained Kiro link |
|---|---|---|---|---|
| Only Claude detected | Absent | Deleted | Deleted | Present but broken |
| Claude and synthetic Kiro detected | Absent | Retained | Retained | Present and accessible |

Each probe sets HOME, CODEX_HOME, CLAUDE_CONFIG_DIR, and XDG_CONFIG_HOME to disposable detection locations.
The commands are identical except for creating the synthetic Kiro detection directory:

```sh
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills-manage-validation-20261002.git#v0.0.15' --skill wkc-setup -a claude-code -a codex -a kiro-cli -y
npx skills@1.7.0 remove wkc-setup -a claude-code -y
```

After the deletion branch, an exact-source reinstall restores canonical setup, retained Kiro accessibility, and the owned ref `15`.
The same probe then removes those placements and installs only retained Claude/Kiro copies with `--copy`.
Both complete copies match archive `15`; no canonical setup exists.
The behavioral table separately records whether the manager predicted and approved those effects before mutation.

The direct pagination check uses real `gh api --paginate --slurp` against a loopback HTTP fixture.
It records exactly two requests: `/releases?per_page=100` and `/releases?per_page=100&page=2`.
Page sizes are `100` and `1`. Eligible tags are `v0.0.9`, `v0.0.15`, and `v0.0.16`.
The other first-page records are higher synthetic drafts, excluded before numeric comparison.
The resulting numeric maximum is `v0.0.16`. The server was closed after the check.
This proves pagination transport and direct numeric selection, not that a model completed the corresponding update.

All six current package hashes match the candidate table above.
Both fixture manager archives match current packaged files with only the labeled repository identity substituted.
The fixture now has nine release records. Ordinary stable maximum remains `17`; Latest remains `9`.
Release IDs for `16` and `17` match the recorded table. No new fixture release was created after resumption.

Independent recovery comparisons returned `0` for every restored setup placement against archive `15`.
All 57 current consumer manifests match their recorded final snapshots, including file hashes and link text.
Codex's retained backup is `wilsonkichoi-skills-manage-validation-20261002-2026-10-03T14-23-17-524Z-r7P3tO`.
Claude's retained backup is `wilsonkichoi-skills-manage-validation-20261002-20261003T072140`.
Both names contain a timestamp and both backups remain under the synthetic homes' durable backup roots.
The recorded Codex permitting checks finish in command `13` before update command `14`, and command `16` before recovery command `17`.
Claude's checks finish in command `8` before update command `9`, and command `11` before recovery command `12`.
The model-generated permitting reads and dependent installer writes are separate tool calls in these runs.
The pinned installer still performs its own internal lock reads and writes; that is not a claim about model-call separation inside the installer.

Repository-aware names, YAML, opening fields, invocation settings, identity, references, length, discovery count,
and one-version checks pass. `SKILL.md` is 131 lines. Version remains `0.0.14` for this PR.

### Review disposition

| Review finding | Result |
|---|---|
| Review 2 high: partial removal deletes retained content and ownership | Instruction fixed; isolated direct deletion/retention reproduced; Claude prediction, refusal, preservation, and retention subcases PASS; Codex quota variants SKIP |
| Review 2 low: missing full-uninstall cleanup | README again names generated directory and context-reference cleanup |
| Review 2 low: same-version self-reinstall ambiguity | Every installer write to manager placement is explicit; historical FAIL retained as ambiguous wording; new Codex/Claude same-version subcases PASS |
| Review 1 destructive-operation and recovery evidence | New edit, collision, missing-lock, failure, changed-byte recovery, unsafe-root, and report-conflict subcases recorded with independent checks |
| Both reviews' other coverage gaps | Copy updates, API failure, conversion, self-removal, and Codex metadata fallback covered; pagination behavior, approved unpinned mutations, remaining setup/quota variants, and revised Kiro behavior explicitly SKIP |
| Review 2 backup naming and Review 1 recovery ordering | Historical failures retained; new timestamped backups and separate permitting-read calls verified |

The repository now records cross-harness testing restrictions and token controls under `docs/dev-agents/rules/`.
Existing configuration discovers those files. No duplicate rule registry or AGENTS reference was added.
The restriction does not convert untested compatibility into PASS or remove required cases from this runbook.

## Bounded Codex follow-up: 2026-10-03

The user approved `gpt-6-luna`, high reasoning, and twelve sequential Codex sessions, including the pilot and failed attempts.
All twelve slots were used. No Claude Code, Kiro CLI, or test subagent was launched.
Installer commands targeted supported harness directories without invoking those harnesses' AI.

These results cover commit `b694f8387e57c17f39e553cbbaeb4eb9660f8ec1` and the six packaged hashes listed above.
Fixture `v0.0.16` supplied that manager, with only the labeled repository identity substituted.
Initial manager placements matched the complete fixture archive.
Management files changed in the working tree during this run. Those newer instructions were not installed into these consumers.
This section therefore does not validate the newer working tree or replace the earlier matrices.

Observed versions: Codex `0.160.0`, Node `v24.11.1`, GitHub CLI `2.102.0`, and Git `2.54.0 (Apple Git-157)`.
Consumers, synthetic homes, commands, transcripts, snapshots, installer journals, and backups were retained outside the repository.
Each consumer had unrelated source sentinels and independent lock, index, and Git exclusion baselines.
Comparisons covered complete bytes, file modes, directory and link types, link text, accessibility, ownership, source type, skill path, and exact refs.

### Configuration and setup corrections

Every launch explicitly selected the model and reasoning level. The common command options were:

```sh
codex --no-daemon --ask-for-approval never exec --ignore-user-config --ephemeral \
  --model gpt-6-luna -c 'model_reasoning_effort="high"' \
  -c '<per-case environment and permission settings>' \
  --add-dir '<validation-root>' --json --color never --cd '<consumer>' '<request>'
```

Shell overrides supplied synthetic `HOME`, absent `CODEX_HOME`, synthetic `CLAUDE_CONFIG_DIR`, isolated `XDG_CONFIG_HOME`, scratch paths, cache, transports, and case identifiers.
Runtime authentication used a separate directory referencing existing Codex authentication.
Only the `gh` transport subprocess used the real GitHub authentication context.
Alternative harness-home overrides were cleared. Real detection directories were not renamed, hidden, or deleted.

Sessions one and two used `workspace-write`. Its recursive `.agents` protection blocked the first pagination update.
The installer returned zero while reporting three `EPERM` failures unlinking canonical `SKILL.md`. Complete content and the ref remained at `15`.
This was a launcher setup failure, not a pagination-update PASS. The runner stopped before starting another AI session.
Later launches used this permission profile through explicit configuration overrides:

```toml
default_permissions = "wkc-validation"
[permissions.wkc-validation]
extends = ":workspace"
[permissions.wkc-validation.filesystem]
":slash_tmp" = "deny"
"/private/tmp" = "deny"
[permissions.wkc-validation.filesystem.":workspace_roots"]
".agents" = "write"
[permissions.wkc-validation.network]
enabled = true
```

Direct probes verified canonical write/unlink, fixed `/tmp` denial, and a complete pinned-installer update under that profile.
See [Codex protected paths](https://learn.chatgpt.com/docs/agent-approvals-security#protected-paths-in-writable-roots).
A shell here-document exposed another temporary-path problem. Direct probes verified synthetic `TMPPREFIX` before continuation.
Later prompts retained the supplied `PATH`, prohibited zsh's special `path` variable, and used Node for helper logic.

The pagination transport redirected only the exact release-list endpoint. Tagged-release and Git-object requests still used GitHub.
The successful run fetched both pages twice: its journal records page one, page two, page one, page two.
Each complete response contained 100-plus-one records and selected controlled maximum `v0.0.16`. The server was stopped afterward.
An overly restrictive transport was corrected to allow project `list` and `ls` reads.
Mutation controls still required `skills@1.7.0`, explicit names and harnesses, and the active consumer; broad and global mutations remained rejected.
Initial sessions had eight-minute limits. After two timeouts, remaining unrun cases received twelve-minute limits.
The maximum session count remained twelve. These limits were not token caps.

### Results and independent evidence

Rows describe named subcases rather than complete passes for every expanded numbered case or every Codex configuration.

| Case | Subcase | Result | Evidence |
|---|---|---|---|
| 8 | Fresh named copies without a lock | Installation PASS; confinement FAIL | One exact `16` add produced independent Claude/Kiro copies; no canonical setup placement; unowned manager and unrelated state survived |
| 4 | Second-page selection and update | PASS after setup correction | Complete controlled catalog selected `16`; one exact add advanced complete content and ref while preserving every placement and mode |
| 19 | Approved unpinned canonical replacement | PASS | Current bytes matched archive `15` without a recorded ref; approved replacement matched `16`; only the new exact ref was established |
| 9 | Approved unpinned migration | PASS across mutation and follow-up; initial invocation SKIP at timeout | Originals matched `8`; replacements matched `16` before legacy removal; follow-up verified replacements, legacy absence, modes, and ownership without another installer call |
| 11 | Codex-only conversion, approval withheld | PASS | Canonical visibility and required retained-copy conversion were explained; numbered options ended the turn; consumer and lock were unchanged |
| 11 | Undetected retained consumers, approval withheld | PASS | Plan predicted canonical/ownership deletion and a broken Kiro link; numbered preservation options ended the turn without writes |
| 11 | Approved preservation after predicted deletion | PASS | Claude removal deleted canonical content and ownership; exact original `15` reinstall restored Codex canonical files, Kiro link, modes, accessibility, and ownership; Claude stayed absent |
| 11 | Detected retained consumer retains canonical files | SKIP, partial | Synthetic Kiro detection preceded one Claude removal; archive `15`, canonical content, Kiro link, and ownership survived; timeout prevented final report and backup cleanup |
| 15 | Downgrade approval withheld | PASS | Exact old `16` and proposed `15` versions/commits were shown; numbered options ended the turn; bytes, lock, index, and exclusions stayed unchanged |
| 15 | Exact downgrade approved | PASS | One exact `15` add restored complete lower-release content and original modes; manager stayed at `16`; unrelated state survived; verified backup was removed |
| 19 | Six provenance consumers | PASS for listed inspections | Edit, extra file, broken link, unpinned matching bytes, mixed refs, stale entry, foreign owner, and missing lock were identified; equal bytes established neither ownership nor a historical pin; all consumers stayed unchanged |
| 8 | Foreign-source removal refusal | PASS | Source `example/foreign` was rejected as unowned; complete consumer, raw lock, index, and exclusions survived; no installer ran |

The two independent removal questions shared one session, with separate numbered options at its end.
Six provenance inspections and foreign-source refusal shared another session. Every consumer retained its own independent snapshot.

Migration installed both replacements together, verified them, and then removed the two legacy names:

```sh
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills-manage-validation-20261002.git#v0.0.16' --skill wkc-setup wkc-tracker -a claude-code -a codex -a kiro-cli -y
npx skills@1.7.0 remove setup tracker -a claude-code -a codex -a kiro-cli -y
```

The first removal attempt failed before the underlying installer started because the model's shortened `PATH` omitted Node.
After diagnosis and fresh checks, the same removal command succeeded with Node restored to `PATH`.
The session timed out during final verification; its incomplete invocation remains SKIP.
A separate follow-up verified remote commit `4bc0a13abe6de85684ae35060f6f6a75447ff7e0`, complete source trees, all placements, and legacy absence.
It inspected missing legacy refs in the backup and explicitly denied establishing historical installation pins.
Its before-and-after consumer snapshots and installer journal were identical. The interruption backup remains.

Approved preservation used separate removal and original-source reinstallation calls:

```sh
npx skills@1.7.0 remove wkc-setup -a claude-code -y
npx skills@1.7.0 add 'https://github.com/wilsonkichoi/skills-manage-validation-20261002.git#v0.0.15' --skill wkc-setup -a codex -a kiro-cli -y
```

Inspection between calls observed absent canonical content and ownership.
Independent final checks required Claude absence, a real canonical directory, the original Kiro link, complete archive equality, and original source/path/ref.
Permitting reads and dependent installer writes were separate calls in the successful recorded mutations.

### Retained failures and limits

The pilot wrote authentication diagnostics to `/tmp/wkc-auth.out`, outside its authorized scratch directory, and later removed that file.
Its confinement subcheck remains FAIL. Successful installation does not erase that write.

The pilot first checked a nonexistent root `schema` field, then expected a canonical placement for retained-harness copies.
The downgrade's first audit incorrectly checked the format version inside a skill entry.
Corrected audits and independent comparisons established the actual top-level numeric `version` and intended placements.
Those failed diagnostic attempts remain recorded.

The blocked pagination backup used a repository directory containing a timestamp directory.
That differs from the required single `<repo>-<timestamp>` operation directory. Its naming subcheck is FAIL.
Later operation directories used the required label-and-timestamp shape.

The successful pagination report described `17` as a tag without a published release.
The controlled catalog omitted `17`; the ordinary fixture has a published stable release `17`.
This result establishes selection within the controlled catalog, not ordinary fixture release absence.

Migration diagnostics used zsh's special `path` variable, then shortened `PATH`, causing command lookup failures.
The model initially blamed inherited configuration before identifying the omitted Node directory.
The failed removal attempt and interrupted invocation remain visible; the verification follow-up does not erase them.

An independent checker initially required a 40-character computed hash and rejected a legitimate 64-character installer hash.
Pinned tool code permits a Git tree hash and a SHA-256 folder-hash fallback.
The corrected check accepts both formats and verifies complete content separately.
The failed checker assertion remains recorded. Only direct checks were repeated; no AI session or consumer was repeated.

The pagination and unpinned-update models reported automatic-review rejection of backup deletion.
The update report called the rejected `rm -rf` an "rm -f style" command.
Emitted command journals contain no corresponding executed deletion or rejection receipt, so those reported reasons are not independently established.
Both backups remain; their model-driven cleanup subchecks are SKIP.
The migration and retained-consumer interruption backups also remain.
Fresh-copy, approved-preservation, and approved-downgrade backups were removed after recorded verification.

The retained-consumer attempt still needs its final report and successful-operation backup lifecycle for a complete behavioral PASS.
Prior historical FAIL and SKIP results remain. No revised Claude or Kiro behavioral run occurred.
The newer working-tree instructions remain untested by this frozen-package run.

### Session count and recorded usage

Counts come from existing JSONL `turn.completed` events, calculated by Node without another model.
The two timeout sessions emitted no completion usage event. Their usage is unknown, not zero.

| Session | Request | Input including cache | Cached input | Output |
|---|---|---:|---:|---:|
| 1 | Fresh copy pilot | 640,844 | 588,288 | 13,905 |
| 2 | Pagination, blocked setup | 716,904 | 661,760 | 23,325 |
| 3 | Pagination retry | 370,636 | 339,456 | 10,810 |
| 4 | Approved unpinned update | 315,902 | 285,696 | 10,175 |
| 5 | Unpinned migration, timeout | Unknown | Unknown | Unknown |
| 6 | Migration verification | 337,248 | 299,264 | 10,996 |
| 7 | Two removal questions | 317,975 | 282,880 | 13,038 |
| 8 | Approved preservation | 639,566 | 595,968 | 14,496 |
| 9 | Retained-consumer removal, timeout | Unknown | Unknown | Unknown |
| 10 | Downgrade question | 155,943 | 135,424 | 6,332 |
| 11 | Approved downgrade | 632,279 | 563,200 | 15,897 |
| 12 | Provenance and foreign refusal | 447,077 | 404,480 | 15,544 |
| **Known total** | **Ten completed sessions** | **4,574,374** | **4,156,416** | **134,518** |

Known uncached input is `417,958`. Known reasoning output is `77,628`, already included in output above.
These totals exclude both timeout sessions, the parent session, and any unreported infrastructure usage.
They are lower bounds, not an allowance percentage or invoice. Input accumulates across requests; cached input is not added twice.

Controls included one pilot, sequential execution, direct comparisons, shared archives, and grouped independent inspections.
The first canonical-write setup error still consumed an avoidable session because its sandbox preflight was incomplete.
Future preflights must exercise the actual sandbox, intended canonical writes, pinned installer, and shell temporary files before model work.
No further AI session is authorized by the exhausted twelve-session budget.

## Anonymous access and bounded release selection, 2026-10-03

Scope: working-tree changes after `b694f83`, case 4 transport and selection subchecks, plus installation and metadata checks.
Commands: Node with `curl` and `jq` against a controlled HTTP fixture, anonymous public HTTPS reads,
`npx skills@1.7.0 add` with explicit names and agents in a disposable consumer, recursive `diff -r`, and YAML parsing through `uv`.
The fixture had 300 records across three pages, with 18,400-byte bodies and the numeric maximum on page three.
Fixture commit resolution used a fixed 40-character value; the real public tag was resolved separately.

| Check | Result | Independent evidence |
|---|---|---|
| Anonymous default selection | PASS | Request journal contains three unauthenticated page requests; selected tag is `v0.0.1000` |
| Rejected optional credentials | PASS, controlled transport | HTTP 401 responses are followed by anonymous successful requests; target remains `v0.0.1000` |
| Bounded selection output | PASS | Selected JSON is 202 bytes, with no release body or asset marker; eight unsupported tags produce a count and three examples |
| Explicit older version | PASS | One direct `/releases/tags/v0.0.20` request, with no release-list request |
| Ineligible explicit versions | PASS | Draft, prerelease, orphan tag, and unsupported version each fail selection |
| Incomplete or malformed listing | PASS | Later-page HTTP 503, invalid JSON, and wrong response shape each reject without producing a target |
| Anonymous public access | PASS | Real HTTPS release lookup verifies published stable `v0.0.13` without an authorization header or credentials |
| Anonymous tag resolution | PASS | HTTPS `git ls-remote` with prompts and credential helpers disabled resolves `v0.0.13` to `57276ceb4a73b8b69a564ab9073a10ee48e70999` |
| Pinned installer packaging | PASS | Six tracked manager files match all three independent installed copies through recursive `diff -r` |
| Repository frontmatter | PASS | YAML parsing confirms identity, five opening fields, and unchanged manual invocation settings |
| Bundled quick validator | FAIL, validator limitation | It rejects existing `argument-hint` and `disable-model-invocation` fields, which this repository explicitly supports |

Case 3 local-status behavior and case 4 revised instruction following remain SKIP on all three harnesses.
No additional AI session or production mutation ran; direct results do not prove revised model behavior.
Earlier behavioral results apply only to their recorded packages.
Optional raw evidence, fixture code, and package hashes remain under `/private/tmp/wkc-manage-targets-ZnIUr7/`.
No supporting script was added to the shipped skill.
