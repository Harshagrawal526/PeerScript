import { useState } from 'react';
import ConsolePanel from './ConsolePanel';

const TABS = [
  { id: 'preview', label: 'Preview' },
  { id: 'console', label: 'Console' }
];

export default function OutputPanel({ srcDoc, iframeRef, logs, onClearLogs, height }) {
  const [activeTab, setActiveTab] = useState('preview');

  const errorCount = logs.filter((entry) => entry.type === 'error').length;

  return (
    <>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md flex-shrink-0 flex items-center px-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`text-sm font-semibold uppercase tracking-wider px-4 py-2 border-b-2 cursor-pointer transition-colors ${
              activeTab === tab.id
                ? 'border-white text-white'
                : 'border-transparent text-white/70 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.id === 'console' && errorCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-bold rounded-full bg-red-500 text-white align-middle">
                {errorCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Both panes stay mounted: unmounting the iframe would reload the
          preview and re-run the room's code every time the tab changes. */}
      <div className="relative bg-blue-50 overflow-hidden" style={{ height: `${height}%` }}>
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          title="output"
          sandbox="allow-scripts"
          className={`absolute inset-0 w-full h-full border-0 bg-white ${
            activeTab === 'preview' ? '' : 'invisible'
          }`}
        />
        <div className={`absolute inset-0 ${activeTab === 'console' ? '' : 'invisible'}`}>
          <ConsolePanel logs={logs} onClear={onClearLogs} />
        </div>
      </div>
    </>
  );
}
