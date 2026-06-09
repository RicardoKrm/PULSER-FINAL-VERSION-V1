import React, { useState } from 'react';
import { ChevronRight, Info, Activity, Clock, FileText, Battery, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { GlobalStats } from '../../../contexts/ProduccionContext';

interface Props {
  stats: GlobalStats;
}

const stepDetails = {
  rajo: {
    title: 'Detalle Técnico: Extracción en Rajo',
    equipos: 'Perforadoras rotativas, Explosivos, Cargadores frontales 994',
    eficiencia: '85% (Plan vs Real)',
    impactoClima: 'Bajo - Vientos normales',
    tempRajo: '22°C - Condiciones óptimas',
    estado: 'Operativo',
    observaciones: 'Tronadura programada para las 15:00 hrs. Sector Norte despejado.'
  },
  transporte: {
    title: 'Detalle Técnico: Transporte Interno',
    equipos: 'Camiones de extracción (CAEX), Camiones articulados',
    eficiencia: '94% Disponibilidad Física',
    tiempoCiclo: '15 min promedio (Frente a Planta)',
    combustible: '75% Autonomía promedio en flota',
    estado: 'Operativo',
    observaciones: 'Rutas internas regadas, sin polvo en suspensión. 1 unidad en mantención preventiva.'
  },
  molienda: {
    title: 'Detalle Técnico: Molienda y Chancado',
    equipos: 'Chancador de mandíbulas, Molinos de rodillo, Zarandas',
    eficiencia: '78% Factor de Carga',
    consumoElectrico: '1.2 MW/h',
    flujoAlimentacion: 'Continuo regulado',
    estado: 'Operativo - Precaución',
    observaciones: 'Inspección de desgaste en revestimientos programada para el próximo turno.'
  },
  stock: {
    title: 'Detalle Técnico: Canchas de Acopio',
    equipos: 'Apiladores radiales (Stackers), Cargadores de pala pequeña',
    eficiencia: '65% Capacidad Ocupada',
    humedadAmbiente: '12% (Rango Normal)',
    distribucion: '60% Gruesa, 30% Fina, 10% Descarte',
    estado: 'Operativo',
    observaciones: 'Cancha 2 en preparación de base. Cancha 1 despachando.'
  },
  despacho: {
    title: 'Detalle Técnico: Despacho a Puerto',
    equipos: 'Silos de carga rápida, Romanas de pesaje, Semáforos',
    eficiencia: '100% Romanas Calibradas',
    tiempoCarguio: '8 min promedio por camión',
    filaEspera: '2 camiones en zona buffer',
    estado: 'Operativo',
    observaciones: 'Lector de patentes sincronizado. Emisión de guías electrónica sin latencia.'
  }
};

export default function ProcesosInternos({ stats }: Props) {
  const [selectedStep, setSelectedStep] = useState<keyof typeof stepDetails | null>(null);
  
  const flowRajo = Math.round(650 + (stats.rajoTotal / 10));
  const flowMolienda = Math.round(420 + (stats.millingTotal / 10));

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white transition-colors">Estado de Procesos Internos: Extracción y Molienda</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Monitoreo de flujo desde la tronadura del rajo hasta el despacho final. Seleccione una fase para más detalles.</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold px-2 py-1 rounded transition-colors">Rajo: Operativo</span>
          <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold px-2 py-1 rounded transition-colors">Planta: Operativa</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {/* Paso 1: Rajo */}
        <div 
          onClick={() => setSelectedStep('rajo')}
          className={`bg-slate-50 dark:bg-slate-950 border ${selectedStep === 'rajo' ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-slate-200 dark:border-slate-800'} hover:border-amber-500/50 cursor-pointer rounded-xl p-4 flex flex-col justify-between h-40 relative transition-all duration-200`}
        >
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

        <div className="hidden md:flex absolute left-[18.5%] top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-700 text-lg z-10 transition-colors pointer-events-none">
          <ChevronRight className="w-6 h-6 animate-pulse" />
        </div>

        {/* Paso 2: Transporte */}
        <div 
          onClick={() => setSelectedStep('transporte')}
          className={`bg-slate-50 dark:bg-slate-950 border ${selectedStep === 'transporte' ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-slate-200 dark:border-slate-800'} hover:border-amber-500/50 cursor-pointer rounded-xl p-4 flex flex-col justify-between h-40 relative transition-all duration-200`}
        >
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

        <div className="hidden md:flex absolute left-[38.5%] top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-700 text-lg z-10 transition-colors pointer-events-none">
          <ChevronRight className="w-6 h-6 animate-pulse" />
        </div>

        {/* Paso 3: Molienda */}
        <div 
          onClick={() => setSelectedStep('molienda')}
          className={`bg-slate-50 dark:bg-slate-950 border ${selectedStep === 'molienda' ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-slate-200 dark:border-slate-800'} hover:border-amber-500/50 cursor-pointer rounded-xl p-4 flex flex-col justify-between h-40 relative transition-all duration-200`}
        >
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

        <div className="hidden md:flex absolute left-[58.5%] top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-700 text-lg z-10 transition-colors pointer-events-none">
          <ChevronRight className="w-6 h-6 animate-pulse" />
        </div>

        {/* Paso 4: Stock */}
        <div 
          onClick={() => setSelectedStep('stock')}
          className={`bg-slate-50 dark:bg-slate-950 border ${selectedStep === 'stock' ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-slate-200 dark:border-slate-800'} hover:border-amber-500/50 cursor-pointer rounded-xl p-4 flex flex-col justify-between h-40 relative transition-all duration-200`}
        >
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

        <div className="hidden md:flex absolute left-[78.5%] top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-700 text-lg z-10 transition-colors pointer-events-none">
          <ChevronRight className="w-6 h-6 animate-pulse" />
        </div>

        {/* Paso 5: Despacho */}
        <div 
          onClick={() => setSelectedStep('despacho')}
          className={`bg-slate-50 dark:bg-slate-950 border ${selectedStep === 'despacho' ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-slate-200 dark:border-slate-800'} hover:border-amber-500/50 cursor-pointer rounded-xl p-4 flex flex-col justify-between h-40 relative transition-all duration-200`}
        >
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

      {/* Panel Detallado Expandido */}
      {selectedStep && (
        <div className="mt-6 p-5 border border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 rounded-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 dark:bg-amber-500/20 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{stepDetails[selectedStep].title}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Estado: <span className="font-semibold text-slate-700 dark:text-slate-300">{stepDetails[selectedStep].estado}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedStep(null)}
              className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              Cerrar Detalle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {Object.entries(stepDetails[selectedStep]).map(([key, value]) => {
              if (key === 'title' || key === 'estado') return null;
              
              // Helper components for icons based on key
              let Icon = Info;
              if (key === 'eficiencia') Icon = Activity;
              if (key === 'tiempoCiclo' || key === 'tiempoCarguio') Icon = Clock;
              if (key === 'observaciones') Icon = FileText;
              if (key === 'combustible') Icon = Battery;
              if (key === 'consumoElectrico') Icon = Zap;
              if (key === 'estado') Icon = AlertTriangle;

              return (
                <div key={key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg flex gap-3 shadow-sm transition-colors">
                  <div className="mt-0.5 text-slate-400 dark:text-slate-500">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-0.5">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      {value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
