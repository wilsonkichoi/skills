# Install, update, or check the wkc- skills in the current directory.
#
#   make install             every public skill, for Claude Code, Codex, and Kiro CLI
#   make install-internal    the same, plus the internal wkc-skills-release
#   make update              same as install: rerunning `add` refreshes skills and adds new ones
#   make check-update        show which installed skills are up to date or behind
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

.PHONY: install update install-internal check-update
install update:
	$(ADD)

install-internal:
	INSTALL_INTERNAL_SKILLS=1 $(ADD)

check-update:
	node $(HERE)tools/check-update.mjs $(REPO)
