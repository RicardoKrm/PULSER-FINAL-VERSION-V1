import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Plus, Search, Calendar, X, Briefcase, Download, Paperclip, ChevronRight, CheckCircle2, Truck, Wrench, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../context/AuthContext';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
};

type Contrato = {
  id: string;
  cliente: string;
  descripcion: string;
  inicio: string;
  termino: string;
  valor: number;
  activo: boolean;
  tipo: string;
  vehiculosAsignados: string[];
  maquinasAsignadas: string[];
};

export default function Contratos() {
  const { activeCompanyId } = useCompany();
  const { profile } = useAuth();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState<{ id: string; patente: string; tipo: string }[]>([]);
  const [clientesExistentes, setClientesExistentes] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const [userCompanies, setUserCompanies] = useState<{id: string, nombre: string}[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    empresa_id: '',
    cliente: '',
    rut: '',
    descripcion: '',
    tipo: 'Transporte Personal',
    zona: 'Norte',
    inicio: '',
    termino: '',
    valor: '',
    condicion_pago: '30 Días',
    renovacion_auto: false,
    vehiculosAsignados: [] as string[]
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadData = async () => {
    if (!activeCompanyId) return;

    try {
      // Cargar contratos
      let contratosQuery = supabase
        .from('operacion_contrato')
        .select(`
          *,
          operacion_contrato_vehiculo( vehiculo_id, vehiculo( patente, tipo ) )
        `)
        .order('created_at', { ascending: false });
        
      if (activeCompanyId !== 'GLOBAL') {
        contratosQuery = contratosQuery.eq('empresa_id', activeCompanyId);
      } else if (profile?.rol?.nombre !== 'Súper Administrador' && profile?.empresa_id) {
        contratosQuery = contratosQuery.eq('empresa_id', profile.empresa_id);
      }

      const { data: contratosData, error: contratosError } = await contratosQuery;

      if (contratosError) throw contratosError;

      const formatContratos: Contrato[] = (contratosData || []).map(c => {
        const vehiculos = c.operacion_contrato_vehiculo
          ? c.operacion_contrato_vehiculo.map((v: any) => v.vehiculo?.patente).filter(Boolean)
          : [];
        return {
          id: c.id,
          cliente: c.cliente_razon_social,
          descripcion: c.descripcion || '',
          inicio: c.fecha_inicio || '',
          termino: c.fecha_termino || '',
          valor: parseFloat(c.valor_total) || 0,
          activo: c.activo !== false,
          tipo: c.tipo_servicio || 'General',
          vehiculosAsignados: vehiculos,
          maquinasAsignadas: [] // Si manejas máquinas en otra tabla
        };
      });

      setContratos(formatContratos);

      // Cargar vehículos
      let vehiculosQuery = supabase
        .from('vehiculo')
        .select('id, patente, tipo');
        
      if (activeCompanyId !== 'GLOBAL') {
        vehiculosQuery = vehiculosQuery.eq('empresa_id', activeCompanyId);
      } else if (profile?.rol?.nombre !== 'Súper Administrador' && profile?.empresa_id) {
        vehiculosQuery = vehiculosQuery.eq('empresa_id', profile.empresa_id);
      }
      
      const { data: vehiculosData, error: vehiculosError } = await vehiculosQuery;
      
      if (!vehiculosError && vehiculosData) {
        setVehiculosDisponibles(vehiculosData);
      }

      // Obtener lista de clientes únicos para autocompletar
      const uniqueClients = Array.from(new Set(formatContratos.map(c => c.cliente))).filter(Boolean);
      setClientesExistentes(uniqueClients);

      if (activeCompanyId === 'GLOBAL') {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email) {
          const { data: ua } = await supabase
            .from('usuario_aplicacion')
            .select('empresa_id, empresa(id, nombre)')
            .eq('email', userData.user.email);
            
          if (ua && ua.length > 0) {
            setUserCompanies(ua.map((u: any) => ({
              id: u.empresa?.id || u.empresa_id,
              nombre: u.empresa?.nombre || 'Mi Empresa'
            })));
            
            if (!formData.empresa_id) {
               setFormData(prev => ({ ...prev, empresa_id: ua[0].empresa_id || ua[0].empresa?.id }));
            }
          } else {
            // Si el usuario no tiene empresa asociada (es super admin puro sin usuario_aplicacion, etc) 
            // Mostramos todas las empresas:
            const { data: allEmpresas } = await supabase.from('empresa').select('id, nombre').eq('estado', 'Activo');
            if (allEmpresas) {
              setUserCompanies(allEmpresas.map((e: any) => ({ id: e.id, nombre: e.nombre })));
            }
          }
        }
      } else {
        setFormData(prev => ({ ...prev, empresa_id: activeCompanyId }));
      }

    } catch (error) {
      console.error('Error loading contracts data:', error);
      showToast('Error cargando los datos.');
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompanyId, profile]);

  const handleSaveContrato = async () => {
    const finalCompanyId = activeCompanyId === 'GLOBAL' ? formData.empresa_id : activeCompanyId;

    if (!finalCompanyId) {
      showToast('Por favor, selecciona una empresa operadora para asignar este contrato.');
      return;
    }

    if (!formData.cliente || formData.cliente.trim() === '') {
      showToast('Por favor, ingresa el nombre o razón social del cliente.');
      return;
    }

    try {
      showToast('Guardando contrato...');

      const insertData = {
        empresa_id: finalCompanyId,
        cliente_razon_social: formData.cliente,
        cliente_rut: formData.rut,
        descripcion: formData.descripcion,
        tipo_servicio: formData.tipo,
        zona_operacion: formData.zona,
        fecha_inicio: formData.inicio || null,
        fecha_termino: formData.termino || null,
        valor_total: formData.valor ? parseFloat(formData.valor) : 0,
        activo: true
      };

      const { data: newContrato, error: insertError } = await supabase
        .from('operacion_contrato')
        .insert([insertData])
        .select()
        .single();
        
      if (insertError) throw insertError;

      // Insert assigned vehicles
      if (formData.vehiculosAsignados.length > 0 && newContrato) {
        const vehiculosToInsert = formData.vehiculosAsignados.map(vid => ({
          contrato_id: newContrato.id,
          vehiculo_id: vid
        }));

        const { error: asignacionError } = await supabase
          .from('operacion_contrato_vehiculo')
          .insert(vehiculosToInsert);
          
        if (asignacionError) throw asignacionError;
      }

      setIsModalOpen(false);
      loadData();
      showToast('Contrato creado exitosamente.');
      setFormData({
        empresa_id: finalCompanyId,
        cliente: '', rut: '', descripcion: '', tipo: 'Transporte Personal', zona: 'Norte',
        inicio: '', termino: '', valor: '', condicion_pago: '30 Días', renovacion_auto: false, vehiculosAsignados: []
      });
      
    } catch (error) {
      console.error('Error saving contrato:', error);
      showToast('Error al guardar el contrato.');
    }
  };

  const toggleVehiculoAsignado = (vid: string) => {
    setFormData(prev => ({
      ...prev,
      vehiculosAsignados: prev.vehiculosAsignados.includes(vid)
        ? prev.vehiculosAsignados.filter(id => id !== vid)
        : [...prev.vehiculosAsignados, vid]
    }));
  };

  const filteredContratos = useMemo(() => {
    return contratos.filter(c => {
      const matchName = c.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDate = dateFilter ? c.inicio >= dateFilter : true;
      return matchName && matchDate;
    });
  }, [contratos, searchTerm, dateFilter]);

  return (
    <div className="w-full relative min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Contratos Clientes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Administración de acuerdos comerciales, tipos de servicio y facturación.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => showToast('Descargando archivo Excel de contratos...')}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-300 px-4 py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Contrato
          </button>
        </div>
      </div>

      {/* Toolbar / Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por cliente o descripción..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
          />
        </div>
        <div className="w-full md:w-64 relative group">
          <Calendar className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>

      {/* Grid de Contratos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredContratos.map((contrato) => (
          <div 
            key={contrato.id} 
            onClick={() => setSelectedContrato(contrato)}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700/50 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-lg">
                {contrato.cliente.charAt(0)}
              </div>
              {contrato.activo ? (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 font-black text-[10px] rounded-lg uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50">
                  Activo
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-black text-[10px] rounded-lg uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                  Inactivo
                </span>
              )}
            </div>
            
            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-1">{contrato.cliente}</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[40px] leading-relaxed mb-4">{contrato.descripcion}</p>
            
            <div className="mb-4 flex gap-2">
               <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px] rounded-md uppercase tracking-wider">
                 {contrato.tipo}
               </span>
               {(contrato.vehiculosAsignados.length > 0 || contrato.maquinasAsignadas.length > 0) && (
                 <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] rounded-md border border-indigo-100 dark:border-indigo-800/50">
                   <Truck className="w-3 h-3" />
                   {contrato.vehiculosAsignados.length + contrato.maquinasAsignadas.length} Equipos
                 </span>
               )}
            </div>

            <div className="mt-auto pt-5 border-t border-slate-100 dark:border-slate-800/60">
              <div className="flex justify-between items-end mb-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Período</p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {contrato.inicio.slice(2)} <span className="text-slate-400 mx-1">→</span> {contrato.termino.slice(2)}
                  </p>
                </div>
                <div className="text-right space-y-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor total ($)</p>
                   <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                     {formatCurrency(contrato.valor).replace('CLP', '').trim()}
                   </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2 text-indigo-600 dark:text-indigo-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Ver Detalles <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredContratos.length === 0 && (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No hay resultados</h3>
          <p className="text-slate-500 mt-1 dark:text-slate-400">Prueba ajustando los filtros de búsqueda.</p>
        </div>
      )}

      {/* Modal Crear Contrato */}
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
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Nuevo Contrato Comercial</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5 dark:text-slate-400">Ingreso de datos del acuerdo</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors dark:text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido Modal (Scrollable) */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Seccion Izquierda */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">1. Datos Generales</h3>
                      
                      <div className="space-y-4">
                        {activeCompanyId === 'GLOBAL' && (
                          <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Empresa Operadora (Propietaria)</label>
                            <select 
                              value={formData.empresa_id} 
                              onChange={e => setFormData({...formData, empresa_id: e.target.value})} 
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
                            >
                              <option value="">Selecciona Empresa Operadora...</option>
                              {userCompanies.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Empresa Cliente (Razón Social)</label>
                          <input 
                            type="text" 
                            list="clientes-list"
                            value={formData.cliente} 
                            onChange={e => setFormData({...formData, cliente: e.target.value})} 
                            placeholder="Ej: Minera Escondida Ltda." 
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" 
                          />
                          <datalist id="clientes-list">
                            {clientesExistentes.map(c => (
                              <option key={c} value={c} />
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">RUT / Identificación</label>
                          <input type="text" value={formData.rut} onChange={e => setFormData({...formData, rut: e.target.value})} placeholder="Ej: 76.543.210-K" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Descripción Corta del Proyecto</label>
                          <textarea rows={3} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="Detalles de la operación acordada..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all resize-none text-slate-900 dark:text-white"></textarea>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">2. Clasificación</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tipo de Servicio</label>
                          <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white">
                            <option>Transporte Personal</option>
                            <option>Carga General</option>
                            <option>Sobredimensionada</option>
                            <option>Refrigerada</option>
                            <option>MATPEL (Peligrosa)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Zona Operación</label>
                          <select value={formData.zona} onChange={e => setFormData({...formData, zona: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white">
                            <option>Norte</option>
                            <option>Centro</option>
                            <option>Sur</option>
                            <option>Internacional</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seccion Derecha */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">3. Vigencia y Facturación</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Fecha Inicio</label>
                          <input type="date" value={formData.inicio} onChange={e => setFormData({...formData, inicio: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Fecha Término</label>
                          <input type="date" value={formData.termino} onChange={e => setFormData({...formData, termino: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Valor Total ($ o UF)</label>
                          <input type="number" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Condición de Pago</label>
                          <select value={formData.condicion_pago} onChange={e => setFormData({...formData, condicion_pago: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white">
                            <option>30 Días</option>
                            <option>45 Días</option>
                            <option>60 Días</option>
                            <option>90 Días</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                         <input type="checkbox" checked={formData.renovacion_auto} onChange={e => setFormData({...formData, renovacion_auto: e.target.checked})} id="renovacion_auto" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-700 dark:text-slate-100" />
                         <label htmlFor="renovacion_auto" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Renovación Automática</label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">4. Documentos Legales</h3>
                      
                      <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors bg-slate-50/50 dark:bg-slate-950 cursor-pointer">
                        <Paperclip className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Arrastra el archivo PDF del contrato firmado</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">o haz clic para explorar</p>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="md:col-span-2 mt-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">5. Asignación de Flota y Maquinaria (Opcional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">Vehículos <span className="text-xs text-indigo-600 font-medium">Múltiples</span></label>
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 h-48 overflow-y-auto space-y-2">
                        {vehiculosDisponibles.filter(v => v.tipo !== 'Maquinaria').map(v => (
                          <label key={v.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors shadow-sm">
                            <input 
                              type="checkbox" 
                              checked={formData.vehiculosAsignados.includes(v.id)}
                              onChange={() => toggleVehiculoAsignado(v.id)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" 
                            />
                            <div className="flex items-center gap-2">
                               <Truck className="w-4 h-4 text-slate-400" />
                               <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{v.patente} - {v.tipo}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex justify-between">Maquinaria <span className="text-xs text-indigo-600 font-medium">Múltiples</span></label>
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 h-48 overflow-y-auto space-y-2">
                        {vehiculosDisponibles.filter(v => v.tipo === 'Maquinaria').map(m => (
                          <label key={m.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors shadow-sm">
                            <input 
                              type="checkbox" 
                              checked={formData.vehiculosAsignados.includes(m.id)}
                              onChange={() => toggleVehiculoAsignado(m.id)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" 
                            />
                            <div className="flex items-center gap-2">
                               <Wrench className="w-4 h-4 text-slate-400" />
                               <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{m.patente}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Modal */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                 <button 
                   onClick={() => setIsModalOpen(false)}
                   className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={handleSaveContrato}
                   className="px-8 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-2"
                 >
                   <CheckCircle2 className="w-5 h-5" />
                   Confirmar y Guardar
                 </button>
              </div>

            </motion.div>
          </div>
        )}

        {/* Modal Detalle de Contrato Side Panel */}
        {selectedContrato && (
          <div className="fixed inset-0 z-50 flex items-stretch justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedContrato(null)}
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
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-black text-lg">
                    {selectedContrato.cliente.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{selectedContrato.cliente}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Detalle Contrato</span>
                      {selectedContrato.activo ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedContrato(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors dark:text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="space-y-8">
                  
                  {/* Datos Principales */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Información Principal</h3>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                      
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">Descripción</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedContrato.descripcion}</p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Tipo de Servicio</p>
                        <div className="flex">
                          <span className="inline-block px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-md">
                            {selectedContrato.tipo}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">Valor Total Proyectado</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedContrato.valor)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Fechas */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Vigencia</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">Fecha de Inicio</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedContrato.inicio}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">Fecha de Término</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedContrato.termino}</p>
                      </div>
                    </div>
                  </div>

                  {/* Operatividad */}
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Estado Operativo</h3>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nivel de Ejecución</span>
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">45%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <p className="text-xs font-medium text-slate-500 mt-3 leading-relaxed dark:text-slate-400">
                        Se han completado 45 de los 100 servicios pactados estimados en este periodo. Rentabilidad actual del acuerdo: <strong>14.2%</strong>
                      </p>
                    </div>

                    {/* Flota Asignada */}
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 dark:text-slate-400">Flota y Maquinaria Asignada</h4>
                      
                      {selectedContrato.vehiculosAsignados.length === 0 && selectedContrato.maquinasAsignadas.length === 0 ? (
                        <div className="flex items-center gap-2 text-slate-500 text-sm dark:text-slate-400">
                          <AlertCircle className="w-4 h-4" />
                          <span>No hay flota asignada a este contrato.</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedContrato.vehiculosAsignados.length > 0 && (
                            <div>
                               <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                 <Truck className="w-3.5 h-3.5 text-indigo-500" /> Vehículos
                               </p>
                               <div className="flex flex-wrap gap-2">
                                 {selectedContrato.vehiculosAsignados.map(v => (
                                   <span key={v} className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                                     {v}
                                   </span>
                                 ))}
                               </div>
                            </div>
                          )}
                          
                          {selectedContrato.maquinasAsignadas.length > 0 && (
                            <div>
                               <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                 <Wrench className="w-3.5 h-3.5 text-indigo-500" /> Maquinaria
                               </p>
                               <div className="flex flex-wrap gap-2">
                                 {selectedContrato.maquinasAsignadas.map(m => (
                                   <span key={m} className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm">
                                     {m}
                                   </span>
                                 ))}
                               </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Acciones de detalle */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
                 <button 
                  onClick={() => showToast('Iniciando creación de servicio asignado al contrato...')}
                  className="w-full py-3.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                 >
                   Añadir Servicio a Contrato
                 </button>
                 <button 
                  onClick={() => {
                    setSelectedContrato(null);
                    setIsModalOpen(true);
                  }}
                  className="w-full py-3.5 rounded-xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
                 >
                   Editar Acuerdo Comercial
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-medium"
          >
            <Info className="w-5 h-5 text-indigo-400 dark:text-white" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
