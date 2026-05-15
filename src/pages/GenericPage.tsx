import React from 'react';
import { useLocation } from 'react-router-dom';
import { navigation } from '../config/navigation';

export default function GenericPage() {
  const location = useLocation();
  const path = location.pathname;

  // Find module info based on path
  let moduleTitle = 'Módulo';
  let pageTitle = 'Página en Desarrollo';
  let PageIcon = null;

  navigation.forEach(mod => {
    if (path.startsWith(mod.href)) {
      moduleTitle = mod.title;
      PageIcon = mod.icon;
      const sub = mod.submodules?.find(s => s.href === path);
      if (sub) {
        pageTitle = sub.title;
      } else if (path === mod.href) {
        pageTitle = mod.title;
      }
    }
  });

  return (
    <div className="flex flex-col h-full items-center justify-center text-center max-w-2xl mx-auto py-20">
      <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6 transition-colors">
        {PageIcon ? <PageIcon className="h-16 w-16 text-slate-400 dark:text-slate-500" /> : <div className="h-16 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />}
      </div>
      <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase mb-2">{moduleTitle}</h2>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">{pageTitle}</h1>
      <p className="text-slate-500 dark:text-slate-400 text-lg mb-8">
        Esta sección se encuentra actualmente en desarrollo estructurado. Aquí se implementarán las funcionalidades correspondientes al módulo del sistema TMS PULSER.
      </p>
      <button 
        onClick={() => window.history.back()}
        className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-lg font-medium transition-colors"
      >
        Volver Atrás
      </button>
    </div>
  );
}
