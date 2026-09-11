const fs = require('fs');
const file = 'src/pages/produccion/ControlSanny.tsx';
let content = fs.readFileSync(file, 'utf8');

// I will just use regex to fix the malformed HTML blocks.
// S7 Dia block
const regexDia = /<div className="flex justify-between bg-purple-100 p-1 font-semibold"><span>VUELTAS \/ HORA S7 DÍA<\/span> <span>\{\(summary\.s7DiaVueltas\/12\)\.toFixed\(2\)\}<\/span><\/div>\s*<div className="flex-1 px-4 text-\[11px\] text-gray-700">/g;

content = content.replace(regexDia, 
  `<div className="flex justify-between bg-purple-100 p-1 font-semibold"><span>VUELTAS / HORA S7 DÍA</span> <span>{(summary.s7DiaVueltas/12).toFixed(2)}</span></div>
              </div>
              <div className="w-1/3 pl-2 space-y-1 border-l">`
);

// S7 Noche block
const regexNoche = /<div className="flex justify-between bg-purple-100 p-1 font-semibold"><span>VUELTAS \/ HORA S7 NOCHE<\/span> <span>\{\(summary\.s7NocheVueltas\/12\)\.toFixed\(2\)\}<\/span><\/div>\s*<div className="flex-1 px-4 text-\[11px\] text-gray-700">/g;

content = content.replace(regexNoche, 
  `<div className="flex justify-between bg-purple-100 p-1 font-semibold"><span>VUELTAS / HORA S7 NOCHE</span> <span>{(summary.s7NocheVueltas/12).toFixed(2)}</span></div>
              </div>
              <div className="w-1/3 pl-2 space-y-1 border-l">`
);

// We need to make sure the S8 blocks are correct
// For the Noche block, it accidentally says "S8 DIA"
content = content.replace(
  /<span>TOTAL S8 DÍA<\/span> <span>\{summary\.s8DiaTons\.toFixed\(1\)\}<\/span><\/div>\s*<div className="flex justify-between"><span>VUELTAS S8 DÍA<\/span> <span>\{summary\.s8DiaVueltas\}<\/span><\/div>\s*<div className="flex justify-between"><span>PROM\. S8 DÍA \(t\/vj\)<\/span> <span>\{summary\.s8DiaVueltas \? \(summary\.s8DiaTons\/summary\.s8DiaVueltas\)\.toFixed\(2\) : 0\}<\/span><\/div>\s*<div className="flex justify-between bg-emerald-100 p-1 font-semibold"><span>VUELTAS \/ HORA S8 DÍA<\/span> <span>\{\(summary\.s8DiaVueltas\/12\)\.toFixed\(2\)\}<\/span><\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/CardContent>/g,
  `<span>TOTAL S8 NOCHE</span> <span>{summary.s8NocheTons.toFixed(1)}</span></div>
                <div className="flex justify-between"><span>VUELTAS S8 NOCHE</span> <span>{summary.s8NocheVueltas}</span></div>
                <div className="flex justify-between"><span>PROM. S8 NOCHE (t/vj)</span> <span>{summary.s8NocheVueltas ? (summary.s8NocheTons/summary.s8NocheVueltas).toFixed(2) : 0}</span></div>
                <div className="flex justify-between bg-emerald-100 p-1 font-semibold"><span>VUELTAS / HORA S8 NOCHE</span> <span>{(summary.s8NocheVueltas/12).toFixed(2)}</span></div>
              </div>
            </div>
          </CardContent>`
);


fs.writeFileSync(file, content);
console.log("ControlSanny fixed.");
