// A literal `</script>` or `</style>` in user code would close the surrounding
// tag early and tear the rest of the document into text. Escaping the slash
// hides it from the HTML tokenizer without changing the JS or CSS value.
export const escapeClosingTags = (code) => code.replace(/<\/(script|style)/gi, '<\\/$1');

// Indents every non-empty line, for embedding a formatted block inside markup.
export const indentLines = (code, spaces) => {
  const padding = ' '.repeat(spaces);
  return code
    .split('\n')
    .map((line) => (line.trim() ? padding + line : line))
    .join('\n');
};
