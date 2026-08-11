import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { Calendar, Database, CheckSquare, Search } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';

interface ProcessedRow {
  dia: number;
  supervisor: string;
  supervisor_noche: string;
  
  // Turno Día
  cantidad_caex_dia: string | number;
  caex_dia: string | number;
  operadores_dia: string | number;
  acopio_dia: string | number;
  caex_acopio_dia: string | number;
  planta_dia: string | number;
  caex_planta_dia: string | number;
  vueltas_dia: number;
  pases_cf_dia: number;
  pases_totales_dia: number;
  toneladas_caex_dia: string | number;
  equipo_cf_dia: string;
  produccion_dia: number;
  produccion_cmc_dia: number;
  traspasos_dia: number;

  // Turno Noche
  cantidad_caex_noche: string | number;
  caex_noche: string | number;
  operadores_noche: string | number;
  acopio_noche: string | number;
  caex_acopio_noche: string | number;
  planta_noche: string | number;
  caex_planta_noche: string | number;
  vueltas_noche: number;
  pases_cf_noche: number;
  pases_totales_noche: number;
  toneladas_caex_noche: string | number;
  equipo_cf_noche: string;
  produccion_caex_noche: string | number;
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
            <p className={`text-3xl font-bold ${sumCMC - sumImperia > 0 ? 'text-green-400' : 'text-red-400'}`}> 
               {sumCMC - sumImperia > 0 ? '+' : ''}{formatNum(sumCMC - sumImperia)} <span className="text-sm opacity-70 font-normal">Ton</span>
            </p>
          </div>
        </div>
      </div>

      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Date Selector Sidebar */}
        <Card className="p-4 lg:w-64 shrink-0 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Filtro y Selección
          </h3>
          
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
              Mes del Reporte
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-sm rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-1.5 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
            >
              {availableMonths.length === 0 && <option value="">Sin datos</option>}
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

          <div className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">
            Días disponibles:
          </div>
          <div className="space-y-2 overflow-y-auto flex-1 max-h-[600px] pr-1 custom-scrollbar">
            {data.length === 0 ? (
              <div className="text-sm text-gray-500 italic text-center py-4">No hay días en este mes</div>
            ) : (
              data.map(row => {
                const formattedDate = `Día ${row.dia.toString().padStart(2, '0')} `;
                return (
                  <button
                    key={row.dia}
                    onClick={() => setSelectedDate(row.dia)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedDate === row.dia
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800/50'
                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    {formattedDate}
                  </button>
                )
              })
            )}
          </div>
        </Card>

        {/* Detalle del día */}
        <div className="flex-1 space-y-6">
          {activeRow ? (
            <>
               {/* Turno Día */}
               <Card className="p-6">
                 <div className="border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                       Fecha: <span className="font-normal text-gray-600 dark:text-slate-400">{selectedMonth}-{activeRow.dia.toString().padStart(2, '0')}</span>
                     </h3>
                     <div className="flex flex-col items-end">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200">
                         Turno: Día
                       </span>
                       {activeRow.supervisor && (
                         <div className="mt-2 flex flex-col items-end">
                           <span className="text-sm text-slate-500 dark:text-slate-400">Supervisor de Turno</span>
                           <div className="mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                             <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{activeRow.supervisor}</span>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                   <div className="text-md text-gray-700 dark:text-slate-300 font-medium">
                     Totales del turno:{' '}
                     <span className="text-blue-600">{activeRow.vueltas_dia} Vueltas</span> |{' '}
                     <span className="text-blue-600">{formatNum(activeRow.produccion_dia)} Toneladas</span>
                   </div>
                 </div>

                 <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                     <thead className="bg-gray-50 dark:bg-slate-800">
                       <tr>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Equipos CAEX</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Operadores</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Acopio / Primario</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Pases CF / Totales</th>
                         <th className="px-4 py-3 text-right text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Prod. Imperia</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                       <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-[200px] truncate" title={String(activeRow.caex_dia)}>
    <span className="font-semibold">{activeRow.cantidad_caex_dia}</span>
    {activeRow.caex_dia && <span className="text-slate-500 text-xs ml-1">({activeRow.caex_dia})</span>}
  </td>
                         <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400 max-w-[250px] truncate" title={String(activeRow.operadores_dia)}>{activeRow.operadores_dia}</td>
                         <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
    <div className="flex flex-col">
      <div><span className="text-emerald-600 dark:text-emerald-400 font-medium">{activeRow.acopio_dia}</span> <span className="text-xs">Acopio</span></div>
      <div><span className="text-blue-600 dark:text-blue-400 font-medium">{activeRow.planta_dia}</span> <span className="text-xs">Primario</span></div>
    </div>
  </td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium">
                           {activeRow.pases_cf_dia} / {activeRow.pases_totales_dia}
                         </td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-indigo-600 dark:text-indigo-400">
                           {formatNum(activeRow.produccion_dia)}
                         </td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
               </Card>

               {/* Turno Noche */}
               <Card className="p-6">
                 <div className="border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                       Fecha: <span className="font-normal text-gray-600 dark:text-slate-400">{selectedMonth}-{activeRow.dia.toString().padStart(2, '0')}</span>
                     </h3>
                     <div className="flex flex-col items-end">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200">
                         Turno: Noche
                       </span>
                       {activeRow.supervisor_noche && (
                         <div className="mt-2 flex flex-col items-end">
                           <span className="text-sm text-slate-500 dark:text-slate-400">Supervisor de Turno</span>
                           <div className="mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                             <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{activeRow.supervisor_noche}</span>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                   <div className="text-md text-gray-700 dark:text-slate-300 font-medium">
                     Totales del turno:{' '}
                     <span className="text-blue-600">{activeRow.vueltas_noche} Vueltas</span> |{' '}
                     <span className="text-blue-600">{formatNum(activeRow.produccion_noche)} Toneladas</span>
                   </div>
                 </div>

                 <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                     <thead className="bg-gray-50 dark:bg-slate-800">
                       <tr>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Equipos CAEX</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Operadores</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Acopio / Primario</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Pases CF / Totales</th>
                         <th className="px-4 py-3 text-right text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Prod. Imperia</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                       <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-[200px] truncate" title={String(activeRow.caex_noche)}>
    <span className="font-semibold">{activeRow.cantidad_caex_noche}</span>
    {activeRow.caex_noche && <span className="text-slate-500 text-xs ml-1">({activeRow.caex_noche})</span>}
  </td>
                         <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400 max-w-[250px] truncate" title={String(activeRow.operadores_noche)}>{activeRow.operadores_noche}</td>
                         <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
    <div className="flex flex-col">
      <div><span className="text-emerald-600 dark:text-emerald-400 font-medium">{activeRow.acopio_noche}</span> <span className="text-xs">Acopio</span></div>
      <div><span className="text-blue-600 dark:text-blue-400 font-medium">{activeRow.planta_noche}</span> <span className="text-xs">Primario</span></div>
    </div>
  </td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium">
                           {activeRow.pases_cf_noche} / {activeRow.pases_totales_noche}
                         </td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-indigo-600 dark:text-indigo-400">
                           {formatNum(activeRow.produccion_noche)}
                         </td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
               </Card>
            </>
          ) : (
            <Card className="p-12 flex flex-col items-center justify-center text-center">
              <Database className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300">Selecciona una fecha</h3>
              <p className="text-slate-500 mt-2 max-w-sm">Usa el panel lateral para ver el detalle de producción diario y las comparativas de los turnos de este mes.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
