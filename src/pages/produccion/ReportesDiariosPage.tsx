import React from 'react';
import { useProduccion } from '../../contexts/ProduccionContext';
import ReporteYAnalitica from '../operaciones/produccion/ReporteYAnalitica';

export default function ReportesDiariosPage() {
  const { stats, handleReporteProduccion, handleReporteTransporte } = useProduccion();

  return (
    <div className="space-y-6">
      <ReporteYAnalitica 
        stats={stats} 
        onReporteProduccion={handleReporteProduccion}
        onReporteTransporte={handleReporteTransporte}
      />
    </div>
  );
}
