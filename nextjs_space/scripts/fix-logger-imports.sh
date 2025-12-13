#!/bin/bash

# Script to fix logger imports that were added in the middle of other imports

echo "Fixing logger imports..."

# Find all files with the problematic pattern
grep -r "^import logger, { logError } from '@/lib/logger';" app lib components --include="*.ts" --include="*.tsx" -l | while read -r file; do
  echo "Fixing: $file"
  
  # Create a temporary file
  temp_file=$(mktemp)
  
  # Extract the logger import line
  logger_import="import logger, { logError } from '@/lib/logger';"
  
  # Remove all logger import lines
  grep -v "^import logger, { logError } from '@/lib/logger';" "$file" > "$temp_file"
  
  # Find the last import line
  last_import_line=$(grep -n "^import" "$temp_file" | tail -1 | cut -d: -f1)
  
  if [ -n "$last_import_line" ]; then
    # Add logger import after the last import
    awk -v line="$last_import_line" -v import="$logger_import" 'NR==line {print; print import; next} 1' "$temp_file" > "$file"
  else
    # No imports found, add at the beginning
    echo "$logger_import" | cat - "$temp_file" > "$file"
  fi
  
  rm "$temp_file"
done

echo "Fix complete!"
