#!/usr/bin/env python3
import os
import re

logger_import = "import logger, { logError } from '@/lib/logger';"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Remove all logger import lines
    cleaned_lines = []
    skip_next = False
    in_multiline_import = False
    
    for i, line in enumerate(lines):
        # Check if line contains logger import
        if logger_import.strip() in line.strip():
            continue
        
        # Check if we're entering a multiline import
        if 'import {' in line and '}' not in line:
            in_multiline_import = True
        
        # Check if we're exiting a multiline import
        if in_multiline_import and '}' in line:
            in_multiline_import = False
        
        # Skip lines that are part of broken multiline imports
        if in_multiline_import and not line.strip().startswith('import'):
            # Check if this looks like a continuation of an import
            if re.match(r'^\s+[A-Za-z_]', line):
                cleaned_lines.append(line)
            continue
        
        cleaned_lines.append(line)
    
    # Find last import line
    last_import_idx = -1
    for i, line in enumerate(cleaned_lines):
        if line.strip().startswith('import ') and 'from' in line:
            last_import_idx = i
    
    # Insert logger import after last import
    if last_import_idx >= 0:
        cleaned_lines.insert(last_import_idx + 1, logger_import + '\n')
    elif cleaned_lines and not cleaned_lines[0].strip().startswith('import'):
        cleaned_lines.insert(0, logger_import + '\n\n')
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(cleaned_lines)
    
    return True

def main():
    extensions = ('.ts', '.tsx')
    directories = ['app', 'lib', 'components']
    
    for directory in directories:
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith(extensions):
                    filepath = os.path.join(root, file)
                    # Only fix files that have logger import
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if 'logger' in content and '@/lib/logger' in content:
                        try:
                            fix_file(filepath)
                            print(f"Fixed: {filepath}")
                        except Exception as e:
                            print(f"Error fixing {filepath}: {e}")

if __name__ == '__main__':
    main()
