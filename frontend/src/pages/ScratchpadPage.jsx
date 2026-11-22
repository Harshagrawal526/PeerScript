import React, { useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useScratchpad } from "../hooks/useScratchpad";
import { useLivePreview } from "../hooks/useLivePreview";
import { usePreviewConsole } from "../hooks/usePreviewConsole";
import { useDragResize } from "../hooks/useDragResize";
import Editor from "../components/editor/Editor";
import OutputPanel from "../components/preview/OutputPanel";
import Header from "../components/layout/Header";

function ScratchpadPage() {
  const { isAuthenticated } = useAuth();
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  const collab = useScratchpad();
  const { logs, clearLogs } = usePreviewConsole(iframeRef);
  const { html, css, js, srcDoc } = useLivePreview(collab, clearLogs);

  const measureEditorHeight = useCallback((event) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return ((event.clientY - rect.top) / rect.height) * 100;
  }, []);

  const { size: editorHeight, startResize } = useDragResize({
    initial: 50,
    min: 5,
    max: 95,
    measure: measureEditorHeight,
    bodyClass: "resizing",
  });

  const clearCode = () => {
    if (!collab) return;
    if (window.confirm("Clear all Scratchpad code? This only affects your local copy.")) {
      collab.ydoc.transact(() => {
        Object.values(collab.ytexts).forEach((ytext) => {
          ytext.delete(0, ytext.length);
        });
      });
    }
  };

  const outputHeight = 100 - editorHeight;

  return (
    <div className="h-screen flex flex-col bg-blue-50">
      <Header />

      {/* Scratchpad top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">🧪 Scratchpad</span>
          <span className="text-green-200 text-xs">Saved locally in your browser</span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => alert("Save to room — coming soon!")}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
            >
              💾 Save to new room
            </button>
          ) : (
            <Link
              to="/login"
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              Log in to save as a room →
            </Link>
          )}
          <button
            type="button"
            onClick={clearCode}
            className="text-xs bg-red-500/70 hover:bg-red-500 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Editor + preview */}
      <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex bg-blue-100/50 border-b-2 border-blue-200 overflow-hidden"
          style={{ height: `${editorHeight}%` }}
        >
          <Editor language="html" ytext={collab?.ytexts.html} awareness={collab?.awareness} />
          <Editor language="css"  ytext={collab?.ytexts.css}  awareness={collab?.awareness} />
          <Editor language="js"   ytext={collab?.ytexts.js}   awareness={collab?.awareness} />
        </div>

        <div
          onMouseDown={startResize}
          className="resize-handle h-1.5 bg-gradient-to-r from-green-500 to-emerald-600 cursor-ns-resize hover:h-2.5 transition-all relative flex-shrink-0 group"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-1 bg-white/60 rounded-full group-hover:bg-white/80 transition-colors" />
          </div>
        </div>

        <OutputPanel
          srcDoc={srcDoc}
          iframeRef={iframeRef}
          logs={logs}
          onClearLogs={clearLogs}
          height={outputHeight}
        />
      </div>
    </div>
  );
}

export default ScratchpadPage;
