const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

const newGetNum = `          const getNum = (val: any) => {
            if (val === null || val === undefined || val === '') return 0;
            if (typeof val === 'number') return isNaN(val) ? 0 : val;
            if (typeof val === 'string') {
               let cleanStr = val.trim();
               if (cleanStr.includes(',') && cleanStr.includes('.')) {
                  if (cleanStr.lastIndexOf(',') > cleanStr.lastIndexOf('.')) {
                     cleanStr = cleanStr.replace(/\\./g, '').replace(/,/g, '.');
                  } else {
                     cleanStr = cleanStr.replace(/,/g, '');
                  }
               } else if (cleanStr.includes(',')) {
                  cleanStr = cleanStr.replace(/,/g, '.');
               }
               const parsed = Number(cleanStr);
               return isNaN(parsed) ? 0 : parsed;
            }
            if (typeof val === 'object' && val !== null) {
                if (val.v !== undefined) {
                    const parsed = Number(val.v);
                    return isNaN(parsed) ? 0 : parsed;
                }
            }
            return 0;
          };`;

code = code.replace(
  /const getNum = \(val: any\) => \{[\s\S]*?return 0;\n          \};/m,
  newGetNum
);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
