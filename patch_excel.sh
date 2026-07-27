cat << 'INNER' > patch.cjs
const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/ReporteDiarioPanel.tsx', 'utf8');

code = code.replace(
  "const novedadesVal = getVal('novedad') || getVal('totales');",
  "const novedadesVal = getVal('novedad') || getVal('totales');\n        const supervisorVal = getVal('supervis');\n        \n        let nStr = String(novedadesVal || '');\n        if (supervisorVal) {\n           nStr = nStr ? `${nStr} | Supervisor: ${supervisorVal}` : `Supervisor: ${supervisorVal}`;\n        }"
);

code = code.replace(
  "novedades: String(novedadesVal || ''),",
  "novedades: nStr,"
);

fs.writeFileSync('src/pages/produccion/ReporteDiarioPanel.tsx', code);
INNER
node patch.cjs
