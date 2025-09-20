import React from 'react';

const FilterPanel: React.FC = () => {
  return (
    <div className="flex gap-4 items-center">
      <input
        type="text"
        placeholder="Buscar..."
        className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-300"
        style={{ minWidth: 200 }}
      />
      <select className="border rounded px-3 py-2 text-sm">
        <option value="">Todas as Fases</option>
        {/* Add dynamic options here */}
      </select>
    </div>
  );
};

export default React.memo(FilterPanel);