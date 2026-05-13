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
