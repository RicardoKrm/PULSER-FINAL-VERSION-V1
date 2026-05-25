import React, { useState, useMemo, useEffect } from 'react';
import { Calendar as CalendarIcon, Download, Filter, Search, GripVertical, Clock, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../context/AuthContext';

// Utilidades de Fechas
function getStartOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function getStartOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Mock Data
const PENDING_SERVICES: any[] = [];

const today = new Date();
const INIT_DATE = today;

const startOfMonthStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
const endOfMonthStr = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 to 19

export default function Programacion() {
  const { activeCompanyId, currentCompany } = useCompany();
  const { profile } = useAuth();
  const [viewMode, setViewMode] = useState<'Día' | 'Semana' | 'Mes' | 'Tabla'>('Semana');
  const [currentDate, setCurrentDate] = useState<Date>(INIT_DATE);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [pendings, setPendings] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');

  const [dateFilterStart, setDateFilterStart] = useState(startOfMonthStr);
  const [dateFilterEnd, setDateFilterEnd] = useState(endOfMonthStr);

  useEffect(() => {
    fetchData();
  }, [activeCompanyId]);

  const fetchData = async () => {
    try {
      let queryProg = supabase.from('operacion_programacion').select('*, conductor:colaborador(nombre), vehiculo:vehiculo(patente)');
      let queryServ = supabase.from('operacion_servicio').select('*, conductor:colaborador(nombre), vehiculo:vehiculo(patente)').in('estado', ['Borrador', 'Programado']);
      let queryCond = supabase.from('colaborador').select('id, nombre, estado, rol');
      let queryVehs = supabase.from('vehiculo').select('id, patente, estado');
      let queryRutas = supabase.from('operacion_ruta').select('id, nombre, origen, destino');

      if (currentCompany) {
        queryProg = queryProg.eq('empresa_id', currentCompany.id);
        queryServ = queryServ.eq('empresa_id', currentCompany.id);
        queryCond = queryCond.eq('empresa_id', currentCompany.id);
        queryVehs = queryVehs.eq('empresa_id', currentCompany.id);
        queryRutas = queryRutas.eq('empresa_id', currentCompany.id);
      }
      
      const [resProg, resServ, resCond, resVehs, resRutas] = await Promise.all([queryProg, queryServ, queryCond, queryVehs, queryRutas]);
      
      if (resVehs.data) {
        setDbVehiculos(resVehs.data.filter((v: any) => v.estado !== 'INACTIVO'));
      }

      if (resRutas.data) {
        setDbRutas(resRutas.data);
      }

      if (resCond.data) {
        const driversOnly = resCond.data.filter((c: any) => String(c.rol).toLowerCase().includes('conductor') || String(c.rol).toLowerCase().includes('chofer'));
        setDbConductores(driversOnly);
        setConductores(driversOnly.map((c: any) => ({ ...c, vehiculo: 'Sin Asignar', selected: true })));
      }
      
      if (resServ.data) {
        setPendings(resServ.data.map((s: any) => ({
          id: s.id,
          tipo: s.tipo_carga || 'Interprovincial',
          origen: s.origen,
          destino: s.destino,
          conductorName: s.conductor?.nombre || null,
          vehiculoPatente: s.vehiculo?.patente || null,
          empresa_id: s.empresa_id,
          conductor_id: s.conductor_id,
          vehiculo_id: s.vehiculo_id,
          bgColor: 'bg-white dark:bg-slate-800'
        })));
      }
      
      if (resProg.data) {
        console.log("BLOCKS FETCHED:", resProg.data);
        setScheduled(resProg.data.map((p: any) => {
          let hasDriver = !!p.conductor_id || p.conductor;
          let colorClass = 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-300';
          let estadoLabel = 'RESERVADO';

          if (!hasDriver) {
             colorClass = 'bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-600/50 dark:text-yellow-400';
             estadoLabel = 'FALTA CONDUCTOR';
          } else {
            if (p.estado === 'Asignado') colorClass = 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300';
            else if (p.estado === 'En Curso') colorClass = 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300';
            else if (p.estado === 'Realizado') colorClass = 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-300';
            else if (p.estado === 'Pausado') colorClass = 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300';

            if (p.estado === 'En Curso') estadoLabel = 'EN PROCESO';
            else if (p.estado === 'Realizado') estadoLabel = 'TERMINADO';
            else if (p.estado === 'Pausado') estadoLabel = 'PAUSADO';
          }

          return {
          id: p.id,
          dateStr: p.fecha,
          hour: p.hora || 10,
          duration: p.duracion || 2,
          tipo: p.tipo,
          origen: p.origen,
          destino: p.destino,
          estado: estadoLabel,
          estadoRaw: p.estado,
          timeStr: `${p.hora || 10}:00`,
          conductorName: p.conductor?.nombre || null,
          vehiculoPatente: p.vehiculo?.patente || null,
          empresa_id: p.empresa_id,
          conductor_id: p.conductor_id,
          vehiculo_id: p.vehiculo_id,
          colorClass
        };
        }));
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleSyncDrive = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
       setSyncStatus('success');
       setTimeout(() => setSyncStatus('idle'), 3000);
    }, 2000);
  };
  const [conductores, setConductores] = useState<any[]>([]);

  const toggleConductor = (id: string) => {
    setConductores(conductores.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  };

  const [hoveredTooltip, setHoveredTooltip] = useState<{ block: any, x: number, y: number, height: number } | null>(null);

  const handleMouseEnterTooltip = (e: React.MouseEvent, block: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({ block, x: rect.left, y: rect.bottom, height: rect.height });
  };

  const handleMouseLeaveTooltip = () => {
    setHoveredTooltip(null);
  };

  const handleDragStart = (e: React.DragEvent, item: any, source: 'pending' | 'scheduled') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ item, source }));
    setDraggedItem({ item, source });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dateStr: string, hour?: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { item, source } = draggedItem;
    
    // Control de colisiones (solo para vistas con hora)
    if (hour !== undefined) {
      const isConflict = scheduled.some(s => s.dateStr === dateStr && s.hour === hour && s.id !== item.id);
      if (isConflict) {
        alert('Control Anticolisión: Ya existe un servicio asigando en este horario.');
        setDraggedItem(null);
        return;
      }
    }

    if (source === 'pending') {
      try {
        const { data: progData, error: progErr } = await supabase.from('operacion_programacion').insert([{
          empresa_id: item.empresa_id,
          tipo: item.tipo,
          origen: item.origen,
          destino: item.destino,
          fecha: dateStr,
          hora: hour !== undefined ? hour : 10,
          duracion: 2,
          conductor_id: item.conductor_id,
          vehiculo_id: item.vehiculo_id,
          estado: 'Asignado'
        }]).select().single();

        if (progErr) throw progErr;

        // Modificamos el estado del servicio original a Confirmado
        await supabase.from('operacion_servicio').update({ estado: 'Confirmado' }).eq('id', item.id);

        setPendings(prev => prev.filter(p => p.id !== item.id));
        setScheduled(prev => [...prev, {
          id: progData.id,
          dateStr: progData.fecha,
          hour: progData.hora || 10,
          duration: progData.duracion || 2,
          tipo: progData.tipo,
          origen: progData.origen,
          destino: progData.destino,
          conductorName: item.conductorName, 
          vehiculoPatente: item.vehiculoPatente,
          empresa_id: progData.empresa_id,
          conductor_id: progData.conductor_id,
          vehiculo_id: progData.vehiculo_id,
          timeStr: hour !== undefined ? `${hour}:00` : '10:00 AM',
          colorClass: 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-300'
        }]);
      } catch (err) {
         console.error('Error programando:', err);
         alert('Error al guardar la programación.');
      }
    } else if (source === 'scheduled') {
      try {
         await supabase.from('operacion_programacion').update({ 
           fecha: dateStr, 
           hora: hour !== undefined ? hour : item.hour 
         }).eq('id', item.id);

         setScheduled(prev => prev.map(s => 
           s.id === item.id 
             ? { ...s, dateStr, hour: hour !== undefined ? hour : s.hour, timeStr: hour !== undefined ? `${hour}:00` : s.timeStr } 
             : s
         ));
      } catch (err) {
         console.error('Error re-programando:', err);
         alert('Error al actualizar la programación.');
      }
    }
    setDraggedItem(null);
  };

  const handleDropToPending = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { item, source } = draggedItem;
    
    if (source === 'scheduled') {
      try {
        await supabase.from('operacion_programacion').delete().eq('id', item.id);
        
        const { data: servData, error: servErr } = await supabase.from('operacion_servicio').insert([{
           empresa_id: item.empresa_id,
           codigo: `SRV-${Math.random().toString().slice(2, 6)}`,
           tipo_carga: item.tipo,
           origen: item.origen,
           destino: item.destino,
           fecha_servicio: new Date().toISOString(),
           estado: 'Borrador',
           conductor_id: item.conductor_id,
           vehiculo_id: item.vehiculo_id
        }]).select().single();

        if (servErr) throw servErr;

        setScheduled(prev => prev.filter(s => s.id !== item.id));
        setPendings(prev => [...prev, {
          id: servData.id,
          tipo: servData.tipo_carga,
          origen: servData.origen,
          destino: servData.destino,
          conductorName: item.conductorName,
          vehiculoPatente: item.vehiculoPatente,
          empresa_id: servData.empresa_id,
          conductor_id: servData.conductor_id,
          vehiculo_id: servData.vehiculo_id,
          bgColor: 'bg-white dark:bg-slate-800'
        }]);
      } catch (err) {
        console.error('Error moviendo a pendientes:', err);
        alert('Error al regresar el servicio a pendientes.');
      }
    }
    setDraggedItem(null);
  };

  // Navegación
  const goToToday = () => setCurrentDate(new Date());
  
  const navigateDate = (dir: number) => {
    if (viewMode === 'Día') {
      setCurrentDate(prev => addDays(prev, dir));
    } else if (viewMode === 'Semana') {
      setCurrentDate(prev => addDays(prev, dir * 7));
    } else {
      setCurrentDate(prev => addMonths(prev, dir));
    }
  };

  // Computar días visibles según vista
  const visibleDays = useMemo(() => {
    if (viewMode === 'Día') {
      return [currentDate];
    } else if (viewMode === 'Semana') {
      const start = getStartOfWeek(currentDate);
      return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    } else {
      // Mes calendario completo (6 semanas aprox para cubrir el mes visualmente, o sólo 1 mes)
      const start = getStartOfMonth(currentDate);
      const startDay = start.getDay();
      const diff = startDay === 0 ? 6 : startDay - 1; // Lunes es 0
      const calendarStart = addDays(start, -diff);
      return Array.from({ length: 35 }).map((_, i) => addDays(calendarStart, i)); // 5 semanas (35 días)
    }
  }, [currentDate, viewMode]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any>(null);
  
  const handleEditBlockSave = async () => {
    if (!editingBlock) return;
    try {
      const { error } = await supabase.from('operacion_programacion').update({
        conductor_id: editingBlock.newConductor || null,
        vehiculo_id: editingBlock.newVehiculo || null,
        estado: editingBlock.newConductor ? 'Asignado' : 'Pendiende'
      }).eq('id', editingBlock.id);

      if (error) throw error;
      fetchData();
      setEditingBlock(null);
    } catch (err) {
      console.error(err);
      alert('Error updating program block');
    }
  };
  const [dayDetailsModal, setDayDetailsModal] = useState<{isOpen: boolean, dateStr: string, blocks: any[]}>({ isOpen: false, dateStr: '', blocks: [] });
  const [newSvrTipo, setNewSvrTipo] = useState('Interprovincial');
  const [newSvrOrigen, setNewSvrOrigen] = useState('');
  const [newSvrDestino, setNewSvrDestino] = useState('');
  const [newSvrConductor, setNewSvrConductor] = useState('');
  const [newSvrVehiculo, setNewSvrVehiculo] = useState('');

  const [dbConductores, setDbConductores] = useState<any[]>([]);
  const [dbVehiculos, setDbVehiculos] = useState<any[]>([]);
  const [dbRutas, setDbRutas] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');

  const currentMonthStr = `${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const handleCrearServicio = async () => {
    if(!newSvrOrigen || !newSvrDestino) return alert('Debes completar el Origen y Destino');
    
    const saveCompanyId = activeCompanyId === 'GLOBAL' ? profile?.empresa_id : activeCompanyId;
    if (!saveCompanyId) return alert('No perteneces a una empresa asignada o no has seleccionado una empresa. Por favor contacta al administrador.');

    const newServiceData = {
      empresa_id: saveCompanyId,
      codigo: `SRV-${Math.random().toString().slice(2, 6)}`,
      tipo_carga: newSvrTipo,
      origen: newSvrOrigen,
      destino: newSvrDestino,
      fecha_servicio: new Date().toISOString(),
      estado: 'Borrador',
      conductor_id: newSvrConductor || null,
      vehiculo_id: newSvrVehiculo || null
    };

    try {
      // Pedimos retorno completo incluyendo relaciones para pintarlas al instante si es posible
      const { data, error } = await supabase.from('operacion_servicio').insert([newServiceData]).select('*, conductor:colaborador(nombre), vehiculo:vehiculo(patente)').single();
      if (error) throw error;
      
      setPendings(prev => [...prev, {
        id: data.id,
        tipo: data.tipo_carga,
        origen: data.origen,
        destino: data.destino,
        conductorName: data.conductor?.nombre || null,
        vehiculoPatente: data.vehiculo?.patente || null,
        empresa_id: data.empresa_id,
        conductor_id: data.conductor_id,
        vehiculo_id: data.vehiculo_id,
        bgColor: 'bg-white dark:bg-slate-800'
      }]);

    } catch (error) {
      console.error("Error creating service:", error);
      alert("Error al crear servicio");
    }

    setNewSvrOrigen('');
    setNewSvrDestino('');
    setNewSvrConductor('');
    setNewSvrVehiculo('');
    setIsNewModalOpen(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] -mt-6 -mx-6 flex bg-white dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Left Sidebar (Google Calendar Style) */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
         <div className="p-4 pt-6">
            <button onClick={() => setIsNewModalOpen(true)} className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full py-2 pr-4 pl-3 flex items-center justify-start transition-colors">
              <Plus className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-500" />
              <span className="font-medium text-sm">Crear Programación</span>
            </button>
         </div>

         <div className="flex-1 overflow-y-auto scrollbar-thin px-4 space-y-6">
            
            {/* Nav Mini Calendar (Mock) */}
            <div>
               <div className="flex justify-between items-center mb-2 px-1">
                 <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">{currentMonthStr}</span>
                 <div className="flex gap-1">
                   <button onClick={() => navigateDate(-1)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded p-1"><ChevronLeft className="w-4 h-4" /></button>
                   <button onClick={() => navigateDate(1)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded p-1"><ChevronRight className="w-4 h-4" /></button>
                 </div>
               </div>
               <div className="grid grid-cols-7 text-center text-[10px] font-medium text-slate-500 mb-1">
                 <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
               </div>
               <div className="grid grid-cols-7 text-center text-xs gap-y-1">
                 {(() => {
                    const start = getStartOfMonth(currentDate);
                    const startDay = start.getDay();
                    const diff = startDay === 0 ? 6 : startDay - 1; 
                    const calendarStart = addDays(start, -diff);
                    return Array.from({ length: 42 }).map((_, i) => {
                      const day = addDays(calendarStart, i);
                      const isCurrentM = day.getMonth() === currentDate.getMonth();
                      const d = day.getDate();
                      return (
                        <span 
                          key={`md-${i}`} 
                          onClick={() => {
                            setCurrentDate(day);
                            setViewMode('Día');
                          }}
                          className={cn("w-6 h-6 flex items-center justify-center rounded-full mx-auto transition-colors",
                             isCurrentM ? "cursor-pointer text-slate-700 dark:text-slate-300" : "text-slate-300 dark:text-slate-600",
                             d === currentDate.getDate() && isCurrentM && viewMode === 'Día' ? "bg-blue-600 text-white font-bold" : (isCurrentM ? "hover:bg-slate-200 dark:hover:bg-slate-700" : ""),
                             d === currentDate.getDate() && isCurrentM && viewMode !== 'Día' ? "ring-2 ring-blue-500 font-bold" : ""
                          )}
                        >
                          {d}
                        </span>
                      );
                    });
                 })()}
               </div>
            </div>

            {/* Pending Services (Drag and Drop List) */}
            <div
               onDragOver={handleDragOver}
               onDrop={handleDropToPending}
               className={cn("transition-colors rounded-lg", draggedItem && !pendings.find(ot => ot.id === draggedItem.item.id) ? "bg-slate-50 dark:bg-slate-800/50 outline-dashed outline-2 outline-slate-300 dark:outline-slate-700 p-1" : "")}
            >
               <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 px-1 flex items-center justify-between">
                 Servicios Pendientes
                 <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full text-[10px]">{pendings.length}</span>
               </h3>
               <div className="space-y-2">
                 {pendings.map(servicio => (
                    <div key={servicio.id} draggable onDragStart={(e) => handleDragStart(e, servicio, 'pending')}
                         className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-xs shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors group">
                       <div className="font-bold text-slate-800 dark:text-slate-200 flex justify-between items-center mb-1 text-[11px]">
                         <span className="truncate">{servicio.tipo}</span>
                         <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0" />
                       </div>
                       <div className="text-slate-500 dark:text-slate-400 mt-0.5 truncate">{servicio.origen} - {servicio.destino}</div>
                       {(servicio.conductorName || servicio.vehiculoPatente) && (
                         <div className="mt-1.5 flex flex-col gap-0.5 text-[10px] text-indigo-500 font-medium">
                           {servicio.conductorName && <span>👤 {servicio.conductorName}</span>}
                           {servicio.vehiculoPatente && <span>🚐 {servicio.vehiculoPatente}</span>}
                         </div>
                       )}
                    </div>
                 ))}
                 {pendings.length === 0 && (
                    <div className="text-xs text-center text-slate-400 py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg mx-1">
                       Todo asignado
                    </div>
                 )}
               </div>
            </div>

            {/* Drivers Filter */}
            <div className="pb-4">
               <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 mb-3 px-1">
                 Conductores y Equipos
               </h3>
               <div className="space-y-1">
                 {conductores.map(c => (
                    <label key={c.id} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 px-1 py-1.5 rounded-md">
                       <div className={cn("w-4 h-4 rounded appearance-none border flex items-center justify-center transition-colors", 
                          c.selected ? "bg-blue-600 border-transparent" : "border-slate-300 dark:border-slate-600 bg-transparent group-hover:border-slate-400"
                       )}>
                         {c.selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                       </div>
                       <input type="checkbox" className="hidden" checked={c.selected} onChange={() => toggleConductor(c.id)} />
                       <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 truncate flex-1">{c.nombre} <span className="text-slate-400 text-xs ml-1">({c.vehiculo})</span></span>
                    </label>
                 ))}
               </div>
            </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
         
         {/* Top Header Bar */}
         <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-4 lg:gap-6">
               <div className="flex items-center gap-4">
                 <button onClick={goToToday} className="text-sm font-medium px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                   Hoy
                 </button>
                 <div className="flex gap-1">
                   <button onClick={() => navigateDate(-1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" /></button>
                   <button onClick={() => navigateDate(1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" /></button>
                 </div>
                 <h2 className="text-xl lg:text-2xl font-normal text-slate-800 dark:text-slate-100 min-w-[140px] capitalize">
                   {currentMonthStr}
                 </h2>
               </div>
            </div>

            <div className="flex items-center gap-4 hidden sm:flex">
               <div className="relative">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input type="text" placeholder="Buscar OT, Patente..." 
                        className="bg-slate-100 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 rounded-md pl-10 pr-4 py-2 text-sm w-48 transition-all" />
               </div>
               
               <select 
                  value={viewMode} 
                  onChange={(e) => setViewMode(e.target.value as any)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium rounded-md px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                >
                 <option value="Día">Día</option>
                 <option value="Semana">Semana</option>
                 <option value="Mes">Mes</option>
                 <option value="Tabla">Tabla Listado</option>
               </select>

               <button disabled={syncStatus === 'syncing'} onClick={handleSyncDrive} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md font-bold shadow-sm transition-colors flex items-center justify-center gap-2 text-sm text-nowrap whitespace-nowrap disabled:opacity-50">
                  <span className="hidden sm:inline">{syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'success' ? '✓ Drive Sincronizado' : '⇄ Sync Bidireccional Drive'}</span>
               </button>

               <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-md font-bold shadow-sm transition-colors flex items-center justify-center gap-2 text-sm text-nowrap whitespace-nowrap">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar Excel</span>
               </button>
            </div>
         </div>
            
            {/* VISTA DÍA Y SEMANA (Grid por horas y Conductores) */}
            {(viewMode === 'Día' || viewMode === 'Semana') && (
              <div className="min-w-[600px] h-full flex flex-col bg-white dark:bg-slate-900">
                {/* Calendar Header */}
                <div className="flex border-b border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 sticky top-0 z-20">
                  <div className="w-16 shrink-0 border-r border-slate-200 dark:border-slate-800"></div>
                  {viewMode === 'Semana' ? (
                     visibleDays.map((day, idx) => {
                       const isToday = formatDateString(day) === formatDateString(new Date());
                       return (
                        <div key={idx} className="flex-1 text-center py-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 flex flex-col items-center justify-center gap-1">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase dark:text-slate-400">{DAYS_ES[day.getDay() === 0 ? 6 : day.getDay() - 1]}</span>
                          <span className={cn(
                            "bg-transparent w-8 h-8 flex items-center justify-center rounded-full text-xl font-normal text-slate-700 dark:text-slate-300",
                            isToday && "bg-blue-600 text-white dark:text-white font-semibold shadow-sm"
                          )}>
                            {day.getDate()}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    conductores.filter(c => c.selected).map(c => (
                       <div key={c.id} className="flex-1 py-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                         <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate px-2">{c.nombre}</div>
                         <div className="text-[10px] text-slate-500 uppercase mt-0.5">{c.vehiculo}</div>
                       </div>
                    ))
                  )}
                  {viewMode === 'Día' && conductores.filter(c => c.selected).length === 0 && (
                     <div className="flex-1 py-4 text-center text-slate-500 text-sm">Seleccione equipos en el panel izquierdo.</div>
                  )}
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-y-auto overflow-x-auto relative flex">
                  {/* Time Axis */}
                  <div className="w-16 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sticky left-0 z-20">
                    {HOURS.map((hour) => (
                      <div key={hour} className="h-20 border-b border-slate-200 dark:border-slate-800 relative bg-white dark:bg-slate-900">
                         <span className="absolute -top-2.5 right-2 text-[10px] text-slate-500 font-medium">{hour}:00</span>
                      </div>
                    ))}
                  </div>

                  {/* Columns */}
                  {viewMode === 'Semana' ? (
                     visibleDays.map((day) => {
                       const dateStr = formatDateString(day);
                       return (
                         <div key={dateStr} className="flex-1 min-w-[120px] border-r border-slate-100 dark:border-slate-800 relative z-10">
                           {HOURS.map((hour) => (
                             <div 
                               key={`${dateStr}-${hour}`} 
                               className="h-20 border-b border-slate-100 dark:border-slate-800 border-dashed hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                               onDragOver={handleDragOver}
                               onDrop={(e) => handleDrop(e, dateStr, hour)}
                             >
                             </div>
                           ))}
                            {/* Render blocks for this day */}
                           {scheduled.filter(s => s.dateStr === dateStr).map(block => {
                              const topOffset = (block.hour - 8) * 80; 
                              const heightOffset = block.duration * 80;
                              
                              // Check if we need to assign a driver to display 
                              return (
                                <div 
                                  key={block.id}
                                  draggable={block.estadoRaw !== 'Realizado'}
                                  onClick={() => setEditingBlock({ ...block, newConductor: block.conductor_id || '', newVehiculo: block.vehiculo_id || '' })}
                                  onDragStart={(e) => handleDragStart(e, block, 'scheduled')}
                                  onMouseEnter={(e) => handleMouseEnterTooltip(e, block)}
                                  onMouseLeave={handleMouseLeaveTooltip}
                                  className={cn(
                                    "absolute left-1 right-1 rounded-md shadow-sm overflow-hidden transition-all flex flex-col p-1.5 border border-transparent z-10",
                                    block.estadoRaw !== 'Realizado' ? "cursor-pointer hover:border-blue-400 hover:shadow-md hover:z-50" : "opacity-80 cursor-not-allowed",
                                    block.colorClass
                                  )}
                                  style={{ top: `${topOffset + 2}px`, height: `${heightOffset - 4}px` }}
                                >
                                  <div className="font-semibold text-[10px] leading-tight truncate flex justify-between gap-1 items-center mb-0.5">
                                    <span>{block.tipo}</span>
                                    <span className="text-[9px] uppercase tracking-wider opacity-80">{block.estado}</span>
                                  </div>
                                  {(block.conductorName || block.vehiculoPatente) && (
                                    <div className="text-[9px] leading-tight truncate opacity-80">
                                      {block.conductorName || 'Sin Cond.'} / {block.vehiculoPatente || 'Sin Veh.'}
                                    </div>
                                  )}
                                  <div className="mt-auto flex flex-col gap-0.5 pt-1">
                                    <div className="text-[9px] truncate opacity-90">{block.origen} - {block.destino}</div>
                                    <div className="flex items-center gap-1 opacity-80 text-[9px] font-medium">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>{block.timeStr}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                           })}
                         </div>
                       );
                     })
                  ) : (
                       /* Vista Día: Columnas por Conductor */
                     conductores.filter(c => c.selected).map(c => {
                       const todayStr = formatDateString(currentDate);
                       // Fix driver scheduling mock logic since we don't have a real DB logic yet to tie drivers directly to blocks
                       const driverBlocks = scheduled.filter(s => s.dateStr === todayStr && (s.id.charCodeAt(1) % conductores.length) === (parseInt(c.id.replace('c','')) - 1));

                       return (
                         <div key={c.id} className="flex-1 min-w-[150px] border-r border-slate-100 dark:border-slate-800 relative z-10">
                           {HOURS.map((hour) => (
                             <div 
                               key={`${c.id}-${hour}`} 
                               className="h-20 border-b border-slate-100 dark:border-slate-800 border-dashed hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                               onDragOver={handleDragOver}
                               onDrop={(e) => handleDrop(e, todayStr, hour)}
                             >
                             </div>
                           ))}
                           
                           {/* Driver Blocks for Today */}
                           {driverBlocks.map(block => {
                              const topOffset = (block.hour - 8) * 80; 
                              const heightOffset = block.duration * 80;
                              return (
                                <div 
                                  key={block.id}
                                  draggable={block.estadoRaw !== 'Realizado'}
                                  onClick={() => setEditingBlock({ ...block, newConductor: block.conductor_id || '', newVehiculo: block.vehiculo_id || '' })}
                                  onDragStart={(e) => handleDragStart(e, block, 'scheduled')}
                                  onMouseEnter={(e) => handleMouseEnterTooltip(e, block)}
                                  onMouseLeave={handleMouseLeaveTooltip}
                                  className={cn(
                                    "absolute left-1 right-1 rounded-md shadow-sm overflow-hidden transition-all flex flex-col p-1.5 border border-transparent z-10",
                                    block.estadoRaw !== 'Realizado' ? "cursor-pointer hover:border-blue-400 hover:shadow-md hover:z-50" : "opacity-80 cursor-not-allowed",
                                    block.colorClass
                                  )}
                                  style={{ top: `${topOffset + 2}px`, height: `${heightOffset - 4}px` }}
                                >
                                  <div className="font-semibold text-xs leading-tight truncate flex justify-between gap-1 items-center mb-0.5">
                                    <span>{block.tipo}</span>
                                    <span className="text-[10px] uppercase tracking-wider opacity-80">{block.estado}</span>
                                  </div>
                                  <div className="mt-auto flex flex-col gap-1 pt-1 opacity-90">
                                    <div className="text-[10px] truncate leading-tight"><span className="opacity-70 mr-1">Ruta:</span> {block.origen} - {block.destino}</div>
                                    <div className="flex items-center justify-between w-full">
                                       <div className="flex items-center gap-1 opacity-80 text-[10px] font-medium">
                                         <Clock className="w-3 h-3 text-current" />
                                         <span>{block.hour}:00 - {block.hour + block.duration}:00</span>
                                       </div>
                                       <span className="font-bold text-[10px] tracking-wider opacity-80">{block.vehiculoPatente ? `🚐 ${block.vehiculoPatente}` : '🚐 Sin Vehículo'}</span>
                                    </div>
                                    <div className="text-[9px] mt-0.5 bg-black/10 dark:bg-black/20 rounded px-1.5 py-0.5 w-fit font-medium">
                                      Conductor: {c.nombre}
                                    </div>
                                  </div>
                                </div>
                              );
                           })}
                         </div>
                       );
                     })
                  )}
                </div>
              </div>
            )}

            {/* VISTA MES (Grid por días sin horas) */}
            {viewMode === 'Mes' && (
              <div className="min-w-[600px] h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
                {/* Headers Semana Mes */}
                <div className="flex border-b border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 sticky top-0 z-20">
                  {DAYS_ES.map((dayName, idx) => (
                    <div key={idx} className="flex-1 text-center py-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase dark:text-slate-400">{dayName}</span>
                    </div>
                  ))}
                </div>
                
                {/* Cuadrícula Mes */}
                 <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-white dark:bg-slate-900">
                   {visibleDays.map((day, idx) => {
                      const dateStr = formatDateString(day);
                      const isToday = formatDateString(day) === formatDateString(new Date());
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                      
                      // Filter blocks for this day
                      const dayBlocks = scheduled.filter(s => s.dateStr === dateStr);
                      const visibleBlocks = dayBlocks.slice(0, 4);
                      const hiddenBlocksCount = dayBlocks.length - 4;

                      return (
                        <div 
                          key={dateStr}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, dateStr)}
                          className={cn(
                            "border-r border-b border-slate-200 dark:border-slate-800 relative p-1.5 overflow-hidden group hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col transition-colors",
                            !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600"
                          )}
                        >
                          <div className="flex justify-center mb-1 mt-1">
                            <span className={cn(
                              "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
                              isToday 
                                ? "bg-blue-600 text-white hover:bg-blue-700" 
                                : (isCurrentMonth ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-600")
                            )}>
                              {day.getDate()}
                            </span>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none px-0.5 mt-1">
                            {visibleBlocks.map(block => (
                                <div 
                                  key={block.id}
                                  draggable={block.estadoRaw !== 'Realizado'}
                                  onClick={() => setEditingBlock({ ...block, newConductor: block.conductor_id || '', newVehiculo: block.vehiculo_id || '' })}
                                  onDragStart={(e) => handleDragStart(e, block, 'scheduled')}
                                  onMouseEnter={(e) => handleMouseEnterTooltip(e, block)}
                                  onMouseLeave={handleMouseLeaveTooltip}
                                  className={cn(
                                    "text-[10px] font-medium px-2 py-1 rounded shadow-sm border truncate transition-opacity flex justify-between items-center gap-2",
                                    block.estadoRaw !== 'Realizado' ? "cursor-grab active:cursor-grabbing hover:opacity-90" : "cursor-not-allowed opacity-80",
                                    block.colorClass,
                                    !isCurrentMonth && "opacity-60"
                                  )}
                                >
                                  <div className="truncate"><span className="font-semibold opacity-90 mr-1">• {block.timeStr.split(' ')[0]}</span> {block.tipo}</div>
                                  <span className="text-[8px] uppercase tracking-wider opacity-80 shrink-0">{block.estado}</span>
                                </div>
                            ))}
                            {hiddenBlocksCount > 0 && (
                               <button 
                                 onClick={() => setDayDetailsModal({ isOpen: true, dateStr, blocks: dayBlocks })}
                                 className="w-full text-left text-[10.5px] font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mt-1 px-1"
                               >
                                 +{hiddenBlocksCount} más
                               </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
               </div>
             )}

             {/* VISTA TABLA (Grilla con Filtros) */}
             {viewMode === 'Tabla' && (
               <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
                 {/* Filtros de Tabla */}
                 <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                       <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Desde:</label>
                       <input type="date" value={dateFilterStart} onChange={e => setDateFilterStart(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div className="flex items-center gap-2">
                       <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Hasta:</label>
                       <input type="date" value={dateFilterEnd} onChange={e => setDateFilterEnd(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <button className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium rounded-md ml-auto transition-colors">
                       <Filter className="w-4 h-4" /> Filtros Avanzados
                    </button>
                    <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold rounded-md transition-colors" onClick={() => alert('Generando archivo Excel con los datos filtrados...')}>
                       <Download className="w-4 h-4" /> Exportar Filtrados a Excel
                    </button>
                 </div>

                 {/* Tabla */}
                 <div className="flex-1 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                         <tr>
                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">ID / OT</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Fecha</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Horario</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Tipo de Servicio</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Ruta (Origen - Destino)</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Vehículo / Conductor Asignado</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50 bg-white dark:bg-slate-900">
                         {scheduled.filter(s => s.dateStr >= dateFilterStart && s.dateStr <= dateFilterEnd).map((block, idx) => {
                            return (
                               <tr key={`tbl-${block.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                 <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">SRV-{block.id.replace('s','')}{(block.id.charCodeAt(block.id.length-1)*7).toString().padStart(3,'0')}</td>
                                 <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{block.dateStr}</td>
                                 <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-mono text-xs">{block.timeStr} - {block.hour + block.duration}:00</td>
                                 <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                   <span className={`px-2 py-1 rounded text-xs font-semibold ${block.colorClass}`}>
                                      {block.tipo}
                                   </span>
                                 </td>
                                 <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                                   {block.origen} → {block.destino}
                                 </td>
                                 <td className="px-4 py-3">
                                   <div className="flex flex-col gap-0.5">
                                     <span className="font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                                       {block.vehiculoPatente ? `🚐 ${block.vehiculoPatente}` : '🚐 Sin vehículo'}
                                     </span>
                                     <span className="text-[11px] text-slate-500">
                                       {block.conductorName ? `👤 ${block.conductorName}` : '👤 Sin conductor'}
                                     </span>
                                   </div>
                                 </td>
                               </tr>
                            )
                         })}
                       </tbody>
                    </table>
                 </div>
               </div>
             )}

      </div>

      {/* Global Tooltip */}
      <AnimatePresence>
        {hoveredTooltip && (
          <motion.div 
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] w-64 flex-col bg-slate-800 border border-slate-700 text-left text-white rounded-xl shadow-xl pointer-events-none overflow-hidden"
            style={{
              left: Math.min(hoveredTooltip.x, window.innerWidth - 270), // Prevent going off-screen right
              top: hoveredTooltip.y + 10 + 140 > window.innerHeight 
                ? hoveredTooltip.y - hoveredTooltip.height - 145 // Show above block if near bottom
                : hoveredTooltip.y + 5 // Show below block otherwise
            }}
          >
            <div className="p-3 border-b border-slate-700 bg-slate-900/50">
              <h5 className="font-semibold text-sm text-white">{hoveredTooltip.block.tipo}</h5>
            </div>
            <div className="p-3 space-y-2">
                 <p className="text-xs text-slate-300 flex justify-between items-center"><span className="text-slate-400">Origen</span> <span className="font-medium text-white">{hoveredTooltip.block.origen}</span></p>
                 <p className="text-xs text-slate-300 flex justify-between items-center"><span className="text-slate-400">Destino</span> <span className="font-medium text-white">{hoveredTooltip.block.destino}</span></p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/20 border-t border-slate-700">
               <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
               <span className="text-[11px] font-medium text-blue-100">{hoveredTooltip.block.timeStr} • {hoveredTooltip.block.duration}h dur.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Crear Programación">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Crea un nuevo servicio y agrégalo a la lista de pendientes para programarlo.
          </p>
          <div className="space-y-3">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tipo de Servicio</label>
                 <select value={newSvrTipo} onChange={e => setNewSvrTipo(e.target.value)} className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                   <option>Interprovincial</option>
                   <option>Personal</option>
                   <option>Carga Peligrosa</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Duración Est. (Horas)</label>
                 <input type="number" defaultValue="2" min="1" className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
             </div>
             <div className="space-y-1">
               <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Ruta Predefinida (Opcional)</label>
               <select 
                 value={selectedRouteId} 
                 onChange={e => {
                   setSelectedRouteId(e.target.value);
                   const route = dbRutas.find(r => r.id === e.target.value);
                   if (route) {
                     setNewSvrOrigen(route.origen);
                     setNewSvrDestino(route.destino);
                   }
                 }} 
                 className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">-- Seleccionar Ruta --</option>
                 {dbRutas.map(r => (
                   <option key={r.id} value={r.id}>{r.nombre}</option>
                 ))}
               </select>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Origen</label>
                 <input type="text" value={newSvrOrigen} onChange={e => setNewSvrOrigen(e.target.value)} placeholder="Ej. Santiago" className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Destino</label>
                 <input type="text" value={newSvrDestino} onChange={e => setNewSvrDestino(e.target.value)} placeholder="Ej. Calama" className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Conductor (Opcional)</label>
                 <select value={newSvrConductor} onChange={e => setNewSvrConductor(e.target.value)} className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                   <option value="">Sin asignar</option>
                   {dbConductores.map(c => (
                     <option key={c.id} value={c.id}>{c.nombre} ({c.rol})</option>
                   ))}
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Vehículo (Opcional)</label>
                 <select value={newSvrVehiculo} onChange={e => setNewSvrVehiculo(e.target.value)} className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                   <option value="">Sin asignar</option>
                   {dbVehiculos.map(v => (
                     <option key={v.id} value={v.id}>{v.patente}</option>
                   ))}
                 </select>
               </div>
             </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
            <button onClick={handleCrearServicio} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">Crear Servicio</button>
          </div>
        </div>
      </Modal>

      {/* Modal for editing existing block */}
      {editingBlock && (
        <Modal isOpen={!!editingBlock} onClose={() => setEditingBlock(null)} title={`Editar Programación`}>
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{editingBlock.tipo}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{editingBlock.origen} - {editingBlock.destino}</div>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Conductor</label>
                <select 
                  value={editingBlock.newConductor} 
                  onChange={e => setEditingBlock({ ...editingBlock, newConductor: e.target.value })} 
                  className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin asignar</option>
                  {dbConductores.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.rol})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Vehículo</label>
                <select 
                  value={editingBlock.newVehiculo} 
                  onChange={e => setEditingBlock({ ...editingBlock, newVehiculo: e.target.value })} 
                  className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin asignar</option>
                  {dbVehiculos.map(v => (
                    <option key={v.id} value={v.id}>{v.patente}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setEditingBlock(null)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={handleEditBlockSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">Guardar</button>
            </div>
          </div>
        </Modal>
      )}

      <Modal isOpen={dayDetailsModal.isOpen} onClose={() => setDayDetailsModal({ ...dayDetailsModal, isOpen: false })} title={`Servicios del ${dayDetailsModal.dateStr}`}>
         <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {dayDetailsModal.blocks.map(block => (
               <div key={block.id} className={cn("p-3 rounded-lg border", block.colorClass)}>
                 <div className="flex justify-between items-start mb-1">
                   <span className="font-semibold text-slate-900 dark:text-white">{block.tipo}</span>
                   <span className="text-xs font-medium px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">{block.timeStr}</span>
                 </div>
                 <div className="text-sm opacity-90 text-slate-800 dark:text-slate-200 leading-tight mb-2"><span className="opacity-70">Ruta:</span> {block.origen} - {block.destino}</div>
                 
                 {(block.conductorName || block.vehiculoPatente) && (
                   <div className="text-xs font-medium mb-2 opacity-90 flex items-center gap-3">
                      {block.conductorName && <span>👤 {block.conductorName}</span>}
                      {block.vehiculoPatente && <span>🚐 {block.vehiculoPatente}</span>}
                   </div>
                 )}

                 <div className="flex items-center gap-4 border-t border-black/10 dark:border-white/10 pt-2 text-xs opacity-80 text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {block.duration}h duración</div>
                 </div>
               </div>
            ))}
         </div>
         <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
            <button onClick={() => setDayDetailsModal({ ...dayDetailsModal, isOpen: false })} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cerrar</button>
         </div>
      </Modal>
    </div>
  );
}
