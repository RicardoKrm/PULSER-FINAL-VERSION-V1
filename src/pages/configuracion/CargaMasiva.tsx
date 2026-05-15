import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Truck, 
  Package, 
  ClipboardList, 
  AlertCircle, 
  Users,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface UploadModule {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const MODULES: UploadModule[] = [
  {
    id: 'empleados',
    title: 'Personal y Cargos',
    description: 'Carga masiva de conductores, técnicos y administrativos desde archivo Excel.',
    icon: Users
  },
  {
    id: 'vehiculos',
    title: 'Vehículos de Flota',
    description: 'Importar vehículos nuevos y actualizar flota existente con su información base.',
    icon: Truck
  },
  {
    id: 'inventario',
    title: 'Inventario de Repuestos',
    description: 'Carga de catálogo de repuestos, precios, stock inicial y proveedores.',
    icon: Package
  },
  {
    id: 'pautas',
    title: 'Pautas de Mantenimiento',
    description: 'Creación de pautas y reglas de mantenimiento preventivo por modelo y kilometraje.',
    icon: FileText
  },
  {
    id: 'tareas',
    title: 'Catálogo de Tareas',
    description: 'Listado de tareas estándar de mantenimiento, con tiempos y costos predeterminados.',
    icon: ClipboardList
  },
  {
    id: 'fallas',
    title: 'Tipos de Falla',
    description: 'Carga del catálogo de fallas comunes, sistemas afectados y criticidad.',
    icon: AlertCircle
  }
];

export default function CargaMasiva() {
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, { success: boolean, message: string }>>({});

  const handleDragOver = (e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    setDraggedOver(moduleId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    setDraggedOver(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        setSelectedFiles(prev => ({ ...prev, [moduleId]: file }));
        setResults(prev => {
          const newResults = { ...prev };
          delete newResults[moduleId];
          return newResults;
        });
      } else {
        alert("Por favor suba un archivo Excel (.xlsx, .xls) o CSV.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, moduleId: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(prev => ({ ...prev, [moduleId]: files[0] }));
      setResults(prev => {
        const newResults = { ...prev };
        delete newResults[moduleId];
        return newResults;
      });
    }
  };

  const handleUpload = async (moduleId: string) => {
    if (!selectedFiles[moduleId]) return;

    setUploading(prev => ({ ...prev, [moduleId]: true }));
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[moduleId];
      return newResults;
    });

    // Simulate API call
    setTimeout(() => {
      setUploading(prev => ({ ...prev, [moduleId]: false }));
      
      // Simulate success for demonstration
      setResults(prev => ({ 
        ...prev, 
        [moduleId]: { 
          success: true, 
          message: `Carga completada: 120 registros procesados correctamente.` 
        } 
      }));
      
      // Clear file after success
      setSelectedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[moduleId];
        return newFiles;
      });

    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
          Carga <span className="text-cyan-600">Masiva</span>
        </h1>
        <p className="text-slate-500 font-medium italic mt-1">Importa datos estructurados en lote mediante archivos Excel o CSV.</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const isDragging = draggedOver === mod.id;
          const selectedFile = selectedFiles[mod.id];
          const isUploading = uploading[mod.id];
          const result = results[mod.id];

          return (
            <div key={mod.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-full">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">{mod.title}</h3>
                  <p className="text-slate-500 text-sm font-medium mt-1">{mod.description}</p>
                </div>
              </div>

              <div className="flex flex-col flex-1 gap-4">
                {/* Upload Area */}
                <div 
                  className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-colors relative
                    ${isDragging ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}
                  `}
                  onDragOver={(e) => handleDragOver(e, mod.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, mod.id)}
                >
                  <input 
                    type="file" 
                    id={`file-${mod.id}`} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => handleFileChange(e, mod.id)}
                    disabled={isUploading}
                  />
                  
                  <Upload className={`w-8 h-8 mb-3 ${isDragging ? 'text-cyan-500' : 'text-slate-400'}`} />
                  
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center pointer-events-none">
                      <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">
                        Arrastra tu archivo aquí
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        o haz click para buscar (.xlsx, .csv)
                      </p>
                    </div>
                  )}
                </div>

                {/* Status / Submit */}
                {result && (
                  <div className={`flex items-start gap-3 p-3 rounded-xl text-sm font-bold ${result.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                    {result.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
                    {result.message}
                  </div>
                )}

                <div className="flex justify-between items-center gap-4 mt-auto pt-2">
                  <a href="#" className="text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline">
                    Descargar Plantilla
                  </a>
                  <Button 
                    disabled={!selectedFile || isUploading}
                    onClick={() => handleUpload(mod.id)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-6 py-2 h-auto flex items-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      'Cargar Datos'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
