const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/ListaPorTurnos.tsx', 'utf8');

const regexToReplace = /const groups: Record<string, TurnoInfo> = {[\s\S]*?setTurnos\(\[groups\['A'\], groups\['B'\], groups\['C'\], groups\['D'\]\]\);/m;

const newLogic = `
        const groups: Record<string, TurnoInfo> = {};
        const dailyData: Record<string, Record<string, Record<string, number>>> = {};

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

          // Accumulate vueltas
          const chofer = String(row.chofer).trim();
          const fecha = String(row.fecha).trim();
          if (!dailyData[rowSup][chofer]) {
            dailyData[rowSup][chofer] = {};
          }
          if (!dailyData[rowSup][chofer][fecha]) {
            dailyData[rowSup][chofer][fecha] = 0;
          }
          dailyData[rowSup][chofer][fecha] += (Number(row.vueltas) || 0);
        });

        // Compute workers
        const finalTurnos = Object.values(groups).map(group => {
          let seq = 1;
          for (const chofer in dailyData[group.id]) {
             const dates = dailyData[group.id][chofer];
             let total = 0;
             let d4 = 0;
             let d5 = 0;
             let d6 = 0;
             
             for (const fecha in dates) {
                const v = dates[fecha];
                total += v;
                
                const vInt = Math.round(v);
                if (vInt === 4) d4++;
                if (vInt === 5) d5++;
                if (vInt === 6) d6++;
             }
             
             group.trabajadores.push({
                id: \`9\${String(seq).padStart(2, '0')}\`,
                nombre: chofer,
                cargo: 'Conductor',
                vueltasTotales: Number(total.toFixed(2)),
                dias4V: d4,
                dias5V: d5,
                dias6V: d6
             });
             seq++;
          }
          
          // Sort workers alphabetically
          group.trabajadores.sort((a, b) => a.nombre.localeCompare(b.nombre));
          
          return group;
        });
        
        // Put "Sin Supervisor Asignado" at the end if it exists
        finalTurnos.sort((a, b) => {
           if (a.id === 'Sin Supervisor Asignado') return 1;
           if (b.id === 'Sin Supervisor Asignado') return -1;
           return a.nombre.localeCompare(b.nombre);
        });

        setTurnos(finalTurnos);
`;

code = code.replace(regexToReplace, newLogic.trim());

fs.writeFileSync('src/pages/produccion/ListaPorTurnos.tsx', code);
