import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, Filter, MapPin, Clock, User, Users, Car, FileText, 
  FileSpreadsheet, ChevronRight, CheckCircle, XCircle, Calendar as CalendarIcon, 
  Copy, Briefcase, Hash, Luggage, Baby, Phone, Mail, DollarSign, Info, Settings, Trash2
} from 'lucide-react';
import { exportToExcel } from '../../lib/excelExport';
import { Pagination } from '../../components/ui/Pagination';
import { ReservaTurismo } from '../../types';

export default function ReservasTurismo() {
  const { activeCompanyId } = useCompany();
  
  // States to hold DB data
  const [reservasTurismo, setReservasTurismo] = useState<ReservaTurismo[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [contratos, setContratos] = useState<{id: string, razonSocial: string}[]>([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([]);

  const loadData = async () => {
    if (!activeCompanyId) return;

    try {
      let query = supabase
        .from('operacion_reserva')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeCompanyId !== 'GLOBAL') {
        query = query.eq('empresa_id', activeCompanyId);
      }

      const { data: reservasData, error: reservasError } = await query;

      if (reservasError) throw reservasError;

      const formattedReservas: ReservaTurismo[] = (reservasData || []).map((dbR: any) => ({
        id: dbR.id,
        op: dbR.codigo || 'SIN-OP',
        categoria: dbR.categoria as any,
        cliente: {
          nombre: dbR.cliente_nombre || '',
          email: dbR.cliente_email || '',
          telefono: dbR.cliente_telefono || '',
          dni_pasaporte: dbR.detalles?.cliente?.dni_pasaporte || '',
          rut_empresa: dbR.cliente_rut || '',
          tipoCliente: dbR.detalles?.cliente?.tipoCliente || 'Particular',
          contratoId: dbR.detalles?.cliente?.contratoId || ''
        },
        pasajeros: dbR.detalles?.pasajeros || { nombre: '', telefono: '', cantidad: dbR.pasajeros_cantidad || 1 },
        pasajerosList: dbR.detalles?.pasajerosList || [],
        lugares: {
          origen: dbR.origen || '',
          destino: dbR.destino || '',
          numeroVuelo: dbR.detalles?.lugares?.numeroVuelo || ''
        },
        logistica: dbR.detalles?.logistica || { maletasGrandes: 0, maletasChicas: 0, sillaBebe: false, alzador: false, cantidadSillas: 0 },
        servicio: dbR.detalles?.servicio || '',
        tipoVehiculo: dbR.detalles?.tipoVehiculo || 'SUV',
        enlaceMapa: dbR.detalles?.enlaceMapa || '',
        fecha: dbR.fecha_reserva ? new Date(dbR.fecha_reserva).toISOString().split('T')[0] : '',
        horaInicio: dbR.detalles?.horaInicio || '',
        horaTermino: dbR.detalles?.horaTermino || '',
        conductorId: dbR.conductor_id || '',
        vehiculoId: dbR.vehiculo_id || '',
        finanzas: dbR.detalles?.finanzas || {
          montoBruto: Number(dbR.monto_total) || 0,
          gastosAdicionales: 0,
          porcentajeComision: 10,
          formaPago: 'Efectivo',
          tipoDocumento: 'Boleta',
          cobrado: false,
          montoNeto: 0,
          fechaDeposito: ''
        },
        archivosAdicionales: dbR.detalles?.archivosAdicionales || [],
        comentarios: dbR.detalles?.comentarios || { conductor: '', interno: '' },
        estado: dbR.estado_viaje?.toLowerCase() || 'pendiente',
        auditLogs: dbR.detalles?.auditLogs || []
      }));

      setReservasTurismo(formattedReservas);

      const dbCategories = (reservasData || []).map((dbR: any) => dbR.categoria).filter(Boolean);
      const uniqueCats = Array.from(new Set([...categoriasMaestras, ...dbCategories])) as string[];
      setCategoriasDisponibles(uniqueCats);

      let condQuery = supabase.from('colaborador').select('id, nombre, estado').in('rol', ['Conductor', 'Chofer', 'Conductor Interprovincial', 'Conductor Interno Mina']);
      let vehQuery = supabase.from('vehiculo').select('id, patente, marca, estado');
      let rutasQuery = supabase.from('operacion_ruta').select('*').order('created_at', { ascending: false });
      let contratosQ = supabase.from('operacion_contrato').select('id, cliente_razon_social').eq('activo', true);

      if (activeCompanyId !== 'GLOBAL') {
        condQuery = condQuery.eq('empresa_id', activeCompanyId);
        vehQuery = vehQuery.eq('empresa_id', activeCompanyId);
        rutasQuery = rutasQuery.eq('empresa_id', activeCompanyId);
        contratosQ = contratosQ.eq('empresa_id', activeCompanyId);
      }

      const { data: condData } = await condQuery;
      if (condData) setConductores(condData);

      const { data: vehData } = await vehQuery;
      if (vehData) setVehiculos(vehData);

      const { data: rutasData } = await rutasQuery;
      if (rutasData) setRutasGuardadas(rutasData);

      const { data: contratosData } = await contratosQ;
      if (contratosData) setContratos(contratosData.map(c => ({ id: c.id, razonSocial: c.cliente_razon_social })));

      if (activeCompanyId === 'GLOBAL') {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email) {
          const { data: ua } = await supabase.from('usuario_aplicacion').select('empresa_id, empresa(id, nombre)').eq('email', userData.user.email);
          if (ua && ua.length > 0) {
            setUserCompanies(ua.map((u: any) => ({ id: u.empresa?.id || u.empresa_id, nombre: u.empresa?.nombre || 'Mi Empresa' })));
            if (!newEmpresaId) {
              const firstCompany = (ua[0] as any);
              setNewEmpresaId(firstCompany.empresa_id || firstCompany.empresa?.id);
            }
          } else {
            const { data: allEmpresas } = await supabase.from('empresa').select('id, nombre').eq('estado', 'Activo');
            if (allEmpresas) {
              setUserCompanies(allEmpresas.map((e: any) => ({ id: e.id, nombre: e.nombre })));
            }
          }
        }
      } else {
        setNewEmpresaId(activeCompanyId);
      }

    } catch (error) {
      console.error('Error loading data', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId]);
  
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
  const [mostrarFormulario, setMostrarFormulario] = useState(() => {
    try {
      return localStorage.getItem('mostrarFormularioDraft') === 'true';
    } catch { return false; }
  });
  const [rutasGuardadas, setRutasGuardadas] = useState<any[]>([]);
  const [mostrarCrearRuta, setMostrarCrearRuta] = useState(false);
  const [mostrarPanelCategorias, setMostrarPanelCategorias] = useState(false);
  const [nuevaCategoriaForm, setNuevaCategoriaForm] = useState('');
  const [categoriasMaestras, setCategoriasMaestras] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('categoriasMaestras') || '[]');
    } catch {
      return [];
    }
  });

  const guardarCategorias = (nuevas: string[]) => {
    setCategoriasMaestras(nuevas);
    localStorage.setItem('categoriasMaestras', JSON.stringify(nuevas));
  };
  
  const [isCustomCategoria, setIsCustomCategoria] = useState(false);
  const [nuevaRutaForm, setNuevaRutaForm] = useState({ nombre: '', origen: '', destino: '', enlaceMapa: '' });

  // New Reservation Form State
  const initialFormState: any = {
    categoria: 'Web' as ReservaTurismo['categoria'],
    cliente: { nombre: '', email: '', telefono: '', dni_pasaporte: '', rut_empresa: '', tipoCliente: 'Particular', contratoId: '' },
    pasajeros: { nombre: '', telefono: '', cantidad: 1 },
    pasajerosList: [],
    lugares: { origen: '', destino: '', numeroVuelo: '' },
    logistica: { maletasGrandes: 0, maletasChicas: 0, sillaBebe: false, alzador: false, cantidadSillas: 0, cantidadAlzadores: 0 },
    servicio: '',
    tipoVehiculo: 'SUV' as ReservaTurismo['tipoVehiculo'] | 'Mini Bus' | 'Bus' | 'Otros',
    enlaceMapa: '',
    fecha: '',
    horaInicio: '',
    conductorId: '',
    vehiculoId: '',
    finanzas: {
      montoBruto: 0,
      gastosAdicionales: 0,
      porcentajeComision: 10,
      formaPago: 'Efectivo' as ReservaTurismo['finanzas']['formaPago'],
      tipoDocumento: 'Boleta' as ReservaTurismo['finanzas']['tipoDocumento'],
      cobrado: false,
      fechaDeposito: ''
    },
    archivosAdicionales: [],
    comentarios: { conductor: '', interno: '' }
  };

  const [formReserva, setFormReserva] = useState(() => {
    try {
      const saved = localStorage.getItem('formReservaDraft');
      if (saved) return JSON.parse(saved);
    } catch(e){}
    return initialFormState;
  });

  useEffect(() => {
    localStorage.setItem('formReservaDraft', JSON.stringify(formReserva));
    localStorage.setItem('mostrarFormularioDraft', mostrarFormulario.toString());
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
       if (mostrarFormulario) {
         e.preventDefault();
         e.returnValue = '';
       }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formReserva, mostrarFormulario]);

  const empresasConvenio = useMemo(() => Array.from(new Set(reservasTurismo.map(r => r.cliente.nombre).filter(Boolean))), [reservasTurismo]);
  const lugaresComunes = useMemo(() => {
    const list = new Set([...reservasTurismo.map(r => r.lugares.origen), ...reservasTurismo.map(r => r.lugares.destino)].filter(Boolean));
    ['Aeropuerto', 'Terminal de Bus', 'Nacional', 'Internacional'].forEach(l => list.add(l));
    return Array.from(list);
  }, [reservasTurismo]);

  const telefonosComunes = useMemo(() => {
    const list = new Set(reservasTurismo.map(r => r.pasajeros.telefono).filter(Boolean));
    return Array.from(list);
  }, [reservasTurismo]);

  const handlePhoneChange = (val: string) => {
    setFormReserva(prev => ({...prev, pasajeros: {...prev.pasajeros, telefono: val}}));
    const match = reservasTurismo.find(r => r.pasajeros.telefono === val);
    if (match) {
      setFormReserva(prev => ({
        ...prev,
        pasajeros: {
          ...prev.pasajeros,
          telefono: val,
          nombre: prev.pasajeros.nombre || match.pasajeros.nombre
        },
        cliente: {
          ...prev.cliente,
          nombre: prev.cliente.nombre || match.cliente.nombre || prev.pasajeros.nombre || match.pasajeros.nombre
        },
        lugares: {
          ...prev.lugares,
          origen: prev.lugares.origen || match.lugares.origen,
          destino: prev.lugares.destino || match.lugares.destino
        }
      }));
    }
  };

  const [userCompanies, setUserCompanies] = useState<{id: string, nombre: string}[]>([]);
  const [newEmpresaId, setNewEmpresaId] = useState('');

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

  const handleActualizarEstado = async (nuevoEstado: string) => {
    if (!reservaSeleccionada) return;
    try {
        const { error } = await supabase.from('operacion_reserva').update({ estado_viaje: nuevoEstado }).eq('id', reservaSeleccionada.id);
        if (error) throw error;
        setMostrarDetalle(false);
        loadData();
    } catch (e) {
        console.error(e);
        alert('Error al actualizar: ' + (e as Error).message);
    }
  };

  const handleCopiarReserva = (reserva: ReservaTurismo, tipo: 'chofer' | 'pasajero') => {
    const c = conductores.find(cond => cond.id === reserva.conductorId);
    
    let texto = `https://www.fastour.cl/\n`;
    texto += `OP: ${reserva.op}   Tipo: ${reserva.categoria}\n`;
    texto += `Fecha: ${reserva.fecha}\n`;
    texto += `Hora🛑⏰: ${reserva.horaInicio}\n`;
    
    if (reserva.lugares.numeroVuelo) {
       texto += `🛑 Vuelo: ${reserva.lugares.numeroVuelo}\n`;
    }

    texto += `(Vehículo: ${reserva.tipoVehiculo} + ${reserva.pasajeros.cantidad} Pax + ${reserva.logistica.maletasGrandes || 0} MG 23K + ${reserva.logistica.maletasChicas || 0} Mch)\n`;
    texto += `📞 ${reserva.cliente.telefono}\n`;
    texto += `Empresa: *${reserva.cliente.nombre} ${reserva.cliente.rut_empresa ? reserva.cliente.rut_empresa : ''}*\n`;
    texto += `Pax: *${reserva.pasajeros.nombre}*\n`;
    texto += `A Origen: *${reserva.lugares.origen}*\n`;
    
    if (reserva.pasajerosList && reserva.pasajerosList.length > 0) {
       texto += `B Destino: *PASAJERO 1: ${reserva.lugares.destino}*\n`;
       reserva.pasajerosList.forEach((p, idx) => {
          texto += `PASAJERO ${idx + 2}: ${p.nombre} ${p.telefono ? p.telefono : ''} ${p.destino}\n`;
       });
    } else {
       texto += `B Destino: *${reserva.lugares.destino}*\n`;
    }

    if (tipo === 'chofer') {
       texto += `Monto: $${reserva.finanzas.montoBruto} ${reserva.finanzas.tipoDocumento}\n`;
       texto += `Conductor: ${c ? c.nombre : 'Sin Asignar'}\n`;
       texto += `Pago: ${reserva.finanzas.formaPago}\n`;
       texto += `Comentarios: 🛑👁️ ${reserva.comentarios.conductor || ''} ${reserva.comentarios.interno || ''} ${reserva.enlaceMapa || ''}\n`;
    } else {
       texto += `Conductor: ${c ? c.nombre : 'Sin Asignar'}\n`;
       if (reserva.comentarios.conductor || reserva.enlaceMapa) {
          texto += `Comentarios: ${reserva.comentarios.conductor || ''} ${reserva.enlaceMapa || ''}\n`;
       }
    }

    navigator.clipboard.writeText(texto).then(() => {
       alert(`Copiado formato para ${tipo}`);
    }).catch(err => {
       console.error(err);
       alert('Error al copiar al portapapeles');
    });
  };

  const handleCrearReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCompanyId = activeCompanyId === 'GLOBAL' ? newEmpresaId : activeCompanyId;

    if (!finalCompanyId) {
      alert('Por favor, selecciona una empresa operadora para esta reserva.');
      return;
    }

    const neto = calcularNeto(formReserva.finanzas.montoBruto, formReserva.finanzas.gastosAdicionales, formReserva.finanzas.porcentajeComision);
    
    const isEdit = !!(formReserva as any).id;
    const auditLogs = (formReserva as any).auditLogs || [];

    const reservationData: any = {
      empresa_id: finalCompanyId,
      categoria: formReserva.categoria,
      cliente_nombre: formReserva.cliente.nombre,
      cliente_email: formReserva.cliente.email,
      cliente_telefono: formReserva.cliente.telefono,
      cliente_rut: formReserva.cliente.rut_empresa,
      origen: formReserva.lugares.origen,
      destino: formReserva.lugares.destino,
      fecha_reserva: formReserva.fecha ? new Date(`${formReserva.fecha}T${formReserva.horaInicio || '00:00'}:00`).toISOString() : null,
      pasajeros_cantidad: formReserva.pasajeros.cantidad,
      monto_total: formReserva.finanzas.montoBruto,
      estado_pago: formReserva.finanzas.cobrado ? 'Pagado' : 'Pendiente',
      conductor_id: formReserva.conductorId || null,
      vehiculo_id: formReserva.vehiculoId || null,
      detalles: {
        cliente: formReserva.cliente,
        pasajeros: formReserva.pasajeros,
        pasajerosList: formReserva.pasajerosList,
        archivosAdicionales: formReserva.archivosAdicionales,
        lugares: formReserva.lugares,
        logistica: formReserva.logistica,
        servicio: formReserva.servicio,
        tipoVehiculo: formReserva.tipoVehiculo,
        enlaceMapa: (formReserva as any).enlaceMapa,
        horaInicio: formReserva.horaInicio,
        finanzas: {
          ...formReserva.finanzas,
          montoNeto: neto
        },
        comentarios: formReserva.comentarios,
        auditLogs: isEdit 
            ? [...auditLogs, { accion: 'Reserva Actualizada', quien: 'Actual Usuario', cuando: new Date().toISOString() }]
            : [{ accion: 'Reserva Creada', quien: 'Actual Usuario', cuando: new Date().toISOString() }]
      }
    };

    if (!isEdit) {
       reservationData.codigo = `OP-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
       reservationData.estado_viaje = 'Confirmado';
    }

    try {
      if (isEdit) {
         const { error } = await supabase.from('operacion_reserva').update(reservationData).eq('id', (formReserva as any).id);
         if (error) throw error;
      } else {
         const { error } = await supabase.from('operacion_reserva').insert([reservationData]);
         if (error) throw error;
      }
      
      setMostrarFormulario(false);
      setFormReserva(initialFormState);
      localStorage.removeItem('formReservaDraft');
      loadData(); // refresh data
    } catch (err) {
      console.error('Error saving reserva', err);
      alert('Error guardando reserva');
    }
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
      case 'Web': return { card: 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', textBase: 'text-blue-700 dark:text-blue-400', innerBox: 'border-blue-400 dark:border-blue-700 bg-white dark:bg-slate-800/50', innerText: 'text-blue-700 dark:text-blue-300', button: 'border-blue-500 text-blue-600 dark:text-blue-400', iconBox: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400' };
      case 'Whatsapp': return { card: 'bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800', textBase: 'text-green-700 dark:text-green-400', innerBox: 'border-green-400 dark:border-green-700 bg-white dark:bg-slate-800/50', innerText: 'text-green-700 dark:text-green-300', button: 'border-green-500 text-green-600 dark:text-green-400', iconBox: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' };
      case 'Correo': return { card: 'bg-rose-50/50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800', textBase: 'text-rose-700 dark:text-rose-400', innerBox: 'border-rose-400 dark:border-rose-700 bg-white dark:bg-slate-800/50', innerText: 'text-rose-700 dark:text-rose-300', button: 'border-rose-500 text-rose-600 dark:text-rose-400', iconBox: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400' };
      case 'Minera': return { card: 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', textBase: 'text-emerald-700 dark:text-emerald-400', innerBox: 'border-emerald-600 dark:border-emerald-700 bg-white dark:bg-slate-800/50', innerText: 'text-emerald-700 dark:text-emerald-300', button: 'border-emerald-600 text-emerald-700 dark:text-emerald-400', iconBox: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' };
      case 'Extranjero': return { card: 'bg-fuchsia-50/40 dark:bg-fuchsia-900/20 border-fuchsia-200 dark:border-fuchsia-800', textBase: 'text-fuchsia-700 dark:text-fuchsia-400', innerBox: 'border-fuchsia-500 dark:border-fuchsia-700 bg-white dark:bg-slate-800/50', innerText: 'text-fuchsia-700 dark:text-fuchsia-300', button: 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400', iconBox: 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-400' };
      case 'Operador': return { card: 'bg-orange-50/50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', textBase: 'text-orange-700 dark:text-orange-400', innerBox: 'border-orange-500 dark:border-orange-700 bg-white dark:bg-slate-800/50', innerText: 'text-orange-700 dark:text-orange-300', button: 'border-orange-500 text-orange-600 dark:text-orange-400', iconBox: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400' };
      default: return { card: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800', textBase: 'text-slate-700 dark:text-slate-300', innerBox: 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50', innerText: 'text-slate-700 dark:text-slate-300', button: 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300', iconBox: 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Pizarra Máster de Reservas</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-sm border dark:border-slate-800 font-medium px-2.5 py-0.5">
              <CalendarIcon className="w-3 h-3 mr-1.5" />
              {fechaHoy}
            </Badge>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gestión ejecutiva, turismo y minería</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setMostrarFormulario(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" /> Nueva Reserva
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="border-green-600 text-green-600 hover:bg-green-50 dark:bg-green-900/30 dark:hover:bg-green-900/20 shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar BI
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-800/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-fuchsia-500 to-emerald-500"></div>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                placeholder="OP, Cliente, Tel..." 
                className="w-full pl-10 pr-4 py-2 border rounded rounded-md dark:border-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 border rounded rounded-md dark:border-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="">Todas las Categorías</option>
              {categoriasDisponibles.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select 
              className="px-3 py-2 border rounded rounded-md dark:border-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
              value={filtroVehiculo}
              onChange={(e) => setFiltroVehiculo(e.target.value)}
            >
              <option value="">Todos los Vehículos</option>
              {vehiculos.map(v => (
                 <option key={v.id} value={v.id}>{v.patente} - {v.modelo || v.marca || ''}</option>
              ))}
            </select>
            <select 
              className="px-3 py-2 border rounded rounded-md dark:border-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
              value={filtroConductor}
              onChange={(e) => setFiltroConductor(e.target.value)}
            >
              <option value="">Todos los Conductores</option>
              {conductores.map(c => (
                 <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <select 
              className="px-3 py-2 border rounded rounded-md dark:border-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="en curso">En Curso</option>
              <option value="finalizado">Finalizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <div className="flex gap-2">
               <input 
                 type="date" 
                 className="w-full px-2 py-2 border rounded rounded-md dark:border-slate-800 text-xs"
                 value={fechaInicio}
                 onChange={(e) => setFechaInicio(e.target.value)}
               />
               <input 
                 type="date" 
                 className="w-full px-2 py-2 border rounded rounded-md dark:border-slate-800 text-xs"
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
            <Card key={res.id} className={`hover:shadow-lg transition-all border border-2 dark:border-slate-800 rounded-xl ${theme.card}`}>
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
                  <div className="flex items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                    <User className="h-3.5 w-3.5 mr-2 text-slate-400 dark:text-slate-500" />
                    {res.pasajeros.nombre}
                  </div>
                  <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400">
                    <Phone className="h-3 w-3 mr-2 text-slate-300" />
                    {res.pasajeros.telefono}
                  </div>
                </div>

                <div className={`p-3 rounded-lg border dark:border-slate-800 space-y-2 ${theme.innerBox}`}>
                   <div className="flex items-center text-[10px] font-medium">
                      <MapPin className={`h-3 w-3 mr-2 shrink-0 ${theme.textBase}`} />
                      <span className={`line-clamp-1 ${theme.innerText}`}>{res.lugares.origen}</span>
                   </div>
                   <div className="flex items-center text-[10px] font-medium ml-1">
                      <ChevronRight className="h-3 w-3 mr-2 text-slate-300 shrink-0" />
                      <span className={`line-clamp-1 ${theme.innerText}`}>{res.lugares.destino}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="text-[10px] flex flex-col">
                    <span className="text-slate-400 dark:text-slate-500 uppercase font-black tracking-wide">Fecha / Día</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{res.fecha} ({diaSemana.substring(0, 3)})</span>
                  </div>
                  <div className="text-[10px] flex flex-col text-right">
                    <span className="text-slate-400 dark:text-slate-500 uppercase font-black tracking-wide">Horario</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{res.horaInicio}</span>
                  </div>
                </div>

                <div className={`flex items-center justify-between pt-3 border-t mt-4 border-slate-200 dark:border-slate-800`}>
                   <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shadow-inner">
                        {conductor?.nombre?.[0] || '?'}
                      </div>
                      <div className="flex flex-col justify-center">
                         <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest leading-none">Móvil</span>
                         <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight mt-0.5">{res.tipoVehiculo}</span>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className={`h-8 w-8 bg-transparent rounded-full border dark:border-slate-800 ${theme.button} hover:bg-white dark:hover:bg-slate-800/50`} onClick={() => clonarReserva(res)} title="Replicar Servicio">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-800/50/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-4xl bg-white dark:bg-slate-800/50 shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-white dark:bg-slate-800/50 px-6 py-4">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${getCategoryTheme(reservaSeleccionada.categoria).iconBox}`}>
                    <Briefcase className="h-5 w-5" />
                 </div>
                 <div>
                    <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Gestión de Reserva {reservaSeleccionada.op}</CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">Categoría: {reservaSeleccionada.categoria}</p>
                 </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMostrarDetalle(false)} className="rounded-full hover:bg-slate-100 dark:bg-slate-900 p-1.5 h-auto w-auto group dark:hover:bg-slate-800">
                <XCircle className="h-6 w-6 text-slate-500 group-hover:text-slate-900 dark:text-slate-100" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[80vh]">
              <div className="grid md:grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
                {/* Info Principal */}
                <div className="col-span-2 p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <section className="space-y-4">
                       <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-1">Logística de Carga & PAX</h4>
                       <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                             <div className="flex items-center text-slate-600 dark:text-slate-400">
                                <Users className="h-4 w-4 mr-2 text-blue-400" /> Cantidad Pasajeros
                             </div>
                             <span className="font-bold">{reservaSeleccionada.pasajeros.cantidad} PAX</span>
                          </div>
                          {reservaSeleccionada.pasajerosList && reservaSeleccionada.pasajerosList.length > 0 && (
                            <div className="bg-slate-100 dark:bg-slate-900/50 p-2 rounded max-h-[100px] overflow-y-auto">
                              {reservaSeleccionada.pasajerosList.map((p, i) => (
                                <div key={i} className="text-[10px] mb-1 pb-1 border-b dark:border-slate-800 last:border-0 last:mb-0 last:pb-0">
                                  <b>{p.nombre}</b> <span className="text-slate-500">({p.telefono})</span><br/>
                                  Ruta: {p.origen} → {p.destino}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex justify-between items-center text-sm">
                             <div className="flex items-center text-slate-600 dark:text-slate-400">
                                <Luggage className="h-4 w-4 mr-2 text-orange-400" /> Maletas Grandes (23K)
                             </div>
                             <span className="font-bold">{reservaSeleccionada.logistica.maletasGrandes}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                             <div className="flex items-center text-slate-600 dark:text-slate-400">
                                <Luggage className="h-4 w-4 mr-2 text-orange-300" /> Maletas Chicas (Cabina)
                             </div>
                             <span className="font-bold">{reservaSeleccionada.logistica.maletasChicas}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                             <div className="flex items-center text-slate-600 dark:text-slate-400">
                                <Baby className="h-4 w-4 mr-2 text-pink-400" /> Sillas / Alzador
                             </div>
                             <span className="font-bold text-[10px]">
    {[
      reservaSeleccionada.logistica.sillaBebe ? `Silla(${reservaSeleccionada.logistica.cantidadSillas})` : '',
      reservaSeleccionada.logistica.alzador ? `Alzador(${reservaSeleccionada.logistica.cantidadSillas})` : ''
    ].filter(Boolean).join(' | ') || 'NO'}
   </span>
                          </div>
                       </div>
                    </section>

                    <section className="space-y-4">
                       <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b pb-1">Hoja de Ruta (Tracking)</h4>
                       <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg space-y-3">
                          <div>
                             <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Origen Detallado</p>
                             <p className="text-sm font-medium">{reservaSeleccionada.lugares.origen}</p>
                             {reservaSeleccionada.lugares.numeroVuelo && (
                               <Badge className="mt-1 text-[9px] bg-blue-100 text-blue-700">Vuelo: {reservaSeleccionada.lugares.numeroVuelo}</Badge>
                             )}
                          </div>
                          <div>
                             <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Destino Final</p>
                             <p className="text-sm font-medium">{reservaSeleccionada.lugares.destino}</p>
                          </div>
                       </div>
                    </section>
                  </div>

                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest border-b pb-1">Instrucciones & Comentarios</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border dark:border-slate-800 border-blue-100 dark:text-slate-100">
                          <p className="text-[10px] text-blue-600 font-black uppercase mb-1">C1: Para el Conductor</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{reservaSeleccionada.comentarios.conductor}"</p>
                       </div>
                       <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border dark:border-slate-800 border-red-100 dark:border-red-900/30 dark:text-slate-100">
                          <p className="text-[10px] text-red-600 font-black uppercase mb-1">C2: Interno Administrativo</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{reservaSeleccionada.comentarios.interno}"</p>
                       </div>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Historial de Auditoría</h4>
                       <Info className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded divide-y divide-slate-200 dark:divide-slate-800">
                       {reservaSeleccionada.auditLogs.map((log, i) => (
                         <div key={i} className="py-2 flex justify-between text-[10px]">
                            <span className="font-bold text-slate-600 dark:text-slate-400">{log.quien} (Admin)</span>
                            <span className="text-slate-500 dark:text-slate-400">{log.accion} • {new Date(log.cuando).toLocaleString()}</span>
                         </div>
                       ))}
                    </div>
                  </section>
                </div>

                {/* Finanzas Panel */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 space-y-6">
                   <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-green-700 uppercase tracking-widest border-b pb-1">Cálculo Financiero Pulse</h4>
                      <div className="space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Monto Bruto:</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">${reservaSeleccionada.finanzas.montoBruto.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Gastos (Peajes/Estac):</span>
                            <span className="text-sm font-bold text-red-600">-${reservaSeleccionada.finanzas.gastosAdicionales.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center border-t pt-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400">Monto Base:</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">${(reservaSeleccionada.finanzas.montoBruto - reservaSeleccionada.finanzas.gastosAdicionales).toLocaleString()}</span>
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
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b pb-1">Estado Tributario</h4>
                      <div className="space-y-2">
                         <div className="p-3 border rounded-lg dark:border-slate-800 bg-white dark:bg-slate-800/50 space-y-2 dark:text-slate-100">
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-slate-500 dark:text-slate-400">Doc: {reservaSeleccionada.finanzas.tipoDocumento}</span>
                               <span className="font-bold">{reservaSeleccionada.finanzas.folioFactura || 'Sin Folio'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500 dark:text-slate-400">Pago:</span>
      <span className="font-bold underline decoration-blue-400">{reservaSeleccionada.finanzas.formaPago}</span>
   </div>
   <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500 dark:text-slate-400">Estado de Pago:</span>
      <span className={`font-bold ${reservaSeleccionada.finanzas.cobrado ? 'text-green-600' : 'text-orange-500'}`}>{reservaSeleccionada.finanzas.cobrado ? 'PAGADO' : 'PENDIENTE'}</span>
   </div>
   {reservaSeleccionada.finanzas.formaPago === 'Transferencia' && reservaSeleccionada.finanzas.fechaDeposito && (
      <div className="flex justify-between items-center text-xs">
         <span className="text-slate-500 dark:text-slate-400">Fecha Depósito:</span>
         <span className="font-bold">{reservaSeleccionada.finanzas.fechaDeposito}</span>
      </div>
   )}
                            <div className="flex justify-between items-center pt-2 border-t mt-2">
                               <label className="flex items-center text-xs font-bold gap-2">
                                  <input type="checkbox" checked={reservaSeleccionada.finanzas.cobrado} readOnly className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-green-600 focus:ring-green-500 dark:text-slate-100" />
                                  ¿COBRADO EN BANCO?
                                </label>
                                {reservaSeleccionada.finanzas.cobrado && (
                                   <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                            </div>
                         </div>
                         {reservaSeleccionada.archivosAdicionales && reservaSeleccionada.archivosAdicionales.length > 0 && (
      <div className="pt-2 border-t dark:border-slate-800 space-y-2">
         <span className="text-[9px] font-bold text-slate-500 uppercase">Documentos / Gastos Adjuntos</span>
         <div className="grid grid-cols-1 gap-1">
           {reservaSeleccionada.archivosAdicionales.map((arch, index) => (
              <a key={index} href={arch.url} target="_blank" rel="noopener noreferrer" className="text-[10px] flex items-center gap-1 text-blue-600 hover:underline">
                 <FileText className="h-3 w-3" /> {arch.nombre}
              </a>
           ))}
         </div>
      </div>
   )}
   <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-md">
                           <FileText className="h-4 w-4 mr-2" /> Emitir SII (Komer)
                         </Button>
                      </div>
                   </section>
                </div>
              </div>
            </CardContent>
            <div className="p-4 border-t bg-white dark:bg-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-3">
               <div className="flex flex-wrap gap-2">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 shadow-md" size="sm" onClick={() => handleCopiarReserva(reservaSeleccionada, 'pasajero')}>
                     <Copy className="h-4 w-4 mr-1.5" /> Pasajero
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 shadow-md" size="sm" onClick={() => handleCopiarReserva(reservaSeleccionada, 'chofer')}>
                     <Copy className="h-4 w-4 mr-1.5" /> Chofer
                  </Button>
               </div>
               <div className="flex gap-2 w-full md:w-auto">
                  <Button variant="outline" size="sm" className="bg-white dark:bg-slate-800/50 flex-1 md:flex-none" onClick={() => {
                      setFormReserva(reservaSeleccionada as any);
                      setMostrarDetalle(false);
                      setMostrarFormulario(true);
                  }}>Editar</Button>
                  <Button variant="outline" size="sm" className="bg-white dark:bg-slate-800/50 border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 flex-1 md:flex-none" onClick={() => {
                      if (window.confirm('¿Estás seguro de anular esta Reserva (OP)?')) {
                          handleActualizarEstado('cancelado');
                      }
                  }}>Anular OP</Button>
                  <Button onClick={() => {
                    if (reservaSeleccionada?.estado === 'pendiente' || reservaSeleccionada?.estado === 'confirmado' || reservaSeleccionada?.estado === 'en curso') {
                        if (window.confirm('¿Desea marcar esta OP como Finalizada?')) {
                            handleActualizarEstado('finalizado');
                        } else {
                            setMostrarDetalle(false);
                        }
                    } else {
                        setMostrarDetalle(false);
                    }
               }} className="bg-slate-900 text-white hover:bg-black dark:hover:bg-slate-800 flex-1 md:flex-none">Finalizar Revisión</Button>
               </div>
            </div>
          </Card>
        </div>
      )}

      {mostrarPanelCategorias && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 dark:bg-slate-800/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl overflow-hidden rounded-xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 bg-indigo-600 text-white px-5 py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Settings className="h-4 w-4" /> Gestionar Categorías
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setMostrarPanelCategorias(false)} className="text-white hover:bg-indigo-700/50 rounded-full h-8 w-8 p-0">
                <XCircle className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-2">
                 <input 
                   type="text" 
                   required 
                   className="flex-1 px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500" 
                   placeholder="Nueva Categoría" 
                   value={nuevaCategoriaForm}
                   onChange={e => setNuevaCategoriaForm(e.target.value)}
                 />
                 <Button type="button" onClick={() => {
                   if (nuevaCategoriaForm.trim() && !categoriasMaestras.includes(nuevaCategoriaForm.trim())) {
                     guardarCategorias([...categoriasMaestras, nuevaCategoriaForm.trim()]);
                     setNuevaCategoriaForm('');
                   }
                 }} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                   Agregar
                 </Button>
              </div>

              <div className="space-y-2 max-h-[30vh] overflow-y-auto mt-4 pr-1">
                {categoriasMaestras.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-4">No hay categorías. Agrega una nueva arriba.</div>
                ) : (
                  categoriasMaestras.map(cat => (
                    <div key={cat} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm font-medium border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-800 dark:text-slate-200">{cat}</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          guardarCategorias(categoriasMaestras.filter(c => c !== cat));
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <div className="p-4 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <Button onClick={() => setMostrarPanelCategorias(false)} variant="outline" className="w-full">
                Cerrar Panel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {mostrarCrearRuta && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 dark:bg-slate-800/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl overflow-hidden rounded-xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 bg-emerald-600 text-white px-5 py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <MapPin className="h-4 w-4" /> Crear Ruta Maestra
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setMostrarCrearRuta(false)} className="text-white hover:bg-emerald-700/50 rounded-full h-8 w-8 p-0">
                <XCircle className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
                <div>
                   <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Nombre de la Ruta</label>
                   <input 
                     type="text" placeholder="Ej: Stgo - Viña"
                     className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-900/50 dark:border-slate-800 font-bold dark:text-slate-100"
                     value={nuevaRutaForm.nombre}
                     onChange={(e) => setNuevaRutaForm({...nuevaRutaForm, nombre: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Origen</label>
                   <input 
                      type="text" placeholder="Hotel Hyatt, Santiago"
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-100"
                      value={nuevaRutaForm.origen}
                      onChange={(e) => setNuevaRutaForm({...nuevaRutaForm, origen: e.target.value})}
                   />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Destino</label>
                   <input 
                      type="text" placeholder="Aeropuerto AMB"
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-100"
                      value={nuevaRutaForm.destino}
                      onChange={(e) => setNuevaRutaForm({...nuevaRutaForm, destino: e.target.value})}
                   />
                </div>
                <div className="pt-2">
                   <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={async () => {
                      if (!nuevaRutaForm.nombre || !nuevaRutaForm.origen || !nuevaRutaForm.destino) return alert('Completa los campos');
                      const linkMap = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(nuevaRutaForm.origen)}&destination=${encodeURIComponent(nuevaRutaForm.destino)}`;
                      
                      const empresaIDToUse = activeCompanyId === 'GLOBAL' ? newEmpresaId : activeCompanyId;
                      const payload = {
                         empresa_id: empresaIDToUse || 1,
                         nombre: nuevaRutaForm.nombre,
                         origen: nuevaRutaForm.origen,
                         destino: nuevaRutaForm.destino,
                         distancia_km: 0,
                         tiempo_estimado_mins: 0
                      };
                      
                      const { error } = await supabase.from('operacion_ruta').insert([payload]);
                      if (!error) {
                         setRutasGuardadas([...rutasGuardadas, { id: Date.now().toString(), ...payload }]);
                         setMostrarCrearRuta(false);
                         setFormReserva({...formReserva, lugares: { ...formReserva.lugares, origen: nuevaRutaForm.origen, destino: nuevaRutaForm.destino }, enlaceMapa: linkMap as any});
                         setNuevaRutaForm({ nombre: '', origen: '', destino: '', enlaceMapa: '' });
                      } else { alert('Error al guardar la ruta.'); }
                   }}>
                     Guardar y Seleccionar
                   </Button>
                </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Formulario Nueva Reserva / Clonación */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-800/50/80 backdrop-blur-md p-4">
          <Card className="w-full max-w-4xl bg-white dark:bg-slate-800/50 shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-blue-600 text-white px-6 py-4">
              <div className="flex items-center gap-3">
                 <MapPin className="h-6 w-6" />
                 <CardTitle className="text-xl">Formulario de Reserva</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMostrarFormulario(false)} className="text-white hover:bg-blue-700 rounded-full">
                <XCircle className="h-6 w-6" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto max-h-[85vh]">
              <form onSubmit={handleCrearReserva} className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeCompanyId === 'GLOBAL' && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Empresa Operadora (Propietaria)</label>
                    <select 
                      value={newEmpresaId} 
                      onChange={(e) => setNewEmpresaId(e.target.value)} 
                      className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                    >
                      <option value="">Selecciona Empresa Operadora...</option>
                      {userCompanies.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Bloque 1: Cliente y Categoría */}
                <div className="p-6 grid md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-900/50">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Categoría de Reserva</label>
                      <button 
                        type="button" 
                        onClick={() => setMostrarPanelCategorias(true)} 
                        className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Settings className="w-3 h-3" />
                        Gestionar Categorías
                      </button>
                    </div>
                    <select 
                      className="w-full mt-2 px-3 py-2 border rounded-lg dark:border-slate-800 text-sm font-bold bg-white dark:bg-slate-800/50 dark:text-slate-100"
                      value={formReserva.categoria}
                      onChange={(e) => setFormReserva({ ...formReserva, categoria: e.target.value as any })}
                    >
                      <option value="">Seleccione Categoría...</option>
                      {categoriasMaestras.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Datos del Cliente Reservante</label>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <select 
                          className="flex-1 px-3 py-2 border rounded-lg dark:border-slate-800 text-sm font-bold bg-white dark:bg-slate-800/50 dark:text-slate-100"
                          value={(formReserva.cliente as any).tipoCliente || 'Particular'}
                          onChange={(e) => setFormReserva({...formReserva, cliente: {...formReserva.cliente, tipoCliente: e.target.value}})}
                        >
                           <option value="Particular">Particular</option>
                           <option value="Empresa / Convenio">Empresa / Convenio</option>
                           <option value="Agencia">Agencia</option>
                        </select>
                        {((formReserva.cliente as any).tipoCliente === 'Empresa / Convenio' || (formReserva.cliente as any).tipoCliente === 'Agencia') && (
                          <select
                            className="flex-1 px-3 py-2 border rounded-lg dark:border-slate-800 text-sm font-bold bg-white dark:bg-slate-800/50 dark:text-slate-100 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50"
                            value={(formReserva.cliente as any).contratoId || ''}
                            onChange={(e) => setFormReserva({...formReserva, cliente: {...formReserva.cliente, contratoId: e.target.value}})}
                          >
                            <option value="">Seleccione Contrato Maestro...</option>
                            {contratos.map(c => (
                              <option key={c.id} value={c.id}>{c.razonSocial}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative group">
                          <Users className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500" />
                          <input 
                            type="text" required placeholder="Nombre / Empresa Principal"
                            list="empresas-list"
                            className="w-full pl-10 pr-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                            value={formReserva.cliente.nombre}
                            onChange={(e) => setFormReserva({...formReserva, cliente: {...formReserva.cliente, nombre: e.target.value}})}
                          />
                          <datalist id="empresas-list">
                            {empresasConvenio.map((empresa, idx) => <option key={idx} value={empresa} />)}
                          </datalist>
                        </div>
                        <div className="relative group">
                           <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500 focus-within:text-blue-500" />
                           <input 
                              type="text" placeholder="Teléfono Pax (buscar...)"
                              list="telefonos-list"
                              className="w-full pl-10 pr-3 py-2 border rounded-lg dark:border-slate-800 text-sm font-bold bg-white dark:bg-slate-800/50 dark:text-slate-100"
                              value={formReserva.pasajeros.telefono}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                           />
                           <datalist id="telefonos-list">
                             {telefonosComunes.map((tel, idx) => <option key={idx} value={tel} />)}
                           </datalist>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative group">
                           <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500 focus-within:text-blue-500" />
                           <input 
                            type="email" placeholder="Email de Facturación (Opcional)"
                            className="w-full pl-10 pr-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                            value={formReserva.cliente.email}
                            onChange={(e) => setFormReserva({...formReserva, cliente: {...formReserva.cliente, email: e.target.value}})}
                          />
                        </div>
                        <input 
                          type="text" placeholder="RUT Empresa (Opcional)"
                          className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                          value={formReserva.cliente.rut_empresa}
                          onChange={(e) => setFormReserva({...formReserva, cliente: {...formReserva.cliente, rut_empresa: e.target.value}})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                                {/* Bloque 2 & 3: Pasajeros + Ruta (Left) and Horario + Logistica (Right) */}
                <div className="p-6 grid md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                   {/* Left Side: Pasajeros y Ruta */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                           <Users className="h-4 w-4 text-blue-500" /><MapPin className="h-4 w-4 text-emerald-500 -ml-1" /> DETALLES DEL PASAJERO (PAX) Y RUTA
                         </h3>
                         <button type="button" onClick={() => setMostrarCrearRuta(true)} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                           + Nueva Ruta Maestra
                         </button>
                      </div>

                      <div className="space-y-3">
                         <div className="flex justify-between items-center mb-2 px-1">
                           <span className="text-[10px] font-bold text-slate-500">Pasajeros Adicionales con Rutas</span>
                           <button 
                             type="button" 
                             onClick={() => setFormReserva({...formReserva, pasajerosList: [...formReserva.pasajerosList, {nombre: '', telefono: '', origen: '', destino: ''}]})}
                             className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"
                           >
                             + Agregar Pasajero
                           </button>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-3">
                            <input 
                               type="text" required placeholder="Nombre de quien viaja"
                               className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                               value={formReserva.pasajeros.nombre}
                               onChange={(e) => setFormReserva({...formReserva, pasajeros: {...formReserva.pasajeros, nombre: e.target.value}})}
                            />
                            <input 
                               type="text" placeholder="Teléfono"
                               className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                               value={formReserva.pasajeros.telefono}
                               onChange={(e) => setFormReserva({...formReserva, pasajeros: {...formReserva.pasajeros, telefono: e.target.value}})}
                            />
                         </div>
                         
                         <div className="grid grid-cols-2 gap-3">
                            <input 
                               type="text" required placeholder="Origen (ej: Hotel / Oficina)"
                               list="lugares-list"
                               className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                               value={formReserva.lugares.origen}
                               onChange={(e) => setFormReserva({...formReserva, lugares: {...formReserva.lugares, origen: e.target.value}})}
                            />
                            <input 
                               type="text" required placeholder="Destino Final"
                               list="lugares-list"
                               className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                               value={formReserva.lugares.destino}
                               onChange={(e) => setFormReserva({...formReserva, lugares: {...formReserva.lugares, destino: e.target.value}})}
                            />
                         </div>

                         <div className="grid grid-cols-2 gap-3">
                            <input 
                               type="text" placeholder="N° Vuelo (Tracking)"
                               className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                               value={formReserva.lugares.numeroVuelo}
                               onChange={(e) => setFormReserva({...formReserva, lugares: {...formReserva.lugares, numeroVuelo: e.target.value}})}
                            />
                            <div className="flex flex-col relative">
                               <span className="absolute -top-3 left-1 text-[10px] text-slate-500 font-bold bg-slate-50 dark:bg-slate-900/50 px-1">Numero de pasajeros</span>
                               <input 
                                  type="number" required min="1"
                                  className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-slate-100 dark:bg-slate-800 text-center dark:text-slate-100 font-bold"
                                  value={isNaN(formReserva.pasajeros.cantidad) ? '' : formReserva.pasajeros.cantidad}
                                  onChange={(e) => setFormReserva({...formReserva, pasajeros: {...formReserva.pasajeros, cantidad: parseInt(e.target.value) || 0}})}
                               />
                            </div>
                         </div>
                         
                         <div className="flex gap-2 relative items-center">
                            <div className="flex-1 relative">
                               <input 
                                  type="url" placeholder="Enlace Google Maps (Opc)"
                                  className="w-full pl-8 pr-2 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                                  value={(formReserva as any).enlaceMapa || ''}
                                  onChange={(e) => setFormReserva({...formReserva, enlaceMapa: e.target.value as any})}
                               />
                               <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-emerald-500" />
                            </div>
                            
                            {formReserva.lugares.origen && formReserva.lugares.destino && !(formReserva as any).enlaceMapa && (
                               <button
                                  type="button"
                                  title="Generar link de Maps"
                                  onClick={() => {
                                     const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(formReserva.lugares.origen)}&destination=${encodeURIComponent(formReserva.lugares.destino)}`;
                                     setFormReserva({...formReserva, enlaceMapa: url as any});
                                  }}
                                  className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-bold text-xs px-3 py-2 rounded md:rounded-lg hover:bg-emerald-200"
                               >
                                   Generar
                               </button>
                            )}
                            {(formReserva as any).enlaceMapa && (
                               <a 
                                  href={(formReserva as any).enlaceMapa} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-bold text-xs px-4 py-2 rounded-lg hover:bg-blue-200 flex items-center justify-center whitespace-nowrap shadow-sm"
                               >
                                   Abrir Ruta
                               </a>
                            )}
                         </div>

                         {formReserva.pasajerosList.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                               {formReserva.pasajerosList.map((p, idx) => (
                                 <div key={idx} className="bg-white dark:bg-slate-900/30 p-2 rounded border border-slate-100 dark:border-slate-800 mb-2 relative">
                                   <button type="button" onClick={() => {
                                     const list = [...formReserva.pasajerosList];
                                     list.splice(idx, 1);
                                     setFormReserva({...formReserva, pasajerosList: list});
                                   }} className="absolute top-1 right-1 text-red-500 hover:text-red-700">
                                     <XCircle className="h-4 w-4" />
                                   </button>
                                   <div className="grid grid-cols-2 gap-2 mb-2 pr-6">
                                     <input type="text" placeholder="Nombre" className="w-full px-2 py-1 text-xs border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={p.nombre} onChange={e => { const l = [...formReserva.pasajerosList]; l[idx].nombre = e.target.value; setFormReserva({...formReserva, pasajerosList: l}); }} />
                                     <input type="text" placeholder="Teléfono" className="w-full px-2 py-1 text-xs border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={p.telefono} onChange={e => { const l = [...formReserva.pasajerosList]; l[idx].telefono = e.target.value; setFormReserva({...formReserva, pasajerosList: l}); }} />
                                   </div>
                                   <div className="grid grid-cols-2 gap-2">
                                     <input type="text" placeholder="Origen" className="w-full px-2 py-1 text-xs border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={p.origen} onChange={e => { const l = [...formReserva.pasajerosList]; l[idx].origen = e.target.value; setFormReserva({...formReserva, pasajerosList: l}); }} />
                                     <input type="text" placeholder="Destino" className="w-full px-2 py-1 text-xs border rounded-md dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={p.destino} onChange={e => { const l = [...formReserva.pasajerosList]; l[idx].destino = e.target.value; setFormReserva({...formReserva, pasajerosList: l}); }} />
                                   </div>
                                 </div>
                               ))}
                            </div>
                         )}

                         <datalist id="lugares-list">
                           {lugaresComunes.map((l, idx) => <option key={idx} value={l} />)}
                         </datalist>
                      </div>
                   </div>

                   {/* Right Side: Día/Hora + Logistica */}
                   <div className="space-y-6">
                      <div className="space-y-4">
                         <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                           <CalendarIcon className="h-4 w-4 text-fuchsia-500" /> DÍA Y HORA DE RESERVA
                         </h3>
                         <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Fecha</span>
                               <input 
                                  type="date" required
                                  className="w-full px-2 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100 font-medium"
                                  value={formReserva.fecha}
                                  onChange={(e) => setFormReserva({...formReserva, fecha: e.target.value})}
                               />
                            </div>
                            <div className="col-span-2">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Hora Inicio</span>
                               <input 
                                  type="time" required
                                  className="w-full px-2 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100 font-medium"
                                  value={formReserva.horaInicio}
                                  onChange={(e) => setFormReserva({...formReserva, horaInicio: e.target.value})}
                               />
                            </div>
                         </div>
                         <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Vehículo</span>
                               <select 
                                  required className="w-full px-2 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100 font-medium"
                                  value={formReserva.tipoVehiculo}
                                  onChange={(e) => setFormReserva({...formReserva, tipoVehiculo: e.target.value as any})}
                               >
                                  <option value="SUV">SUV</option>
                                  <option value="Van">Van</option>
                                  <option value="Mini Bus">Mini Bus</option>
                                  <option value="Bus">Bus</option>
                                  <option value="Sedán">Sedán</option>
                                  <option value="Otros">Otros</option>
                               </select>
                            </div>
                            <div className="col-span-2">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Asignar Chofer</span>
                               <select 
                                  className="w-full px-2 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100 font-medium"
                                  value={formReserva.conductorId}
                                  onChange={(e) => setFormReserva({...formReserva, conductorId: e.target.value})}
                               >
                                  <option value="">Seleccione Conductor (Opcional)</option>
                                  {conductores.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre} ({c.estado})</option>
                                  ))}
                               </select>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                           <Luggage className="h-4 w-4 text-orange-500" /> LOGÍSTICA DE CARGA
                         </h3>
                         <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase text-center">Maletas G (23K)</span>
                               <input 
                                  type="number" required min="0"
                                  className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm text-center bg-white dark:bg-slate-800/50 dark:text-slate-100 font-bold"
                                  value={isNaN(formReserva.logistica.maletasGrandes) ? '' : formReserva.logistica.maletasGrandes}
                                  onChange={(e) => setFormReserva({...formReserva, logistica: {...formReserva.logistica, maletasGrandes: parseInt(e.target.value) || 0}})}
                               />
                            </div>
                            <div className="flex flex-col gap-1">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase text-center">Maletas Cabina</span>
                               <input 
                                  type="number" required min="0"
                                  className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm text-center bg-white dark:bg-slate-800/50 dark:text-slate-100 font-bold"
                                  value={isNaN(formReserva.logistica.maletasChicas) ? '' : formReserva.logistica.maletasChicas}
                                  onChange={(e) => setFormReserva({...formReserva, logistica: {...formReserva.logistica, maletasChicas: parseInt(e.target.value) || 0}})}
                               />
                            </div>
                            <div className="flex flex-col gap-1 pl-1">
                               <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase text-center mb-1">Silla Bebé / Alzador</span>
                               <div className="flex justify-between items-center px-1 mb-1 bg-white dark:bg-slate-900/50 rounded">
                                 <span className="text-[10px] text-slate-500 font-bold">Sillas:</span>
                                 <input 
                                   type="number" min="0" className="w-10 px-1 py-0.5 border rounded dark:border-slate-800 text-xs text-center dark:bg-slate-800/50 dark:text-slate-100"
                                   value={formReserva.logistica.cantidadSillas || ''}
                                   onChange={(e) => setFormReserva({...formReserva, logistica: {...formReserva.logistica, cantidadSillas: parseInt(e.target.value) || 0, sillaBebe: parseInt(e.target.value) > 0}})}
                                 />
                               </div>
                               <div className="flex justify-between items-center px-1 bg-white dark:bg-slate-900/50 rounded">
                                 <span className="text-[10px] text-slate-500 font-bold">Alzador:</span>
                                 <input 
                                   type="number" min="0" className="w-10 px-1 py-0.5 border rounded dark:border-slate-800 text-xs text-center dark:bg-slate-800/50 dark:text-slate-100"
                                   value={(formReserva.logistica as any).cantidadAlzadores || ''}
                                   onChange={(e) => setFormReserva({...formReserva, logistica: {...formReserva.logistica, cantidadAlzadores: parseInt(e.target.value) || 0, alzador: parseInt(e.target.value) > 0}})}
                                 />
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

{/* Bloque 4: Finanzas y Cobranza */}
                <div className="p-6 grid md:grid-cols-2 gap-8 bg-green-50/50 dark:bg-green-900/10">
                   <div className="space-y-4">
                      <h3 className="text-xs font-black text-green-700 dark:text-green-500 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> GESTIÓN DE COBROS Y TRIBUTARIA
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Monto Bruto</span>
                            <input 
                               type="number" required placeholder="$ Total Pactado"
                               className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 font-bold dark:text-slate-100"
                               value={isNaN(formReserva.finanzas.montoBruto) ? '' : formReserva.finanzas.montoBruto}
                               onChange={(e) => setFormReserva({...formReserva, finanzas: {...formReserva.finanzas, montoBruto: parseInt(e.target.value) || 0}})}
                            />
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Gts. Adic. (Peajes/Estac)</span>
                            <input 
                               type="number" required placeholder="$ Gastos"
                               className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
                               value={isNaN(formReserva.finanzas.gastosAdicionales) ? '' : formReserva.finanzas.gastosAdicionales}
                               onChange={(e) => setFormReserva({...formReserva, finanzas: {...formReserva.finanzas, gastosAdicionales: parseInt(e.target.value) || 0}})}
                            />
                         </div>
                         <div className="col-span-2 grid grid-cols-2 gap-3">
    <div className="flex flex-col gap-1">
      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Forma de Pago</span>
      <select 
          required className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
          value={formReserva.finanzas.formaPago}
          onChange={(e) => setFormReserva({...formReserva, finanzas: {...formReserva.finanzas, formaPago: e.target.value as any}})}
      >
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Webpay">Webpay</option>
          <option value="Link de Pago">Link de Pago</option>
          <option value="Convenio PF">Convenio PF</option>
          <option value="Tarjeta">Tarjeta</option>
      </select>
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Tipo Documento</span>
      <select 
          required className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
          value={formReserva.finanzas.tipoDocumento}
          onChange={(e) => setFormReserva({...formReserva, finanzas: {...formReserva.finanzas, tipoDocumento: e.target.value as any}})}
      >
          <option value="Boleta">Boleta</option>
          <option value="Factura">Factura</option>
      </select>
    </div>
    {formReserva.finanzas.formaPago === 'Transferencia' && (
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Fecha de Depósito</span>
        <input 
          type="date"
          className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
          value={formReserva.finanzas.fechaDeposito || ''}
          onChange={(e) => setFormReserva({...formReserva, finanzas: {...formReserva.finanzas, fechaDeposito: e.target.value}})}
        />
      </div>
    )}
    <div className="flex flex-col gap-1 col-span-2">
      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Archivos Adjuntos (Fotos, PDF)</span>
      <input 
        type="file" multiple
        className="w-full px-3 py-2 border rounded-lg dark:border-slate-800 text-sm bg-white dark:bg-slate-800/50 dark:text-slate-100"
        onChange={(e) => {
          if (e.target.files) {
            const newFiles = Array.from(e.target.files).map((f: File) => ({
              nombre: f.name,
              url: URL.createObjectURL(f),
              tipo: (f.type.includes('image') ? 'Imagen' : 'Documento') as 'Imagen'|'Documento'|'Otro'
            }));
            setFormReserva({...formReserva, archivosAdicionales: [...(formReserva.archivosAdicionales || []), ...newFiles]});
          }
        }}
      />
      {formReserva.archivosAdicionales && formReserva.archivosAdicionales.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {formReserva.archivosAdicionales.map((arch, index) => (
            <div key={index} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs flex items-center gap-2">
              <span className="truncate max-w-[150px]">{arch.nombre}</span>
              <button 
                type="button"
                className="text-red-500"
                onClick={() => {
                  const arr = [...formReserva.archivosAdicionales!];
                  arr.splice(index, 1);
                  setFormReserva({...formReserva, archivosAdicionales: arr});
                }}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-xs font-black text-orange-700 dark:text-orange-500 flex items-center gap-2">
                        <Info className="h-4 w-4" /> COMENTARIOS DUALES
                      </h3>
                      <div className="grid gap-3">
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">C1: Comentario Conductor</span>
                            <textarea 
                               className="w-full px-3 py-1.5 border rounded-lg dark:border-slate-800 text-xs h-12 bg-white dark:bg-slate-800/50 dark:text-slate-100"
                               placeholder="Instrucciones de recojo, cartel, ruta..."
                               value={formReserva.comentarios.conductor}
                               onChange={(e) => setFormReserva({...formReserva, comentarios: {...formReserva.comentarios, conductor: e.target.value}})}
                            />
                         </div>
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-red-600 dark:text-red-500 font-bold uppercase">C2: Comentario Interno (Privado)</span>
                            <textarea 
                               className="w-full px-3 py-1.5 border rounded-lg dark:border-slate-800 text-xs h-12 bg-white dark:bg-slate-800/50 border-red-100 dark:border-red-900/30 dark:text-slate-100"
                               placeholder="Notas de cobro, colaciones, depósitos..."
                               value={formReserva.comentarios.interno}
                               onChange={(e) => setFormReserva({...formReserva, comentarios: {...formReserva.comentarios, interno: e.target.value}})}
                            />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4">
                   <div className="flex flex-col">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Cálculo de Neto Automático Pulse™</span>
                      <div className="flex items-center gap-3">
                         <div className="text-slate-400 dark:text-slate-500 font-bold flex flex-col">
                            <span className="text-[10px]">Bruto - Gastos</span>
                            <span className="text-sm">${(formReserva.finanzas.montoBruto - formReserva.finanzas.gastosAdicionales).toLocaleString()}</span>
                         </div>
                         <div className="text-slate-300">X</div>
                         <div className="text-blue-500 font-bold flex flex-col">
                            <span className="text-[10px]">Util. ({100 - formReserva.finanzas.porcentajeComision}%)</span>
                            <span className="text-sm">${calcularNeto(formReserva.finanzas.montoBruto, formReserva.finanzas.gastosAdicionales, formReserva.finanzas.porcentajeComision).toLocaleString()}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-3 w-full md:w-auto">
                      <Button type="button" variant="outline" onClick={() => {
                         setFormReserva(initialFormState);
                         setMostrarFormulario(false);
                         localStorage.removeItem('formReservaDraft');
                      }} className="flex-1 md:flex-none">Descartar</Button>
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
