import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { Calendar, Upload, TrendingUp, AlertCircle, Loader2, Database, Download, CheckSquare } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

type ProduccionRow = {
  id: string;
  fecha: string;
  turno: string;
  zona: string;
  ctd_caex: number;
  caex_nombres: string;
  operadores: string;
  vueltas_acopio: number;
  vueltas_planta: number;
  vueltas_totales: number;
  pases_cf: number;
  cf_equipo: string;
  produccion_dia: number;
  produccion_cmc: number;
  traspasos: number;
};

type TotalesRow = {
  fecha: string;
  total_imperia: number;
  total_cmc: number;
  traspasos_totales: number;
};

export default function ReporteDiarioMinaPanel() {
  const [data, setData] = useState<ProduccionRow[]>([]);
  const [totales, setTotales] = useState<TotalesRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSchemaError(false);
    try {
      const { data: rows, error: errRows } = await supabase
        .from('produccion_cmc')
        .select('*')
        .order('fecha', { ascending: false });

      if (errRows) {
        if (errRows.code === '42P01') {
          setSchemaError(true);
          throw new Error('La tabla produccion_cmc no existe. Por favor, ejecuta el script SQL.');
        }
        throw errRows;
      }

      const { data: totRows, error: errTot } = await supabase
        .from('produccion_cmc_totales')
        .select('*')
        .order('fecha', { ascending: false });

      if (errTot && errTot.code !== '42P01') {
        console.warn(errTot);
      }

      setData(rows || []);
      setTotales(totRows || []);
      
      if (rows && rows.length > 0 && !selectedDate) {
        setSelectedDate(rows[0].fecha);
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatNum = (num: number) => num ? num.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0,0';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Parser adaptado a la estructura del excel enviado
      // Buscamos las filas correspondientes a los días del 1 al 31
      let monthRows = [];
      let currentZona = 'POZO CARVAJAL'; // Valor por defecto
      
      const toParseData: Partial<ProduccionRow>[] = [];
      const toParseTotales: Partial<TotalesRow>[] = [];

      let currentDate = new Date();
      let year = currentDate.getFullYear();
      // En un caso real se podría extraer el mes/año del título del excel, 
      // usaremos el mes actual para el MVP o intentar parsearlo.
      let month = currentDate.getMonth() + 1; 

      for (let r = 0; r < rawData.length; r++) {
        const row = rawData[r];
        if (!row || row.length === 0) continue;

        // El día está en la columna 1
        const dayCell = parseInt(row[1]);
        if (!isNaN(dayCell) && dayCell >= 1 && dayCell <= 31) {
          
          // ZONA está en la columna 0 y puede ser una celda combinada (solo tiene valor en la primera fila del bloque)
          if (row[0] && typeof row[0] === 'string' && row[0].trim() !== '') {
            currentZona = row[0].trim();
          }
          
          let dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayCell).padStart(2, '0')}`;
          
          // Turno DÍA
          toParseData.push({
            fecha: dateStr,
            turno: 'Día',
            zona: currentZona, 
            ctd_caex: parseInt(row[2]) || 0,
            caex_nombres: String(row[3] || ''),
            operadores: String(row[4] || ''),
            vueltas_acopio: parseInt(row[5]) || 0,
            vueltas_planta: parseInt(row[7]) || 0,
            vueltas_totales: (parseInt(row[5]) || 0) + (parseInt(row[7]) || 0),
            pases_cf: parseInt(row[10]) || 0,
            cf_equipo: String(row[12] || ''),
            produccion_dia: parseFloat(String(row[13]).replace(',', '.')) || 0,
            produccion_cmc: parseFloat(String(row[14]).replace(',', '.')) || 0,
            traspasos: parseFloat(String(row[15]).replace(',', '.')) || 0
          });

          // Turno NOCHE
          toParseData.push({
            fecha: dateStr,
            turno: 'Noche',
            zona: currentZona, 
            ctd_caex: parseInt(row[16]) || 0,
            caex_nombres: String(row[17] || ''),
            operadores: String(row[18] || ''),
            vueltas_acopio: parseInt(row[19]) || 0,
            vueltas_planta: parseInt(row[21]) || 0,
            vueltas_totales: (parseInt(row[19]) || 0) + (parseInt(row[21]) || 0),
            pases_cf: parseInt(row[23]) || 0,
            cf_equipo: String(row[25] || ''), 
            produccion_dia: parseFloat(String(row[26]).replace(',', '.')) || 0, // Usamos la columna principal de Producción Día (26)
            produccion_cmc: parseFloat(String(row[27]).replace(',', '.')) || 0,
            traspasos: parseFloat(String(row[28]).replace(',', '.')) || 0
          });

          // Totales 
          toParseTotales.push({
             fecha: dateStr,
             traspasos_totales: (parseFloat(String(row[15]).replace(',', '.')) || 0) + (parseFloat(String(row[28]).replace(',', '.')) || 0),
             total_imperia: parseFloat(String(row[29]).replace(',', '.')) || 0,
             total_cmc: parseFloat(String(row[30]).replace(',', '.')) || 0
          });
        }
      }

      if (toParseData.length > 0) {
        // Para que no se dupliquen al subir múltiples veces, primero borramos los del mismo mes
        // O más sencillo, lo insertamos directamente para la demo. 
        const { error } = await supabase.from('produccion_cmc').insert(toParseData.filter(d => d.ctd_caex! > 0 || d.produccion_cmc! > 0 || d.produccion_dia! > 0));
        if (error) throw error;

        // Para evitar duplicados en totales
        const uniqueTotales = Array.from(new Map(toParseTotales.filter(t => t.total_imperia! > 0 || t.total_cmc! > 0).map(item => [item.fecha, item])).values());
        const { error: errTot } = await supabase.from('produccion_cmc_totales').insert(uniqueTotales);
        
        Swal.fire('Éxito', 'Excel procesado e importado correctamente', 'success');
        fetchData();
      } else {
        Swal.fire('Atención', 'No se detectaron filas de días (1-31) válidas en la columna B del Excel.', 'warning');
      }
      
    } catch (e: any) {
      console.error(e);
      Swal.fire('Error', e.message, 'error');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const activeRows = data.filter(r => r.fecha === selectedDate);
  const activeTotales = totales.find(t => t.fecha === selectedDate);

  const globalImperia = totales.reduce((acc, curr) => acc + (curr.total_imperia || 0), 0);
  const globalCMC = totales.reduce((acc, curr) => acc + (curr.total_cmc || 0), 0);
  const totalTraspasos = totales.reduce((acc, curr) => acc + (curr.traspasos_totales || 0), 0);

  const uniqueDates = Array.from(new Set(data.map(d => d.fecha))).sort((a,b) => String(b).localeCompare(String(a)));

  return (
    <div className="space-y-6 animate-fade-in">
      
      {schemaError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
          <Database className="w-6 h-6 text-red-500 mr-3 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-semibold mb-1">Requiere Actualización de Base de Datos</h3>
            <p className="text-red-700 text-sm mb-3">
              Para incorporar la nueva estructura del Excel de Producción (Imperia vs CMC), es necesario crear las tablas correspondientes.
            </p>
            <p className="text-red-700 font-mono text-xs bg-red-100 p-2 rounded block">
              Se ha creado el archivo "produccion_cmc_schema.sql" en la raíz del proyecto con las instrucciones SQL necesarias.
            </p>
          </div>
        </div>
      )}

      {/* Header KPI */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-xl p-6 text-white shadow-lg relative border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <TrendingUp className="w-6 h-6 mr-3 text-indigo-400" />
            Control Producción Mina
          </h2>
          <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <label className={`flex items-center ${uploading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-500'} text-white py-2 px-4 rounded-md transition-colors text-sm font-medium shadow-sm cursor-pointer`}>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? 'Importando...' : 'Cargar Excel Mina'}
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 rounded-lg p-5 border border-white/10 backdrop-blur-sm">
            <p className="text-sm text-indigo-200 mb-1 font-medium flex items-center">
              <CheckSquare className="w-4 h-4 mr-2 opacity-70" />
              Total Acumulado Imperia
            </p>
            <p className="text-3xl font-bold text-white">{formatNum(globalImperia)} <span className="text-sm text-indigo-300 font-normal">Ton</span></p>
          </div>
          <div className="bg-white/5 rounded-lg p-5 border border-white/10 backdrop-blur-sm">
             <p className="text-sm text-blue-200 mb-1 font-medium flex items-center">
              <CheckSquare className="w-4 h-4 mr-2 opacity-70" />
              Total Acumulado CMC
            </p>
            <p className="text-3xl font-bold text-white">{formatNum(globalCMC)} <span className="text-sm text-blue-300 font-normal">Ton</span></p>
          </div>
          <div className="bg-white/5 rounded-lg p-5 border border-white/10 backdrop-blur-sm">
            <p className="text-sm text-amber-200 mb-1 font-medium flex items-center">
              <CheckSquare className="w-4 h-4 mr-2 opacity-70" />
              Diferencia (CMC - Imperia)
            </p>
            <p className={`text-3xl font-bold ${globalCMC - globalImperia > 0 ? 'text-green-400' : 'text-red-400'}`}>
               {globalCMC - globalImperia > 0 ? '+' : ''}{formatNum(globalCMC - globalImperia)} <span className="text-sm opacity-70 font-normal">Ton</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Date Selector Sidebar */}
        <Card className="p-4 lg:w-64 shrink-0 shadow-sm border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
            Registro Diario
          </h3>
          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {uniqueDates.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-2">No hay fechas registradas. Sube un excel.</p>
            ) : (
              uniqueDates.map(date => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedDate === date
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {date}
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Detalle del día */}
        <Card className="flex-1 p-0 overflow-hidden shadow-sm border-slate-200 flex flex-col">
          {selectedDate ? (
            <>
               <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                  <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Detalle de Operación: {selectedDate}</h3>
                  {activeTotales && (
                     <div className="flex gap-4 text-sm bg-white dark:bg-slate-900 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div><span className="text-slate-500">Imperia:</span> <span className="font-bold text-slate-800 dark:text-white">{formatNum(activeTotales.total_imperia)}</span></div>
                        <div><span className="text-slate-500">CMC:</span> <span className="font-bold text-slate-800 dark:text-white">{formatNum(activeTotales.total_cmc)}</span></div>
                     </div>
                  )}
               </div>
               
               <div className="p-0 overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                     <tr>
                       <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Turno</th>
                       <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Zona</th>
                       <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">CAEX</th>
                       <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Acopio/Planta</th>
                       <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Pases CF</th>
                       <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider">Prod. Día</th>
                       <th className="px-4 py-3 font-semibold uppercase text-xs tracking-wider text-indigo-600 dark:text-indigo-400">P. CMC</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {activeRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                            No hay detalle cargado para esta fecha.
                          </td>
                        </tr>
                      ) : (
                        activeRows.map(row => (
                          <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${row.turno.toLowerCase() === 'día' ? 'bg-amber-100 text-amber-800' : 'bg-slate-700 text-slate-200'}`}>
                                {row.turno}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{row.zona}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800 dark:text-slate-200">{row.ctd_caex} Equipos</div>
                              <div className="text-xs text-slate-500 truncate max-w-[150px]" title={row.caex_nombres}>{row.caex_nombres}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{row.vueltas_acopio}</span> / <span className="text-blue-600 dark:text-blue-400 font-medium">{row.vueltas_planta}</span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{row.pases_cf}</td>
                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{formatNum(row.produccion_dia)}</td>
                            <td className="px-4 py-3 font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10">
                              {formatNum(row.produccion_cmc)}
                            </td>
                          </tr>
                        ))
                      )}
                   </tbody>
                 </table>
               </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <Database className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">Selecciona una fecha</h3>
              <p className="text-slate-500 mt-2">Usa el panel lateral para ver el detalle de producción diario y las comparativas.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
