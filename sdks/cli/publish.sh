#!/bin/bash

set -e

echo "🚀 Publishing @inmova/cli..."

# Check if logged in
if ! npm whoami &> /dev/null; then
  echo "❌ Not logged in to npm. Run: npm login"
  exit 1
fi

# Bump version
echo "Current version: $(cat package.json | grep version | cut -d '"' -f 4)"
echo "Choose version bump: [patch/minor/major]"
read -r bump

npm version "$bump"

# Install and build
npm install
npm run build

# Make bin executable
chmod +x bin/inmova

# Test CLI locally
./bin/inmova --version

# Publish
npm publish --access public

NEW_VERSION=$(cat package.json | grep version | cut -d '"' -f 4)

echo "✅ Published @inmova/cli@$NEW_VERSION"
echo "🔗 https://www.npmjs.com/package/@inmova/cli"
echo "🧪 Test: npm install -g @inmova/cli"
