import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { Command } from 'commander';
import { scanDir } from './scan-dir.js';
import { formatJson, formatTable } from './report.js';

interface CliOptions {
  json?: boolean;
  ignore?: string[];
}

function getVersion(): string {
  try {
    const require = createRequire(import.meta.url);
    const pkg = require('../package.json') as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Build and run the CLI.
 *
 * @returns the process exit code: `1` when any hard wait is found, else `0`.
 */
export async function run(argv: string[] = process.argv): Promise<number> {
  let exitCode = 0;

  const program = new Command();
  program
    .name('sleep-catcher')
    .description('Find the hard-coded waits that make your tests slow & flaky.')
    .version(getVersion(), '-v, --version')
    .argument('<dir>', 'directory to scan for hard waits')
    .option('--json', 'output findings as JSON')
    .option('--ignore <glob...>', 'additional glob pattern(s) to ignore')
    .showHelpAfterError()
    .action(async (dir: string, options: CliOptions) => {
      const result = await scanDir(dir, { ignore: options.ignore });
      const output = options.json ? formatJson(result) : formatTable(result);
      console.log(output);
      exitCode = result.findings.length > 0 ? 1 : 0;
    });

  await program.parseAsync(argv);
  return exitCode;
}

/** Only auto-run when executed directly (not when imported, e.g. by tests). */
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  run()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 2;
    });
}
