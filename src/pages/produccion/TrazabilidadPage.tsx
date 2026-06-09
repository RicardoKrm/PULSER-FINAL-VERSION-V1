import React from 'react';
import { useProduccion } from '../../contexts/ProduccionContext';
import HistorialTrazabilidad from '../operaciones/produccion/HistorialTrazabilidad';

export default function TrazabilidadPage() {
  const { history } = useProduccion();

  return (
    <div className="space-y-6">
      <HistorialTrazabilidad history={history} />
    </div>
  );
}
