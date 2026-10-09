import { parseSync, visitorKeys } from 'oxc-parser';

import type { Comment, Program } from 'oxc-parser';

function sourceLocations(text: string): (offset: number) => { line: number; column: number } {
  const starts = [0];
  for (const match of text.matchAll(/\r\n|[\n\r\u2028\u2029]/gu)) {
    starts.push(match.index + match[0].length);
  }
  return (offset) => {
    let low = 0;
    let high = starts.length;
    while (low + 1 < high) {
      const middle = Math.floor((low + high) / 2);
      if ((starts[middle] ?? 0) <= offset) {
        low = middle;
      }
      else {
        high = middle;
      }
    }
    return { line: low + 1, column: offset - (starts[low] ?? 0) };
  };
}

function annotate(program: Program, comments: Comment[], location: ReturnType<typeof sourceLocations>): void {
  const pending: unknown[] = [program, ...comments];
  while (pending.length > 0) {
    const value = pending.pop();
    if (value === null || typeof value !== 'object') {
      continue;
    }
    const children: unknown[] = Object.values(value);
    pending.push(...children);
    if ('type' in value && 'start' in value && 'end' in value && typeof value.start === 'number' && typeof value.end === 'number') {
      Object.assign(value, { range: [value.start, value.end], loc: { start: location(value.start), end: location(value.end) } });
    }
  }
  Object.assign(program, { comments, tokens: [] });
}

/** Only for export-map inspection: no token, scope or general parser compatibility. */
export function createExportParser(): {
  programs: Map<string, Program>;
  parse: (text: string, options: { filePath: string }) => Program;
  parseForESLint: (text: string, options: { filePath: string }) => { ast: Program; visitorKeys: typeof visitorKeys };
} {
  const programs = new Map<string, Program>();
  function parse(text: string, options: { filePath: string }): Program {
    const result = parseSync(options.filePath, text, { range: true, preserveParens: false });
    const location = sourceLocations(text);
    const first = result.errors[0];
    if (first !== undefined) {
      const start = location(first.labels[0]?.start ?? 0);
      throw Object.assign(new SyntaxError(`${options.filePath}:${String(start.line)}:${String(start.column + 1)}: ${result.errors.map((error) => error.message).join('; ')}`), { lineNumber: start.line, column: start.column });
    }
    annotate(result.program, result.comments, location);
    programs.set(options.filePath, result.program);
    return result.program;
  }
  return { programs, parse, parseForESLint: (text, options) => ({ ast: parse(text, options), visitorKeys }) };
}
