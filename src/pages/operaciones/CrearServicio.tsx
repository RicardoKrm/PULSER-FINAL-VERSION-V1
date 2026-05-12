import React, { useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CrearServicio() {
  return (
    <div className="w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Panel de Creación de Servicio (PCS)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Tipificación, control y programación dinámica de carga.
          </p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
          Exportar Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Izquierda: Formulario nuevo servicio */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 xl:p-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Nuevo Servicio</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contrato Asociado (Opcional)</label>
                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                  <option>Sin contrato especifico</option>
                  <option>Minera Escondida - CT1</option>
                  <option>BHP Billiton - CT2</option>
                  <option>Codelco - CT3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo de Carga</label>
                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                  <option>General / Logística</option>
                  <option>Peligrosa / MATPEL</option>
                  <option>Sobredimensionada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subtipo</label>
                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                  <option>Interprovincial</option>
                  <option>Urbano</option>
                  <option>Internacional</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Origen</label>
                  <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Destino</label>
                  <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha y Hora</label>
                <div className="relative">
                  <input type="datetime-local" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Asignación de Conductor</label>
                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all mb-1">
                  <option value="" disabled selected>Seleccione conductor...</option>
                  <option>Juan Pérez (Disponible)</option>
                  <option>Carlos Silva (En ruta)</option>
                </select>
                <p className="text-xs text-slate-500">Si selecciona un conductor bloqueado, el sistema rechazará la orden.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Asignación de Unidad</label>
                <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                  <option value="" disabled selected>Seleccione unidad...</option>
                  <option>Camión 01 (Patente: AB-CD-12)</option>
                  <option>Camión 02 (Patente: EF-GH-34)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ingreso Proyectado ($)</label>
                  <input type="number" defaultValue={0} min={0} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Costo Proyectado ($)</label>
                  <input type="number" defaultValue={0} min={0} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                </div>
              </div>

              <button className="w-full mt-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg transition-colors">
                Crear Orden de Servicio
              </button>
            </div>
          </div>
        </div>

        {/* Derecha: Validaciones en Tiempo Real */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Validaciones en Tiempo Real</h2>
            
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex gap-3">
                  <div className="mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Sincronización de Altitud</h4>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      Si el servicio es "Interno Mina", el sistema filtra automáticamente personal con examen de altura vigente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex gap-3">
                  <div className="mt-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Programación Cruzada (Anticolisión)</h4>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      Bloquea la programación si la unidad tiene mantención preventiva agendada en Lion Fix.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex gap-3">
                  <div className="mt-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Bloqueo Preventivo</h4>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      Impide utilizar recursos con documentación fuera de regla (GDC).
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
