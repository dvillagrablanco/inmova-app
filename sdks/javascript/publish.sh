#!/bin/bash

set -e

echo "🚀 Publishing @inmova/sdk (JavaScript)..."

# Check if logged in
if ! npm whoami &> /dev/null; then
  echo "❌ Not logged in to npm. Run: npm login"
  exit 1
fi

# Bump version (prompt user)
echo "Current version: $(cat package.json | grep version | cut -d '"' -f 4)"
echo "Choose version bump: [patch/minor/major]"
read -r bump

npm version "$bump"

# Install and build
npm install
npm run build

# Run tests (if available)
if npm run test &> /dev/null; then
  npm test
fi

# Publish
npm publish --access public

NEW_VERSION=$(cat package.json | grep version | cut -d '"' -f 4)

echo "✅ Published @inmova/sdk@$NEW_VERSION"
echo "🔗 https://www.npmjs.com/package/@inmova/sdk"
