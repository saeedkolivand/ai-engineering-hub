import React from 'react';

export const RightPanel: React.FC = () => {
  return (
    <aside className="w-80 bg-gray-100 border-l border-gray-200 overflow-y-auto p-4">
      {/* Placeholder for context-sensitive information */}
      <h2 className="font-semibold mb-2">Details</h2>
      <p className="text-sm text-gray-600">Select an item to view details.</p>
    </aside>
  );
};