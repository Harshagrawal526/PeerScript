// Format HTML code with proper indentation
const formatHTML = (html) => {
  let formatted = '';
  let indent = 0;
  const tab = '  '; // 2 spaces

  html.split(/>\s*</).forEach((node) => {
    if (node.match(/^\/\w/)) indent--; // closing tag
    formatted += tab.repeat(indent) + '<' + node + '>\n';
    if (node.match(/^<?\w[^>]*[^\/]$/)) indent++; // opening tag
  });

  return formatted.substring(1, formatted.length - 2);
};

// Format CSS code with proper indentation
const formatCSS = (css) => {
  return css
    .replace(/\s*{\s*/g, ' {\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\s*}\s*/g, '\n}\n\n')
    .trim();
};

// Format JavaScript code with basic indentation
const formatJS = (js) => {
  let formatted = '';
  let indent = 0;
  const tab = '  ';

  js.split('\n').forEach((line) => {
    line = line.trim();
    if (line.match(/^}/)) indent--;
    formatted += tab.repeat(indent) + line + '\n';
    if (line.match(/{$/)) indent++;
  });

  return formatted.trim();
};

// Check if code is empty
const isCodeEmpty = (html, css, js) => {
  return !html.trim() && !css.trim() && !js.trim();
};

// Export code as a single HTML file
export const exportAsHTML = (html, css, js, filename = 'code-canvas-export.html') => {
  // Check if all code is empty
  if (isCodeEmpty(html, css, js)) {
    return { success: false, message: 'Cannot export empty code. Please write some code first.' };
  }

  try {
    // Format the code
    const formattedHTML = html.trim() ? formatHTML(html) : '';
    const formattedCSS = css.trim() ? formatCSS(css) : '';
    const formattedJS = js.trim() ? formatJS(js) : '';

    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PeerScript Export</title>
  ${formattedCSS ? `<style>\n    ${formattedCSS.split('\n').join('\n    ')}\n  </style>` : ''}
</head>
<body>
  ${formattedHTML ? formattedHTML.split('\n').join('\n  ') : ''}
  ${formattedJS ? `<script>\n    ${formattedJS.split('\n').join('\n    ')}\n  </script>` : ''}
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, message: 'Code exported successfully!' };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: 'Failed to export code. Please try again.' };
  }
};