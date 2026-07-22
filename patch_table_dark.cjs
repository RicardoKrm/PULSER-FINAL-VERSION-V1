const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // selectedDateId buttons
  content = content.replace(
    /'bg-blue-50 text-blue-700 font-medium border border-blue-200'/,
    "'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800/50'"
  );
  content = content.replace(
    /'text-gray-600 hover:bg-gray-50 border border-transparent'/,
    "'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'"
  );

  // Card text colors
  content = content.replace(/text-gray-900/g, 'text-gray-900 dark:text-white');
  content = content.replace(/text-gray-800/g, 'text-gray-800 dark:text-slate-200');
  content = content.replace(/text-gray-700/g, 'text-gray-700 dark:text-slate-300');
  content = content.replace(/text-gray-600/g, 'text-gray-600 dark:text-slate-400');
  content = content.replace(/text-gray-500/g, 'text-gray-500 dark:text-slate-500');

  // Borders
  content = content.replace(/divide-gray-200/g, 'divide-gray-200 dark:divide-slate-700');
  content = content.replace(/border-gray-200/g, 'border-gray-200 dark:border-slate-700');
  
  // Table head
  content = content.replace(/bg-gray-50/g, 'bg-gray-50 dark:bg-slate-800');
  content = content.replace(/bg-gray-100/g, 'bg-gray-100 dark:bg-slate-800');

  // Novedades alert
  content = content.replace(/bg-yellow-50/g, 'bg-yellow-50 dark:bg-amber-900/20');
  content = content.replace(/text-yellow-800/g, 'text-yellow-800 dark:text-amber-400');
  content = content.replace(/border-yellow-200/g, 'border-yellow-200 dark:border-amber-800/50');
  content = content.replace(/text-yellow-700/g, 'text-yellow-700 dark:text-amber-300');
  
  // Detalle Vueltas background
  content = content.replace(/bg-gray-50\/80/g, 'bg-gray-50/80 dark:bg-slate-800/50');
  content = content.replace(/bg-white px-3/g, 'bg-white dark:bg-slate-800 px-3');

  // Fix up duplicate dark classes in case they were already there
  content = content.replace(/dark:text-white dark:text-white/g, 'dark:text-white');
  content = content.replace(/dark:text-slate-300 dark:text-slate-300/g, 'dark:text-slate-300');
  content = content.replace(/dark:text-slate-400 dark:text-slate-400/g, 'dark:text-slate-400');
  content = content.replace(/dark:text-slate-500 dark:text-slate-500/g, 'dark:text-slate-500');
  content = content.replace(/dark:bg-slate-800 dark:bg-slate-800/g, 'dark:bg-slate-800');
  content = content.replace(/dark:border-slate-700 dark:border-slate-700/g, 'dark:border-slate-700');

  fs.writeFileSync(file, content);
}

patchFile('src/pages/produccion/ReporteDiarioPanel.tsx');
patchFile('src/pages/produccion/ReporteDiarioMinaPanel.tsx');

