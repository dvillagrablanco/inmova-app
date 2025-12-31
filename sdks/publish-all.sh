#!/bin/bash

set -e

echo "🚀 Publishing Inmova SDKs..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if logged in to npm
echo -e "${YELLOW}Checking npm authentication...${NC}"
if ! npm whoami &> /dev/null; then
  echo -e "${RED}❌ Not logged in to npm. Run: npm login${NC}"
  exit 1
fi

echo -e "${GREEN}✅ npm authentication OK${NC}\n"

# Function to publish a package
publish_package() {
  local dir=$1
  local name=$2
  
  echo -e "${YELLOW}📦 Publishing $name...${NC}"
  
  cd "$dir"
  
  # Install dependencies
  if [ -f "package.json" ]; then
    npm install
    npm run build
    npm publish --access public
  elif [ -f "setup.py" ]; then
    pip install build twine
    python -m build
    twine upload dist/*
  elif [ -f "composer.json" ]; then
    composer install
    # PHP packages are published via packagist.org (manual)
    echo -e "${YELLOW}⚠️  PHP SDK must be published manually on packagist.org${NC}"
    return
  fi
  
  cd - > /dev/null
  
  echo -e "${GREEN}✅ $name published successfully!${NC}\n"
}

# Publish JavaScript SDK
if [ -d "javascript" ]; then
  publish_package "javascript" "JavaScript SDK"
fi

# Publish Python SDK
if [ -d "python" ]; then
  publish_package "python" "Python SDK"
fi

# Publish PHP SDK (manual)
if [ -d "php" ]; then
  echo -e "${YELLOW}📦 PHP SDK${NC}"
  echo -e "${YELLOW}To publish PHP SDK:${NC}"
  echo -e "1. Create repository on GitHub: inmova/sdk-php"
  echo -e "2. Push code to GitHub"
  echo -e "3. Submit to packagist.org: https://packagist.org/packages/submit"
  echo -e "4. Packagist will auto-update from GitHub releases\n"
fi

# Publish CLI
if [ -d "cli" ]; then
  publish_package "cli" "CLI Tool"
fi

echo -e "${GREEN}🎉 All SDKs published successfully!${NC}"
echo -e "\n${YELLOW}📊 Next steps:${NC}"
echo -e "1. Verify packages: https://www.npmjs.com/package/@inmova/sdk"
echo -e "2. Test installation: npm install -g @inmova/cli"
echo -e "3. Update documentation with new versions"
echo -e "4. Announce on social media"
