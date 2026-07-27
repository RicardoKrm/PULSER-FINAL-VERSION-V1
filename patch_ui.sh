cat << 'INNER' > patch.cjs
const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/ReporteDiarioPanel.tsx', 'utf8');

code = code.replace(
  "<span className=\"text-xs text-gray-500 dark:text-slate-400 mt-1\">\n                        Supervisor: <span className=\"font-medium text-gray-700 dark:text-slate-300\">{turno.supervisor}</span>\n                      </span>",
  "<div className=\"mt-2 flex flex-col items-end\">\n                        <span className=\"text-sm text-slate-500 dark:text-slate-400\">Supervisor de Turno</span>\n                        <div className=\"mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700\">\n                          <span className=\"font-bold text-slate-900 dark:text-white uppercase tracking-wider\">{turno.supervisor}</span>\n                        </div>\n                      </div>"
);

fs.writeFileSync('src/pages/produccion/ReporteDiarioPanel.tsx', code);
INNER
node patch.cjs
