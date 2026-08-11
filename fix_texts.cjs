const fs = require('fs');

let pruebaMina = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');
pruebaMina = pruebaMina.replace(/<th className="px-6 py-4 font-semibold text-right">Planta<\/th>/g, '<th className="px-6 py-4 font-semibold text-right">Primario</th>');
pruebaMina = pruebaMina.replace(/<th className="px-6 py-4 font-semibold text-right">Pases Tot<\/th>/g, '<th className="px-6 py-4 font-semibold text-right">Total Pases</th>');
pruebaMina = pruebaMina.replace(/<th className="px-6 py-4 font-semibold text-right">Cant CAEX<\/th>/g, '<th className="px-6 py-4 font-semibold text-right">Equipos CAEX</th>');

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', pruebaMina);

let panel = fs.readFileSync('src/pages/produccion/ReporteDiarioMinaPanel.tsx', 'utf-8');
panel = panel.replace(/<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">CAEX \(Nº\)<\/th>/g, '<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Equipos CAEX</th>');
panel = panel.replace(/<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">CAEX \(Nº\)<\/th>/g, '<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Equipos CAEX</th>');
fs.writeFileSync('src/pages/produccion/ReporteDiarioMinaPanel.tsx', panel);
