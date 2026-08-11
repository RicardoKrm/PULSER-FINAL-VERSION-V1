const fs = require('fs');

const code = `import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { 
  TrendingUp, Calendar, Filter, User, Truck, BarChart3, 
  Activity, Users, Map, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function ReporteYAnaliticaMina() {
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<any[]>([]);

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
      const { data, error } = await supabase
        .from('produccion_registro_diario_mina')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .order('fecha', { ascending: true });
        
      if (error && error.code !== '42P01') {
        console.error("Error fetching data:", error);
      }
      
      if (data) {
        setRawData(data);
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

  // Build metrics
  const { totalToneladas, supervisorByDateShift, operadoresData, supervisorData, concilData, chartData } = useMemo(() => {
    let totTon = 0;
    const supByDate: Record<string, string> = {};
    const opMap: Record<string, number> = {};
    const supTonMap: Record<string, number> = {};
    const concilMap: Record<string, { supervisor: number, compania: number, dateStr: string }> = {};

    rawData.forEach(r => {
      const ton = Number(r.tonelaje) || 0;
      const dateShiftKey = \`\${r.fecha}-\${r.turno}\`;

      if (r.equipo === 'SUPERVISOR_TURNO') {
        supByDate[dateShiftKey] = r.operador;
      }
    });

    rawData.forEach(r => {
      const ton = Number(r.tonelaje) || 0;
      const dateShiftKey = \`\${r.fecha}-\${r.turno}\`;
      const sup = supByDate[dateShiftKey] || 'Sin Supervisor';

      if (r.equipo === 'REPORTE_COMPAÑIA') {
        if (!concilMap[dateShiftKey]) concilMap[dateShiftKey] = { supervisor: 0, compania: 0, dateStr: r.fecha };
        concilMap[dateShiftKey].compania += ton;
      } else if (r.equipo !== 'SUPERVISOR_TURNO') {
        if (!concilMap[dateShiftKey]) concilMap[dateShiftKey] = { supervisor: 0, compania: 0, dateStr: r.fecha };
        concilMap[dateShiftKey].supervisor += ton;
        
        totTon += ton;
        opMap[r.operador || 'Desconocido'] = (opMap[r.operador || 'Desconocido'] || 0) + ton;
        supTonMap[sup] = (supTonMap[sup] || 0) + ton;
      }
    });

    const opData = Object.entries(opMap)
      .map(([name, ton]) => ({ name, ton }))
      .sort((a,b) => b.ton - a.ton)
      .slice(0, 10);
      
    const supData = Object.entries(supTonMap)
      .map(([name, ton]) => ({ name, ton }))
      .sort((a,b) => b.ton - a.ton);

    const cDataList = Object.entries(concilMap).map(([key, vals]) => {
      const [y,m,d] = vals.dateStr.split('-');
      const turno = key.split('-')[3]; // Assuming key is YYYY-MM-DD-Turno
      return {
        key,
        fecha: vals.dateStr,
        turno,
        supervisor: vals.supervisor,
        compania: vals.compania,
        diferencia: vals.supervisor - vals.compania
      };
    }).sort((a,b) => a.key.localeCompare(b.key));
    
    // Build chart data
    const cChartData = cDataList.map(item => ({
      name: \`\${item.fecha} \${item.turno}\`,
      Supervisor: item.supervisor,
      Compañia: item.compania,
      Diferencia: item.diferencia
    }));

    return { 
      totalToneladas: totTon,
      supervisorByDateShift: supByDate,
      operadoresData: opData,
      supervisorData: supData,
      concilData: cDataList,
      chartData: cChartData
    };
  }, [rawData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Toneladas Mina</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatNumber(totalToneladas)} <span className="text-sm font-normal text-slate-500">Ton</span></p>
          </div>
          <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
            <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Operadores</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{operadoresData.length}</p>
          </div>
          <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Reportes Conciliados</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{concilData.length}</p>
          </div>
          <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Producción y Conciliación por Turno</h3>
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
                <Bar yAxisId="left" dataKey="Supervisor" name="Prod. Operadores" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="left" dataKey="Compañia" name="Prod. Compañía" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="Diferencia" name="Diferencia" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Producción por Supervisor</h3>
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
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: \`\${pct}%\` }}></div>
                    </div>
                  </div>
                )
              })}
              {supervisorData.length === 0 && <p className="text-sm text-slate-500">No hay datos de supervisores.</p>}
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Top Operadores (Toneladas)</h3>
            <div className="space-y-5">
              {operadoresData.map((op, idx) => {
                const max = operadoresData[0]?.ton || 1;
                const pct = (op.ton / max) * 100;
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {idx + 1}. {op.name || 'Desconocido'}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatNumber(op.ton)} T</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: \`\${pct}%\` }}></div>
                    </div>
                  </div>
                )
              })}
              {operadoresData.length === 0 && <p className="text-sm text-slate-500">No hay datos de operadores.</p>}
            </div>
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
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha - Turno</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Supervisor</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Compañía</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {concilData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                    {row.fecha} <span className="text-slate-400 text-xs ml-1 bg-slate-100 dark:bg-slate-700 px-1.5 rounded">{row.turno}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{formatNumber(row.supervisor)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-blue-600 dark:text-blue-400">{formatNumber(row.compania)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={\`inline-flex items-center px-2 py-1 rounded text-xs font-bold \${
                      row.diferencia > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                      row.diferencia < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }\`}>
                      {row.diferencia > 0 ? '+' : ''}{formatNumber(row.diferencia)}
                    </span>
                  </td>
                </tr>
              ))}
              {concilData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No hay conciliaciones registradas (Reporte Compañía vs Supervisor).
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
`;

fs.writeFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', code);
