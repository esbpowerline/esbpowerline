const fs = require('fs');
const content = fs.readFileSync('C:/Users/hamim/esbpowerline/components/news/PowerGridExplorer.tsx', 'utf8');

// A simple parser to count braces, parens, brackets, and JSX tags in activeTab === 'macro' section
const startPattern = "{!isDataMissing && activeTab === 'macro' && (() => {";
const startIndex = content.indexOf(startPattern);

if (startIndex === -1) {
  console.log("Could not find start pattern");
  process.exit(1);
}

console.log("Found macro tab start at character index", startIndex);

let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;
let inString = false;
let stringChar = '';

for (let i = startIndex; i < content.length; i++) {
  const char = content[i];
  const nextChar = content[i + 1];

  // Simple string escape check
  if (inString) {
    if (char === '\\') {
      i++;
      continue;
    }
    if (char === stringChar) {
      inString = false;
    }
    continue;
  }

  if (char === '"' || char === "'" || char === '`') {
    inString = true;
    stringChar = char;
    continue;
  }

  // Check comments
  if (char === '/' && nextChar === '/') {
    // skip line
    while (i < content.length && content[i] !== '\n') {
      i++;
    }
    continue;
  }
  if (char === '/' && nextChar === '*') {
    i += 2;
    while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) {
      i++;
    }
    i++;
    continue;
  }

  if (char === '{') braceCount++;
  else if (char === '}') braceCount--;
  else if (char === '(') parenCount++;
  else if (char === ')') parenCount--;
  else if (char === '[') bracketCount++;
  else if (char === ']') bracketCount--;

  if (braceCount === 0 && parenCount === 0 && bracketCount === 0) {
    console.log(`Matching end found at character index ${i}:`, content.substring(i - 20, i + 20));
    break;
  }
}

console.log("At the end of loop:");
console.log("Brace balance:", braceCount);
console.log("Paren balance:", parenCount);
console.log("Bracket balance:", bracketCount);
