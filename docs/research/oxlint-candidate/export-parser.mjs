// Bounded import-x/export graph adapter, not a general ESLint parser.
export function createExportParser(parseSync, visitorKeys) {
  const programs = new Map();
  function parseForESLint(text, options) {
    const result = parseSync(options.filePath, text, { range: true, preserveParens: false });
    if (result.errors.length) {
      throw new SyntaxError(result.errors.map((error) => error.message).join('\n'));
    }
    const starts = [0];
    for (const match of text.matchAll(/\r\n|[\n\r\u2028\u2029]/gu)) {
      starts.push(match.index + match[0].length);
    }
    function location(offset) {
      let line = 0;
      while (line + 1 < starts.length && starts[line + 1] <= offset) {
        line++;
      }
      return { line: line + 1, column: offset - starts[line] };
    }
    function annotate(value) {
      if (!value || typeof value !== 'object') {
        return;
      }
      for (const child of Object.values(value)) {
        annotate(child);
      }
      if (typeof value.type === 'string' && Number.isInteger(value.start) && Number.isInteger(value.end)) {
        value.range = [value.start, value.end];
        value.loc = { start: location(value.start), end: location(value.end) };
      }
    }
    annotate(result.program);
    annotate(result.comments);
    result.program.comments = result.comments;
    // Export-name traversal needs SourceCode but does not consume a token stream.
    result.program.tokens = [];
    programs.set(options.filePath, result.program);
    return { ast: result.program, visitorKeys };
  }
  return { programs, parseForESLint, parse: (text, options) => parseForESLint(text, options).ast };
}
