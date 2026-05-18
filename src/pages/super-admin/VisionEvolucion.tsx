import React, { useState } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { Shield, CheckCircle, AlertTriangle, TrendingUp, Filter, Info, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

export default function SuperAdminVisionEvolucion() {
  const { companies } = useCompany();
  const [selectedCompanyIdForDashboard, setSelectedCompanyIdForDashboard] = useState<string>('GLOBAL');
  
  const selectedDashboardCompany = companies.find(c => c.id === selectedCompanyIdForDashboard);
  const dashboardData: any[] = []; // No mock data

  const isGlobal = selectedCompanyIdForDashboard === 'GLOBAL';

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

        {dashboardData.length > 0 ? (
          <div>
            {/* Highlight Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               {/* Stats Content */}
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
