#!/usr/bin/env bash

BUCKET='zapier-dev-platform-cli-boilerplates'

aws s3 cp ./build-boilerplate/$TRAVIS_TAG.zip s3://$BUCKET/$TRAVIS_TAG.zip --acl public-read
