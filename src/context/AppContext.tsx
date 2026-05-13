import React, { createContext, useContext, useState } from 'react';
import { ReservaTurismo, Conductor, Vehiculo } from '../types';

interface AppContextType {
  reservasTurismo: ReservaTurismo[];
  conductores: Conductor[];
  vehiculos: Vehiculo[];
  crearReservaTurismo: (reserva: ReservaTurismo) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [reservasTurismo, setReservasTurismo] = useState<ReservaTurismo[]>([
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
  const [conductores] = useState<Conductor[]>([
    { id: '1', nombre: 'Rosemary Sullivan', estado: 'activo' },
    { id: '2', nombre: 'Juan Pérez', estado: 'activo' }
  ]);
  const [vehiculos] = useState<Vehiculo[]>([
    { id: 'v1', patente: 'AB-CD-12' },
    { id: 'v2', patente: 'EF-GH-34' }
  ]);

  const crearReservaTurismo = (reserva: Omit<ReservaTurismo, 'id'>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const op = `OP-${1000 + reservasTurismo.length}`;
    setReservasTurismo([...reservasTurismo, { 
      ...reserva, 
      id: newId, 
      op: reserva.op || op,
      auditLogs: [{ quien: 'Sistema', accion: 'Creación de reserva', cuando: new Date().toISOString() }]
    } as ReservaTurismo]);
  };

  return (
    <AppContext.Provider value={{ reservasTurismo, conductores, vehiculos, crearReservaTurismo }}>
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
