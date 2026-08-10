import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Upload, FileSpreadsheet, Sun, Moon, LayoutGrid, Download, Search, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface ProcessedRow {
  dia: number;
  pozo: string;
  subPozo: string;
  
  // Turno Día
  cantidadCaexDia: number;
  caexDia: number;
  operadoresDia: number;
  acopioDia: number;
  caexAcopioDia: number;
  plantaDia: number;
  caexPlantaDia: number;
  vueltasDia: number;
  pasesCfDia: number;
  pasesTotalesDia: number;
  horasCfDia: number;
  produccionDia: number; // Q
  produccionCmcDia: number; // R
  traspasosDia: number;

  // Turno Noche
  cantidadCaexNoche: number;
  caexNoche: number;
  operadoresNoche: number;
  acopioNoche: number;
  caexAcopioNoche: number;
  plantaNoche: number;
  caexPlantaNoche: number;
  vueltasNoche: number;
  pasesCfNoche: number;
  pasesTotalesNoche: number;
  horasCfNoche: number;
  produccionNoche: number; // AF
  produccionCmcNoche: number; // AG
  traspasosNoche: number;

  // Totales
  totalImperia: number;
  totalCmc: number;
  diferencia: number;
  
  raw: any[]; // Store the full 39 columns for raw view
}

export default function PruebaMina() {
  const [data, setData] = useState<ProcessedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resumen' | 'dia' | 'noche' | 'matriz'>('resumen');
  const [searchTerm, setSearchTerm] = useState('');
  
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
          // Fill down logic for Pozo and Sub-pozo
          let pozo = row[1] !== null && row[1] !== undefined ? String(row[1]).trim() : lastPozo;
          let subPozo = row[2] !== null && row[2] !== undefined ? String(row[2]).trim() : lastSubPozo;
          
          if (row[1] !== null && row[1] !== undefined) lastPozo = pozo;
          if (row[2] !== null && row[2] !== undefined) lastSubPozo = subPozo;

          // Helper to get number
          const getNum = (val: any) => {
            const num = Number(val);
            return isNaN(num) ? 0 : num;
          };

          const pasesCfDia = getNum(row[11]); // Col L
          const pasesCfNoche = getNum(row[26]); // Col AA (approx)

          const prodDia = getNum(row[16]); // Col Q
          const prodCmcDia = getNum(row[17]); // Col R
          
          const prodNoche = getNum(row[31]); // Col AF
          const prodCmcNoche = getNum(row[32]); // Col AG

          const totalImperia = prodDia + prodNoche;
          const totalCmc = prodCmcDia + prodCmcNoche;

          return {
            dia: index + 1, // 1 to 31
            pozo,
            subPozo,

            // Turno Día
            cantidadCaexDia: getNum(row[3]), // D
            caexDia: getNum(row[4]),
            operadoresDia: getNum(row[5]),
            acopioDia: getNum(row[6]),
            caexAcopioDia: getNum(row[7]),
            plantaDia: getNum(row[8]),
            caexPlantaDia: getNum(row[9]),
            vueltasDia: getNum(row[10]),
            pasesCfDia,
            pasesTotalesDia: pasesCfDia * 9,
            horasCfDia: getNum(row[12]),
            produccionDia: prodDia,
            produccionCmcDia: prodCmcDia,
            traspasosDia: getNum(row[18]), // S

            // Turno Noche (Assuming cols T to AH)
            cantidadCaexNoche: getNum(row[19]), // T
            caexNoche: getNum(row[20]),
            operadoresNoche: getNum(row[21]),
            acopioNoche: getNum(row[22]),
            caexAcopioNoche: getNum(row[23]),
            plantaNoche: getNum(row[24]),
            caexPlantaNoche: getNum(row[25]),
            vueltasNoche: getNum(row[26]),
            pasesCfNoche,
            pasesTotalesNoche: pasesCfNoche * 9,
            horasCfNoche: getNum(row[27]), // AB
            produccionNoche: prodNoche,
            produccionCmcNoche: prodCmcNoche,
            traspasosNoche: getNum(row[33]), // AH

            // Totales
            totalImperia,
            totalCmc,
            diferencia: totalCmc - totalImperia,

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
      r.pozo.toLowerCase().includes(lower) || 
      r.subPozo.toLowerCase().includes(lower)
    );
  }, [data, searchTerm]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, curr) => ({
      produccionDia: acc.produccionDia + curr.produccionDia,
      produccionNoche: acc.produccionNoche + curr.produccionNoche,
      totalImperia: acc.totalImperia + curr.totalImperia,
      totalCmc: acc.totalCmc + curr.totalCmc,
      diferencia: acc.diferencia + curr.diferencia,
    }), { produccionDia: 0, produccionNoche: 0, totalImperia: 0, totalCmc: 0, diferencia: 0 });
  }, [filteredData]);

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "produccion_mina.json");
    dlAnchorElem.click();
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
        
        {data.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportJSON}>
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => { setData([]); if(fileInputRef.current) fileInputRef.current.value = ''; }}
            >
              Limpiar
            </Button>
          </div>
        )}
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatNum(totals.totalImperia)}</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total CMC Mes</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatNum(totals.totalCmc)}</p>
              </CardContent>
            </Card>
            <Card className={`bg-white dark:bg-slate-900 border-l-4 ${totals.diferencia < 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Desviación Acumulada</p>
                <p className={`text-2xl font-bold mt-1 ${totals.diferencia < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {totals.diferencia > 0 ? '+' : ''}{formatNum(totals.diferencia)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Producción Día</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-300 mt-1">{formatNum(totals.produccionDia)}</p>
              </CardContent>
            </Card>
            <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Producción Noche</p>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 mt-1">{formatNum(totals.produccionNoche)}</p>
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
                      <th className="px-6 py-4 font-semibold">Pozo / Sub-Pozo</th>
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
                      <th className="px-6 py-4 font-semibold">Pozo</th>
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
                      <th className="px-6 py-4 font-semibold">Pozo</th>
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
                      <th className="px-4 py-3 font-semibold">Pozo</th>
                      <th className="px-4 py-3 font-semibold">Sub-Pozo</th>
                      {Array.from({length: 36}).map((_, i) => (
                        <th key={i} className="px-4 py-3 font-semibold">Col {i + 4}</th>
                      ))}
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
                              <span className="font-medium">{row.pozo}</span>
                              <span className="text-xs text-slate-500">{row.subPozo}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">{formatNum(row.produccionDia)}</td>
                          <td className="px-6 py-4 text-right">{formatNum(row.produccionNoche)}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatNum(row.totalImperia)}</td>
                          <td className="px-6 py-4 text-right font-medium">{formatNum(row.totalCmc)}</td>
                          <td className={`px-6 py-4 text-right font-semibold ${row.diferencia < 0 ? 'text-red-600' : row.diferencia > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {row.diferencia > 0 ? '+' : ''}{formatNum(row.diferencia)}
                          </td>
                        </>
                      )}

                      {activeTab === 'dia' && (
                        <>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{row.dia}</td>
                          <td className="px-6 py-4">{row.pozo}</td>
                          <td className="px-6 py-4 text-right">{row.cantidadCaexDia}</td>
                          <td className="px-6 py-4 text-right">{row.operadoresDia}</td>
                          <td className="px-6 py-4 text-right">{row.acopioDia}</td>
                          <td className="px-6 py-4 text-right">{row.plantaDia}</td>
                          <td className="px-6 py-4 text-right">{row.pasesCfDia}</td>
                          <td className="px-6 py-4 text-right font-medium bg-slate-50 dark:bg-slate-800/50">{row.pasesTotalesDia}</td>
                          <td className="px-6 py-4 text-right font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/10">{formatNum(row.produccionDia)}</td>
                        </>
                      )}

                      {activeTab === 'noche' && (
                        <>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{row.dia}</td>
                          <td className="px-6 py-4">{row.pozo}</td>
                          <td className="px-6 py-4 text-right">{row.cantidadCaexNoche}</td>
                          <td className="px-6 py-4 text-right">{row.operadoresNoche}</td>
                          <td className="px-6 py-4 text-right">{row.acopioNoche}</td>
                          <td className="px-6 py-4 text-right">{row.plantaNoche}</td>
                          <td className="px-6 py-4 text-right">{row.pasesCfNoche}</td>
                          <td className="px-6 py-4 text-right font-medium bg-slate-50 dark:bg-slate-800/50">{row.pasesTotalesNoche}</td>
                          <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10">{formatNum(row.produccionNoche)}</td>
                        </>
                      )}

                      {activeTab === 'matriz' && (
                        <>
                          <td className="px-4 py-2 font-medium bg-slate-50 dark:bg-slate-800 sticky left-0">{row.dia}</td>
                          <td className="px-4 py-2 truncate max-w-[150px]" title={row.pozo}>{row.pozo}</td>
                          <td className="px-4 py-2 truncate max-w-[150px]" title={row.subPozo}>{row.subPozo}</td>
                          {Array.from({length: 36}).map((_, colIdx) => {
                            const val = row.raw[colIdx + 3];
                            return (
                              <td key={colIdx} className="px-4 py-2 text-right">
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
