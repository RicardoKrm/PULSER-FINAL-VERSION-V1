import React, { useState } from 'react';
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
  Loader2,
  Building2,
  Wrench,
  Route,
  Fuel,
  Disc,
  FolderOpen,
  Warehouse,
  CalendarCheck,
  FileSignature,
  Box
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { exportToExcel } from '../../lib/excelExport';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

interface UploadModule {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  template?: any[];
}

const UPLOAD_MAPPING: Record<string, { table: string, mapConfig: (r: any) => any }> = {
  empleados: { 
    table: 'colaborador', 
    mapConfig: (r: any) => ({ rut: r.Rut, nombres: r.Nombres, apellidos: r.Apellidos, cargos: r.Cargo, telefono: r.Telefono, email: r.Email }) 
  },
  vehiculos: { 
    table: 'vehiculo', 
    mapConfig: (r: any) => ({ ...r }) 
  },
  inventario: { 
    table: 'insumo', 
    mapConfig: (r: any) => ({ codigo: r.Codigo, nombre: r.Nombre, categoria: r.Categoria, stock: r.StockInicial, precio_unitario: r.PrecioUnitario, proveedor_principal: r.ProveedorPrincipal }) 
  },
  pautas: { 
    table: 'pauta_mantenimiento', 
    mapConfig: (r: any) => ({ nombre_pauta: r.NombrePauta, modelo_vehiculo: r.ModeloVehiculo, tipo: r.Tipo, km_ejecucion: r.KMEjecucion }) 
  },
  tareas: { 
    table: 'tarea_estandar', 
    mapConfig: (r: any) => ({ codigo_tarea: r.CodigoTarea, descripcion: r.Descripcion, tiempo_estimado_horas: r.TiempoEstimadoHoras, costo_base_mano_obra: r.CostoBaseManoObra }) 
  },
  fallas: { 
    table: 'tipo_falla', 
    mapConfig: (r: any) => ({ codigo_falla: r.CodigoFalla, descripcion: r.Descripcion, sistema_afectado: r.SistemaAfectado, criticidad: r.Criticidad }) 
  },
  proveedores: { 
    table: 'proveedor', 
    mapConfig: (r: any) => ({ rut: r.Rut, razon_social: r.RazonSocial, contacto: r.Contacto, telefono: r.Telefono, email: r.Email, tipo_servicio: r.TipoServicio }) 
  },
  kits: { 
    table: 'kit_repuesto', 
    mapConfig: (r: any) => ({ codigo_kit: r.CodigoKit, nombre: r.Nombre }) 
  },
  rutas: { 
    table: 'ruta', 
    mapConfig: (r: any) => ({ codigo_ruta: r.CodigoRuta, origen: r.Origen, destino: r.Destino, distancia_km: r.DistanciaKM, tiempo_estimado_horas: r.TiempoEstimadoHoras, tarifa_base: r.TarifaBase }) 
  },
  neumaticos: { 
    table: 'neumatico', 
    mapConfig: (r: any) => ({ codigo_interno: r.CodigoInterno, marca: r.Marca, modelo: r.Modelo, medida: r.Medida, estado: r.Estado, patente_asignada: r.PatenteAsignada, posicion: r.Posicion }) 
  },
  combustible: { 
    table: 'registro_combustible', 
    mapConfig: (r: any) => ({ 
      fecha: r.Fecha ? new Date(r.Fecha).toISOString() : new Date().toISOString(), 
      patente: r.Patente, odometro: r.Odometro, litros: r.Litros, costo_total: r.CostoTotal, proveedor: r.Proveedor, conductor: r.Conductor 
    }) 
  },
  contratos: { 
    table: 'operacion_contrato', 
    mapConfig: (r: any) => ({ codigo_contrato: r.CodigoContrato, cliente: r.Cliente, fecha_inicio: r.FechaInicio, fecha_fin: r.FechaFin, monto_mensual: r.MontoMensual }) 
  },
  documental: { 
    table: 'operacion_documento', 
    mapConfig: (r: any) => ({ entidad: r.Entidad, referencia: r.Referencia, tipo_documento: r.TipoDocumento, fecha_emision: r.FechaEmision, fecha_vencimiento: r.FechaVencimiento }) 
  },
  bodegas: { 
    table: 'bodega', 
    mapConfig: (r: any) => ({ codigo_bodega: r.CodigoBodega, nombre: r.Nombre, direccion: r.Dirección || r.Direccion, encargado: r.Encargado }) 
  },
  suministros: { 
    table: 'sumuministro', // actually let's check schema: table name is suministro
    mapConfig: (r: any) => ({ codigo_suministro: r.CodigoSuministro, nombres: r.Nombres, tipo: r.Tipo, stock: r.Stock, precio_unitario: r.PrecioUnitario }) 
  },
  ots: { 
    table: 'orden_de_trabajo', 
    mapConfig: (r: any) => ({ numero_ot: r.NumeroOT, patente: r.Patente, estado: r.Estado, tipo_mantenimiento: r.TipoMantenimiento, costo_total: r.CostoTotal }) 
  },
  reservas: { 
    table: 'operacion_reserva', 
    mapConfig: (r: any) => ({ codigo_reserva: r.CodigoReserva, cliente: r.Cliente, fecha_servicio: r.FechaServicio, origen: r.Origen, destino: r.Destino, pasajeros: r.Pasajeros }) 
  }
};

// Fix table name just in case
UPLOAD_MAPPING.suministros.table = 'suministro';


const MODULES: UploadModule[] = [
  {
    id: 'empleados',
    title: 'Personal y Cargos',
    description: 'Carga masiva de conductores, técnicos y administrativos desde archivo Excel.',
    icon: Users,
    template: [
      { Rut: '12345678-9', Nombres: 'Juan', Apellidos: 'Pérez', Cargo: 'Conductor', Telefono: '+56912345678', Email: 'juan@empresa.com' }
    ]
  },
  {
    id: 'vehiculos',
    title: 'Vehículos de Flota',
    description: 'Importar vehículos nuevos y actualizar flota existente con su información base.',
    icon: Truck,
    template: [
      {
        numero_interno: 1,
        patente: 'SXDR14',
        tipo_vehiculo: 'MINIBUS',
        empresa: 'Transportes alvimar',
        marca: 'M. BENZ',
        modelo: 'SPRINTER VS30.2',
        norma_euro: 'EURO V',
        tipo_aceite: 'SINTÉTICO',
        chasis: '8AC907645RE232278',
        motor: '651958W0153260',
        razon_social: '76.506.145-8', 
        kilometraje_actual: 153304,
        aplicacion: 'CARRETERA',
        intervalo_km: 10000,
        km_ultima_mantencion: 136100,
        fecha_ultima_mantencion: '15-07-25',
        tipo_ultimo_mant: 'SM1'
      }
    ]
  },
  {
    id: 'inventario',
    title: 'Inventario de Repuestos',
    description: 'Carga de catálogo de repuestos, precios, stock inicial y proveedores.',
    icon: Package,
    template: [
      { Codigo: 'FIL-123', Nombre: 'Filtro de Aceite', Categoria: 'Filtros', StockInicial: 50, PrecioUnitario: 12500, ProveedorPrincipal: 'Repsol SA' }
    ]
  },
  {
    id: 'pautas',
    title: 'Pautas de Mantenimiento',
    description: 'Creación de pautas y reglas de mantenimiento preventivo por modelo y kilometraje.',
    icon: FileText,
    template: [
      { NombrePauta: 'Mantención 20.000 KM', ModeloVehiculo: 'FH 500', Tipo: 'Preventiva', KMEjecucion: 20000 }
    ]
  },
  {
    id: 'tareas',
    title: 'Catálogo de Tareas',
    description: 'Listado de tareas estándar de mantenimiento, con tiempos y costos predeterminados.',
    icon: ClipboardList,
    template: [
      { CodigoTarea: 'T-001', Descripcion: 'Cambio de Aceite Motor', TiempoEstimadoHoras: 1.5, CostoBaseManoObra: 25000 }
    ]
  },
  {
    id: 'fallas',
    title: 'Tipos de Falla',
    description: 'Carga del catálogo de fallas comunes, sistemas afectados y criticidad.',
    icon: AlertCircle,
    template: [
      { CodigoFalla: 'F-101', Descripcion: 'Fuga de líquido de frenos', SistemaAfectado: 'Frenos', Criticidad: 'Alta' }
    ]
  },
  {
    id: 'proveedores',
    title: 'Directorio de Proveedores',
    description: 'Carga de empresas, contactos, condiciones comerciales y evaluaciones base.',
    icon: Building2,
    template: [
      { Rut: '76123456-7', RazonSocial: 'Neumáticos del Sur S.A.', Contacto: 'Ventas', Telefono: '555-1234', Email: 'ventas@neumaticosdelsur.cl', TipoServicio: 'Insumos' }
    ]
  },
  {
    id: 'kits',
    title: 'Kits y Herramientas',
    description: 'Carga de herramientas asignables o kits de mantenimiento prediseñados.',
    icon: Wrench,
    template: [
      { CodigoKit: 'KIT-01', Nombre: 'Kit Cambio Aceite Básico', Componente: 'Filtro Aceite', Cantidad: 1 },
      { CodigoKit: 'KIT-01', Nombre: 'Kit Cambio Aceite Básico', Componente: 'Aceite 15W40 (Lts)', Cantidad: 20 }
    ]
  },
  {
    id: 'rutas',
    title: 'Gestión de Rutas',
    description: 'Carga masiva de trayectos, distancias, tiempos estimados y tarifas base.',
    icon: Route,
    template: [
      { CodigoRuta: 'R-001', Origen: 'Santiago', Destino: 'Antofagasta', DistanciaKM: 1350, TiempoEstimadoHoras: 18, TarifaBase: 850000 }
    ]
  },
  {
    id: 'neumaticos',
    title: 'Inventario de Neumáticos',
    description: 'Ingreso inicial de neumáticos, medidas, marcas, estado y asignación actual.',
    icon: Disc,
    template: [
      { CodigoInterno: 'N-101', Marca: 'Michelin', Modelo: 'X Multi D', Medida: '295/80 R22.5', Estado: 'Nuevo', PatenteAsignada: 'AB-CD-12', Posicion: 'Eje 1 Izq Exterior' }
    ]
  },
  {
    id: 'combustible',
    title: 'Registros de Combustible',
    description: 'Carga histórica de repostajes, odómetro, litros, costos y proveedores vinculados.',
    icon: Fuel,
    template: [
      { Fecha: '2023-10-25 14:30', Patente: 'AB-CD-12', Odometro: 12500, Litros: 450, CostoTotal: 495000, Proveedor: 'Copec', Conductor: 'Juan Pérez' }
    ]
  },
  {
    id: 'contratos',
    title: 'Contratos Comerciales',
    description: 'Sincronización de acuerdos, fechas de vigencia, renovaciones y tarifas.',
    icon: FileSignature,
    template: [
      { CodigoContrato: 'CONT-2023-01', Cliente: 'Minera XYZ', FechaInicio: '2023-01-01', FechaFin: '2025-12-31', MontoMensual: 15000000 }
    ]
  },
  {
    id: 'documental',
    title: 'Control Documental',
    description: 'Migración inicial de registros documentales y sus estados de vencimiento.',
    icon: FolderOpen,
    template: [
      { Entidad: 'Vehículo', Referencia: 'AB-CD-12', TipoDocumento: 'Revisión Técnica', FechaEmision: '2023-05-10', FechaVencimiento: '2024-05-10' }
    ]
  },
  {
    id: 'bodegas',
    title: 'Directorio de Bodegas',
    description: 'Creación de múltiples sucursales, almacenes y sus datos de ubicación.',
    icon: Warehouse,
    template: [
      { CodigoBodega: 'BOD-NTE-01', Nombre: 'Bodega Central Antofagasta', Dirección: 'Av. Pedro Aguirre Cerda 1234', Encargado: 'Carlos Silva' }
    ]
  },
  {
    id: 'suministros',
    title: 'Catálogo de Suministros',
    description: 'Carga de EPP, consumibles y materiales varios que requiere la operación.',
    icon: Box,
    template: [
      { CodigoSuministro: 'EPP-001', Nombres: 'Casco de Seguridad', Tipo: 'EPP', Stock: 100, PrecioUnitario: 5000 }
    ]
  },
  {
    id: 'ots',
    title: 'Historial de Órdenes de Trabajo',
    description: 'Importar backlog u órdenes pasadas, cerradas o en curso con costos pre-calculados.',
    icon: ClipboardList,
    template: [
      { NumeroOT: 'OT-1005', Patente: 'AB-CD-12', FechaCreacion: '2023-10-20', Estado: 'Cerrada', TipoMantenimiento: 'Preventivo', CostoTotal: 150000 }
    ]
  },
  {
    id: 'reservas',
    title: 'Historial de Reservas',
    description: 'Carga de servicios, pasajes, encomiendas y planificaciones previas.',
    icon: CalendarCheck,
    template: [
      { CodigoReserva: 'RES-9001', Cliente: 'Empresa ABC', FechaServicio: '2023-11-05', Origen: 'Santiago', Destino: 'Valparaíso', Pasajeros: 4 }
    ]
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
    const file = selectedFiles[moduleId];
    if (!file) return;

    setUploading(prev => ({ ...prev, [moduleId]: true }));
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[moduleId];
      return newResults;
    });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!jsonData || jsonData.length === 0) {
        throw new Error("El archivo está vacío o no se pudo leer correctamente.");
      }

      const config = UPLOAD_MAPPING[moduleId];
      if (!config) {
        throw new Error("Módulo no configurado para carga masiva en el sistema.");
      }

      const mappedData = jsonData.map(config.mapConfig);

      // Limpieza de undefined properties que fallen en Supabase
      const cleanData = mappedData.map(row => {
        const newRow: any = {};
        for(const [key, val] of Object.entries(row)) {
          if (val !== undefined) newRow[key] = val;
        }
        return newRow;
      });

      const { error } = await supabase.from(config.table).insert(cleanData);

      if (error) {
        console.error("Supabase insert error:", error);
        throw new Error(error.message);
      }

      setResults(prev => ({ 
        ...prev, 
        [moduleId]: { 
          success: true, 
          message: `Carga completada exitosamente: ${jsonData.length} registros insertados.` 
        } 
      }));
      
      setSelectedFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[moduleId];
        return newFiles;
      });

    } catch (error: any) {
      setResults(prev => ({ 
        ...prev, 
        [moduleId]: { 
          success: false, 
          message: error.message || "Error al procesar el archivo. Revisa el formato." 
        } 
      }));
    } finally {
      setUploading(prev => ({ ...prev, [moduleId]: false }));
    }
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
                  <button 
                    onClick={() => {
                      if (mod.template) {
                        exportToExcel(mod.template, `Plantilla_${mod.title.replace(/ /g, '_')}`);
                      } else {
                        alert("Plantilla no disponible para este módulo");
                      }
                    }}
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-700 hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Descargar Plantilla
                  </button>
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
