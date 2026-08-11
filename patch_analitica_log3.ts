import fs from 'fs';
let content = fs.readFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', 'utf-8');
content = content.replace(
  'return { \n      supervisorData: sData, \n      chartData: cData,\n      totalImperia: tImperia,\n      totalCMC: tCMC,\n      totalDiferencia: tDif\n    };',
  'console.log("FilteredData length:", filteredData.length, "tImperia:", tImperia);\n    return { \n      supervisorData: sData, \n      chartData: cData,\n      totalImperia: tImperia,\n      totalCMC: tCMC,\n      totalDiferencia: tDif\n    };'
);
fs.writeFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', content);
