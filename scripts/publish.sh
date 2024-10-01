#!/usr/bin/env bash

# exit when any command fails
set -e
set -x

# function to bump and publish a package
# $1: package name
# $2: package version
function bump_and_npm_publish {
    if npm view "$1@$2" >/dev/null 2>&1; then
        echo "Package '$1@$2' already exists"
    else
        echo "Publishing '$1@$2'"
        npm version "$2" -w "$1"
        npm publish --access public -w "$1"
    fi
}

function bump_other_pkg {
    folder=$1
    package=$2
    pushd "$GIT_ROOT_DIR/packages/$folder"
    npm install @nangohq/$package@$VERSION
    popd
}

GIT_ROOT_DIR=$(git rev-parse --show-toplevel)
VERSION=$1

# ensure version is of format x.y.z or 0.0.1-<commit hash>
if [[ ! "$VERSION" =~ ^([0-9]+\.[0-9]+\.[0-9]+|0\.0\.1-[0-9a-fA-F]{40})$ ]]; then
    echo "VERSION '$VERSION' is not of format x.y.z or 0.0.1-<commit hash>"
    exit 1
fi

# increment stored version
# NB: macos and linux have different "sed" that don't edit in place the same way
pushd "$GIT_ROOT_DIR/packages"
sed -E "s/NANGO_VERSION = '[0-9a-fA-F.-]+/NANGO_VERSION = '$VERSION/" ./shared/lib/version.ts >tmp
mv tmp ./shared/lib/version.ts
sed -E "s/NANGO_VERSION = '[0-9a-fA-F.-]+/NANGO_VERSION = '$VERSION/" ./node-client/lib/version.ts >tmp
mv tmp ./node-client/lib/version.ts
popd

# build codebase
npm ci
npm run ts-build

# pack shared dependencies
mkdir -p "$GIT_ROOT_DIR/packages/shared/vendor"
mkdir -p "$GIT_ROOT_DIR/packages/database/vendor"
pushd "$GIT_ROOT_DIR/packages/utils"
jq '.bundleDependencies = true' package.json >temp.json && mv temp.json package.json
npm install --workspaces=false
npm pack --pack-destination "$GIT_ROOT_DIR/packages/shared/vendor"
cp "$GIT_ROOT_DIR/packages/shared/vendor/nangohq-utils-1.0.0.tgz" "$GIT_ROOT_DIR/packages/database/vendor"
popd
pushd "$GIT_ROOT_DIR/packages/shared"
npm install "@nangohq/utils@file:vendor/nangohq-utils-1.0.0.tgz" --workspaces=false
popd

pushd "$GIT_ROOT_DIR/packages/database"
jq '.bundleDependencies = true' package.json >temp.json && mv temp.json package.json
npm install "@nangohq/utils@file:vendor/nangohq-utils-1.0.0.tgz" --workspaces=false
npm install --workspaces=false
npm pack --pack-destination "$GIT_ROOT_DIR/packages/shared/vendor"
popd
pushd "$GIT_ROOT_DIR/packages/shared"
npm install "@nangohq/database@file:vendor/nangohq-database-1.0.0.tgz"
popd

pushd "$GIT_ROOT_DIR/packages/utils"
jq 'del(.bundleDependencies)' package.json >temp.json && mv temp.json package.json
popd

pushd "$GIT_ROOT_DIR/packages/database"
jq 'del(.bundleDependencies)' package.json >temp.json && mv temp.json package.json
popd

# Types
bump_and_npm_publish "@nangohq/types" "$VERSION"
bump_other_pkg "cli" "types"
bump_other_pkg "frontend" "types"
bump_other_pkg "nango-yaml" "types"
bump_other_pkg "node-client" "types"
bump_other_pkg "shared" "types"

# NangoYaml
bump_and_npm_publish "@nangohq/nango-yaml" "$VERSION"
bump_other_pkg "cli" "nango-yaml"
bump_other_pkg "shared" "nango-yaml"

# Node client
bump_and_npm_publish "@nangohq/node" "$VERSION"
pushd "$GIT_ROOT_DIR/packages/shared"
npm install @nangohq/node@^$VERSION
popd

# Shared
bump_and_npm_publish "@nangohq/shared" "$VERSION"
# Update all packages to use the new shared version
package_dirs=("cli")
for dir in "${package_dirs[@]}"; do
    pushd "$GIT_ROOT_DIR/packages/$dir"
    npm install @nangohq/shared@^$VERSION
    popd
done

# CLI
bump_and_npm_publish "nango" "$VERSION"

# Frontend
bump_and_npm_publish "@nangohq/frontend" "$VERSION"
pushd "$GIT_ROOT_DIR/packages/webapp"
npm install @nangohq/frontend@^$VERSION
popd

# clean up
rm packages/shared/package-lock.json
rm packages/utils/package-lock.json
rm packages/database/package-lock.json
pushd "$GIT_ROOT_DIR/packages/shared"
npm install "@nangohq/utils@file:../utils"
npm install "@nangohq/database@file:../database"
pushd "$GIT_ROOT_DIR/packages/database"
npm install "@nangohq/utils@file:../utils"
popd

jq ".version = \"$VERSION\"" package.json >temp.json && mv temp.json package.json
npm i

# DEBUG: show changes in CI
git diff --name-only
git diff
