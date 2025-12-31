#!/bin/bash

set -e

echo "🚀 Publishing inmova (Python SDK)..."

# Check if twine is installed
if ! command -v twine &> /dev/null; then
  echo "Installing twine..."
  pip install build twine
fi

# Bump version (manual in setup.py)
echo "Current version: $(grep version setup.py | cut -d "'" -f 2)"
echo "Update version in setup.py, then press Enter to continue..."
read -r

# Clean previous builds
rm -rf dist/ build/ *.egg-info

# Build
python -m build

# Check distribution
twine check dist/*

# Upload to TestPyPI (optional)
echo "Upload to TestPyPI first? [y/N]"
read -r test_upload

if [ "$test_upload" = "y" ]; then
  twine upload --repository testpypi dist/*
  echo "✅ Uploaded to TestPyPI"
  echo "🧪 Test installation: pip install --index-url https://test.pypi.org/simple/ inmova"
  echo "Press Enter to upload to PyPI..."
  read -r
fi

# Upload to PyPI
twine upload dist/*

NEW_VERSION=$(grep version setup.py | cut -d "'" -f 2)

echo "✅ Published inmova@$NEW_VERSION"
echo "🔗 https://pypi.org/project/inmova/"
