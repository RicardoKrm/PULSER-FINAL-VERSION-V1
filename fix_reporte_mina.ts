import fs from 'fs';

const path = 'src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Import useProduccion
if (!code.includes('useProduccion')) {
    code = code.replace(
        "import { supabase } from '../../../lib/supabase';",
        "import { supabase } from '../../../lib/supabase';\nimport { useProduccion } from '../../../contexts/ProduccionContext';"
    );
}

// 2. Extract metas inside component
if (!code.includes('const { metas } = useProduccion();')) {
    code = code.replace(
        "export default function ReporteYAnaliticaMina() {",
        "export default function ReporteYAnaliticaMina() {\n  const { metas } = useProduccion();"
    );
}

// 3. Fix KPI Calculations
code = code.replace(
    "const caexUtilizados = new Set(filteredData.filter(r => r.equipo && r.equipo.toUpperCase().includes('CAEX')).map(r => r.equipo)).size;",
    `const caexUtilizados = new Set(filteredData.filter(r => r.equipo && r.equipo.toUpperCase().includes('CAEX')).map(r => r.equipo)).size;
  
  // Real Cumplimiento based on meta
  // If a specific month is selected, we use monthly meta, otherwise just a reference or sum of daily metas
  const metaToneladas = filtroMes !== 'todos' ? metas.minaMonthly : metas.minaMonthly * 12; // Simplification
  const cumplimiento = metaToneladas > 0 ? (totalToneladas / metaToneladas) * 100 : 0;`
);

// 4. Update the Cumplimiento UI
code = code.replace(
    /<p className="text-xs font-bold text-slate-500 uppercase">Cumplimiento \(Ref\)<\/p>\s*<p className="text-2xl font-black text-slate-800 dark:text-white mt-1">98%<\/p>/,
    `<p className="text-xs font-bold text-slate-500 uppercase">Cumplimiento</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{cumplimiento.toFixed(1)}%</p>`
);

// 5. Update TabProduccion to accept metas
code = code.replace(
    /TabProduccion data=\{filteredData\} formatNumber=\{formatNumber\} \/>/,
    `TabProduccion data={filteredData} formatNumber={formatNumber} meta={metaToneladas} cumplimiento={cumplimiento} />`
);

code = code.replace(
    /function TabProduccion\(\{ data, formatNumber \}: \{ data: any\[\], formatNumber: \(n: number\) => string \}\) \{/,
    `function TabProduccion({ data, formatNumber, meta, cumplimiento }: { data: any[], formatNumber: (n: number) => string, meta: number, cumplimiento: number }) {`
);

// 6. Update Meta display in TabProduccion
code = code.replace(
    /<h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase mb-4">Producción Acumulada vs Meta \(Referencial\)<\/h3>/,
    `<h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase mb-4">Producción Acumulada vs Meta</h3>`
);

code = code.replace(
    /<div className="absolute top-0 bottom-0 left-0 bg-emerald-500" style=\{\{ width: '85%' \}\}><\/div>/,
    `<div className="absolute top-0 bottom-0 left-0 bg-emerald-500" style={{ width: \`\${Math.min(cumplimiento, 100)}%\` }}></div>`
);

code = code.replace(
    /<span className="text-lg font-black text-slate-800 dark:text-white">85%<\/span>/,
    `<span className="text-lg font-black text-slate-800 dark:text-white">{cumplimiento.toFixed(1)}%</span>`
);

code = code.replace(
    /<span>Meta: \{formatNumber\(100000\)\} T<\/span>/,
    `<span>Meta: {formatNumber(meta)} T</span>`
);

// 7. Update TabGestion to accept data and calculate projection
code = code.replace(
    /TabGestion data=\{filteredData\} formatNumber=\{formatNumber\} \/>/,
    `TabGestion data={filteredData} formatNumber={formatNumber} totalToneladas={totalToneladas} />`
);

code = code.replace(
    /function TabGestion\(\{ data, formatNumber \}: \{ data: any\[\], formatNumber: \(n: number\) => string \}\) \{/,
    `function TabGestion({ data, formatNumber, totalToneladas }: { data: any[], formatNumber: (n: number) => string, totalToneladas: number }) {`
);

// Generate Projection
code = code.replace(
    /const concilData = useMemo/,
    `const { metas } = useProduccion();
  
  // Calculate Proyección
  const proyeccion = useMemo(() => {
    // Basic projection: Avg daily tons * 30 days
    const uniqueDays = new Set(data.map(d => d.fecha).filter(Boolean)).size;
    if (uniqueDays === 0) return 0;
    const avgDaily = totalToneladas / uniqueDays;
    return avgDaily * 30; // approx 30 days in month
  }, [data, totalToneladas]);

  const concilData = useMemo`
);

code = code.replace(
    /<p className="text-2xl font-black text-blue-600 mt-1">101.400 <span className="text-sm font-normal text-slate-500">Ton \(Ref\)<\/span><\/p>/,
    `<p className="text-2xl font-black text-blue-600 mt-1">{formatNumber(proyeccion)} <span className="text-sm font-normal text-slate-500">Ton (Proy)</span></p>`
);


fs.writeFileSync(path, code);
