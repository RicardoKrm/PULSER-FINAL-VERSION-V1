import fs from 'fs';

let content = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf8');

content = content.replace(/totals\.totalImperia/g, "totals.total_imperia");
content = content.replace(/totals\.totalCmc/g, "totals.total_cmc");
content = content.replace(/totals\.produccionDia/g, "totals.produccion_dia");
content = content.replace(/totals\.produccionNoche/g, "totals.produccion_noche");

// Fix border colors and text colors for totals.diferencia
content = content.replace(/border-l-emerald-500/g, "border-l-slate-500");
content = content.replace(/text-emerald-600 dark:text-emerald-400/g, "text-slate-900 dark:text-white");
content = content.replace(/\{totals\.diferencia > 0 \? '\+' : ''\}/g, "");

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', content, 'utf8');
