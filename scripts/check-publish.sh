#!/usr/bin/env bash

# Check which packages need publishing by comparing local vs npm versions.
# Outputs results to GITHUB_OUTPUT if running in CI, otherwise prints to stdout.

set -eo pipefail

check_package() {
    local name=$1
    local dir=$2
    local short_name=$3
    local local_version=$(node -p "require('./$dir/package.json').version")
    local published_version=$(npm view "$name" version 2>/dev/null || echo "")
    if [ "$local_version" != "$published_version" ]; then
        echo "$name: $published_version -> $local_version (needs publish)"
        [ -n "$GITHUB_OUTPUT" ] && echo "${short_name}_needs_publish=true" >> "$GITHUB_OUTPUT" || true
    else
        echo "$name: $local_version (up to date)"
        [ -n "$GITHUB_OUTPUT" ] && echo "${short_name}_needs_publish=false" >> "$GITHUB_OUTPUT" || true
    fi
}

check_package zapier-platform-schema packages/schema schema
check_package zapier-platform-core packages/core core
check_package zapier-platform-cli packages/cli cli
check_package zapier-platform-legacy-scripting-runner packages/legacy-scripting-runner lsr

if [ -n "$GITHUB_OUTPUT" ]; then
    if grep -q '_needs_publish=true' "$GITHUB_OUTPUT"; then
        echo "should_publish=true" >> "$GITHUB_OUTPUT"
    else
        echo "should_publish=false" >> "$GITHUB_OUTPUT"
    fi
fi
