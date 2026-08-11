const fs = require('fs');
let content = fs.readFileSync('src/pages/produccion/ReporteDiarioMinaPanel.tsx', 'utf-8');

// For Turno Dia Table
content = content.replace(
  /<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Cant\. CAEX<\/th>/g,
  `<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">CAEX (Nº)</th>`
);

content = content.replace(
  /<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{activeRow\.cantidad_caex_dia}<\/td>/g,
  `<td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-[200px] truncate" title={String(activeRow.caex_dia)}>
    <span className="font-semibold">{activeRow.cantidad_caex_dia}</span>
    {activeRow.caex_dia && <span className="text-slate-500 text-xs ml-1">({activeRow.caex_dia})</span>}
  </td>`
);

content = content.replace(
  /<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{activeRow\.operadores_dia}<\/td>/g,
  `<td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400 max-w-[250px] truncate" title={String(activeRow.operadores_dia)}>{activeRow.operadores_dia}</td>`
);

content = content.replace(
  /<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">\s*<span className="text-emerald-600 dark:text-emerald-400">{activeRow\.acopio_dia}<\/span> \/ <span className="text-blue-600 dark:text-blue-400">{activeRow\.planta_dia}<\/span>\s*<\/td>/g,
  `<td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
    <div className="flex flex-col">
      <div><span className="text-emerald-600 dark:text-emerald-400 font-medium">{activeRow.acopio_dia}</span> <span className="text-xs">Acopio</span></div>
      <div><span className="text-blue-600 dark:text-blue-400 font-medium">{activeRow.planta_dia}</span> <span className="text-xs">Planta</span></div>
    </div>
  </td>`
);

// For Turno Noche Table
content = content.replace(
  /<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{activeRow\.cantidad_caex_noche}<\/td>/g,
  `<td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-[200px] truncate" title={String(activeRow.caex_noche)}>
    <span className="font-semibold">{activeRow.cantidad_caex_noche}</span>
    {activeRow.caex_noche && <span className="text-slate-500 text-xs ml-1">({activeRow.caex_noche})</span>}
  </td>`
);

content = content.replace(
  /<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{activeRow\.operadores_noche}<\/td>/g,
  `<td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400 max-w-[250px] truncate" title={String(activeRow.operadores_noche)}>{activeRow.operadores_noche}</td>`
);

content = content.replace(
  /<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">\s*<span className="text-emerald-600 dark:text-emerald-400">{activeRow\.acopio_noche}<\/span> \/ <span className="text-blue-600 dark:text-blue-400">{activeRow\.planta_noche}<\/span>\s*<\/td>/g,
  `<td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
    <div className="flex flex-col">
      <div><span className="text-emerald-600 dark:text-emerald-400 font-medium">{activeRow.acopio_noche}</span> <span className="text-xs">Acopio</span></div>
      <div><span className="text-blue-600 dark:text-blue-400 font-medium">{activeRow.planta_noche}</span> <span className="text-xs">Planta</span></div>
    </div>
  </td>`
);


fs.writeFileSync('src/pages/produccion/ReporteDiarioMinaPanel.tsx', content);
