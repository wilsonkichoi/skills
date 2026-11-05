. "$(dirname "$0")/lib.sh"

expect_exit 0 "$KV" help
expect_exit 2 "$KV"
expect_exit 2 "$KV" no-such-command
"$KV" help | grep -q '^help' || fail "help does not list help"
