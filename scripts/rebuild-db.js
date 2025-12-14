const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Rebuilding better-sqlite3 for current environment...');

try {
  // Check if we're in Electron or Node.js environment
  const isElectron = process.versions.electron !== undefined;
  
  if (isElectron) {
    console.log('Detected Electron environment, rebuilding for Electron...');
    execSync('npx @electron/rebuild -f -w better-sqlite3', { stdio: 'inherit' });
  } else {
    console.log('Detected Node.js environment, rebuilding for Node.js...');
    execSync('npm rebuild better-sqlite3', { stdio: 'inherit' });
  }
  
  console.log('Rebuild completed successfully!');
} catch (error) {
  console.error('Rebuild failed:', error.message);
  process.exit(1);
}
