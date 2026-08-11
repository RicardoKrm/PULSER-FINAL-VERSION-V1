const fs = require('fs');
let code = fs.readFileSync('src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx', 'utf-8');

// The file is too big to do simple replace easily, let me just rewrite the whole file 
// based on produccion_mina_mensual.
