const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/ListaPorTurnos.tsx', 'utf8');

code = code.replace(
  "import { Loader2 } from 'lucide-react';",
  "import { Loader2, Download } from 'lucide-react';"
);

const exportFunc = `
  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      
      const excelData: any[] = [];
      
      turnos.forEach(turno => {
         if (turno.trabajadores.length === 0 && !turno.supervisor) return;
         
         // Add supervisor row
         excelData.push({
            "N°": "",
            "ID": "",
            "Nombre": turno.supervisor || 'NO ASIGNADO',
            "Rol": "Supervisor",
            "Total Vueltas": "",
            "Días 4V": "",
            "Días 5V": "",
            "Días 6V": ""
         });
         
         // Add workers
         turno.trabajadores.forEach((t, idx) => {
            excelData.push({
               "N°": idx + 1,
               "ID": t.id,
               "Nombre": t.nombre,
               "Rol": t.cargo,
               "Total Vueltas": t.vueltasTotales,
               "Días 4V": t.dias4V,
               "Días 5V": t.dias5V,
               "Días 6V": t.dias6V
            });
         });
         
         // Empty row between turns
         excelData.push({});
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      worksheet['!cols'] = [
        { wch: 5 },
        { wch: 10 },
        { wch: 40 },
        { wch: 15 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Turnos");
      XLSX.writeFile(workbook, "Lista_Turnos.xlsx");
    } catch (err) {
      console.error("Error exporting:", err);
      alert("Error al exportar a Excel.");
    }
  };

  if (loading) {
`;

code = code.replace("  if (loading) {", exportFunc);

const headerUI = `
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Lista por Turnos</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Información detallada de trabajadores y vueltas totales agrupados por turno.
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Exportar Excel
        </button>
      </div>
`;

code = code.replace(
  /<div className="mb-6">[\s\S]*?<\/div>/,
  headerUI.trim()
);

fs.writeFileSync('src/pages/produccion/ListaPorTurnos.tsx', code);
