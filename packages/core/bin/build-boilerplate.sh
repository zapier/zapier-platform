#!/usr/bin/env bash

# Usage like so:
# ./build-boilerplate.sh
# ./build-boilerplate.sh production

CONTENTS_DIR='boilerplate'
BUILD_DIR='build-boilerplate'

if [ -d $BUILD_DIR ]; then
   rm -fr $BUILD_DIR
fi

mkdir -p $BUILD_DIR

# Copy files
cp "include/zapierwrapper.js" "$CONTENTS_DIR/"

# Get current core version
CORE_VERSION="$(node -p "require('./package.json').version")"

FILE="$BUILD_DIR/$CORE_VERSION.zip"

TIMESTAMP=`date +"%s"`

# Build core and legacy-scripting-runner locally. Needs to generate a unique filename
# with a timestamp to avoid yarn using cached packages.
# See https://github.com/yarnpkg/yarn/issues/2165.
if [ "$1" == "production" ]; then
    echo "Building from published packages"
    cd ../legacy-scripting-runner
    TIMESTAMP=""
else
    echo "Building from local"
    yarn pack --filename "./boilerplate/core-$TIMESTAMP.tgz"
    cd ../legacy-scripting-runner
    yarn pack --filename "../core/boilerplate/legacy-scripting-runner-$TIMESTAMP.tgz"
fi

cd ../core
./bin/update-boilerplate-dependencies.js $TIMESTAMP

# Install boilerplate deps, need to make sure local packages
cd $CONTENTS_DIR
echo "{\"version\": \"1.0.0\", \"platformVersion\": \"$CORE_VERSION\"}" > definition.json
yarn --no-lockfile

# Monkey patch boilerplate package.json so zapier-platform-core and
# zapier-platform-legacy-scripting-runner have exact versions specified instead of local
# file path
cd ..
./bin/update-boilerplate-dependencies.js

# Build the zip!
cd $CONTENTS_DIR
zip -R ../$FILE '*.js' '*.json' '*/linux-x64-node-8/*.node'

# Remove generated files
rm -f zapierwrapper.js definition.json core-*.tgz legacy-scripting-runner-*.tgz
rm -rf node_modules
cd ..

# Don't let yarn pile up useless caches of local packages.
# See https://github.com/yarnpkg/yarn/issues/6037.
yarn cache clean zapier-platform-core zapier-platform-schema zapier-platform-legacy-scripting-runner

# Undo the monkey patch on boilerplate package.json
./bin/update-boilerplate-dependencies.js revert

ls -hl $FILE
