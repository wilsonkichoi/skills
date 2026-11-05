# Test helpers. Each tests/test_*.sh file sources this first.
set -u
KV="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)/bin/kv"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
export KV_FILE="$TMP/store"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

# expect_exit <code> <command...>: run the command and check its exit code.
expect_exit() {
  want=$1
  shift
  "$@" >/dev/null 2>&1
  got=$?
  [ "$got" -eq "$want" ] || fail "$* exited $got, want $want"
}
