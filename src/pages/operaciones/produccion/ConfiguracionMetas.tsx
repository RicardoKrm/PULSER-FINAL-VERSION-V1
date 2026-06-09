import React from 'react';
import { SlidersHorizontal, BarChart3, Info } from 'lucide-react';
import { GlobalStats, MetasObjetivos } from '../../../contexts/ProduccionContext';

interface Props {
  metas: MetasObjetivos;
  setMetas: React.Dispatch<React.SetStateAction<MetasObjetivos>>;
  stats: GlobalStats;
}

export default function ConfiguracionMetas({ metas, setMetas, stats }: Props) {
  const dailyPercent = Math.min((stats.rajoTotal / metas.daily) * 100, 100).toFixed(1);
  const weeklyPercent = Math.min(((stats.transported + 12000) / metas.weekly) * 100, 100).toFixed(1);
  const monthlyPercent = Math.min(((stats.rajoTotal + stats.transported + 24000) / metas.monthly) * 100, 100).toFixed(1);

  const getBarColor = (percent: number) => {
    if (percent < 50) return "from-rose-600 to-rose-400";
    if (percent < 85) return "from-amber-500 to-amber-300";
    return "from-emerald-600 to-emerald-400";
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors">
        <div>
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2.5 mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase flex items-center gap-1.5 transition-colors">
              <SlidersHorizontal className="w-4 h-4 text-amber-500" /> Ajustador de Metas de Producción
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Modifica los objetivos base del sistema para recalcular KPIs operacionales.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">Meta Diaria de Extracción</span>
                <span className="text-amber-600 dark:text-amber-500 font-bold">{metas.daily.toLocaleString()} T</span>
              </div>
              <input 
                type="range" min="2000" max="8000" step="100" 
                value={metas.daily} 
                onChange={(e) => setMetas(m => ({ ...m, daily: parseInt(e.target.value) }))}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 transition-colors" 
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">Meta Semanal Despacho Puerto</span>
                <span className="text-amber-600 dark:text-amber-500 font-bold">{metas.weekly.toLocaleString()} T</span>
              </div>
              <input 
                type="range" min="10000" max="30000" step="500" 
                value={metas.weekly} 
                onChange={(e) => setMetas(m => ({ ...m, weekly: parseInt(e.target.value) }))}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 transition-colors" 
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">Meta Mensual Planificada</span>
                <span className="text-amber-600 dark:text-amber-500 font-bold">{metas.monthly.toLocaleString()} T</span>
              </div>
              <input 
                type="range" min="50000" max="150000" step="2000" 
                value={metas.monthly} 
                onChange={(e) => setMetas(m => ({ ...m, monthly: parseInt(e.target.value) }))}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 transition-colors" 
              />
            </div>
          </div>
        </div>

        <div className="mt-4 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-start gap-2 transition-colors">
          <Info className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
          <span>Los cambios realizados aquí se sincronizan con las barras de cumplimiento en tiempo real de la gerencia.</span>
        </div>
      </div>

      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase mb-1 flex items-center gap-1.5 transition-colors">
            <BarChart3 className="w-4 h-4 text-amber-500" /> Cumplimiento Operacional de Metas (Rajo y Puerto)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Estado porcentual de avances basado en la producción diaria registrada por los supervisores.</p>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Cumplimiento Diario de Extracción Rajo (Hoy)</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{dailyPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3.5 p-0.5 border border-slate-200 dark:border-slate-800 transition-colors">
                <div className={`bg-gradient-to-r ${getBarColor(Number(dailyPercent))} h-2 rounded-full transition-all duration-500`} style={{ width: `${dailyPercent}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Cumplimiento de Despacho Semanal a Puerto Patache</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400">{weeklyPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3.5 p-0.5 border border-slate-200 dark:border-slate-800 transition-colors">
                <div className={`bg-gradient-to-r ${getBarColor(Number(weeklyPercent))} h-2 rounded-full transition-all duration-500`} style={{ width: `${weeklyPercent}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Cumplimiento Mensual Consolidado (Mina Tenardita)</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400">{monthlyPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3.5 p-0.5 border border-slate-200 dark:border-slate-800 transition-colors">
                <div className={`bg-gradient-to-r ${getBarColor(Number(monthlyPercent))} h-2 rounded-full transition-all duration-500`} style={{ width: `${monthlyPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
