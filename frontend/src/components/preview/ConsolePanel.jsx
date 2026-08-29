import { useEffect, useRef } from 'react';

const TYPE_STYLES = {
  log: 'text-slate-200',
  info: 'text-sky-300',
  warn: 'text-amber-300',
  error: 'text-red-400'
};

export default function ConsolePanel({ logs, onClear }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [logs]);

  return (
    <div className="h-full w-full flex flex-col bg-slate-900">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700 flex-shrink-0">
        <span className="text-xs text-slate-400">
          {logs.length === 0
            ? 'No output yet'
            : `${logs.length} message${logs.length === 1 ? '' : 's'}`}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-xs px-3 py-2 space-y-1">
        {logs.map((entry, index) => (
          <div
            key={index}
            className={`whitespace-pre-wrap break-words ${TYPE_STYLES[entry.type] || TYPE_STYLES.log}`}
          >
            <span className="text-slate-600 select-none">&gt;</span> {entry.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
