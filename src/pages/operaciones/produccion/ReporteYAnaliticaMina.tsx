import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useCompany } from '../../../contexts/CompanyContext';
import { 
  TrendingUp, Calendar, BarChart3, 
  Activity, Users, Map, CheckCircle2, ChevronRight, Calculator
} from 'lucide-react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ProcessedRow {
  dia: number;
  mes: string;
  supervisor: string;
  supervisor_noche: string;
  produccion_dia: number;
  produccion_noche: number;
  total_imperia: number;
  total_cmc: number;
  diferencia: number;
}

export default function ReporteYAnaliticaMina() {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProcessedRow[]>([]);

  // Filters
  const [filtroMes, setFiltroMes] = useState<string>('');

  const availableMonths = useMemo(() => {
    return Array.from(new Set(data.map(d => d.mes))).sort((a: string, b: string) => b.localeCompare(a));
  }, [data]);

  useEffect(() => {
    if (availableMonths.length > 0 && !filtroMes) {
      setFiltroMes(availableMonths[0]);
    }
  }, [availableMonths, filtroMes]);

  useEffect(() => {
    fetchData();
  }, [currentCompany]);

  const fetchData = async () => {
    if (!currentCompany) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: records, error } = await supabase
        .from('produccion_mina_mensual')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .order('dia', { ascending: true });
        
      if (error && error.code !== '42P01') {
        console.error("Error fetching data:", error);
      }
      
      if (records) {
        console.log("Records fetched:", records.length);
        const loaded: ProcessedRow[] = records.map(r => ({
          dia: r.dia,
          mes: r.mes,
          supervisor: r.raw_data?.supervisor || '',
          supervisor_noche: r.raw_data?.supervisor_noche || '',
          produccion_dia: Number(r.raw_data?.produccion_dia) || 0,
          produccion_noche: Number(r.raw_data?.produccion_noche) || 0,
          total_imperia: Number(r.total_imperia) || 0,
          total_cmc: Number(r.total_cmc) || 0,
          diferencia: Number(r.diferencia) || 0,
        }));
        setData(loaded);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  const filteredData = useMemo(() => {
    if (!filtroMes) return [];
    return data.filter(d => d.mes === filtroMes);
  }, [data, filtroMes]);

  console.log("Filtered Data:", filteredData.length, "filtroMes:", filtroMes, "total data:", data.length);
  const { supervisorData, chartData, totalImperia, totalCMC, totalDiferencia } = useMemo(() => {
    let tImperia = 0;
    let tCMC = 0;
    let tDif = 0;
    const supMap: Record<string, number> = {};
    const cData: any[] = [];

    filteredData.forEach(d => {
      tImperia += d.total_imperia;
      tCMC += d.total_cmc;
      tDif += d.diferencia;

      // Supervisors
      if (d.supervisor) supMap[d.supervisor] = (supMap[d.supervisor] || 0) + d.produccion_dia;
      if (d.supervisor_noche) supMap[d.supervisor_noche] = (supMap[d.supervisor_noche] || 0) + d.produccion_noche;

      // Chart
      cData.push({
        name: `Día ${d.dia}`,
        Imperia: d.total_imperia,
        CMC: d.total_cmc,
        Diferencia: d.diferencia
      });
    });

    const sData = Object.entries(supMap)
      .map(([name, ton]) => ({ name, ton }))
      .sort((a, b) => b.ton - a.ton);

    console.log("FilteredData length:", filteredData.length, "tImperia:", tImperia);
    return { 
      supervisorData: sData, 
      chartData: cData,
      totalImperia: tImperia,
      totalCMC: tCMC,
      totalDiferencia: tDif
    };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-slate-400" />
          <select 
            className="border-none bg-transparent text-sm font-medium focus:ring-0 cursor-pointer dark:text-white"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
          >
            {availableMonths.map(month => {
              const [year, m] = month.split('-');
              const date = new Date(parseInt(year), parseInt(m) - 1, 1);
              const monthName = date.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
              return (
                <option key={month} value={month}>
                  {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Imperia</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatNumber(totalImperia)} <span className="text-sm font-normal text-slate-500">Ton</span></p>
          </div>
          <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
            <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total CMC</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatNumber(totalCMC)} <span className="text-sm font-normal text-slate-500">Ton</span></p>
          </div>
          <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Diferencia</p>
            <p className={`text-2xl font-bold mt-1 ${totalDiferencia >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {totalDiferencia > 0 ? '+' : ''}{formatNumber(totalDiferencia)} <span className="text-sm font-normal opacity-70">Ton</span>
            </p>
          </div>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${totalDiferencia >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <Calculator className={`h-6 w-6 ${totalDiferencia >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Producción y Conciliación por Día</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <RechartsTooltip 
                  formatter={(value: any) => formatNumber(Number(value)) + ' T'}
                  contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="CMC" name="Prod. CMC" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="left" dataKey="Imperia" name="Prod. Imperia" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="Diferencia" name="Diferencia" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Top Supervisores (Toneladas)</h3>
          <div className="space-y-5">
            {supervisorData.map((sup, idx) => {
              const max = supervisorData[0]?.ton || 1;
              const pct = (sup.ton / max) * 100;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {sup.name || 'Sin Supervisor'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatNumber(sup.ton)} T</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              )
            })}
            {supervisorData.length === 0 && <p className="text-sm text-slate-500">No hay datos de supervisores.</p>}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Historial de Conciliaciones</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Día / Mes</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Supervisores</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Imperia</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">CMC</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                    {row.dia} - {row.mes}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex flex-col">
                      <span><span className="text-xs text-slate-400">Día:</span> {row.supervisor || '-'}</span>
                      <span><span className="text-xs text-slate-400">Noche:</span> {row.supervisor_noche || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-indigo-600 dark:text-indigo-400">{formatNumber(row.total_imperia)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-slate-600 dark:text-slate-400">{formatNumber(row.total_cmc)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                      row.diferencia > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                      row.diferencia < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {row.diferencia > 0 ? '+' : ''}{formatNumber(row.diferencia)}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No hay conciliaciones registradas para este periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
