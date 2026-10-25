#!/usr/bin/env bash
# Branch lifecycle for the git repository in the current directory, behind the Makefile targets.
#
#   branch.sh worktree <branch>   new branch from origin/main in ../<repo>-worktrees/<branch>,
#                                 plus the gitignored files that .worktreeinclude names
#   branch.sh merge [<pr>]        squash-merge a pull request, by default the current branch's
#   branch.sh cleanup <branch>    after its pull request merged, remove the branch's worktree,
#                                 local branch, and remote branch
#
# .worktreeinclude is Claude Code's file for the same job (gitignore syntax; only gitignored files
# that match are copied), so `claude --worktree` and `make worktree` copy the same files.

set -euo pipefail

die() { echo "error: $*" >&2; exit 1; }

# The main checkout, also when this runs inside a linked worktree.
main_root=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")

# The worktree that has <branch> checked out, or nothing.
worktree_of() {
  git -C "$main_root" worktree list --porcelain | awk -v ref="refs/heads/$1" '
    /^worktree / { path = substr($0, 10) }
    $0 == "branch " ref { print path }'
}

# True when local tip <tip> is pull request <number>'s head <head> or behind it, so the pull
# request has all its work. A review round can push a fix commit from another checkout.
in_pr() {
  [ "$1" = "$2" ] && return
  git -C "$main_root" fetch --quiet origin "refs/pull/$3/head"
  git -C "$main_root" merge-base --is-ancestor "$1" "$2"
}

cmd_worktree() {
  local branch=$1
  local dest=${WORKTREES:-$(dirname "$main_root")/$(basename "$main_root")-worktrees}/${branch//\//-}

  git -C "$main_root" fetch --quiet origin main
  git -C "$main_root" worktree add --quiet --no-track -b "$branch" "$dest" origin/main

  if [ -f "$main_root/.worktreeinclude" ]; then
    # Untracked files that match .worktreeinclude, kept only when gitignored. NUL-separated, so
    # git never quotes a path with non-ASCII bytes or spaces.
    (
      cd "$main_root"
      git ls-files -z --others --ignored --exclude-from=.worktreeinclude \
        | git check-ignore -z --stdin \
        | tar --null -cf - -T - | tar -xpf - -C "$dest"
    )
  fi

  echo "worktree: $dest"
  echo "branch:   $branch, from origin/main at $(git -C "$dest" rev-parse --short HEAD)"
}

cmd_merge() {
  local pr=${1:-} info number state branch head title
  info=$(gh pr view ${pr:+"$pr"} --json number,title,state,headRefName,headRefOid \
    --jq '"\(.number)\t\(.state)\t\(.headRefName)\t\(.headRefOid)\t\(.title)"')
  IFS=$'\t' read -r number state branch head title <<< "$info"
  [ "$state" = OPEN ] || die "PR #$number is $state, not OPEN"

  # A local branch ahead of the PR means the merge would leave out work.
  local tip=""
  if tip=$(git rev-parse --verify --quiet "refs/heads/$branch"); then
    in_pr "$tip" "$head" "$number" || die "local $branch is at ${tip:0:7}, PR #$number head is ${head:0:7}; push or reset it first"
  fi

  echo "merging PR #$number: $title ($branch at ${head:0:7})"
  gh pr merge "$number" --squash --match-head-commit "$head"
}

cmd_cleanup() {
  local branch=$1 info number state head
  [ "$branch" != main ] || die "refusing to clean up main"
  info=$(gh pr view "$branch" --json number,state,headRefOid --jq '"\(.number)\t\(.state)\t\(.headRefOid)"') \
    || die "no pull request found for $branch"
  IFS=$'\t' read -r number state head <<< "$info"
  [ "$state" = MERGED ] || die "PR #$number for $branch is $state, not MERGED"

  # Squash merges leave the branch unmerged by ancestry, so compare with the PR head instead.
  local tip=""
  if tip=$(git rev-parse --verify --quiet "refs/heads/$branch"); then
    in_pr "$tip" "$head" "$number" || die "local $branch is at ${tip:0:7}, but PR #$number merged ${head:0:7}; it has work the PR does not"
  fi

  local path
  path=$(worktree_of "$branch")
  if [ "$path" = "$main_root" ]; then
    [ -z "$(git -C "$main_root" status --porcelain)" ] || die "the main checkout is on $branch with uncommitted changes"
    git -C "$main_root" switch --quiet main
  elif [ -n "$path" ]; then
    case "$PWD/" in "$path"/*) die "run this from outside $path, which is about to be removed" ;; esac
    git -C "$main_root" worktree remove "$path" || die "git refused to remove $path; commit or discard its changes first"
    echo "removed worktree $path"
  fi

  if [ -n "$tip" ]; then
    git -C "$main_root" branch --quiet -D "$branch"
    echo "deleted local branch $branch"
  fi

  local remote
  remote=$(git -C "$main_root" ls-remote --heads origin "refs/heads/$branch" | cut -f1)
  if [ -n "$remote" ]; then
    [ "$remote" = "$head" ] || die "origin/$branch is at ${remote:0:7}, but PR #$number merged ${head:0:7}; left it in place"
    git -C "$main_root" push --quiet origin --delete "$branch"
    echo "deleted origin/$branch"
  fi

  git -C "$main_root" fetch --quiet --prune origin
  if [ "$(git -C "$main_root" branch --show-current)" = main ]; then
    git -C "$main_root" pull --quiet --ff-only origin main
    echo "main is at $(git -C "$main_root" rev-parse --short HEAD)"
  fi
}

case "${1:-}" in
  worktree) [ -n "${2:-}" ] || die "usage: branch.sh worktree <branch>"; cmd_worktree "$2" ;;
  merge)    cmd_merge "${2:-}" ;;
  cleanup)  [ -n "${2:-}" ] || die "usage: branch.sh cleanup <branch>"; cmd_cleanup "$2" ;;
  *)        die "usage: branch.sh worktree|merge|cleanup ..." ;;
esac
