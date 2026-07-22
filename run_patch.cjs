const fs = require('fs');

let content = fs.readFileSync('src/pages/operaciones/produccion/ReporteYAnalitica.tsx', 'utf8');

content = content.replace(
  /const \[chartDataChofer, setChartDataChofer\] = useState<\{name: string, vueltas: number, tonelaje: number\}\[\]>\(\[\]\);/,
  'const [chartDataChofer, setChartDataChofer] = useState<{name: string, vueltas: number, tonelaje: number, choferes?: Record<string, number>}[]>([]);'
);

content = content.replace(
  /const \[chartDataCamion, setChartDataCamion\] = useState<\{name: string, vueltas: number, tonelaje: number\}\[\]>\(\[\]\);/,
  'const [chartDataCamion, setChartDataCamion] = useState<{name: string, vueltas: number, tonelaje: number, choferes?: Record<string, number>}[]>([]);'
);

content = content.replace(
  /const camionMap: Record<string, \{vueltas: number, tonelaje: number\}> = \{\};/,
  'const camionMap: Record<string, {vueltas: number, tonelaje: number, choferes: Record<string, number>}> = {};'
);

content = content.replace(
  /if \(!camionMap\[camion\]\) camionMap\[camion\] = \{ vueltas: 0, tonelaje: 0 \};/,
  'if (!camionMap[camion]) camionMap[camion] = { vueltas: 0, tonelaje: 0, choferes: {} };'
);

content = content.replace(
  /camionMap\[camion\].tonelaje \+= ton;/,
  'camionMap[camion].tonelaje += ton;\n        if (chofer && chofer !== "-") {\n            camionMap[camion].choferes[chofer] = (camionMap[camion].choferes[chofer] || 0) + ton;\n        }'
);

const tooltipReplacement = `                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-lg shadow-md text-xs">
                          <p className="font-bold mb-2 text-slate-800 dark:text-slate-100">{label}</p>
                          <div className="flex flex-col gap-1">
                            <p className="text-blue-600 dark:text-blue-400 font-semibold">Tonelaje: {data.tonelaje?.toFixed(2)} T</p>
                            <p className="text-amber-500 font-semibold">Vueltas: {data.vueltas}</p>
                            {data.choferes && Object.keys(data.choferes).length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">Choferes:</p>
                                {Object.entries(data.choferes).sort((a: any, b: any) => b[1] - a[1]).map(([chofer, ton]: any) => (
                                  <p key={chofer} className="text-slate-500 dark:text-slate-400 flex justify-between gap-4">
                                    <span>• {chofer}</span><span className="font-medium text-slate-700 dark:text-slate-200">{ton.toFixed(2)} T</span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />`;

content = content.replace(
  /<Tooltip\s+cursor=\{\{\s*fill:\s*'rgba\(59,\s*130,\s*246,\s*0\.05\)'\s*\}\}\s+contentStyle=\{\{.*\}\}\s+itemStyle=\{\{.*\}\}\s+\/>/gs,
  tooltipReplacement
);


fs.writeFileSync('src/pages/operaciones/produccion/ReporteYAnalitica.tsx', content);

