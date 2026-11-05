## What to build
Provide `bin/lib.sh` with `read_store` and `write_store` as SPEC 2.3 defines. Give this component its own `tests/test_lib.sh`.

## Why
Append and touch require a shared store component to preserve the plain-text store safely, from SPEC 2.1 and 2.3.

## Acceptance criteria
- [ ] `sh tests/test_lib.sh` passes and checks that `read_store` prints existing records verbatim and handles a missing store.
- [ ] `sh tests/test_lib.sh` checks that `write_store` replaces records from stdin through a temporary file in the store directory followed by `mv`, creates a missing store, preserves empty values and literal characters, and leaves the original store unchanged on a failed write.
- [ ] `make test` passes.

## Notes

SPEC 2.1 defines a plain-text key/value store rewritten through a temporary file and mv.
SPEC 2.3 requires bin/lib.sh with read_store and write_store, plus tests/test_lib.sh.
This component is absent from the exported baseline. The append ticket requires it.
The driver must verify that observation in the fresh fixture before planting discovery records.
