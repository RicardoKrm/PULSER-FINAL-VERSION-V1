import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { Shield, CheckCircle, AlertTriangle, TrendingUp, Filter, Info, Activity, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { exportToExcel } from '../../lib/excelExport';
import { exportToPDF } from '../../lib/pdfExport';
import toast from 'react-hot-toast';

export default function SuperAdminVisionEvolucion() {
  const { companies } = useCompany();
  const [selectedCompanyIdForDashboard, setSelectedCompanyIdForDashboard] = useState<string>('GLOBAL');
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [globalStats, setGlobalStats] = useState({ total: 0, resueltas: 0, eficiencia: 0 });
  
  const selectedDashboardCompany = companies.find(c => c.id === selectedCompanyIdForDashboard);
  const isGlobal = selectedCompanyIdForDashboard === 'GLOBAL';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('ordenes_trabajo').select('id, fechaCreacion, estado, tipo, empresa_id');
      
      if (!isGlobal) {
        query = query.eq('empresa_id', selectedCompanyIdForDashboard);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (!data) return;

      // Group by month
      const monthsMap = new Map<string, { generadas: number, resueltas: number }>();
      
      data.forEach((ot: any) => {
        if (!ot.fechaCreacion) return;
        
        // Parse date
        const dateObj = new Date(ot.fechaCreacion);
        // Format as YYYY-MM
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, { generadas: 0, resueltas: 0 });
        }
        
        const stats = monthsMap.get(monthKey)!;
        stats.generadas++;
        
        if (['FINALIZADA', 'CERRADA_MECANICO', 'CERRADA_POR_MECANICO'].includes(ot.estado)) {
          stats.resueltas++;
        }
      });
      
      // Convert map to array, sort chronologically, and calculate efficiency
      const sortedMonths = Array.from(monthsMap.keys()).sort();
      
      let tTotal = 0;
      let tResueltas = 0;
      
      const finalData = sortedMonths.map(mesKey => {
        const d = monthsMap.get(mesKey)!;
        tTotal += d.generadas;
        tResueltas += d.resueltas;
        
        const [year, m] = mesKey.split('-');
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const label = `${monthNames[parseInt(m) - 1]} ${year}`;
        
        return {
          mesOriginal: mesKey,
          mes: label,
          'Problemas / OTs Generadas': d.generadas,
          'Soluciones Completadas': d.resueltas,
          'Eficiencia Resolutiva (%)': d.generadas > 0 ? Math.round((d.resueltas / d.generadas) * 100) : 0
        };
      });
      
      setDashboardData(finalData);
      setGlobalStats({
        total: tTotal,
        resueltas: tResueltas,
        eficiencia: tTotal > 0 ? Math.round((tResueltas / tTotal) * 100) : 0
      });
      
    } catch (err) {
      console.error('Error procesando Visión de Evolución', err);
      toast.error('Error al cargar datos históricos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompanyIdForDashboard]);

  const handleExportExcel = () => {
    if (dashboardData.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    const filename = `Vision_Evolucion_${isGlobal ? 'GLOBAL' : selectedDashboardCompany?.name}_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(dashboardData, filename, 'Reporte de Evolución Mensual');
    toast.success('Reporte Excel descargado');
  };

  const handleExportPDF = () => {
    if (dashboardData.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }
    import('../../lib/pdfExport').then(({ exportToPDF }) => {
      const filename = `Vision_Evolucion_${isGlobal ? 'GLOBAL' : selectedDashboardCompany?.name}_${new Date().toISOString().split('T')[0]}`;
      const title = `Reporte de Evolución Mensual: ${isGlobal ? 'GLOBAL' : selectedDashboardCompany?.name}`;
      exportToPDF(dashboardData, filename, title);
      toast.success('Reporte PDF descargado');
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
            Visión de Evolución
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Analiza el progreso y la eficiencia operativa de las empresas en el tiempo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedCompanyIdForDashboard}
              onChange={(e) => setSelectedCompanyIdForDashboard(e.target.value)}
              className="appearance-none font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="GLOBAL">🌎 VISTA GLOBAL (Todas las flotas)</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>🏢 {c.name}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Panel Analítico */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Visión de Evolución: {isGlobal ? 'Plataforma Global' : selectedDashboardCompany?.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isGlobal 
                ? 'Historial agregado de todas las empresas afiliadas desde su ingreso.' 
                : `Analítica de problemas operativos vs resoluciones desde que la empresa utiliza Pulser.`}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleExportExcel}
              disabled={dashboardData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg font-medium text-sm transition-colors border border-emerald-200 dark:border-emerald-800"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={dashboardData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg font-medium text-sm transition-colors border border-red-200 dark:border-red-800"
            >
              <FileText className="w-4 h-4" />
              Exportar PDF
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Calculando métricas históricas...</p>
          </div>
        ) : dashboardData.length > 0 ? (
          <div>
            {/* Highlight Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                 <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
                   <AlertTriangle className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Problemas Históricos</p>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{globalStats.total}</h3>
                 </div>
               </div>
               
               <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                 <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                   <CheckCircle className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Soluciones Completadas</p>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{globalStats.resueltas}</h3>
                 </div>
               </div>
               
               <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                 <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                   <TrendingUp className="w-6 h-6" />
                 </div>
                 <div>
                   <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Eficiencia Global Promedio</p>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{globalStats.eficiencia}%</h3>
                 </div>
               </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  Curva de Problemas vs Soluciones
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboardData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProblemas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSoluciones" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" name="Problemas / OTs Generadas" dataKey="Problemas / OTs Generadas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorProblemas)" />
                      <Area type="monotone" name="Soluciones Completadas" dataKey="Soluciones Completadas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSoluciones)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  Evolución de la Eficiencia (%)
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Bar 
                        name="Eficiencia Resolutiva (%)" 
                        dataKey="Eficiencia Resolutiva (%)" 
                        fill="#6366f1" 
                        radius={[4, 4, 0, 0]} 
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <Activity className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Aún no hay suficientes datos registrados.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">El panel comenzará a procesar métricas cuando las empresas ingresen operaciones regulares.</p>
          </div>
        )}
      </div>
    </div>
  );
}
