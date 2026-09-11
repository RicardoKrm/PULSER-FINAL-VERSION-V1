const fs = require('fs');
const file = 'src/pages/produccion/ControlSanny.tsx';
let content = fs.readFileSync(file, 'utf8');

// Resumen Table Headers
content = content.replace(
  '<th className="p-2 border">S7 - Vueltas/H Noche</th>',
  '<th className="p-2 border">S7 - Vueltas/H Noche</th>\n                <th className="p-2 border">S8 - Día (t)</th>\n                <th className="p-2 border">S8 - Noche (t)</th>\n                <th className="p-2 border">S8 - Total (t)</th>\n                <th className="p-2 border">S8 - Vueltas/H Día</th>\n                <th className="p-2 border">S8 - Vueltas/H Noche</th>'
);

// Resumen Table Body inside map
content = content.replace(
  '<td className="p-2 border-r">{(s.s7NocheVueltas/12).toFixed(2)}</td>',
  `<td className="p-2 border-r">{(s.s7NocheVueltas/12).toFixed(2)}</td>
                    <td className="p-2 border-r">{s.s8DiaTons.toFixed(1)}</td>
                    <td className="p-2 border-r">{s.s8NocheTons.toFixed(1)}</td>
                    <td className="p-2 font-semibold bg-slate-50 border-r">{(s.s8DiaTons + s.s8NocheTons).toFixed(1)}</td>
                    <td className="p-2 border-r">{(s.s8DiaVueltas/12).toFixed(2)}</td>
                    <td className="p-2 border-r">{(s.s8NocheVueltas/12).toFixed(2)}</td>`
);

// Calculate totals
content = content.replace(
  /const totalS7NocheT = summaries\.reduce\(\(acc, curr\) => acc \+ curr\.s7NocheTons, 0\);/,
  `const totalS7NocheT = summaries.reduce((acc, curr) => acc + curr.s7NocheTons, 0);\n  const totalS8DiaT = summaries.reduce((acc, curr) => acc + curr.s8DiaTons, 0);\n  const totalS8NocheT = summaries.reduce((acc, curr) => acc + curr.s8NocheTons, 0);`
);

content = content.replace(
  /const totalMes = totalS6DiaT \+ totalS6NocheT \+ totalS7DiaT \+ totalS7NocheT;/,
  "const totalMes = totalS6DiaT + totalS6NocheT + totalS7DiaT + totalS7NocheT + totalS8DiaT + totalS8NocheT;"
);

content = content.replace(
  /const totalViajes = summaries\.reduce\(\(acc, curr\) => acc \+ curr\.s6DiaVueltas \+ curr\.s6NocheVueltas \+ curr\.s7DiaVueltas \+ curr\.s7NocheVueltas, 0\);/,
  "const totalViajes = summaries.reduce((acc, curr) => acc + curr.s6DiaVueltas + curr.s6NocheVueltas + curr.s7DiaVueltas + curr.s7NocheVueltas + curr.s8DiaVueltas + curr.s8NocheVueltas, 0);"
);

content = content.replace(
  /const promVHDia = summaries\.reduce\(\(acc, curr\) => acc \+ \(\(curr\.s6DiaVueltas\/12 \+ curr\.s7DiaVueltas\/12\)\/2\), 0\) \/ \(diasTrabajados \|\| 1\);/,
  "const promVHDia = summaries.reduce((acc, curr) => acc + ((curr.s6DiaVueltas/12 + curr.s7DiaVueltas/12 + curr.s8DiaVueltas/12)/3), 0) / (diasTrabajados || 1);"
);

content = content.replace(
  /const promVHNoche = summaries\.reduce\(\(acc, curr\) => acc \+ \(\(curr\.s6NocheVueltas\/12 \+ curr\.s7NocheVueltas\/12\)\/2\), 0\) \/ \(diasTrabajados \|\| 1\);/,
  "const promVHNoche = summaries.reduce((acc, curr) => acc + ((curr.s6NocheVueltas/12 + curr.s7NocheVueltas/12 + curr.s8NocheVueltas/12)/3), 0) / (diasTrabajados || 1);"
);


// Totals row at bottom
content = content.replace(
  '<td className="p-2 font-bold bg-slate-100 border-r">{(totalS7DiaT + totalS7NocheT).toFixed(1)}</td>',
  `<td className="p-2 font-bold bg-slate-100 border-r">{(totalS7DiaT + totalS7NocheT).toFixed(1)}</td>
                <td className="p-2 bg-slate-50 border-r">-</td>
                <td className="p-2 bg-slate-50 border-r">-</td>
                <td className="p-2 bg-slate-50 border-r">{totalS8DiaT.toFixed(1)}</td>
                <td className="p-2 bg-slate-50 border-r">{totalS8NocheT.toFixed(1)}</td>
                <td className="p-2 font-bold bg-slate-100 border-r">{(totalS8DiaT + totalS8NocheT).toFixed(1)}</td>`
);

content = content.replace(
  /const totalD = s\.s6DiaTons \+ s\.s7DiaTons;/,
  "const totalD = s.s6DiaTons + s.s7DiaTons + s.s8DiaTons;"
);

content = content.replace(
  /const totalN = s\.s6NocheTons \+ s\.s7NocheTons;/,
  "const totalN = s.s6NocheTons + s.s7NocheTons + s.s8NocheTons;"
);

content = content.replace(
  /const totalDiarioT = totalD \+ totalN;/,
  "const totalDiarioT = totalD + totalN;"
);

content = content.replace(
  /s\.s6DiaVueltas \+ s\.s6NocheVueltas \+ s\.s7DiaVueltas \+ s\.s7NocheVueltas/g,
  "s.s6DiaVueltas + s.s6NocheVueltas + s.s7DiaVueltas + s.s7NocheVueltas + s.s8DiaVueltas + s.s8NocheVueltas"
);

content = content.replace(
  /\(totalS6DiaT \+ totalS7DiaT\)\.toFixed\(1\)/g,
  "(totalS6DiaT + totalS7DiaT + totalS8DiaT).toFixed(1)"
);

content = content.replace(
  /\(totalS6NocheT \+ totalS7NocheT\)\.toFixed\(1\)/g,
  "(totalS6NocheT + totalS7NocheT + totalS8NocheT).toFixed(1)"
);


fs.writeFileSync(file, content);
console.log("ControlSanny patch tables completed.");
