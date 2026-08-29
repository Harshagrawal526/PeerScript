import { useEffect, useState } from 'react';
import { buildPreviewDoc } from '../utils/previewDoc';

const REBUILD_DELAY_MS = 250;

// Mirrors the room's shared Y.Texts into React state and rebuilds the preview
// document from them.
//
// The rebuild is debounced because every rebuild reloads the iframe and re-runs
// the room's code. In a shared room the edits arrive from everyone at once, so
// the burst this smooths out is not just one person's typing.
export const useLivePreview = (collab, onRebuild) => {
  const [code, setCode] = useState({ html: '', css: '', js: '' });
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    if (!collab) return;

    const { ytexts } = collab;
    const sync = () =>
      setCode({
        html: ytexts.html.toString(),
        css: ytexts.css.toString(),
        js: ytexts.js.toString()
      });

    sync();
    ytexts.html.observe(sync);
    ytexts.css.observe(sync);
    ytexts.js.observe(sync);

    return () => {
      ytexts.html.unobserve(sync);
      ytexts.css.unobserve(sync);
      ytexts.js.unobserve(sync);
    };
  }, [collab]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onRebuild?.();
      setSrcDoc(buildPreviewDoc(code));
    }, REBUILD_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [code, onRebuild]);

  return { ...code, srcDoc };
};
