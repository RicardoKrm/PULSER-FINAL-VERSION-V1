const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/ListaPorTurnos.tsx', 'utf8');

const regexToReplace = /const dailyData: Record<string, Record<string, Record<string, number>>> = \{\};[\s\S]*?const finalTurnos = Object\.values\(groups\)\.map\(group => \{[\s\S]*?group\.trabajadores\.push\(\{[\s\S]*?id: \`9\$\{\w+\}\`[^\}]*?\}\);[\s\S]*?seq\+\+;/m;

const newLogic = `
        const dailyData: Record<string, Record<string, { dates: Record<string, number>, camiones: Record<string, number> }>> = {};

        data.forEach(row => {
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
          dailyData[rowSup][chofer].dates[fecha] += (Number(row.vueltas) || 0);
          
          if (camion) {
            dailyData[rowSup][chofer].camiones[camion] = (dailyData[rowSup][chofer].camiones[camion] || 0) + 1;
          }
        });

        // Compute workers
        const finalTurnos = Object.values(groups).map(group => {
          for (const chofer in dailyData[group.id]) {
             const dataForChofer = dailyData[group.id][chofer];
             let total = 0;
             let d4 = 0;
             let d5 = 0;
             let d6 = 0;
             
             for (const fecha in dataForChofer.dates) {
                const v = dataForChofer.dates[fecha];
                total += v;
                
                const vInt = Math.round(v);
                if (vInt === 4) d4++;
                if (vInt === 5) d5++;
                if (vInt === 6) d6++;
             }
             
             let mostFrequentCamion = '-';
             let maxCamionCount = 0;
             for (const camion in dataForChofer.camiones) {
                 if (dataForChofer.camiones[camion] > maxCamionCount) {
                     maxCamionCount = dataForChofer.camiones[camion];
                     mostFrequentCamion = camion;
                 }
             }
             
             group.trabajadores.push({
                id: mostFrequentCamion,
                nombre: chofer,
                cargo: 'Conductor',
                vueltasTotales: Number(total.toFixed(2)),
                dias4V: d4,
                dias5V: d5,
                dias6V: d6
             });
`;

let replaced = false;
code = code.replace(
  /const dailyData: Record<string, Record<string, Record<string, number>>> = \{\};[\s\S]*?const finalTurnos = Object\.values\(groups\)\.map\(group => \{[\s\S]*?let seq = 1;\s*for \(const chofer in dailyData\[group\.id\]\) \{[\s\S]*?groups\[turnoId\]\.trabajadores\.push/m, // Wait, it's group.trabajadores.push
  (match) => { return match; } // We need a more reliable replace
);

code = code.replace(
  /const dailyData: Record[\s\S]*?seq\+\+;/m,
  newLogic.trim()
);

fs.writeFileSync('src/pages/produccion/ListaPorTurnos.tsx', code);
