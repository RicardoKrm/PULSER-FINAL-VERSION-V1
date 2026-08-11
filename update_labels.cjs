const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

code = code.replace(
  '<th className="px-6 py-4 font-semibold">Supervisor / Día del Mes</th>',
  '<th className="px-6 py-4 font-semibold">Supervisor Día / Supervisor Noche</th>'
);

code = code.replace(
  '<th className="px-4 py-3 font-semibold">Día del Mes</th>',
  '<th className="px-4 py-3 font-semibold">Supervisor Noche</th>'
);

// We can also update the parser fallback for colDiaMes
code = code.replace(
  "const colDiaMes = findCol(['DIA_MES'], 2);",
  "const colDiaMes = findCol(['SUPERVISOR', 'NOCHE'], 2);"
);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
