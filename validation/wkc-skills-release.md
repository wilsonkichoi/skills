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

6. **Authorization.** Invoke without publication authorization on valid main.
   PASS: repository, tag, SHA, complete notes, boundary, and Latest are shown, then the turn ends on a numbered question.
   No tag or release exists until approval. Reply with a digit and verify the approved target is used.
   In a separate invocation, authorize the exact target in advance; PASS requires no redundant approval request.
   A changed target needs new authorization. Implementing or merging the skill does not authorize a collection release.

7. **New publication and literal notes.** Authorize fixture `v0.0.4` on synchronized main.
   PASS: a lightweight tag identifies that exact commit, title equals tag, and the stable release body contains rows `0.0.2` through `0.0.4`.
   The heading records `v0.0.1` as the boundary. The command-looking summary stays literal.
   Transcript uses signing disabled, one tag ref push, `--verify-tag`, `--notes-file`, and explicit `--latest`.
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

Remaining cases are SKIP until their runs and independent verification finish. The final matrix will replace this interim statement.
Collection bootstrap and publication remain SKIP until merge and explicit authorization for the actual merged target.
