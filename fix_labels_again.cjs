const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

code = code.replace(
  'Supervisor / Día del Mes',
  'Supervisor Día / Supervisor Noche'
);

code = code.replace(
  /dia_mes/g,
  'supervisor_noche'
);

code = code.replace(
  'Día del Mes',
  'Supervisor Noche'
);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
