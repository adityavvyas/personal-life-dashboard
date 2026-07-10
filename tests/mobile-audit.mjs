/**
 * Mobile Audit & Error Detection Test Suite
 * Scans the codebase for common mobile issues, duplicate keys, undeclared variables, etc.
 * Run: node tests/mobile-audit.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.join(__dirname, '..', 'src');

let totalPassed = 0;
let totalFailed = 0;
const results = [];

function test(name, fn) {
  try {
    const issues = fn();
    if (issues.length === 0) {
      results.push({ name, status: 'PASS', issues: [] });
      totalPassed++;
    } else {
      results.push({ name, status: 'FAIL', issues });
      totalFailed++;
    }
  } catch (err) {
    results.push({ name, status: 'ERROR', issues: [err.message] });
    totalFailed++;
  }
}

function getAllFiles(dir, ext = '.js') {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...getAllFiles(fullPath, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

// ─── TEST 1: No cursor: 'none' in inline styles ───
test('No cursor:none in inline styles', () => {
  const issues = [];
  const files = getAllFiles(SRC_DIR);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      // Match cursor: 'none' or cursor: "none" in JSX inline styles
      if (/cursor:\s*['"]none['"]/i.test(line) && !file.includes('CustomCursor')) {
        issues.push(`${path.relative(SRC_DIR, file)}:${i + 1} — cursor: 'none' found`);
      }
    });
  }
  return issues;
});

// ─── TEST 2: No cursor: none in CSS (except CustomCursor) ───
test('No cursor:none in CSS styles', () => {
  const issues = [];
  const files = getAllFiles(SRC_DIR);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (/cursor:\s*none/i.test(line) && !file.includes('CustomCursor') && !/cursor:\s*['"]/.test(line)) {
        issues.push(`${path.relative(SRC_DIR, file)}:${i + 1} — cursor: none in CSS`);
      }
    });
  }
  return issues;
});

// ─── TEST 3: All nav pages accessible in Navigation.js ───
test('All app pages accessible in Navigation', () => {
  const issues = [];
  const appDir = path.join(SRC_DIR, 'app');
  const expectedPages = [];
  
  for (const entry of fs.readdirSync(appDir, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith('(') && !entry.name.startsWith('api') && entry.name !== 'login') {
      const pagePath = path.join(appDir, entry.name, 'page.js');
      if (fs.existsSync(pagePath)) {
        expectedPages.push(`/${entry.name}`);
      }
    }
  }
  
  // Check root page
  if (fs.existsSync(path.join(appDir, 'page.js'))) {
    expectedPages.push('/');
  }

  const navFile = fs.readFileSync(path.join(SRC_DIR, 'components', 'Navigation.js'), 'utf8');
  
  for (const page of expectedPages) {
    if (!navFile.includes(`'${page}'`) && !navFile.includes(`"${page}"`)) {
      issues.push(`Page ${page} is not referenced in Navigation.js`);
    }
  }
  return issues;
});

// ─── TEST 4: No hardcoded pixel widths without responsive fallback ───
test('No problematic fixed widths in pages', () => {
  const issues = [];
  const problematicPatterns = [
    /width:\s*['"](\d{4,})px/,  // widths >= 1000px
    /minWidth:\s*['"](\d{4,})px/,
  ];
  
  const pageFiles = getAllFiles(path.join(SRC_DIR, 'app'));
  for (const file of pageFiles) {
    if (file.includes('globals.css') || file.includes('layout.js')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      for (const pattern of problematicPatterns) {
        if (pattern.test(line)) {
          issues.push(`${path.relative(SRC_DIR, file)}:${i + 1} — Large fixed width: ${line.trim().substring(0, 60)}`);
        }
      }
    });
  }
  return issues;
});

// ─── TEST 5: No duplicate React keys (NaN key pattern) ───
test('No NaN-prone React keys', () => {
  const issues = [];
  const files = getAllFiles(SRC_DIR);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      // Check for key={someNumber + idx} where someNumber could be NaN
      if (/key=\{[^}]*\+\s*idx[^}]*\}/.test(line) && /key=\{[^}]*(\.price|\.amount|\.value|parseFloat|parseInt)/i.test(line)) {
        issues.push(`${path.relative(SRC_DIR, file)}:${i + 1} — Potential NaN key: ${line.trim().substring(0, 80)}`);
      }
    });
  }
  return issues;
});

// ─── TEST 6: Used but undeclared variables (let/const pattern check) ───
test('No used-but-undeclared variables in parse blocks', () => {
  const issues = [];
  const files = getAllFiles(SRC_DIR);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    // Look for assignment without declaration: identifier = ... where identifier hasn't been declared
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      // Match bare assignment like: parsedSomething = value (no let/const/var prefix)
      const match = trimmed.match(/^(parsed\w+)\s*=/);
      if (match && !trimmed.startsWith('let ') && !trimmed.startsWith('const ') && !trimmed.startsWith('var ') && !trimmed.startsWith('//')) {
        // Check if it's declared earlier in the file
        const varName = match[1];
        const declarationPattern = new RegExp(`(let|const|var)\\s+${varName}`);
        if (!declarationPattern.test(content)) {
          issues.push(`${path.relative(SRC_DIR, file)}:${i + 1} — Undeclared variable: ${varName}`);
        }
      }
    });
  }
  return issues;
});

// ─── TEST 7: Viewport maximumScale check ───
test('Viewport allows pinch-to-zoom (no maximumScale: 1)', () => {
  const issues = [];
  const layoutFile = path.join(SRC_DIR, 'app', 'layout.js');
  if (fs.existsSync(layoutFile)) {
    const content = fs.readFileSync(layoutFile, 'utf8');
    if (/maximumScale:\s*1[,\s}]/.test(content)) {
      issues.push('layout.js: maximumScale: 1 prevents pinch-to-zoom (accessibility issue)');
    }
  }
  return issues;
});

// ─── TEST 8: Mobile touch detection in CustomCursor ───
test('CustomCursor has mobile/touch detection', () => {
  const issues = [];
  const cursorFile = path.join(SRC_DIR, 'components', 'CustomCursor.js');
  if (fs.existsSync(cursorFile)) {
    const content = fs.readFileSync(cursorFile, 'utf8');
    if (!content.includes('ontouchstart') && !content.includes('pointer: coarse') && !content.includes('isTouchDevice') && !content.includes('isMobile')) {
      issues.push('CustomCursor.js: No mobile/touch device detection found');
    }
  }
  return issues;
});

// ─── TEST 9: Grid minmax without min() guard ───
test('Grid minmax uses min(100%, x) for mobile safety', () => {
  const issues = [];
  const files = getAllFiles(SRC_DIR);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      // Match minmax(Xpx where X >= 300 without min() wrapper
      const match = line.match(/minmax\(\s*(\d+)px/);
      if (match && parseInt(match[1]) >= 300 && !line.includes('min(')) {
        issues.push(`${path.relative(SRC_DIR, file)}:${i + 1} — Grid minmax(${match[1]}px) without min() guard`);
      }
    });
  }
  return issues;
});

// ─── TEST 10: AnimatePresence imported where used ───
test('AnimatePresence imported when used', () => {
  const issues = [];
  const files = getAllFiles(SRC_DIR);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('<AnimatePresence') && !content.includes('AnimatePresence')) {
      issues.push(`${path.relative(SRC_DIR, file)} — Uses AnimatePresence without import`);
    }
    if (content.includes('<AnimatePresence') && content.includes('AnimatePresence') && !content.includes("import") ) {
      // Edge case — skip
    }
    // More precise: uses AnimatePresence in JSX but doesn't import it
    if (content.includes('<AnimatePresence') && !/import\s*{[^}]*AnimatePresence[^}]*}/.test(content)) {
      issues.push(`${path.relative(SRC_DIR, file)} — AnimatePresence used but not imported from framer-motion`);
    }
  }
  return issues;
});

// ─── OUTPUT ───
console.log('\n' + '═'.repeat(60));
console.log('  MOBILE AUDIT & ERROR DETECTION REPORT');
console.log('═'.repeat(60) + '\n');

for (const r of results) {
  const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${r.name}: ${r.status}`);
  for (const issue of r.issues) {
    console.log(`   └─ ${issue}`);
  }
}

console.log('\n' + '─'.repeat(60));
console.log(`  Total: ${totalPassed + totalFailed} tests | ✅ ${totalPassed} passed | ❌ ${totalFailed} failed`);
console.log('─'.repeat(60) + '\n');

process.exit(totalFailed > 0 ? 1 : 0);
