const fs = require('fs');

const file = 'src/pages/flota/GestionNeumaticos.tsx';
let text = fs.readFileSync(file, 'utf8');

text = text.replace(
  '<th colSpan={1} className="border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-xs text-center text-slate-600 dark:text-slate-300"></th>',
  '<th colSpan={4} className="border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-xs text-center text-slate-600 dark:text-slate-300">Detalles Adicionales</th>\n                 <th colSpan={1} className="border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-xs text-center text-slate-600 dark:text-slate-300">Obs</th>'
);

text = text.replace(
  '<th className="p-2 border-r dark:border-slate-700 w-16 text-center">Int-2</th>',
  '<th className="p-2 border-r dark:border-slate-700 w-16 text-center">Int-2</th>\n                 <th className="p-2 border-r dark:border-slate-700 w-14 text-center">N° R</th>\n                 <th className="p-2 border-r dark:border-slate-700 w-16 text-center">Reenc</th>\n                 <th className="p-2 border-r dark:border-slate-700 w-12 text-center" title="Tapa Válvula">TV</th>\n                 <th className="p-2 border-r dark:border-slate-700 w-12 text-center" title="Extensión Válvula">Ext</th>'
);

text = text.replace(
  '<td className="p-1.5 border-r dark:border-slate-700">\n                      <input type="number" step="0.1" className="w-full px-1 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs text-center dark:text-slate-100" placeholder="12.8" />\n                    </td>\n                    <td className="p-1.5">',
  '<td className="p-1.5 border-r dark:border-slate-700">\n                      <input type="number" step="0.1" className="w-full px-1 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs text-center dark:text-slate-100" placeholder="12.8" />\n                    </td>\n                    <td className="p-1.5 border-r dark:border-slate-700">\n                      <input type="number" className="w-full px-1 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs text-center dark:text-slate-100" placeholder="0" />\n                    </td>\n                    <td className="p-1.5 border-r dark:border-slate-700">\n                      <input type="text" className="w-full px-1 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs text-center dark:text-slate-100" placeholder="-" />\n                    </td>\n                    <td className="p-1.5 border-r dark:border-slate-700 text-center">\n                      <input type="checkbox" className="w-4 h-4 cursor-pointer" />\n                    </td>\n                    <td className="p-1.5 border-r dark:border-slate-700 text-center">\n                      <input type="checkbox" className="w-4 h-4 cursor-pointer" />\n                    </td>\n                    <td className="p-1.5">'
);

fs.writeFileSync(file, text);
console.log("Cols added");
