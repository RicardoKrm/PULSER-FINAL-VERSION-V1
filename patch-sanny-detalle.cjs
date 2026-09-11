const fs = require('fs');
const file = 'src/pages/produccion/ControlSanny.tsx';
let content = fs.readFileSync(file, 'utf8');

// Component Signature
content = content.replace(
  "function DetalleDiario({ date, s6Trips, s7Trips, summary }: { date: string, s6Trips: Trip[], s7Trips: Trip[], summary: DailySummary }) {",
  "function DetalleDiario({ date, s6Trips, s7Trips, s8Trips, summary }: { date: string, s6Trips: Trip[], s7Trips: Trip[], s8Trips: Trip[], summary: DailySummary }) {"
);

// Derived variables
content = content.replace(
  "const s7Noche = s7Trips.filter(t => t.shift === 'Noche').sort((a,b) => a.time.localeCompare(b.time));",
  "const s7Noche = s7Trips.filter(t => t.shift === 'Noche').sort((a,b) => a.time.localeCompare(b.time));\n  const s8Dia = s8Trips.filter(t => t.shift === 'Día').sort((a,b) => a.time.localeCompare(b.time));\n  const s8Noche = s8Trips.filter(t => t.shift === 'Noche').sort((a,b) => a.time.localeCompare(b.time));"
);


// 1. the headers in DetalleDiario
content = content.replace(
  '<th className="p-2 border bg-indigo-50">S7 TOTAL</th>',
  '<th className="p-2 border bg-indigo-50">S7 TOTAL</th>\n                <th className="p-2 border">S8 TURNO DÍA</th>\n                <th className="p-2 border">S8 TURNO NOCHE</th>\n                <th className="p-2 border bg-emerald-50">S8 TOTAL</th>'
);

// 2. the td row in DetalleDiario
content = content.replace(
  '<td className="p-2 border font-bold bg-blue-50">{(summary.s7DiaTons + summary.s7NocheTons).toFixed(1)}</td>',
  `<td className="p-2 border font-bold bg-blue-50">{(summary.s7DiaTons + summary.s7NocheTons).toFixed(1)}</td>
                <td className="p-2 border">{summary.s8DiaTons.toFixed(1)}</td>
                <td className="p-2 border">{summary.s8NocheTons.toFixed(1)}</td>
                <td className="p-2 border font-bold bg-emerald-50">{(summary.s8DiaTons + summary.s8NocheTons).toFixed(1)}</td>`
);

// 3. totals in DetalleDiario
content = content.replace(
  /\(summary\.s6DiaTons \+ summary\.s7DiaTons\)\.toFixed\(1\)/g,
  "(summary.s6DiaTons + summary.s7DiaTons + summary.s8DiaTons).toFixed(1)"
);

content = content.replace(
  /\(summary\.s6NocheTons \+ summary\.s7NocheTons\)\.toFixed\(1\)/g,
  "(summary.s6NocheTons + summary.s7NocheTons + summary.s8NocheTons).toFixed(1)"
);

content = content.replace(
  /summary\.s6DiaTons \+ summary\.s6NocheTons \+ summary\.s7DiaTons \+ summary\.s7NocheTons/g,
  "summary.s6DiaTons + summary.s6NocheTons + summary.s7DiaTons + summary.s7NocheTons + summary.s8DiaTons + summary.s8NocheTons"
);

content = content.replace(
  /\(summary\.s6DiaTons \+ summary\.s6NocheTons \+ summary\.s7DiaTons \+ summary\.s7NocheTons\)\/2/g,
  "(summary.s6DiaTons + summary.s6NocheTons + summary.s7DiaTons + summary.s7NocheTons + summary.s8DiaTons + summary.s8NocheTons)/3"
);


// Add to grid layouts 
content = content.replace(
  /xl:grid-cols-2/g,
  "xl:grid-cols-2" // actually if it's 3 items it might be better as 3 columns or just flow, we will change it to xl:grid-cols-3
);

// Also need to add S8 tables
const s8DiaHtml = `
              <div className="flex-1">
                <div className="bg-[#059669] text-white text-xs text-center py-1 font-semibold">SANNY 08 - TURNO DÍA</div>
                <TripTable trips={s8Dia} />
              </div>
`;

content = content.replace(
  /<\/div>\s*<\/div>\s*<div className="bg-slate-50 p-2 text-xs flex justify-between">/g,
  `              ${s8DiaHtml}\n            </div>\n          </div>\n          <div className="bg-slate-50 p-2 text-xs flex justify-between">`
);

const s8DiaResumenHtml = `
              <div className="flex-1 px-4 text-[11px] text-gray-700">
                <div className="flex justify-between font-bold border-b pb-1"><span>TOTAL S8 DÍA</span> <span>{summary.s8DiaTons.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>VUELTAS S8 DÍA</span> <span>{summary.s8DiaVueltas}</span></div>
                <div className="flex justify-between"><span>PROM. S8 DÍA (t/vj)</span> <span>{summary.s8DiaVueltas ? (summary.s8DiaTons/summary.s8DiaVueltas).toFixed(2) : 0}</span></div>
                <div className="flex justify-between bg-emerald-100 p-1 font-semibold"><span>VUELTAS / HORA S8 DÍA</span> <span>{(summary.s8DiaVueltas/12).toFixed(2)}</span></div>
              </div>
`;

content = content.replace(
  /<\/div>\s*<\/div>\s*<\/CardContent>/g,
  `${s8DiaResumenHtml}\n            </div>\n          </div>\n          </CardContent>` // this regex will hit twice, for Dia and Noche, so we need to be careful
);


fs.writeFileSync(file, content);
console.log("ControlSanny patch detalle completed.");
