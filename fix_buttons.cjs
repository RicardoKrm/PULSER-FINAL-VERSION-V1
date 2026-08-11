const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

const newButtons = `            {data.length > 0 && (
              <>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Cargar Nuevo Excel
                </Button>
                <Button variant="outline" onClick={handleExportExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button onClick={handleSaveToDB} disabled={saving || data.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {saving ? 'Guardando...' : 'Guardar en Base de Datos'}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => { setData([]); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                >
                  Limpiar
                </Button>
              </>
            )}`;

code = code.replace(
  /\{data\.length > 0 && \(\s*<>\s*<Button variant="outline" onClick=\{handleExportExcel\}>[\s\S]*?<\/Button>\s*<\/>\s*\)\}/,
  newButtons
);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
