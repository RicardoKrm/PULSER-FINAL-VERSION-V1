import React, { useState } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { Shield, CheckCircle, AlertTriangle, TrendingUp, Filter, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

// Datos de simulación para los gráficos
const generateDashboardData = (companyId: string) => {
  // Simulamos que hace 6 meses había más incidencias y ahora bajaron
  const isGlobal = companyId === 'GLOBAL';
  const multiplier = isGlobal ? 8 : 1;

  return [
    { mes: 'Mes -6', incidentes: 45 * multiplier, solucionados: 10 * multiplier, eficiencia: 65 },
    { mes: 'Mes -5', incidentes: 42 * multiplier, solucionados: 15 * multiplier, eficiencia: 68 },
    { mes: 'Mes -4', incidentes: 38 * multiplier, solucionados: 25 * multiplier, eficiencia: 72 },
    { mes: 'Mes -3', incidentes: 30 * multiplier, solucionados: 28 * multiplier, eficiencia: 78 },
    { mes: 'Mes -2', incidentes: 20 * multiplier, solucionados: 22 * multiplier, eficiencia: 85 },
    { mes: 'Mes -1', incidentes: 12 * multiplier, solucionados: 18 * multiplier, eficiencia: 92 },
    { mes: 'Actual', incidentes: 5 * multiplier, solucionados: 8 * multiplier, eficiencia: 96 },
  ];
};

export default function SuperAdminVisionEvolucion() {
  const { companies } = useCompany();
  const [selectedCompanyIdForDashboard, setSelectedCompanyIdForDashboard] = useState<string>('GLOBAL');
  
  const selectedDashboardCompany = companies.find(c => c.id === selectedCompanyIdForDashboard);
  const dashboardData = generateDashboardData(selectedCompanyIdForDashboard);

  // Stats para la compañía seleccionada:
  const isGlobal = selectedCompanyIdForDashboard === 'GLOBAL';
  const currIncidentes = dashboardData[dashboardData.length - 1].incidentes;
  const currEficiencia = dashboardData[dashboardData.length - 1].eficiencia;
  const pastIncidentes = dashboardData[0].incidentes;

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
              className="appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Development Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Este módulo sigue en desarrollo</h4>
          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
            Estamos trabajando para agregar más métricas y opciones de filtrado en futuras actualizaciones.
          </p>
        </div>
      </div>

      {/* Panel Analítico */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Visión de Evolución: {selectedDashboardCompany?.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isGlobal 
                ? 'Historial agregado de todas las empresas afiliadas desde su ingreso.' 
                : `Analítica de problemas operativos vs resoluciones desde ${selectedDashboardCompany?.joinDate}.`}
            </p>
          </div>
        </div>

        {/* Highlight Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Incidentes (Mes -6)</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{pastIncidentes}</h3>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Incidentes (Actual)</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currIncidentes}</h3>
                <span className="text-xs font-bold text-emerald-500">
                  -{Math.round(((pastIncidentes - currIncidentes) / pastIncidentes) * 100)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Eficiencia Operativa</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currEficiencia}%</h3>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Incidentes vs Resoluciones */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Cierre de Brechas (Incidentes vs Control)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="incidentes" name="Problemas Reportados" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="solucionados" name="Soluciones TMS" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Eficiencia en el Tiempo */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">
              Desempeño y Productividad (%)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEficiencia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="eficiencia" 
                    name="Eficiencia Acumulada"
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorEficiencia)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
