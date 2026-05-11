import React, { useState } from 'react';
import { AlertCircle, Calendar, Wrench, Activity, ShieldAlert, Search, Filter, TrendingUp, X, Info, Download, FileText, FileSpreadsheet } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { cn } from '../../lib/utils';

export default function AnalisisFallas() {
  const [dateRange, setDateRange] = useState('Ultimos 30 dias');
  const [paretoLimit, setParetoLimit] = useState(80);
  const [activeDetail, setActiveDetail] = useState<string | null>(null);
  
  // Simulated Pareto Data
  const paretoData = [
    { name: 'Falla Eléctrica Motor', count: 45, cumulative: 25.7, impacto: 25.7, tfs: 270, causa: 'Cortocircuito en alternador', criticidad: 'Crítica', color: 'text-rose-500' },
    { name: 'Desgaste Frenos', count: 35, cumulative: 45.7, impacto: 20.0, tfs: 210, causa: 'Fricción excesiva / Balatas', criticidad: 'Alta', color: 'text-orange-500' },
    { name: 'Fuga Neumática', count: 28, cumulative: 61.7, impacto: 16.0, tfs: 168, causa: 'Manguera perforada', criticidad: 'Media', color: 'text-amber-500' },
    { name: 'Sistema Hidráulico', count: 20, cumulative: 73.1, impacto: 11.4, tfs: 120, causa: 'Sello de bomba dañado', criticidad: 'Alta', color: 'text-orange-500' },
    { name: 'Transmisión', count: 18, cumulative: 83.4, impacto: 10.3, tfs: 108, causa: 'Sincronizador trabado', criticidad: 'Crítica', color: 'text-rose-500' },
    { name: 'Suspensión', count: 12, cumulative: 90.3, impacto: 6.9, tfs: 72, causa: 'Amortiguador reventado', criticidad: 'Media', color: 'text-amber-500' },
    { name: 'Refrigeración', count: 9, cumulative: 95.4, impacto: 5.1, tfs: 54, causa: 'Fuga en radiador', criticidad: 'Media', color: 'text-amber-500' },
    { name: 'Otros', count: 8, cumulative: 100, impacto: 4.6, tfs: 48, causa: 'Múltiples causas menores', criticidad: 'Baja', color: 'text-emerald-500' },
  ];

  const failureDetails = [
    { id: 1, type: 'Falla Eléctrica Motor', count: 45, mttr: '4.5h', cost: '$12,400', severity: 'Alta', color: 'text-rose-500' },
    { id: 2, type: 'Desgaste Frenos', count: 35, mttr: '2.1h', cost: '$4,200', severity: 'Media', color: 'text-amber-500' },
    { id: 3, type: 'Fuga Neumática', count: 28, mttr: '1.8h', cost: '$1,800', severity: 'Baja', color: 'text-emerald-500' },
    { id: 4, type: 'Sistema Hidráulico', count: 20, mttr: '5.2h', cost: '$8,900', severity: 'Alta', color: 'text-rose-500' },
    { id: 5, type: 'Transmisión', count: 18, mttr: '8.5h', cost: '$15,000', severity: 'Crítica', color: 'text-purple-500' },
  ];

  const renderSidebarContent = () => {
    if (!activeDetail) return null;

    let content = null;
    let title = "";

    if (activeDetail === 'pareto' || activeDetail === 'Fallas Reportadas' || activeDetail === 'MTTR Promedio' || activeDetail === 'Falla Principal' || activeDetail === 'Costo Correctivos' || activeDetail.startsWith('Detalle:')) {
      const isItem = activeDetail.startsWith('Detalle:');
      const itemTitle = isItem ? activeDetail.replace('Detalle: ', '') : activeDetail;
      title = isItem ? `Análisis: ${itemTitle}` : `Detalle de ${activeDetail}`;
      content = (
        <>
          <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-4 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Información de la Falla:</h4>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 leading-snug">
                Impacto en operaciones y tiempo total de detención en el periodo seleccionado.
              </p>
            </div>
          </div>
          
          <table className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left font-bold text-[10px] uppercase text-slate-400 tracking-wider p-3">Métrica</th>
                <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider p-3">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              <tr>
                <td className="p-3 font-bold text-slate-700 dark:text-slate-300">Tiempo de Detención Total</td>
                <td className="p-3 text-right font-black text-rose-500">270 mins</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-700 dark:text-slate-300">Costo Estimado de Reparación</td>
                <td className="p-3 text-right font-black text-rose-500">$ 4,500</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-700 dark:text-slate-300">Vehículos Afectados</td>
                <td className="p-3 text-right font-black text-slate-600 dark:text-slate-400">12 unidades</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-700 dark:text-slate-300">Mano de Obra (Horas)</td>
                <td className="p-3 text-right font-black text-slate-600 dark:text-slate-400">45 hrs</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-700 dark:text-slate-300">Impacto a Flota (%)</td>
                <td className="p-3 text-right font-black text-blue-500">25.7%</td>
              </tr>
            </tbody>
          </table>
        </>
      );
    }
    
    return (
      <>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-between items-center">
          <div>
            <h3 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">ANÁLISIS PROFUNDO</h3>
            <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{title}</h2>
          </div>
          <button 
            onClick={() => setActiveDetail(null)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {content}
        </div>
      </>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Module */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-100 dark:border-rose-500/20">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Análisis de Fallas</h1>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">
              DIAGNÓSTICO Y CAUSAS RAÍZ
            </p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4">
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">Desde:</span>
              <div className="relative">
                <input type="text" defaultValue="12 / 01 / 2025" className="pl-3 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold w-[110px] outline-none text-slate-700 dark:text-slate-300" />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Hasta:</span>
              <div className="relative">
                <input type="text" defaultValue="05 / 11 / 2026" className="pl-3 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold w-[110px] outline-none text-slate-700 dark:text-slate-300" />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Taller:</span>
              <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 outline-none cursor-pointer">
                <option>Todos los Talleres</option>
                <option>Taller Central</option>
                <option>Taller Norte</option>
                <option>Taller Sur</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Modelo:</span>
              <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 outline-none cursor-pointer">
                <option>Todos los Modelos</option>
                <option>Volvo FH 460</option>
                <option>Mercedes Actros</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-auto">
            <button className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 rounded-xl text-xs font-bold transition-colors hover:bg-red-100 dark:hover:bg-red-500/20">
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-xs font-bold transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-500/20">
              <FileSpreadsheet className="w-4 h-4" />
              EXCEL
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: ShieldAlert, label: 'Fallas Reportadas', value: '175', trend: '+12%', trendUp: true, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
          { icon: Activity, label: 'MTTR Promedio', value: '4.2h', trend: '-8%', trendUp: false, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { icon: TrendingUp, label: 'Falla Principal', value: 'Eléctrica', subValue: '25% del total', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { icon: Wrench, label: 'Costo Correctivos', value: '$42.3k', trend: '+5%', trendUp: true, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map((kpi, i) => (
          <div 
            key={i} 
            onClick={() => setActiveDetail(kpi.label)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`w-10 h-10 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              {kpi.trend && (
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                  kpi.trendUp ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {kpi.trend}
                </span>
              )}
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</h3>
                {kpi.subValue && <span className="text-xs font-bold text-slate-400">{kpi.subValue}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Pareto Dashboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Diagrama de Pareto: Causas de Falla</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Identificacion de los "pocos vitales" frente a los "muchos triviales".</p>
          </div>
          <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <button 
              onClick={() => setParetoLimit(80)}
              className={cn("px-3 py-1.5 text-xs font-bold transition-colors", paretoLimit === 80 ? "bg-slate-800 text-white dark:bg-slate-700" : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-750")}
            >
              80%
            </button>
            <button 
              onClick={() => setParetoLimit(90)}
              className={cn("px-3 py-1.5 text-xs font-bold border-l border-r border-slate-200 dark:border-slate-700 transition-colors", paretoLimit === 90 ? "bg-slate-800 text-white dark:bg-slate-700" : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-750")}
            >
              90%
            </button>
            <button 
              onClick={() => setParetoLimit(100)}
              className={cn("px-3 py-1.5 text-xs font-bold transition-colors", paretoLimit === 100 ? "bg-slate-800 text-white dark:bg-slate-700" : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-750")}
            >
              100%
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="h-[400px] w-full cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={paretoData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                onClick={(e) => setActiveDetail(e?.activeLabel ? `Detalle: ${e.activeLabel}` : 'pareto')}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  yAxisId="left" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '12px',
                    border: '1px solid #1e293b',
                    color: '#fff',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {paretoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cumulative <= paretoLimit ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#0f172a' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                />
                <ReferenceLine yAxisId="right" y={paretoLimit} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={2} label={{ position: 'top', value: `Límite ${paretoLimit}%`, fill: '#f59e0b', fontSize: 11, fontWeight: 'bold' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Detalle de Anomalías</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Registros consolidados de eventos de falla para el periodo seleccionado.</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar falla..." 
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full md:w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-center font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider py-4 px-6">Criticidad</th>
                <th className="text-left font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider py-4 px-6">Causa</th>
                <th className="text-left font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider py-4 px-6">Descripción</th>
                <th className="text-left font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider py-4 px-6">TFS (Min)</th>
                <th className="text-left font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider py-4 px-6">Impacto (%)</th>
                <th className="text-left font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider py-4 px-6">Acumulado (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {paretoData.map((row, index) => (
                <tr 
                  key={index} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => setActiveDetail(`Detalle: ${row.name}`)}
                >
                  <td className="py-4 px-6 text-center">
                    <span className={`text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-md ${row.color} bg-current/10 border border-current/20`}>
                      {row.criticidad}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">{row.causa}</td>
                  <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-400">{row.name}</td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-600 dark:text-slate-300">{row.tfs}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-black text-rose-500 dark:text-rose-400">{row.impacto}%</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-black text-blue-600 dark:text-blue-400">{row.cumulative}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Detail Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-[400px] bg-white dark:bg-[#0b1120] border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-300 z-50 flex flex-col",
        activeDetail ? "translate-x-0" : "translate-x-full"
      )}>
        {renderSidebarContent()}
      </div>

    </div>
  );
}
