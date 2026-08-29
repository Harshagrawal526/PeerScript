import beautify from 'js-beautify';

const BEAUTIFY_OPTIONS = {
  indent_size: 2,
  indent_char: ' ',
  max_preserve_newlines: 2,
  preserve_newlines: true,
  indent_inner_html: true,
  end_with_newline: false,
  wrap_line_length: 0
};

// One entry per editor pane. Behaviour used to be dispatched on the visible
// label, so renaming a pane in the UI would have quietly broken formatting and
// downloads; everything is keyed on the language id instead.
export const LANGUAGES = {
  html: {
    label: 'HTML',
    extension: 'html',
    mimeType: 'text/html',
    format: (code) => beautify.html(code, BEAUTIFY_OPTIONS)
  },
  css: {
    label: 'CSS',
    extension: 'css',
    mimeType: 'text/css',
    format: (code) => beautify.css(code, BEAUTIFY_OPTIONS)
  },
  js: {
    label: 'JS',
    extension: 'js',
    mimeType: 'text/javascript',
    format: (code) => beautify.js(code, BEAUTIFY_OPTIONS)
  }
};
