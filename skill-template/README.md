# Skill template

Read this when you are creating a skill, checking an existing one, or porting one in. It is not
part of the shipped skill set. The installer discovers a skill by finding a `SKILL.md` anywhere in
the repository, not by looking under `skills/`, which is why the skeleton here is named
`SKILL.md.template`. Rename that file and this folder becomes an installable skill called
`wkc-skill-name`.

Everything the Agent Skills specification requires is written out below, so you never have to fetch
the spec to work in this repository.

## When creating or porting skill

```
cp -r skill-template skills/wkc-<name>
mv skills/wkc-<name>/SKILL.md.template skills/wkc-<name>/SKILL.md
```

Then, in the copy:

1. Set the directory, frontmatter `name`, main heading, and invocation examples to the same `wkc-<name>` identifier.
2. Rewrite `description`. Two sentences: what it does, and when to use it in the words someone would
   actually type. Keep it on one physical line, unquoted.
3. Fill in the five doc-block fields: **What it does**, **When to use it**, **Dependencies**, **Input**, and **Output**.
   Keep that order. "none" is a fine answer for **Dependencies** or **Input**.
   **Input** explains accepted arguments, their meanings, required context, and existing behaviour when arguments are omitted.
   Replace `argument-hint: "[arguments]"` with actual accepted arguments, or remove the field when arguments are unnecessary.
4. Replace the numbered sections with the real run order, ending in a report step.
5. Update `agents/openai.yaml`: `display_name` becomes `wkc-<name>`, `short_description`
   becomes the first sentence of the description.
6. Delete this `README.md` from the copy.

Check with `npx skills add <gh-handle>/<skills-repo> -l`, which lists what the repository exposes. A
new skill should appear once, and nothing named `wkc-skill-name` should ever appear.

## What the spec requires

Getting these wrong breaks the install, so they are not negotiable.

| Field | Required | Constraint |
|---|---|---|
| `name` | yes | 1 to 64 characters, lowercase letters, digits, and hyphens only. No leading or trailing hyphen, no `--`. Must match the parent directory name. |
| `description` | yes | 1 to 1024 characters. Covers what the skill does and when to use it. One physical line, unquoted. |
| `license` | no | Not used here; the repository `LICENSE` covers it. |
| `compatibility` | no | Not used here. Max 500 characters. Put environment requirements on the **Dependencies** line instead. |
| `metadata` | no | Not used here. A map of string keys to string values. |
| `allowed-tools` | no | Experimental, support varies by harness. Not used here. |

**Dependencies** in the doc block is deliberately broad. It is everything that has to exist before
the skill can run, whether that is another skill in this repository, a CLI like `git` or `gh`, an
MCP server, a config field in `docs/dev-agents/config.md`, network access, or a runtime version. It
is not limited to other skills, and it is where the spec's `compatibility` information goes, which
is why this repository leaves that field alone.

The body after the frontmatter has no format restrictions in the spec. The whole file loads once a
harness activates the skill, so the ceiling is 500 lines and the guidance is under 5000 tokens.

Supporting files may sit in `scripts/`, `references/`, or `assets/`. Reference them with relative
paths from the skill root, one level deep, and avoid nested reference chains.

## What this repository adds

The `wkc-` identifier rule is required here. The remaining conventions are guidelines that help
skills read alike; a skill with a reason can depart from those guidelines.

- All skill identifiers start with `wkc-` and match across the directory, frontmatter, display name, main heading, and examples.
- The doc block opens the body, one short line per item, in the order the template shows it. A
  reader should know what the skill needs and what it leaves behind before reading any step.
- Numbered `## N.` sections in run order, one job each, ending in a step that reports back.
- Around 150 lines, where the spec allows 500. Read it as a smell test, not a limit: past that, a
  skill is usually carrying project policy rather than instructions, and the fix is moving the policy
  out rather than compressing the prose.
- A plain sibling `.md` next to `SKILL.md` is the default for supporting material.
- `scripts/`, `references/`, `assets/` are optional. Add when it is useful and easy to maintain.

## Manual invocation

Optional `argument-hint` is a Claude Code extension, not an Agent Skills standard field.
Its quoted string describes existing arguments, with `[]` for optional arguments and `<>` for required values.
Claude Code shows it during autocomplete.
The hint does not validate arguments, define parsing rules, or change runtime behaviour.
Do not promise hint display in Codex or Kiro. Keep prefix guidance in the root README's invocation table.

Manual invocation is the default. Keep these template settings unless the skill explicitly opts into model invocation:

- Claude Code: `disable-model-invocation: true` in the `SKILL.md` frontmatter.
- Codex: `policy.allow_implicit_invocation: false` in `agents/openai.yaml`.

None of these are part of the spec; they are harness extensions.

Future skills may opt into model invocation individually. Declare intended callers in the skill
body: people, models, or named skills. For model callers, enable supported settings for each harness:

- Claude Code: set `disable-model-invocation: false` or omit the restriction, as documented in
  [invocation control](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill).
- Codex implicit selection: set `policy.allow_implicit_invocation: true` or omit it to use the
  documented default, `true`, in [skill settings](https://developers.openai.com/codex/skills).

Name skill dependencies with their exact `wkc-` identifiers. Report an unavailable or blocked
dependency instead of substituting an unprefixed skill. Invocation settings still apply to dependencies.

## Check the result

Installing and running it is the only check that counts, and it is the same on every harness:
install the skill into a throwaway repository, invoke it on Claude Code, on Codex, and on Kiro CLI,
and read what it produced. That is step 6 of the porting process in `AGENTS.md`.

Before that, reread the frontmatter against the table above. Watch the name in particular: the
template ships with `name: wkc-skill-name`, which is valid, so nothing will complain about a copy you
have not renamed yet.
