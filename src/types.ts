export interface Collaborator {
  id: string | number;
  initials: string;
  name: string;
  rut: string;
  role: string;
  roleBadgeText: string;
  phone: string;
  licencia?: string;
  especialidad?: string;
  status: 'ACTIVO' | 'LICENCIA' | 'VACACIONES';
  isConductor: boolean;
  isMecanico: boolean;
  isSupervisor: boolean;
  email?: string;
  sueldoBase?: number;
  valorHH?: number;
  departamento?: string;
  sexo?: 'HOMBRE' | 'MUJER' | 'OTRO';
  prestadorServicio?: 'INTERNO' | 'EXTERNO';
  panelInicio?: string;
  fechaContrato?: string;
  tipoContrato?: string;
  vencimiento?: string;
  turnoAsignado?: string;
  empresaAsignada?: string;
  direccion?: string;
}

export interface ReservaTurismo {
  id: string;
  op: string;
  categoria: string;
  cliente: {
    nombre: string;
    email: string;
    telefono: string;
    dni_pasaporte: string;
    rut_empresa: string;
    tipoCliente?: string;
  };
  pasajeros: {
    nombre: string;
    telefono: string;
    cantidad: number;
  };
  pasajerosList: {
    nombre: string;
    telefono: string;
    origen: string;
    destino: string;
  }[];
  lugares: {
    origen: string;
    destino: string;
    numeroVuelo: string;
  };
  logistica: {
    maletasGrandes: number;
    maletasChicas: number;
    sillaBebe: boolean;
    alzador: boolean;
    cantidadSillas: number;
  };
  servicio: string;
  enlaceMapa?: string;
  tipoVehiculo: 'Auto' | 'SUV' | 'Van' | 'Minibus' | 'Bus' | 'Otros';
  fecha: string;
  horaInicio: string;
  horaTermino: string;
  conductorId: string;
  vehiculoId: string;
  finanzas: {
    montoBruto: number;
    gastosAdicionales: number;
    porcentajeComision: number;
    formaPago: 'Efectivo' | 'Transferencia' | 'Convenio PF' | 'Tarjeta';
    tipoDocumento: 'Boleta' | 'Factura';
    cobrado: boolean;
    montoNeto: number;
    folioFactura?: string;
    fechaDeposito?: string;
  };
  archivosAdicionales?: {
    nombre: string;
    url: string;
    tipo: 'Imagen' | 'Documento' | 'Otro';
  }[];
  comentarios: {
    conductor: string;
    interno: string;
  };
  estado: 'pendiente' | 'confirmada' | 'finalizada' | 'cancelada';
  auditLogs: { quien: string; accion: string; cuando: string }[];
}

export interface Conductor {
  id: string;
  nombre: string;
  estado: 'activo' | 'inactivo';
}

export interface Vehiculo {
  id: string;
  patente: string;
  modelo?: string;
  marca?: string;
  ano?: number | string;
  vin?: string;
}

export interface Tarea {
  id: string;
  descripcion: string;
  costoBase: number;
}

export interface Insumo {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface HistorialEvento {
  id: string;
  descripcion: string;
  fechaEvento: string;
  usuario: string;
}

export interface Repuesto {
  id: string;
  sku: string;
  referencia?: string;
  nombre: string;
  stock_actual: number;
  costo_unitario: number;
  costo_unitario_aplicado?: number;
}

export interface DetalleInsumoOT {
  id: string;
  orden_id: string;
  repuesto_id: string;
  cantidad: number;
  costo_unitario_aplicado: number;
  costo_total: number;
  repuesto?: Repuesto;
}

export interface OTTareaRealizada {
  id: string;
  orden_id: string;
  tarea_estandar_id: string;
  tiempo_real_minutos: number;
  costo_real: number;
  tarea_estandar?: TareaEstandar;
}

export interface HistorialOT {
  id: string;
  orden_id: string;
  usuario_id?: string;
  usuario_nombre?: string;
  estado_anterior?: string;
  estado_nuevo?: string;
  comentario?: string;
  created_at: string;
}

export interface SolicitudRepuesto {
  id: string;
  orden_id: string;
  repuesto_id?: string;
  repuesto_nombre: string;
  cantidad: number;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  motivo_rechazo?: string;
  solicitante_id?: string;
  fecha_solicitud: string;
  usuario_nombre?: string;
  created_at?: string;
}

export interface OrdenDeTrabajo {
  id: string;
  folio: string;
  vehiculoId: string;
  vehiculo_id?: string;
  tecnicoResponsable?: string;
  responsable_id?: string; // DB
  tipo: 'PREVENTIVA' | 'CORRECTIVA' | 'EVALUATIVA' | 'PREVENTIVA_NEUMATICOS' | 'CORRECTIVA_NEUMATICOS' | 'EVALUATIVA_NEUMATICOS' | 'INSPECCION';
  estado: 'ABIERTA' | 'EN_PROCESO' | 'FINALIZADA' | 'CANCELADA' | 'PAUSADA' | 'POR_ASIGNAR' | 'CERRADA_MECANICO' | 'PROGRAMADA' | 'CERRADA_POR_MECANICO';
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  kilometrajeApertura: number;
  kilometraje_apertura?: number;
  kilometrajeCierre?: number;
  kilometraje_cierre?: number;
  fechaCreacion: string;
  fechaProgramada?: string;
  horaInicioProgramada?: string;
  horaTerminoProgramada?: string;
  
  // Relaciones y KPIs
  pauta_mantenimiento_id?: string;
  tipo_falla_id?: string;
  inicio_proceso?: string;
  termino_proceso?: string;
  tfs_minutos?: number;

  tareasRealizadas: OTTareaRealizada[];
  insumos: DetalleInsumoOT[];
  observacionInicial?: string;
  diagnosticoEvaluacion?: string;
  // Detalle Técnico
  pauta?: string;
  kitRepuestos?: string;
  tipoFalla?: string;
  sintomas?: string;
  inspeccionTrenMotriz?: string; // Configuración Ejes...
  eje?: string;
  presionNeumatico?: number;
  // Gestón Administrativa
  personalOperativo?: string;
  proveedor?: string;
  empresaExterna?: string;
  rutEmpresa?: string;
  valorHH?: number;
  presupuestoAprobado?: number;
  observaciones?: string;

  tecnico_tipo?: 'INTERNO' | 'EXTERNO';
  externo_nombre?: string;
  externo_especialidad?: string;
  externo_intervencion?: string;

  costoInsumos: number;
  costoManoObraTareas: number;
  costoManoObraHH: number;
  tiempoTrabajadoSegundos: number;
  historial: HistorialOT[];
  solicitudes?: SolicitudRepuesto[];
  firmaCertificado?: string;
}

export interface PautaMantenimiento {
  id: string;
  nombre: string;
  modeloVehiculo: string;
  kmAplicacion: number;
  archivoPdfUrl: string;
}

export interface TareaEstandar {
  id: string;
  descripcion: string;
  tiempoEstandarMinutos: number;
  costoManoObra: number;
}

export interface TipoFalla {
  id: string;
  nombre?: string;
  descripcion: string;
  modelo_afectado?: string;
  criticidad?: string;
  causa?: string;
  tfs_predeterminado_horas?: number;
}

export interface Proveedor {
  id: string;
  nombre: string;
  rut?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface KitRepuestoDetalle {
  repuesto: string;
  cantidad: number;
}

export interface KitRepuesto {
  id: string;
  nombre: string;
  descripcion?: string;
  detalles?: KitRepuestoDetalle[];
}

export interface Usuario {
  id: string;
  nombre: string;
  cargo: string; // Including 'Mecánico'
}
