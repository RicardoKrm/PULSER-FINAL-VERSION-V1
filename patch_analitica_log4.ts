import fs from 'fs';
let content = fs.readFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', 'utf-8');
content = content.replace(
  '<div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center">',
  '<div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center">\n        <div className="text-red-500 text-xs">Debug: data={data.length}, filtered={filteredData.length}, fMes={filtroMes}</div>'
);
fs.writeFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', content);
