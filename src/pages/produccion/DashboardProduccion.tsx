import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mountain, Settings, Warehouse, Truck, ArrowUpCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export default function DashboardProduccion() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    minaHoy: 0,
    minaMes: 0,
    transporteHoy: 0,
    transporteMes: 0,
  });

  const [metas, setMetas] = useState({
    daily: 5000,
    monthly: 75000
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
      const { data: transporteData } = await supabase
        .from('produccion_registro_diario')
        .select('fecha, tonelaje');

      let minaHoy = 0;
      let minaMes = 0;
      let transporteHoy = 0;
      let transporteMes = 0;

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
          const ton = row.tonelaje || 0;
          if (row.fecha === hoyStr) transporteHoy += ton;
          if (row.fecha.startsWith(mesActualStr)) transporteMes += ton;
        });
      }

      setStats({
        minaHoy,
        minaMes,
        transporteHoy,
        transporteMes
      });
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

  const metaDiariaPercentMina = Math.min((stats.minaHoy / metas.daily) * 100, 100).toFixed(1);
  const metaDiariaPercentTransporte = Math.min((stats.transporteHoy / metas.daily) * 100, 100).toFixed(1);
  const stockEstimado = Math.max(0, stats.minaMes - stats.transporteMes);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Extraído */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-sm dark:shadow-lg transition-colors">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Extracción Mina (Hoy)</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.minaHoy.toLocaleString(undefined, { maximumFractionDigits: 2 })} T</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
              <ArrowUpCircle className="w-3 h-3" /> {metaDiariaPercentMina}% de la meta ({metas.daily} T)
            </p>
          </div>
          <div className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg"><Mountain className="w-6 h-6" /></div>
        </div>

        {/* KPI Molienda */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-sm dark:shadow-lg transition-colors">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Extracción Mina (Mes)</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.minaMes.toLocaleString(undefined, { maximumFractionDigits: 2 })} T</h3>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold flex items-center gap-1">
              Acumulado del mes actual
            </p>
          </div>
          <div className="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-lg"><Mountain className="w-6 h-6" /></div>
        </div>

        {/* KPI Canchas de Acopio */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-sm dark:shadow-lg transition-colors">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Stock Estimado (Mes)</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stockEstimado.toLocaleString(undefined, { maximumFractionDigits: 2 })} T</h3>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold flex items-center gap-1">
              <Warehouse className="w-3 h-3" /> Diferencia Mina - Transporte
            </p>
          </div>
          <div className="bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-lg"><Warehouse className="w-6 h-6" /></div>
        </div>

        {/* KPI Transporte a Puerto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-sm dark:shadow-lg transition-colors">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Transporte Puerto (Hoy)</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.transporteHoy.toLocaleString(undefined, { maximumFractionDigits: 2 })} T</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
              <ArrowUpCircle className="w-3 h-3" /> {metaDiariaPercentTransporte}% de la meta ({metas.daily} T)
            </p>
          </div>
          <div className="bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3 rounded-lg"><Truck className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Resumen Mensual</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-600 dark:text-slate-400">Progreso Mina (Mensual)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{((stats.minaMes / metas.monthly) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((stats.minaMes / metas.monthly) * 100, 100)}%` }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-1 text-right">{stats.minaMes.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {metas.monthly.toLocaleString()} T</p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-600 dark:text-slate-400">Progreso Transporte (Mensual)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{((stats.transporteMes / metas.monthly) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-rose-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((stats.transporteMes / metas.monthly) * 100, 100)}%` }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-1 text-right">{stats.transporteMes.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {metas.monthly.toLocaleString()} T</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Configurar Metas</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meta Diaria (Toneladas)</label>
              <input 
                type="number" 
                value={metas.daily}
                onChange={(e) => setMetas({...metas, daily: Number(e.target.value)})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-900 dark:text-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Meta Mensual (Toneladas)</label>
              <input 
                type="number" 
                value={metas.monthly}
                onChange={(e) => setMetas({...metas, monthly: Number(e.target.value)})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-900 dark:text-white" 
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
