// Prototype runner integration: reuse the existing rule without lint suppression.
export function checkDescriptions(parser, rule, filename, text) {
  const { ast } = parser.parseForESLint(text, { filePath: filename });
  const diagnostics = [];
  rule.create({
    options: [{
      ignore: ['eslint-enable', 'eslint', 'eslint-env', 'global', 'exported'],
      additionalDirectives: ['oxlint-disable', 'oxlint-disable-line', 'oxlint-disable-next-line'],
    }],
    sourceCode: { ast, getAllComments: () => ast.comments },
    report({ loc, messageId }) {
      diagnostics.push({
        code: 'preflight(require-description)',
        severity: 'error',
        filename,
        message: rule.meta.messages[messageId],
        // The provider's negative column intentionally bypasses ESLint suppression.
        // This independent check already bypasses suppression; emit a valid location.
        loc: { ...loc, start: { ...loc.start, column: Math.max(0, loc.start.column) } },
      });
    },
  });
  return diagnostics;
}
