const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/HorasMaquinaPage.tsx', 'utf-8');

const importLogic = `        // Save imported records (replace previous records with complete Excel dataset)
        await saveAllHorasMaquina(result.records);
        setRecords(result.records);

        if (result.records.length > 0) {
          const sampleDate = new Date(result.records[0].fecha + 'T12:00:00');
          if (!isNaN(sampleDate.getTime())) {
            setSelectedYear(sampleDate.getFullYear());
            setSelectedMonth(sampleDate.getMonth() + 1);
            setDateFilterType('mes');
          }
        }

        const sheetsMsg = result.sheetsProcessed.length > 0 ? \` de \${result.sheetsProcessed.length} hoja(s) [\${result.sheetsProcessed.join(', ')}]\` : '';`;

code = code.replace(
    `        // Save imported records (replace previous records with complete Excel dataset)\n        await saveAllHorasMaquina(result.records);\n        setRecords(result.records);\n\n        const sheetsMsg`,
    importLogic
);

fs.writeFileSync('src/pages/produccion/HorasMaquinaPage.tsx', code);
