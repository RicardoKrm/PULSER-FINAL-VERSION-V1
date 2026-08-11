const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

code = code.replace(
  "const n_caex_planta = findCol(['TURNO_NOCHE', 'CAEX_PLANTA'], 25);",
  "const n_caex_planta = findCol(['TURNO_NOCHE', 'CAEX_PLANTA'], 25);\n        const n_vueltas = findCol(['TURNO_NOCHE', 'VUELTAS'], 26);"
);

code = code.replace(
  "vueltas_noche: 0,",
  "vueltas_noche: getNum(row[n_vueltas]),"
);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
