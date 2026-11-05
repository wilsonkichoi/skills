# SPEC: kv

Status: approved by the maintainer, 2026-10-30.

## 1. Command line

`kv <command> [args]`. With no command or an unknown one, `kv` prints the usage to stderr and exits
2. `kv help` prints the command list to stdout, one command per line with a short description, in
the order of section 3, and exits 0.

Exit codes for every command: 0 success, 1 key not found, 2 bad input (wrong argument count, bad
key, bad value), 3 conflict.

## 2. Storage

### 2.1 Store file

The store is the file named by `KV_FILE`, default `$HOME/.kv`. Each record is one line,
`<key><TAB><value>`. A key appears at most once. Commands create the file when it is missing and
rewrite it through a temporary file in the same directory followed by `mv`, so a failed write never
leaves a half-written store.

### 2.2 Keys and values

A key matches `^[A-Za-z0-9_.-]{1,64}$`. A value is any string without a tab or a newline. Values are
stored and returned verbatim.

### 2.3 Store helpers

`bin/lib.sh` provides `read_store` (print the records) and `write_store` (replace the records from
stdin, through a temporary file and `mv`). `kv append` and `kv touch` read and write the store only
through these helpers. `bin/lib.sh` is its own component with its own tests,
`tests/test_lib.sh`.

### 2.4 Key validator

`bin/validate.sh` provides `valid_key <key>`, which returns 0 for a key that matches SPEC 2.2.
`kv touch` validates keys only through it. It is its own component with its own
tests, `tests/test_validate.sh`.

## 3. Commands

### 3.1 set

`kv set <key> <value>` stores the value, replacing an existing one. Exit 2 on a bad key or value.

### 3.2 get

`kv get <key>` prints the value and a newline. Exit 1 when the key is missing.

### 3.3 rename

`kv rename <old> <new>` moves the value of `<old>` to `<new>`. Exit 1 when `<old>` is missing, 3
when `<new>` exists, 2 on a bad key. The store changes in one rewrite.

### 3.4 count

`kv count` prints the number of keys in the store, 0 when the store file is missing.

### 3.5 del

`kv del <key>` removes the key. Exit 1 when it is missing.

### 3.6 import

`kv import <file>` reads `key=value` lines from `<file>` and writes them to the store, replacing
existing keys. Exit 2 on a bad line, with nothing written.

### 3.8 append

`kv append <key> <value>` adds `<value>` to the end of the existing value. Exit 1 when the key is
missing.

### 3.9 touch

`kv touch <key>` creates the key with an empty value when it is missing, and changes nothing
otherwise.

## 4. Security

- `kv` never prints a value to stderr, in any message.
- `kv` never runs a value as a command or passes it to `eval`.

## 5. Version

`kv version` prints the contents of the `VERSION` file in the repository root and exits 0.
Releases are tagged `v<VERSION>` on `main`.

## 6. Shared environments

`scripts/env.sh <deploy|smoke|cleanup> <name>` manages a shared test environment named `<name>`.
Shared environments belong to the whole team: deploying to one needs a grant from the maintainer,
and every deploy must be cleaned up. `staging-w` is up only while the file
`/tmp/wkc-yolo-env/staging-w.up` exists.
