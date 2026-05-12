import React from 'react';
import { Construction } from 'lucide-react';

export default function Reservas() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Reservas
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
          Gestión de reservas de servicios y asignación previa de recursos.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center justify-center text-center h-[60vh]">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6">
          <Construction className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Módulo en Construcción</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          El panel de Reservas se encuentra en desarrollo. Aquí podrás agendar futuros servicios y reservar la flota y personal necesario.
        </p>
      </div>
    </div>
  );
}
