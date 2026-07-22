import React, { useState } from 'react';
import { useProduccion } from '../../contexts/ProduccionContext';
import ReporteYAnaliticaMina from '../operaciones/produccion/ReporteYAnaliticaMina';
import ReporteDiarioMinaPanel from './ReporteDiarioMinaPanel';

export default function ReportesDiariosMinaPage() {
  const [activeTab, setActiveTab] = useState<'diario' | 'analitica'>('diario');

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('diario')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'diario'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Reportes Diarios Mina
        </button>
        <button
          onClick={() => setActiveTab('analitica')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'analitica'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Reporte y Analítica
        </button>
      </div>

      {activeTab === 'diario' ? (
        <ReporteDiarioMinaPanel />
      ) : (
        <ReporteYAnaliticaMina />
      )}
    </div>
  );
}
