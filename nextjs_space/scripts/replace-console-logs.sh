#!/bin/bash

# Script to replace console.log/error/warn with structured logger
echo "Replacing console.log/error/warn with structured logger..."

# Find all TypeScript and TSX files
find app lib components -type f \( -name "*.ts" -o -name "*.tsx" \) ! -path "*/node_modules/*" | while read -r file; do
  # Check if file contains console.log/error/warn
  if grep -q "console\.\(log\|error\|warn\)" "$file"; then
    echo "Processing: $file"
    
    # Check if logger is already imported
    if ! grep -q "import.*logger.*from.*@/lib/logger" "$file"; then
      # Check if file has imports
      if grep -q "^import" "$file"; then
        # Add logger import after the last import
        awk '/^import/ {last=NR} {lines[NR]=$0} END {for(i=1;i<=NR;i++) {print lines[i]; if(i==last) print "import logger, { logError } from '\''@/lib/logger'\'';"}}' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
      else
        # Add logger import at the beginning
        echo -e "import logger, { logError } from '@/lib/logger';\n$(cat $file)" > "$file"
      fi
    fi
    
    # Replace console.log with logger.info
    sed -i "s/console\.log(/logger.info(/g" "$file"
    
    # Replace console.error with logger.error
    sed -i "s/console\.error(/logger.error(/g" "$file"
    
    # Replace console.warn with logger.warn
    sed -i "s/console\.warn(/logger.warn(/g" "$file"
  fi
done

echo "Replacement complete!"
