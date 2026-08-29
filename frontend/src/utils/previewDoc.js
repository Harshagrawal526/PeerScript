// Builds the srcDoc for the sandboxed preview iframe.
import { consoleBridge } from './consoleBridge';
import { escapeClosingTags } from './html';

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
