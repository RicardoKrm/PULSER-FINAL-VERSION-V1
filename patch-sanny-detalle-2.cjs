const fs = require('fs');
const file = 'src/pages/produccion/ControlSanny.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. the flex containers for Día
const s8DiaHtml = `
              <div className="flex-1">
                <div className="bg-[#059669] text-white text-xs text-center py-1 font-semibold">SANNY 08 - TURNO DÍA</div>
                <TripTable trips={s8Dia} />
              </div>
`;

content = content.replace(
  /<div className="bg-\[\#15803d\] text-white text-xs text-center py-1 font-semibold">SANNY 07 - TURNO DÍA<\/div>\s*<TripTable trips=\{s7Dia\} \/>\s*<\/div>\s*<\/div>\s*\{\/\* Resumen Footer \*\/\}/g,
  `<div className="bg-[#15803d] text-white text-xs text-center py-1 font-semibold">SANNY 07 - TURNO DÍA</div>
                <TripTable trips={s7Dia} />
              </div>
              ${s8DiaHtml}
            </div>
            {/* Resumen Footer */}`
);

// 2. the flex containers for Noche
const s8NocheHtml = `
              <div className="flex-1">
                <div className="bg-[#059669] text-white text-xs text-center py-1 font-semibold">SANNY 08 - TURNO NOCHE</div>
                <TripTable trips={s8Noche} />
              </div>
`;

content = content.replace(
  /<div className="bg-\[\#15803d\] text-white text-xs text-center py-1 font-semibold">SANNY 07 - TURNO NOCHE<\/div>\s*<TripTable trips=\{s7Noche\} \/>\s*<\/div>\s*<\/div>\s*\{\/\* Resumen Footer \*\/\}/g,
  `<div className="bg-[#15803d] text-white text-xs text-center py-1 font-semibold">SANNY 07 - TURNO NOCHE</div>
                <TripTable trips={s7Noche} />
              </div>
              ${s8NocheHtml}
            </div>
            {/* Resumen Footer */}`
);

// 3. Resumen Footer Dia
const s8DiaResumenHtml = `
              <div className="w-1/3 px-2 space-y-1">
                <div className="flex justify-between font-bold border-b pb-1"><span>TOTAL S8 DÍA</span> <span>{summary.s8DiaTons.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>VUELTAS S8 DÍA</span> <span>{summary.s8DiaVueltas}</span></div>
                <div className="flex justify-between"><span>PROM. S8 DÍA (t/vj)</span> <span>{summary.s8DiaVueltas ? (summary.s8DiaTons/summary.s8DiaVueltas).toFixed(2) : 0}</span></div>
                <div className="flex justify-between bg-emerald-100 p-1 font-semibold"><span>VUELTAS / HORA S8 DÍA</span> <span>{(summary.s8DiaVueltas/12).toFixed(2)}</span></div>
              </div>
`;

content = content.replace(
  /<div className="w-1\/2 pr-2 space-y-1">/g,
  `<div className="w-1/3 pr-2 space-y-1">`
);
content = content.replace(
  /<div className="w-1\/2 pl-2 space-y-1 border-l">/g,
  `<div className="w-1/3 pl-2 space-y-1 border-l">`
);

content = content.replace(
  /<div className="flex justify-between bg-purple-100 p-1 font-semibold"><span>VUELTAS \/ HORA S7 DÍA<\/span> <span>\{\(summary\.s7DiaVueltas\/12\)\.toFixed\(2\)\}<\/span><\/div>\s*<\/div>\s*<\/div>\s*<\/CardContent>/g,
  `<div className="flex justify-between bg-purple-100 p-1 font-semibold"><span>VUELTAS / HORA S7 DÍA</span> <span>{(summary.s7DiaVueltas/12).toFixed(2)}</span></div>
              </div>
              ${s8DiaResumenHtml}
            </div>
          </CardContent>`
);


// 4. Resumen Footer Noche
const s8NocheResumenHtml = `
              <div className="w-1/3 px-2 space-y-1">
                <div className="flex justify-between font-bold border-b pb-1"><span>TOTAL S8 NOCHE</span> <span>{summary.s8NocheTons.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>VUELTAS S8 NOCHE</span> <span>{summary.s8NocheVueltas}</span></div>
                <div className="flex justify-between"><span>PROM. S8 NOCHE (t/vj)</span> <span>{summary.s8NocheVueltas ? (summary.s8NocheTons/summary.s8NocheVueltas).toFixed(2) : 0}</span></div>
                <div className="flex justify-between bg-emerald-100 p-1 font-semibold"><span>VUELTAS / HORA S8 NOCHE</span> <span>{(summary.s8NocheVueltas/12).toFixed(2)}</span></div>
              </div>
`;

content = content.replace(
  /<div className="flex justify-between bg-purple-100 p-1 font-semibold"><span>VUELTAS \/ HORA S7 NOCHE<\/span> <span>\{\(summary\.s7NocheVueltas\/12\)\.toFixed\(2\)\}<\/span><\/div>\s*<\/div>\s*<\/div>\s*<\/CardContent>/g,
  `<div className="flex justify-between bg-purple-100 p-1 font-semibold"><span>VUELTAS / HORA S7 NOCHE</span> <span>{(summary.s7NocheVueltas/12).toFixed(2)}</span></div>
              </div>
              ${s8NocheResumenHtml}
            </div>
          </CardContent>`
);

// 5. Grid layout
content = content.replace(
  /className="grid grid-cols-1 xl:grid-cols-2 gap-4"/g,
  `className="grid grid-cols-1 xl:grid-cols-2 gap-4"`
);

fs.writeFileSync(file, content);
console.log("ControlSanny patch detalle 2 completed.");
