import fs from 'fs';

let content = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf8');

// Update buttons
const buttonsRegex = /<Button variant="outline" onClick=\{handleExportExcel\}>[\s\S]*?Excel\n\s*<\/Button>/;
const newButtons = `<Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button onClick={handleSaveToDB} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? 'Guardando...' : 'Guardar en Base de Datos'}
            </Button>`;
content = content.replace(buttonsRegex, newButtons);

// Update diferencia color
content = content.replace(/className=\{\`px-6 py-4 text-right font-semibold \$\{row\.diferencia < 0 \? 'text-red-600' : row\.diferencia > 0 \? 'text-emerald-600' : 'text-slate-500'\}\`\}/g, "className={`px-6 py-4 text-right font-semibold ${row.diferencia < 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}");
content = content.replace(/\{row\.diferencia > 0 \? '\+' : ''\}\{formatNum\(row\.diferencia\)\}/g, "{formatNum(row.diferencia)}");

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', content, 'utf8');
