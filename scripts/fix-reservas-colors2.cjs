const fs = require('fs');

const file = 'src/pages/operaciones/Reservas.tsx';
let text = fs.readFileSync(file, 'utf8');

text = text.replace(/bg-slate-50 dark:bg-slate-900\/50/g, 'bg-slate-50 dark:bg-slate-800/50');

// One more place, for "LOGISTICA DE CARGA", there are checkboxes or number inputs? Let's fix them too.

fs.writeFileSync(file, text);
console.log("Fixed input backgrounds to slate-800/50");
