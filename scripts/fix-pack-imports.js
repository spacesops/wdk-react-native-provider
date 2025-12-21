#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Updates pack.imports.json with absolute paths to shim modules
 * This is required for bare-pack to resolve optional dependencies correctly
 */
function fixPackImports() {
  const packImportsPath = path.join(
    __dirname,
    '..',
    'node_modules',
    '@tetherto',
    'pear-wrk-wdk',
    'pack.imports.json'
  );

  // Check if the file exists
  if (!fs.existsSync(packImportsPath)) {
    console.warn(
      'Warning: pack.imports.json not found at',
      packImportsPath,
      '- skipping fix'
    );
    return;
  }

  // Read the current pack.imports.json
  let packImports;
  try {
    packImports = JSON.parse(fs.readFileSync(packImportsPath, 'utf8'));
  } catch (error) {
    console.error('Error reading pack.imports.json:', error.message);
    return;
  }

  // Base directory for shims
  const shimsBaseDir = path.join(
    path.dirname(packImportsPath),
    'shims'
  );

  // List of shim modules that need absolute paths
  const shimModules = ['bufferutil', 'utf-8-validate', 'ledger-bitcoin'];

  // Update paths for shim modules
  let updated = false;
  for (const moduleName of shimModules) {
    const shimPath = path.join(shimsBaseDir, moduleName, 'index.js');
    
    // Check if shim exists
    if (fs.existsSync(shimPath)) {
      const absolutePath = path.resolve(shimPath);
      
      // Only update if path is different
      if (packImports[moduleName] !== absolutePath) {
        packImports[moduleName] = absolutePath;
        updated = true;
        console.log(`Updated ${moduleName} path in pack.imports.json`);
      }
    } else {
      console.warn(
        `Warning: Shim not found for ${moduleName} at ${shimPath}`
      );
    }
  }

  // Write back if updated
  if (updated) {
    try {
      fs.writeFileSync(
        packImportsPath,
        JSON.stringify(packImports, null, 2) + '\n',
        'utf8'
      );
      console.log('Successfully updated pack.imports.json');
    } catch (error) {
      console.error('Error writing pack.imports.json:', error.message);
      process.exit(1);
    }
  } else {
    console.log('pack.imports.json is already up to date');
  }
}

// Run the fix
fixPackImports();

