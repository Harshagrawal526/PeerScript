// User code gets interpolated into markup in two places -- the live preview and
// the exported file -- and in both a literal `</script>` or `</style>` would
// close the surrounding tag early and tear the rest of the document into text.
// Escaping the slash hides the sequence from the HTML tokenizer while leaving
// the value unchanged for the JS and CSS parsers.
export const escapeClosingTags = (code) => code.replace(/<\/(script|style)/gi, '<\\/$1');

// Indents every non-empty line, for embedding a formatted block inside markup.
export const indentLines = (code, spaces) => {
  const padding = ' '.repeat(spaces);
  return code
    .split('\n')
    .map((line) => (line.trim() ? padding + line : line))
    .join('\n');
};
