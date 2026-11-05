#!/bin/sh
# Gate for kv count: a store with two keys counts 2.
set -eu
KV="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)/bin/kv"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
export KV_FILE="$T/store"
printf 'a=1\nb=2\n' > "$T/in"
if ! "$KV" import "$T/in" 2>/dev/null; then
  printf 'a\t1\nb\t2\n' > "$KV_FILE"
fi
n=$("$KV" count)
[ "$n" = 2 ] || { echo "count gave $n, want 2" >&2; exit 1; }
echo "count gate ok"
