const fs = require('fs');

let content = fs.readFileSync('src/pages/produccion/ReporteDiarioMinaPanel.tsx', 'utf-8');

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

fs.writeFileSync('src/pages/produccion/ReporteDiarioMinaPanel.tsx', content);

