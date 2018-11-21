#!/usr/bin/env bash

BUCKET='zapier-dev-platform-cli-boilerplates'
TAG_WITHOUT_V=${TRAVIS_TAG:1}
aws s3 cp ./build-boilerplate/$TAG_WITHOUT_V.zip s3://$BUCKET/$TAG_WITHOUT_V.zip --acl public-read
