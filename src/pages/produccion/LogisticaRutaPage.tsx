import React from 'react';
import { useProduccion } from '../../contexts/ProduccionContext';
import LogisticaRuta from '../operaciones/produccion/LogisticaRuta';

export default function LogisticaRutaPage() {
  const { stats, trucks } = useProduccion();

  return (
    <div className="space-y-6">
      <LogisticaRuta stats={stats} trucks={trucks} />
    </div>
  );
}
