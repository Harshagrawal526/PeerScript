import React from "react";
import Header from "../components/layout/Header";

// Phase 2 will wire up the editor, localStorage persistence, and preview.
function ScratchpadPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Scratchpad coming soon.</p>
      </main>
    </div>
  );
}

export default ScratchpadPage;
