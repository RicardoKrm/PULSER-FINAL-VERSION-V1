import React, { useState } from 'react';
import { useProduccion } from '../../contexts/ProduccionContext';
import ReporteYAnalitica from '../operaciones/produccion/ReporteYAnalitica';
import ListaPorTurnos from './ListaPorTurnos';
import ReporteDiarioPanel from './ReporteDiarioPanel';

export default function ReportesDiariosPage() {
  const { stats, handleReporteProduccion, handleReporteTransporte } = useProduccion();
  const [activeTab, setActiveTab] = useState<'diario' | 'listas' | 'analitica'>('diario');

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
          Reportes Diarios Transporte
        </button>
        <button
          onClick={() => setActiveTab('listas')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'listas'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Lista por Turnos
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
        <ReporteDiarioPanel />
      ) : activeTab === 'listas' ? (
        <ListaPorTurnos />
      ) : (
        <ReporteYAnalitica 
          stats={stats} 
          onReporteProduccion={handleReporteProduccion}
          onReporteTransporte={handleReporteTransporte}
        />
      )}
    </div>
  );
}

