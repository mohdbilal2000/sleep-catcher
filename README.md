# sleep-catcher

> **Find the hard-coded waits that make your tests slow & flaky.**

[![npm version](https://img.shields.io/npm/v/sleep-catcher.svg)](https://www.npmjs.com/package/sleep-catcher)
[![license](https://img.shields.io/npm/l/sleep-catcher.svg)](./LICENSE)
[![CI](https://github.com/mohdbilal2000/sleep-catcher/actions/workflows/ci.yml/badge.svg)](https://github.com/mohdbilal2000/sleep-catcher/actions/workflows/ci.yml)
[![node](https://img.shields.io/node/v/sleep-catcher.svg)](https://nodejs.org)

`sleep-catcher` scans your test suite for **hard-coded waits** — `sleep(1000)`,
`page.waitForTimeout(2000)`, `cy.wait(500)`, `driver.sleep()`, `browser.pause()`
and bare `setTimeout` delays — and tells you exactly where they are, how bad they
are, and the smart wait to use instead.

## Why

Fixed delays are the **#1 cause of flaky tests**:

- **Too short** → the test fails intermittently on a slow CI run.
- **Too long** → every run wastes seconds that add up across a whole suite.

Either way you lose. The fix is almost always a _condition-based_ wait
(`await expect(locator).toBeVisible()`, `waitForSelector`, an aliased
`cy.wait('@request')`). `sleep-catcher` finds every offender in one command so
you can replace them.

## Demo

![demo](assets/demo.gif)

```bash
sleep-catcher examples/
```

## Install

Run it on demand with `npx` (no install):

```bash
npx sleep-catcher ./tests
```

Or install it globally:

```bash
npm i -g sleep-catcher
sleep-catcher ./tests
```

## Usage

```bash
sleep-catcher <dir> [options]
```

`<dir>` is the directory to scan. Files with these extensions are inspected:
`.js .ts .mjs .cjs .jsx .tsx`. `node_modules`, `dist` and `build` are skipped by
default.

### Default (table)

```bash
sleep-catcher examples/
```

```text
┌──────────────────────────────────┬──────────┬────────────────────────────┬──────────────────────────────────────────┐
│ Location                         │ Severity │ Code                       │ Suggestion                               │
├──────────────────────────────────┼──────────┼────────────────────────────┼──────────────────────────────────────────┤
│ examples/flaky.spec.ts:21:9      │ high     │ sleep(1000)                │ Wait for the condition you actually need… │
│ examples/flaky.spec.ts:24:9      │ high     │ page.waitForTimeout(2000)  │ Replace with a smart wait such as …       │
│ examples/flaky.spec.ts:27:3      │ high     │ cy.wait(500)               │ Wait on a route alias instead …           │
│ examples/flaky.spec.ts:30:9      │ high     │ driver.sleep(3000)         │ Use an explicit wait …                    │
│ examples/flaky.spec.ts:33:3      │ high     │ browser.pause(750)         │ Use `browser.waitUntil(...)` …            │
│ examples/flaky.spec.ts:36:32     │ medium   │ setTimeout(resolve, 250)   │ Avoid fixed delays; await the real …      │
└──────────────────────────────────┴──────────┴────────────────────────────┴──────────────────────────────────────────┘
✖ Found 6 hard waits in 1 file. (2 files scanned)
```

The process exits with code **1** when any finding is reported (great for CI),
and **0** when the suite is clean.

### JSON output

```bash
sleep-catcher examples/ --json
```

```json
{
  "summary": {
    "filesScanned": 2,
    "findings": 6,
    "bySeverity": { "high": 5, "medium": 1, "low": 0 }
  },
  "findings": [
    {
      "file": "examples/flaky.spec.ts",
      "line": 21,
      "column": 9,
      "rule": "sleep",
      "severity": "high",
      "code": "sleep(1000)",
      "suggestion": "Wait for the condition you actually need, e.g. `await expect(locator).toBeVisible()`, instead of sleeping."
    }
  ]
}
```

### Ignore extra paths

```bash
sleep-catcher ./tests --ignore "**/legacy/**" "**/*.e2e.ts"
```

## Options

| Option               | Description                                                   | Default |
| -------------------- | ------------------------------------------------------------- | ------- |
| `<dir>`              | Directory to scan (required).                                 | —       |
| `--json`             | Output findings as JSON instead of a table.                   | `false` |
| `--ignore <glob...>` | Extra glob pattern(s) to skip (repeatable / space-separated). | —       |
| `-v, --version`      | Print the version.                                            | —       |
| `-h, --help`         | Print help.                                                   | —       |

`node_modules`, `dist` and `build` are **always** ignored.

## What it catches

| Pattern                           | Rule             | Severity | Suggested smart wait                                 |
| --------------------------------- | ---------------- | -------- | ---------------------------------------------------- |
| `sleep(ms)` / `await sleep(ms)`   | `sleep`          | high     | `await expect(locator).toBeVisible()`                |
| `page.waitForTimeout(ms)`         | `waitForTimeout` | high     | `await page.waitForSelector(selector)`               |
| `cy.wait(<number>)`               | `cyWait`         | high     | `cy.wait('@alias')` on an intercepted route          |
| `driver.sleep(ms)`                | `driverSleep`    | high     | `driver.wait(until.elementIsVisible(el), t)`         |
| `browser.pause(ms)`               | `browserPause`   | high     | `browser.waitUntil(() => condition)`                 |
| `setTimeout(resolve, ms)` (delay) | `setTimeout`     | medium   | await the real condition (`waitFor` / `expect.poll`) |

> `cy.wait('@alias')` (alias waits) and `setTimeout(() => doWork(), ms)` (real
> scheduling) are **not** flagged.

## How it works

1. Each candidate file is parsed into an AST with
   [`@babel/parser`](https://babeljs.io/docs/babel-parser) (TypeScript + JSX
   aware).
2. The tree is walked and **call expressions** are matched against the rule set.
3. Because matching happens on the AST, occurrences inside **comments** and
   **string literals** are never reported — they simply aren't function calls.
4. `cy.wait` requires a **numeric** argument (alias waits are healthy), and
   `setTimeout` is only flagged when it's a **bare delay** (`setTimeout(resolve, ms)`
   or an empty callback).

## Record the demo

The demo GIF is produced with [vhs](https://github.com/charmbracelet/vhs):

```bash
# install vhs, then:
vhs demo.tape   # writes assets/demo.gif
```

## Roadmap

- [ ] Configurable severity thresholds (`--max-severity`).
- [ ] `--fix` suggestions inline / autofix where safe.
- [ ] ESLint plugin wrapper.
- [ ] Baseline file to ignore known offenders.
- [ ] Per-rule enable/disable.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for the dev
setup, scripts, and guidelines.

## License

[MIT](./LICENSE) © 2026 Mohd Bilal
