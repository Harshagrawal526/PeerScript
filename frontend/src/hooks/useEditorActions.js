import { useCallback, useEffect, useRef, useState } from 'react';
import { LANGUAGES } from '../utils/languages';

const CONFIRMATION_MS = 2000;

// Copy, download and format for one editor pane, plus the transient status the
// toolbar flashes back. Only one confirmation can be showing at a time, so it
// is a single value rather than a flag per action.
export const useEditorActions = (ytext, language) => {
  const [status, setStatus] = useState(null);
  const timeoutRef = useRef(null);

  // Otherwise a pane unmounted within the confirmation window leaves a timer
  // holding a reference to it.
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const confirm = useCallback((next) => {
    setStatus(next);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setStatus(null), CONFIRMATION_MS);
  }, []);

  const getValue = useCallback(() => (ytext ? ytext.toString() : ''), [ytext]);

  const { label, extension, mimeType, format: formatCode } = LANGUAGES[language];

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getValue());
      confirm('copied');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [getValue, confirm]);

  const download = useCallback(() => {
    const value = getValue();
    if (!value.trim()) {
      alert(`Cannot download empty ${label} file`);
      return;
    }

    const url = URL.createObjectURL(new Blob([value], { type: mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `code.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    confirm('downloaded');
  }, [getValue, confirm, label, extension, mimeType]);

  const format = useCallback(() => {
    const value = getValue();
    if (!value.trim()) {
      alert(`Cannot format empty ${label} code`);
      return;
    }

    try {
      const formatted = formatCode(value);

      // Replace the shared text in one transaction so it syncs as a single edit
      ytext.doc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, formatted);
      });

      confirm('formatted');
    } catch (error) {
      alert(`Error formatting ${label}: ${error.message}`);
    }
  }, [getValue, confirm, label, formatCode, ytext]);

  return { status, copy, download, format };
};
