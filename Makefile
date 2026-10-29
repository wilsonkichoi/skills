# Install, update, or check the wkc- skills in the current directory.
#
#   make install             every public skill, for Claude Code, Codex, and Kiro CLI
#   make install-internal    the same, plus the internal wkc-skills-release
#   make update              same as install: rerunning `add` refreshes skills and adds new ones
#   make check-update        show which installed skills are up to date or behind
#
# Branch lifecycle for the repository in the current directory (see tools/branch.sh):
#   make worktree BRANCH=fix/foo   new branch from origin/main in ../<repo>-worktrees/fix-foo,
#                                  with the gitignored files listed in .worktreeinclude
#   make merge [PR=33]             squash-merge a pull request, by default the current branch's
#   make cleanup BRANCH=fix/foo    once its pull request merged, delete the branch's worktree,
#                                  local branch, and remote branch, then fast-forward main
#
# Release this collection from a clean, synchronized main checkout (see tools/release.mjs):
#   make release [TAG=v0.0.25]     print the plan for VERSION on main, or for that tag; writes nothing
#   make release TAG=v0.0.25 PUBLISH=<sha>   publish exactly what the plan printed
#
# Test the wkc-tracker GitHub backend script (see tools/wkc-tracker/test_github.py):
#   make test-tracker
#
# Choose agents or skills by overriding the defaults:
#   make install AGENTS=codex SKILLS="wkc-tracker wkc-help"
#
# From another project: make -f ~/src/skills/Makefile install

REPO   := wilsonkichoi/skills
AGENTS ?= claude-code codex kiro-cli
SKILLS ?= *
HERE   := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))

# `-a '*'` replaces a top-level skills/ source directory with links (see README), so refuse it.
ADD = $(if $(findstring *,$(AGENTS)),$(error Name the agents; AGENTS='*' can delete skills/ source))npx skills add $(REPO) $(foreach s,$(SKILLS),-s '$(s)') $(foreach a,$(AGENTS),-a $(a)) -y

.PHONY: install update install-internal check-update worktree merge cleanup release test-tracker
install update:
	$(ADD)

install-internal:
	INSTALL_INTERNAL_SKILLS=1 $(ADD)

check-update:
	node $(HERE)tools/check-update.mjs $(REPO)

worktree:
	$(if $(BRANCH),,$(error BRANCH is required, e.g. make worktree BRANCH=fix/foo))bash $(HERE)tools/branch.sh worktree '$(BRANCH)'

merge:
	bash $(HERE)tools/branch.sh merge $(if $(PR),'$(PR)')

cleanup:
	$(if $(BRANCH),,$(error BRANCH is required, e.g. make cleanup BRANCH=fix/foo))bash $(HERE)tools/branch.sh cleanup '$(BRANCH)'

test-tracker:
	uv run --script $(HERE)tools/wkc-tracker/test_github.py

release:
	node $(HERE)tools/release.mjs $(if $(TAG),'$(TAG)') $(if $(PUBLISH),--publish '$(PUBLISH)')
