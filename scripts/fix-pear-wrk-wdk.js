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

  // Create symlink so bare-pack resolves dependencies from the provider's
  // hoisted node_modules. Use an absolute path so it works regardless of
  // whether pear-wrk-wdk itself is a file: symlink or an npm-installed copy.
  const providerNodeModules = path.resolve(__dirname, '..', 'node_modules');
  if (!fs.existsSync(nmPath)) {
    try {
      fs.symlinkSync(providerNodeModules, nmPath, 'dir');
      console.log(`Created symlink for ${packageName} node_modules -> ${providerNodeModules}`);
    } catch (error) {
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

