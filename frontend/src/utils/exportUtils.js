import { LANGUAGES } from './languages';
import { escapeClosingTags, indentLines } from './html';

const DEFAULT_FILENAME = 'peerscript-export.html';

const buildDocument = ({ html, css, js }) => {
  const head = css ? `\n  <style>\n${indentLines(escapeClosingTags(css), 4)}\n  </style>` : '';
  const body = html ? `\n${indentLines(html, 2)}` : '';
  const script = js ? `\n  <script>\n${indentLines(escapeClosingTags(js), 4)}\n  </script>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PeerScript Export</title>${head}
</head>
<body>${body}${script}
</body>
</html>`;
};

export const exportAsHTML = (html, css, js, filename = DEFAULT_FILENAME) => {
  if (!html.trim() && !css.trim() && !js.trim()) {
    return { success: false, message: 'Cannot export empty code. Please write some code first.' };
  }

  try {
    // The same formatter the editor's Format action uses.
    const document = buildDocument({
      html: html.trim() ? LANGUAGES.html.format(html) : '',
      css: css.trim() ? LANGUAGES.css.format(css) : '',
      js: js.trim() ? LANGUAGES.js.format(js) : ''
    });

    const url = URL.createObjectURL(new Blob([document], { type: 'text/html' }));
    const link = window.document.createElement('a');
    link.href = url;
    link.download = filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: 'Code exported successfully!' };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: 'Failed to export code. Please try again.' };
  }
};
