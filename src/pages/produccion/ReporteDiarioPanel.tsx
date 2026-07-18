import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Calendar, Truck, TrendingUp, AlertCircle, Droplet, FileSpreadsheet, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';

type TurnoDetalle = {

  camion: string;
  chofer: string;
  tonelaje: number;
  vueltas: number;
  petroleo?: number;
};

type Turno = {
  nombre: string;
  totalVueltas: number;
  totalToneladas: number;
  novedades: string[];
  transfer?: string;
  detalles: TurnoDetalle[];
};

type ReporteDia = {
  id: string;
  fechaStr: string;
  turnos: Turno[];
};

export default function ReporteDiarioPanel() {
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [reportes, setReportes] = useState<ReporteDia[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReportes = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('produccion_registro_diario')
        .select('*');
        
      if (error) {
         if (error.code === '42P01') {
             throw new Error("La tabla 'produccion_registro_diario' no existe en la base de datos.");
         }
         throw new Error(error.message || "Error al cargar los reportes");
      }
      
      if (!Array.isArray(data)) {
         throw new Error("Formato de respuesta inválido");
      }

      // Group by date, then by turno
      const grouped: Record<string, Record<string, any[]>> = {};
      
      data.forEach(row => {
        const dateStr = row.fecha; // YYYY-MM-DD
        if (!grouped[dateStr]) grouped[dateStr] = {};
        
        const turno = row.turno;
        if (!grouped[dateStr][turno]) grouped[dateStr][turno] = [];
        
        grouped[dateStr][turno].push(row);
      });

      const parsedReportes: ReporteDia[] = Object.keys(grouped).sort((a, b) => b.localeCompare(a)).map(dateStr => {
         const dateObj = new Date(dateStr + "T00:00:00");
         const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
         const formattedDate = `${days[dateObj.getDay()]} ${dateStr.split('-').reverse().join('-')}`;
         
         const turnos = Object.keys(grouped[dateStr]).map(turnoName => {
            const rows = grouped[dateStr][turnoName];
            
            let totalVueltas = 0;
            let totalToneladas = 0;
            let novedades = new Set<string>();
            let transfers = new Set<string>();
            
            const detalles = rows.map(r => {
               totalVueltas += Number(r.vueltas) || 0;
               totalToneladas += Number(r.tonelaje) || 0;
               
               if (r.novedades) {
                 r.novedades.split('|').forEach((n: string) => {
                   if (n.trim()) novedades.add(n.trim());
                 });
               }
               
               if (r.transfer) {
                 transfers.add(r.transfer);
               }
               
               return {
                 camion: r.camion,
                 chofer: r.chofer,
                 tonelaje: Number(r.tonelaje) || 0,
                 vueltas: Number(r.vueltas) || 0,
                 petroleo: r.petroleo ? Number(r.petroleo) : undefined
               };
            });

            return {
               nombre: turnoName,
               totalVueltas,
               totalToneladas,
               novedades: Array.from(novedades),
               transfer: Array.from(transfers).join(' | '),
               detalles
            };
         });
         
         return {
           id: dateStr,
           fechaStr: formattedDate,
           turnos
         };
      });

      setReportes(parsedReportes);
      if (parsedReportes.length > 0 && !selectedDateId) {
        setSelectedDateId(parsedReportes[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportes();
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString('es-CL', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  };

  const activeReport = useMemo(() => reportes.find(r => r.id === selectedDateId), [reportes, selectedDateId]);

  // Total accumulators
  const monthlyTotals = useMemo(() => {
    let totalVueltas = 0;
    let totalToneladas = 0;
    
    reportes.forEach(reporte => {
      reporte.turnos.forEach(turno => {
        totalVueltas += turno.totalVueltas;
        totalToneladas += turno.totalToneladas;
      });
    });

    return { totalVueltas, totalToneladas };
  }, [reportes]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        throw new Error("El archivo Excel está vacío");
      }

      // Format data for DB
      const formattedData = data.map((row, index) => {
        // Find keys dynamically to handle variations in whitespace or casing
        const getVal = (searchStr: string) => {
           const key = Object.keys(row).find(k => k.toLowerCase().includes(searchStr.toLowerCase()));
           return key ? row[key] : undefined;
        };

        // Handle dates
        let fecha = new Date();
        const fechaVal = getVal('fecha');
        if (fechaVal) {
           const fechaStr = fechaVal;
           if (typeof fechaStr === 'number') {
             fecha = new Date(Math.round((fechaStr - 25569) * 86400 * 1000));
           } else {
             const str = String(fechaStr).trim();
             const cleanStr = str.replace(/\//g, '-');
             
             const dateMatch = cleanStr.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
             if (dateMatch) {
               const [_, d, m, y] = dateMatch;
               fecha = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00Z`);
             } else {
               const dateMatchRev = cleanStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
               if (dateMatchRev) {
                 const [_, y, m, d] = dateMatchRev;
                 fecha = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00Z`);
               } else {
                 fecha = new Date(str);
               }
             }
           }
        }

        let fechaString = new Date().toISOString().split('T')[0];
        if (!isNaN(fecha.getTime())) {
          fechaString = fecha.toISOString().split('T')[0];
        }

        const parseNumber = (val: any) => {
          if (typeof val === 'number') return val;
          if (!val) return 0;
          let str = String(val).trim();
          
          if (str.includes('.') && str.includes(',')) {
             const lastDot = str.lastIndexOf('.');
             const lastComma = str.lastIndexOf(',');
             if (lastComma > lastDot) {
                 str = str.replace(/\./g, '').replace(',', '.');
             } else {
                 str = str.replace(/,/g, '');
             }
          } else if (str.includes(',')) {
             str = str.replace(',', '.');
          }
          
          const num = parseFloat(str);
          return isNaN(num) ? 0 : num;
        };

        const camionVal = getVal('cami');
        const choferVal = getVal('chofer');
        const turnoVal = getVal('turno');
        const tonelajeVal = getVal('tonela');
        const vueltasVal = getVal('vuelta');
        const petroleoVal = getVal('petr');
        const novedadesVal = getVal('novedad') || getVal('totales');
        const transferVal = getVal('transfer');

        return {
          fecha: fechaString,
          turno: String(turnoVal || 'Día'),
          camion: String(camionVal || ''),
          chofer: String(choferVal || ''),
          tonelaje: parseNumber(tonelajeVal),
          vueltas: parseNumber(vueltasVal),
          petroleo: petroleoVal ? parseNumber(petroleoVal) : null,
          novedades: String(novedadesVal || ''),
          transfer: String(transferVal || '')
        };
      }).filter(r => r.camion);

      if (formattedData.length === 0) {
        throw new Error("No se encontraron filas válidas en el Excel");
      }

      // Delete existing data for the same fecha and turno before inserting
      const turnosAEliminar = Array.from(new Set(formattedData.map(d => `${d.fecha}|${d.turno}`)));
      for (const combo of turnosAEliminar) {
         const [fecha, turno] = combo.split('|');
         await supabase
           .from('produccion_registro_diario')
           .delete()
           .eq('fecha', fecha)
           .eq('turno', turno);
      }

      // Bulk insert
      const { data: insertedData, error } = await supabase
        .from('produccion_registro_diario')
        .insert(formattedData)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      alert(`Carga exitosa. ${formattedData.length} registros insertados.`);
      await fetchReportes();
    } catch (err: any) {
      alert(`Error al subir el archivo: ${err.message}`);
    } finally {
      setUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Totals Section */}
      <div className="bg-gradient-to-br from-blue-900 to-slate-800 rounded-xl p-6 text-white shadow-lg relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-xl font-semibold text-blue-100 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Total Acumulado del Mes
          </h2>
          <label className={`mt-4 md:mt-0 flex items-center ${uploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-500'} text-white py-2 px-4 rounded-md transition-colors text-sm font-medium border border-blue-400 cursor-pointer`}>
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            {uploading ? 'Subiendo...' : 'Importar Excel'}
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <p className="text-sm text-blue-200 mb-1 font-medium">Total Toneladas (Mes)</p>
            <p className="text-3xl font-bold">{formatNumber(monthlyTotals.totalToneladas)} Ton</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
            <p className="text-sm text-blue-200 mb-1 font-medium">Total Vueltas (Mes)</p>
            <p className="text-3xl font-bold">{monthlyTotals.totalVueltas} Vueltas</p>
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </Card>
      ) : errorMsg ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error de Conexión</h3>
          <p className="text-gray-500 max-w-md">{errorMsg}</p>
        </Card>
      ) : reportes.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-50 text-blue-500 p-4 rounded-full mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay datos de producción</h3>
          <p className="text-gray-500 max-w-md">
            El módulo de reportes diarios está listo. Utiliza el botón "Importar Excel" en la parte superior para realizar la carga masiva de los datos de este mes.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Date Selector Sidebar */}
          <Card className="p-4 lg:w-64 shrink-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Seleccionar Día
            </h3>
            <div className="space-y-2">
              {reportes.map(reporte => (
                <button
                  key={reporte.id}
                  onClick={() => setSelectedDateId(reporte.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedDateId === reporte.id
                      ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  {reporte.fechaStr}
                </button>
              ))}
            </div>
          </Card>

          {/* Daily Report Detail */}
          <div className="flex-1 space-y-6">
            {activeReport?.turnos.map((turno, idx) => (
              <Card key={idx} className="p-6">
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Fecha: <span className="font-normal text-gray-600">{activeReport.fechaStr}</span>
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Turno: {turno.nombre}
                  </span>
                </div>
                <div className="text-md text-gray-700 font-medium">
                  Totales del turno:{' '}
                  <span className="text-blue-600">{turno.totalVueltas} Vueltas</span> |{' '}
                  <span className="text-blue-600">{formatNumber(turno.totalToneladas)} Toneladas</span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-900 mb-2">Novedades:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {turno.novedades.map((novedad, nIdx) => (
                    <li key={nIdx} className="text-sm text-gray-600">{novedad}</li>
                  ))}
                </ul>
              </div>

              {turno.transfer && (
                <div className="mb-6 bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm text-yellow-800">
                  <span className="font-bold">Transfer:</span> {turno.transfer}
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Detalle por Camión y Chofer:</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camión</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chofer</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tonelaje</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Vueltas</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Petróleo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(() => {
                        const maxTonelaje = Math.max(...turno.detalles.map(d => d.tonelaje), 0.01);
                        return turno.detalles.map((detalle, dIdx) => (
                          <tr key={dIdx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                              <Truck className="w-4 h-4 mr-2 text-gray-400" />
                              {detalle.camion}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{detalle.chofer}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-medium mb-1">{formatNumber(detalle.tonelaje)}</span>
                                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 rounded-full" 
                                    style={{ width: `${Math.min(100, (detalle.tonelaje / maxTonelaje) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">{detalle.vueltas}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                              {detalle.petroleo ? (
                                <span className="flex items-center justify-end">
                                  {formatNumber(detalle.petroleo)}
                                  <Droplet className="w-3 h-3 ml-1 text-blue-400" />
                                </span>
                              ) : '-'}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}
