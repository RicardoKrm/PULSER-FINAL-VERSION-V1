const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/ReporteDiarioMinaPanel.tsx', 'utf-8');

code = code.replace(/<span className="text-xs">Planta<\/span>/g, '<span className="text-xs">Primario</span>');

fs.writeFileSync('src/pages/produccion/ReporteDiarioMinaPanel.tsx', code);
