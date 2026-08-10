const fs = require('fs');

const path = 'src/pages/produccion/ListaPorTurnos.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldLogic = `        // 1. Build a map of shift supervisors (fecha + turno -> supervisor name)
        const shiftSupervisors: Record<string, string> = {};
        rows.forEach(row => {
          if (row.equipo === 'SUPERVISOR_TURNO') {
            const shiftKey = \`\${row.fecha}_\${row.turno}\`;
            shiftSupervisors[shiftKey] = row.operador;
          }
        });

        // 2. Process all normal driver records
        rows.forEach(row => {
          if (!row.fecha || row.equipo === 'SUPERVISOR_TURNO' || !row.operador) return;
          
          const shiftKey = \`\${row.fecha}_\${row.turno}\`;
          const rowSup = shiftSupervisors[shiftKey] || 'Sin Supervisor Asignado';
          
          if (!groups[rowSup]) {
             groups[rowSup] = { id: rowSup, nombre: rowSup !== 'Sin Supervisor Asignado' ? \`Turno \${rowSup}\` : rowSup, supervisor: rowSup !== 'Sin Supervisor Asignado' ? rowSup : '', trabajadores: [] };
             dailyData[rowSup] = {};
          }

          // Accumulate vueltas and camiones
          const chofer = String(row.operador).trim();
          const fecha = String(row.fecha).trim();
          const camion = String(row.equipo || '').trim();
          
          if (!dailyData[rowSup][chofer]) {
            dailyData[rowSup][chofer] = { dates: {}, camiones: {} };
          }
          if (!dailyData[rowSup][chofer].dates[fecha]) {
            dailyData[rowSup][chofer].dates[fecha] = 0;
          }
          dailyData[rowSup][chofer].dates[fecha] += (Number(row.vueltas) || 0) + (Number(row.petroleo) || 0);
          
          if (camion) {
            dailyData[rowSup][chofer].camiones[camion] = (dailyData[rowSup][chofer].camiones[camion] || 0) + 1;
          }
        });`;

const newLogic = `        rows.forEach(row => {
          if (!row.fecha || !row.chofer) return;

          let rowSup = 'Sin Supervisor Asignado';
          if (row.novedades) {
            const novs = row.novedades.split('|');
            for (const nov of novs) {
              if (nov.includes('Firma (Ingreso Manual):')) {
                rowSup = nov.split('Firma (Ingreso Manual):')[1]?.trim() || rowSup;
              } else if (nov.includes('Supervisor:')) {
                rowSup = nov.split('Supervisor:')[1]?.trim() || rowSup;
              }
            }
          }
          
          if (!groups[rowSup]) {
             groups[rowSup] = { id: rowSup, nombre: rowSup !== 'Sin Supervisor Asignado' ? \`Turno \${rowSup}\` : rowSup, supervisor: rowSup !== 'Sin Supervisor Asignado' ? rowSup : '', trabajadores: [] };
             dailyData[rowSup] = {};
          }

          // Accumulate vueltas and camiones
          const chofer = String(row.chofer).trim();
          const fecha = String(row.fecha).trim();
          const camion = String(row.camion || '').trim();
          
          if (!dailyData[rowSup][chofer]) {
            dailyData[rowSup][chofer] = { dates: {}, camiones: {} };
          }
          if (!dailyData[rowSup][chofer].dates[fecha]) {
            dailyData[rowSup][chofer].dates[fecha] = 0;
          }
          dailyData[rowSup][chofer].dates[fecha] += (Number(row.vueltas) || 0) + (Number(row.petroleo) || 0);
          
          if (camion) {
            dailyData[rowSup][chofer].camiones[camion] = (dailyData[rowSup][chofer].camiones[camion] || 0) + 1;
          }
        });`;

if (code.includes(oldLogic)) {
  code = code.replace(oldLogic, newLogic);
  fs.writeFileSync(path, code);
  console.log("Patched!");
} else {
  console.log("Could not find oldLogic");
}
