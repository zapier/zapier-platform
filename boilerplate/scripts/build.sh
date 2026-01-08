#!/usr/bin/env bash
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
    legacy_version=$3

    cmd_for_core="s|\"zapier-platform-core\": \"[^\"]*\""
    cmd_for_core+="|\"zapier-platform-core\": \"$core_version\"|g"

    cmd_for_legacy="s|\"zapier-platform-legacy-scripting-runner\": \"[^\"]*\""
    cmd_for_legacy+="|\"zapier-platform-legacy-scripting-runner\": \"$legacy_version\"|g"

    sed -i.bak "$cmd_for_core" "$package_json"
    sed -i.bak "$cmd_for_legacy" "$package_json"

    rm -f "$package_json.bak"
}

inspect_build() {
    temp_dir="`dirname $1`/_temp"
    unzip -q $1 -d $temp_dir
    find $temp_dir/node_modules/zapier-platform-*/package.json | (xargs cat | jq '{name, version}')

    pushd $temp_dir > /dev/null
    EXIT_CODE=$(node zapierwrapper.js)
    if [[ $EXIT_CODE -eq 0 ]]; then
        echo "Entry point can be loaded successfully ✅"
    else
        echo "Entry point failed to load ❌"
    fi
    popd > /dev/null

    rm -rf $temp_dir
}

# Get the absolute path of the directory holding this script file
SCRIPT_DIR=$(dirname $0)
pushd $SCRIPT_DIR > /dev/null
SCRIPT_DIR=$(pwd)
popd > /dev/null

REPO_DIR=$(dirname $(dirname $SCRIPT_DIR))
CORE_DIR="$REPO_DIR/packages/core"
LEGACY_DIR="$REPO_DIR/packages/legacy-scripting-runner"
BOILERPLATE_DIR="$REPO_DIR/boilerplate"

BUILD_DIR="$BOILERPLATE_DIR/build"

# Prevent leftover old builds from being included in new build
if [ -d $BUILD_DIR ]; then
    echo "Removing existing boilerplate/build directory..."
    rm -r "$BUILD_DIR"
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

# Get legacy-scripting-runner version
if [ "$2" == "" ]; then
    pushd $LEGACY_DIR > /dev/null
    LEGACY_VERSION="$(node -p "require('./package.json').version")"
    popd > /dev/null
else
    LEGACY_VERSION=$2
fi

TARGET_FILE="$BUILD_DIR/$CORE_VERSION.zip"
rm -f $TARGET_FILE

# Build core and legacy-scripting-runner locally. Needs to generate a unique filename
# with a timestamp to avoid the package manager using any cache.
TIMESTAMP=`date +"%s"`
CORE_PACK_FILENAME="core-$TIMESTAMP.tgz"
LEGACY_PACK_FILENAME="legacy-$TIMESTAMP.tgz"

echo "Building..."

# Patch boilerplate's package.json with appropriate dependency versions
if [ "$1" == "" ]; then
    echo "> core from local, version $CORE_VERSION"

    pushd $CORE_DIR > /dev/null
    pnpm pack --out "$BOILERPLATE_DIR/$CORE_PACK_FILENAME"
    popd > /dev/null

    if [ "$2" == "" ]; then
        echo "> legacy-scripting-runner from local, version $LEGACY_VERSION"

        pushd $LEGACY_DIR > /dev/null
        pnpm pack --out "$BOILERPLATE_DIR/$LEGACY_PACK_FILENAME"
        popd > /dev/null

        # Replace core and legacy-scripting-runner versions in package.json
        update_deps "$BOILERPLATE_DIR/package.json" "./$CORE_PACK_FILENAME" "./$LEGACY_PACK_FILENAME"
    else
        echo "> legacy-scripting-runner from npm, version $LEGACY_VERSION"

        # Replace core and legacy-scripting-runner versions in package.json
        update_deps "$BOILERPLATE_DIR/package.json" "./$CORE_PACK_FILENAME" $LEGACY_VERSION
    fi
else
    echo "> core from from npm, version $CORE_VERSION"

    if [ "$2" == "" ]; then
        echo "> legacy-scripting-runner from local, version $LEGACY_VERSION"

        pushd $LEGACY_DIR > /dev/null
        pnpm pack --out "$BOILERPLATE_DIR/$LEGACY_PACK_FILENAME"
        popd > /dev/null

        # Replace core and legacy-scripting-runner versions in package.json
        update_deps "$BOILERPLATE_DIR/package.json" $CORE_VERSION "./$LEGACY_PACK_FILENAME"
    else
        echo "> legacy-scripting-runner from npm, version: $LEGACY_VERSION"

        # Replace core and legacy-scripting-runner versions in package.json
        update_deps "$BOILERPLATE_DIR/package.json" $CORE_VERSION $LEGACY_VERSION
    fi
fi

# Install boilerplate deps
pushd $BOILERPLATE_DIR > /dev/null
echo "{\"version\": \"1.0.0\", \"platformVersion\": \"$CORE_VERSION\"}" > definition.json
pnpm install --no-lockfile
popd > /dev/null

# Monkey patch boilerplate package.json so zapier-platform-core and
# zapier-platform-legacy-scripting-runner have version numbers specified instead
# of local file path
update_deps "$BOILERPLATE_DIR/package.json" $CORE_VERSION $LEGACY_VERSION

pushd $BOILERPLATE_DIR > /dev/null

# Build the zip!
# the node-X segment in the next line should match the latest major version
zip -R $TARGET_FILE '*.js' '*.cjs' '*.json' '*/linux-x64-node-14/*.node' '*/linux-x64-node-16/*.node' '*/linux-x64-node-18/*.node'

# Remove generated files
rm -f zapierwrapper.js definition.json core-*.tgz legacy-*.tgz
# rm -rf node_modules

popd > /dev/null

# Undo the monkey patch on boilerplate package.json
update_deps "$BOILERPLATE_DIR/package.json" PLACEHOLDER PLACEHOLDER

echo -e "\nDone! Here's your output zip file (size should be 4-6 MB):"
ls -hl $TARGET_FILE

echo -e "\nInspecting what's inside the zip:"
inspect_build $TARGET_FILE
