const fs = require('fs');

const content = `import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { Calendar, Database, CheckSquare, Search } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';

interface ProcessedRow {
  dia: number;
  supervisor: string;
  supervisor_noche: string;
  
  // Turno Día
  cantidad_caex_dia: number;
  caex_dia: number;
  operadores_dia: number;
  acopio_dia: number;
  caex_acopio_dia: number;
  planta_dia: number;
  caex_planta_dia: number;
  vueltas_dia: number;
  pases_cf_dia: number;
  pases_totales_dia: number;
  toneladas_caex_dia: number;
  equipo_cf_dia: string;
  produccion_dia: number;
  produccion_cmc_dia: number;
  traspasos_dia: number;

  // Turno Noche
  cantidad_caex_noche: number;
  caex_noche: number;
  operadores_noche: number;
  acopio_noche: number;
  caex_acopio_noche: number;
  planta_noche: number;
  caex_planta_noche: number;
  vueltas_noche: number;
  pases_cf_noche: number;
  pases_totales_noche: number;
  toneladas_caex_noche: number;
  equipo_cf_noche: string;
  produccion_caex_noche: number;
  produccion_noche: number;
  traspasos_noche: number;

  // Totales
  total_imperia: number;
  total_cmc: number;
  diferencia: number;
}

export default function ReporteDiarioMinaPanel() {
  const { currentCompany } = useCompany();
  const [data, setData] = useState<ProcessedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  useEffect(() => {
    if (currentCompany) {
      fetchMonths();
    }
  }, [currentCompany]);

  useEffect(() => {
    if (selectedMonth && currentCompany) {
      loadMonthData(selectedMonth);
    }
  }, [selectedMonth, currentCompany]);

  const fetchMonths = async () => {
    try {
      const { data, error } = await supabase
        .from('produccion_mina_mensual')
        .select('mes')
        .eq('empresa_id', currentCompany?.id);
      
      if (error) {
        if (error.code !== '42P01') console.error(error);
        return;
      }
      
      const months = Array.from(new Set(data.map(r => r.mes))).sort((a, b) => b.localeCompare(a));
      setAvailableMonths(months);
      if (months.length > 0) {
        setSelectedMonth(months[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadMonthData = async (mes: string) => {
    try {
      setLoading(true);
      const { data: records, error } = await supabase
        .from('produccion_mina_mensual')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('mes', mes)
        .order('dia', { ascending: true });

      if (error) throw error;

      if (records && records.length > 0) {
        const loaded: ProcessedRow[] = records.map(r => ({
          ...r.raw_data,
          supervisor_noche: r.raw_data?.supervisor_noche || r.raw_data?.dia_mes || r.dia_mes || '',
          total_imperia: r.total_imperia,
          total_cmc: r.total_cmc,
          diferencia: r.diferencia
        }));
        setData(loaded);
        if (loaded.length > 0) {
          setSelectedDate(loaded[0].dia);
        } else {
          setSelectedDate(null);
        }
      } else {
        setData([]);
        setSelectedDate(null);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatNum = (num: number) => new Intl.NumberFormat('es-CL').format(num);

  const activeRow = data.find(r => r.dia === selectedDate);
  const globalImperia = data.reduce((acc, curr) => acc + (curr.produccion_dia + curr.produccion_noche), 0);
  const globalCMC = data.reduce((acc, curr) => acc + (curr.produccion_cmc_dia + curr.total_cmc), 0); // Wait, CMC is just curr.total_cmc ? Usually it's in raw_data, wait, we can just sum producciones or take the max?
  // In PruebaMina, the sum is: 
  const sumImperia = data.reduce((acc, curr) => acc + (curr.total_imperia || 0), 0);
  const sumCMC = data.reduce((acc, curr) => acc + (curr.total_cmc || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Producción Mina Diario</h2>
            <p className="text-slate-300 opacity-90 mt-1">Resumen diario de operaciones Mina</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {availableMonths.length > 0 && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-md border-slate-600 bg-slate-800 text-white px-4 py-2 border shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 rounded-lg p-5 border border-white/10 backdrop-blur-sm">
            <p className="text-sm text-indigo-200 mb-1 font-medium flex items-center">
              <CheckSquare className="w-4 h-4 mr-2 opacity-70" />
              Total Mes Imperia
            </p>
            <p className="text-3xl font-bold text-white">{formatNum(sumImperia)} <span className="text-sm text-indigo-300 font-normal">Ton</span></p>
          </div>
          <div className="bg-white/5 rounded-lg p-5 border border-white/10 backdrop-blur-sm">
             <p className="text-sm text-blue-200 mb-1 font-medium flex items-center">
              <CheckSquare className="w-4 h-4 mr-2 opacity-70" />
              Total Mes CMC
            </p>
            <p className="text-3xl font-bold text-white">{formatNum(sumCMC)} <span className="text-sm text-blue-300 font-normal">Ton</span></p>
          </div>
          <div className="bg-white/5 rounded-lg p-5 border border-white/10 backdrop-blur-sm">
            <p className="text-sm text-amber-200 mb-1 font-medium flex items-center">
              <CheckSquare className="w-4 h-4 mr-2 opacity-70" />
              Diferencia (CMC - Imperia)
            </p>
            <p className={\`text-3xl font-bold \${sumCMC - sumImperia > 0 ? 'text-green-400' : 'text-red-400'}\`}> 
               {sumCMC - sumImperia > 0 ? '+' : ''}{formatNum(sumCMC - sumImperia)} <span className="text-sm opacity-70 font-normal">Ton</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Date Selector Sidebar */}
        <Card className="p-4 lg:w-64 shrink-0 shadow-sm border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
            Registro Diario
          </h3>
          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {data.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-2">No hay fechas registradas. Carga datos en "Prueba Mina".</p>
            ) : (
              data.map(row => (
                <button
                  key={row.dia}
                  onClick={() => setSelectedDate(row.dia)}
                  className={\`w-full flex justify-between items-center px-3 py-2 rounded-md text-sm transition-colors \${
                    selectedDate === row.dia
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }\`}
                >
                  <span>Día {row.dia}</span>
                  <span className="text-xs opacity-70">{formatNum(row.total_imperia)} T</span>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Detalle del día */}
        <Card className="flex-1 p-0 overflow-hidden shadow-sm border-slate-200 flex flex-col">
          {activeRow ? (
            <>
               <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                  <h3 className="font-semibold text-lg text-slate-800 dark:text-white">
                    Detalle de Operación: {selectedMonth}-{activeRow.dia.toString().padStart(2, '0')}
                  </h3>
                  <div className="flex gap-4 text-sm bg-white dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                     <div><span className="text-slate-500">Imperia:</span> <span className="font-bold text-slate-800 dark:text-white">{formatNum(activeRow.total_imperia)}</span></div>
                     <div><span className="text-slate-500">CMC:</span> <span className="font-bold text-slate-800 dark:text-white">{formatNum(activeRow.total_cmc)}</span></div>
                  </div>
               </div>
               
               <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 dark:bg-slate-900 custom-scrollbar">
                  {/* Turno Día */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/10 flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 mr-3">
                          <CheckSquare className="w-4 h-4" />
                        </span>
                        <h4 className="text-base font-bold text-slate-800 dark:text-white">Turno Día</h4>
                      </div>
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-sm">
                        Supervisor: <span className="text-slate-900 dark:text-white ml-1">{activeRow.supervisor}</span>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider">Métricas</th>
                            <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-right">Cantidad CAEX</th>
                            <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-right">Operadores</th>
                            <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-right">Acopio / Planta</th>
                            <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-right">Pases CF / Totales</th>
                            <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-right text-indigo-600">Prod. Imperia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Resumen</td>
                            <td className="px-4 py-3 text-right">{activeRow.cantidad_caex_dia}</td>
                            <td className="px-4 py-3 text-right">{activeRow.operadores_dia}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-emerald-600">{activeRow.acopio_dia}</span> / <span className="text-blue-600">{activeRow.planta_dia}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {activeRow.pases_cf_dia} / {activeRow.pases_totales_dia}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                              {formatNum(activeRow.produccion_dia)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Turno Noche */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mr-3">
                          <CheckSquare className="w-4 h-4" />
                        </span>
                        <h4 className="text-base font-bold text-slate-800 dark:text-white">Turno Noche</h4>
                      </div>
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                        Supervisor: <span className="text-slate-900 dark:text-white ml-1">{activeRow.supervisor_noche}</span>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider">Métricas</th>
                            <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-right">Cantidad CAEX</th>
                            <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-right">Operadores</th>
                            <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-right">Acopio / Planta</th>
                            <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-right">Pases CF / Totales</th>
                            <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-right text-indigo-600">Prod. Imperia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Resumen</td>
                            <td className="px-4 py-3 text-right">{activeRow.cantidad_caex_noche}</td>
                            <td className="px-4 py-3 text-right">{activeRow.operadores_noche}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-emerald-600">{activeRow.acopio_noche}</span> / <span className="text-blue-600">{activeRow.planta_noche}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {activeRow.pases_cf_noche} / {activeRow.pases_totales_noche}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                              {formatNum(activeRow.produccion_noche)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
               </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6 bg-slate-50 dark:bg-slate-900/50">
              <Database className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300">Selecciona una fecha</h3>
              <p className="text-slate-500 mt-2 max-w-sm">Usa el panel lateral para ver el detalle de producción diario y las comparativas de los turnos de este mes.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
`

fs.writeFileSync('src/pages/produccion/ReporteDiarioMinaPanel.tsx', content);
