import { parse, type ParserPlugin } from '@babel/parser';
import type * as t from '@babel/types';
import { RULES } from './rules.js';
import type { Finding, RuleId } from './types.js';

const SKIP_KEYS = new Set([
  'loc',
  'start',
  'end',
  'range',
  'leadingComments',
  'trailingComments',
  'innerComments',
  'comments',
  'tokens',
  'extra',
]);

const MAX_SNIPPET_LENGTH = 80;

/** Decide which Babel plugins to enable based on the file extension. */
function pluginsFor(filePath: string): ParserPlugin[] {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.tsx')) return ['typescript', 'jsx'];
  if (lower.endsWith('.ts') || lower.endsWith('.mts') || lower.endsWith('.cts')) {
    return ['typescript'];
  }
  // Plain JS / JSX — allow JSX everywhere, it never hurts.
  return ['jsx'];
}

function isNode(value: unknown): value is t.Node {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string'
  );
}

/** Depth-first walk over the AST, visiting every node exactly once. */
function walk(node: t.Node, visit: (node: t.Node) => void): void {
  visit(node);
  for (const key of Object.keys(node)) {
    if (SKIP_KEYS.has(key)) continue;
    const value = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (isNode(child)) walk(child, visit);
      }
    } else if (isNode(value)) {
      walk(value, visit);
    }
  }
}

const isNumeric = (arg: t.Node | undefined): boolean => arg?.type === 'NumericLiteral';
const isIdentifier = (arg: t.Node | undefined): boolean => arg?.type === 'Identifier';
/** A numeric literal or a variable reference — both represent a real delay value. */
const isDelayValue = (arg: t.Node | undefined): boolean => isNumeric(arg) || isIdentifier(arg);

/**
 * `setTimeout` is only a smell when it is used as a bare delay, i.e.
 *   `setTimeout(resolve, ms)`  (resolving a promise)  or
 *   `setTimeout(() => {}, ms)` (empty callback).
 * Real scheduling like `setTimeout(() => doWork(), ms)` is left alone.
 */
function isBareDelay(args: Array<t.Node>): boolean {
  const callback = args[0];
  if (!callback) return false;
  if (callback.type === 'Identifier') return true;
  if (callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression') {
    return callback.body.type === 'BlockStatement' && callback.body.body.length === 0;
  }
  return false;
}

function snippet(code: string, node: t.Node): string {
  const start = node.start ?? 0;
  const end = node.end ?? start;
  const raw = code.slice(start, end).replace(/\s+/g, ' ').trim();
  return raw.length > MAX_SNIPPET_LENGTH ? `${raw.slice(0, MAX_SNIPPET_LENGTH - 1)}…` : raw;
}

function toFinding(ruleId: RuleId, node: t.Node, code: string, file: string): Finding {
  const rule = RULES[ruleId];
  return {
    file,
    line: node.loc?.start.line ?? 0,
    column: (node.loc?.start.column ?? 0) + 1,
    rule: rule.id,
    severity: rule.severity,
    code: snippet(code, node),
    suggestion: rule.suggestion,
  };
}

/** Match a single call expression against every rule. Returns a rule id or null. */
function matchCall(node: t.CallExpression): RuleId | null {
  const callee = node.callee;
  const args = node.arguments as t.Node[];
  const first = args[0];

  if (callee.type === 'Identifier') {
    if (callee.name === 'sleep' && isDelayValue(first)) return 'sleep';
    if (callee.name === 'setTimeout' && isBareDelay(args)) return 'setTimeout';
    return null;
  }

  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
    const method = callee.property.name;
    const objectName = callee.object.type === 'Identifier' ? callee.object.name : null;

    if (method === 'waitForTimeout' && isNumeric(first)) return 'waitForTimeout';
    // cy.wait(500) is a smell; cy.wait('@alias') is fine — so require a numeric arg.
    if (method === 'wait' && objectName === 'cy' && isNumeric(first)) return 'cyWait';
    // require a delay value so `video.pause()` / `audio.pause()` are not flagged.
    if (method === 'sleep' && isDelayValue(first)) return 'driverSleep';
    if (method === 'pause' && isDelayValue(first)) return 'browserPause';
  }

  return null;
}

/**
 * Scan a single piece of source code for hard waits.
 *
 * Parsing with Babel means matches inside comments and string literals are
 * never reported — they simply do not produce call-expression AST nodes.
 *
 * @param code The source code to scan.
 * @param file A label for the file (used in the returned findings).
 */
export function scanCode(code: string, file: string): Finding[] {
  let ast: t.File;
  try {
    ast = parse(code, {
      sourceType: 'unambiguous',
      errorRecovery: true,
      plugins: pluginsFor(file),
    });
  } catch {
    // Unparseable file — skip rather than crash the whole scan.
    return [];
  }

  const findings: Finding[] = [];
  walk(ast.program, (node) => {
    if (node.type === 'CallExpression') {
      const ruleId = matchCall(node);
      if (ruleId) findings.push(toFinding(ruleId, node, code, file));
    }
  });
  return findings;
}
