// Builds the srcDoc for the sandboxed preview iframe.
import { consoleBridge } from './consoleBridge';

// The room's code is interpolated straight into markup, so a literal
// `</script>` or `</style>` anywhere in the JS or CSS would close the
// surrounding tag early and tear the rest of the document into plain text.
// Escaping the slash leaves the value unchanged for the JS and CSS parsers
// while hiding the sequence from the HTML tokenizer.
const escapeClosingTags = (code) => code.replace(/<\/(script|style)/gi, '<\\/$1');

// The bridge goes first so it is installed before any inline script in the
// room's HTML runs, not just before the JS pane.
export const buildPreviewDoc = ({ html, css, js }) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    ${consoleBridge}
    <style>${escapeClosingTags(css)}</style>
  </head>
  <body>
${html}
    <script>${escapeClosingTags(js)}</script>
  </body>
</html>`;
