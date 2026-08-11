const fs = require('fs');
let content = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

content = content.replace("findCol(['TURNO_DIA', 'PLANTA']", "findCol(['TURNO_DIA', 'PLANTA', 'PRIMARIO']");
content = content.replace("findCol(['TURNO_NOCHE', 'PLANTA']", "findCol(['TURNO_NOCHE', 'PLANTA', 'PRIMARIO']");

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', content);
