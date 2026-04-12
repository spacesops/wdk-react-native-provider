#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check both possible package locations (@spacesops and @tetherto alias)
const packagePaths = [
  path.join(__dirname, '..', 'node_modules', '@spacesops', 'pear-wrk-wdk'),
  path.join(__dirname, '..', 'node_modules', '@tetherto', 'pear-wrk-wdk'),
];

for (const pkgPath of packagePaths) {
  if (!fs.existsSync(pkgPath)) {
    continue;
  }

  const nmPath = path.join(pkgPath, 'node_modules');
  const bundlePath = path.join(pkgPath, 'bundle', 'wdk-worklet.mobile.bundle.js');
  const packageName = pkgPath.includes('@spacesops') ? '@spacesops/pear-wrk-wdk' : '@tetherto/pear-wrk-wdk';

  // Create symlink if package exists and symlink doesn't
  if (!fs.existsSync(nmPath)) {
    try {
      fs.symlinkSync('../../..', nmPath, 'dir');
      console.log(`Created symlink for ${packageName} node_modules`);
    } catch (error) {
      // Symlink might already exist or be a file, ignore
      if (error.code !== 'EEXIST') {
        console.warn(`Warning: Could not create symlink for ${packageName}:`, error.message);
      }
    }
  }

  // Run postinstall script if bundle doesn't exist
  if (!fs.existsSync(bundlePath)) {
    try {
      console.log(`Running ${packageName} postinstall script...`);
      const originalCwd = process.cwd();
      process.chdir(pkgPath);
      execSync('npm run gen:mobile-bundle', { stdio: 'inherit' });
      process.chdir(originalCwd);
    } catch (error) {
      console.warn(`Warning: Could not run ${packageName} postinstall:`, error.message);
      process.chdir(originalCwd);
    }
  }
}

