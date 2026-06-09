import React from 'react';
import { useProduccion } from '../../contexts/ProduccionContext';
import KPIsResumen from '../operaciones/produccion/KPIsResumen';
import ConfiguracionMetas from '../operaciones/produccion/ConfiguracionMetas';

export default function DashboardProduccion() {
  const { stats, metas, setMetas } = useProduccion();

  return (
    <div className="space-y-6">
      <KPIsResumen stats={stats} metas={metas} />
      <ConfiguracionMetas metas={metas} setMetas={setMetas} stats={stats} />
    </div>
  );
}
