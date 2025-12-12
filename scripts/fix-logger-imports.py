#!/usr/bin/env python3
import os
import re
import sys

logger_import = "import logger, { logError } from '@/lib/logger';"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if logger import is in a bad position
    if logger_import in content:
        lines = content.split('\n')
        new_lines = []
        in_multiline_import = False
        multiline_import_lines = []
        logger_import_found_in_multiline = False
        last_import_index = -1
        
        for i, line in enumerate(lines):
            # Track if we're in a multiline import
            if line.strip().startswith('import ') and '{' in line and '}' not in line:
                in_multiline_import = True
                multiline_import_lines = [line]
                continue
            elif in_multiline_import:
                multiline_import_lines.append(line)
                if logger_import.strip() in line.strip():
                    logger_import_found_in_multiline = True
                    continue  # Skip this line
                if '}' in line:
                    in_multiline_import = False
                    # Reconstruct multiline import without logger
                    if not logger_import_found_in_multiline:
                        new_lines.extend(multiline_import_lines)
                    else:
                        new_lines.extend(multiline_import_lines)
                    multiline_import_lines = []
                    logger_import_found_in_multiline = False
                    continue
                continue
            
            # Skip standalone logger import lines for now
            if line.strip() == logger_import.strip():
                continue
            
            # Track last import line
            if line.strip().startswith('import ') and 'from' in line:
                last_import_index = len(new_lines)
            
            new_lines.append(line)
        
        # Insert logger import after last import
        if last_import_index >= 0:
            new_lines.insert(last_import_index + 1, logger_import)
        elif new_lines and not new_lines[0].strip().startswith('import'):
            new_lines.insert(0, logger_import)
            new_lines.insert(1, '')
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        
        print(f"Fixed: {filepath}")
        return True
    return False

def main():
    extensions = ('.ts', '.tsx')
    directories = ['app', 'lib', 'components']
    
    count = 0
    for directory in directories:
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith(extensions):
                    filepath = os.path.join(root, file)
                    if fix_file(filepath):
                        count += 1
    
    print(f"\nFixed {count} files")

if __name__ == '__main__':
    main()
