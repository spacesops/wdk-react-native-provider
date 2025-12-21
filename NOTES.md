nvm use v24.11.0

## Installation Issue Fix

The `@spacesops/pear-wrk-wdk` package has a postinstall script that fails because it expects a `node_modules` directory within its own package directory, but npm hoists dependencies to the root.

**Installation Workflow:**

Due to npm running dependency postinstall scripts before our own postinstall script, you need to:

1. Install dependencies with `--ignore-scripts` to skip the failing postinstall:
   ```bash
   npm install --ignore-scripts
   ```

2. Run our postinstall script to fix the symlink and generate the bundle:
   ```bash
   npm run postinstall
   ```

**What the postinstall script does:**
- Creates a symlink from `node_modules/@spacesops/pear-wrk-wdk/node_modules` to the root `node_modules` directory
- Runs the pear-wrk-wdk postinstall script to generate the required bundle (if it doesn't exist)
- Updates `pack.imports.json` with absolute paths to shim modules (`bufferutil`, `utf-8-validate`, `ledger-bitcoin`) required for `bare-pack` bundling

**Manual fix (if needed):**
If you need to manually fix it:
```bash
cd node_modules/@spacesops/pear-wrk-wdk && ln -s ../../.. node_modules && npm run gen:mobile-bundle
node scripts/fix-pack-imports.js
```

npm install --ignore-scripts
npm run postinstall

