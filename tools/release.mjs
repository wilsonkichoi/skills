// Publish this collection's tags and GitHub Releases. Behind `make release`, which the
// wkc-skills-release skill runs.
//
//   node tools/release.mjs [vX.Y.Z]                  read everything, print the plan, write nothing
//   node tools/release.mjs vX.Y.Z --publish <sha>    publish that tag at that full commit SHA
//
// Without a tag, the target is VERSION on synchronized main. The plan prints the exact publish
// command, so an authorization names one tag and one commit. Sections 1 to 6 follow the skill's
// steps. It never changes versions, commits, or branches, and never moves or deletes a tag or edits
// a release: a conflict stops with nothing written, and a pushed mistake costs a new patch version.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Repository identity. A fixture copy of this script changes only this line.
const REPO = "wilsonkichoi/skills";

class Stop extends Error {}
const stop = (message) => { throw new Stop(message); };

function run(command, args) {
  try {
    return execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1 << 26 });
  } catch (error) {
    stop(`\`${command} ${args.join(" ")}\` failed: ${(error.stderr || error.message).trim()}`);
  }
}
const git = (...args) => run("git", args).trim();
const lines = (text) => text.split("\n").filter(Boolean);

const TAG = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const tuple = (tag) => TAG.exec(tag).slice(1).map(Number);
const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const sameText = (a, b) => a.replace(/\n$/, "") === b.replace(/\n$/, "");

// 1. Verify the checkout. Returns the synchronized main commit.

function repoOfUrl(url) {
  const match = /^(?:https:\/\/(?:[^@/]+@)?github\.com\/|git@github\.com:|ssh:\/\/git@github\.com(?::22)?\/)([^/]+\/[^/]+?)(?:\.git)?\/?$/i.exec(url);
  return match ? match[1].toLowerCase() : null;
}

function verifyCheckout() {
  run("gh", ["auth", "status"]);
  const urls = [...lines(git("remote", "get-url", "--all", "origin")), ...lines(git("remote", "get-url", "--push", "--all", "origin"))];
  for (const url of urls) {
    if (repoOfUrl(url) !== REPO.toLowerCase()) stop(`origin URL ${url} is not github.com/${REPO}`);
  }
  const view = JSON.parse(run("gh", ["repo", "view", REPO, "--json", "nameWithOwner,url"]));
  if (view.nameWithOwner.toLowerCase() !== REPO.toLowerCase()) stop(`gh resolves ${REPO} to ${view.nameWithOwner}`);

  let branch = "";
  try { branch = git("symbolic-ref", "--quiet", "--short", "HEAD"); } catch { /* detached */ }
  if (branch !== "main") stop(`the checkout is on ${branch || "a detached HEAD"}, not main`);
  if (git("status", "--porcelain", "--untracked-files=all")) stop("the checkout has uncommitted or untracked files");

  git("fetch", "--quiet", "--no-tags", "origin", "+refs/heads/main:refs/remotes/origin/main");
  const [head, local, remote] = ["HEAD", "refs/heads/main", "refs/remotes/origin/main"]
    .map((ref) => git("rev-parse", "--verify", `${ref}^{commit}`));
  if (head !== local || local !== remote) stop(`HEAD ${head}, main ${local}, and origin/main ${remote} must be the same commit`);
  return head;
}

// 2. Resolve the target: the tag, its commit, and the release data committed there.

const readAt = (sha, file) => run("git", ["show", `${sha}:${file}`]);

function versionAt(sha) {
  const match = /^(\S+)\n?$/.exec(readAt(sha, "VERSION"));
  if (!match || !VERSION.test(match[1])) stop(`VERSION at ${sha.slice(0, 7)} is not one canonical X.Y.Z line`);
  return match[1];
}

function localTag(tag) {
  const row = lines(git("for-each-ref", "--format=%(refname) %(objectname) %(objecttype)", `refs/tags/${tag}`))
    .map((line) => line.split(" ")).find(([ref]) => ref === `refs/tags/${tag}`);
  if (!row) return null;
  if (row[2] !== "commit") stop(`local ${tag} is an annotated tag; only lightweight commit tags are published`);
  return row[1];
}

function remoteTag(tag) {
  const refs = Object.fromEntries(lines(git("ls-remote", "--tags", "origin", `refs/tags/${tag}`, `refs/tags/${tag}^{}`))
    .map((line) => line.split("\t").reverse()));
  if (refs[`refs/tags/${tag}^{}`]) stop(`remote ${tag} is an annotated tag; only lightweight commit tags are published`);
  const sha = refs[`refs/tags/${tag}`];
  if (!sha) return null;
  git("fetch", "--quiet", "--no-tags", "origin", `refs/tags/${tag}`); // into FETCH_HEAD only
  if (git("cat-file", "-t", sha) !== "commit") stop(`remote ${tag} does not point at a commit`);
  return sha;
}

function isAncestor(a, b) {
  try { git("merge-base", "--is-ancestor", a, b); return true; } catch { return false; }
}

function resolveTarget(mainSha, requested) {
  const tag = requested ?? `v${versionAt(mainSha)}`;
  if (!TAG.test(tag)) stop(`${tag} is not a canonical vX.Y.Z tag`);
  const local = localTag(tag);
  const remote = remoteTag(tag);
  if (local && remote && local !== remote) stop(`local ${tag} is ${local} but remote ${tag} is ${remote}`);

  let target = local ?? remote;
  if (!target) {
    if (`v${versionAt(mainSha)}` !== tag) stop(`${tag} has no tag and VERSION on main is ${versionAt(mainSha)}; historical backfill is refused`);
    target = mainSha;
  }
  if (!isAncestor(target, mainSha)) stop(`${tag} at ${target} is not an ancestor of main ${mainSha}`);
  if (`v${versionAt(target)}` !== tag) stop(`VERSION at ${target} is ${versionAt(target)}, not ${tag.slice(1)}`);
  return { tag, target, local, remote, changelog: readAt(target, "CHANGELOG.md") };
}

// 3. Prepare notes and Latest from the complete release list and the target's changelog.

function parseChangelog(text) {
  const all = text.split("\n");
  const heading = /^## (\S+) \((.*)\)$/;
  let entries = [];
  if (all.some((line) => heading.test(line))) {
    for (const line of all) {
      const match = heading.exec(line);
      if (match) entries.push({ version: match[1], timestamp: match[2], body: [`### ${match[1]} (${match[2]})`] });
      else entries.at(-1)?.body.push(line);
    }
    for (const entry of entries) {
      while (entry.body.at(-1)?.trim() === "") entry.body.pop();
      entry.text = entry.body.join("\n");
    }
  } else {
    // The format of v0.0.17 and earlier: one `{version} {timestamp} {summary}` line per entry.
    entries = all.filter((line) => /^\d/.test(line)).map((line) => {
      const [version, timestamp] = line.split(" ");
      return { version, timestamp, text: line, oneLine: true };
    });
  }

  const seen = new Set();
  entries.forEach((entry, i) => {
    if (!VERSION.test(entry.version)) stop(`changelog entry ${entry.version} is not a canonical version`);
    if (seen.has(entry.version)) stop(`changelog has two ${entry.version} entries`);
    seen.add(entry.version);
    const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
    if (!iso.test(entry.timestamp) || Number.isNaN(Date.parse(entry.timestamp))) {
      stop(`changelog entry ${entry.version} has no ISO 8601 timestamp with an offset: ${entry.timestamp}`);
    }
    if (i > 0 && compare(tuple(`v${entry.version}`), tuple(`v${entries[i - 1].version}`)) >= 0) {
      stop(`changelog entries are not newest first at ${entry.version}`);
    }
  });
  return entries;
}

function latestTag() {
  try {
    return JSON.parse(execFileSync("gh", ["api", `repos/${REPO}/releases/latest`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })).tag_name;
  } catch (error) {
    if (/HTTP 404/.test(error.stderr ?? "")) return null;
    stop(`reading the Latest release failed: ${(error.stderr || error.message).trim()}`);
  }
}

function releaseList() {
  return JSON.parse(run("gh", ["api", "--paginate", "--slurp", `repos/${REPO}/releases?per_page=100`])).flat();
}

function remoteCommit(tag) {
  const refs = Object.fromEntries(lines(git("ls-remote", "--tags", "origin", `refs/tags/${tag}`, `refs/tags/${tag}^{}`))
    .map((line) => line.split("\t").reverse()));
  const sha = refs[`refs/tags/${tag}^{}`] ?? refs[`refs/tags/${tag}`];
  if (!sha) stop(`release ${tag} has no remote tag`);
  git("fetch", "--quiet", "--no-tags", "origin", `refs/tags/${tag}`);
  return sha;
}

function prepareRelease({ tag, target, changelog }) {
  if (JSON.parse(run("gh", ["api", `repos/${REPO}`])).permissions?.push !== true) {
    stop(`this account has no push access to ${REPO}, so the release list would leave out drafts`);
  }
  const releases = releaseList();
  const matches = releases.filter((r) => r.tag_name === tag);
  if (matches.length > 1) stop(`${matches.length} releases use ${tag}`);
  const release = matches[0] ?? null;
  if (release && (release.draft || release.prerelease)) stop(`the ${tag} release is a ${release.draft ? "draft" : "prerelease"}`);

  const stable = releases.filter((r) => !r.draft && !r.prerelease);
  for (const r of stable) if (!TAG.test(r.tag_name)) stop(`stable release tag ${r.tag_name} is not canonical vX.Y.Z`);
  const others = stable.filter((r) => r.tag_name !== tag);
  const below = others.filter((r) => compare(tuple(r.tag_name), tuple(tag)) < 0);

  let preceding;
  if (release) {
    // An existing release keeps the boundary its heading recorded, checked against publication times.
    const first = release.body?.split("\n")[0] ?? "";
    const since = /^## Changes since (\S+)$/.exec(first);
    if (!since && first !== "## Changes (first release)") stop(`release ${tag} has no notes heading, so it was not published by this process`);
    preceding = since ? since[1] : null;
    const boundary = preceding && others.find((r) => r.tag_name === preceding);
    if (preceding && (!boundary || compare(tuple(preceding), tuple(tag)) >= 0)) stop(`release ${tag} names boundary ${preceding}, which is not a lower stable release`);
    if (boundary && Date.parse(boundary.published_at) > Date.parse(release.published_at)) stop(`boundary ${preceding} was published after ${tag}`);
    const missed = below.find((r) => (!preceding || compare(tuple(r.tag_name), tuple(preceding)) > 0)
      && Date.parse(r.published_at) < Date.parse(release.published_at));
    if (missed) stop(`release ${tag} skips ${missed.tag_name}, which was published before it`);
  } else {
    preceding = below.map((r) => r.tag_name).sort((a, b) => compare(tuple(b), tuple(a)))[0] ?? null;
  }
  if (preceding) {
    const sha = remoteCommit(preceding);
    if (sha === target || !isAncestor(sha, target)) stop(`preceding release ${preceding} at ${sha} is not a strict ancestor of ${target}`);
  }

  const entries = parseChangelog(changelog);
  if (!entries.some((e) => `v${e.version}` === tag)) stop(`the changelog at ${target.slice(0, 7)} has no ${tag.slice(1)} entry`);
  if (preceding && !entries.some((e) => `v${e.version}` === preceding)) stop(`the changelog has no entry for preceding release ${preceding}`);
  const selected = entries.filter((e) => compare(tuple(`v${e.version}`), tuple(tag)) <= 0
    && (!preceding || compare(tuple(`v${e.version}`), tuple(preceding)) > 0));
  const notes = `${preceding ? `## Changes since ${preceding}` : "## Changes (first release)"}\n\n`
    + selected.map((e) => e.text).join(selected[0].oneLine ? "\n" : "\n\n") + "\n";

  const latestFlag = others.every((r) => compare(tuple(r.tag_name), tuple(tag)) < 0) ? "--latest" : "--latest=false";
  return { release, preceding, notes, versions: selected.map((e) => e.version), latestFlag, latest: latestTag() };
}

// 4. Check recovery and authorization.

function prepare(requested) {
  const mainSha = verifyCheckout();
  const target = resolveTarget(mainSha, requested);
  const plan = { mainSha, ...target, ...prepareRelease(target) };
  if (plan.release) {
    const r = plan.release;
    if (!plan.remote) stop(`release ${plan.tag} exists but its remote tag does not`);
    if (r.name !== plan.tag) stop(`release ${plan.tag} is titled ${JSON.stringify(r.name)}`);
    if (!sameText(r.body ?? "", plan.notes)) stop(`release ${plan.tag} notes differ from the notes its changelog produces`);
  }
  return plan;
}

function printPlan(plan) {
  const state = plan.release ? "published; nothing to do"
    : plan.remote ? "remote tag exists; release missing"
    : plan.local ? "local tag only; never pushed"
    : "new";
  console.log(`repository: ${REPO}
tag:        ${plan.tag}
commit:     ${plan.target}
state:      ${state}
preceding:  ${plan.preceding ?? "none (first release)"}
versions:   ${plan.versions.join(", ")}
latest:     ${plan.release ? `Latest is ${plan.latest ?? "none"}` : `${plan.latestFlag} (Latest is now ${plan.latest ?? "none"})`}`);
  if (plan.local && !plan.remote && plan.target !== plan.mainSha) {
    console.log(`\nWARNING: ${plan.tag} exists only locally, was never published, and is not main's tip.
Ancestry and a matching VERSION do not prove it is the intended merged release commit.`);
  }
  console.log(`\nnotes:\n-----\n${plan.notes}-----`);
}

const same = (a, b) => a.tag === b.tag && a.target === b.target && a.notes === b.notes && a.latestFlag === b.latestFlag;

// 5. Publish and verify. Every write is preceded by a fresh read of everything the plan rests on.

function publish(plan) {
  const recheck = () => {
    const now = prepare(plan.tag);
    if (!now.release && !same(now, plan)) stop("the target, notes, or Latest decision changed since the plan was printed; run make release again");
    return now;
  };

  if (!plan.local) {
    recheck();
    git("-c", "tag.gpgSign=false", "tag", "--no-sign", plan.tag, plan.target);
    console.log(`created local tag ${plan.tag}`);
  }
  if (!plan.remote) {
    if (recheck().release) return report(plan, "unchanged: another publisher finished it");
    try {
      git("push", "--quiet", "--no-follow-tags", "origin", `refs/tags/${plan.tag}:refs/tags/${plan.tag}`);
    } catch (error) {
      console.error(`local tag ${plan.tag}: ${plan.target}`);
      console.error(`remote tag ${plan.tag}: ${remoteTag(plan.tag) ?? "missing"}`);
      throw error;
    }
    if (remoteTag(plan.tag) !== plan.target) stop(`remote ${plan.tag} does not point at ${plan.target} after the push`);
    console.log(`pushed tag ${plan.tag}`);
  }
  if (recheck().release) return report(plan, "unchanged: another publisher finished it");

  const dir = mkdtempSync(join(tmpdir(), "release-notes-"));
  const notesFile = join(dir, `${plan.tag}.md`);
  writeFileSync(notesFile, plan.notes);
  try {
    run("gh", ["release", "create", plan.tag, "--repo", REPO, "--verify-tag", "--title", plan.tag, "--notes-file", notesFile, plan.latestFlag]);
    verifyPublished(plan);
  } catch (error) {
    console.error(`notes kept at ${notesFile} for recovery`);
    console.error(`remote tag ${plan.tag}: ${remoteTag(plan.tag) ?? "missing"}`);
    console.error(`releases for ${plan.tag}: ${releaseList().filter((r) => r.tag_name === plan.tag).length}`);
    throw error;
  }
  rmSync(dir, { recursive: true });
  report(plan, plan.local || plan.remote ? "resumed and published" : "newly published");
}

function verifyPublished(plan) {
  if (remoteTag(plan.tag) !== plan.target) stop(`remote ${plan.tag} no longer points at ${plan.target}`);
  const matches = releaseList().filter((r) => r.tag_name === plan.tag);
  const r = matches[0];
  if (matches.length !== 1 || r.draft || r.prerelease || r.name !== plan.tag || !sameText(r.body ?? "", plan.notes)) {
    stop(`release ${plan.tag} does not read back as one stable release with the prepared title and notes`);
  }
  const latest = latestTag();
  const expected = plan.latestFlag === "--latest" ? plan.tag : plan.latest;
  if (latest !== expected) stop(`Latest is ${latest ?? "none"}, expected ${expected ?? "none"}`);
}

// 6. Report.

function report(plan, outcome) {
  const r = releaseList().find((release) => release.tag_name === plan.tag);
  console.log(`\n${outcome}
repository: ${REPO}
tag:        ${plan.tag}
commit:     ${plan.target}
release:    ${r?.html_url ?? "none"}
versions:   ${plan.versions.join(", ")}
latest:     ${latestTag() ?? "none"}`);
}

const args = process.argv.slice(2);
const publishAt = args.includes("--publish") ? args[args.indexOf("--publish") + 1] : null;
const requested = args.find((arg, i) => !arg.startsWith("--") && args[i - 1] !== "--publish") ?? null;
try {
  if (args.includes("--publish") && (!requested || !/^[0-9a-f]{40}$/.test(publishAt ?? ""))) {
    stop("publishing needs the tag and the full commit SHA from the plan: release.mjs vX.Y.Z --publish <sha>");
  }
  const plan = prepare(requested);
  printPlan(plan);
  if (plan.release) {
    report(plan, "unchanged: the release already matches");
  } else if (!publishAt) {
    console.log(`\nNothing was written. To publish exactly this, run:\n  make release TAG=${plan.tag} PUBLISH=${plan.target}`);
  } else if (publishAt !== plan.target) {
    stop(`authorization names ${publishAt}, but ${plan.tag} resolves to ${plan.target}`);
  } else {
    publish(plan);
  }
} catch (error) {
  if (!(error instanceof Stop)) throw error;
  console.error(`\nstopped: ${error.message}`);
  process.exit(1);
}
