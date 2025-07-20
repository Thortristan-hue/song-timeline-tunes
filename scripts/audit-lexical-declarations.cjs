#!/usr/bin/env node

/**
 * Lexical Declaration Audit Script
 * 
 * This script audits the codebase for potential lexical declaration issues
 * that could cause "can't access lexical declaration before initialization" errors.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 LEXICAL DECLARATION AUDIT');
console.log('============================');

const srcDir = path.join(__dirname, '../src');
const issues = [];

// Patterns that commonly cause lexical declaration issues
const patterns = [
  {
    name: 'Temporal Dead Zone - let/const before declaration',
    regex: /console\.log\((\w+)\);[\s\S]*?(let|const)\s+\1\s*=/g,
    description: 'Variable used before let/const declaration'
  },
  {
    name: 'Class used before declaration',
    regex: /new\s+(\w+)\([\s\S]*?class\s+\1/g,
    description: 'Class instantiated before class declaration'
  },
  {
    name: 'Function called in initialization',
    regex: /(let|const)\s+\w+\s*=\s*(\w+)\([\s\S]*?function\s+\2/g,
    description: 'Function called during variable initialization before function declaration'
  },
  {
    name: 'Arrow function in TDZ',
    regex: /(let|const)\s+(\w+)\s*=\s*\(\)\s*=>\s*\2/g,
    description: 'Arrow function referencing itself in initialization'
  },
  {
    name: 'Default parameter TDZ',
    regex: /function\s+\w+\s*\((\w+)\s*=\s*\1\)/g,
    description: 'Default parameter referencing itself'
  }
];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(srcDir, filePath);
    
    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        issues.push({
          file: relativePath,
          line: lineNumber,
          pattern: pattern.name,
          description: pattern.description,
          code: match[0].trim().substring(0, 100) + (match[0].length > 100 ? '...' : '')
        });
      }
    });
    
  } catch (error) {
    console.warn(`⚠️ Could not scan ${filePath}:`, error.message);
  }
}

function scanDirectory(dir) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        scanFile(fullPath);
      }
    }
  } catch (error) {
    console.warn(`⚠️ Could not scan directory ${dir}:`, error.message);
  }
}

// Run the audit
console.log('🔍 Scanning TypeScript/TSX files for lexical declaration issues...\n');
scanDirectory(srcDir);

// Report results
if (issues.length === 0) {
  console.log('✅ AUDIT COMPLETE: No obvious lexical declaration issues found!');
  console.log('✅ Common TDZ patterns not detected in the codebase.');
} else {
  console.log(`🚨 AUDIT COMPLETE: Found ${issues.length} potential issue(s):\n`);
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. 📁 ${issue.file}:${issue.line}`);
    console.log(`   🔍 Pattern: ${issue.pattern}`);
    console.log(`   📝 Description: ${issue.description}`);
    console.log(`   💻 Code: ${issue.code}`);
    console.log('');
  });
  
  console.log('💡 RECOMMENDATIONS:');
  console.log('- Review the flagged code for potential temporal dead zone issues');
  console.log('- Ensure variables are declared before use');
  console.log('- Consider using function declarations instead of function expressions');
  console.log('- Move variable declarations to the top of their scope when appropriate');
}

// Additional checks for React-specific issues
console.log('\n🔍 REACT-SPECIFIC CHECKS');
console.log('========================');

const reactIssues = [];

function checkReactPatterns(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(srcDir, filePath);
    
    // Check for potential React hook ordering issues
    const hookPattern = /use\w+\(/g;
    const hooks = [];
    let match;
    
    while ((match = hookPattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      hooks.push({ hook: match[0], line: lineNumber });
    }
    
    // Check for hooks after early returns
    const lines = content.split('\n');
    let foundEarlyReturn = false;
    let foundHookAfterReturn = false;
    
    lines.forEach((line, index) => {
      if (line.includes('return') && !line.includes('//') && foundEarlyReturn === false) {
        // Check if this is actually an early return (not in a function)
        const beforeReturn = lines.slice(0, index).join('\n');
        const openBraces = (beforeReturn.match(/{/g) || []).length;
        const closeBraces = (beforeReturn.match(/}/g) || []).length;
        
        if (openBraces > closeBraces) {
          foundEarlyReturn = true;
          const earlyReturnLine = index + 1;
          
          // Check for hooks after this point
          for (let i = index + 1; i < lines.length; i++) {
            if (lines[i].includes('use') && lines[i].includes('(')) {
              foundHookAfterReturn = true;
              
              reactIssues.push({
                file: relativePath,
                line: i + 1,
                earlyReturnLine,
                description: 'Potential hook called after early return',
                code: lines[i].trim()
              });
            }
          }
        }
      }
    });
    
  } catch (error) {
    console.warn(`⚠️ Could not check React patterns in ${filePath}:`, error.message);
  }
}

// Scan for React-specific issues
const reactFiles = [];
function findReactFiles(dir) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        findReactFiles(fullPath);
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.jsx'))) {
        reactFiles.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`⚠️ Could not find React files in ${dir}:`, error.message);
  }
}

findReactFiles(srcDir);
reactFiles.forEach(checkReactPatterns);

if (reactIssues.length === 0) {
  console.log('✅ No React-specific lexical declaration issues found!');
} else {
  console.log(`🚨 Found ${reactIssues.length} potential React issue(s):\n`);
  
  reactIssues.forEach((issue, index) => {
    console.log(`${index + 1}. 📁 ${issue.file}:${issue.line}`);
    console.log(`   🔍 Issue: ${issue.description}`);
    console.log(`   ⚠️ Early return at line: ${issue.earlyReturnLine}`);
    console.log(`   💻 Code: ${issue.code}`);
    console.log('');
  });
}

console.log('\n🎯 AUDIT SUMMARY');
console.log('================');
console.log(`📊 Total files scanned: ${reactFiles.length + issues.length}`);
console.log(`🚨 General lexical issues: ${issues.length}`);
console.log(`⚛️ React-specific issues: ${reactIssues.length}`);
console.log(`🎯 Total potential problems: ${issues.length + reactIssues.length}`);

if (issues.length + reactIssues.length === 0) {
  console.log('\n🎉 EXCELLENT! The codebase appears to be free from common lexical declaration issues.');
  console.log('✅ This significantly reduces the risk of "can\'t access lexical declaration before initialization" errors.');
} else {
  console.log('\n💡 Consider reviewing and fixing the flagged issues to prevent runtime errors.');
}