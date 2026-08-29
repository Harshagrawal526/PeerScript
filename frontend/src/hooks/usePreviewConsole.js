import { useCallback, useEffect, useState } from 'react';
import { PREVIEW_MESSAGE_SOURCE } from '../utils/consoleBridge';

// Newest entries only: an unbounded log would let `for (;;) console.log(i)` in
// the preview exhaust the tab's memory.
const MAX_LOGS = 500;

// Collects console output relayed by the preview iframe's bridge script.
export const usePreviewConsole = (iframeRef) => {
  const [logs, setLogs] = useState([]);

  const clearLogs = useCallback(() => setLogs([]), []);

  useEffect(() => {
    const handleMessage = (event) => {
      // event.origin is the opaque "null" for this sandbox and proves nothing;
      // matching the sending window against our own frame is the real check.
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      if (event.data?.source !== PREVIEW_MESSAGE_SOURCE) return;

      setLogs((previous) => {
        const next = [...previous, { type: event.data.type, text: event.data.text }];
        return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
      });
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [iframeRef]);

  return { logs, clearLogs };
};
