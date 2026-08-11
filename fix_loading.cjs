const fs = require('fs');
let code = fs.readFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', 'utf-8');
code = code.replace(
  "if (!currentCompany) return;",
  "if (!currentCompany) { setLoading(false); return; }"
);
fs.writeFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', code);
