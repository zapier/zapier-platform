#!/usr/bin/env bash

# Exit on any command failure; in pipelines, fail if any command (not just the
# last) returns non-zero.
set -eo pipefail

#
# Build boilerplate - a zip file that is generated as if you `zapier build` an empty CLI
# app. This zip file acts as a runtime for all the UI apps.
#
# Usage:
#
#   $ ./scripts/build.sh [CORE_VERSION] [LEGACY_SCRIPTING_RUNNER_VERSION]
#
# This scripts accepts two optional arguments - core and legacy-scripting-runner
# versions. If the version is specified, that packgage will be downloaded from npm
# instead of built from local.
#
# For example, this builds core and legacy-scripting-runner from local code:
#
#   $ ./scripts/build.sh
#
# Download both core and legacy-scripting-runner from npm:
#
#   $ ./scripts/build.sh 9.7.1 3.8.5
#
# Build core from local and download legacy-scripting-runner from npm:
#
#   $ ./scripts/build.sh '' 3.8.5
#
# Download core from npm and build legacy-scripting-runner from local:
#
#   $ ./scripts/build.sh 9.7.1
#

update_deps() {
    package_json=$1
    core_version=$2
    lsr_version=$3

    cmd_for_core="s|\"zapier-platform-core\": \"[^\"]*\""
    cmd_for_core+="|\"zapier-platform-core\": \"$core_version\"|g"

    cmd_for_lsr="s|\"zapier-platform-legacy-scripting-runner\": \"[^\"]*\""
    cmd_for_lsr+="|\"zapier-platform-legacy-scripting-runner\": \"$lsr_version\"|g"

    sed -i.bak "$cmd_for_core" "$package_json"
    sed -i.bak "$cmd_for_lsr" "$package_json"

    rm -f "$package_json.bak"
}

inspect_build() {
    local zip_file=$1
    local expected_core=$2
    local expected_schema=$3
    local expected_lsr=$4

    temp_dir="`dirname $zip_file`/_temp"
    unzip -q $zip_file -d $temp_dir

    # Build a JSON object of expected versions and compare against actual
    actual=$(find $temp_dir/node_modules -maxdepth 2 -name package.json -path "*/zapier-platform-*/*" | xargs cat | jq -s '
        map({(.name): .version}) | add')
    echo "$actual" | jq .

    rm -rf $temp_dir

    expected=$(jq -n \
        --arg core "$expected_core" \
        --arg schema "$expected_schema" \
        --arg lsr "$expected_lsr" \
        '{"zapier-platform-core": $core, "zapier-platform-schema": $schema, "zapier-platform-legacy-scripting-runner": $lsr}')

    if [ "$actual" == "$expected" ]; then
        echo "All dependency versions match ✅"
    else
        echo "ERROR: dependency version mismatch ❌"
        echo "Expected: $expected"
        return 1
    fi
}

check_size() {
    local min_mb=3
    local max_mb=10
    local min_bytes=$((min_mb * 1024 * 1024))
    local max_bytes=$((max_mb * 1024 * 1024))
    local file_size=$(stat -f%z "$1" 2>/dev/null || stat -c%s "$1")
    local size_mb=$(echo "scale=2; $file_size / 1024 / 1024" | bc)
    if [[ $file_size -lt $min_bytes || $file_size -gt $max_bytes ]]; then
        echo "ERROR: zip file size ${size_mb} MB is outside expected range (${min_mb}-${max_mb} MB) ❌"
        return 1
    else
        echo "Zip file size ${size_mb} MB is within expected range (${min_mb}-${max_mb} MB) ✅"
    fi
}

test_build() {
    temp_dir="`dirname $1`/_temp"
    unzip -q $1 -d $temp_dir

    pushd $temp_dir > /dev/null
    local rc=0
    node zapierwrapper.js || rc=$?
    popd > /dev/null
    rm -rf $temp_dir

    if [[ $rc -eq 0 ]]; then
        echo "Entry point can be loaded successfully ✅"
    else
        echo "Entry point failed to load ❌"
    fi
    return $rc
}

# Get the absolute path of the directory holding this script file
SCRIPT_DIR=$(dirname $0)
pushd $SCRIPT_DIR > /dev/null
SCRIPT_DIR=$(pwd)
popd > /dev/null

REPO_DIR=$(dirname $(dirname $SCRIPT_DIR))
CORE_DIR="$REPO_DIR/packages/core"
SCHEMA_DIR="$REPO_DIR/packages/schema"
LSR_DIR="$REPO_DIR/packages/legacy-scripting-runner"
BOILERPLATE_DIR="$REPO_DIR/boilerplate"

BUILD_DIR="$BOILERPLATE_DIR/build"

# Restore modified files on exit (success or failure)
cleanup() {
    local exit_code=$?
    # Restore pnpm-workspace.yaml if a backup exists
    if [ -f "$BOILERPLATE_DIR/pnpm-workspace.yaml.bak" ]; then
        mv "$BOILERPLATE_DIR/pnpm-workspace.yaml.bak" "$BOILERPLATE_DIR/pnpm-workspace.yaml"
    fi
    # Restore package.json placeholders
    update_deps "$BOILERPLATE_DIR/package.json" PLACEHOLDER PLACEHOLDER
    exit $exit_code
}
trap cleanup EXIT

# Prevent leftover old builds from being included in new build
if [ -d $BUILD_DIR ]; then
    echo "Removing existing boilerplate/build directory..."
    rm -r "$BUILD_DIR"
fi

# Prevent stale dependencies from being included in new build
if [ -d "$BOILERPLATE_DIR/node_modules" ]; then
    echo "Removing existing boilerplate/node_modules directory..."
    rm -r "$BOILERPLATE_DIR/node_modules"
fi

mkdir -p $BUILD_DIR

# Copy files
cp "$CORE_DIR/include/zapierwrapper.js" "$BOILERPLATE_DIR/"

# Get core version
if [ "$1" == "" ]; then
    pushd $CORE_DIR > /dev/null
    CORE_VERSION="$(node -p "require('./package.json').version")"
    popd > /dev/null
else
    CORE_VERSION=$1
fi

# core, schema, and cli are always published together, so they should use the same
# version
SCHEMA_VERSION=$CORE_VERSION

# Get legacy-scripting-runner version
if [ "$2" == "" ]; then
    pushd $LSR_DIR > /dev/null
    LSR_VERSION="$(node -p "require('./package.json').version")"
    popd > /dev/null
else
    LSR_VERSION=$2
fi

TARGET_FILE="$BUILD_DIR/$CORE_VERSION.zip"
rm -f $TARGET_FILE

# Build core and legacy-scripting-runner locally. Needs to generate a unique filename
# with a timestamp to avoid the package manager using any cache.
TIMESTAMP=`date +"%s"`
CORE_PACK_FILENAME="core-$TIMESTAMP.tgz"
SCHEMA_PACK_FILENAME="schema-$TIMESTAMP.tgz"
LSR_PACK_FILENAME="lsr-$TIMESTAMP.tgz"

echo "Building..."

# Patch boilerplate's package.json with appropriate dependency versions
if [ "$1" == "" ]; then
    echo "> core from local, version $CORE_VERSION"

    pushd $CORE_DIR > /dev/null
    pnpm pack --out "$BOILERPLATE_DIR/$CORE_PACK_FILENAME"
    popd > /dev/null

    # Also pack schema so core's transitive dependency resolves locally
    # instead of from npm (which may not have the current version yet)
    echo "> schema from local"
    pushd $SCHEMA_DIR > /dev/null
    pnpm pack --out "$BOILERPLATE_DIR/$SCHEMA_PACK_FILENAME"
    popd > /dev/null

    if [ "$2" == "" ]; then
        echo "> legacy-scripting-runner from local, version $LSR_VERSION"

        pushd $LSR_DIR > /dev/null
        pnpm pack --out "$BOILERPLATE_DIR/$LSR_PACK_FILENAME"
        popd > /dev/null

        # Replace core and legacy-scripting-runner versions in package.json
        update_deps "$BOILERPLATE_DIR/package.json" "./$CORE_PACK_FILENAME" "./$LSR_PACK_FILENAME"
    else
        echo "> legacy-scripting-runner from npm, version $LSR_VERSION"

        # Replace core and legacy-scripting-runner versions in package.json
        update_deps "$BOILERPLATE_DIR/package.json" "./$CORE_PACK_FILENAME" $LSR_VERSION
    fi
else
    echo "> core from from npm, version $CORE_VERSION"

    if [ "$2" == "" ]; then
        echo "> legacy-scripting-runner from local, version $LSR_VERSION"

        pushd $LSR_DIR > /dev/null
        pnpm pack --out "$BOILERPLATE_DIR/$LSR_PACK_FILENAME"
        popd > /dev/null

        # Replace core and legacy-scripting-runner versions in package.json
        update_deps "$BOILERPLATE_DIR/package.json" $CORE_VERSION "./$LSR_PACK_FILENAME"
    else
        echo "> legacy-scripting-runner from npm, version: $LSR_VERSION"

        # Replace core and legacy-scripting-runner versions in package.json
        update_deps "$BOILERPLATE_DIR/package.json" $CORE_VERSION $LSR_VERSION
    fi
fi

# Install boilerplate deps
pushd $BOILERPLATE_DIR > /dev/null
echo "{\"version\": \"1.0.0\", \"platformVersion\": \"$CORE_VERSION\"}" > definition.json

# When building core from local, replace the placeholder in pnpm-workspace.yaml
# with an override so schema resolves from the local tarball
if [ "$1" == "" ]; then
    sed -i.bak "s|# OVERRIDES_PLACEHOLDER|overrides:\n  zapier-platform-schema: \"./$SCHEMA_PACK_FILENAME\"|" pnpm-workspace.yaml
fi

pnpm install --no-lockfile

popd > /dev/null

# Monkey patch boilerplate package.json so zapier-platform-core and
# zapier-platform-legacy-scripting-runner have version numbers specified instead
# of local file path
update_deps "$BOILERPLATE_DIR/package.json" $CORE_VERSION $LSR_VERSION

pushd $BOILERPLATE_DIR > /dev/null

# Build the zip!
# the node-X segment in the next line should match the latest major version
zip -9 -R $TARGET_FILE '*.js' '*.cjs' '*.json'

# Remove generated files
rm -f zapierwrapper.js definition.json core-*.tgz schema-*.tgz lsr-*.tgz
rm -rf node_modules

popd > /dev/null

echo -e "\nDone! Here's your output zip file (size should be 4-6 MB normally):"
ls -hl $TARGET_FILE

check_size $TARGET_FILE
inspect_build $TARGET_FILE $CORE_VERSION $SCHEMA_VERSION $LSR_VERSION
test_build $TARGET_FILE
