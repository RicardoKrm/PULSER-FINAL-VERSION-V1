import React from 'react';
import { FileText } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
};

const mockContratos = [
  { id: '1', cliente: 'Minera Escondida', descripcion: 'CT1 • Transporte de personal interno', inicio: '2026-01-01', termino: '2026-12-31', valor: 50000000, activo: true },
  { id: '2', cliente: 'BHP Billiton', descripcion: 'CT2 • Carga sobredimensionada', inicio: '2026-03-01', termino: '2026-09-30', valor: 25000000, activo: true },
  { id: '3', cliente: 'Codelco', descripcion: 'CT3 • Transporte de insumos', inicio: '2026-02-15', termino: '2027-02-15', valor: 120000000, activo: true },
  { id: '4', cliente: 'Soprole', descripcion: 'CT4 • Distribución zona norte', inicio: '2025-06-01', termino: '2026-05-31', valor: 35000000, activo: true },
  { id: '5', cliente: 'CCU', descripcion: 'CT5 • Transporte interurbano', inicio: '2026-04-01', termino: '2026-10-31', valor: 18000000, activo: true },
];

export default function Contratos() {
  return (
    <div className="w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestión de Contratos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Administración de acuerdos comerciales y clientes.
          </p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2">
          Exportar Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Izquierda: Formulario nuevo contrato */}
        <div className="lg:col-span-4 xl:col-span-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Crear Nuevo Contrato</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cliente</label>
                <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Descripción</label>
                <textarea rows={4} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none text-slate-900 dark:text-white"></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha Inicio</label>
                  <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fecha Término</label>
                  <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Valor Total Estimado ($)</label>
                <input type="number" defaultValue={0} min={0} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white" />
              </div>

              <button className="w-full mt-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg transition-colors">
                Guardar Contrato
              </button>
            </div>
          </div>
        </div>

        {/* Derecha: Lista de Contratos */}
        <div className="lg:col-span-8 xl:col-span-7">
          <div className="flex justify-between items-center mb-6 px-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contratos Vigentes</h2>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="space-y-4">
            {mockContratos.map((contrato) => (
              <div key={contrato.id} className="border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-sm transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white leading-tight">{contrato.cliente}</h3>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold text-[10px] rounded flex items-center uppercase tracking-widest">
                    Activo
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{contrato.descripcion}</p>
                
                <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-xs text-slate-400">Inicio: <span className="text-slate-600 dark:text-slate-300 font-medium">{contrato.inicio}</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Término: <span className="text-slate-600 dark:text-slate-300 font-medium">{contrato.termino}</span></p>
                    </div>
                  </div>
                  <div className="font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="text-xs mr-1">$</span>
                    {contrato.valor.toLocaleString('es-CL')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-between items-center text-sm">
            <span className="text-slate-500">Página 1 de 2</span>
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
               <button className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">&lt;</button>
               <button className="px-3 py-1.5 bg-slate-900 dark:bg-indigo-600 text-white font-medium">1</button>
               <button className="px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium">2</button>
               <button className="px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">&gt;</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
