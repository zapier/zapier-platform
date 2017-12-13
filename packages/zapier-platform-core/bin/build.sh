#!/usr/bin/env bash

# Usage like so:
# ./build.sh local.bundle.zip

if [ $# -eq 0 ]
then
    echo "No arguments supplied."
    exit 1
fi

if [ -f $1 ]
then
    rm -rf $1
fi

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
    grep -v "^\./tags$" | \
    zip $1 -@
