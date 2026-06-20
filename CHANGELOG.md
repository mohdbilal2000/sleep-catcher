# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-06-20

### Added

- Initial release of `sleep-catcher`.
- AST-based scanner (`@babel/parser`) for `.js .ts .mjs .cjs .jsx .tsx` files.
- Detection rules for:
  - `sleep(ms)` / `await sleep(ms)`
  - `page.waitForTimeout(ms)`
  - `cy.wait(<number>)` (numeric only — alias waits are ignored)
  - `driver.sleep(ms)`
  - `browser.pause(ms)`
  - `setTimeout` used as a bare delay
- Matches inside comments and string literals are ignored.
- `node_modules`, `dist` and `build` skipped by default.
- CLI: `sleep-catcher <dir>` with `--json` and `--ignore <glob...>`; exits `1`
  when any finding is reported.
- Table and JSON reporters with per-finding severity and smart-wait suggestions.
- Example specs (`examples/flaky.spec.ts`, `examples/clean.spec.ts`).

[Unreleased]: https://github.com/mohdbilal2000/sleep-catcher/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mohdbilal2000/sleep-catcher/releases/tag/v0.1.0
