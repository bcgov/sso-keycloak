#!/bin/bash
set -e

usage() {
    cat <<EOF
Create and push a new tag with a comment.

Usages:
    $0 <tagname> <msg>

Examples:
    $ $0 v1.0.0-build.1 "feat: build a new image"
EOF
}

if [ "$#" -lt 2 ]; then
    usage
    exit 1
fi

tag=$1
msg=$2

git tag -a "$tag" -m "$msg"
git push origin "$tag"
