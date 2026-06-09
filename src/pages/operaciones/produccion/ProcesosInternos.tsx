import React from 'react';
import { ChevronRight } from 'lucide-react';
import { GlobalStats } from '../../../contexts/ProduccionContext';

interface Props {
  stats: GlobalStats;
}

export default function ProcesosInternos({ stats }: Props) {
  const flowRajo = Math.round(650 + (stats.rajoTotal / 10));
  const flowMolienda = Math.round(420 + (stats.millingTotal / 10));

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white transition-colors">Estado de Procesos Internos: Extracción y Molienda</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Monitoreo de flujo desde la tronadura del rajo hasta el despacho final.</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold px-2 py-1 rounded transition-colors">Rajo: Operativo</span>
          <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold px-2 py-1 rounded transition-colors">Planta: Operativa</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {/* Paso 1: Rajo */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-40 relative transition-colors">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-amber-600 dark:text-amber-500 tracking-wider">PASO 1: RAJO</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 transition-colors">Tronadura y Carguío</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Fragmentación de sal de roca de alta pureza.</p>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500 dark:text-slate-400">Rendimiento:</span>
              <span className="font-bold text-slate-900 dark:text-white">{flowRajo} Ton/h</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1">
              <div className="bg-amber-500 h-1 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex absolute left-[18.5%] top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-700 text-lg z-10 transition-colors">
          <ChevronRight className="w-6 h-6 animate-pulse" />
        </div>

        {/* Paso 2: Transporte */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-40 relative transition-colors">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-amber-600 dark:text-amber-500 tracking-wider">PASO 2: TRANSPORTE</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 transition-colors">Frente de Carga</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Cargadores frontales de alta capacidad y camiones tolva dumper.</p>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500 dark:text-slate-400">Ciclo Operación:</span>
              <span className="font-bold text-slate-900 dark:text-white">94% Óptimo</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1">
              <div className="bg-emerald-500 h-1 rounded-full" style={{ width: '94%' }}></div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex absolute left-[38.5%] top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-700 text-lg z-10 transition-colors">
          <ChevronRight className="w-6 h-6 animate-pulse" />
        </div>

        {/* Paso 3: Molienda */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-40 relative transition-colors">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-amber-600 dark:text-amber-500 tracking-wider">PASO 3: MOLIENDA</span>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 transition-colors">Alimentación Planta</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Chancado primario y molienda clasificadora de sal mineral.</p>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500 dark:text-slate-400">Trituración:</span>
              <span className="font-bold text-slate-900 dark:text-white">{flowMolienda} Ton/h</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1">
              <div className="bg-amber-500 h-1 rounded-full" style={{ width: '78%' }}></div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex absolute left-[58.5%] top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-700 text-lg z-10 transition-colors">
          <ChevronRight className="w-6 h-6 animate-pulse" />
        </div>

        {/* Paso 4: Stock */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-40 relative transition-colors">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-amber-600 dark:text-amber-500 tracking-wider">PASO 4: STOCK</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 transition-colors">Canchas de Acopio</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Punto de acopio donde se organiza por granulometría.</p>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500 dark:text-slate-400">Stock Acumulado:</span>
              <span className="font-bold text-slate-900 dark:text-white">{stats.stockpile.toLocaleString()} T</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1">
              <div className="bg-blue-500 h-1 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex absolute left-[78.5%] top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-700 text-lg z-10 transition-colors">
          <ChevronRight className="w-6 h-6 animate-pulse" />
        </div>

        {/* Paso 5: Despacho */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-40 relative transition-colors">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-amber-600 dark:text-amber-500 tracking-wider">PASO 5: DESPACHO</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2 transition-colors">Carguío de Tolvas</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Preparación de las flotas de carretera hacia Puerto.</p>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-500 dark:text-slate-400">Capacidad Carguío:</span>
              <span className="font-bold text-slate-900 dark:text-white">100% Operativo</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1">
              <div className="bg-emerald-500 h-1 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
