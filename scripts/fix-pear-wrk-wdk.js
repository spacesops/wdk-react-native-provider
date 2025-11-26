#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkgPath = path.join(__dirname, '..', 'node_modules', '@spacesops', 'pear-wrk-wdk');
const nmPath = path.join(pkgPath, 'node_modules');
const bundlePath = path.join(pkgPath, 'bundle', 'wdk-worklet.mobile.bundle.js');

// Create symlink if package exists and symlink doesn't
if (fs.existsSync(pkgPath) && !fs.existsSync(nmPath)) {
  try {
    fs.symlinkSync('../../..', nmPath, 'dir');
    console.log('Created symlink for @spacesops/pear-wrk-wdk node_modules');
  } catch (error) {
    // Symlink might already exist or be a file, ignore
    if (error.code !== 'EEXIST') {
      console.warn('Warning: Could not create symlink:', error.message);
    }
  }
}

// Run postinstall script if bundle doesn't exist
if (fs.existsSync(pkgPath) && !fs.existsSync(bundlePath)) {
  try {
    console.log('Running @spacesops/pear-wrk-wdk postinstall script...');
    process.chdir(pkgPath);
    execSync('npm run gen:mobile-bundle', { stdio: 'inherit' });
  } catch (error) {
    console.warn('Warning: Could not run pear-wrk-wdk postinstall:', error.message);
  }
}

