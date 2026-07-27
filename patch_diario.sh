cat << 'INNER' > patch.cjs
const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/ReporteDiarioPanel.tsx', 'utf8');

code = code.replace(
  "let headerRowIndex = -1;\n      for (let i = 0; i < data.length; i++) {\n        if (data[i] && data[i].some(cell => String(cell).toUpperCase().includes('NOMBRE') || String(cell).toUpperCase().includes('CONDUCTOR'))) {\n           headerRowIndex = i;\n           break;\n        }\n      }",
  "let headerRowIndex = -1;\n      let supervisorColIndex = -1;\n      for (let i = 0; i < data.length; i++) {\n        if (data[i] && data[i].some(cell => String(cell).toUpperCase().includes('NOMBRE') || String(cell).toUpperCase().includes('CONDUCTOR'))) {\n           headerRowIndex = i;\n           supervisorColIndex = data[i].findIndex(cell => String(cell).toUpperCase().includes('SUPERVISOR'));\n           break;\n        }\n      }"
);

code = code.replace(
  "payloadData.push({\n             fecha: globalDate,\n             turno: globalTurno,\n             camion: String(n_camion || ''),\n             chofer: String(conductor || ''),\n             tonelaje: totalTons || 0,\n             vueltas: totalVueltas || 0,\n             petroleo: null,\n             vueltas_detalle: vueltas_detalle\n          });",
  "let supervisorVal = '';\n         if (supervisorColIndex !== -1 && row[supervisorColIndex]) {\n             supervisorVal = String(row[supervisorColIndex]);\n         }\n\n         payloadData.push({\n             fecha: globalDate,\n             turno: globalTurno,\n             camion: String(n_camion || ''),\n             chofer: String(conductor || ''),\n             tonelaje: totalTons || 0,\n             vueltas: totalVueltas || 0,\n             novedades: supervisorVal ? `Supervisor: ${supervisorVal}` : '',\n             petroleo: null,\n             vueltas_detalle: vueltas_detalle\n          });"
);

fs.writeFileSync('src/pages/produccion/ReporteDiarioPanel.tsx', code);
INNER
node patch.cjs
