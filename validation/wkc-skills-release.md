# wkc-skills-release validation

Run the candidate through installed copies on Codex, Claude Code, and Kiro CLI.
Record PASS, FAIL, or SKIP for each numbered case on each harness, with independent evidence.
An unavailable check is SKIP. Reading source or running a command manually is not harness behavior.
Keep raw logs, fixtures, notes, and API snapshots outside tracked files, under `.local/runs/release/` or an external directory.
Record source commit, installed file hashes, installer version, harness versions, and exact test commands.

## Preparation

Export a clean candidate tree. Local installation copies ignored files too; do not install a populated worktree.
Use `skills@1.7.0` for every active installer command.

```sh
npx skills@1.7.0 add "<clean-candidate>" --list
```

```sh
npx skills@1.7.0 add "<clean-candidate>" --skill wkc-skills-release --list
```

```sh
npx skills@1.7.0 add "<clean-candidate>" --skill wkc-skills-release -a claude-code -a codex -a kiro-cli -y
```

Use a disposable GitHub repository, public unless the account's plan enforces rulesets on private repositories.
Apply the production `Immutable release tags` ruleset: active, tag target `refs/tags/v*`, no bypass actors,
rules `deletion`, `non_fast_forward`, and `update`, with creation allowed.
Before publication cases, attempt both movement and deletion of a test tag and verify GitHub refuses both.
Keep the fixture and evidence available for review; deleting a repository needs separate authorization.

Install the candidate in the fixture. Change only the installed copy's labeled Repository identity field.
Record the source commit and exact test-only diff; check every other installed file against the source.
Test the unmodified skill separately for wrong-repository refusal.
Never modify the production repository identity to make the unmodified-skill check pass.

Use sequential fixture commits with canonical `VERSION`, newest-first changelog rows, and known timestamps.
Keep installed harness files ignored so the publication checkout remains clean.
Fixture changelog summaries should include command-looking text, to check literal notes handling.
Start with a stable release at `v0.0.1`, untagged versions `0.0.2` and `0.0.3`, and main at `0.0.4`.
Include an unrelated draft and prerelease. Use a disposable clone for local conflicts.
For each invocation, record remote refs, release fields, Latest, local status, and installed file hashes before and after.

## Cases

1. **Discovery and package.** Compare ordinary discovery, explicit internal discovery, and source `SKILL.md` count.
   PASS: three public skills, four total shipped skills, explicit internal availability, and no template or fixture skill.
   All three installed paths resolve correctly; every packaged file matches the candidate.
   Parse five opening fields, exact names, optional tag input, manual invocation settings, and boolean metadata.
   Check `metadata.internal` is boolean `true`, not string `"true"`.

2. **Actual harness loading.** Invoke the installed identifier in each harness, with the boolean unchanged.
   Use `$wkc-skills-release` for Codex and `/wkc-skills-release` for Claude Code and Kiro CLI.
   PASS requires a transcript showing the skill loaded and performed a contract check, without a frontmatter parser error.
   Installation success alone is not PASS. Credentials or session failures are SKIP with the exact error.

3. **Metadata fallback.** In a separate test export, remove only the boolean metadata field.
   PASS: discovery and direct bulk installation include the maintainer skill, and the one shared source still loads on each harness.
   Check the tracked fallback explicitly requires the planned `wkc-manage add all` to exclude this identifier by name.
   Apply fallback to the candidate only if a supported harness actually rejects the boolean.
   An unavailable harness cannot justify fallback. No per-harness variant is permitted.

4. **Unmodified wrong repository.** Invoke the unmodified installed skill against the disposable repository.
   PASS: it refuses the origin identity, creates no tag or release, and preserves checkout and installed files.
   Test a fork URL and a different host too. The skill must not publish to its configured repository from the wrong checkout.

5. **Checkout and input gates.** Independently test dirty tracked files, untracked files, a feature branch, detached HEAD,
   local main ahead, local main behind, failed authentication, failed fetch, and inaccessible release data.
   Test missing VERSION, malformed VERSION, malformed tags, suffixes, leading zeroes, and empty or duplicate changelog entries.
   PASS: each names the failed check and stops before publication, without switching, pulling, stashing, or resetting.
   Network and authorization failures are never interpreted as absent tags, releases, or Latest.
   Set `status.showUntrackedFiles=no` and create a nested untracked sentinel before invocation.
   Require refusal from `git status --porcelain --untracked-files=all`; preserve the sentinel and verify no publication.

6. **Authorization.** Invoke without publication authorization on valid main.
   PASS: repository, tag, SHA, complete notes, boundary, and Latest are shown, then the turn ends on a numbered question.
   No tag or release exists until approval. Reply with a digit and verify the approved target is used.
   In a separate invocation, authorize the exact target in advance; PASS requires no redundant approval request.
   A changed target needs new authorization. Implementing or merging the skill does not authorize a collection release.

7. **New publication and literal notes.** Authorize fixture `v0.0.4` on synchronized main.
   PASS: a lightweight tag identifies that exact commit, title equals tag, and the stable release body contains rows `0.0.2` through `0.0.4`.
   The heading records `v0.0.1` as the boundary. The command-looking summary stays literal.
   Set `push.followTags=true` and create an unrelated reachable annotated tag that is absent remotely.
   Transcript uses signing disabled, one tag ref push with `--no-follow-tags`, `--verify-tag`, `--notes-file`, and explicit `--latest`.
   Compare every remote ref before and after; only the authorized lightweight tag may be added.
   The unrelated annotated tag must remain absent remotely and unchanged locally.
   Execute the documented variable commands in both Bash and zsh; colon-adjacent variables must use braces.
   Verify Latest and release fields through separate API reads; compare installed hashes and checkout status.

8. **Interrupted publication.** In separate fixtures, pre-create only a matching local tag and only a matching remote tag.
   Also interrupt after remote push but before release creation, and after release creation but before verification.
   PASS: each resumes the exact commit without moving tags, ignores no conflicts, and reports the completed steps accurately.
   A failed command that actually landed is resolved by a read, not a blind second write.

9. **Main advances after tagging.** Push a matching `v0.0.5` tag, leave its release absent, then advance main to `0.0.6`.
   Invoke explicit `v0.0.5` from synchronized main.
   PASS: committed `0.0.5` data determines notes and version; the tag does not move to main's newer commit.
   Also test a target outside main ancestry and a tagged commit with mismatched VERSION; both must refuse.

10. **Repeated publication.** Repeat a correct published release, then repeat it after main and Latest advance.
    PASS: no tag or release mutation, identical notes, and a verified no-op that reports current Latest status.
    Compare release ID, body, timestamps, remote refs, and Latest before and after, not only CLI output.

11. **Conflicting state.** Test different local and remote SHAs, annotated local and remote target tags,
    wrong committed VERSION, and an existing release with incorrect title, notes, draft state, or prerelease state.
    PASS: each stops without tag movement, release edits, or further publication.
    Existing release checks must use the remote tag's commit, not GitHub's `target_commitish` branch string.

12. **Immutable tags.** Attempt forced update and deletion of the fixture test tag with the same account the harness uses.
    PASS: both return GitHub rule violations, and an independent remote read shows the original tag SHA.
    A ruleset POST returning success is insufficient. Run this before the publication cases.

13. **Historical backfill.** On main `0.0.6`, request untagged `v0.0.3`.
    PASS: refusal and no local or remote tag, even though that historical VERSION exists in main's history.
    Compare against case 9: an existing matching historical tag can resume.

14. **Skipped versions and notes boundaries.** Prepare a release above several untagged changelog rows.
    PASS: every row since the greatest lower published stable version is included, using numeric semver order.
    Drafts, prereleases, and untagged versions do not move the boundary.
    With no stable release, include all target changelog rows and use the first-release heading.
    Refuse a missing boundary row, missing boundary tag, unrelated boundary ancestry, or malformed stable release tag.

15. **Pagination and Latest preservation.** Create more than one API page of release fixtures.
    Include `v0.0.9` and `v0.0.10` so lexical ordering produces the wrong answer.
    Publish a newer stable release, then resume a lower existing tag whose release is absent.
    PASS: all pages are read, the lower release uses `--latest=false`, and prior Latest stays byte-identical by tag and release ID.
    Drafts and prereleases do not prevent a numerically highest stable target from using `--latest`.

16. **Original boundary survives recovery order.** Publish `v0.0.6` after `v0.0.4` while tagged `v0.0.5` has no release.
    Resume `v0.0.5`, then repeat `v0.0.6`.
    PASS: `v0.0.6` remains a no-op with its original `v0.0.4` boundary and complete notes.
    A false boundary that skips a lower release already published strictly before the target is a conflict.

17. **Revalidation and publication failures [MANUAL when controlled interruption is unavailable].**
    Change main, target refs, notes, or stable releases between preparation and publication; separately fail tag push and release creation.
    PASS: changed preparation stops for review; failures report actual remote state and retain the notes file for matching recovery.
    A concurrent correct release is a verified no-op. Concurrent Latest changes must be reported when post-verification detects them.
    No failure permits rollback of immutable tags or editing a conflicting release.
    Inspect tool ordering: every read permitting a write must finish and be checked before that write starts.
    Set `status.showUntrackedFiles=no` and add a nested untracked sentinel after preparation, before the first publication write.
    Require revalidation with `--untracked-files=all`, refusal, an unchanged sentinel, and no new remote tag or release.

18. **Fixture bootstrap and pin.** Record the fixture's main SHA, install from its unpinned tip, and compare every installed skill file.
    Publish the authorized fixture version, reinstall through its full Git URL with `#vX.Y.Z`, and compare against the remote tagged SHA.
    Advance main independently and prove the tag still selects the earlier bytes. A nonexistent ref must fail.
    PASS requires exact commands, source commit, test-only identity diff, resolved paths, and file comparisons per harness.

19. **Repository integration.** Re-read issue #12 and the pre-commit checklist.
    PASS: one patch bump, timestamped changelog, replaced roster row, `vX.Y.Z` terminology, documented boolean exception and fallback,
    updated discovery checks, pinned active installer commands, CONTRIBUTING links, and tracked design rationale.
    No generic release config, scripts, hooks, build system, or per-skill version stamps were added.
    The pull request describes rationale and the stale version assumption; it remains unmerged.

20. **Collection bootstrap after merge [MANUAL].** After explicit merge authorization and merge, record the actual main commit.
    Bootstrap the unmodified skill from main, compare all files against that recorded commit, then invoke it with explicit release authorization.
    Reinstall from the resulting immutable tag and verify the pin on all supported harnesses.
    PASS only with actual publication and file evidence. Until merge and concrete release authorization exist, record SKIP.
    Issue #12 expected `0.0.12`, but main already released that version before this implementation; use the merged VERSION, expected `0.0.13`.

## Report

Record case results per harness, with commands, source SHA, exact identity diff, file hashes, fixture URLs, and independent state reads.
Separate static/package checks, manual GitHub rule probes, actual harness runs, and production publication.
Explain every FAIL and SKIP. A partial case is SKIP, with its completed checks listed as partial evidence.
Report lives below so no parallel status file or additional top-level directory is needed.

## Run log

### 2026-10-02 candidate, initial evidence

Base: `750995d3fa4213165cbd6b7c7e3386d78aeba0c9`. Initial publication source: `0b1546769c6c883484e524ba8f3eabee1dc1684a`.
Skill hashes before the shell correction:

| File | SHA-256 |
|---|---|
| `SKILL.md` | `976bb4a56d5e747829e9c16500bd841b1d2f0336f495c259623907cde69d8df1` |
| `README.md` | `40c1a1091da90e96d3f5f3b2505b03488e83a68b6a31dbc82a85306dc1184849` |
| `agents/openai.yaml` | `fde020d7e204734067088e02af408b5e0a77e7498907a8b8ebc5ced92f98c468` |

Tools: `skills@1.7.0`, Codex CLI `0.160.0`, Claude Code `2.1.288`, Kiro CLI `2.26.0`, GitHub CLI `2.97.0`.
Fixture: [skills-release-validation-20261002-1510](https://github.com/wilsonkichoi/skills-release-validation-20261002-1510).
Raw evidence is under `.local/runs/release/` in the implementation worktree.
The initial loader and preparation runs preceded the final clarification to inspect every origin URL and fetch with `--no-tags`.
The publication and refusal runs used the hashes above.

Completed independent package checks: three public skills, four internal-inclusive/source skills, exact installed bytes on three harness paths,
boolean YAML metadata, invocation settings, five opening fields, and one repository identity field.
The fallback export lists four public skills and bulk-installs the maintainer skill on all three paths.
Actual loaders: Codex and Claude Code accepted boolean metadata; Kiro CLI started browser login on both default and V2 engines.
Both Kiro attempts were stopped. Its actual loader check is SKIP pending authenticated access, not an incompatibility finding.
The fallback was not applied to the shared candidate.

The skill-creator validator rejected the supported Claude Code extension fields `argument-hint` and `disable-model-invocation`.
This is a validator limitation, not a skill parser failure. Independent PyYAML checks and actual Codex/Claude Code loading passed.
An initial Codex read-only sandbox run could not access GitHub credentials; its full-access rerun verified wrong-repository refusal.
The authenticated account and fixture match the account used for GitHub ruleset probes.
Forced movement and deletion of fixture `v0.0.1` both returned `GH013`, with `Cannot update this protected ref` and `Cannot delete this tag`.
The remote SHA stayed `8697aff2d41205958f4ab160f2c82b9e12824f98`.

Codex published fixture `v0.0.4` at `fb869ea413131ec6490cdfdf90cac90f30df3155`, release ID `402192892`.
Independent API reads confirm complete rows `0.0.2` through `0.0.4`, original boundary `v0.0.1`, and stable publication.
The transcript shows `--verify-tag`, `--notes-file`, disabled tag signing, and `--latest`.
No command-looking changelog text executed; the checkout stayed clean and the notes file was removed after verification.
Codex separately refused untagged historical `v0.0.3`, a conflicting local SHA, an annotated local tag, and an untracked sentinel.
Claude Code prepared the fixture release, showed complete notes and Latest, and ended on the numbered authorization question without publishing.

Claude Code published fixture `v0.0.10` at `a292193bf32079f3d9ec1c7a3ca46ec3b8edbcd6`, release ID `402194325`.
The preceding stable release was `v0.0.9`; numeric comparison correctly selected `--latest` and notes containing only `0.0.10`.
An initial push attempt exposed zsh's `$tag:r` modifier parsing in the documented refspec.
The harness verified that the remote tag was still absent, corrected the quoting, and completed publication.
The candidate now uses `${tag}` before the refspec colon and `${target}` before committed file paths.
Independent Bash and zsh checks both resolve the exact refspec and committed VERSION correctly.
The corrected `SKILL.md` SHA-256 is `ce83381530178c7e6869e4432145c5c65e3b797ff3e4633c391d3145988e4dc8`.
README and interface hashes are unchanged. The first-attempt push is recorded as a corrected failure, never a clean pass.

### 2026-10-02 candidate before Git configuration corrections

Skill source for these runs: `8b564bb8cc5077d46a2c97cb4cd3fbee0015a2e2`, after the shell and sequential-read corrections.
The later Git configuration corrections change the packaged skill; their evidence appears below.

| File | SHA-256 before Git configuration corrections |
|---|---|
| `SKILL.md` | `8ae00b100349bb00bc88bc35886fb852973523b42aaa311dc2fc4d613c315e4b` |
| `README.md` | `40c1a1091da90e96d3f5f3b2505b03488e83a68b6a31dbc82a85306dc1184849` |
| `agents/openai.yaml` | `fde020d7e204734067088e02af408b5e0a77e7498907a8b8ebc5ced92f98c468` |

The installed publication copies use the candidate bytes with only this test substitution:

```diff
-**Repository identity:** `wilsonkichoi/skills`
+**Repository identity:** `wilsonkichoi/skills-release-validation-20261002-1510`
```

The bootstrap fixture uses the final candidate, committed at `2077f1cc781eaae155725be0e07cb898d2cf8914`.
Its only installed publication substitution is:

```diff
-**Repository identity:** `wilsonkichoi/skills`
+**Repository identity:** `wilsonkichoi/skills-release-bootstrap-20261002`
```

Both diffs, phase-specific hashes, prompt files, CLI transcripts, and independent API reads remain under `.local/runs/release/`.
The earlier validation fixture contains an older source snapshot; installed bytes, not that snapshot, identify each tested candidate.
The bootstrap fixture's committed skill matches all final hashes above.

#### Harness loading and fallback

Kiro login completed. Its final loader transcript shows actual authentication and origin checks, followed by wrong-repository refusal.
All three harnesses accepted the unchanged boolean. No fallback was applied to the shipped source.
In a separate export, removing only `metadata.internal` made all four skills public and bulk-installable.
Each harness loaded that fallback copy and refused the wrong repository without publication.
The fallback consumer also contained untracked installer files; wrong identity alone already required refusal.
These are actual loader checks, separate from the independent YAML and installer checks.

Evidence: `loader-codex-unsandboxed.jsonl`, `loader-claude.jsonl`, `loader-kiro-final.jsonl`, and `fallback-<harness>.jsonl`.
The final fallback export retained every other skill byte and the shared source retained its boolean.
The tracked fallback requires the planned `wkc-manage add all` to exclude the identifier explicitly.

#### Publication and recovery evidence

| Harness | Target | Target SHA | Result and independent evidence |
|---|---|---|---|
| Codex | `v0.0.4` | `fb869ea413131ec6490cdfdf90cac90f30df3155` | New release `402192892`; rows 4, 3, 2 since 1; literal command text; initially Latest. |
| Claude Code | `v0.0.10` | `a292193bf32079f3d9ec1c7a3ca46ec3b8edbcd6` | New release `402194325`; numeric 10 exceeds 9; row 10 since 9; Latest. Shell failure recovered before the source correction. |
| Codex | `v0.0.2` | `65d3d388841fcfb1e74844e30cf6185f5fcf9bb6` | Remote-only tag resumed after main reached 10; committed row 2 since 1; `--latest=false`. |
| Claude Code | `v0.0.5` | `a128f7f736ba73f25cb1f2463d3a45d12d51dce5` | Final candidate resumed local-only tag; release `402199403`; row 5 since 4; `--latest=false`. |
| Kiro CLI | `v0.0.6` | `630c31325ae49fdd854d96ffd0cfaed1f02d7b90` | Final candidate resumed local-only tag; release `402203873`; row 6 since 5; `--latest=false`. |
| Codex | `v0.0.4` | `fb869ea413131ec6490cdfdf90cac90f30df3155` | Verified no-op after main and Latest reached 10 and lower releases 2 and 3 appeared. Complete release and Latest JSON stayed identical. |
| Claude Code | bootstrap `v0.0.1` | `2077f1cc781eaae155725be0e07cb898d2cf8914` | Final candidate published first stable release `402199852`; first-release heading and row 1; `--latest`. |

Publication targets above belong only to the two disposable repositories.
Independent reads confirm lightweight refs, exact titles and notes, `draft=false`, and `prerelease=false`.
Lower recovery publications preserved Latest `v0.0.10`, release ID `402194325`.
Paginated reads traversed two pages, including more than 100 releases, an unrelated draft, and an unrelated prerelease.
No `SHOULD_NOT_EXIST` sentinel was created. Publication checkouts and installed skill files stayed unchanged.
Before/after snapshots for the repeated release are `repeat-before.json` and `repeat-after.json`.

The first Claude local-only recovery at `v0.0.3` had a real ordering defect:
the final permitting read and release creation shared a parallel tool batch.
That attempt is FAIL for ordering, even though its resulting release was correct.
The final candidate explicitly requires each permitting read to finish before its write.
Claude's `v0.0.5`, Kiro's `v0.0.6`, and bootstrap `v0.0.1` transcripts show the corrected sequential ordering.
No controlled concurrent publisher was injected, so the broader race case remains SKIP.

Kiro's selective tool-trust attempt could not execute shell tools and is SKIP.
The authenticated rerun with `--trust-all-tools` completed recovery and verification.
Kiro also recovered from a macOS `mktemp` filename mistake before publication; this did not change the target or notes.
Unavailable credentials, disabled tools, and corrected failures are not counted as initial passes.

#### Bootstrap and pin evidence

Bootstrap fixture: [skills-release-bootstrap-20261002](https://github.com/wilsonkichoi/skills-release-bootstrap-20261002).
Its main SHA before installation and publication was `2077f1cc781eaae155725be0e07cb898d2cf8914`.
The unpinned installer copied the complete source skill to `.agents/skills/wkc-skills-release`.
`.claude/skills/wkc-skills-release` and `.kiro/skills/wkc-skills-release` resolved to that same complete directory.
Every file matched the recorded source before the identity substitution and authorized invocation.
After publication, reinstalling the immutable tag restored every file's original identity and final hash on all three paths.
Main then advanced to `92208c4` with VERSION `0.0.2` and a unique README marker.
A second tagged installation still matched the earlier commit and excluded the marker.
A nonexistent `v0.0.999` reported a missing ref and installed no skill; installer exit status alone was insufficient.
Evidence: `bootstrap-source.json`, `bootstrap-identity.diff`, `bootstrap-publish-claude.jsonl`, `bootstrap-pin.log`, and `missing-ref.log`.

Both fixtures enforce the production-equivalent tag ruleset with no bypass actors.
Independent forced updates to different commits and deletions returned `GH013`; original tag SHAs remained unchanged.
The bootstrap fixture's protected test tag was `v99.0.0`; it had no release and did not affect stable release comparison.
These shared rule probes are independent Git/GitHub checks, not claims that each harness attempted forbidden writes.

#### Commands and prompts

Package checks used the clean exports below from the implementation worktree; installation used the respective consumer directories.
Publication commands ran from their fixture checkouts. Each CLI received the literal prompt file as one argument.
Native CLI invocations used closed standard input, preventing setup scripts from becoming prompt input.
Raw output filenames identify the run; no helper script ships with the skill.

```sh
npx skills@1.7.0 add /Users/wchoi/src/skills-issue-12/.local/runs/release/source --list
npx skills@1.7.0 add /Users/wchoi/src/skills-issue-12/.local/runs/release/source --skill wkc-skills-release --list
npx skills@1.7.0 add /Users/wchoi/src/skills-issue-12/.local/runs/release/source --skill wkc-skills-release -a claude-code -a codex -a kiro-cli -y
npx skills@1.7.0 add /Users/wchoi/src/skills-issue-12/.local/runs/release/fallback-source --skill '*' -a claude-code -a codex -a kiro-cli -y
```

```sh
codex exec --ephemeral --json -s danger-full-access "$(cat ../resume-remote-codex.prompt)" </dev/null
claude -p "$(cat ../resume-local-claude-corrected.prompt)" --output-format stream-json --verbose --dangerously-skip-permissions </dev/null
kiro-cli chat --no-interactive --trust-all-tools --output-format stream-json "$(cat ../resume-local-kiro.prompt)" </dev/null
```

Exact final recovery prompts:

```text
$wkc-skills-release v0.0.2. Resume only this disposable fixture release. I explicitly authorize repository wilsonkichoi/skills-release-validation-20261002-1510, tag v0.0.2, commit 65d3d388841fcfb1e74844e30cf6185f5fcf9bb6, with contract-generated notes and Latest decision. Use the installed skill through verification. Do not modify versions or commits, create helper scripts, change installed skill files, or publish to the production collection. Do not request redundant authorization.
```

```text
/wkc-skills-release v0.0.5. Resume this local-tag-only disposable fixture release. I explicitly authorize repository wilsonkichoi/skills-release-validation-20261002-1510, tag v0.0.5, commit a128f7f736ba73f25cb1f2463d3a45d12d51dce5, with contract-generated notes and Latest decision. Execute the installed skill through verification. Do not modify versions or commits, create helper scripts, change installed skill files, or publish to the production collection. Do not request redundant authorization.
```

```text
/wkc-skills-release v0.0.6. Resume this local-tag-only disposable fixture release. I explicitly authorize repository wilsonkichoi/skills-release-validation-20261002-1510, tag v0.0.6, commit 630c31325ae49fdd854d96ffd0cfaed1f02d7b90, with contract-generated notes and Latest decision. Execute the installed skill through verification. Do not modify versions or commits, create helper scripts, change installed skill files, or publish to the production collection. Do not request redundant authorization.
```

Bootstrap installation and independent reads:

```sh
npx --yes skills@1.7.0 add https://github.com/wilsonkichoi/skills-release-bootstrap-20261002 --skill wkc-skills-release -a codex -a claude-code -a kiro-cli -y
npx --yes skills@1.7.0 add 'https://github.com/wilsonkichoi/skills-release-bootstrap-20261002.git#v0.0.1' --skill wkc-skills-release -a codex -a claude-code -a kiro-cli -y
npx --yes skills@1.7.0 add 'https://github.com/wilsonkichoi/skills-release-bootstrap-20261002.git#v0.0.999' --skill wkc-skills-release -a codex -y
git ls-remote --tags origin 'refs/tags/v0.0.1' 'refs/tags/v0.0.1^{}'
gh api repos/wilsonkichoi/skills-release-bootstrap-20261002/releases/tags/v0.0.1
gh api --paginate 'repos/wilsonkichoi/skills-release-validation-20261002-1510/releases?per_page=100'
gh api repos/wilsonkichoi/skills-release-validation-20261002-1510/releases/latest
```

```text
/wkc-skills-release v0.0.1. Publish this disposable fixture release using the just-bootstrapped installed skill. I explicitly authorize repository wilsonkichoi/skills-release-bootstrap-20261002, tag v0.0.1, commit 2077f1cc781eaae155725be0e07cb898d2cf8914, with contract-generated notes and Latest decision. Execute the installed skill through verification. Do not modify versions or commits, create helper scripts, change installed skill files, or publish to the production collection. Do not request redundant authorization.
```

#### Case matrix before Git configuration corrections

PASS means the entire numbered case ran on that harness, or the stated shared package check applies to its installed path.
SKIP includes partial cases. The evidence column identifies successful subchecks and every unrun part.
An earlier failed attempt remains recorded above even where a corrected narrower check subsequently passed.

| Case | Codex | Claude Code | Kiro CLI | Evidence and remaining checks |
|---|---|---|---|---|
| 1 Package/discovery | PASS | PASS | PASS | Shared discovery, YAML, exact bytes, and resolved installation paths. |
| 2 Boolean loader | PASS | PASS | PASS | Actual installed invocation and origin refusal; Kiro rerun after login. |
| 3 Fallback | PASS | PASS | PASS | Shared export removes only metadata; public count 4, bulk paths, actual loaders, documented exclusion. |
| 4 Wrong repository | SKIP | SKIP | SKIP | All refused unmodified wrong identity; separate fork and host variants were not run. |
| 5 Checkout/input gates | SKIP | SKIP | SKIP | Codex refused an untracked sentinel. Other listed dirty, branch, synchronization, access, and malformed-input variants were not run. |
| 6 Authorization | SKIP | SKIP | SKIP | Claude ended preparation on a numbered question without writes. All honored exact advance authorization. Digit reply and changed-target variants were not run. |
| 7 New publication | PASS | SKIP | SKIP | Codex 4 includes literal rows and independent state; shared Bash/zsh checks passed. Claude 10 and bootstrap 1 passed publication subchecks; literal-row publication was not run there. Kiro ran recovery only. |
| 8 Interrupted publication | SKIP | SKIP | SKIP | Codex remote-only, Claude local-only, Kiro local-only passed. Each harness did not run every tag state or a controlled post-write interruption. |
| 9 Advanced main | SKIP | SKIP | SKIP | All recovery runs used older committed data after main reached 10. Outside-ancestry and mismatched-VERSION negatives were not run. |
| 10 Repeated publication | PASS | SKIP | SKIP | Codex repeated 4 after main/Latest advanced; complete JSON unchanged. Other harness repeats were not run. |
| 11 Conflicts | SKIP | SKIP | SKIP | Codex refused conflicting local SHA and annotated local tag. Remote annotations and release-field mismatch variants were not run. |
| 12 Immutable tags | PASS | PASS | PASS | Shared independent enforced update/deletion probes, same authenticated account, unchanged remote refs. |
| 13 Backfill refusal | PASS | SKIP | SKIP | Codex refused untagged historical 3 while main was 4. Other harness invocations were not run. |
| 14 Notes boundaries | SKIP | SKIP | SKIP | Codex skipped rows 2/3 included; Claude first-release heading verified. Invalid-boundary variants were not run on any harness. |
| 15 Pagination/Latest | SKIP | PASS | SKIP | Claude 10 followed by 5 covers numeric higher/lower publication and pagination. Codex and Kiro preserved Latest with paginated reads but did not each publish a numeric higher target. |
| 16 Original boundary | SKIP | SKIP | SKIP | Codex no-op 4 preserved original boundary 1 after lower 2/3 appeared. False-boundary negative and other harness repetitions were not run. |
| 17 Races/failures | SKIP | SKIP | SKIP | Claude's initial parallel ordering FAIL was fixed and sequential ordering passed on final Claude/Kiro runs. Controlled concurrent state changes and remaining command-failure variants were not injected. |
| 18 Bootstrap/pin | PASS | PASS | PASS | Shared per-path byte comparisons before invocation and after tag install; Claude publisher; changed-main pin and missing ref independently checked. |
| 19 Integration | PASS | PASS | PASS | Shared source/checklist inspection; one patch bump, linked docs, pinned commands, rationale, PR against main. |
| 20 Production bootstrap | SKIP | SKIP | SKIP | Requires merge, then explicit authorization for the actual merged production target. |

The broader unrun variants remain listed for future executions; this report does not claim a complete harness suite passed.
The requested release categories have actual evidence across the harnesses, with remaining subcases explicitly marked SKIP.
Production `v0.0.12` already existed when implementation began; branch VERSION is `0.0.13`.
Collection bootstrap and publication remain SKIP until merge and explicit authorization for the actual merged target.

### 2026-10-02 Git configuration corrections

Review of `bc6442135df35b79b9b1b7835e6cd440cd5492db` exposed two configuration-dependent defects.
An explicit tag refspec still follows unrelated reachable annotated tags when `push.followTags=true`.
Plain porcelain status hides untracked files when `status.showUntrackedFiles=no`.
The candidate now pushes with `--no-follow-tags` and checks `--untracked-files=all` initially and during revalidation.
Cases 5, 7, and 17 now require those configurations explicitly.
The earlier case matrix records the earlier candidate; its PASS results do not cover these added variants.

Candidate: working tree based on `bc6442135df35b79b9b1b7835e6cd440cd5492db`, with these packaged hashes:

| File | SHA-256 |
|---|---|
| `SKILL.md` | `efde7f9d66b2cceebc4238aef27c36e7442aed6cf655eb6840b456e3ab0b8dd8` |
| `README.md` | `d95348ffaa945adb1a8014c6b84eb5bbf70898d50634e7fe9ea92866d447f467` |
| `agents/openai.yaml` | `fde020d7e204734067088e02af408b5e0a77e7498907a8b8ebc5ced92f98c468` |

Tools: Git `2.54.0 (Apple Git-157)`, installer `skills@1.7.0`, and the same three harness versions recorded above.
Raw commands, configuration, refs, outputs, installs, prompts, and transcripts remain under `.local/runs/release/git-config-regression/`.

#### Independent command checks

Separate local repositories and bare remotes were used for Bash and zsh.
Each repository set `push.followTags=true` and contained reachable annotated `v0.0.1` plus lightweight target `v0.0.2`.
The original push added both tags to its empty remote, reproducing the defect.
The corrected command was extracted from the candidate and executed against a separate empty remote.
Independent reads found only `refs/tags/v0.0.2`, with the exact target SHA; the local annotated tag remained unchanged.
No GitHub repository was written during these command checks.

Each repository also set `status.showUntrackedFiles=no`.
The corrected status command first returned empty output, then detected `nested/untracked-sentinel` after preparation.
The original status command returned empty output with the same sentinel present.
Both repeated corrected reads returned `?? nested/untracked-sentinel`, and the sentinel bytes remained unchanged.

| Command variant | Bash | zsh |
|---|---|---|
| Original push publishes the unrelated annotated tag | Reproduced | Reproduced |
| Corrected push adds only the authorized lightweight tag | PASS | PASS |
| Original status hides the nested sentinel | Reproduced | Reproduced |
| Corrected initial check and repeated check detect the sentinel | PASS | PASS |

Evidence: `evidence.json`, with every command and output, complete remote refs, configuration writes, and target SHAs.
These are manual command checks, not harness publication results.

#### Installed harness checks

A clean candidate export was installed separately into three isolated fixture clones.
Every installed file matched the candidate before the single Repository identity substitution recorded above.
The publication identity was `wilsonkichoi/skills-release-validation-20261002-1510`.
The installed `SKILL.md` hash after substitution was `2b0f8a8dc337d7028b6afc0bd87406d65d6fab510a07ced7d66672f8bfaf18ab` on every harness.
Each clone set `status.showUntrackedFiles=no`, then received the same nested sentinel.
Independent prechecks confirmed plain status was empty and explicit untracked status reported that file.

Each harness loaded its installed skill, used `--untracked-files=all`, found the sentinel, and refused preparation.
Independent afterchecks verified unchanged HEAD, local refs, installed bytes, configuration, and sentinel contents.
Complete remote refs and paginated release snapshots were byte-identical before and after all three invocations.
Kiro incorrectly resolved the bootstrap README against the checkout root before proceeding to the required checkout check.
Its sentinel refusal passed; this run provides no bootstrap README resolution evidence.

| Added variant | Codex | Claude Code | Kiro CLI |
|---|---|---|---|
| Case 5: hidden untracked sentinel causes refusal | PASS | PASS | PASS |
| Case 7: publication with followed tags configured | SKIP | SKIP | SKIP |
| Case 17: controlled sentinel insertion after harness preparation | SKIP | SKIP | SKIP |

Cases 7 and 17 have manual command evidence above; their new complete harness variants were not executed.
The complete case 5 remains SKIP because its other negative variants were not rerun.
Production bootstrap remains SKIP pending merge and concrete release authorization.

Commands, run from each corresponding `<harness>-dirty` fixture directory:

```sh
codex exec --ephemeral --json -s danger-full-access "$(cat ../codex.prompt)" </dev/null
claude -p "$(cat ../claude.prompt)" --output-format stream-json --verbose --dangerously-skip-permissions </dev/null
kiro-cli chat --no-interactive --trust-all-tools --output-format stream-json "$(cat ../kiro.prompt)" </dev/null
```

The prompt requests installed-skill preparation of `v0.0.10` without publication authorization or file, ref, or configuration changes.
Evidence: `<harness>-install.log`, `<harness>.prompt`, `<harness>.jsonl`, `harness-before.json`, `harness-after.json`,
`remote-refs-{before,after}.txt`, and `releases-{before,after}.txt`.
