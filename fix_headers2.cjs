const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

const newHeaderMap = `                      {Array.from({length: 32}).map((_, i) => {
                        const originalColIndex = i + 3;
                        
                        const headerMap: Record<number, string> = {
                          3: 'Cant. CAEX',
                          4: 'Equipos CAEX',
                          5: 'Operadores',
                          6: 'Acopio',
                          7: 'Equipos CAEX',
                          8: 'Primario',
                          9: 'Equipos CAEX',
                          10: 'Vueltas',
                          11: 'Pases CF',
                          12: 'Total Pases',
                          13: 'Toneladas CAEX',
                          14: 'Equipo CF',
                          15: 'Prod. Total Día',
                          16: 'Prod. CMC',
                          17: 'Traspasos',
                          18: 'Cant. CAEX',
                          19: 'Equipos CAEX',
                          20: 'Operadores',
                          21: 'Acopio',
                          22: 'Equipos CAEX',
                          23: 'Primario',
                          24: 'Equipos CAEX',
                          25: 'Pases CF',
                          26: 'Total Pases',
                          27: 'Toneladas CAEX',
                          28: 'Equipo CF',
                          29: 'Prod. CAEX',
                          30: 'Prod. Total Noche',
                          31: 'Traspasos',
                          32: 'T. Imperia',
                          33: 'TMC',
                          34: 'Diferencia'
                        };
                        const title = headerMap[originalColIndex] || \`Col \${originalColIndex}\`;
                        return <th key={i} className="px-4 py-3 font-semibold text-xs text-slate-500 uppercase tracking-wider">{title}</th>;
                      })}`;

code = code.replace(/\{Array\.from\(\{length: 32\}\)\.map\(\(_, i\) => \{[\s\S]*?return <th key=\{i\}.*?>\{title\}<\/th>;\s*\}\)\}/g, newHeaderMap);

const newBodyMap = `{Array.from({length: 32}).map((_, colIdx) => {
                            const originalColIndex = colIdx + 3;
                            const val = row.raw[originalColIndex];
                            
                            let valClass = "px-4 py-2 text-right text-sm";
                            if ([4, 5, 7, 9, 14, 19, 20, 22, 24, 28].includes(originalColIndex)) {
                              valClass = "px-4 py-2 text-left text-sm whitespace-normal min-w-[150px]";
                            }
                            if (originalColIndex === 34 && typeof val === 'number') {
                              if (val < 0) {
                                valClass += " font-semibold text-red-600 dark:text-red-400";
                              } else {
                                valClass += " font-semibold text-slate-900 dark:text-white";
                              }
                            }
                            
                            return (
                              <td key={colIdx} className={valClass}>
                                {typeof val === 'number' ? formatNum(val) : val?.toString() || '-'}
                              </td>
                            )
                          })}`;

code = code.replace(/\{Array\.from\(\{length: 32\}\)\.map\(\(_, colIdx\) => \{[\s\S]*?return \([\s\S]*?<\/td>\s*\)\s*\}\)\}/g, newBodyMap);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
