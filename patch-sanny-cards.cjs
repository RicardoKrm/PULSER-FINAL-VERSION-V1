const fs = require('fs');
const file = 'src/pages/produccion/ControlSanny.tsx';
let content = fs.readFileSync(file, 'utf8');

const s7Card = `
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    accept=".xlsx,.xls" 
                    onChange={(e) => handleFileUpload(e, 's8')}
                    disabled={loading}
                  />
                  {loading ? (
                    <Loader2 className="w-10 h-10 text-emerald-600 mb-3 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-10 h-10 text-emerald-600 mb-3" />
                  )}
                  <h3 className="text-lg font-medium text-gray-900">{loading ? 'Procesando...' : 'Cargar Sanny 08'}</h3>
                  <p className="text-sm text-gray-500 text-center mt-1">
                    Sube el archivo Excel extraído del equipo
                  </p>
                  {data.s8 && data.s8.length > 0 && !loading && (
                    <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center">
                      <CheckIcon className="w-4 h-4 mr-1" />
                      {data.s8.length} registros en base de datos
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
`;

content = content.replace(
  /\{\/\* Tabs \*\/\}/g,
  `\n          </div>\n          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">\n            {/* Keep grid layout but added S8 */}\n`
);

content = content.replace(
  /<\/Card>\s*<\/div>\s*<div className="flex justify-end pt-4 border-t border-gray-200">/g,
  "</Card>\n" + s7Card + "\n          </div>\n          <div className=\"flex justify-end pt-4 border-t border-gray-200\">"
);

// Fix grid cols
content = content.replace(
  /grid-cols-1 sm:grid-cols-2 gap-6/g,
  "grid-cols-1 sm:grid-cols-3 gap-6"
);

fs.writeFileSync(file, content);
console.log("ControlSanny patch cards completed.");
