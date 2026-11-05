## What to build

`kv append <key> <value>`, as SPEC 3.8 says, reading and writing the store through the store helpers (SPEC 2.3).

## Why

Scripts build up a log value over several runs.

## Acceptance criteria

- `tests/test_append.sh` writes the store file directly, then covers: append to an existing value, a missing key exits 1. `make test` passes.
- `kv append` uses `read_store` and `write_store` from `bin/lib.sh`.

## After merge

None.
