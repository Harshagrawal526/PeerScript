import { useCallback, useEffect, useState } from 'react';
import { PREVIEW_MESSAGE_SOURCE } from '../utils/consoleBridge';

// Only the newest entries are kept. A `for (;;) console.log(i)` in the preview
// would otherwise grow this array until the tab runs out of memory, which is
// exactly the kind of code someone tries in a scratch editor.
const MAX_LOGS = 500;

// Collects console output relayed by the preview iframe's bridge script.
export const usePreviewConsole = (iframeRef) => {
  const [logs, setLogs] = useState([]);

  const clearLogs = useCallback(() => setLogs([]), []);

  useEffect(() => {
    const handleMessage = (event) => {
      // The preview sandbox omits allow-same-origin, so event.origin is the
      // opaque "null" and proves nothing about the sender. Matching the source
      // window against our own frame is the check that actually holds: another
      // tab, frame or extension posting the same payload does not pass it.
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
