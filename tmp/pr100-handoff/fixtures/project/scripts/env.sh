#!/bin/sh
# env.sh <deploy|smoke|cleanup> <name>: a stand-in for a shared test environment.
set -eu
D=/tmp/wkc-yolo-env
mkdir -p "$D"
case $1 in
  deploy) date +%s >> "$D/$2.deployed"; echo "deployed $2" ;;
  smoke)
    case $2 in staging-w) [ -f "$D/staging-w.up" ] || { echo "staging-w is down" >&2; exit 1; } ;; esac
    [ -f "$D/$2.deployed" ] || { echo "$2 has no deploy" >&2; exit 1; }
    echo "smoke ok $2" ;;
  cleanup) rm -f "$D/$2.deployed"; date +%s >> "$D/$2.cleaned"; echo "cleaned $2" ;;
  *) echo "usage: env.sh <deploy|smoke|cleanup> <name>" >&2; exit 2 ;;
esac
