import React, { createContext, useContext, useState } from 'react';
import { ReservaTurismo, Conductor, Vehiculo, OrdenDeTrabajo, PautaMantenimiento, TareaEstandar, TipoFalla, KitRepuesto, Usuario, Proveedor } from '../types';

interface AppContextType {
  reservasTurismo: ReservaTurismo[];
  ordenesTrabajo: OrdenDeTrabajo[];
  conductores: Conductor[];
  vehiculos: Vehiculo[];
  pautas: PautaMantenimiento[];
  tareasEstandar: TareaEstandar[];
  tiposFalla: TipoFalla[];
  kitsRepuesto: KitRepuesto[];
  usuarios: Usuario[];
  currentUser: Usuario;
  setCurrentUser: (usuario: Usuario) => void;
  proveedores: Proveedor[];
  crearReservaTurismo: (reserva: ReservaTurismo) => void;
  crearOrdenTrabajo: (ot: OrdenDeTrabajo) => void;
  eliminarOrdenTrabajo: (id: string) => void;
  actualizarOrdenTrabajo: (ot: OrdenDeTrabajo) => void;
  crearTipoFalla: (tipoFalla: TipoFalla) => void;
  eliminarTipoFalla: (id: string) => void;
  crearKitRepuesto: (kit: KitRepuesto) => void;
  eliminarKitRepuesto: (id: string) => void;
  crearProveedor: (proveedor: Proveedor) => void;
  eliminarProveedor: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [reservasTurismo] = useState<ReservaTurismo[]>([
    {
      id: '1',
      op: 'OP-1001',
      categoria: 'Extranjero',
      cliente: { nombre: 'Rosemary Sullivan', email: '', telefono: '', dni_pasaporte: '', rut_empresa: '' },
      pasajeros: { nombre: 'Rosemary Sullivan + 3', telefono: '+14155550199', cantidad: 4 },
      lugares: { origen: 'Aeropuerto SCL (Vuelo LA541)', destino: 'Hotel Sheraton Santiago', numeroVuelo: 'LA541' },
      logistica: { maletasGrandes: 3, maletasChicas: 2, sillaBebe: true, cantidadSillas: 1 },
      servicio: 'Traslado Ejecutivo Privado',
      tipoVehiculo: 'SUV',
      fecha: '2026-03-15',
      horaInicio: '09:00',
      horaTermino: '10:30',
      conductorId: '1',
      vehiculoId: 'v1',
      finanzas: { montoBruto: 150000, gastosAdicionales: 5000, porcentajeComision: 10, formaPago: 'Convenio PF', tipoDocumento: 'Factura', cobrado: true, montoNeto: 130500, folioFactura: 'F-450' },
      comentarios: { conductor: 'Esperar con cartel fucsia en salida internacional.', interno: 'Cliente VIP frecuente. Colación incluida para conductor.' },
      estado: 'confirmada',
      auditLogs: [{ quien: 'Nevenka', accion: 'Creación', cuando: '2026-03-10T10:00:00Z' }]
    },
    {
      id: '2',
      op: 'OP-1002',
      categoria: 'Minera',
      cliente: { nombre: 'Minera XYZ', email: '', telefono: '', dni_pasaporte: '', rut_empresa: '76.123.456-7' },
      pasajeros: { nombre: 'Delegación Minera', telefono: '+56988776655', cantidad: 8 },
      lugares: { origen: 'Oficinas Apoquindo', destino: 'Valle Nevado (Centro de Eventos)', numeroVuelo: '' },
      logistica: { maletasGrandes: 0, maletasChicas: 8, sillaBebe: false, cantidadSillas: 0 },
      servicio: 'Tour Corporativo Jornada Completa',
      tipoVehiculo: 'Van',
      fecha: '2026-03-16',
      horaInicio: '08:00',
      horaTermino: '20:00',
      conductorId: '2',
      vehiculoId: 'v2',
      finanzas: { montoBruto: 350000, gastosAdicionales: 25000, porcentajeComision: 15, formaPago: 'Transferencia', tipoDocumento: 'Factura', cobrado: false, montoNeto: 276250, folioFactura: 'F-451' },
      comentarios: { conductor: 'Llevar aguas y snacks provistos por oficina.', interno: 'Facturar a final de mes.' },
      estado: 'pendiente',
      auditLogs: [{ quien: 'Sistema', accion: 'Creación', cuando: '2026-03-11T12:30:00Z' }]
    },
    {
      id: '3',
      op: 'OP-1003',
      categoria: 'Web',
      cliente: { nombre: 'Carlos Silva', email: 'cs@mail.com', telefono: '', dni_pasaporte: '', rut_empresa: '' },
      pasajeros: { nombre: 'Familia Silva', telefono: '+56912345678', cantidad: 3 },
      lugares: { origen: 'Costanera Center', destino: 'Viña Concha y Toro', numeroVuelo: '' },
      logistica: { maletasGrandes: 0, maletasChicas: 1, sillaBebe: false, cantidadSillas: 0 },
      servicio: 'Tour Viñedo Medio Día',
      tipoVehiculo: 'Sedán',
      fecha: '2026-03-17',
      horaInicio: '10:00',
      horaTermino: '15:00',
      conductorId: '1',
      vehiculoId: 'v1',
      finanzas: { montoBruto: 90000, gastosAdicionales: 0, porcentajeComision: 10, formaPago: 'Tarjeta', tipoDocumento: 'Boleta', cobrado: true, montoNeto: 81000 },
      comentarios: { conductor: 'Tour en español. Comprar entradas prepagadas en ticket office.', interno: 'Pago por Webpay confirmado.' },
      estado: 'confirmada',
      auditLogs: [{ quien: 'Sistema Web', accion: 'Creación', cuando: '2026-03-12T17:15:00Z' }]
    },
    {
      id: '4',
      op: 'OP-1004',
      categoria: 'Operador',
      cliente: { nombre: 'Agencia Travel', email: 'agencia@travel.com', telefono: '', dni_pasaporte: '', rut_empresa: '77.888.999-0' },
      pasajeros: { nombre: 'Grupo Turistas', telefono: '+5511999999999', cantidad: 6 },
      lugares: { origen: 'Hotel W Santiago', destino: 'Aeropuerto SCL', numeroVuelo: 'LA772' },
      logistica: { maletasGrandes: 6, maletasChicas: 6, sillaBebe: false, cantidadSillas: 0 },
      servicio: 'Traslado Salida (Out)',
      tipoVehiculo: 'Van',
      fecha: '2026-03-18',
      horaInicio: '14:30',
      horaTermino: '16:00',
      conductorId: '2',
      vehiculoId: 'v2',
      finanzas: { montoBruto: 60000, gastosAdicionales: 3000, porcentajeComision: 20, formaPago: 'Convenio PF', tipoDocumento: 'Factura', cobrado: false, montoNeto: 45600 },
      comentarios: { conductor: 'Puntualidad. Pasajeros hablan portugués.', interno: 'Tarifa negociada Operador.' },
      estado: 'pendiente',
      auditLogs: [{ quien: 'Operaciones', accion: 'Creación', cuando: '2026-03-13T11:00:00Z' }]
    }
  ]);
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenDeTrabajo[]>([
    {
      id: 'ot1',
      folio: 'OT-001',
      vehiculoId: 'v1',
      tipo: 'PREVENTIVA',
      estado: 'EN_PROCESO',
      prioridad: 'ALTA',
      kilometrajeApertura: 125000,
      fechaCreacion: '2026-05-10T10:00:00Z',
      tareasRealizadas: [
        { id: 't1', descripcion: 'Cambio de aceite', costoBase: 50000 },
        { id: 't2', descripcion: 'Revisión de frenos', costoBase: 30000 }
      ],
      insumos: [
        { id: 'i1', nombre: 'Filtro de Aceite', cantidad: 1, precioUnitario: 15000 }
      ],
      observacionInicial: 'Mantenimiento preventivo programado.',
      historial: [
        { id: 'h1', descripcion: 'OT Creada', fechaEvento: '2026-05-10T10:00:00Z', usuario: 'Admin' }
      ],
      costoInsumos: 15000,
      costoManoObraTareas: 80000,
      costoManoObraHH: 0,
      tiempoTrabajadoSegundos: 0,
    },
    { id: 'ot2', folio: 'OT-002', vehiculoId: 'v1', tipo: 'PREVENTIVA', estado: 'FINALIZADA', prioridad: 'MEDIA', kilometrajeApertura: 126000, fechaCreacion: '2026-05-11T09:00:00Z', tareasRealizadas: [], insumos: [], observacionInicial: 'Cambio de neumáticos.', historial: [], costoInsumos: 0, costoManoObraTareas: 20000, costoManoObraHH: 0, tiempoTrabajadoSegundos: 0 },
    { id: 'ot3', folio: 'OT-003', vehiculoId: 'v2', tipo: 'CORRECTIVA', estado: 'ABIERTA', prioridad: 'ALTA', kilometrajeApertura: 200000, fechaCreacion: '2026-05-12T08:00:00Z', tareasRealizadas: [], insumos: [], observacionInicial: 'Falla en sistema eléctrico.', historial: [], costoInsumos: 0, costoManoObraTareas: 50000, costoManoObraHH: 0, tiempoTrabajadoSegundos: 0 },
    { id: 'ot4', folio: 'OT-004', vehiculoId: 'v2', tipo: 'PREVENTIVA', estado: 'PAUSADA', prioridad: 'BAJA', kilometrajeApertura: 201000, fechaCreacion: '2026-05-13T10:00:00Z', tareasRealizadas: [], insumos: [], observacionInicial: 'Revisión técnica.', historial: [], costoInsumos: 0, costoManoObraTareas: 0, costoManoObraHH: 0, tiempoTrabajadoSegundos: 0 },
    { id: 'ot5', folio: 'OT-005', vehiculoId: 'v1', tipo: 'PREVENTIVA', estado: 'CERRADA_POR_MECANICO', prioridad: 'MEDIA', kilometrajeApertura: 127000, fechaCreacion: '2026-05-13T11:00:00Z', tareasRealizadas: [], insumos: [], observacionInicial: 'Cambio de aceite transmisión.', historial: [], costoInsumos: 0, costoManoObraTareas: 15000, costoManoObraHH: 0, tiempoTrabajadoSegundos: 0 },
    { id: 'ot6', folio: 'OT-006', vehiculoId: 'v2', tipo: 'CORRECTIVA', estado: 'PROGRAMADA', prioridad: 'ALTA', kilometrajeApertura: 205000, fechaCreacion: '2026-05-13T12:00:00Z', tareasRealizadas: [], insumos: [], observacionInicial: 'Reparación de aire acondicionado.', historial: [], costoInsumos: 0, costoManoObraTareas: 40000, costoManoObraHH: 0, tiempoTrabajadoSegundos: 0 },
    { id: 'ot8', folio: 'OT-008', vehiculoId: 'v1', tipo: 'CORRECTIVA', estado: 'PROGRAMADA', prioridad: 'MEDIA', kilometrajeApertura: 128000, fechaCreacion: '2026-05-14T08:00:00Z', tareasRealizadas: [], insumos: [], observacionInicial: 'Cambio pastillas freno.', historial: [], costoInsumos: 0, costoManoObraTareas: 0, costoManoObraHH: 0, tiempoTrabajadoSegundos: 0 },
    { id: 'ot9', folio: 'OT-009', vehiculoId: 'v2', tipo: 'PREVENTIVA', estado: 'FINALIZADA', prioridad: 'MEDIA', kilometrajeApertura: 210000, fechaCreacion: '2026-05-14T09:00:00Z', tareasRealizadas: [], insumos: [], observacionInicial: 'Pauta Mantenimiento 10K.', historial: [], costoInsumos: 0, costoManoObraTareas: 0, costoManoObraHH: 0, tiempoTrabajadoSegundos: 0 },
    { id: 'ot10', folio: 'OT-010', vehiculoId: 'v1', tipo: 'CORRECTIVA', estado: 'PAUSADA', prioridad: 'ALTA', kilometrajeApertura: 129000, fechaCreacion: '2026-05-14T10:00:00Z', tareasRealizadas: [], insumos: [], observacionInicial: 'Reparación motor.', historial: [], costoInsumos: 0, costoManoObraTareas: 0, costoManoObraHH: 0, tiempoTrabajadoSegundos: 0 },
    { id: 'ot12', folio: 'OT-012', vehiculoId: 'v2', tipo: 'CORRECTIVA', estado: 'PAUSADA', prioridad: 'ALTA', kilometrajeApertura: 212000, fechaCreacion: '2026-05-14T11:00:00Z', tareasRealizadas: [], insumos: [], observacionInicial: 'Cambio de alternador.', historial: [], costoInsumos: 0, costoManoObraTareas: 0, costoManoObraHH: 0, tiempoTrabajadoSegundos: 0 },
    { id: 'ot19', folio: 'OT-019', vehiculoId: 'v1', tipo: 'CORRECTIVA', estado: 'ABIERTA', prioridad: 'ALTA', kilometrajeApertura: 130000, fechaCreacion: '2026-05-14T14:00:00Z', tareasRealizadas: [], insumos: [], observacionInicial: 'Reparación inyectores.', historial: [], costoInsumos: 0, costoManoObraTareas: 0, costoManoObraHH: 0, tiempoTrabajadoSegundos: 0 },
    { id: 'ot20', folio: 'OT-020', vehiculoId: 'v2', tipo: 'PREVENTIVA', estado: 'FINALIZADA', prioridad: 'BAJA', kilometrajeApertura: 215000, fechaCreacion: '2026-05-14T15:00:00Z', tareasRealizadas: [], insumos: [], observacionInicial: 'Afinamiento diésel.', historial: [], costoInsumos: 0, costoManoObraTareas: 0, costoManoObraHH: 0, tiempoTrabajadoSegundos: 0 },
    { id: 'ot_345', folio: 'OT-OT-0345', vehiculoId: 'v1', tipo: 'CORRECTIVA', estado: 'ABIERTA', prioridad: 'ALTA', kilometrajeApertura: 150000, fechaCreacion: '2026-05-15T10:00:00Z', tareasRealizadas: [], insumos: [], observacionInicial: 'Correa en mal estado.', historial: [], costoInsumos: 0, costoManoObraTareas: 0, costoManoObraHH: 0, tiempoTrabajadoSegundos: 0 },
  ]);
  const [conductores] = useState<Conductor[]>([
    { id: '1', nombre: 'Rosemary Sullivan', estado: 'activo' },
    { id: '2', nombre: 'Juan Pérez', estado: 'activo' }
  ]);
  const [vehiculos] = useState<Vehiculo[]>([
    { id: 'v1', patente: 'AB-CD-12' },
    { id: 'v2', patente: 'EF-GH-34' }
  ]);
  const [pautas] = useState<PautaMantenimiento[]>([
    { id: 'p1', nombre: 'M A-MINERAL', modeloVehiculo: 'ACTYON SPORT D22', kmAplicacion: 8000, archivoPdfUrl: '#' },
    { id: 'p2', nombre: 'SM3-MINERAL', modeloVehiculo: 'MERCEDES BENZ O 500 RS E III', kmAplicacion: 120000, archivoPdfUrl: '#' }
  ]);
  const [tareasEstandar] = useState<TareaEstandar[]>([
    { id: 't1', descripcion: 'ARMAR Y REPARAR MOTOR OM 457 LA', tiempoEstandarMinutos: 900, costoManoObra: 127280 },
    { id: 't2', descripcion: 'CAMBIAR CORREA DE ACC. VENTILADOR', tiempoEstandarMinutos: 60, costoManoObra: 7955 }
  ]);
  const [tiposFalla, setTiposFalla] = useState<TipoFalla[]>([
    { id: 'tf1', nombre: 'MOTOR AGRIPADO' },
    { id: 'tf2', nombre: 'FUGA DE REFRIG. MOTOR' },
    { id: 'tf3', nombre: 'FUGA ACEITE MOTOR' },
    { id: 'tf4', nombre: 'MOTOR NO ARRANCA' }
  ]);
  const [kitsRepuesto, setKitsRepuesto] = useState<KitRepuesto[]>([
    { 
      id: 'kr1', 
      nombre: 'KIT SERVICIO 10K',
      descripcion: 'Kit de mantenimiento preventivo a los 10,000 KM para furgones diesel.',
      detalles: [
        { repuesto: 'Aceite Motor 5W30', cantidad: 5 },
        { repuesto: 'Filtro de Aceite D22', cantidad: 1 },
        { repuesto: 'Filtro de Aire CABD1', cantidad: 1 }
      ]
    },
    { 
      id: 'kr2', 
      nombre: 'KIT FRENOS',
      descripcion: 'Cambio de pastillas delanteras y rectificado básico.',
      detalles: [
        { repuesto: 'Pastillas de Freno Delanteras (Set 4)', cantidad: 1 },
        { repuesto: 'Líquido de Frenos DOT 4', cantidad: 1 },
        { repuesto: 'Limpiador de Frenos', cantidad: 1 }
      ]
    }
  ]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    { id: 'u1', nombre: 'Mecánico Juan', cargo: 'Mecánico' },
    { id: 'u2', nombre: 'Mecánico Pedro', cargo: 'Mecánico' },
    { id: 'u3', nombre: 'Administradora María', cargo: 'Admin' },
    { id: 'u4', nombre: 'Super Admin', cargo: 'Super Administrador' }
  ]);
  const [currentUser, setCurrentUser] = useState<Usuario>({ id: 'u4', nombre: 'Admin Usuario', cargo: 'Súper Administrador' });
  const [proveedores, setProveedores] = useState<Proveedor[]>([
    { id: 'prov1', nombre: 'Kaufmann S.A.', rut: '76.123.456-7' },
    { id: 'prov2', nombre: 'Autoplanet', rut: '77.222.333-k' },
  ]);

  const crearReservaTurismo = (reserva: ReservaTurismo) => {
    // Logic for adding a reservation
  };
  
  const crearOrdenTrabajo = (ot: OrdenDeTrabajo) => {
    setOrdenesTrabajo([...ordenesTrabajo, ot]);
  };

  const eliminarOrdenTrabajo = (id: string) => {
    setOrdenesTrabajo(ordenesTrabajo.filter(ot => ot.id !== id));
  };

  const actualizarOrdenTrabajo = (otActualizada: OrdenDeTrabajo) => {
    setOrdenesTrabajo(ordenesTrabajo.map(ot => ot.id === otActualizada.id ? otActualizada : ot));
  };

  const crearTipoFalla = (tipoFalla: TipoFalla) => {
    setTiposFalla([...tiposFalla, tipoFalla]);
  };

  const eliminarTipoFalla = (id: string) => {
    setTiposFalla(tiposFalla.filter(tf => tf.id !== id));
  };

  const crearKitRepuesto = (kit: KitRepuesto) => {
    setKitsRepuesto([...kitsRepuesto, kit]);
  };

  const eliminarKitRepuesto = (id: string) => {
    setKitsRepuesto(kitsRepuesto.filter(kr => kr.id !== id));
  };

  const crearProveedor = (proveedor: Proveedor) => {
    setProveedores([...proveedores, proveedor]);
  };

  const eliminarProveedor = (id: string) => {
    setProveedores(proveedores.filter(p => p.id !== id));
  };

  return (
    <AppContext.Provider value={{ reservasTurismo, ordenesTrabajo, conductores, vehiculos, pautas, tareasEstandar, tiposFalla, kitsRepuesto, usuarios, currentUser, setCurrentUser, proveedores, crearReservaTurismo, crearOrdenTrabajo, eliminarOrdenTrabajo, actualizarOrdenTrabajo, crearTipoFalla, eliminarTipoFalla, crearKitRepuesto, eliminarKitRepuesto, crearProveedor, eliminarProveedor }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
