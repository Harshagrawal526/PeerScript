import { useCallback, useEffect, useRef, useState } from 'react';

const resolve = (bound) => (typeof bound === 'function' ? bound() : bound);

// Shared mechanics for a drag-to-resize handle: the drag lifecycle, the
// document-level listeners that keep the drag alive once the pointer leaves the
// handle, the body class that suppresses selection and stops iframes below
// swallowing the events, and coalescing pointer moves into one animation frame
// so a fast drag costs one layout pass per frame rather than one per event.
//
// What differs between handles is only the measurement, so callers supply
// `measure` to turn a mousemove into a size in whatever unit suits them -- a
// percentage of a container, a pixel width off the viewport edge -- and the
// bounds to clamp it to. Bounds may be functions when they depend on the
// viewport. Returning null from `measure` skips the frame.
export const useDragResize = ({ initial, min, max, measure, bodyClass }) => {
  const [size, setSize] = useState(initial);
  const [isResizing, setIsResizing] = useState(false);
  const frameRef = useRef(null);
  const measureRef = useRef(measure);

  // Kept in a ref so an inline measure function does not tear down and
  // re-attach the listeners on every render.
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
