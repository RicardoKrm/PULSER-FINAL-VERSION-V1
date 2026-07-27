import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Loader2, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Trabajador {
  id: string;
  nombre: string;
  cargo: string;
  vueltasTotales: number;
  dias4V: number;
  dias5V: number;
  dias6V: number;
}

interface TurnoInfo {
  id: string;
  nombre: string;
  supervisor: string;
  trabajadores: Trabajador[];
}

export default function ListaPorTurnos() {
  const [turnos, setTurnos] = useState<TurnoInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('produccion_registro_diario')
          .select('*');

        if (error) {
          console.error("Error fetching data:", error);
          setLoading(false);
          return;
        }

        const groups: Record<string, TurnoInfo> = {};
        const dailyData: Record<string, Record<string, { dates: Record<string, number>, camiones: Record<string, number> }>> = {};

        data.forEach(row => {
          if (!row.fecha || !row.chofer) return;

          let rowSup = 'Sin Supervisor Asignado';
          if (row.novedades) {
            const novs = row.novedades.split('|');
            for (const nov of novs) {
              if (nov.includes('Firma (Ingreso Manual):')) {
                rowSup = nov.split('Firma (Ingreso Manual):')[1]?.trim() || rowSup;
              } else if (nov.includes('Supervisor:')) {
                rowSup = nov.split('Supervisor:')[1]?.trim() || rowSup;
              }
            }
          }
          
          if (!groups[rowSup]) {
             groups[rowSup] = { id: rowSup, nombre: rowSup !== 'Sin Supervisor Asignado' ? `Turno ${rowSup}` : rowSup, supervisor: rowSup !== 'Sin Supervisor Asignado' ? rowSup : '', trabajadores: [] };
             dailyData[rowSup] = {};
          }

          // Accumulate vueltas and camiones
          const chofer = String(row.chofer).trim();
          const fecha = String(row.fecha).trim();
          const camion = String(row.camion || '').trim();
          
          if (!dailyData[rowSup][chofer]) {
            dailyData[rowSup][chofer] = { dates: {}, camiones: {} };
          }
          if (!dailyData[rowSup][chofer].dates[fecha]) {
            dailyData[rowSup][chofer].dates[fecha] = 0;
          }
          dailyData[rowSup][chofer].dates[fecha] += (Number(row.vueltas) || 0);
          
          if (camion) {
            dailyData[rowSup][chofer].camiones[camion] = (dailyData[rowSup][chofer].camiones[camion] || 0) + 1;
          }
        });

        // Compute workers
        const finalTurnos = Object.values(groups).map(group => {
          for (const chofer in dailyData[group.id]) {
             const dataForChofer = dailyData[group.id][chofer];
             let total = 0;
             let d4 = 0;
             let d5 = 0;
             let d6 = 0;
             
             for (const fecha in dataForChofer.dates) {
                const v = dataForChofer.dates[fecha];
                total += v;
                
                const vInt = Math.round(v);
                if (vInt === 4) d4++;
                if (vInt === 5) d5++;
                if (vInt === 6) d6++;
             }
             
             let mostFrequentCamion = '-';
             let maxCamionCount = 0;
             for (const camion in dataForChofer.camiones) {
                 if (dataForChofer.camiones[camion] > maxCamionCount) {
                     maxCamionCount = dataForChofer.camiones[camion];
                     mostFrequentCamion = camion;
                 }
             }
             
             group.trabajadores.push({
                id: mostFrequentCamion,
                nombre: chofer,
                cargo: 'Conductor',
                vueltasTotales: Number(total.toFixed(2)),
                dias4V: d4,
                dias5V: d5,
                dias6V: d6
             });
          }
          
          // Sort workers alphabetically
          group.trabajadores.sort((a, b) => a.nombre.localeCompare(b.nombre));
          
          return group;
        });
        
        // Put "Sin Supervisor Asignado" at the end if it exists
        finalTurnos.sort((a, b) => {
           if (a.id === 'Sin Supervisor Asignado') return 1;
           if (b.id === 'Sin Supervisor Asignado') return -1;
           return a.nombre.localeCompare(b.nombre);
        });

        setTurnos(finalTurnos);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


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

    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-3 text-slate-600 font-medium">Cargando turnos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
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
      
      {turnos.map(turno => {
        if (turno.trabajadores.length === 0 && !turno.supervisor) return null;
        
        return (
          <Card key={turno.id} className="overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">
                {turno.nombre}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">N°</th>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3 min-w-[200px]">Nombre</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3 text-center border-l border-slate-200 dark:border-slate-700">Total Vueltas</th>
                    <th className="px-4 py-3 text-center">Días 4V</th>
                    <th className="px-4 py-3 text-center">Días 5V</th>
                    <th className="px-4 py-3 text-center">Días 6V</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {/* Supervisor Row */}
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white uppercase">
                      {turno.supervisor || 'NO ASIGNADO'}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">Supervisor</td>
                    <td className="px-4 py-3 border-l border-slate-200 dark:border-slate-700"></td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                  
                  {/* Workers Rows */}
                  {turno.trabajadores.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{t.id}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200 uppercase">{t.nombre}</td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 capitalize">{t.cargo}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-blue-600 dark:text-blue-400 border-l border-slate-200 dark:border-slate-700">{t.vueltasTotales}</td>
                      <td className="px-4 py-2.5 text-center font-medium text-slate-600 dark:text-slate-300">{t.dias4V}</td>
                      <td className="px-4 py-2.5 text-center font-medium text-slate-600 dark:text-slate-300">{t.dias5V}</td>
                      <td className="px-4 py-2.5 text-center font-medium text-slate-600 dark:text-slate-300">{t.dias6V}</td>
                    </tr>
                  ))}
                  
                  {turno.trabajadores.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-slate-500 italic">
                        No hay conductores registrados en este turno.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
