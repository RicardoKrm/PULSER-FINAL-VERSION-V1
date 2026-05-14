const fs = require('fs');

const file = 'src/pages/operaciones/Reservas.tsx';
let text = fs.readFileSync(file, 'utf8');

// The block background sections
text = text.replace(/<div className="p-6 grid md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800\/50">/g, '<div className="p-6 grid md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-900/50">');
text = text.replace(/<div className="p-6 grid md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-800\/50">/g, '<div className="p-6 grid md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-900/50">');
text = text.replace(/<div className="p-6 bg-slate-50 dark:bg-slate-800\/50 flex flex-col md:flex-row justify-between items-center gap-4">/g, '<div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4">');

// For block 2, it is `<div className="p-6 grid md:grid-cols-2 gap-8">` without color. We might want to give it dark color to contrast or leave it since the form is divide-y.

fs.writeFileSync(file, text);
console.log("Fixed backgrounds in Reservas");
