#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PEAR_NAME = '@spacesops/pear-wrk-wdk';
const providerRoot = path.join(__dirname, '..');
const providerNodeModules = path.join(providerRoot, 'node_modules');
const tethertoScope = path.join(providerNodeModules, '@tetherto');

/**
 * npm v10+ may install peer deps under a hashed folder like
 * node_modules/@tetherto/.pear-wrk-wdk-<id>/ while leaving a broken
 * node_modules/@tetherto/pear-wrk-wdk/ stub. Discover all plausible roots.
 */
function collectPearCandidates () {
  const candidates = [
    path.join(tethertoScope, 'pear-wrk-wdk'),
    path.join(providerNodeModules, '@spacesops', 'pear-wrk-wdk'),
  ];

  if (fs.existsSync(tethertoScope)) {
    for (const name of fs.readdirSync(tethertoScope)) {
      if (name.startsWith('.pear-wrk-wdk-')) {
        candidates.push(path.join(tethertoScope, name));
      }
    }
  }

  const roots = [];
  for (const pkgPath of candidates) {
    if (!fs.existsSync(pkgPath)) continue;
    const pkgJsonPath = path.join(pkgPath, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) continue;
    try {
      const meta = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      if (meta.name !== PEAR_NAME) continue;
    } catch {
      continue;
    }
    roots.push(pkgPath);
  }
  return roots;
}

function repairBrokenPearLink (canonicalRealPath) {
  const linkPath = path.join(tethertoScope, 'pear-wrk-wdk');
  const pkgJsonAtLink = path.join(linkPath, 'package.json');
  if (fs.existsSync(pkgJsonAtLink)) {
    return;
  }
  if (!fs.existsSync(linkPath)) {
    try {
      fs.symlinkSync(canonicalRealPath, linkPath, 'dir');
      console.log(`Linked @tetherto/pear-wrk-wdk -> ${canonicalRealPath}`);
    } catch (e) {
      console.warn('Could not create @tetherto/pear-wrk-wdk symlink:', e.message);
    }
    return;
  }

  try {
    fs.rmSync(linkPath, { recursive: true, force: true });
    fs.symlinkSync(canonicalRealPath, linkPath, 'dir');
    console.log(`Replaced broken @tetherto/pear-wrk-wdk with symlink -> ${canonicalRealPath}`);
  } catch (e) {
    console.warn('Could not repair @tetherto/pear-wrk-wdk:', e.message);
  }
}

const candidates = collectPearCandidates();
if (candidates.length === 0) {
  console.warn('pear-wrk-wdk: no installed package with package.json found (skipping).');
  process.exit(0);
}

const seenRealPaths = new Set();
let canonicalReal = null;

for (const pkgPath of candidates) {
  let realPath;
  try {
    realPath = fs.realpathSync(pkgPath);
  } catch {
    continue;
  }
  if (seenRealPaths.has(realPath)) continue;
  seenRealPaths.add(realPath);
  if (!canonicalReal) canonicalReal = realPath;

  const nmPath = path.join(pkgPath, 'node_modules');
  const bundlePath = path.join(pkgPath, 'bundle', 'wdk-worklet.mobile.bundle.js');
  const packageLabel = pkgPath.includes(`${path.sep}@spacesops${path.sep}`)
    ? '@spacesops/pear-wrk-wdk'
    : '@tetherto/pear-wrk-wdk';

  if (!fs.existsSync(nmPath)) {
    try {
      fs.symlinkSync(providerNodeModules, nmPath, 'dir');
      console.log(`Created symlink for ${packageLabel} node_modules -> ${providerNodeModules}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.warn(`Warning: Could not create symlink for ${packageLabel}:`, error.message);
      }
    }
  }

  if (!fs.existsSync(bundlePath)) {
    const originalCwd = process.cwd();
    try {
      console.log(`Running ${packageLabel} gen:mobile-bundle...`);
      process.chdir(pkgPath);
      execSync('npm run gen:mobile-bundle', { stdio: 'inherit' });
    } catch (error) {
      console.warn(`Warning: Could not run ${packageLabel} gen:mobile-bundle:`, error.message);
    } finally {
      process.chdir(originalCwd);
    }
  }
}

if (canonicalReal) {
  repairBrokenPearLink(canonicalReal);
}
