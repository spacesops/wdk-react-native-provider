#!/usr/bin/env node
/**
 * Transpile src to lib/module (runtime JS) and lib/typescript (.d.ts),
 * without react-native-builder-bob (avoids bob/ESM toolchain issues on some setups).
 *
 * Run after changing TypeScript sources under src/ so Metro loads fresh lib/module.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

function runTsc(project) {
  let tscCli;
  try {
    tscCli = require.resolve('typescript/lib/tsc.js', { paths: [root] });
  } catch {
    console.error('[emit-lib] Install devDependency `typescript` in the package root.');
    process.exit(1);
  }
  const r = spawnSync(process.execPath, [tscCli, '-p', project], {
    cwd: root,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

runTsc('tsconfig.emit-module.json');
runTsc('tsconfig.emit-dts.json');
console.log('[emit-lib] OK — lib/module and lib/typescript updated from src');
