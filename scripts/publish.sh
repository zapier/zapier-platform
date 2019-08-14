#!/usr/bin/env bash

if [ -z $TRAVIS_TAG ]; then
    (>&2 echo 'TRAVIS_TAG is undefined')
    exit 1
fi

if [ -z $NPM_TOKEN ]; then
    (>&2 echo 'NPM_TOKEN is undefined')
    exit 1
fi

# Split PackageName@x.y.z into 'PackageName' and 'x.y.z'
PKG_NAME=`echo $TRAVIS_TAG | grep '@' | cut -d '@' -f 1`
PKG_VERSION=`echo $TRAVIS_TAG | grep '@' | cut -d '@' -f 2`

if [ -z "$PKG_NAME" ] || [ -z "$PKG_VERSION" ]; then
    (>&2 echo "Error: Invalid TRAVIS_TAG '$TRAVIS_TAG'")
    exit 1
fi

NPM_REGISTRY="https://registry.npmjs.org"

# Add auth token to .npmrc
NPMRC_PATH="$HOME/.npmrc"
NPM_REGISTRY_NO_PROTO=`echo $NPM_REGISTRY | sed -E 's/^https?://'`
echo "$NPM_REGISTRY_NO_PROTO/:_authToken=\"$NPM_TOKEN\"" > $NPMRC_PATH

# cd to the package and publish it!
PKG_PATH=`yarn workspaces info -s | jq -r ".[\"$PKG_NAME\"].location"`
cd $PKG_PATH
npm publish --registry $NPM_REGISTRY
