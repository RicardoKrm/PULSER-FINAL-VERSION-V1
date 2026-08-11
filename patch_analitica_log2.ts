import fs from 'fs';
let content = fs.readFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', 'utf-8');
content = content.replace(
  'if (records) {',
  'if (records) {\n        console.log("Records fetched:", records.length);'
);
fs.writeFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', content);
