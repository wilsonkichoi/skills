## What to build

`kv keys` prints every key in the store, one per line.

## Why

Scripts iterate over stored keys.

## Acceptance criteria

- `tests/test_keys.sh` checks the output order. `make test` passes.

## Open question

Should `kv keys` print keys sorted, or in store order? Nobody has decided. The PRD and SPEC do not say, and the answer changes the test.
