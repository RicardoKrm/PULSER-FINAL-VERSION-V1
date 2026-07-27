const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/ReporteDiarioPanel.tsx', 'utf8');

code = code.replace(
  "         payloadData.push({\n             fecha: globalDate,\n             turno: globalTurno,\n             camion: String(n_camion || ''),\n             chofer: String(conductor || ''),\n             tonelaje: totalTons || 0,\n             vueltas: totalVueltas || 0,\n             vueltas_detalle: vueltas_detalle,\n             petroleo: null\n         });",
  "         let supervisorVal = '';\n         if (supervisorColIndex !== -1 && row[supervisorColIndex]) {\n             supervisorVal = String(row[supervisorColIndex]);\n         }\n\n         payloadData.push({\n             fecha: globalDate,\n             turno: globalTurno,\n             camion: String(n_camion || ''),\n             chofer: String(conductor || ''),\n             tonelaje: totalTons || 0,\n             vueltas: totalVueltas || 0,\n             vueltas_detalle: vueltas_detalle,\n             petroleo: null,\n             novedades: supervisorVal ? `Supervisor: ${supervisorVal}` : ''\n         });"
);

fs.writeFileSync('src/pages/produccion/ReporteDiarioPanel.tsx', code);
