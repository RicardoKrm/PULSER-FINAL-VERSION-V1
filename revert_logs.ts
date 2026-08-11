import fs from 'fs';
let content = fs.readFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', 'utf-8');
content = content.replace('if (records) {\\n        console.log("Records fetched:", records.length);', 'if (records) {');
content = content.replace('console.log("Filtered Data:", filteredData.length, "filtroMes:", filtroMes, "total data:", data.length);\\n  const { supervisorData, chartData, totalImperia, totalCMC, totalDiferencia } = useMemo(() => {', 'const { supervisorData, chartData, totalImperia, totalCMC, totalDiferencia } = useMemo(() => {');
content = content.replace('console.log("FilteredData length:", filteredData.length, "tImperia:", tImperia);\\n    return { ', 'return { ');
fs.writeFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', content);
