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
   For a local-only target older than main, verify the approval screen flags absent remote publication and a target below main's tip.
   It must explain that ancestry and matching VERSION do not establish the intended merged release commit.

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
    Create a target draft while the published-release tag endpoint returns 404; verify it remains visible in the full release list.
    PASS: the skill verifies push access, finds the draft before filtering, refuses, and preserves its ID and complete state.
    Test multiple target releases and missing draft visibility; both must refuse before publication.
    A legacy stable release lacking the skill's notes heading must also refuse without edits.

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
    Insert a target draft after preparation and before release creation; the repeated complete list must detect it and stop.
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

## Dated report: 2026-10-02

This report records observations for identified candidates. It does not certify later source changes or harness versions.
Raw scratch data is optional local audit material, not a public evidence link.
The commands, target IDs, source hashes, observed state, and coverage limits below are the public report.

Tools: `skills@1.7.0`, Codex CLI `0.160.0`, Claude Code `2.1.288`, Kiro CLI `2.26.0`, GitHub CLI `2.97.0`,
and Git `2.54.0 (Apple Git-157)` for configuration probes.
Authenticated fixture account: `wilsonkichoi`, with push access.

### Historical publication and package evidence

Collection base: `750995d3fa4213165cbd6b7c7e3386d78aeba0c9`; branch VERSION: `0.0.13`.
Publication began at `0b1546769c6c883484e524ba8f3eabee1dc1684a`.
Shell and ordering corrections produced `8b564bb8cc5077d46a2c97cb4cd3fbee0015a2e2`.
Its `SKILL.md` hash was `8ae00b100349bb00bc88bc35886fb852973523b42aaa311dc2fc4d613c315e4b`.
These results concern earlier candidates, before the draft-lookup correction; they do not prove current publication behavior.

Fixtures retained for review:
[publication fixture](https://github.com/wilsonkichoi/skills-release-validation-20261002-1510),
[bootstrap fixture](https://github.com/wilsonkichoi/skills-release-bootstrap-20261002).
Only the installed Repository identity field changed to the corresponding fixture name.
Every other installed file was compared against its candidate, separately for each harness.

| Harness | Target | Target SHA | Observed release state |
|---|---|---|---|
| Codex | `v0.0.4` | `fb869ea413131ec6490cdfdf90cac90f30df3155` | Release `402192892`; rows 4, 3, 2 since 1; command text stayed literal; initially Latest. |
| Claude Code | `v0.0.10` | `a292193bf32079f3d9ec1c7a3ca46ec3b8edbcd6` | Release `402194325`; row 10 since 9; numeric Latest selection. Initial zsh push failed, then recovered. |
| Codex | `v0.0.2` | `65d3d388841fcfb1e74844e30cf6185f5fcf9bb6` | Remote-only recovery; row 2 since 1; `--latest=false` preserved Latest 10. |
| Claude Code | `v0.0.5` | `a128f7f736ba73f25cb1f2463d3a45d12d51dce5` | Release `402199403`; local-only recovery; row 5 since 4; preserved Latest 10. |
| Kiro CLI | `v0.0.6` | `630c31325ae49fdd854d96ffd0cfaed1f02d7b90` | Release `402203873`; local-only recovery; row 6 since 5; preserved Latest 10. |
| Claude Code | bootstrap `v0.0.1` | `2077f1cc781eaae155725be0e07cb898d2cf8914` | Release `402199852`; first-release heading, row 1, Latest. |

Complete before/after release and Latest snapshots matched on Codex's repeated `v0.0.4`, after lower releases appeared.
Paginated reads traversed more than 100 releases; drafts and prereleases were excluded from numeric comparisons.
Both fixtures enforced immutable tags: forced moves to different SHAs and deletions returned `GH013`; refs remained unchanged.
Bootstrap installation, tag reinstall, and byte comparisons passed on all three harness paths.
After bootstrap main advanced to `92208c4`, the pin still selected the earlier bytes; nonexistent `v0.0.999` installed nothing.

All three harnesses loaded the boolean metadata and a separate fallback export without publication.
The shared candidate kept its boolean. Fallback discovery listed four public skills and installed the maintainer skill.
The skill-creator validator rejected repository-supported Claude Code extension fields; YAML and actual loaders accepted them.
Initial Kiro login and selective tool-trust runs were SKIP; authenticated reruns succeeded.
Initial zsh refspec parsing and Claude parallel read/write ordering were FAIL, then corrected and checked through subsequent runs.
Kiro's configuration-refusal run at `56b0e6c` resolved the bootstrap README against the wrong directory; bootstrap resolution was unverified there.

Historical case matrix, under the earlier contract:


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


### Git configuration correction at `56b0e6c`

Candidate `SKILL.md`: `efde7f9d66b2cceebc4238aef27c36e7442aed6cf655eb6840b456e3ab0b8dd8`.
Separate Bash and zsh repositories set `push.followTags=true`, with unrelated reachable annotated 1 and lightweight target 2.
The old explicit refspec pushed both tags. The corrected command pushed only target 2, with its exact SHA.
The annotated local tag stayed unchanged. These local bare-remote command checks both passed; no GitHub publication was involved.
With `status.showUntrackedFiles=no`, plain status hid a nested sentinel.
Explicit `--untracked-files=all` found it initially and on repeated checks after preparation in both shells.
Installed Codex, Claude Code, and Kiro CLI copies each detected that hidden sentinel and refused preparation.
Independent checks found unchanged HEAD, refs, installed bytes, configuration, and sentinel contents.
Complete remote ref and release snapshots were byte-identical before and after all three invocations.
Publication under that configuration and controlled sentinel insertion during harness preparation remained SKIP as full harness cases.

### Opus review candidate

Candidate is based on `56b0e6c98d0d2b1755b99148e6ea6ec81ab13308`, with these packaged hashes:

| File | SHA-256 |
|---|---|
| `SKILL.md` | `40a109ee3e0b69ab73caea4047f9d760573fe2d91ed861d121577656f9e34936` |
| `README.md` | `c4119baa5f60de86467337acb16de53eacec38e166dec20ad0ca649b44e119c0` |
| `agents/openai.yaml` | `fde020d7e204734067088e02af408b5e0a77e7498907a8b8ebc5ced92f98c468` |

The published-release endpoint for fixture `v0.0.7` returned `HTTP 404` while the full two-page list contained:

```json
{"id":402236995,"tag_name":"v0.0.7","name":"Target draft conflict fixture","draft":true,"prerelease":false,"body":"Preserve this draft. Do not publish or replace it."}
```

The [GitHub API contract](https://docs.github.com/en/rest/releases/releases#list-releases) exposes drafts to push-access users; tag lookup returns published releases.

Each harness received an independently installed candidate in a clean main clone at `a292193bf32079f3d9ec1c7a3ca46ec3b8edbcd6`.
The only installed substitution was the Repository identity, set to the publication fixture above.
Each draft fixture had a local-only lightweight `v0.0.7`; each warning fixture had a local-only lightweight `v0.0.8`.
Neither tag existed remotely. Publication authorization was withheld.

The installed `SKILL.md` hash after the identity substitution was `8223d583d334563cc8721621fee4289b5f52e007ca06c1fb690cdcef3c8da80b` on all six paths.

| Added variant | Codex | Claude Code | Kiro CLI | Observed result |
|---|---|---|---|---|
| Case 11: target draft despite tag-endpoint 404 | PASS | PASS | PASS | Verified push access, found draft `402236995` in the complete list, and refused before publication. |
| Case 8: older local-only warning | PASS | PASS | PASS | Flagged absent remote publication and a target below main's tip; explained the ancestry limitation; ended on authorization. |

The warning target was `c729aac8356ab09c80e56152e938b4136fd89793` (`v0.0.8`).
All three prepared rows 8 and 7 since stable `v0.0.6`, excluding draft 7 from the boundary, with `--latest=false`.
Independent afterchecks verified unchanged HEAD, local refs, clean checkout, and all installed files on every fixture.
The complete paginated release data, target draft, remote refs, and Latest remained identical before and after all six runs.
Codex kept preparation in memory to honor the prompt's no-change constraint.
Claude and Kiro performed the required no-tag fetches and wrote temporary notes outside their checkouts; no publication occurred.
These are preparation/refusal subchecks, not complete publication runs.

The production `v0.0.12` body was independently read: it is stable and contains its changelog row without a notes heading.
It therefore fails the documented deterministic-body contract. No production state changed.
Legacy release refusal, duplicate target releases, missing push access, and controlled draft insertion were not exercised as harness cases.
The complete cases 8, 11, and 17 remain SKIP; narrower results above do not convert those full cases to PASS.
Production bootstrap remains SKIP until merge and explicit authorization for the actual merged target.

Representative draft commands, run inside the corresponding installed fixture; use `v0.0.8` for the warning variant:

```sh
codex exec --ephemeral --json -s danger-full-access '$wkc-skills-release v0.0.7
Prepare this disposable fixture release through the installed skill. Publication is not authorized. Do not change files, commits, tags, releases, or repository configuration. Report refusal, or show the complete prepared result and end on the required authorization question.' </dev/null
```

```sh
claude -p '/wkc-skills-release v0.0.7
Prepare this disposable fixture release through the installed skill. Publication is not authorized. Do not change files, commits, tags, releases, or repository configuration. Report refusal, or show the complete prepared result and end on the required authorization question.' --output-format stream-json --verbose --dangerously-skip-permissions </dev/null
```

```sh
kiro-cli chat --no-interactive --trust-all-tools --output-format stream-json '/wkc-skills-release v0.0.7
Prepare this disposable fixture release through the installed skill. Publication is not authorized. Do not change files, commits, tags, releases, or repository configuration. Report refusal, or show the complete prepared result and end on the required authorization question.' </dev/null
```

Independent public-state checks, authenticated for draft visibility:

```sh
gh api --paginate --slurp "repos/wilsonkichoi/skills-release-validation-20261002-1510/releases?per_page=100"
gh api repos/wilsonkichoi/skills-release-validation-20261002-1510/releases/402236995
git ls-remote --refs git@github.com:wilsonkichoi/skills-release-validation-20261002-1510.git
gh api repos/wilsonkichoi/skills-release-validation-20261002-1510/releases/latest
```
