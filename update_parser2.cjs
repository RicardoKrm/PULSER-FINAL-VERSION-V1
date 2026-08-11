const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

code = code.replace(
  "const colSup = findCol(['SUPERVISOR'], 1);",
  "const colSup = findCol(['SUPERVISOR', 'DIA'], 1);"
);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
