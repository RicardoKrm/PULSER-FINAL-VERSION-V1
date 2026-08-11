import { supabase } from '../../lib/supabase';
import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Upload, FileSpreadsheet, Sun, Moon, LayoutGrid, Download, Search, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';

interface ProcessedRow {
  dia: number;
  supervisor: string;
  supervisor_noche: string;
  
  // Turno Día
  cantidad_caex_dia: string | number;
  caex_dia: string | number;
  operadores_dia: string | number;
  acopio_dia: string | number;
  caex_acopio_dia: string | number;
  planta_dia: string | number;
  caex_planta_dia: string | number;
  vueltas_dia: number;
  pases_cf_dia: number;
  pases_totales_dia: number;
  toneladas_caex_dia: string | number;
  equipo_cf_dia: string;
  produccion_dia: number;
  produccion_cmc_dia: number;
  traspasos_dia: number;

  // Turno Noche
  cantidad_caex_noche: string | number;
  caex_noche: string | number;
  operadores_noche: string | number;
  acopio_noche: string | number;
  caex_acopio_noche: string | number;
  planta_noche: string | number;
  caex_planta_noche: string | number;
  vueltas_noche: number;
  pases_cf_noche: number;
  pases_totales_noche: number;
  toneladas_caex_noche: string | number;
  equipo_cf_noche: string;
  produccion_caex_noche: string | number;
  produccion_noche: number;
  traspasos_noche: number;

  // Totales
  total_imperia: number;
  total_cmc: number;
  diferencia: number;
  
  raw: any[]; 
}

export default function PruebaMina() {
  const { currentCompany } = useCompany();
  const { user } = useAuth();

  const [data, setData] = useState<ProcessedRow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const availableMonths = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resumen' | 'dia' | 'noche' | 'matriz'>('resumen');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [schemaError, setSchemaError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (selectedMonth && currentCompany) {
      loadMonthData(selectedMonth);
    }
  }, [selectedMonth, currentCompany]);

  const loadMonthData = async (mes: string) => {
    try {
      setLoading(true);
      setSchemaError(false);
      const { data: records, error } = await supabase
        .from('produccion_mina_mensual')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('mes', mes)
        .order('dia', { ascending: true });

      if (error) {
        if (error.code === 'PGRST205') {
          setSchemaError(true);
        }
        throw error;
      }

      if (records && records.length > 0) {
        const loaded: ProcessedRow[] = records.map(r => ({
          ...r.raw_data,
          supervisor_noche: r.raw_data?.supervisor_noche || r.raw_data?.dia_mes || r.dia_mes || '',
          total_imperia: r.total_imperia,
          total_cmc: r.total_cmc,
          diferencia: r.diferencia
        }));
        setData(loaded);
      } else {
        setData([]);
      }
    } catch (err: any) {
      console.error(err);
      setError("Error cargando datos de la base de datos.");
    } finally {
      setLoading(false);
    }
  };


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellFormula: true, cellDates: true, cellStyles: true });
        
        let targetSheetData: any[][] | null = null;
        let headerRowIdx = -1;
        let headers: string[] = [];
        
        for (const sName of wb.SheetNames) {
            const ws = wb.Sheets[sName];
            if (!ws) continue;
            
            if (ws['!merges']) {
              ws['!merges'].forEach(merge => {
                const startCol = merge.s.c;
                const endCol = merge.e.c;
                const startRow = merge.s.r;
                const endRow = merge.e.r;
                const refCell = XLSX.utils.encode_cell({ r: startRow, c: startCol });
                const val = ws[refCell] ? ws[refCell].v : undefined;
                for (let R = startRow; R <= endRow; ++R) {
                  for (let C = startCol; C <= endCol; ++C) {
                    const cell = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cell]) {
                      ws[cell] = { t: 's', v: val };
                    } else if (ws[cell].v === undefined) {
                      ws[cell].v = val;
                    }
                  }
                }
              });
            }

            const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];
            
            for (let i = 0; i < Math.min(20, jsonData.length); i++) {
                const rowStr = jsonData[i].map(c => String(c||'')).join(' ').toUpperCase();
                if (rowStr.includes('PRODUCCION_IMPERIA') || rowStr.includes('SUPERVISOR')) {
                    headerRowIdx = i;
                    headers = jsonData[i].map(h => String(h || '').toUpperCase().trim());
                    targetSheetData = jsonData;
                    break;
                }
            }
            if (targetSheetData) break;
        }

        if (!targetSheetData) {
            throw new Error("No se encontró una hoja válida con las columnas 'PRODUCCION_IMPERIA' o 'SUPERVISOR'. Hojas: " + wb.SheetNames.join(', '));
        }

        const findCol = (keywords: string[], defaultIdx: number) => {
          if (!headers || headers.length === 0) return defaultIdx;
          if (keywords.length === 1) {
             const exactIdx = headers.findIndex(h => h === keywords[0] || h === keywords[0].replace(/_/g, ' '));
             if (exactIdx !== -1) return exactIdx;
          }
          const combined = keywords.join('_');
          const exactCombIdx = headers.findIndex(h => h === combined || h === combined.replace(/_/g, ' '));
          if (exactCombIdx !== -1) return exactCombIdx;
          
          const subIdx = headers.findIndex(h => keywords.every(kw => h.includes(kw)));
          if (subIdx !== -1) return subIdx;
          
          if (keywords.length === 2 && (keywords[0].includes('DIA') || keywords[0].includes('NOCHE'))) {
              const baseKw = keywords[1];
              const matches = headers.map((h, i) => h.includes(baseKw) ? i : -1).filter(i => i !== -1);
              if (matches.length > 0) {
                 if (keywords[0].includes('NOCHE') && matches.length > 1) {
                    return matches[1]; 
                 }
                 return matches[0]; 
              }
          }
          return defaultIdx;
        };

        const colDia = findCol(['DIA'], 0);
        const colSup = findCol(['SUPERVISOR', 'DIA'], 1);
        const colDiaMes = findCol(['SUPERVISOR', 'NOCHE'], 2);

        const d_cant_caex = findCol(['TURNO_DIA', 'CANTIDAD_CAEX'], 3);
        const d_caex = findCol(['TURNO_DIA', 'CAEX'], 4);
        const d_operadores = findCol(['TURNO_DIA', 'OPERADORES'], 5);
        const d_acopio = findCol(['TURNO_DIA', 'ACOPIO'], 6);
        const d_caex_acopio = findCol(['TURNO_DIA', 'CAEX_ACOPIO'], 7);
        const d_planta = findCol(['TURNO_DIA', 'PLANTA', 'PRIMARIO'], 8);
        const d_caex_planta = findCol(['TURNO_DIA', 'CAEX_PLANTA'], 9);
        const d_vueltas = findCol(['TURNO_DIA', 'VUELTAS'], 10);
        const d_pases_cf = findCol(['TURNO_DIA', 'PASES_CF'], 11);
        const d_pases_totales = findCol(['TURNO_DIA', 'PASES_TOTALES'], 12);
        const d_toneladas = findCol(['TURNO_DIA', 'TONELADAS'], 13);
        const d_equipo_cf = findCol(['TURNO_DIA', 'EQUIPO_CF'], 14);
        const d_prod_imperia = findCol(['TURNO_DIA', 'PRODUCCION_IMPERIA'], 15);
        const d_prod_ajustada = findCol(['TURNO_DIA', 'PRODUCCION_AJUSTADA'], 16);
        const d_prod_cmc = findCol(['TURNO_DIA', 'PRODUCCION_CMC'], 17);
        const d_traspasos = findCol(['TURNO_DIA', 'TRASPASOS'], 18);

        const n_cant_caex = findCol(['TURNO_NOCHE', 'CANTIDAD_CAEX'], 19);
        const n_caex = findCol(['TURNO_NOCHE', 'CAEX'], 20);
        const n_operadores = findCol(['TURNO_NOCHE', 'OPERADORES'], 21);
        const n_acopio = findCol(['TURNO_NOCHE', 'ACOPIO'], 22);
        const n_caex_acopio = findCol(['TURNO_NOCHE', 'CAEX_ACOPIO'], 23);
        const n_planta = findCol(['TURNO_NOCHE', 'PLANTA', 'PRIMARIO'], 24);
        const n_caex_planta = findCol(['TURNO_NOCHE', 'CAEX_PLANTA'], 25);
        const n_vueltas = findCol(['TURNO_NOCHE', 'VUELTAS'], 26);
        const n_pases_cf = findCol(['TURNO_NOCHE', 'PASES_CF'], 26); // fallback
        const n_pases_totales = findCol(['TURNO_NOCHE', 'PASES_TOTALES'], 27);
        const n_toneladas = findCol(['TURNO_NOCHE', 'TONELADAS'], 28);
        const n_equipo_cf = findCol(['TURNO_NOCHE', 'EQUIPO_CF'], 28); // fallback
        const n_prod_ajustada = findCol(['TURNO_NOCHE', 'PRODUCCION_AJUSTADA'], 29);
        const n_prod_cmc = findCol(['TURNO_NOCHE', 'PRODUCCION_CMC'], 30);
        const n_traspasos = findCol(['TURNO_NOCHE', 'TRASPASOS'], 31);
        const n_prod_imperia = findCol(['TURNO_NOCHE', 'PRODUCCION_IMPERIA'], 27);

        const t_imperia = findCol(['TOTAL_PRODUCCION_IMPERIA'], 32);
        const t_cmc = findCol(['TOTAL_PRODUCCION_CMC'], 33);
        const t_dif = findCol(['DIFERENCIA_CMC_IMPERIA'], 34);

        let dataStartRow = headerRowIdx + 1;
        for (let i = headerRowIdx + 1; i < Math.min(headerRowIdx + 15, targetSheetData.length); i++) {
           if (targetSheetData[i][colDia] == 1 || String(targetSheetData[i][colDia]).trim() === '1' || targetSheetData[i][colDia] === 1) {
             dataStartRow = i;
             break;
           }
        }
        
        const targetRows = targetSheetData.slice(dataStartRow, dataStartRow + 31);
        
        if (targetRows.length === 0) {
          throw new Error("La hoja no contiene datos en las filas esperadas (Día 1 al 31).");
        }

        let lastPozo = '';
        let lastSubPozo = '';

        const processed: ProcessedRow[] = targetRows.map((row, index) => {
          let supervisor = row[colSup] !== null && row[colSup] !== undefined ? String(row[colSup]).trim() : lastPozo;
          let supervisor_noche = row[colDiaMes] !== null && row[colDiaMes] !== undefined ? String(row[colDiaMes]).trim() : lastSubPozo;
          
          if (row[colSup] !== null && row[colSup] !== undefined && String(row[colSup]).trim() !== '') lastPozo = supervisor;
          if (row[colDiaMes] !== null && row[colDiaMes] !== undefined && String(row[colDiaMes]).trim() !== '') lastSubPozo = supervisor_noche;

          const getNum = (val: any) => {
            if (val === null || val === undefined || val === '') return 0;
            if (typeof val === 'number') return isNaN(val) ? 0 : val;
            if (typeof val === 'string') {
               let cleanStr = val.trim();
               if (cleanStr.includes(',') && cleanStr.includes('.')) {
                  if (cleanStr.lastIndexOf(',') > cleanStr.lastIndexOf('.')) {
                     cleanStr = cleanStr.replace(/\./g, '').replace(/,/g, '.');
                  } else {
                     cleanStr = cleanStr.replace(/,/g, '');
                  }
               } else if (cleanStr.includes(',')) {
                  cleanStr = cleanStr.replace(/,/g, '.');
               }
               const parsed = Number(cleanStr);
               return isNaN(parsed) ? 0 : parsed;
            }
            if (typeof val === 'object' && val !== null) {
                if (val.v !== undefined) {
                    const parsed = Number(val.v);
                    return isNaN(parsed) ? 0 : parsed;
                }
            }
            return 0;
          };

          const getString = (val: any) => {
            if (val === null || val === undefined || val === '') return '';
            if (typeof val === 'object' && val !== null && val.v !== undefined) return String(val.v).trim();
            return String(val).trim();
          };

          return {
            dia: index + 1,
            supervisor,
            supervisor_noche,
            cantidad_caex_dia: getNum(row[d_cant_caex]),
            caex_dia: getString(row[d_caex]),
            operadores_dia: getString(row[d_operadores]),
            acopio_dia: getString(row[d_acopio]),
            caex_acopio_dia: getString(row[d_caex_acopio]),
            planta_dia: getString(row[d_planta]),
            caex_planta_dia: getString(row[d_caex_planta]),
            vueltas_dia: getNum(row[d_vueltas]),
            pases_cf_dia: getNum(row[d_pases_cf]),
            pases_totales_dia: getNum(row[d_pases_totales]),
            toneladas_caex_dia: getNum(row[d_toneladas]),
            equipo_cf_dia: row[d_equipo_cf] ? String(row[d_equipo_cf]) : '',
            produccion_dia: getNum(row[d_prod_imperia]),
            produccion_cmc_dia: getNum(row[d_prod_cmc]),
            traspasos_dia: getNum(row[d_traspasos]),
            cantidad_caex_noche: getNum(row[n_cant_caex]),
            caex_noche: getString(row[n_caex]),
            operadores_noche: getString(row[n_operadores]),
            acopio_noche: getString(row[n_acopio]),
            caex_acopio_noche: getString(row[n_caex_acopio]),
            planta_noche: getString(row[n_planta]),
            caex_planta_noche: getString(row[n_caex_planta]),
            vueltas_noche: getNum(row[n_vueltas]),
            pases_cf_noche: getNum(row[n_pases_cf]),
            pases_totales_noche: getNum(row[n_pases_totales]),
            toneladas_caex_noche: getNum(row[n_toneladas]),
            equipo_cf_noche: row[n_equipo_cf] ? String(row[n_equipo_cf]) : '',
            produccion_caex_noche: getNum(row[n_prod_ajustada]),
            produccion_noche: getNum(row[n_prod_imperia]),
            traspasos_noche: getNum(row[n_traspasos]),
            total_imperia: getNum(row[t_imperia]),
            total_cmc: getNum(row[t_cmc]),
            diferencia: getNum(row[t_dif]),
            raw: row
          };
        });

        setData(processed);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error procesando el archivo.");
        alert("Error: " + (err.message || "Error procesando el archivo."));
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Error leyendo el archivo.");
      setLoading(false);
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter(r => 
      r.dia.toString().includes(lower) || 
      r.supervisor.toLowerCase().includes(lower) || r.supervisor_noche.toLowerCase().includes(lower)
    );
  }, [data, searchTerm]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, curr) => ({
      produccion_dia: acc.produccion_dia + curr.produccion_dia,
      produccion_noche: acc.produccion_noche + curr.produccion_noche,
      total_imperia: acc.total_imperia + curr.total_imperia,
      total_cmc: acc.total_cmc + curr.total_cmc,
      diferencia: acc.diferencia + curr.diferencia,
    }), { produccion_dia: 0, produccion_noche: 0, total_imperia: 0, total_cmc: 0, diferencia: 0 });
  }, [filteredData]);

  const handleSaveToDB = async () => {
    if (!currentCompany || data.length === 0) return;
    try {
      setSaving(true);
      
      // Delete existing records for this month
      await supabase
        .from('produccion_mina_mensual')
        .delete()
        .eq('empresa_id', currentCompany.id)
        .eq('mes', selectedMonth);

      // Insert new records
      const insertData = data.map(r => ({
        empresa_id: currentCompany.id,
        mes: selectedMonth,
        dia: r.dia,
        supervisor: r.supervisor,
        dia_mes: r.supervisor_noche,
        produccion_dia: r.produccion_dia,
        produccion_noche: r.produccion_noche,
        total_imperia: r.total_imperia,
        total_cmc: r.total_cmc,
        diferencia: r.diferencia,
        raw_data: r
      }));

      const { error } = await supabase.from('produccion_mina_mensual').insert(insertData);
      if (error) throw error;
      
      alert("Datos guardados exitosamente");
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'PGRST205' || err?.message?.includes('schema') || err?.message?.includes('does not exist')) {
        setSchemaError(true);
      } else {
        alert("Error al guardar en base de datos: " + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(r => {
      const { raw, ...rest } = r;
      return rest;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Procesado");
    XLSX.writeFile(wb, "produccion_mina_procesado.xlsx");
  };

  const formatNum = (num: number) => new Intl.NumberFormat('es-CL').format(num);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          
      
      {schemaError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start mb-6 w-full col-span-full">
          <AlertCircle className="w-6 h-6 text-red-500 mr-3 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-semibold mb-1">Requiere Actualización de Base de Datos</h3>
            <p className="text-red-700 text-sm mb-3">
              Para guardar los datos, es necesario crear la tabla "produccion_mina_mensual" en Supabase. 
              Por favor, ejecuta el siguiente código en el SQL Editor de Supabase:
            </p>
            <pre className="bg-red-900 text-red-100 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
              {`CREATE TABLE IF NOT EXISTS public.produccion_mina_mensual (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresa(id),
    mes TEXT NOT NULL,
    dia INTEGER,
    supervisor TEXT,
    dia_mes TEXT,
    produccion_dia NUMERIC,
    produccion_noche NUMERIC,
    total_imperia NUMERIC,
    total_cmc NUMERIC,
    diferencia NUMERIC,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.produccion_mina_mensual ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a usuarios autenticados" ON public.produccion_mina_mensual FOR ALL USING (true);
`}
            </pre>
          </div>
        </div>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Revisión Producción Mina
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Carga y procesamiento automático de planilla de producción de CAEX.
          </p>
        </div>
        
        <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="" disabled>Seleccione Mes</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
                        {data.length > 0 && (
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
            )}
            
          </div>
      </div>

      {data.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
              <FileSpreadsheet className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Sube el archivo de Producción
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
              Selecciona el archivo Excel ("Revisión Final Produccion Caex Mina Julio 2026.xlsx") para procesar los datos del mes automáticamente.
            </p>
            
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileUpload}
            />
            
            <Button 
              size="lg" 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Seleccionar Archivo Excel
                </span>
              )}
            </Button>

            {error && (
              <div className="mt-6 flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg text-sm">
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-white dark:bg-slate-900">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Imperia Mes</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatNum(totals.total_imperia)}</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total CMC Mes</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatNum(totals.total_cmc)}</p>
              </CardContent>
            </Card>
            <Card className={`bg-white dark:bg-slate-900 border-l-4 ${totals.diferencia < 0 ? 'border-l-red-500' : 'border-l-slate-500'}`}>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Desviación Acumulada</p>
                <p className={`text-2xl font-bold mt-1 ${totals.diferencia < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                  {formatNum(totals.diferencia)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Producción Día</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-300 mt-1">{formatNum(totals.produccion_dia)}</p>
              </CardContent>
            </Card>
            <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Producción Noche</p>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 mt-1">{formatNum(totals.produccion_noche)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setActiveTab('resumen')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'resumen' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Resumen
                </button>
                <button
                  onClick={() => setActiveTab('dia')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'dia' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'}`}
                >
                  <Sun className="h-4 w-4" />
                  Turno Día
                </button>
                <button
                  onClick={() => setActiveTab('noche')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'noche' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                >
                  <Moon className="h-4 w-4" />
                  Turno Noche
                </button>
                <button
                  onClick={() => setActiveTab('matriz')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'matriz' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Matriz Completa
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar día, pozo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 uppercase border-b border-slate-200 dark:border-slate-700">
                  {activeTab === 'resumen' && (
                    <tr>
                      <th className="px-6 py-4 font-semibold">Día</th>
                      <th className="px-6 py-4 font-semibold">Supervisor Día / Supervisor Noche</th>
                      <th className="px-6 py-4 font-semibold text-right">Prod. Día</th>
                      <th className="px-6 py-4 font-semibold text-right">Prod. Noche</th>
                      <th className="px-6 py-4 font-semibold text-right text-slate-900 dark:text-white">Total Imperia</th>
                      <th className="px-6 py-4 font-semibold text-right text-slate-900 dark:text-white">Total CMC</th>
                      <th className="px-6 py-4 font-semibold text-right">Desviación</th>
                    </tr>
                  )}
                  {activeTab === 'dia' && (
                    <tr>
                      <th className="px-6 py-4 font-semibold">Día</th>
                      <th className="px-6 py-4 font-semibold">Supervisor</th>
                      <th className="px-6 py-4 font-semibold text-right">Cant CAEX</th>
                      <th className="px-6 py-4 font-semibold text-right">Operadores</th>
                      <th className="px-6 py-4 font-semibold text-right">Acopio</th>
                      <th className="px-6 py-4 font-semibold text-right">Planta</th>
                      <th className="px-6 py-4 font-semibold text-right">Pases CF</th>
                      <th className="px-6 py-4 font-semibold text-right">Pases Tot</th>
                      <th className="px-6 py-4 font-semibold text-right text-amber-600">Prod Día</th>
                    </tr>
                  )}
                  {activeTab === 'noche' && (
                    <tr>
                      <th className="px-6 py-4 font-semibold">Día</th>
                      <th className="px-6 py-4 font-semibold">Supervisor</th>
                      <th className="px-6 py-4 font-semibold text-right">Cant CAEX</th>
                      <th className="px-6 py-4 font-semibold text-right">Operadores</th>
                      <th className="px-6 py-4 font-semibold text-right">Acopio</th>
                      <th className="px-6 py-4 font-semibold text-right">Planta</th>
                      <th className="px-6 py-4 font-semibold text-right">Pases CF</th>
                      <th className="px-6 py-4 font-semibold text-right">Pases Tot</th>
                      <th className="px-6 py-4 font-semibold text-right text-indigo-600">Prod Noche</th>
                    </tr>
                  )}
                  {activeTab === 'matriz' && (
                    <tr>
                      <th className="px-4 py-3 font-semibold">Día</th>
                      <th className="px-4 py-3 font-semibold">Supervisor</th>
                      <th className="px-4 py-3 font-semibold">Supervisor Noche</th>
                      {Array.from({length: 36}).map((_, i) => {
                        const originalColIndex = i + 3;
                        if ([18, 33, 37, 38].includes(originalColIndex)) return null;
                        
                        const headerMap: Record<number, string> = {
                          3: 'CAEX',
                          4: 'Nº CAEX',
                          5: 'Operadores',
                          6: 'Acopio',
                          7: 'CAEX Acopio',
                          8: 'Primario',
                          9: 'CAEX Primario',
                          10: 'Vueltas',
                          11: 'Pases CF',
                          12: 'Pases Totales CF',
                          13: 'Toneladas CAEX',
                          14: 'CF',
                          15: 'Prod. Total Día',
                          16: 'Prod. CMC',
                          17: 'Traspasos',
                          19: 'Nº de CAEX',
                          20: 'Nº CAEX',
                          21: 'Operador',
                          22: 'Acopio',
                          23: 'CAEX',
                          24: 'Primario',
                          25: 'CAEX',
                          26: 'Pases CF',
                          27: 'Pases Totales',
                          28: 'Prod. CAEX',
                          29: 'Equipo CF',
                          30: 'Prod. CAEX',
                          31: 'Prod. Total Noche',
                          32: 'Traspasos',
                          34: 'T. IMPERIA',
                          35: 'T. CMC',
                          36: 'Diferencias'
                        };
                        const title = headerMap[originalColIndex] || `Col ${originalColIndex + 1}`;
                        return <th key={i} className="px-4 py-3 font-semibold">{title}</th>;
                      })}
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      
                      {activeTab === 'resumen' && (
                        <>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{row.dia}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium">{row.supervisor}</span>
                              <span className="text-xs text-slate-500">{row.supervisor_noche}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">{formatNum(row.produccion_dia)}</td>
                          <td className="px-6 py-4 text-right">{formatNum(row.produccion_noche)}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatNum(row.total_imperia)}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatNum(row.total_cmc)}</td>
                          <td className={`px-6 py-4 text-right font-semibold ${row.diferencia < 0 ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                            {formatNum(row.diferencia)}
                          </td>
                        </>
                      )}

                      {activeTab === 'dia' && (
                        <>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{row.dia}</td>
                          <td className="px-6 py-4">{row.supervisor}</td>
                          <td className="px-6 py-4 text-right">{row.cantidad_caex_dia}</td>
                          <td className="px-6 py-4 text-right">{row.operadores_dia}</td>
                          <td className="px-6 py-4 text-right">{row.acopio_dia}</td>
                          <td className="px-6 py-4 text-right">{row.planta_dia}</td>
                          <td className="px-6 py-4 text-right">{row.pases_cf_dia}</td>
                          <td className="px-6 py-4 text-right font-medium bg-slate-50 dark:bg-slate-800/50">{row.pases_totales_dia}</td>
                          <td className="px-6 py-4 text-right font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/10">{formatNum(row.produccion_dia)}</td>
                        </>
                      )}

                      {activeTab === 'noche' && (
                        <>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{row.dia}</td>
                          <td className="px-6 py-4">{row.supervisor}</td>
                          <td className="px-6 py-4 text-right">{row.cantidad_caex_noche}</td>
                          <td className="px-6 py-4 text-right">{row.operadores_noche}</td>
                          <td className="px-6 py-4 text-right">{row.acopio_noche}</td>
                          <td className="px-6 py-4 text-right">{row.planta_noche}</td>
                          <td className="px-6 py-4 text-right">{row.pases_cf_noche}</td>
                          <td className="px-6 py-4 text-right font-medium bg-slate-50 dark:bg-slate-800/50">{row.pases_totales_noche}</td>
                          <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10">{formatNum(row.produccion_noche)}</td>
                        </>
                      )}

                      {activeTab === 'matriz' && (
                        <>
                          <td className="px-4 py-2 font-medium bg-slate-50 dark:bg-slate-800 sticky left-0">{row.dia}</td>
                          <td className="px-4 py-2 truncate max-w-[150px]" title={row.supervisor}>{row.supervisor}</td>
                          <td className="px-4 py-2 truncate max-w-[150px]" title={row.supervisor_noche}>{row.supervisor_noche}</td>
                          {Array.from({length: 36}).map((_, colIdx) => {
                            const originalColIndex = colIdx + 3;
                            if ([18, 33, 37, 38].includes(originalColIndex)) return null;
                            const val = row.raw[originalColIndex];
                            
                            let valClass = "px-4 py-2 text-right";
                            if (originalColIndex === 36 && typeof val === 'number') {
                              if (val < 0) {
                                valClass += " font-semibold text-red-600 dark:text-red-400";
                              } else {
                                valClass += " font-semibold text-slate-900 dark:text-white";
                              }
                            }
                            
                            return (
                              <td key={colIdx} className={valClass}>
                                {typeof val === 'number' ? formatNum(val) : val?.toString() || '-'}
                              </td>
                            )
                          })}
                        </>
                      )}

                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
