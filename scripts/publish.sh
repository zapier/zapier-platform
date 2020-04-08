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

echo "TRAVIS_TAG: $TRAVIS_TAG"
echo "PKG_NAME: $PKG_NAME"
echo "PKG_VERSION: $PKG_VERSION"

NPM_REGISTRY="https://registry.npmjs.org"

# Add auth token to .npmrc
NPMRC_PATH="$HOME/.npmrc"
NPM_REGISTRY_NO_PROTO=`echo $NPM_REGISTRY | sed -E 's/^https?://'`
echo "$NPM_REGISTRY_NO_PROTO/:_authToken=\"$NPM_TOKEN\"" > $NPMRC_PATH

# cd to the package and publish it!
PKG_PATH=`yarn workspaces --json info | jq -r '.data'  | jq -r ".[\"$PKG_NAME\"].location"`
echo "PKG_PATH: $PKG_PATH"
pushd $PKG_PATH > /dev/null
npm publish --registry $NPM_REGISTRY
popd > /dev/null

# === BEGIN Boilerplate Rebuild ===

if [[ "$PKG_NAME" == "zapier-platform-core" ]]; then
    LEGACY_VERSION=$(curl https://registry.npmjs.org/zapier-platform-legacy-scripting-runner/latest | jq -r .version)
    CORE_VERSION=$(cat $PKG_PATH/package.json | jq -r .version)
fi

if [[ "$PKG_NAME" == "zapier-platform-legacy-scripting-runner" ]]; then
    CORE_VERSION=$(curl https://registry.npmjs.org/zapier-platform-core/latest | jq -r .version)
    LEGACY_VERSION=$(cat $PKG_PATH/package.json | jq -r .version)
fi

if [[ "$CORE_VERSION" != "" && "$LEGACY_VERSION" != "" ]]; then
    echo "Let's wait for a second for the packages to be available on npm..."
    sleep 10

    retries=0
    SCHEMA_VERSION=$(curl https://registry.npmjs.org/zapier-platform-schema/latest | jq -r .version)
    until [ $SCHEMA_VERSION == $CORE_VERSION ] || [ retries == 60 ]
    do
        echo "Waiting for zapier-platform-schema to be published to npm..."
        sleep 5
        SCHEMA_VERSION=$(curl https://registry.npmjs.org/zapier-platform-schema/latest | jq -r .version)
        ((retries++))
    done

    if [[ $SCHEMA_VERSION != $CORE_VERSION ]]; then
        echo "Latest version of zapier-platform-schema still hasn't published to npm. Can't build boilerplate, sorry."
        exit 1
    fi

    echo "Let's wait for yarnpkg.com to be aware of the latest zapier-platform-schema..."
    sleep 15

    # Build boilerplate and let Zapier know about this
    ./boilerplate/scripts/build.sh $CORE_VERSION $LEGACY_VERSION &&
    ./boilerplate/scripts/upload.sh $CORE_VERSION &&
    ZIP_HASH=$(sha1sum "./boilerplate/build/$CORE_VERSION.zip" | awk '{print $1}') &&
    curl -H 'content-type:application/json' -d "{\"version\":\"$CORE_VERSION\",\"id\":\"$ZIP_HASH\"}" $BOILERPLATE_UPDATE_URL | jq .status
fi

# === END Boilerplate Rebuild ===
