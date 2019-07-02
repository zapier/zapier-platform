#!/usr/bin/env bash

if [ -z $TRAVIS_TAG ]; then
    (>&2 echo 'TRAVIS_TAG is undefined')
    exit 1
fi

BUCKET='zapier-dev-platform-cli-boilerplates'

PKG_VERSION=`echo $TRAVIS_TAG | grep '@' | cut -d '@' -f 2`
aws s3 cp ./build-boilerplate/$PKG_VERSION.zip s3://$BUCKET/$PKG_VERSION.zip --acl public-read
