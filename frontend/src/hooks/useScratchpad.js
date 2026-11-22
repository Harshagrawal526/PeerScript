import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";

const STORAGE_KEY = "peerscript_scratchpad";
const SAVE_DELAY_MS = 500;

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { html: "", css: "", js: "" };
  } catch {
    return { html: "", css: "", js: "" };
  }
};

const saveToStorage = (ytexts) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        html: ytexts.html.toString(),
        css: ytexts.css.toString(),
        js: ytexts.js.toString(),
      }),
    );
  } catch {
    // localStorage full or unavailable — edits still work in memory
  }
};

// Sets up a local-only Y.Doc (no socket, no server) with localStorage persistence.
// Returns the same { ydoc, awareness, ytexts } shape as useCollab so the existing
// Editor, useLivePreview, etc. work without changes.
export const useScratchpad = () => {
  const [collab, setCollab] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);

    const ytexts = {
      html: ydoc.getText("html"),
      css: ydoc.getText("css"),
      js: ydoc.getText("js"),
    };

    // Seed the doc from localStorage
    const saved = loadFromStorage();
    ydoc.transact(() => {
      if (saved.html) ytexts.html.insert(0, saved.html);
      if (saved.css) ytexts.css.insert(0, saved.css);
      if (saved.js) ytexts.js.insert(0, saved.js);
    });

    // Persist on any change, debounced
    const onUpdate = () => {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveToStorage(ytexts), SAVE_DELAY_MS);
    };
    ydoc.on("update", onUpdate);

    setCollab({ ydoc, awareness, ytexts });

    return () => {
      clearTimeout(saveTimer.current);
      // Final save before unmount
      saveToStorage(ytexts);
      ydoc.off("update", onUpdate);
      awareness.destroy();
      ydoc.destroy();
      setCollab(null);
    };
  }, []);

  return collab;
};
