#!/usr/bin/env bash

# Usage like so:
# ./build-boilerplate.sh
# ./build-boilerplate.sh --debug  # For pushing local changes into the zip file

CONTENTS_DIR='boilerplate'
BUILD_DIR='build-boilerplate'

# This allows us to avoid duplicating files in git
FILES_TO_COPY='zapierwrapper.js'

if [ -d $BUILD_DIR ]; then
   rm -fr $BUILD_DIR
fi

mkdir -p $BUILD_DIR

# Copy files
cp "include/$FILES_TO_COPY" "$CONTENTS_DIR/"

# Get new version
NEW_VERSION="$(node -p "require('./package.json').version")"

FILE="$BUILD_DIR/$NEW_VERSION.zip"

# Allow pushing "local changes" into the zip file
if [ "$1" == "--debug" ]; then
  npm pack
  cd node_modules/zapier-platform-legacy-scripting-runner && npm pack
  cd ../..
  bin/update-boilerplate-dependencies.js debug
  cd $CONTENTS_DIR && npm install

  zip -R ../$FILE '*.js' '*.json' '*/darwin-x64-node-8/*.node' '*/linux-x64-node-8/*.node'
else
  bin/update-boilerplate-dependencies.js
  cd $CONTENTS_DIR && npm install

  zip -R ../$FILE '*.js' '*.json' '*/linux-x64-node-8/*.node'
fi

# Revert copied files
rm -f $FILES_TO_COPY

# Remove generated package-lock.json and node_modules
rm -f package-lock.json
rm -fr node_modules
cd ..

# Revert version
bin/update-boilerplate-dependencies.js revert
