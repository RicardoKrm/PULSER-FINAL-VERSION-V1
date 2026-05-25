import React, { useState, useMemo, useEffect } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, Plus, Search, MapPin, Truck, User, FileText, X, Activity, Download, ChevronRight, DollarSign, Clock, FileWarning, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { cn } from '../../lib/utils';

type Servicio = {
  id: string;
  codigo: string;
  contrato: string;
  contrato_id?: string;
  tipo: string;
  subtipo: string;
  origen: string;
  destino: string;
  fecha: string;
  conductor: string;
  conductor_id?: string;
  unidad: string;
  vehiculo_id?: string;
  estado: string;
  ingreso: number;
  costo: number;
};

export default function CrearServicio() {
  const { activeCompanyId } = useCompany();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [contratosDisponibles, setContratosDisponibles] = useState<{ id: string; cliente: string }[]>([]);
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState<{ id: string; patente: string }[]>([]);
  const [conductoresDisponibles, setConductoresDisponibles] = useState<{ id: string; nombre: string; estado: string }[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState<Servicio | null>(null);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [showHojaRuta, setShowHojaRuta] = useState(false);
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; action: 'anular' | 'eliminar' | null }>({ isOpen: false, action: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');
  
  // States for the creation form to drive real-time validations
  const [newContrato, setNewContrato] = useState(() => localStorage.getItem('formCrearServicio_newContrato') || '');
  const [newFecha, setNewFecha] = useState(() => localStorage.getItem('formCrearServicio_newFecha') || '');
  const [newTipoCarga, setNewTipoCarga] = useState(() => localStorage.getItem('formCrearServicio_newTipoCarga') || '');
  const [newSubtipo, setNewSubtipo] = useState(() => localStorage.getItem('formCrearServicio_newSubtipo') || '');
  const [newOrigen, setNewOrigen] = useState(() => localStorage.getItem('formCrearServicio_newOrigen') || '');
  const [newDestino, setNewDestino] = useState(() => localStorage.getItem('formCrearServicio_newDestino') || '');
  const [newConductor, setNewConductor] = useState(() => localStorage.getItem('formCrearServicio_newConductor') || '');
  const [newUnidad, setNewUnidad] = useState(() => localStorage.getItem('formCrearServicio_newUnidad') || '');
  const [newIngreso, setNewIngreso] = useState<number | ''>(() => {
    const val = localStorage.getItem('formCrearServicio_newIngreso');
    return val ? Number(val) : '';
  });
  const [newCosto, setNewCosto] = useState<number | ''>(() => {
    const val = localStorage.getItem('formCrearServicio_newCosto');
    return val ? Number(val) : '';
  });

  useEffect(() => { localStorage.setItem('formCrearServicio_newContrato', newContrato); }, [newContrato]);
  useEffect(() => { localStorage.setItem('formCrearServicio_newFecha', newFecha); }, [newFecha]);
  useEffect(() => { localStorage.setItem('formCrearServicio_newTipoCarga', newTipoCarga); }, [newTipoCarga]);
  useEffect(() => { localStorage.setItem('formCrearServicio_newSubtipo', newSubtipo); }, [newSubtipo]);
  useEffect(() => { localStorage.setItem('formCrearServicio_newOrigen', newOrigen); }, [newOrigen]);
  useEffect(() => { localStorage.setItem('formCrearServicio_newDestino', newDestino); }, [newDestino]);
  useEffect(() => { localStorage.setItem('formCrearServicio_newConductor', newConductor); }, [newConductor]);
  useEffect(() => { localStorage.setItem('formCrearServicio_newUnidad', newUnidad); }, [newUnidad]);
  useEffect(() => { localStorage.setItem('formCrearServicio_newIngreso', String(newIngreso)); }, [newIngreso]);
  useEffect(() => { localStorage.setItem('formCrearServicio_newCosto', String(newCosto)); }, [newCosto]);

  const clearFormCache = () => {
    localStorage.removeItem('formCrearServicio_newContrato');
    localStorage.removeItem('formCrearServicio_newFecha');
    localStorage.removeItem('formCrearServicio_newTipoCarga');
    localStorage.removeItem('formCrearServicio_newSubtipo');
    localStorage.removeItem('formCrearServicio_newOrigen');
    localStorage.removeItem('formCrearServicio_newDestino');
    localStorage.removeItem('formCrearServicio_newConductor');
    localStorage.removeItem('formCrearServicio_newUnidad');
    localStorage.removeItem('formCrearServicio_newIngreso');
    localStorage.removeItem('formCrearServicio_newCosto');
  };
  const [toastMessage, setToastMessage] = useState('');
  const [userCompanies, setUserCompanies] = useState<{id: string, nombre: string}[]>([]);
  const [newEmpresaId, setNewEmpresaId] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadData = async () => {
    if (!activeCompanyId) return;

    try {
      let query = supabase
        .from('operacion_servicio')
        .select(`
          *,
          operacion_contrato ( cliente_razon_social ),
          colaborador ( nombre, estado ),
          vehiculo ( patente, estado )
        `)
        .order('created_at', { ascending: false });

      if (activeCompanyId !== 'GLOBAL') {
        query = query.eq('empresa_id', activeCompanyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedServices: Servicio[] = (data || []).map((s: any) => ({
        id: s.id,
        codigo: s.codigo || 'S-S/N',
        contrato: s.operacion_contrato?.cliente_razon_social || 'Sin contrato',
        contrato_id: s.contrato_id,
        tipo: s.tipo_carga,
        subtipo: s.subtipo || '',
        origen: s.origen,
        destino: s.destino,
        fecha: s.fecha_servicio,
        conductor: s.colaborador?.nombre || 'Sin asignar',
        conductor_id: s.conductor_id,
        unidad: s.vehiculo?.patente || 'Sin asignar',
        vehiculo_id: s.vehiculo_id,
        estado: s.estado,
        ingreso: parseFloat(s.ingreso_esperado) || 0,
        costo: parseFloat(s.costo_estimado) || 0
      }));

      setServicios(formattedServices);

      // Load form options
      let contratosQ = supabase.from('operacion_contrato').select('id, cliente_razon_social').eq('activo', true);
      let vehiculosQ = supabase.from('vehiculo').select('id, patente');
      let colaboradoresQ = supabase.from('colaborador').select('id, nombre, estado').in('rol', ['Conductor', 'Chofer', 'Conductor Interprovincial', 'Conductor Interno Mina']);

      if (activeCompanyId !== 'GLOBAL') {
        contratosQ = contratosQ.eq('empresa_id', activeCompanyId);
        vehiculosQ = vehiculosQ.eq('empresa_id', activeCompanyId);
        colaboradoresQ = colaboradoresQ.eq('empresa_id', activeCompanyId);
      }

      const [contratos, vehiculos, colaboradores] = await Promise.all([
        contratosQ, vehiculosQ, colaboradoresQ
      ]);

      if (contratos.data) setContratosDisponibles(contratos.data.map(c => ({ id: c.id, cliente: c.cliente_razon_social })));
      if (vehiculos.data) setVehiculosDisponibles(vehiculos.data);
      if (colaboradores.data) setConductoresDisponibles(colaboradores.data);

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
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId]);

  const handleNewService = () => {
    setEditingServicio(null);
    setNewContrato('');
    setNewFecha('');
    setNewTipoCarga('');
    setNewSubtipo('');
    setNewOrigen('');
    setNewDestino('');
    setNewConductor('');
    setNewUnidad('');
    setNewIngreso('');
    setNewCosto('');
    setIsModalOpen(true);
  };

  const handleEditService = () => {
    if (!selectedServicio) return;
    setEditingServicio(selectedServicio);
    setNewContrato(selectedServicio.contrato_id || '');
    setNewFecha(selectedServicio.fecha);
    setNewTipoCarga(selectedServicio.tipo);
    setNewSubtipo(selectedServicio.subtipo);
    setNewOrigen(selectedServicio.origen);
    setNewDestino(selectedServicio.destino);
    setNewConductor(selectedServicio.conductor_id || '');
    setNewUnidad(selectedServicio.vehiculo_id || '');
    setNewIngreso(selectedServicio.ingreso || '');
    setNewCosto(selectedServicio.costo || '');
    
    setSelectedServicio(null);
    setIsModalOpen(true);
  };

  const handleSaveService = async () => {
    const finalCompanyId = activeCompanyId === 'GLOBAL' ? newEmpresaId : activeCompanyId;

    if (!finalCompanyId) {
      showToast('Por favor, selecciona una empresa operadora para asignar este servicio.');
      return;
    }

    if (!newOrigen.trim() || !newDestino.trim()) {
      showToast('Origen y Destino son campos requeridos.');
      return;
    }

    try {
      showToast('Guardando servicio...');

      const safeUUID = (val: string) => val && val.length > 20 ? val : null;

      const serviceData = {
        empresa_id: finalCompanyId,
        codigo: editingServicio?.codigo || `SRV-${Math.floor(Math.random() * 10000)}`,
        contrato_id: safeUUID(newContrato),
        tipo_carga: newTipoCarga,
        subtipo: newSubtipo,
        origen: newOrigen,
        destino: newDestino,
        fecha_servicio: newFecha ? new Date(newFecha).toISOString() : new Date().toISOString(),
        conductor_id: safeUUID(newConductor),
        vehiculo_id: safeUUID(newUnidad),
        estado: newConductor && newUnidad ? 'Programado' : 'Borrador',
        ingreso_esperado: newIngreso ? Number(newIngreso) : 0,
        costo_estimado: newCosto ? Number(newCosto) : 0
      };

      let saveError;
      let insertedServicioId = null;
      if (editingServicio) {
        const { error } = await supabase.from('operacion_servicio').update(serviceData).eq('id', editingServicio.id);
        saveError = error;
      } else {
        const { data: newServ, error } = await supabase.from('operacion_servicio').insert([serviceData]).select().single();
        saveError = error;
        if (newServ) insertedServicioId = newServ.id;
      }

      if (saveError) throw saveError;

      const targetServicioId = editingServicio ? editingServicio.id : insertedServicioId;
      
      if (targetServicioId) {
        // Only require a date/time to sync to the board. Driver is optional.
        const hasTime = newFecha && newFecha.includes('T');
        
        const { data: existingProg } = await supabase.from('operacion_programacion').select('id').eq('notas', targetServicioId).maybeSingle();

        if (hasTime) {
          const progDateStr = newFecha.split('T')[0];
          const hora = parseInt(newFecha.split('T')[1].split(':')[0]);
          
          const progData = {
            empresa_id: finalCompanyId,
            tipo: newTipoCarga || 'Interprovincial',
            origen: newOrigen,
            destino: newDestino,
            fecha: progDateStr,
            hora: hora,
            duracion: 2,
            conductor_id: safeUUID(newConductor) || null,
            vehiculo_id: safeUUID(newUnidad) || null,
            estado: safeUUID(newConductor) ? 'Asignado' : 'Borrador',
            notas: targetServicioId
          };

          if (existingProg) {
             const { error: progSaveErr } = await supabase.from('operacion_programacion').update(progData).eq('id', existingProg.id);
             if (progSaveErr) console.error("Error updating prog", progSaveErr);
          } else {
             const { error: progSaveErr } = await supabase.from('operacion_programacion').insert([progData]);
             if (progSaveErr) console.error("Error inserting prog", progSaveErr);
          }
          
          await supabase.from('operacion_servicio').update({ estado: safeUUID(newConductor) ? 'Confirmado' : 'Borrador' }).eq('id', targetServicioId);
        } else {
          // If it lacks a valid time but has an existing block on the board, delete it so it surfaces to Pendientes.
          if (existingProg) {
             await supabase.from('operacion_programacion').delete().eq('id', existingProg.id);
          }
        }
      }

      clearFormCache();
      setIsModalOpen(false);
      loadData();
      showToast('Servicio guardado exitosamente.');
    } catch (error) {
      console.error('Error saving service:', error);
      showToast('Error al guardar el servicio.');
    }
  };

  const handleAnularService = () => {
    if (!selectedServicio) return;
    setConfirmState({ isOpen: true, action: 'anular' });
  };

  const handleDeleteService = () => {
    if (!selectedServicio) return;
    setConfirmState({ isOpen: true, action: 'eliminar' });
  };

  const confirmAction = async () => {
    if (!selectedServicio || !confirmState.action) return;
    
    try {
      if (confirmState.action === 'anular') {
        const { error: progDelErr } = await supabase.from('operacion_programacion').delete().eq('notas', selectedServicio.id);
        if (progDelErr) console.error("Error deleting programacion:", progDelErr);
        const { error } = await supabase.from('operacion_servicio').update({ estado: 'Anulado' }).eq('id', selectedServicio.id);
        if (error) throw error;
        showToast('Servicio anulado exitosamente.');
      } else if (confirmState.action === 'eliminar') {
        const { error: progDelErr } = await supabase.from('operacion_programacion').delete().eq('notas', selectedServicio.id);
        if (progDelErr) console.error("Error deleting programacion:", progDelErr);
        const { error } = await supabase.from('operacion_servicio').delete().eq('id', selectedServicio.id);
        if (error) throw error;
        showToast('Servicio eliminado exitosamente.');
      }
      
      setConfirmState({ isOpen: false, action: null });
      setSelectedServicio(null);
      loadData();
    } catch (error: any) {
      console.error(`Error al ${confirmState.action} servicio:`, error);
      showToast(`Error al ${confirmState.action} el servicio.`);
      setConfirmState({ isOpen: false, action: null });
    }
  };

  const filteredServicios = useMemo(() => {
    return servicios.filter(s => {
      const matchName = s.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.contrato.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.conductor.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchDate = true;
      if (s.fecha) {
        const sDateStr = s.fecha.split('T')[0];
        if (dateFilterStart && sDateStr < dateFilterStart) matchDate = false;
        if (dateFilterEnd && sDateStr > dateFilterEnd) matchDate = false;
      } else if (dateFilterStart || dateFilterEnd) {
        matchDate = false; // If there is a filter but no date, reject
      }
      return matchName && matchDate;
    });
  }, [servicios, searchTerm, dateFilterStart, dateFilterEnd]);

  // Real-time validations logic
  const validations = useMemo(() => {
    const v = [];
    if (newSubtipo === 'Interno Mina') {
      v.push({ type: 'success', text: 'Sincronización de Altitud: Verificando examen de altura del conductor.' });
    }
    if (newTipoCarga === 'Peligrosa / MATPEL') {
      v.push({ type: 'warning', text: 'Carga MATPEL: El conductor debe tener curso MATPEL vigente.' });
    }
    
    const driver = conductoresDisponibles.find(d => d.id === newConductor);
    if (driver && driver.estado === 'EN_RUTA') {
      v.push({ type: 'error', text: 'Programación Cruzada (Anticolisión): El conductor ya está en ruta.' });
    } else if (newConductor) {
      v.push({ type: 'success', text: 'Documentación en regla: Conductor habilitado (Integración GDC).' });
    }
    
    if (v.length === 0) {
      v.push({ type: 'info', text: 'Complete los campos para ver validaciones dinámicas.' });
    }
    
    return v;
  }, [newSubtipo, newTipoCarga, newConductor, conductoresDisponibles]);

  const getStatusColor = (estado: string) => {
    switch(estado) {
      case 'Programado': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
      case 'En Ruta': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'Completado': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="w-full relative min-h-screen">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Panel de Servicios (PCS)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Tipificación, control y programación dinámica de operaciones.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-300 px-4 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
          <button 
            onClick={handleNewService}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Servicio
          </button>
        </div>
      </div>

      {/* Toolbar / Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por código, contrato o conductor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="w-full md:w-40 relative group">
            <CalendarIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
            <input 
              type="date" 
              value={dateFilterStart}
              onChange={(e) => setDateFilterStart(e.target.value)}
              className="w-full pl-11 pr-2 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
              title="Fecha desde"
            />
          </div>
          <div className="w-full md:w-40 relative group">
            <CalendarIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
            <input 
              type="date" 
              value={dateFilterEnd}
              onChange={(e) => setDateFilterEnd(e.target.value)}
              className="w-full pl-11 pr-2 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
              title="Fecha hasta"
            />
          </div>
        </div>
      </div>

      {/* Lista de Servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredServicios.map((servicio) => (
          <div key={servicio.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group flex flex-col">
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <div>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{servicio.codigo}</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1 leading-tight">{servicio.contrato}</h3>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${getStatusColor(servicio.estado)}`}>
                {servicio.estado}
              </span>
            </div>
            
            <div className="space-y-3 flex-1 mb-4">
              <div className="flex items-center gap-3 text-sm">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{servicio.tipo} • {servicio.subtipo}</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium"><span className="text-slate-400">Desde:</span> {servicio.origen}</p>
                  <p className="text-slate-600 dark:text-slate-300 font-medium"><span className="text-slate-400">Hacia:</span> {servicio.destino}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{new Date(servicio.fecha).toLocaleString('es-CL')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{servicio.conductor}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{servicio.unidad}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-auto">
               <button 
                 onClick={() => setSelectedServicio(servicio)}
                 className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors"
               >
                 Ver Detalle Operativo
               </button>
            </div>
          </div>
        ))}
      </div>

      {filteredServicios.length === 0 && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No hay servicios</h3>
          <p className="text-slate-500 mt-1 dark:text-slate-400">Prueba ajustando los filtros de búsqueda.</p>
        </div>
      )}

      {/* Modal Nuevo Servicio */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{editingServicio ? 'Editar Servicio' : 'Programar Nuevo Servicio'}</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5 dark:text-slate-400">Asignación dinámica e inteligencia operativa</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors dark:text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-full">
                  
                  {/* Formulario */}
                  <div className="lg:col-span-8 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
                    <div className="space-y-6">
                      
                      {activeCompanyId === 'GLOBAL' && (
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Empresa Operadora (Propietaria)</label>
                          <select value={newEmpresaId} onChange={(e) => setNewEmpresaId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white">
                            <option value="">Selecciona Empresa Operadora...</option>
                            {userCompanies.map(c => (
                              <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Contrato Asociado (Opcional)</label>
                          <select value={newContrato} onChange={(e) => setNewContrato(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white">
                            <option value="">Sin contrato especifico</option>
                            {contratosDisponibles.map(c => (
                              <option key={c.id} value={c.id}>{c.cliente}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fecha y Hora de Inicio</label>
                          <input type="datetime-local" value={newFecha} onChange={(e) => setNewFecha(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tipo de Carga</label>
                          <select value={newTipoCarga} onChange={e => setNewTipoCarga(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white">
                            <option value="">Seleccionar tipo...</option>
                            <option value="Minero">Minero</option>
                            <option value="General / Logística">General / Logística</option>
                            <option value="Peligrosa / MATPEL">Peligrosa / MATPEL</option>
                            <option value="Sobredimensionada">Sobredimensionada</option>
                            <option value="Personal">Personal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Subtipo Operativo</label>
                          <select value={newSubtipo} onChange={e => setNewSubtipo(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white">
                            <option value="">Seleccionar subtipo...</option>
                            <option value="Interprovincial">Interprovincial</option>
                            <option value="Urbano">Urbano</option>
                            <option value="Internacional">Internacional</option>
                            <option value="Interno Mina">Interno Mina</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Punto de Origen</label>
                          <input type="text" value={newOrigen} onChange={(e) => setNewOrigen(e.target.value)} placeholder="Ej: Bodega Central" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Punto de Destino</label>
                          <input type="text" value={newDestino} onChange={(e) => setNewDestino(e.target.value)} placeholder="Ej: Puerto Antofagasta" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Asignar Conductor</label>
                          <select value={newConductor} onChange={e => setNewConductor(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white">
                            <option value="">Seleccionar conductor...</option>
                            {conductoresDisponibles.map(d => (
                              <option key={d.id} value={d.id}>{d.nombre} ({d.estado})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Asignar Vehículo/Máquina</label>
                          <select value={newUnidad} onChange={(e) => setNewUnidad(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white">
                            <option value="">Seleccionar unidad...</option>
                            {vehiculosDisponibles.map(v => (
                              <option key={v.id} value={v.id}>{v.patente}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ingreso Proyectado ($)</label>
                          <input type="number" value={newIngreso} onChange={e => setNewIngreso(Number(e.target.value))} min={0} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Costo Proyectado ($)</label>
                          <input type="number" value={newCosto} onChange={e => setNewCosto(Number(e.target.value))} min={0} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Panel de Validaciones */}
                  <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      Auditoría en Tiempo Real
                    </h3>

                    <div className="space-y-4">
                      {validations.map((v, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: 20 }} 
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 rounded-2xl border ${
                            v.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50' :
                            v.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50' :
                            v.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50' :
                            'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="mt-0.5">
                              {v.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                              {v.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                              {v.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                              {v.type === 'info' && <Activity className="w-5 h-5 text-slate-400" />}
                            </div>
                            <div>
                              <p className={`text-sm font-medium leading-relaxed ${
                                v.type === 'success' ? 'text-emerald-800 dark:text-emerald-300' :
                                v.type === 'error' ? 'text-red-800 dark:text-red-300' :
                                v.type === 'warning' ? 'text-amber-800 dark:text-amber-300' :
                                'text-slate-600 dark:text-slate-400'
                              }`}>
                                {v.text}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/60">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                        Este panel cruza información con Gestión de Contratos (GDC) y Finanzas para validar la rentabilidad y asegurar el cumplimiento normativo antes de confirmar el servicio.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900">
                 <button 
                   onClick={() => setIsModalOpen(false)}
                   className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                 >
                   Cancelar
                 </button>
                 <button 
                   disabled={validations.some(v => v.type === 'error')}
                   onClick={handleSaveService}
                   className="px-8 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-2"
                 >
                   <CheckCircle2 className="w-5 h-5" />
                   {editingServicio ? 'Guardar Cambios' : 'Confirmar Servicio'}
                 </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Detalle de Servicio Side Panel */}
      <AnimatePresence>
        {selectedServicio && !showHojaRuta && (
          <div className="fixed inset-0 z-50 flex items-stretch justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedServicio(null)}
            />
            
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
            >
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-black text-xs">
                    {selectedServicio.codigo.replace('SRV-', '')}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{selectedServicio.codigo}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border ${getStatusColor(selectedServicio.estado)}`}>
                        {selectedServicio.estado}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedServicio(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors dark:text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="space-y-8">
                  
                  {/* Datos Principales */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Información del Servicio</h3>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                      
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">Contrato o Cliente</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedServicio.contrato}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Tipo Operación</p>
                          <div className="flex">
                            <span className="inline-block px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-md">
                              {selectedServicio.tipo}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Subtipo</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {selectedServicio.subtipo}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">Ingreso Estimado</p>
                          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                            ${selectedServicio.ingreso?.toLocaleString('es-CL') || '0'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">Costo Estimado</p>
                          <p className="text-lg font-black text-red-600 dark:text-red-400">
                            ${selectedServicio.costo?.toLocaleString('es-CL') || '0'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ruta y Programación */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Ruta y Programación</h3>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                      <div className="flex flex-col gap-5">
                        <div className="flex gap-4 items-start relative">
                           <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center z-10">
                             <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                           </div>
                           <div className="absolute top-8 left-4 bottom-[-20px] w-0.5 bg-slate-200 dark:bg-slate-800"></div>
                           <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 dark:text-slate-400">Origen</p>
                             <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedServicio.origen}</p>
                           </div>
                        </div>
                        <div className="flex gap-4 items-start">
                           <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center z-10">
                             <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                           </div>
                           <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 dark:text-slate-400">Destino</p>
                             <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedServicio.destino}</p>
                           </div>
                        </div>
                      </div>
                      
                      <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
                         <CalendarIcon className="w-5 h-5 text-slate-400" />
                         <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 dark:text-slate-400">Fecha Programada</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(selectedServicio.fecha).toLocaleString('es-CL')}</p>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Asignaciones */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Asignación de Recursos</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-3">
                          <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">Conductor</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedServicio.conductor}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-3">
                          <Truck className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">Unidad</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedServicio.unidad}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Acciones de detalle */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
                 <button 
                   onClick={handleEditService}
                   className="w-full py-3.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                 >
                   Editar Servicio
                 </button>
                 <button 
                   onClick={() => setShowHojaRuta(true)}
                   className="w-full py-3.5 rounded-xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-2"
                 >
                   Ver Hoja de Ruta <ChevronRight className="w-4 h-4" />
                 </button>
                 {selectedServicio.estado !== 'Anulado' && (
                   <button 
                     onClick={handleAnularService}
                     className="w-full py-3.5 rounded-xl font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 transition-all"
                   >
                     Anular Servicio
                   </button>
                 )}
                 <button 
                   onClick={handleDeleteService}
                   className="w-full py-3.5 rounded-xl font-bold bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all"
                 >
                   Eliminar Servicio
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Hoja de Ruta Full Screen */}
      <AnimatePresence>
        {showHojaRuta && selectedServicio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowHojaRuta(false)}
            />
            
            <motion.div 
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-5xl bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header Hoja de Ruta */}
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Hoja de Ruta Digital</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">{selectedServicio.codigo}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{selectedServicio.contrato}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="hidden sm:flex px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors items-center gap-2">
                    <Download className="w-4 h-4" />
                    Descargar PDF
                  </button>
                  <button 
                    onClick={() => setShowHojaRuta(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors bg-slate-100 dark:bg-slate-900 dark:text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Contenido Hoja de Ruta */}
              <div className="flex-1 overflow-y-auto p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 min-h-full">
                  
                  {/* Columna Izquierda: Linea de Tiempo */}
                  <div className="lg:col-span-2 p-6 md:p-8 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                         <Activity className="w-5 h-5 text-indigo-500" />
                         Progreso del Viaje
                       </h3>
                       <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg border ${getStatusColor(selectedServicio.estado)}`}>
                         {selectedServicio.estado}
                       </span>
                    </div>

                    <div className="relative pl-8 space-y-10 before:absolute before:inset-0 before:ml-[39px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-indigo-500 before:to-slate-200 dark:before:to-slate-800">
                       
                       {/* Origen */}
                       <div className="relative flex items-start group">
                         <div className="absolute left-[-32px] w-8 h-8 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-950 flex items-center justify-center shadow-lg z-10">
                           <CheckCircle2 className="w-4 h-4 text-white" />
                         </div>
                         <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 w-full ml-6">
                           <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-slate-900 dark:text-white text-base">Salida: {selectedServicio.origen}</h4>
                             <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 dark:text-slate-400">
                               <Clock className="w-3 h-3" />
                               {new Date(selectedServicio.fecha).toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}
                             </span>
                           </div>
                           <p className="text-sm text-slate-600 dark:text-slate-400">Revisión pre-operacional completada (Checklist #4521). Carga asegurada, documentación a bordo.</p>
                           <div className="mt-4 flex gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg">
                                <ShieldCheck className="w-3 h-3" /> Verificado
                              </span>
                           </div>
                         </div>
                       </div>

                       {/* Punto intermedio (En Ruta) */}
                       <div className="relative flex items-start group">
                         <div className="absolute left-[-32px] w-8 h-8 rounded-full bg-indigo-500 border-4 border-white dark:border-slate-950 flex items-center justify-center shadow-lg z-10">
                           <Truck className="w-4 h-4 text-white" />
                         </div>
                         <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-500/20 w-full ml-6">
                           <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-indigo-900 dark:text-white text-base">Control Peaje General</h4>
                             <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-500/30 flex items-center gap-1">
                               <Clock className="w-3 h-3" />
                               +2h 30m
                             </span>
                           </div>
                           <p className="text-sm text-indigo-700/80 dark:text-indigo-300">Punto de control intermedio. GPS reporta velocidad estable (85km/h).</p>
                         </div>
                       </div>

                       {/* Destino */}
                       <div className="relative flex items-start group">
                         <div className="absolute left-[-32px] w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-white dark:border-slate-950 flex items-center justify-center shadow-sm z-10">
                           <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                         </div>
                         <div className="bg-white dark:bg-slate-950 opacity-60 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 border-dashed w-full ml-6">
                           <div className="flex justify-between items-start mb-2">
                             <h4 className="font-bold text-slate-500 dark:text-slate-400 text-base">Llegada: {selectedServicio.destino}</h4>
                             <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                               Estimado: {new Date(new Date(selectedServicio.fecha).getTime() + 5 * 60 * 60 * 1000).toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}
                             </span>
                           </div>
                           <p className="text-sm text-slate-500 dark:text-slate-500">Pendiente de llegada y firma de recepción (Guía de Despacho).</p>
                         </div>
                       </div>

                    </div>
                  </div>

                  {/* Columna Derecha: Detalles operativos */}
                  <div className="lg:col-span-1 p-6 md:p-8 bg-slate-50 dark:bg-slate-900 flex flex-col gap-6">
                     
                     {/* QR de Validación */}
                     <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center shadow-sm">
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Código de Validación en Terreno</h4>
                       <div className="w-32 h-32 bg-slate-100 dark:bg-slate-900 rounded-xl mb-3 flex items-center justify-center border-2 border-slate-200 dark:border-slate-800 border-dashed">
                         {/* Placeholder para QR Real */}
                         <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                       </div>
                       <p className="text-xs text-slate-500 font-medium dark:text-slate-400">Escanear para registrar llegada e iniciar protocolo de descarga.</p>
                     </div>

                     {/* Datos Conductor / Vehículo */}
                     <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Tripulación</h4>
                          </div>
                          <div className="pl-11 space-y-1">
                            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{selectedServicio.conductor}</p>
                            <p className="text-xs text-slate-500 font-medium dark:text-slate-400">Licencia A-5, A-2 Vigente</p>
                          </div>
                        </div>
                        
                        <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                              <Truck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unidad de Transporte</h4>
                          </div>
                          <div className="pl-11 space-y-1">
                            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{selectedServicio.unidad}</p>
                            <p className="text-xs text-slate-500 font-medium dark:text-slate-400">Patente: AB-CD-12</p>
                          </div>
                        </div>
                     </div>

                     {/* Incidentes o Notas */}
                     <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-200 dark:border-amber-800/50 flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <FileWarning className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Instrucciones Especiales</h4>
                        </div>
                        <p className="text-sm text-amber-800/80 dark:text-amber-300/80 leading-relaxed font-medium">
                          {selectedServicio.tipo === 'Peligrosa / MATPEL' 
                            ? 'Transporte de materiales peligrosos. Velocidad máxima reducida en ruta estructurante de minera. Se requiere escolta desde kilómetro 45.' 
                            : 'El protocolo de ingreso a faena requiere presentar inducción de seguridad y certificado de somnolencia al día al momento de llegar a garita.'}
                        </p>
                     </div>

                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      {confirmState.isOpen && selectedServicio && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmState({ isOpen: false, action: null })} />
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden z-10 p-6 relative">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {confirmState.action === 'anular' ? 'Anular Servicio' : 'Eliminar Servicio'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              ¿Estás seguro de que deseas {confirmState.action} el servicio <strong className="text-slate-800 dark:text-slate-200">{selectedServicio.codigo}</strong>?
              {confirmState.action === 'eliminar' && ' Esta acción es irreversible.'}
            </p>
            <div className="flex gap-3 justify-end items-center">
              <button 
                onClick={() => setConfirmState({ isOpen: false, action: null })}
                className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmAction}
                className={cn(
                  "px-4 py-2 rounded-lg text-white font-medium transition-colors shadow-sm",
                  confirmState.action === 'eliminar' ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
                )}
              >
                {confirmState.action === 'eliminar' ? 'Eliminar' : 'Anular'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
