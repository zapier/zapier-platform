#!/usr/bin/env bash
#
# Build with current local code:
#   ./build.sh
#
# Specify core and legacy-scripting-runner versions to build with published
# packages on npm:
#   ./build.sh 9.0.0 3.2.4

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
    echo 'deasync bindings:'
    ls $temp_dir/node_modules/deasync/bin
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

# Patch boilerplate's package.json with appropriate dependency versions
if [ "$1" == "" ]; then
    # Build core and legacy-scripting-runner locally. Needs to generate a unique filename
    # with a timestamp to avoid yarn using cached packages.
    # See https://github.com/yarnpkg/yarn/issues/2165.
    TIMESTAMP=`date +"%s"`
    echo "Building from local"

    CORE_PACK_FILENAME="core-$TIMESTAMP.tgz"
    LEGACY_PACK_FILENAME="legacy-$TIMESTAMP.tgz"

    pushd $CORE_DIR > /dev/null
    yarn pack --filename "$BOILERPLATE_DIR/$CORE_PACK_FILENAME"
    popd > /dev/null

    pushd $LEGACY_DIR > /dev/null
    yarn pack --filename "$BOILERPLATE_DIR/$LEGACY_PACK_FILENAME"
    popd > /dev/null

    # Replace core and legacy-scripting-runner versions in package.json
    update_deps "$BOILERPLATE_DIR/package.json" "./$CORE_PACK_FILENAME" "./$LEGACY_PACK_FILENAME"
else
    echo "Building from published packages, core $CORE_VERSION"

    update_deps "$BOILERPLATE_DIR/package.json" $CORE_VERSION $LEGACY_VERSION
fi

# Install boilerplate deps
pushd $BOILERPLATE_DIR > /dev/null
echo "{\"version\": \"1.0.0\", \"platformVersion\": \"$CORE_VERSION\"}" > definition.json
yarn --no-lockfile
popd > /dev/null

# Monkey patch boilerplate package.json so zapier-platform-core and
# zapier-platform-legacy-scripting-runner have version numbers specified instead
# of local file path
update_deps "$BOILERPLATE_DIR/package.json" $CORE_VERSION $LEGACY_VERSION

pushd $BOILERPLATE_DIR > /dev/null

# Build the zip!
# the node-X segment in the next line should match all supported node versions
zip -R $TARGET_FILE '*.js' '*.json' '*/linux-x64-node-12/*.node' '*/linux-x64-node-14/*.node'

# Remove generated files
rm -f zapierwrapper.js definition.json core-*.tgz legacy-*.tgz
# rm -rf node_modules

# Don't let yarn pile up useless caches of local packages.
# See https://github.com/yarnpkg/yarn/issues/6037.
yarn cache clean zapier-platform-core zapier-platform-schema zapier-platform-legacy-scripting-runner

popd > /dev/null

# Undo the monkey patch on boilerplate package.json
update_deps "$BOILERPLATE_DIR/package.json" PLACEHOLDER PLACEHOLDER

echo -e "\nDone! Here's your output zip file:"
ls -hl $TARGET_FILE

echo -e "\nInspecting what's inside the zip:"
inspect_build $TARGET_FILE
