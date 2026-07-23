import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';
import KPIsResumen from '../operaciones/produccion/KPIsResumen';
import ConfiguracionMetas from '../operaciones/produccion/ConfiguracionMetas';
import { GlobalStats, MetasObjetivos } from '../../contexts/ProduccionContext';

export default function DashboardProduccion() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GlobalStats>({
    rajoTotal: 0,
    millingTotal: 0,
    stockpile: 0,
    transported: 0,
    transporteTotal: 0,
    dispatchesCount: 0,
    arrivedCount: 0,
    inTransitCount: 0,
    alertsCount: 0,
  });

  const [metas, setMetas] = useState<MetasObjetivos>({
    daily: 5000,
    weekly: 18000,
    monthly: 75000,
    minaDaily: 5000,
    minaMonthly: 75000,
    transporteDaily: 5000,
    transporteMonthly: 75000
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const hoy = new Date();
      const mesActualStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
      const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

      // Fetch Mina
      const { data: minaData } = await supabase
        .from('produccion_registro_diario_mina')
        .select('fecha, tonelaje');

      // Fetch Transporte
      const { data: transporteData, error: transporteError } = await supabase
        .from('produccion_registro_diario')
        .select('fecha, tonelaje');

      let minaHoy = 0;
      let minaMes = 0;
      let transporteHoy = 0;
      let transporteMes = 0;
      let alertasHoy = 0;

      if (minaData) {
        minaData.forEach(row => {
          if (!row.fecha) return;
          const ton = row.tonelaje || 0;
          if (row.fecha === hoyStr) minaHoy += ton;
          if (row.fecha.startsWith(mesActualStr)) minaMes += ton;
        });
      }

      if (transporteData) {
        transporteData.forEach(row => {
          if (!row.fecha) return;
          const ton = Number(row.tonelaje) || 0;
          const rowFechaStr = String(row.fecha).split('T')[0].split(' ')[0]; // Ensure just YYYY-MM-DD
          if (rowFechaStr === hoyStr) {
            transporteHoy += ton;
          }
          if (rowFechaStr.startsWith(mesActualStr)) transporteMes += ton;
        });
      }

      setStats(prev => ({
        ...prev,
        rajoTotal: minaHoy,
        millingTotal: minaMes,
        transported: transporteHoy,
        transporteTotal: transporteMes,
        stockpile: Math.max(0, minaMes - transporteMes),
        alertsCount: alertasHoy
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <KPIsResumen stats={stats} metas={metas} />
      <ConfiguracionMetas metas={metas} setMetas={setMetas} stats={stats} />
    </div>
  );
}
