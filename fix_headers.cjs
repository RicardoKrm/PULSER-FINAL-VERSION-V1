const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

const newHeaderMap = `                      {Array.from({length: 32}).map((_, i) => {
                        const originalColIndex = i + 3;
                        if ([18].includes(originalColIndex)) return null;
                        
                        const headerMap: Record<number, string> = {
                          3: 'Cant. CAEX',
                          4: 'Operador',
                          5: 'Acopio',
                          6: 'Equipos CAEX',
                          7: 'Acopio...',
                          8: 'Equipos CAEX',
                          9: 'Primario',
                          10: 'Vueltas',
                          11: 'Pases CF',
                          12: 'Total CAEX',
                          13: 'Toneladas CAEX',
                          14: 'Equipo CF',
                          15: 'Prod. Total Día',
                          16: 'Prod. CMC',
                          17: 'Traspasos',
                          19: 'Cant. CAEX',
                          20: 'Operador',
                          21: 'Acopio',
                          22: 'Equipos CAEX',
                          23: 'Acopio...',
                          24: 'Equipos CAEX',
                          25: 'Primario',
                          26: 'Pases CF',
                          27: 'Total CAEX',
                          28: 'Equipo CF',
                          29: 'Prod. CAEX',
                          30: 'Prod. Total Noche',
                          31: 'Traspasos',
                          32: 'T. IMPERIA',
                          33: 'TMC',
                          34: 'Diferencias'
                        };
                        const title = headerMap[originalColIndex] || \`Col \${originalColIndex + 1}\`;
                        return <th key={i} className="px-4 py-3 font-semibold">{title}</th>;
                      })}`;

code = code.replace(/\{Array\.from\(\{length: 36\}\)\.map\(\(_, i\) => \{[\s\S]*?return <th key=\{i\} className="px-4 py-3 font-semibold">\{title\}<\/th>;\s*\}\)\}/g, newHeaderMap);

// Also need to fix the tbody loop mapping!
const newBodyMap = `{Array.from({length: 32}).map((_, colIdx) => {
                            const originalColIndex = colIdx + 3;
                            if ([18].includes(originalColIndex)) return null;
                            const val = row.raw[originalColIndex];
                            
                            let valClass = "px-4 py-2 text-right";
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

code = code.replace(/\{Array\.from\(\{length: 36\}\)\.map\(\(_, colIdx\) => \{[\s\S]*?return \([\s\S]*?<\/td>\s*\)\s*\}\)\}/g, newBodyMap);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
