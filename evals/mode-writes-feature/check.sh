#!/usr/bin/env bash
# Hidden check: $1 is the dir of files the arm wrote. Exit 0 when the spec holds.
here="$(cd "$(dirname "$0")" && pwd)"
npx -y tsx@4.19.2 "$here/check.mts" "$1"
