import fs from 'fs';
let content = fs.readFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', 'utf-8');
content = content.replace(
  'const { supervisorData, chartData, totalImperia, totalCMC, totalDiferencia } = useMemo(() => {',
  'console.log("Filtered Data:", filteredData.length, "filtroMes:", filtroMes, "total data:", data.length);\n  const { supervisorData, chartData, totalImperia, totalCMC, totalDiferencia } = useMemo(() => {'
);
fs.writeFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', content);
