import fs from 'fs';

let content = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf8');

const hiddenCols = [18, 33, 37, 38]; // 0-based indices for cols 19, 34, 38, 39

// Replace header mapping
const oldHeaderMap = /\{Array\.from\(\{length: 36\}\)\.map\(\(_, i\) => \(\s*<th key=\{i\} className="px-4 py-3 font-semibold">Col \{i \+ 4\}<\/th>\s*\)\)\}/;
const newHeaderMap = `{Array.from({length: 36}).map((_, i) => {
                        const originalColIndex = i + 3;
                        if ([18, 33, 37, 38].includes(originalColIndex)) return null;
                        return <th key={i} className="px-4 py-3 font-semibold">Col {originalColIndex + 1}</th>;
                      })}`;
content = content.replace(oldHeaderMap, newHeaderMap);

// Replace body mapping
const oldBodyMap = /\{Array\.from\(\{length: 36\}\)\.map\(\(\_, colIdx\) => \{\s*const val = row\.raw\[colIdx \+ 3\];\s*return \(\s*<td key=\{colIdx\} className="px-4 py-2 text-right">\s*\{typeof val === 'number' \? formatNum\(val\) : val\?\.toString\(\) \|\| '-'\}\s*<\/td>\s*\)\s*\}\)\}/;
const newBodyMap = `{Array.from({length: 36}).map((_, colIdx) => {
                            const originalColIndex = colIdx + 3;
                            if ([18, 33, 37, 38].includes(originalColIndex)) return null;
                            const val = row.raw[originalColIndex];
                            return (
                              <td key={colIdx} className="px-4 py-2 text-right">
                                {typeof val === 'number' ? formatNum(val) : val?.toString() || '-'}
                              </td>
                            )
                          })}`;
content = content.replace(oldBodyMap, newBodyMap);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', content, 'utf8');
