export interface ReservaTurismo {
  id: string;
  op: string;
  categoria: 'Web' | 'Minera' | 'Extranjero' | 'Operador';
  cliente: {
    nombre: string;
    email: string;
    telefono: string;
    dni_pasaporte: string;
    rut_empresa: string;
  };
  pasajeros: {
    nombre: string;
    telefono: string;
    cantidad: number;
  };
  lugares: {
    origen: string;
    destino: string;
    numeroVuelo: string;
  };
  logistica: {
    maletasGrandes: number;
    maletasChicas: number;
    sillaBebe: boolean;
    cantidadSillas: number;
  };
  servicio: string;
  tipoVehiculo: 'SUV' | 'Van' | 'Sedán';
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

export interface OrdenDeTrabajo {
  id: string;
  folio: string;
  vehiculoId: string;
  tecnicoResponsable?: string;
  tipo: 'PREVENTIVA' | 'CORRECTIVA' | 'EVALUATIVA' | 'PREVENTIVA_NEUMATICOS' | 'CORRECTIVA_NEUMATICOS' | 'EVALUATIVA_NEUMATICOS' | 'INSPECCION';
  estado: 'ABIERTA' | 'EN_PROCESO' | 'FINALIZADA' | 'CANCELADA' | 'PAUSADA' | 'POR_ASIGNAR' | 'CERRADA_MECANICO' | 'PROGRAMADA' | 'CERRADA_POR_MECANICO';
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  kilometrajeApertura: number;
  kilometrajeCierre?: number;
  fechaCreacion: string;
  fechaProgramada?: string;
  horaInicioProgramada?: string;
  horaTerminoProgramada?: string;
  tareasRealizadas: Tarea[];
  insumos: Insumo[];
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

  costoInsumos: number;
  costoManoObraTareas: number;
  costoManoObraHH: number;
  tiempoTrabajadoSegundos: number;
  historial: HistorialEvento[];
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
  nombre: string;
}

export interface KitRepuesto {
  id: string;
  nombre: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  cargo: string; // Including 'Mecánico'
}
