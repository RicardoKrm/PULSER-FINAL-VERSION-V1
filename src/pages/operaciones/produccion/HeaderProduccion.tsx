import React from 'react';
import { Compass, CloudCog } from 'lucide-react';

export default function HeaderProduccion() {
  return (
    <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sticky top-0 z-10 shadow-sm dark:shadow-lg transition-colors">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-amber-500 to-amber-400 text-white dark:text-slate-950 p-2.5 rounded-xl font-black shadow-md shadow-amber-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest text-amber-600 dark:text-amber-500 uppercase">Pulser Operations</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-bold px-1.5 py-0.5 rounded transition-colors">V3.0 (Trazabilidad)</span>
            </div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors">Salar Grande - Distrito Minero Tarapacá</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2 transition-colors">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Monitoreo Activo: <strong className="text-slate-900 dark:text-white">Mina Tenardita</strong></span>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors">
            <CloudCog className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            Sincronizado (Local/Nube)
          </div>
        </div>
      </div>
    </header>
  );
}
