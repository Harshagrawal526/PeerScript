import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_HEIGHT = 5;
const MAX_HEIGHT = 95;

// Drag-to-resize for a vertical split, expressed as the top pane's percentage
// of the container. Pointer moves are coalesced into a single animation frame,
// so a fast drag triggers one layout pass per frame rather than one per event.
export const useResizablePane = (initialHeight = 50) => {
  const [paneHeight, setPaneHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);
  const frameRef = useRef(null);

  const handleMouseMove = useCallback((event) => {
    if (!containerRef.current) return;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    frameRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = ((event.clientY - rect.top) / rect.height) * 100;
      setPaneHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, ratio)));
    });
  }, []);

  const startResize = useCallback((event) => {
    event.preventDefault();
    setIsResizing(true);
  }, []);

  // Listeners live on document, not the handle, so the drag survives the
  // pointer moving off the handle. Callers still have to keep the pointer out
  // of any iframe below, which consumes the events before they reach us --
  // isResizing is returned for exactly that.
  useEffect(() => {
    if (!isResizing) return;

    const stopResize = () => setIsResizing(false);

    document.body.classList.add('resizing');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResize);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResize);
      document.body.classList.remove('resizing');
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isResizing, handleMouseMove]);

  return { containerRef, paneHeight, isResizing, startResize };
};
