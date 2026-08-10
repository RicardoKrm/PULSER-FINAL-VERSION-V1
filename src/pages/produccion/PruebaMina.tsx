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
  dia_mes: string;
  
  // Turno Día
  cantidad_caex_dia: number;
  caex_dia: number;
  operadores_dia: number;
  acopio_dia: number;
  caex_acopio_dia: number;
  planta_dia: number;
  caex_planta_dia: number;
  vueltas_dia: number;
  pases_cf_dia: number;
  pases_totales_dia: number;
  toneladas_caex_dia: number;
  equipo_cf_dia: string;
  produccion_dia: number;
  produccion_cmc_dia: number;
  traspasos_dia: number;

  // Turno Noche
  cantidad_caex_noche: number;
  caex_noche: number;
  operadores_noche: number;
  acopio_noche: number;
  caex_acopio_noche: number;
  planta_noche: number;
  caex_planta_noche: number;
  vueltas_noche: number;
  pases_cf_noche: number;
  pases_totales_noche: number;
  toneladas_caex_noche: number;
  equipo_cf_noche: string;
  produccion_caex_noche: number;
  produccion_noche: number;
  traspasos_noche: number;

  // Totales
  total_imperia: number;
  total_cmc: number;
  diferencia: number;
  
  raw: any[]; 
}

export default function PruebaMina() {
  const [data, setData] = useState<ProcessedRow[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const availableMonths = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

  React.useEffect(() => {
    if (selectedMonth && currentCompany) {
      loadMonthData(selectedMonth);
    }
  }, [selectedMonth, currentCompany]);

  const loadMonthData = async (mes: string) => {
    try {
      setLoading(true);
      const { data: records, error } = await supabase
        .from('produccion_mina_mensual')
        .select('*')
        .eq('empresa_id', currentCompany?.id)
        .eq('mes', mes)
        .order('dia', { ascending: true });

      if (error) throw error;

      if (records && records.length > 0) {
        const loaded: ProcessedRow[] = records.map(r => ({
          ...r.raw_data,
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resumen' | 'dia' | 'noche' | 'matriz'>('resumen');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { currentCompany } = useCompany();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        
        // Prefer sheet "JULIO 2026", else first sheet
        const sheetName = wb.SheetNames.includes("JULIO 2026") ? "JULIO 2026" : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];

        if (!ws) {
          throw new Error("No se pudo leer la hoja de datos.");
        }

        // Handle merged cells by filling them down/across
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
        
        // We need rows 8 to 38 (0-indexed: 7 to 37)
        const targetRows = jsonData.slice(7, 38);
        
        if (targetRows.length === 0) {
          throw new Error("La hoja no contiene datos en las filas esperadas (8 a 38).");
        }

        let lastPozo = '';
        let lastSubPozo = '';

        const processed: ProcessedRow[] = targetRows.map((row, index) => {
          let supervisor = row[1] !== null && row[1] !== undefined ? String(row[1]).trim() : lastPozo;
          let dia_mes = row[2] !== null && row[2] !== undefined ? String(row[2]).trim() : lastSubPozo;
          
          if (row[1] !== null && row[1] !== undefined) lastPozo = supervisor;
          if (row[2] !== null && row[2] !== undefined) lastSubPozo = dia_mes;

          const getNum = (val: any) => {
            if (val === null || val === undefined) return 0;
            if (typeof val === 'number') return isNaN(val) ? 0 : val;
            if (typeof val === 'string') {
               const parsed = Number(val.replace(/,/g, ''));
               return isNaN(parsed) ? 0 : parsed;
            }
            if (typeof val === 'object' && val !== null) {
                // If it's a formula object from xlsx cell
                if (val.v !== undefined) {
                    const parsed = Number(val.v);
                    return isNaN(parsed) ? 0 : parsed;
                }
            }
            return 0;
          };

          return {
            dia: index + 1, // 1 to 31
            supervisor,
            dia_mes,

            // Turno Día
            cantidad_caex_dia: getNum(row[3]), // Col 4
            caex_dia: getNum(row[4]), // Col 5
            operadores_dia: getNum(row[5]), // Col 6
            acopio_dia: getNum(row[6]), // Col 7
            caex_acopio_dia: getNum(row[7]), // Col 8
            planta_dia: getNum(row[8]), // Col 9
            caex_planta_dia: getNum(row[9]), // Col 10
            vueltas_dia: getNum(row[10]), // Col 11
            pases_cf_dia: getNum(row[11]), // Col 12
            pases_totales_dia: getNum(row[12]), // Col 13
            toneladas_caex_dia: getNum(row[13]), // Col 14
            equipo_cf_dia: row[14] ? String(row[14]) : '', // Col 15
            produccion_dia: getNum(row[15]), // Col 16
            produccion_cmc_dia: getNum(row[16]), // Col 17
            traspasos_dia: getNum(row[17]), // Col 18

            // Turno Noche
            cantidad_caex_noche: getNum(row[19]), // Col 20
            caex_noche: getNum(row[20]), // Col 21
            operadores_noche: getNum(row[21]), // Col 22
            acopio_noche: getNum(row[22]), // Col 23
            caex_acopio_noche: getNum(row[23]), // Col 24
            planta_noche: getNum(row[24]), // Col 25
            caex_planta_noche: getNum(row[25]), // Col 26
            vueltas_noche: 0, // Not mentioned
            pases_cf_noche: getNum(row[26]), // Col 27
            pases_totales_noche: getNum(row[27]), // Col 28
            toneladas_caex_noche: getNum(row[28]), // Col 29
            equipo_cf_noche: row[29] ? String(row[29]) : '', // Col 30
            produccion_caex_noche: getNum(row[30]), // Col 31
            produccion_noche: getNum(row[31]), // Col 32
            traspasos_noche: getNum(row[32]), // Col 33

            // Totales
            total_imperia: getNum(row[15]) + getNum(row[31]), // Suma Producción Día + Producción Noche
            total_cmc: getNum(row[35]), // Col 36
            diferencia: (getNum(row[15]) + getNum(row[31])) - getNum(row[35]), // total_imperia - total_cmc

            raw: row
          };
        });

        setData(processed);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Error procesando el archivo.");
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Error leyendo el archivo.");
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };



  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter(r => 
      r.dia.toString().includes(lower) || 
      r.supervisor.toLowerCase().includes(lower) || r.dia_mes.toLowerCase().includes(lower)
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
        dia_mes: r.dia_mes,
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
      alert("Error al guardar en base de datos: " + err.message);
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
                      <th className="px-6 py-4 font-semibold">Supervisor / Día del Mes</th>
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
                      <th className="px-4 py-3 font-semibold">Día del Mes</th>
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
                              <span className="text-xs text-slate-500">{row.dia_mes}</span>
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
                          <td className="px-4 py-2 truncate max-w-[150px]" title={row.dia_mes}>{row.dia_mes}</td>
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
