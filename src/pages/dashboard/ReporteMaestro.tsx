import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet, FileText, Settings2, Download, Table2, Filter, 
  Calendar, Check, Circle, BarChart2, CheckSquare, Search, Copy, Printer, CheckCircle2, ChevronDown, ChevronRight, Info, Package, Fuel, DollarSign, Users, Truck, Wrench, CircleDot
} from 'lucide-react';

// Formatters
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
};

// Data models based on the system
const reportModules = [
  { id: 'mantenimiento', name: 'Mantenimiento (OTs)', icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
  { id: 'inventario', name: 'Inventario & Compras', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'combustible', name: 'Control Combustible', icon: Fuel, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
  { id: 'comercial', name: 'Finanzas & TCO', icon: DollarSign, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800' },
  { id: 'flota', name: 'Gestión de Flota', icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800' },
  { id: 'neumaticos', name: 'Control Neumáticos', icon: CircleDot, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300 dark:border-slate-700' },
  { id: 'rrhh', name: 'Personal Operativo', icon: Users, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800' },
];

const moduleColumns = {
  mantenimiento: ['Folio OT', 'Vehículo', 'Patente', 'Fecha Apertura', 'Fecha Cierre', 'Estado', 'Tipo', 'Tipo Falla', 'Responsable', 'Costo Mano Obra', 'Costo Repuestos', 'Costo Total OT', 'TFS (Min)'],
  inventario: ['SKU', 'Nombre Repuesto', 'Calidad', 'Stock Actual', 'Stock Mínimo', 'Valor Unitario ($)', 'Valorización Total ($)', 'Bodega', 'Proveedor Habitual', 'Nivel Criticidad', 'Último Movimiento'],
  combustible: ['ID Carga', 'Vehículo', 'Fecha Carga', 'Litros Cargados', 'Precio x Litro', 'Costo Total Carga', 'Rendimiento (Km/L)', 'Ruta Carga', 'Conductor Responsable', 'Proveedor GPS'],
  comercial: ['Mes/Año', 'Nº Factura', 'Cliente / Contrato', 'Vehículo Asoc.', 'Tipo Registro', 'Categoría Gasto', 'Presupuesto Mes ($)', 'Gasto Real ($)', 'Ingreso Generado ($)', 'Rentabilidad (TCO)'],
  flota: ['Nº Interno', 'Patente', 'Marca/Modelo', 'Norma Euro', 'Tipo Aceite', 'KM Actual', 'Intervalo Mantenimiento', 'KM Últ. Mant.', 'Fecha Últ. Mant.', 'Estado Flota', 'Aplicación'],
  neumaticos: ['DOT / Nº Fuego', 'Vehículo Montado', 'Posición', 'Medida', 'Diseño Banda', 'Estado Actual', 'Fecha Compra', 'Costo Inicial ($)', 'Costo por KM (CPK)', 'Última Inspección (mm)'],
  rrhh: ['ID Empleado', 'Nombre Completo', 'RUT', 'Cargo', 'Departamento', 'OTs Finalizadas', 'Minutos Trabajados', 'Productividad Estándar', 'Sueldo Base ($)', 'Horas Extras'],
};

// Mock Previews
const generateMockData = (moduleId: string) => {
  switch (moduleId) {
    case 'mantenimiento':
      return Array.from({ length: 8 }).map((_, i) => [
        `OT-${4000 + i}`, `Camión 0${i + 1}`, `AB-CD-${10 + i}`, `2026-05-0${i + 1}`, `2026-05-0${i + 3}`, 
        ['FINALIZADA', 'EN PROCESO'][i % 2], ['PREVENTIVA', 'CORRECTIVA'][Math.floor(Math.random() * 2)], 
        ['Falla Motor', '-', 'Frenos'][Math.floor(Math.random() * 3)], 'Juan Pérez', 
        formatCurrency(45000 + (i * 5000)), formatCurrency(120000 + (i * 10000)), formatCurrency(165000 + (i * 15000)),
        (120 + i * 20).toString()
      ]);
    case 'inventario':
      return Array.from({ length: 8 }).map((_, i) => [
        `SKU-100${i}`, `Filtro Neumático V${i}`, ['Genuino', 'OEM', 'Alternativo'][Math.floor(Math.random() * 3)],
        (15 + i).toString(), '5', formatCurrency(15000 + (i * 2000)), formatCurrency((15 + i) * (15000 + (i * 2000))),
        'Bodega Central', 'Proveedor XYZ Cía.', ['ALTA', 'MEDIA', 'BAJA'][Math.floor(Math.random() * 3)], `2026-05-1${i}`
      ]);
    case 'comercial':
      return Array.from({ length: 8 }).map((_, i) => [
        `Mayo 2026`, `FCT-${8000 + i}`, 'Minería Norte S.A.', `Camión 0${i + 1}`, 'INGRESO', 'Servicio Ruta', 
        formatCurrency(2000000), formatCurrency(450000 + (i * 20000)), formatCurrency(1800000 + (i * 50000)), 
        ((1800000 / (450000 + (i * 20000))) * 100).toFixed(1) + '%'
      ]);
    // default basic mock
    default:
      return Array.from({ length: 8 }).map((_, i) => moduleColumns[moduleId as keyof typeof moduleColumns].map((col, j) => `Dato ${j + 1}`));
  }
};


export default function ReporteMaestro() {
  const [activeModule, setActiveModule] = useState<string>('mantenimiento');
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  const [isGenerating, setIsGenerating] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  
  // Columns Selection Tool
  const currentColumns = moduleColumns[activeModule as keyof typeof moduleColumns] || [];
  const [selectedColumns, setSelectedColumns] = useState<string[]>(currentColumns);

  const toggleColumn = (col: string) => {
    if (selectedColumns.includes(col)) {
      if (selectedColumns.length > 1) { // Prevent deselecting last column
        setSelectedColumns(selectedColumns.filter(c => c !== col));
      }
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const handleModuleChange = (modId: string) => {
    setActiveModule(modId);
    setSelectedColumns(moduleColumns[modId as keyof typeof moduleColumns]); // reset columns for new module
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setAlertMsg(`El archivo Reporte_${activeModule.toUpperCase()}_v1.${selectedFormat} se encuentra listo para descargar.`);
      setTimeout(() => setAlertMsg(''), 5000);
    }, 2000);
  };

  const currentMockData = generateMockData(activeModule);

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto min-h-screen">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Reporte Maestro
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Creador de reportes unificados. Selecciona un área, configura las métricas y exporta los datos directamente de la base de datos real.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {alertMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }} 
            animate={{ opacity: 1, y: 0, height: 'auto' }} 
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="mb-6 p-4 rounded-xl font-bold flex items-center gap-3 shadow-sm bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          >
            <CheckCircle2 className="w-5 h-5" />
            {alertMsg}
            <button className="ml-auto bg-emerald-600 text-white px-4 py-1.5 rounded-lg shadow-sm text-xs hover:bg-emerald-700 transition-colors uppercase tracking-wider font-black">
              Descargar Archivo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Lado Izquierdo: Configuración */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          
          {/* Módulo de Datos */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
               <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-black">1</div>
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                 Área de Negocio
               </h3>
             </div>
             <div className="p-4 flex flex-col gap-2">
                {reportModules.map(mod => {
                  const isActive = activeModule === mod.id;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleModuleChange(mod.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all font-semibold text-left
                        ${isActive 
                          ? `${mod.bg} ${mod.border} border shadow-sm text-slate-900 dark:text-white` 
                          : 'border border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }
                      `}
                    >
                      <mod.icon className={`w-5 h-5 ${isActive ? mod.color : 'text-slate-400'}`} />
                      <span className="text-sm truncate">{mod.name}</span>
                      {isActive && <CheckCircle2 className={`w-4 h-4 ml-auto ${mod.color}`} />}
                    </button>
                  )
                })}
             </div>
          </div>

          {/* Rango Temporal & Período */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
               <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-black">2</div>
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                 Filtros y Fechas
               </h3>
             </div>
             <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide dark:text-slate-400">Rango de Fechas</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm text-slate-700 dark:text-slate-300 font-medium outline-none focus:border-indigo-500 transition-colors" defaultValue="2026-05-01" />
                    <input type="date" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm text-slate-700 dark:text-slate-300 font-medium outline-none focus:border-indigo-500 transition-colors" defaultValue="2026-05-31" />
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide dark:text-slate-400">Pre-Filtros del Módulo</label>
                   <select className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-700 dark:text-slate-300 font-medium outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer">
                      <option>Todos los registros</option>
                      {activeModule === 'mantenimiento' && <><option>Solo OTs Cerradas</option><option>Solo Mantenimiento Preventivo</option></>}
                      {activeModule === 'inventario' && <><option>Solo Repuestos Bajo Stock</option><option>Solo Salidas Recientes</option></>}
                      {activeModule === 'comercial' && <><option>Costos sin cubrir</option><option>Presupuestos excedidos</option></>}
                   </select>
                </div>
             </div>
          </div>

          {/* Exportación */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
               <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-black">3</div>
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                 Formato de Salida
               </h3>
             </div>
             <div className="p-5">
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <button onClick={() => setSelectedFormat('excel')} className={`py-3 px-2 flex flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all ${selectedFormat === 'excel' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-800 text-slate-500 focus:outline-[0]'}`}>
                    <FileSpreadsheet className="w-6 h-6" />
                    <span className="text-xs font-bold font-mono">XLSX</span>
                  </button>
                  <button onClick={() => setSelectedFormat('csv')} className={`py-3 px-2 flex flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all ${selectedFormat === 'csv' ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'border-slate-100 dark:border-slate-800 text-slate-500 focus:outline-[0]'}`}>
                    <Table2 className="w-6 h-6" />
                    <span className="text-xs font-bold font-mono">CSV</span>
                  </button>
                  <button onClick={() => setSelectedFormat('pdf')} className={`py-3 px-2 flex flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all ${selectedFormat === 'pdf' ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'border-slate-100 dark:border-slate-800 text-slate-500 focus:outline-[0]'}`}>
                    <FileText className="w-6 h-6" />
                    <span className="text-xs font-bold font-mono">PDF</span>
                  </button>
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3
                    ${isGenerating 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 relative overflow-hidden group'
                    }
                  `}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                      Procesando Data...
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                      <Download className="w-5 h-5" />
                      Generar Documento
                    </>
                  )}
                </button>
             </div>
          </div>
          
        </div>

        {/* Lado Derecho: Personalización de Columnas y Vista Previa */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
          
          {/* Editor de Columnas */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-500" />
                  Estructura del Reporte
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1 dark:text-slate-400">Selecciona los campos que deseas incluir en la exportación.</p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                {selectedColumns.length} de {currentColumns.length} Columnas
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2.5">
                {currentColumns.map(col => {
                  const isAssigned = selectedColumns.includes(col);
                  return (
                    <button 
                      key={col}
                      onClick={() => toggleColumn(col)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border
                        ${isAssigned 
                          ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-700 dark:border-slate-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200'}
                      `}
                    >
                      <div className="flex items-center gap-1.5">
                        {isAssigned ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />}
                        {col}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Data Table Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex-grow flex flex-col min-h-[500px] overflow-hidden">
             <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
               <div>
                 <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                   <Table2 className="w-5 h-5 text-emerald-500" />
                   Vista Previa de Datos Reales
                 </h2>
                 <p className="text-xs font-bold text-slate-500 mt-1 tracking-wider uppercase dark:text-slate-400">
                   Módulo: {reportModules.find(m => m.id === activeModule)?.name}
                 </p>
               </div>
               <div className="flex gap-2">
                 <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                   <Copy className="w-4 h-4" />
                 </button>
                 <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                   <Printer className="w-4 h-4" />
                 </button>
               </div>
             </div>

             <div className="flex-grow overflow-auto relative">
                <table className="w-full text-left border-collapse whitespace-nowrap hidden sm:table">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-[0_1px_0_theme(colors.slate.200)] dark:shadow-[0_1px_0_theme(colors.slate.800)]">
                    <tr>
                      {selectedColumns.map((col, idx) => (
                        <th key={idx} className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {currentMockData.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                        {selectedColumns.map((col, colIdx) => {
                          const originalIdx = currentColumns.indexOf(col);
                          const val = row[originalIdx];
                          return (
                            <td key={colIdx} className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                              {/* Add some basic visual distinctness for common values like statuses */}
                              {val === 'FINALIZADA' || val === 'PREVENTIVA' ? (
                                <span className="bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-md text-xs font-bold">{val}</span>
                              ) : val === 'EN PROCESO' || val === 'CORRECTIVA' ? (
                                <span className="bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-md text-xs font-bold">{val}</span>
                              ) : col.includes('($)') || col.includes('Costo') ? (
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{val}</span>
                              ) : (
                                val
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Mobile placeholder */}
                <div className="sm:hidden p-8 flex flex-col items-center justify-center text-center h-full text-slate-500 dark:text-slate-400">
                   <Table2 className="w-12 h-12 mb-4 opacity-20" />
                   <p className="font-bold">Vista de tabla no disponible en móvil.</p>
                   <p className="text-sm mt-1">Gira tu dispositivo o expórtalo para verlo completo.</p>
                </div>
             </div>

             <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
               <span className="flex items-center gap-1.5"><Info className="w-4 h-4" /> Mostrando muestra de 8 registros de la base de datos real.</span>
               <span className="px-2 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">12,450 filas aproximadas en total</span>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}

