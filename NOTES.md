nvm use v24.11.0

## Installation Issue Fix

The `@spacesops/pear-wrk-wdk` package has a postinstall script that fails because it expects a `node_modules` directory within its own package directory, but npm hoists dependencies to the root.

**Workaround:**
1. Install dependencies with `npm install --ignore-scripts` to skip the failing postinstall
2. A `postinstall` script has been added to this package.json that automatically creates the necessary symlink
3. After installation, the symlink allows the pear-wrk-wdk postinstall script to run successfully

If you encounter this issue, you can manually fix it by running:
```bash
cd node_modules/@spacesops/pear-wrk-wdk && ln -s ../../.. node_modules && npm run gen:mobile-bundle
```


Going forward:
When you run npm install, the postinstall script will automatically handle this issue
If you need to install with --ignore-scripts, you can manually run npm run postinstall afterward
