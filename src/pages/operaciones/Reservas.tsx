import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';
import { 
  Plus, Search, Filter, MapPin, Clock, User, Users, Car, FileText, 
  FileSpreadsheet, ChevronRight, CheckCircle, XCircle, Calendar as CalendarIcon, 
  Copy, Briefcase, Hash, Luggage, Baby, Phone, Mail, DollarSign, Info
} from 'lucide-react';
import { exportToExcel } from '../../lib/excelExport';
import { Pagination } from '../../components/ui/Pagination';
import { ReservaTurismo } from '../../types';

export default function ReservasTurismo() {
  const { reservasTurismo, conductores, vehiculos, crearReservaTurismo } = useAppContext();
  
  const opcionesFecha: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fechaTexto = new Date().toLocaleDateString('es-ES', opcionesFecha);
  const fechaHoy = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
  
  // States for filters
  const [busqueda, setBusqueda] = useState('');
  const [filtroVehiculo, setFiltroVehiculo] = useState('');
  const [filtroConductor, setFiltroConductor] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 8;

  // State for Modal / Details
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ReservaTurismo | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // New Reservation Form State
  const initialFormState = {
    categoria: 'Web' as ReservaTurismo['categoria'],
    cliente: { nombre: '', email: '', telefono: '', dni_pasaporte: '', rut_empresa: '' },
    pasajeros: { nombre: '', telefono: '', cantidad: 1 },
    lugares: { origen: '', destino: '', numeroVuelo: '' },
    logistica: { maletasGrandes: 0, maletasChicas: 0, sillaBebe: false, cantidadSillas: 0 },
    servicio: '',
    tipoVehiculo: 'SUV' as ReservaTurismo['tipoVehiculo'],
    fecha: '',
    horaInicio: '',
    horaTermino: '',
    conductorId: '',
    vehiculoId: '',
    finanzas: {
      montoBruto: 0,
      gastosAdicionales: 0,
      porcentajeComision: 10,
      formaPago: 'Efectivo' as ReservaTurismo['finanzas']['formaPago'],
      tipoDocumento: 'Boleta' as ReservaTurismo['finanzas']['tipoDocumento'],
      cobrado: false
    },
    comentarios: { conductor: '', interno: '' }
  };

  const [formReserva, setFormReserva] = useState(initialFormState);

  // Filter Logic
  const reservasFiltradas = reservasTurismo.filter(res => {
    const term = busqueda.toLowerCase();
    const matchesBusqueda = 
      res.cliente.nombre.toLowerCase().includes(term) || 
      res.servicio.toLowerCase().includes(term) ||
      res.op.toLowerCase().includes(term) ||
      res.cliente.telefono.includes(term);
    
    const matchesVehiculo = filtroVehiculo ? res.vehiculoId === filtroVehiculo : true;
    const matchesConductor = filtroConductor ? res.conductorId === filtroConductor : true;
    const matchesEstado = filtroEstado ? res.estado === filtroEstado : true;
    const matchesCategoria = filtroCategoria ? res.categoria === filtroCategoria : true;
    
    const resFecha = new Date(res.fecha);
    const matchesFechaInicio = fechaInicio ? resFecha >= new Date(fechaInicio) : true;
    const matchesFechaFin = fechaFin ? resFecha <= new Date(fechaFin) : true;
    
    return matchesBusqueda && matchesVehiculo && matchesConductor && matchesEstado && matchesCategoria && matchesFechaInicio && matchesFechaFin;
  });

  const totalPaginas = Math.ceil(reservasFiltradas.length / itemsPorPagina);
  const offset = (paginaActual - 1) * itemsPorPagina;
  const reservasPaginadas = reservasFiltradas.slice(offset, offset + itemsPorPagina);

  const handleExport = () => {
    const dataToExport = reservasFiltradas.map(r => {
      const v = vehiculos.find(veh => veh.id === r.vehiculoId);
      const c = conductores.find(cond => cond.id === r.conductorId);
      return {
        'ID/OP': r.op,
        'Categoría': r.categoria,
        'Cliente': r.cliente.nombre,
        'RUT Empresa': r.cliente.rut_empresa || 'N/A',
        'Pax Principal': r.pasajeros.nombre,
        'Tel Pax': r.pasajeros.telefono,
        'Cantidad Pax': r.pasajeros.cantidad,
        'Servicio': r.servicio,
        'Origen': r.lugares.origen,
        'Destino': r.lugares.destino,
        'N° Vuelo': r.lugares.numeroVuelo || 'N/A',
        'Fecha': r.fecha,
        'Hora Inicio': r.horaInicio,
        'Hora Termino': r.horaTermino,
        'Vehículo': v ? v.patente : 'N/A',
        'Conductor': c ? c.nombre : 'N/A',
        'Monto Bruto': r.finanzas.montoBruto,
        'Gastos Adic.': r.finanzas.gastosAdicionales,
        'Neto': r.finanzas.montoNeto,
        'Estado': r.estado,
        'Cobrado': r.finanzas.cobrado ? 'SÍ' : 'NO'
      };
    });
    exportToExcel(dataToExport, `Reservas_${new Date().toISOString().split('T')[0]}`, 'Reservas');
  };

  const calcularNeto = (bruto: number, adicional: number, comision: number) => {
    return (bruto - adicional) * (1 - comision / 100);
  };

  const handleCrearReserva = (e: React.FormEvent) => {
    e.preventDefault();
    const neto = calcularNeto(formReserva.finanzas.montoBruto, formReserva.finanzas.gastosAdicionales, formReserva.finanzas.porcentajeComision);
    
    crearReservaTurismo({
      ...formReserva,
      estado: 'confirmada',
      finanzas: {
        ...formReserva.finanzas,
        montoNeto: neto
      },
      auditLogs: [], // AppContext handles the first log
      op: '' // AppContext handles ID/OP
    } as any);
    
    setMostrarFormulario(false);
    setFormReserva(initialFormState);
  };

  const verDetalle = (reserva: ReservaTurismo) => {
    setReservaSeleccionada(reserva);
    setMostrarDetalle(true);
  };

  const clonarReserva = (reserva: ReservaTurismo) => {
    setFormReserva({
      ...reserva,
      fecha: '', // Clear date for the new clone
      estado: 'confirmada',
      finanzas: {
        ...reserva.finanzas,
        cobrado: false,
        folioFactura: undefined,
        fechaDeposito: undefined
      }
    });
    setMostrarFormulario(true);
  };

  const getCategoryTheme = (cat: ReservaTurismo['categoria']) => {
    switch (cat) {
      case 'Web': return { card: 'bg-blue-50/50 border-blue-200', textBase: 'text-blue-700', innerBox: 'border-blue-400 bg-white', innerText: 'text-blue-700', button: 'border-blue-500 text-blue-600', iconBox: 'bg-blue-100 text-blue-700' };
      case 'Minera': return { card: 'bg-emerald-50/50 border-emerald-200', textBase: 'text-emerald-700', innerBox: 'border-emerald-600 bg-white', innerText: 'text-emerald-700', button: 'border-emerald-600 text-emerald-700', iconBox: 'bg-emerald-100 text-emerald-700' };
      case 'Extranjero': return { card: 'bg-fuchsia-50/40 border-fuchsia-200', textBase: 'text-fuchsia-700', innerBox: 'border-fuchsia-500 bg-white', innerText: 'text-fuchsia-700', button: 'border-fuchsia-500 text-fuchsia-600', iconBox: 'bg-fuchsia-100 text-fuchsia-700' };
      case 'Operador': return { card: 'bg-orange-50/50 border-orange-200', textBase: 'text-orange-700', innerBox: 'border-orange-500 bg-white', innerText: 'text-orange-700', button: 'border-orange-500 text-orange-600', iconBox: 'bg-orange-100 text-orange-700' };
      default: return { card: 'bg-gray-50 border-gray-200', textBase: 'text-gray-700', innerBox: 'border-gray-300 bg-white', innerText: 'text-gray-700', button: 'border-gray-300 text-gray-700', iconBox: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pizarra Máster de Reservas</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm border font-medium px-2.5 py-0.5">
              <CalendarIcon className="w-3 h-3 mr-1.5" />
              {fechaHoy}
            </Badge>
            <p className="text-sm text-gray-500">Gestión ejecutiva, turismo y minería</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => { setFormReserva(initialFormState); setMostrarFormulario(true); }}
            className="bg-blue-600 hover:bg-blue-700 shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" /> Nueva Reserva
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="border-green-600 text-green-600 hover:bg-green-50 shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar BI
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-fuchsia-500 to-emerald-500"></div>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="OP, Cliente, Tel..." 
                className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="">Todas las Categorías</option>
              <option value="Web">Web (Azul)</option>
              <option value="Minera">Minera (Verde)</option>
              <option value="Extranjero">Extranjero (Fucsia)</option>
              <option value="Operador">Operador (Naranja)</option>
            </select>
            <select 
              className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              value={filtroVehiculo}
              onChange={(e) => setFiltroVehiculo(e.target.value)}
            >
              <option value="">Vehículo (SUV/Van/Sedán)</option>
              <option value="SUV">SUV</option>
              <option value="Van">Van</option>
              <option value="Sedán">Sedán</option>
            </select>
            <select 
              className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Estado de Gestión</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <div className="flex gap-2">
               <input 
                 type="date" 
                 className="w-full px-2 py-2 border rounded-md text-xs"
                 value={fechaInicio}
                 onChange={(e) => setFechaInicio(e.target.value)}
               />
               <input 
                 type="date" 
                 className="w-full px-2 py-2 border rounded-md text-xs"
                 value={fechaFin}
                 onChange={(e) => setFechaFin(e.target.value)}
               />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Reservations */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reservasPaginadas.map(res => {
          const conductor = conductores.find(c => c.id === res.conductorId);
          const diaSemana = new Date(res.fecha).toLocaleDateString('es-ES', { weekday: 'long' });
          const theme = getCategoryTheme(res.categoria);
          
          return (
            <Card key={res.id} className={`hover:shadow-lg transition-all border-2 rounded-xl ${theme.card}`}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className={`text-[11px] font-black uppercase ${theme.textBase}`}>{res.op}</span>
                    <span className={`text-[15px] font-bold leading-tight mt-0.5 ${theme.textBase}`}>{res.servicio}</span>
                  </div>
                  <Badge className="text-[10px] h-6 px-2 font-bold" variant={res.estado === 'confirmada' ? 'success' : 'warning'}>
                    {res.estado === 'confirmada' ? 'OK' : 'PEND'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 pt-1">
                <div className="space-y-1 mt-2">
                  <div className="flex items-center text-xs font-bold text-gray-800">
                    <User className="h-3.5 w-3.5 mr-2 text-gray-400" />
                    {res.pasajeros.nombre}
                  </div>
                  <div className="flex items-center text-[11px] text-gray-500">
                    <Phone className="h-3 w-3 mr-2 text-gray-300" />
                    {res.pasajeros.telefono}
                  </div>
                </div>

                <div className={`p-3 rounded-lg border space-y-2 ${theme.innerBox}`}>
                   <div className="flex items-center text-[10px] font-medium">
                      <MapPin className={`h-3 w-3 mr-2 shrink-0 ${theme.textBase}`} />
                      <span className={`line-clamp-1 ${theme.innerText}`}>{res.lugares.origen}</span>
                   </div>
                   <div className="flex items-center text-[10px] font-medium ml-1">
                      <ChevronRight className="h-3 w-3 mr-2 text-gray-300 shrink-0" />
                      <span className={`line-clamp-1 ${theme.innerText}`}>{res.lugares.destino}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="text-[10px] flex flex-col">
                    <span className="text-gray-400 uppercase font-black tracking-wide">Fecha / Día</span>
                    <span className="font-bold text-gray-700 mt-0.5">{res.fecha} ({diaSemana.substring(0, 3)})</span>
                  </div>
                  <div className="text-[10px] flex flex-col text-right">
                    <span className="text-gray-400 uppercase font-black tracking-wide">Horario</span>
                    <span className="font-bold text-gray-700 mt-0.5">{res.horaInicio} - {res.horaTermino}</span>
                  </div>
                </div>

                <div className={`flex items-center justify-between pt-3 border-t mt-4 border-gray-200`}>
                   <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shadow-inner">
                        {conductor?.nombre?.[0] || '?'}
                      </div>
                      <div className="flex flex-col justify-center">
                         <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">Móvil</span>
                         <span className="text-xs font-bold text-gray-700 leading-tight mt-0.5">{res.tipoVehiculo}</span>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className={`h-8 w-8 bg-transparent rounded-full border ${theme.button} hover:bg-white/50`} onClick={() => clonarReserva(res)} title="Replicar Servicio">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-blue-600 text-white rounded-full shadow-sm hover:bg-blue-700" onClick={() => verDetalle(res)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {reservasFiltradas.length > itemsPorPagina && (
        <Pagination 
          currentPage={paginaActual}
          totalPages={totalPaginas}
          onPageChange={setPaginaActual}
        />
      )}

      {/* Modal Detalle / Finanzas / Auditoría */}
      {mostrarDetalle && reservaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-4xl bg-white shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${getCategoryTheme(reservaSeleccionada.categoria).iconBox}`}>
                    <Briefcase className="h-5 w-5" />
                 </div>
                 <div>
                    <CardTitle className="text-lg text-gray-900">Gestión de Reserva {reservaSeleccionada.op}</CardTitle>
                    <p className="text-xs text-gray-500 font-medium pt-0.5">Categoría: {reservaSeleccionada.categoria}</p>
                 </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMostrarDetalle(false)} className="rounded-full hover:bg-gray-100 p-1.5 h-auto w-auto group">
                <XCircle className="h-6 w-6 text-gray-500 group-hover:text-gray-900" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[80vh]">
              <div className="grid md:grid-cols-3 divide-x divide-gray-100">
                {/* Info Principal */}
                <div className="col-span-2 p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <section className="space-y-4">
                       <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-1">Logística de Carga & PAX</h4>
                       <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                             <div className="flex items-center text-gray-600">
                                <Users className="h-4 w-4 mr-2 text-blue-400" /> Cantidad Pasajeros
                             </div>
                             <span className="font-bold">{reservaSeleccionada.pasajeros.cantidad} PAX</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                             <div className="flex items-center text-gray-600">
                                <Luggage className="h-4 w-4 mr-2 text-orange-400" /> Maletas Grandes (23K)
                             </div>
                             <span className="font-bold">{reservaSeleccionada.logistica.maletasGrandes}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                             <div className="flex items-center text-gray-600">
                                <Luggage className="h-4 w-4 mr-2 text-orange-300" /> Maletas Chicas (Cabina)
                             </div>
                             <span className="font-bold">{reservaSeleccionada.logistica.maletasChicas}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                             <div className="flex items-center text-gray-600">
                                <Baby className="h-4 w-4 mr-2 text-pink-400" /> Sillas Bebé
                             </div>
                             <span className="font-bold">{reservaSeleccionada.logistica.sillaBebe ? `SÍ (${reservaSeleccionada.logistica.cantidadSillas})` : 'NO'}</span>
                          </div>
                       </div>
                    </section>

                    <section className="space-y-4">
                       <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b pb-1">Hoja de Ruta (Tracking)</h4>
                       <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                          <div>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">Origen Detallado</p>
                             <p className="text-sm font-medium">{reservaSeleccionada.lugares.origen}</p>
                             {reservaSeleccionada.lugares.numeroVuelo && (
                               <Badge className="mt-1 text-[9px] bg-blue-100 text-blue-700">Vuelo: {reservaSeleccionada.lugares.numeroVuelo}</Badge>
                             )}
                          </div>
                          <div>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">Destino Final</p>
                             <p className="text-sm font-medium">{reservaSeleccionada.lugares.destino}</p>
                          </div>
                       </div>
                    </section>
                  </div>

                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest border-b pb-1">Instrucciones & Comentarios</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                          <p className="text-[10px] text-blue-600 font-black uppercase mb-1">C1: Para el Conductor</p>
                          <p className="text-xs text-gray-700 italic">"{reservaSeleccionada.comentarios.conductor}"</p>
                       </div>
                       <div className="bg-red-50/50 p-3 rounded-lg border border-red-100">
                          <p className="text-[10px] text-red-600 font-black uppercase mb-1">C2: Interno Administrativo</p>
                          <p className="text-xs text-gray-700 italic">"{reservaSeleccionada.comentarios.interno}"</p>
                       </div>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Historial de Auditoría</h4>
                       <Info className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="bg-gray-50 p-2 rounded divide-y divide-gray-200">
                       {reservaSeleccionada.auditLogs.map((log, i) => (
                         <div key={i} className="py-2 flex justify-between text-[10px]">
                            <span className="font-bold text-gray-600">{log.quien} (Admin)</span>
                            <span className="text-gray-500">{log.accion} • {new Date(log.cuando).toLocaleString()}</span>
                         </div>
                       ))}
                    </div>
                  </section>
                </div>

                {/* Finanzas Panel */}
                <div className="bg-gray-50/50 p-6 space-y-6">
                   <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-green-700 uppercase tracking-widest border-b pb-1">Cálculo Financiero Pulse</h4>
                      <div className="space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Monto Bruto:</span>
                            <span className="text-sm font-bold text-gray-900">${reservaSeleccionada.finanzas.montoBruto.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Gastos (Peajes/Estac):</span>
                            <span className="text-sm font-bold text-red-600">-${reservaSeleccionada.finanzas.gastosAdicionales.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center border-t pt-2">
                            <span className="text-xs text-gray-500">Monto Base:</span>
                            <span className="text-sm font-bold text-gray-900">${(reservaSeleccionada.finanzas.montoBruto - reservaSeleccionada.finanzas.gastosAdicionales).toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs text-blue-600 font-bold">Comisión ({reservaSeleccionada.finanzas.porcentajeComision}%):</span>
                            <span className="text-sm font-bold text-blue-600">-${((reservaSeleccionada.finanzas.montoBruto - reservaSeleccionada.finanzas.gastosAdicionales) * reservaSeleccionada.finanzas.porcentajeComision / 100).toLocaleString()}</span>
                         </div>
                         <div className="bg-green-600 p-4 rounded-xl text-white shadow-lg text-center space-y-1">
                            <p className="text-[10px] font-black uppercase opacity-80 letter-spacing-widest">Resultado Neto Liquido</p>
                            <p className="text-2xl font-black">${reservaSeleccionada.finanzas.montoNeto.toLocaleString()}</p>
                         </div>
                      </div>
                   </section>

                   <section className="space-y-4 pt-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-1">Estado Tributario</h4>
                      <div className="space-y-2">
                         <div className="p-3 border rounded-lg bg-white space-y-2">
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-gray-500">Doc: {reservaSeleccionada.finanzas.tipoDocumento}</span>
                               <span className="font-bold">{reservaSeleccionada.finanzas.folioFactura || 'Sin Folio'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-gray-500">Pago:</span>
                               <span className="font-bold underline decoration-blue-400">{reservaSeleccionada.finanzas.formaPago}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t mt-2">
                               <label className="flex items-center text-xs font-bold gap-2">
                                  <input type="checkbox" checked={reservaSeleccionada.finanzas.cobrado} readOnly className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                                  ¿COBRADO EN BANCO?
                                </label>
                                {reservaSeleccionada.finanzas.cobrado && (
                                   <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                            </div>
                         </div>
                         <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-md">
                           <FileText className="h-4 w-4 mr-2" /> Emitir SII (Komer)
                         </Button>
                      </div>
                   </section>
                </div>
              </div>
            </CardContent>
            <div className="p-4 border-t bg-white flex justify-between items-center">
               <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-white">Editar</Button>
                  <Button variant="outline" size="sm" className="bg-white border-red-200 text-red-500 hover:bg-red-50">Anular OP</Button>
               </div>
               <Button onClick={() => setMostrarDetalle(false)} className="bg-gray-900 text-white hover:bg-black">Finalizar Revisión</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Formulario Nueva Reserva / Clonación */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
          <Card className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-blue-600 text-white px-6 py-4">
              <div className="flex items-center gap-3">
                 <MapPin className="h-6 w-6" />
                 <CardTitle className="text-xl">Formulario de Agendamiento Maestro</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMostrarFormulario(false)} className="text-white hover:bg-blue-700 rounded-full">
                <XCircle className="h-6 w-6" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[85vh]">
              <form onSubmit={handleCrearReserva} className="divide-y divide-gray-100">
                {/* Bloque 1: Cliente y Categoría */}
                <div className="p-6 grid md:grid-cols-3 gap-6 bg-gray-50/50">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Categoría de Servicio</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Web', 'Minera', 'Extranjero', 'Operador'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormReserva({ ...formReserva, categoria: cat as any })}
                          className={`px-3 py-2 text-xs font-bold border rounded-lg transition-all ${
                            formReserva.categoria === cat 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-105' 
                              : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Datos del Cliente Reservante</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative group">
                        <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
                        <input 
                          type="text" required placeholder="Nombre / Empresa Principal"
                          className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm bg-white"
                          value={formReserva.cliente.nombre}
                          onChange={(e) => setFormReserva({...formReserva, cliente: {...formReserva.cliente, nombre: e.target.value}})}
                        />
                      </div>
                      <input 
                        type="text" placeholder="RUT Empresa (Opcional)"
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                        value={formReserva.cliente.rut_empresa}
                        onChange={(e) => setFormReserva({...formReserva, cliente: {...formReserva.cliente, rut_empresa: e.target.value}})}
                      />
                      <div className="relative group">
                         <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 focus-within:text-blue-500" />
                         <input 
                          type="email" required placeholder="Email de Facturación"
                          className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm bg-white"
                          value={formReserva.cliente.email}
                          onChange={(e) => setFormReserva({...formReserva, cliente: {...formReserva.cliente, email: e.target.value}})}
                        />
                      </div>
                      <div className="relative group">
                         <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 focus-within:text-blue-500" />
                         <input 
                          type="text" required placeholder="DNI / Pasaporte"
                          className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm bg-white"
                          value={formReserva.cliente.dni_pasaporte}
                          onChange={(e) => setFormReserva({...formReserva, cliente: {...formReserva.cliente, dni_pasaporte: e.target.value}})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bloque 2: Pasajeros y Maletas */}
                <div className="p-6 grid md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h3 className="text-xs font-black text-gray-700 flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" /> DETALLES DEL PASAJERO (PAX)
                      </h3>
                      <div className="space-y-3">
                         <input 
                            type="text" required placeholder="Nombre de quien viaja"
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"
                            value={formReserva.pasajeros.nombre}
                            onChange={(e) => setFormReserva({...formReserva, pasajeros: {...formReserva.pasajeros, nombre: e.target.value}})}
                         />
                         <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                               <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                               <input 
                                  type="text" required placeholder="Teléfono Pax"
                                  className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm bg-gray-50"
                                  value={formReserva.pasajeros.telefono}
                                  onChange={(e) => setFormReserva({...formReserva, pasajeros: {...formReserva.pasajeros, telefono: e.target.value}})}
                               />
                            </div>
                            <input 
                               type="number" required placeholder="Total PAX" min="1"
                               className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-center"
                               value={formReserva.pasajeros.cantidad}
                               onChange={(e) => setFormReserva({...formReserva, pasajeros: {...formReserva.pasajeros, cantidad: parseInt(e.target.value)}})}
                            />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-xs font-black text-gray-700 flex items-center gap-2">
                        <Luggage className="h-4 w-4 text-orange-500" /> LOGÍSTICA DE CARGA
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase text-center">Maletas G (23K)</span>
                            <input 
                               type="number" required min="0"
                               className="w-full px-3 py-2 border rounded-lg text-sm text-center bg-gray-50"
                               value={formReserva.logistica.maletasGrandes}
                               onChange={(e) => setFormReserva({...formReserva, logistica: {...formReserva.logistica, maletasGrandes: parseInt(e.target.value)}})}
                            />
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase text-center">Maletas Cabina</span>
                            <input 
                               type="number" required min="0"
                               className="w-full px-3 py-2 border rounded-lg text-sm text-center bg-gray-50"
                               value={formReserva.logistica.maletasChicas}
                               onChange={(e) => setFormReserva({...formReserva, logistica: {...formReserva.logistica, maletasChicas: parseInt(e.target.value)}})}
                            />
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase text-center">Silla Bebé</span>
                            <div className="flex items-center gap-2 h-full justify-center">
                               <input 
                                 type="checkbox" 
                                 className="h-5 w-5 rounded border-gray-300 text-blue-600"
                                 checked={formReserva.logistica.sillaBebe}
                                 onChange={(e) => setFormReserva({...formReserva, logistica: {...formReserva.logistica, sillaBebe: e.target.checked}})}
                               />
                               {formReserva.logistica.sillaBebe && (
                                 <input 
                                   type="number" min="1" className="w-10 px-1 py-1 border rounded text-xs text-center"
                                   value={formReserva.logistica.cantidadSillas}
                                   onChange={(e) => setFormReserva({...formReserva, logistica: {...formReserva.logistica, cantidadSillas: parseInt(e.target.value)}})}
                                 />
                               )}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Bloque 3: Ruta y Horario */}
                <div className="p-6 grid md:grid-cols-2 gap-8 bg-gray-50/30">
                   <div className="space-y-4">
                      <h3 className="text-xs font-black text-gray-700 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-500" /> RUTA Y SEGUIMIENTO
                      </h3>
                      <div className="space-y-3">
                         <div className="grid grid-cols-2 gap-3">
                            <input 
                               type="text" required placeholder="Origen (ej: Hotel / Oficina)"
                               className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                               value={formReserva.lugares.origen}
                               onChange={(e) => setFormReserva({...formReserva, lugares: {...formReserva.lugares, origen: e.target.value}})}
                            />
                            <input 
                               type="text" placeholder="N° Vuelo (Tracking)"
                               className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                               value={formReserva.lugares.numeroVuelo}
                               onChange={(e) => setFormReserva({...formReserva, lugares: {...formReserva.lugares, numeroVuelo: e.target.value}})}
                            />
                         </div>
                         <input 
                            type="text" required placeholder="Destino Final del Servicio"
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                            value={formReserva.lugares.destino}
                            onChange={(e) => setFormReserva({...formReserva, lugares: {...formReserva.lugares, destino: e.target.value}})}
                         />
                         <input 
                            type="text" required placeholder="Nombre del Servicio (ej: City Tour Premium)"
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-bold"
                            value={formReserva.servicio}
                            onChange={(e) => setFormReserva({...formReserva, servicio: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-xs font-black text-gray-700 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-fuchsia-500" /> TEMPORALIDAD
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                         <div className="col-span-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Fecha</span>
                            <input 
                               type="date" required
                               className="w-full px-2 py-2 border rounded-lg text-sm bg-white"
                               value={formReserva.fecha}
                               onChange={(e) => setFormReserva({...formReserva, fecha: e.target.value})}
                            />
                         </div>
                         <div className="col-span-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Hora Inicio</span>
                            <input 
                               type="time" required
                               className="w-full px-2 py-2 border rounded-lg text-sm bg-white"
                               value={formReserva.horaInicio}
                               onChange={(e) => setFormReserva({...formReserva, horaInicio: e.target.value})}
                            />
                         </div>
                         <div className="col-span-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Hora Termino</span>
                            <input 
                               type="time" required
                               className="w-full px-2 py-2 border rounded-lg text-sm bg-white"
                               value={formReserva.horaTermino}
                               onChange={(e) => setFormReserva({...formReserva, horaTermino: e.target.value})}
                            />
                         </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                         <div className="col-span-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Vehículo</span>
                            <select 
                               required className="w-full px-2 py-2 border rounded-lg text-sm bg-white"
                               value={formReserva.tipoVehiculo}
                               onChange={(e) => setFormReserva({...formReserva, tipoVehiculo: e.target.value as any})}
                            >
                               <option value="SUV">SUV</option>
                               <option value="Van">Van</option>
                               <option value="Sedán">Sedán</option>
                            </select>
                         </div>
                         <div className="col-span-2">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Asignar Chofer</span>
                            <select 
                               required className="w-full px-2 py-2 border rounded-lg text-sm bg-white"
                               value={formReserva.conductorId}
                               onChange={(e) => setFormReserva({...formReserva, conductorId: e.target.value})}
                            >
                               <option value="">Seleccione Conductor</option>
                               {conductores.filter(c => c.estado === 'activo').map(c => (
                                 <option key={c.id} value={c.id}>{c.nombre}</option>
                               ))}
                            </select>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Bloque 4: Finanzas y Cobranza */}
                <div className="p-6 grid md:grid-cols-2 gap-8 bg-green-50/20">
                   <div className="space-y-4">
                      <h3 className="text-xs font-black text-green-700 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> GESTIÓN DE COBROS Y TRIBUTARIA
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Monto Bruto</span>
                            <input 
                               type="number" required placeholder="$ Total Pactado"
                               className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-bold"
                               value={formReserva.finanzas.montoBruto}
                               onChange={(e) => setFormReserva({...formReserva, finanzas: {...formReserva.finanzas, montoBruto: parseInt(e.target.value)}})}
                            />
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Gts. Adic. (Peajes/Estac)</span>
                            <input 
                               type="number" required placeholder="$ Gastos"
                               className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                               value={formReserva.finanzas.gastosAdicionales}
                               onChange={(e) => setFormReserva({...formReserva, finanzas: {...formReserva.finanzas, gastosAdicionales: parseInt(e.target.value)}})}
                            />
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Forma de Pago</span>
                            <select 
                               required className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                               value={formReserva.finanzas.formaPago}
                               onChange={(e) => setFormReserva({...formReserva, finanzas: {...formReserva.finanzas, formaPago: e.target.value as any}})}
                            >
                               <option value="Efectivo">Efectivo</option>
                               <option value="Transferencia">Transferencia</option>
                               <option value="Convenio PF">Convenio PF</option>
                               <option value="Tarjeta">Tarjeta</option>
                            </select>
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">Tipo Documento</span>
                            <select 
                               required className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                               value={formReserva.finanzas.tipoDocumento}
                               onChange={(e) => setFormReserva({...formReserva, finanzas: {...formReserva.finanzas, tipoDocumento: e.target.value as any}})}
                            >
                               <option value="Boleta">Boleta</option>
                               <option value="Factura">Factura</option>
                            </select>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-xs font-black text-orange-700 flex items-center gap-2">
                        <Info className="h-4 w-4" /> COMENTARIOS DUALES
                      </h3>
                      <div className="grid gap-3">
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">C1: Comentario Conductor</span>
                            <textarea 
                               className="w-full px-3 py-1.5 border rounded-lg text-xs h-12 bg-white"
                               placeholder="Instrucciones de recojo, cartel, ruta..."
                               value={formReserva.comentarios.conductor}
                               onChange={(e) => setFormReserva({...formReserva, comentarios: {...formReserva.comentarios, conductor: e.target.value}})}
                            />
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-red-600 font-bold uppercase">C2: Comentario Interno (Privado)</span>
                            <textarea 
                               className="w-full px-3 py-1.5 border rounded-lg text-xs h-12 bg-white border-red-100"
                               placeholder="Notas de cobro, colaciones, depósitos..."
                               value={formReserva.comentarios.interno}
                               onChange={(e) => setFormReserva({...formReserva, comentarios: {...formReserva.comentarios, interno: e.target.value}})}
                            />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                   <div className="flex flex-col">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Cálculo de Neto Automático Pulse™</span>
                      <div className="flex items-center gap-3">
                         <div className="text-gray-400 font-bold flex flex-col">
                            <span className="text-[10px]">Bruto - Gastos</span>
                            <span className="text-sm">${(formReserva.finanzas.montoBruto - formReserva.finanzas.gastosAdicionales).toLocaleString()}</span>
                         </div>
                         <div className="text-gray-300">X</div>
                         <div className="text-blue-500 font-bold flex flex-col">
                            <span className="text-[10px]">Util. ({100 - formReserva.finanzas.porcentajeComision}%)</span>
                            <span className="text-sm">${calcularNeto(formReserva.finanzas.montoBruto, formReserva.finanzas.gastosAdicionales, formReserva.finanzas.porcentajeComision).toLocaleString()}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-3 w-full md:w-auto">
                      <Button type="button" variant="outline" onClick={() => setMostrarFormulario(false)} className="flex-1 md:flex-none">Descartar</Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-10 px-10 shadow-lg flex-1 md:flex-none">Confirmar y Guardar Reserva</Button>
                   </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
