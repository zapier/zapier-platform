#!/usr/bin/env bash
#
# Usage:
#   ./upload.sh 9.0.0

if [ "$1" == "" ]; then
    if [ -z $TRAVIS_TAG ]; then
        (>&2 echo 'TRAVIS_TAG is undefined')
        exit 1
    fi
    PKG_VERSION=`echo $TRAVIS_TAG | grep '@' | cut -d '@' -f 2`
else
    PKG_VERSION=$1
fi

BUCKET='zapier-dev-platform-cli-boilerplates'

# Get the absolute path of the directory holding this script file
SCRIPT_DIR=$(dirname $0)
pushd $SCRIPT_DIR > /dev/null
SCRIPT_DIR=$(pwd)
popd > /dev/null

REPO_DIR=$(dirname $(dirname $SCRIPT_DIR))

aws s3 cp $REPO_DIR/boilerplate/build/$PKG_VERSION.zip s3://$BUCKET/$PKG_VERSION.zip --acl public-read
