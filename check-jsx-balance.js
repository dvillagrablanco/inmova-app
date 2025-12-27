#!/usr/bin/env node

const fs = require('fs');

const file = 'app/contratos/page.tsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

// Find main tag range
let mainStart = -1;
let mainEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<main') && mainStart === -1) {
    mainStart = i;
    console.log(`Found <main> at line ${i + 1}`);
  }
  if (lines[i].includes('</main>') && mainEnd === -1) {
    mainEnd = i;
    console.log(`Found </main> at line ${i + 1}`);
    break;
  }
}

if (mainStart === -1 || mainEnd === -1) {
  console.log('Could not find main tags');
  process.exit(1);
}

// Check tag balance
const stack = [];
let errors = [];

for (let i = mainStart; i <= mainEnd; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // Find all tags in this line
  const openTags = line.match(/<([A-Z][a-zA-Z]*|div|main|section)(\s|>|\/)/g);
  const closeTags = line.match(/<\/([A-Z][a-zA-Z]*|div|main|section)>/g);
  const selfClosing = line.match(/<[A-Z][a-zA-Z]*[^>]*\/>/g);
  
  if (openTags) {
    openTags.forEach(tag => {
      const tagName = tag.match(/<([A-Z][a-zA-Z]*|div|main|section)/)[1];
      // Skip self-closing
      if (!line.includes(`<${tagName}`) || !line.includes('/>')) {
        stack.push({ tag: tagName, line: lineNum });
      }
    });
  }
  
  if (closeTags) {
    closeTags.forEach(closeTag => {
      const tagName = closeTag.match(/<\/([A-Z][a-zA-Z]*|div|main|section)>/)[1];
      
      if (stack.length === 0) {
        errors.push(`Line ${lineNum}: Closing </${tagName}> without opening tag`);
        return;
      }
      
      const last = stack[stack.length - 1];
      if (last.tag !== tagName) {
        errors.push(`Line ${lineNum}: Expected </${last.tag}> but found </${tagName}> (opened at line ${last.line})`);
      }
      
      stack.pop();
    });
  }
}

console.log('\n=== TAG STACK ===');
if (stack.length > 0) {
  console.log('Unclosed tags:');
  stack.forEach(item => {
    console.log(`  <${item.tag}> at line ${item.line}`);
  });
} else {
  console.log('All tags are balanced!');
}

if (errors.length > 0) {
  console.log('\n=== ERRORS ===');
  errors.forEach(err => console.log(`  ${err}`));
}
