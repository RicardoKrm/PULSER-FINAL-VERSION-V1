const fs = require('fs');

const path = 'src/pages/produccion/ListaPorTurnos.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  ".from('produccion_registro_diario_mina')",
  ".from('produccion_registro_diario')"
);

fs.writeFileSync(path, code);
