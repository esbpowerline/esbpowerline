const fs = require('fs');
const content = fs.readFileSync('C:/Users/hamim/esbpowerline/components/news/PowerGridExplorer.tsx', 'utf8');

const startPattern = "{macroSubTab === 'system_loss' && (";
const startIndex = content.indexOf(startPattern);

if (startIndex === -1) {
  console.log("Could not find system_loss start pattern");
  process.exit(1);
}

// Find matching `)}` using paren and brace counting
let parenCount = 1;
let braceCount = 0;
let endIndex = -1;

for (let i = startIndex + startPattern.length; i < content.length; i++) {
  const char = content[i];
  if (char === '(') parenCount++;
  else if (char === ')') parenCount--;
  else if (char === '{') braceCount++;
  else if (char === '}') braceCount--;

  if (parenCount === 0) {
    endIndex = i;
    break;
  }
}

const subtabContent = content.substring(startIndex + startPattern.length, endIndex);

// Let's strip JSX expressions: any {...} block at the top level of the HTML
function stripExpressions(str) {
  let result = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    
    if (inString) {
      if (char === '\\') {
        i++;
        continue;
      }
      if (char === stringChar) {
        inString = false;
      }
      if (depth === 0) result += char;
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      if (depth === 0) result += char;
      continue;
    }

    if (char === '{') {
      depth++;
      continue;
    }
    if (char === '}') {
      depth--;
      continue;
    }

    if (depth === 0) {
      result += char;
    }
  }
  return result;
}

const htmlOnly = stripExpressions(subtabContent);

// Match tags
const tagRegex = /<(\/)?([a-zA-Z0-9_.-]+)([^>]*?)>/g;
let match;
const stack = [];

while ((match = tagRegex.exec(htmlOnly)) !== null) {
  const isClosing = !!match[1];
  const tagName = match[2];
  const attributes = match[3];

  if (attributes.endsWith('/')) {
    continue;
  }

  if (isClosing) {
    const lastOpened = stack.pop();
    console.log(`Pop: closed </${tagName}>, matched with <${lastOpened}>`);
  } else {
    stack.push(tagName);
    console.log(`Push: opened <${tagName}>`);
  }
}

console.log("Remaining open HTML tags in stack:", stack);
