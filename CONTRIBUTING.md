# Contributing to sleep-catcher

Thanks for your interest in improving `sleep-catcher`! 🎉

## Development setup

Requires **Node.js 20+**.

```bash
git clone https://github.com/mohdbilal2000/sleep-catcher.git
cd sleep-catcher
npm install
```

## Scripts

| Script                 | Description                           |
| ---------------------- | ------------------------------------- |
| `npm run build`        | Bundle the CLI + library with `tsup`. |
| `npm run dev`          | Rebuild on change (watch mode).       |
| `npm test`             | Run the test suite (`vitest`).        |
| `npm run test:watch`   | Run tests in watch mode.              |
| `npm run typecheck`    | Type-check with `tsc --noEmit`.       |
| `npm run lint`         | Lint with ESLint.                     |
| `npm run format`       | Format with Prettier.                 |
| `npm run format:check` | Verify formatting without writing.    |

Try the CLI locally:

```bash
npm run build
node dist/cli.js examples/
```

## Adding a detection rule

1. Add the rule id to `RuleId` in `src/types.ts`.
2. Add its metadata (label, severity, suggestion) to `RULES` in `src/rules.ts`.
3. Match it in `matchCall` inside `src/scanner.ts`.
4. Add tests in `tests/scanner.test.ts` covering **both** a true positive and a
   false-positive guard (comment / string / look-alike).

## Guidelines

- Keep matching **AST-based** — never report inside comments or strings.
- Prefer **no false positives**: when in doubt, require a delay value.
- `npm test`, `npm run lint`, and `npm run build` must pass.
- Use [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `test:`, `chore:` …).

## Reporting bugs

Open an issue with a minimal code snippet that reproduces the false positive or
missed detection.
