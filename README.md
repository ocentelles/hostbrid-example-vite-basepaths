# Root versus nested public paths

Original Hostbrid MIT React/Vite fixture; exact versions and lock copied from ai-react. Includes its own CDP browser helper. No import from hostbrid-web, private service, database or credentials.

## Reproduce from a standalone copy

Install **Node22.23.3 exactly**, including npm, and Chrome. From this directory:

```sh
node run-matrix.mjs
```

The runner uses process.execPath, verifies Node version and npm version before installation, and defaults to the npm CLI resolved beside Node. For a nonstandard installation set HOSTBRID_NPM_CLI to the full npm-cli.js path.

Chrome defaults to `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` on macOS; elsewhere set HOSTBRID_CHROME_PATH to its executable absolute path. This is checked before installation. Chrome's debugging port and local HTTP ports are dynamically allocated.

Output is a new private mkdtemp directory in the OS temporary folder, printed as OUTPUT. Optionally set HOSTBRID_BASEPATHS_OUTPUT_PARENT to an output parent; every run creates its own new child and never overwrites previous evidence. Node dependencies, builds, PNG and logs are written there. Chrome profile is removed only after process exit; HTTP servers are awaited on close. Other artifacts remain for review.

Source allowlist (14 files): LICENSE, NOTICE, README.md, index.html, package.json, package-lock.json, vite.config.js, run-matrix.mjs, browser.mjs, public/config.json, src/main.jsx, src/styles.css, src/chunk.js, src/assets/leaf.svg. Do not publish node_modules, run outputs, logs, screenshots or artifacts as source.

Six local cases cover root/prefix, wrong build base, relative base on deep routes, wrong minimal-router basename, and deliberate HTML responses to JavaScript. Negative cases must fail by the intended URL/status/MIME contract, not installation/network failure. Router is an original minimal history implementation, not React Router. No deployment or proof of Hostbrid prefixed deployment support.
