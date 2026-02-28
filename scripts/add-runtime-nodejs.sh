#!/bin/bash
# Add export const runtime = 'nodejs'; to API route files that have dynamic but not runtime
# Usage: run from workspace root

set -e
cd "$(dirname "$0")/.."

MODIFIED=0

# Use Python for reliable in-place editing
while IFS= read -r -d '' file; do
  # Skip if file already has runtime
  if grep -q "export const runtime" "$file"; then
    continue
  fi
  # Must have dynamic
  if ! grep -q "export const dynamic" "$file"; then
    continue
  fi
  # Add runtime line right after the dynamic line using Python
  python3 -c "
import sys
filepath = sys.argv[1]
with open(filepath, 'r') as f:
    content = f.read()
# Only add if not already present
if \"export const runtime\" in content:
    sys.exit(1)
# Find dynamic line and add runtime after it (only first occurrence)
lines = content.split('\n')
new_lines = []
added = False
for line in lines:
    new_lines.append(line)
    if not added and \"export const dynamic\" in line:
        if \"export const runtime\" not in line:
            new_lines.append(\"export const runtime = 'nodejs';\")
            added = True
with open(filepath, 'w') as f:
    f.write('\n'.join(new_lines))
" "$file" 2>/dev/null && ((MODIFIED++)) || true
done < <(find app/api -name "route.ts" -print0 2>/dev/null)

echo "$MODIFIED"
