import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet, FileText, Settings2, Download, Table2, Filter, 
  Calendar, Check, Circle, BarChart2, CheckSquare, Search, Copy, Printer, CheckCircle2, ChevronDown, ChevronRight, Info, Package, Fuel, DollarSign, Users, Truck, Wrench, CircleDot
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { exportToExcel } from '../../lib/excelExport';

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

export default function ReporteMaestro() {
  const { ordenesTrabajo, vehiculos, repuestos, personal } = useAppContext() as any;

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

  const generateReportData = () => {
    let data: any[] = [];
    if (activeModule === 'mantenimiento') {
      data = (ordenesTrabajo || []).map((ot: any) => ({
        'Folio OT': ot.folio || ot.id || '',
        'Vehículo': ot.numero_interno || ot.vehiculoNumeroInterno || '',
        'Patente': ot.patente || ot.vehiculoPatente || '',
        'Fecha Apertura': ot.fechaApertura || ot.fechaCreacion || '',
        'Fecha Cierre': ot.fechaCierre || ot.fechaTermino || '',
        'Estado': ot.estado || '',
        'Tipo': ot.tipo || '',
        'Tipo Falla': ot.tipoFalla || ot.fallaObservada || '',
        'Responsable': ot.responsable || ot.creadoPor || '',
        'Costo Mano Obra': ot.costoManoObra || ot.costoManoObraTotal || 0,
        'Costo Repuestos': ot.costoRepuestos || ot.costoInsumos || 0,
        'Costo Total OT': (ot.costoManoObra || 0) + (ot.costoRepuestos || ot.costoInsumos || 0),
        'TFS (Min)': ot.tfsMinutos || 0
      }));
    } else if (activeModule === 'flota') {
      data = (vehiculos || []).map((v: any) => {
        const detalles = v.detalles || {};
        return {
          'Nº Interno': v.numero_interno || v.numeroInterno || '',
          'Patente': v.patente || '',
          'Marca/Modelo': `${v.marca || detalles.marca || ''} / ${v.modelo || detalles.modelo || ''}`,
          'Norma Euro': v.norma_euro || detalles.norma_euro || '',
          'Tipo Aceite': v.tipo_aceite || detalles.tipo_aceite || '',
          'KM Actual': v.kilometraje_actual || v.kilometrajeActual || 0,
          'Intervalo Mantenimiento': v.intervalo_km || detalles.intervalo_km || 10000,
          'KM Últ. Mant.': v.km_ultima_mantencion || detalles.km_ultima_mantencion || 0,
          'Fecha Últ. Mant.': v.fecha_ultima_mantencion || detalles.fecha_ultima_mantencion || '',
          'Estado Flota': v.estado || 'Activo',
          'Aplicación': v.aplicacion || detalles.aplicacion || ''
        };
      });
    } else if (activeModule === 'inventario') {
      data = (repuestos || []).map((r: any) => ({
        'SKU': r.sku || r.codigo || '',
        'Nombre Repuesto': r.nombre || '',
        'Calidad': r.calidad || '',
        'Stock Actual': r.stockActual || r.stock || 0,
        'Stock Mínimo': r.stockMinimo || 0,
        'Valor Unitario ($)': r.valorUnitario || r.precio || 0,
        'Valorización Total ($)': (r.stockActual || r.stock || 0) * (r.valorUnitario || r.precio || 0),
        'Bodega': r.bodega || '',
        'Proveedor Habitual': r.proveedor || '',
        'Nivel Criticidad': r.criticidad || '',
        'Último Movimiento': r.ultimoMovimiento || ''
      }));
    } else if (activeModule === 'rrhh') {
      data = (personal || []).map((p: any) => ({
        'ID Empleado': p.id || '',
        'Nombre Completo': p.nombre || '',
        'RUT': p.rut || '',
        'Cargo': p.cargo || '',
        'Departamento': p.departamento || '',
        'OTs Finalizadas': p.otsFinalizadas || 0,
        'Minutos Trabajados': p.minutosTrabajados || 0,
        'Productividad Estándar': p.productividad || '100%',
        'Sueldo Base ($)': p.sueldo || 0,
        'Horas Extras': p.horasExtras || 0
      }));
    }
    
    // Fallback if data is still empty (module not fully hooked up in context)
    if (data.length === 0) {
      data = [{ [currentColumns[0]]: 'Sin datos disponibles para este módulo' }];
    }
    return data;
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    
    const dataToExport = generateReportData().map(row => {
      // Keep only selected columns
      const filteredRow: any = {};
      selectedColumns.forEach(col => {
        filteredRow[col] = row[col];
      });
      return filteredRow;
    });

    setTimeout(() => {
      setIsGenerating(false);
      
      const fechaStr = new Date().toISOString().split('T')[0];
      const fileName = `Reporte_${activeModule.toUpperCase()}_${fechaStr}`;
      
      try {
        if (selectedFormat === 'pdf') {
          import('../../lib/pdfExport').then(({ exportToPDF }) => {
             exportToPDF(dataToExport, fileName, `Reporte: ${activeModule.toUpperCase()}`);
             setAlertMsg(`El archivo ${fileName}.pdf se ha descargado exitosamente.`);
          });
        } else if (selectedFormat === 'csv') {
          // XLSX library can write CSV if we provide the right filename and bookType
          import('xlsx').then(XLSX => {
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
            XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: 'csv' });
            setAlertMsg(`El archivo ${fileName}.csv se ha descargado exitosamente.`);
          });
        } else {
          exportToExcel(dataToExport, fileName, activeModule.toUpperCase());
          setAlertMsg(`El archivo ${fileName}.xlsx se ha descargado exitosamente.`);
        }
      } catch (err) {
        setAlertMsg(`Error al generar el archivo.`);
      }
      
      setTimeout(() => setAlertMsg(''), 5000);
    }, 1000);
  };

  const currentMockData = generateReportData();

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
            className={`mb-6 p-4 rounded-xl font-bold flex items-center gap-3 shadow-sm border ${alertMsg.includes('Error') ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'}`}
          >
            <CheckCircle2 className="w-5 h-5" />
            {alertMsg}
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
                      className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-200
                        ${isAssigned 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' 
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                        }
                      `}
                    >
                      {isAssigned ? <CheckSquare className="w-4 h-4" /> : <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
                      {col}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
             <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/30">
               <div>
                 <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                   <Table2 className="w-5 h-5 text-indigo-500" />
                   Vista Previa de Datos
                 </h2>
                 <p className="text-sm text-slate-500 font-medium mt-1 dark:text-slate-400">Previsualización en vivo (solo los primeros 10 registros).</p>
               </div>
             </div>
             
             {/* Dynamic Table Preview */}
             <div className="flex-1 w-full overflow-x-auto custom-scrollbar relative">
                <table className="w-full text-left hidden sm:table">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      {selectedColumns.map(col => (
                        <th key={col} className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap bg-slate-50 dark:bg-slate-800/90">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {currentMockData.length > 0 && !currentMockData[0]['Sin datos disponibles para este módulo'] ? currentMockData.slice(0, 10).map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                        {selectedColumns.map((col, colIdx) => {
                          const val = row[col];
                          return (
                            <td key={colIdx} className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white whitespace-nowrap">
                              {/* Add some basic visual distinctness for common values like statuses */}
                              {val === 'FINALIZADA' || val === 'PREVENTIVA' ? (
                                <span className="bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-md text-xs font-bold">{val}</span>
                              ) : val === 'EN PROCESO' || val === 'CORRECTIVA' ? (
                                <span className="bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-md text-xs font-bold">{val}</span>
                              ) : typeof col === 'string' && (col.includes('($)') || col.includes('Costo')) ? (
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{val}</span>
                              ) : (
                                val !== null && val !== undefined && val !== '' ? val : '—'
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={selectedColumns.length} className="p-8 text-center text-slate-500 font-medium">Sin registros disponibles para el período o módulo seleccionado</td>
                      </tr>
                    )}
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
               <span className="flex items-center gap-1.5"><Info className="w-4 h-4" /> Mostrando muestra de los registros.</span>
               <span className="px-2 py-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800">Total: {currentMockData[0]['Sin datos disponibles para este módulo'] ? 0 : currentMockData.length} registros</span>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
