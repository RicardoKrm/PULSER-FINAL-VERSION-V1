const fs = require('fs');

const files = [
  'src/pages/flota/GestionPautas.tsx',
  'src/pages/flota/GestionTareas.tsx',
  'src/pages/herramientas/GestionKits.tsx',
  'src/pages/configuracion/GestionFallas.tsx',
  'src/pages/configuracion/GestionPausas.tsx',
  'src/pages/dashboard/PanelTco.tsx',
  'src/pages/flota/Mantenimiento.tsx',
  'src/pages/flota/OrdenesTrabajo.tsx',
  'src/pages/flota/OrdenesTrabajoDetail.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let text = fs.readFileSync(file, 'utf8');

    // Fix divide
    text = text.replace(/divide-slate-100(?!.*dark:divide-)/g, 'divide-slate-100 dark:divide-slate-800');
    // Fix hover rows
    text = text.replace(/hover:bg-slate-50(?!.*dark:hover:)/g, 'hover:bg-slate-50 dark:hover:bg-slate-800/50');
    // Fix text
    text = text.replace(/text-slate-900(?!.*dark:text-)/g, 'text-slate-900 dark:text-slate-100');
    text = text.replace(/text-slate-800(?!.*dark:text-)/g, 'text-slate-800 dark:text-slate-200');
    text = text.replace(/text-slate-700(?!.*dark:text-)/g, 'text-slate-700 dark:text-slate-300');
    text = text.replace(/text-slate-600(?!.*dark:text-)/g, 'text-slate-600 dark:text-slate-400');
    text = text.replace(/text-slate-500(?!.*dark:text-)/g, 'text-slate-500 dark:text-slate-400');
    // Fix bg class missing dark
    text = text.replace(/bg-slate-50(?!.*dark:bg-)/g, 'bg-slate-50 dark:bg-slate-900/50');
    text = text.replace(/bg-white(?!.*dark:bg-)/g, 'bg-white dark:bg-slate-900');
    
    // Form elements
    text = text.replace(/border-slate-200(?!.*dark:border-)/g, 'border-slate-200 dark:border-slate-800');
    text = text.replace(/border rounded(?!.*dark:border-)/g, 'border dark:border-slate-800 rounded');
    text = text.replace(/border rounded-md(?!.*dark:border-)/g, 'border rounded-md dark:border-slate-800');
    text = text.replace(/border-b(?!.*dark:border-)/g, 'border-b dark:border-slate-800');

    fs.writeFileSync(file, text);
    console.log("Updated tables in:", file);
  }
});
