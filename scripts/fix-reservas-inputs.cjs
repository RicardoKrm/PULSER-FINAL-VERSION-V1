const fs = require('fs');

const file = 'src/pages/operaciones/Reservas.tsx';
let text = fs.readFileSync(file, 'utf8');

text = text.replace(/bg-white dark:bg-slate-900/g, 'bg-white dark:bg-slate-950');
text = text.replace('text-[9px] text-red-600 font-bold uppercase">C2: Comentario', 'text-[9px] text-red-600 dark:text-red-500 font-bold uppercase">C2: Comentario');
text = text.replace('border-red-100"', 'border-red-100 dark:border-red-900/30"');

fs.writeFileSync(file, text);
console.log("Fixed reservas inputs");
