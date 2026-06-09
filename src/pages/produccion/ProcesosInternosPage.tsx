import React from 'react';
import { useProduccion } from '../../contexts/ProduccionContext';
import ProcesosInternos from '../operaciones/produccion/ProcesosInternos';

export default function ProcesosInternosPage() {
  const { stats } = useProduccion();

  return (
    <div className="space-y-6">
      <ProcesosInternos stats={stats} />
    </div>
  );
}
