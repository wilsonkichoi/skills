# ROADMAP: kv

Status: approved by the maintainer, 2026-10-30.

## core

Outcome: `kv set`, `get`, and `rename` work as SPEC sections 1 to 3.3 say.
Scope: SPEC 1, 2, 3.1 to 3.3.
Exit check: `make test` passes; `kv help` lists set, get, and rename in that order.

## integration

Outcome: `kv count` (SPEC 3.4) and `kv import` (SPEC 3.6) work together.
Exit check: `make test` passes; `sh scripts/count-gate.sh` passes.

## variants

Outcome: `kv version`, `kv del`, `kv get --default`, and the release and environment steps around them.
Exit check: `make test` passes.

## grants

Outcome: release and shared-environment steps for `kv version` and `kv del` behave as approved.
Exit check: `make test` passes.

## planning

Outcome: `kv export` and `kv debug`, once the SPEC covers them.
Exit check: `make test` passes.

## planning-none

Outcome: `kv export`, once the SPEC covers it.
Exit check: `make test` passes.

## admissions

Outcome: `kv append` and `kv touch` (SPEC 3.8, 3.9) on the store helpers, and the usage pages.
Exit check: `make test` passes.

## admissions-ro

Outcome: `kv touch` on the store helpers.
Exit check: `make test` passes.

## nopair

Outcome: the usage page for `kv help`.
Exit check: `docs/usage/help.md` exists.

## variants-v2

Outcome: Fresh copy of batch V scope, kv version and kv help <command>, including their unchanged release and environment steps.
Exit check: `make test` passes.

## variants-v2-high

Outcome: Fresh copy of variants-v2 for the high-effort Y33 recheck, with unchanged kv version and kv help <command> ticket bodies and gates.
Exit check: `make test` passes.

## park-p

Outcome: help exit-code documentation and keys listing, once the open order question is answered.
Exit check: `make test` passes.

## duplicates-p

Outcome: append and touch through SPEC 2.3 store helpers and SPEC 2.4 key validation.
Exit check: `make test` passes.
