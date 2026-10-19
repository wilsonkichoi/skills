// Report whether the skills installed in the current project match the repository's default branch.
// Usage: node tools/check-update.mjs <owner/repo>
//
// This repeats the comparison `npx skills update` makes, without installing anything. On update, the
// installer clones the source, hashes each skill folder with computeSkillFolderHash, and skips a skill
// whose hash equals the computedHash recorded in skills-lock.json. folderHash below is a sync rewrite
// of computeSkillFolderHash and collectFiles.
//
// Matched against skills 1.7.2 (dist/cli.mjs, near lines 1137 and 8038). The hash is an installer
// internal, not a documented interface. If a newer `skills` reports every skill as behind right after
// `make update`, the hash changed: compare those two functions in the new dist/cli.mjs and update
// folderHash and this version line.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";

const repo = process.argv[2];
if (!existsSync("skills-lock.json")) {
  console.log("No skills-lock.json in this directory, so nothing here was installed with `npx skills add`.");
  process.exit(0);
}
const lock = Object.entries(JSON.parse(readFileSync("skills-lock.json", "utf8")).skills)
  .filter(([, entry]) => entry.source === repo);

// Same algorithm as the installer's computeSkillFolderHash: files sorted by path, path then content.
function folderHash(dir) {
  const files = [];
  (function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory() && entry.name !== ".git" && entry.name !== "node_modules") walk(full);
      else if (entry.isFile()) files.push({ path: relative(dir, full).split("\\").join("/"), full });
    }
  })(dir);
  files.sort((a, b) => a.path.localeCompare(b.path));
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file.path);
    hash.update(readFileSync(file.full));
  }
  return hash.digest("hex");
}

const row = (status, name) => console.log(status.padEnd(15) + name);

const clone = mkdtempSync(join(tmpdir(), "skills-check-"));
try {
  execFileSync("git", ["clone", "--depth", "1", "--quiet", `https://github.com/${repo}.git`, clone], { stdio: "inherit" });
  const version = readFileSync(join(clone, "VERSION"), "utf8").trim();
  const commit = execFileSync("git", ["-C", clone, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  console.log(`Latest ${repo}: ${version} (${commit})\n`);

  for (const [name, entry] of lock) {
    const dir = join(clone, dirname(entry.skillPath));
    const pin = entry.ref ? `, pinned to ${entry.ref}` : "";
    if (!existsSync(dir)) row("removed", name + pin);
    else row(folderHash(dir) === entry.computedHash ? "up to date" : "behind", name + pin);
  }
  const installed = new Set(lock.map(([name]) => name));
  for (const name of readdirSync(join(clone, "skills")).sort()) {
    if (!installed.has(name) && existsSync(join(clone, "skills", name, "SKILL.md"))) row("not installed", name);
  }
} finally {
  rmSync(clone, { recursive: true, force: true });
}
