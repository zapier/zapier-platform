#!/usr/bin/env bash

# Usage like so:
# ./build.sh local.bundle.zip

CORE_REPO_DIR=$(pwd)
BUILD_DIR="./build"

if [ $# -eq 0 ]
then
    echo "No arguments supplied."
    exit 1
fi

if [ -f $1 ]
then
    rm -rf $1
fi

if [ -d $BUILD_DIR ]
then
    rm -rf $BUILD_DIR
fi

mkdir $BUILD_DIR

PACK_FILENAME=$(npm pack)

tar xzf $PACK_FILENAME -C $BUILD_DIR

cp -R test $BUILD_DIR/package/

cd $BUILD_DIR/package

npm install --production

echo "Top 10 biggest dependent Node packages, FYI:"

du -s node_modules/* | sort -n -r | head -n 10

find . -print | \
    # removing test and example is bold!
    grep -v "\.git" | \
    grep -v "DS_Store" | \
    grep -v "/LICENSE" | \
    grep -v "\.min\.js" | \
    grep -v "/min/" | \
    grep -v "\.html" | \
    grep -v "\.css" | \
    grep -v "\.png" | \
    grep -v "\.gif" | \
    grep -v "\.jpg" | \
    grep -v "\.md" | \
    grep -v "\.sh" | \
    grep -v "\.zip" | \
    grep -v "tags" | \
    zip $1 -@ > /dev/null

cp ./local.bundle.zip $CORE_REPO_DIR/

cd $CORE_REPO_DIR
rm $PACK_FILENAME
rm -rf $BUILD_DIR
