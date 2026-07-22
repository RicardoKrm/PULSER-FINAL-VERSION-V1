import React from 'react';
import { Card } from '../../../components/ui/Card';
import { MetasObjetivos, GlobalStats } from '../../../contexts/ProduccionContext';
import { Target, TrendingUp, Calendar } from 'lucide-react';

interface Props {
  metas: MetasObjetivos;
  setMetas: React.Dispatch<React.SetStateAction<MetasObjetivos>>;
  stats: GlobalStats;
}

export default function ConfiguracionMetas({ metas, setMetas, stats }: Props) {
  const progresoRajo = metas.monthly > 0 ? (stats.millingTotal / metas.monthly) * 100 : 0;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" /> Resumen Mensual
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-slate-600 dark:text-slate-400">Progreso Mina (Mensual)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{progresoRajo.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(progresoRajo, 100)}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-1 text-right">{stats.millingTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {metas.monthly.toLocaleString()} T</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-500" /> Configurar Metas
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Meta Diaria (Toneladas)
            </label>
            <input 
              type="number" 
              value={metas.daily}
              onChange={(e) => setMetas({...metas, daily: Number(e.target.value)})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Meta Mensual (Toneladas)
            </label>
            <input 
              type="number" 
              value={metas.monthly}
              onChange={(e) => setMetas({...metas, monthly: Number(e.target.value)})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
