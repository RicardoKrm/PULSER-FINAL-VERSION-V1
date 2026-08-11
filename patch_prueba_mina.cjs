const fs = require('fs');

let content = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

content = content.replace(/caex_dia: number;/g, 'caex_dia: string | number;');
content = content.replace(/operadores_dia: number;/g, 'operadores_dia: string | number;');
content = content.replace(/acopio_dia: number;/g, 'acopio_dia: string | number;');
content = content.replace(/caex_acopio_dia: number;/g, 'caex_acopio_dia: string | number;');
content = content.replace(/planta_dia: number;/g, 'planta_dia: string | number;');
content = content.replace(/caex_planta_dia: number;/g, 'caex_planta_dia: string | number;');

content = content.replace(/caex_noche: number;/g, 'caex_noche: string | number;');
content = content.replace(/operadores_noche: number;/g, 'operadores_noche: string | number;');
content = content.replace(/acopio_noche: number;/g, 'acopio_noche: string | number;');
content = content.replace(/caex_acopio_noche: number;/g, 'caex_acopio_noche: string | number;');
content = content.replace(/planta_noche: number;/g, 'planta_noche: string | number;');
content = content.replace(/caex_planta_noche: number;/g, 'caex_planta_noche: string | number;');

const getNumRegex = /const getNum = \(val: any\) => \{[\s\S]*?return 0;\n          \};/;
const newFns = `const getNum = (val: any) => {
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
          };

          const getString = (val: any) => {
            if (val === null || val === undefined || val === '') return '';
            if (typeof val === 'object' && val !== null && val.v !== undefined) return String(val.v).trim();
            return String(val).trim();
          };`;

content = content.replace(getNumRegex, newFns);

const returnObjRegex = /caex_dia: getNum\(row\[d_caex\]\),\s*operadores_dia: getNum\(row\[d_operadores\]\),\s*acopio_dia: getNum\(row\[d_acopio\]\),\s*caex_acopio_dia: getNum\(row\[d_caex_acopio\]\),\s*planta_dia: getNum\(row\[d_planta\]\),\s*caex_planta_dia: getNum\(row\[d_caex_planta\]\),/g;
content = content.replace(returnObjRegex, `caex_dia: getString(row[d_caex]),
            operadores_dia: getString(row[d_operadores]),
            acopio_dia: getString(row[d_acopio]),
            caex_acopio_dia: getString(row[d_caex_acopio]),
            planta_dia: getString(row[d_planta]),
            caex_planta_dia: getString(row[d_caex_planta]),`);

const returnObjNocheRegex = /caex_noche: getNum\(row\[n_caex\]\),\s*operadores_noche: getNum\(row\[n_operadores\]\),\s*acopio_noche: getNum\(row\[n_acopio\]\),\s*caex_acopio_noche: getNum\(row\[n_caex_acopio\]\),\s*planta_noche: getNum\(row\[n_planta\]\),\s*caex_planta_noche: getNum\(row\[n_caex_planta\]\),/g;
content = content.replace(returnObjNocheRegex, `caex_noche: getString(row[n_caex]),
            operadores_noche: getString(row[n_operadores]),
            acopio_noche: getString(row[n_acopio]),
            caex_acopio_noche: getString(row[n_caex_acopio]),
            planta_noche: getString(row[n_planta]),
            caex_planta_noche: getString(row[n_caex_planta]),`);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', content);

