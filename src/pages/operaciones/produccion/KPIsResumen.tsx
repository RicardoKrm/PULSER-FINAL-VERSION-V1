import React from 'react';
import { Mountain, Warehouse, Truck, ArrowUpCircle } from 'lucide-react';
import { GlobalStats, MetasObjetivos } from '../../../contexts/ProduccionContext';

interface Props {
  stats: GlobalStats;
  metas: MetasObjetivos;
}

export default function KPIsResumen({ stats, metas }: Props) {
  const metaDiariaPercentMina = metas.minaDaily > 0 ? Math.min((stats.rajoTotal / metas.minaDaily) * 100, 100).toFixed(1) : "0.0";
  const metaDiariaPercentTrans = metas.transporteDaily > 0 ? Math.min((stats.transported / metas.transporteDaily) * 100, 100).toFixed(1) : "0.0";

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI Extraído Mina Hoy */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-sm dark:shadow-lg transition-colors">
        <div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Extracción Mina (Hoy)</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.rajoTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} T</h3>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
            <ArrowUpCircle className="w-3 h-3" /> {metaDiariaPercentMina}% de la meta ({metas.minaDaily} T)
          </p>
        </div>
        <div className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg"><Mountain className="w-6 h-6" /></div>
      </div>
      {/* KPI Extraído Mina Mes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-sm dark:shadow-lg transition-colors">
        <div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Extracción Mina (Mes)</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.millingTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} T</h3>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold flex items-center gap-1">
            Acumulado mes actual
          </p>
        </div>
        <div className="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 rounded-lg"><Mountain className="w-6 h-6" /></div>
      </div>
      {/* KPI Transporte Puerto Hoy */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-sm dark:shadow-lg transition-colors">
        <div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Transporte Puerto (Hoy)</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.transported.toLocaleString(undefined, { maximumFractionDigits: 2 })} T</h3>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
            <ArrowUpCircle className="w-3 h-3" /> {metaDiariaPercentTrans}% de la meta ({metas.transporteDaily} T)
          </p>
        </div>
        <div className="bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3 rounded-lg"><Truck className="w-6 h-6" /></div>
      </div>
      {/* KPI Transporte Puerto Mes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-sm dark:shadow-lg transition-colors">
        <div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Transporte Total (Mes)</span>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.transporteTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} T</h3>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold flex items-center gap-1">
            <Warehouse className="w-3 h-3" /> Stock Estimado: {stats.stockpile.toLocaleString(undefined, { maximumFractionDigits: 2 })} T
          </p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-lg"><Truck className="w-6 h-6" /></div>
      </div>
    </section>
  );
}
