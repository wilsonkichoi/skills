# PRD: kv

Status: approved by the maintainer, 2026-10-30.

## Problem

Shell scripts on one machine need to keep small named values between runs, such as a last-run
timestamp or a build number. Today each script invents its own file format.

## Users

A person writing shell scripts on macOS or Linux, calling `kv` from those scripts.

## Requirements

1. Store, read, rename, count, and delete string values by key, from the command line.
2. Exit codes a script can branch on: found, not found, and bad input are different.
3. One plain-text store file, readable with `cat`.
4. No dependencies beyond POSIX sh and the standard utilities.

## Non-goals

Concurrency between processes, values with tabs or newlines, and network access.
