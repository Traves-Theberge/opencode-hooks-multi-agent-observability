#!/bin/bash
HOOK_NAME=$1
shift
BUN_BIN=$(which bun)
cd "$(dirname "$0")"
$BUN_BIN run ".opencode/hooks/${HOOK_NAME}.ts" "$@"
