import React, { useState } from 'react';
import { BookOpen, MonitorPlay, FileText, ChevronRight, Search, PlayCircle } from 'lucide-react';

const MODULES = [
  {
    id: 'dashboard',
    title: 'Dashboard & Estrategia',
    description: 'Aprende a interpretar los KPIs y gráficos de tu flota operativa.',
    duration: '5 min',
  },
  {
    id: 'mantenimiento',
    title: 'Pizarra de Mantenimiento',
    description: 'Guía paso a paso para gestionar vehículos y estados.',
    duration: '10 min',
  },
  {
    id: 'operaciones',
    title: 'Operaciones',
    description: 'Solicitudes, servicios y control documental.',
    duration: '15 min',
  },
  {
    id: 'logistica',
    title: 'Logística',
    description: 'Manejo de inventario, bodega y suministros.',
    duration: '8 min',
  },
];

export default function ManualUso() {
  const [activeModule, setActiveModule] = useState(MODULES[0].id);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Manual de Uso</h1>
          <p className="text-indigo-100 max-w-xl">Domina todas las funcionalidades del sistema con nuestras guías interactivas, documentación detallada y videotutoriales.</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500 to-transparent flex items-center justify-center opacity-50">
          <BookOpen className="w-48 h-48 text-white transform rotate-12 translate-x-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar en el manual..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Módulos</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {MODULES.map((mod) => (
                <button 
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex justify-between items-center ${activeModule === mod.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}`}
                >
                  <span className={`font-medium text-sm ${activeModule === mod.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>{mod.title}</span>
                  <ChevronRight className={`w-4 h-4 ${activeModule === mod.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <MonitorPlay className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {MODULES.find(m => m.id === activeModule)?.title}
                </h2>
                <p className="text-sm text-slate-500">
                  {MODULES.find(m => m.id === activeModule)?.description}
                </p>
              </div>
            </div>

            <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden group mb-8 shadow-inner">
              <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
              <button className="relative z-10 w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all transform group-hover:scale-110">
                <PlayCircle className="w-10 h-10 text-white" />
              </button>
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-bold font-mono">
                {MODULES.find(m => m.id === activeModule)?.duration}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Instrucciones Paso a Paso
              </h3>
              
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p>
                  Bienvenido al módulo de <strong>{MODULES.find(m => m.id === activeModule)?.title}</strong>. 
                  En esta sección detallaremos las principales acciones que puedes realizar para maximizar 
                  el uso de nuestra plataforma.
                </p>
                <h4>1. Acceso a la sección</h4>
                <p>Navega a través del menú lateral izquierdo y selecciona la opción correspondiente para abrir la vista principal.</p>
                <h4>2. Uso de Filtros</h4>
                <p>Utiliza la barra superior para buscar y filtrar la información. Los filtros varían según el módulo pero generalmente incluyen rangos de fecha y estados.</p>
                <h4>3. Extracción de Reportes</h4>
                <p>La mayoría de las tablas cuentan con un botón de "Exportar" en la esquina superior derecha que permite generar archivos CSV o Excel.</p>
                
                <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-r mt-6 text-indigo-900 pb-2">
                  <h5 className="font-bold mb-1 mt-0">Consejo Pro</h5>
                  <p className="text-sm">Si tienes dudas adicionales, puedes presionar el botón "Ayuda" en la parte inferior derecha o crear un ticket en el Centro de Ayuda.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
