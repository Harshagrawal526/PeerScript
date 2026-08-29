import { useCallback, useEffect, useRef, useState } from 'react';

const resolve = (bound) => (typeof bound === 'function' ? bound() : bound);

// Drag lifecycle, document-level listeners and animation-frame coalescing for a
// resize handle. Only the measurement differs between handles, so callers pass
// `measure` (return null to skip a frame) and bounds, which may be functions
// when they depend on the viewport.
export const useDragResize = ({ initial, min, max, measure, bodyClass }) => {
  const [size, setSize] = useState(initial);
  const [isResizing, setIsResizing] = useState(false);
  const frameRef = useRef(null);
  const measureRef = useRef(measure);

  // In a ref so an inline measure function does not re-attach the listeners.
  useEffect(() => {
    measureRef.current = measure;
  });

  const handleMouseMove = useCallback(
    (event) => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);

      frameRef.current = requestAnimationFrame(() => {
        const measured = measureRef.current(event);
        if (measured === null || measured === undefined) return;
        setSize(Math.min(resolve(max), Math.max(resolve(min), measured)));
      });
    },
    [min, max]
  );

  const startResize = useCallback((event) => {
    event.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const stopResize = () => setIsResizing(false);

    // The class is not cosmetic: its pointer-events rule is what stops the
    // preview iframe swallowing the mousemove events this drag needs.
    document.body.classList.add(bodyClass);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResize);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResize);
      document.body.classList.remove(bodyClass);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isResizing, handleMouseMove, bodyClass]);

  return { size, isResizing, startResize };
};
