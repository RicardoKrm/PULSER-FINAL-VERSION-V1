import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Download, Filter, Search, GripVertical, Clock, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Modal } from '../../components/ui/Modal';

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
const PENDING_SERVICES = [
  { id: 'p1', tipo: 'Interprovincial', origen: 'Santiago', destino: 'Calama', bgColor: 'bg-white dark:bg-slate-800' },
  { id: 'p2', tipo: 'Personal', origen: 'Antofagasta', destino: 'Valparaíso', bgColor: 'bg-white dark:bg-slate-800' },
  { id: 'p3', tipo: 'Carga Peligrosa', origen: 'Santiago', destino: 'Calama', bgColor: 'bg-white dark:bg-slate-800' },
  { id: 'p4', tipo: 'Interprovincial', origen: 'Antofagasta', destino: 'Valparaíso', bgColor: 'bg-white dark:bg-slate-800' },
  { id: 'p5', tipo: 'Personal', origen: 'Santiago', destino: 'Calama', bgColor: 'bg-white dark:bg-slate-800' },
  { id: 'p6', tipo: 'Carga Peligrosa', origen: 'Antofagasta', destino: 'Valparaíso', bgColor: 'bg-white dark:bg-slate-800' },
  { id: 'p7', tipo: 'Interprovincial', origen: 'Santiago', destino: 'Calama', bgColor: 'bg-white dark:bg-slate-800' },
];

const INIT_DATE = new Date(2026, 3, 6); // 6 Abril 2026

const SCHEDULED_BLOCKS = [
  { id: 's1', dateStr: '2026-04-07', hour: 10, duration: 2, tipo: 'Interprovincial', origen: 'Antofagasta', destino: 'Valparaíso', timeStr: '10:00 AM', colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300' },
  { id: 's2', dateStr: '2026-04-08', hour: 11, duration: 2, tipo: 'Carga Peligrosa', origen: 'Santiago', destino: 'Calama', timeStr: '11:00 AM', colorClass: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300' },
  { id: 's3', dateStr: '2026-04-09', hour: 13, duration: 2, tipo: 'Personal', origen: 'Antofagasta', destino: 'Valparaíso', timeStr: '01:00 PM', colorClass: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300' },
  { id: 's4', dateStr: '2026-04-10', hour: 14, duration: 2, tipo: 'Interprovincial', origen: 'Santiago', destino: 'Calama', timeStr: '02:00 PM', colorClass: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300' },
  { id: 's5', dateStr: '2026-04-12', hour: 15, duration: 2, tipo: 'Personal', origen: 'Santiago', destino: 'Calama', timeStr: '03:00 PM', colorClass: 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-500/10 dark:border-slate-500/20 dark:text-slate-300' },
  { id: 's6', dateStr: '2026-04-13', hour: 8, duration: 4, tipo: 'Interprovincial', origen: 'Iquique', destino: 'Arica', timeStr: '08:00 AM', colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300' },
  { id: 's7', dateStr: '2026-04-13', hour: 9, duration: 2, tipo: 'Carga Peligrosa', origen: 'Calama', destino: 'Antofagasta', timeStr: '09:00 AM', colorClass: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300' },
  { id: 's8', dateStr: '2026-04-13', hour: 11, duration: 3, tipo: 'Personal', origen: 'Valparaíso', destino: 'Santiago', timeStr: '11:00 AM', colorClass: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300' },
  { id: 's9', dateStr: '2026-04-13', hour: 14, duration: 2, tipo: 'Interprovincial', origen: 'Concepción', destino: 'Chillán', timeStr: '02:00 PM', colorClass: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300' },
  { id: 's10', dateStr: '2026-04-13', hour: 16, duration: 3, tipo: 'Personal', origen: 'Temuco', destino: 'Valdivia', timeStr: '04:00 PM', colorClass: 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-500/10 dark:border-slate-500/20 dark:text-slate-300' },
  { id: 's11', dateStr: '2026-04-13', hour: 17, duration: 2, tipo: 'Carga Peligrosa', origen: 'Punta Arenas', destino: 'Natales', timeStr: '05:00 PM', colorClass: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300' },
  { id: 's12', dateStr: '2026-04-14', hour: 10, duration: 2, tipo: 'Interprovincial', origen: 'Santiago', destino: 'Valparaíso', timeStr: '10:00 AM', colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300' },
  { id: 's13', dateStr: '2026-04-14', hour: 12, duration: 3, tipo: 'Personal', origen: 'Santiago', destino: 'Rancagua', timeStr: '12:00 PM', colorClass: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300' },
  { id: 's14', dateStr: '2026-04-15', hour: 9, duration: 4, tipo: 'Carga Peligrosa', origen: 'San Antonio', destino: 'Santiago', timeStr: '09:00 AM', colorClass: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300' },
  { id: 's15', dateStr: '2026-04-15', hour: 14, duration: 2, tipo: 'Interprovincial', origen: 'Copiapó', destino: 'Vallenar', timeStr: '02:00 PM', colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300' },
  { id: 's16', dateStr: '2026-04-15', hour: 16, duration: 3, tipo: 'Personal', origen: 'La Serena', destino: 'Coquimbo', timeStr: '04:00 PM', colorClass: 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-500/10 dark:border-slate-500/20 dark:text-slate-300' },
  { id: 's17', dateStr: '2026-04-16', hour: 8, duration: 2, tipo: 'Interprovincial', origen: 'Arica', destino: 'Iquique', timeStr: '08:00 AM', colorClass: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300' },
  { id: 's18', dateStr: '2026-04-16', hour: 11, duration: 4, tipo: 'Carga Peligrosa', origen: 'Tocopilla', destino: 'Antofagasta', timeStr: '11:00 AM', colorClass: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300' },
  { id: 's19', dateStr: '2026-04-17', hour: 10, duration: 2, tipo: 'Personal', origen: 'Santiago', destino: 'Talagante', timeStr: '10:00 AM', colorClass: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300' },
  { id: 's20', dateStr: '2026-04-17', hour: 13, duration: 3, tipo: 'Interprovincial', origen: 'Curicó', destino: 'Talca', timeStr: '01:00 PM', colorClass: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300' },
  { id: 's21', dateStr: '2026-04-18', hour: 9, duration: 2, tipo: 'Carga Peligrosa', origen: 'Los Andes', destino: 'Santiago', timeStr: '09:00 AM', colorClass: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300' },
  { id: 's22', dateStr: '2026-04-18', hour: 12, duration: 4, tipo: 'Personal', origen: 'Linares', destino: 'Chillán', timeStr: '12:00 PM', colorClass: 'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-500/10 dark:border-slate-500/20 dark:text-slate-300' },
  { id: 's23', dateStr: '2026-04-18', hour: 16, duration: 2, tipo: 'Interprovincial', origen: 'San Fernando', destino: 'Rancagua', timeStr: '04:00 PM', colorClass: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300' },
  { id: 's24', dateStr: '2026-04-19', hour: 8, duration: 3, tipo: 'Personal', origen: 'Puerto Montt', destino: 'Osorno', timeStr: '08:00 AM', colorClass: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-300' },
  { id: 's25', dateStr: '2026-04-19', hour: 13, duration: 2, tipo: 'Carga Peligrosa', origen: 'Castro', destino: 'Quellón', timeStr: '01:00 PM', colorClass: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300' }
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 to 19

export default function Programacion() {
  const [viewMode, setViewMode] = useState<'Día' | 'Semana' | 'Mes'>('Semana');
  const [currentDate, setCurrentDate] = useState<Date>(INIT_DATE);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [scheduled, setScheduled] = useState([...SCHEDULED_BLOCKS]);
  const [pendings, setPendings] = useState([...PENDING_SERVICES]);
  const [conductores, setConductores] = useState([
    { id: 'c1', nombre: 'Juan Pérez', vehiculo: 'LDPJ-99', selected: true },
    { id: 'c2', nombre: 'Miguel Sánchez', vehiculo: 'KHYT-22', selected: true },
    { id: 'c3', nombre: 'Carlos Ruiz', vehiculo: 'MNQP-15', selected: true },
    { id: 'c4', nombre: 'Roberto Gómez', vehiculo: 'FRTY-11', selected: true },
    { id: 'c5', nombre: 'Andrés Soto', vehiculo: 'HTYK-88', selected: true },
    { id: 'c6', nombre: 'Luis Vargas', vehiculo: 'PRTZ-45', selected: true },
  ]);

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

  const handleDrop = (e: React.DragEvent, dateStr: string, hour?: number) => {
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
      setPendings(prev => prev.filter(p => p.id !== item.id));
      setScheduled(prev => [...prev, {
        id: item.id,
        dateStr,
        hour: hour || 10,
        duration: 2,
        tipo: item.tipo,
        origen: item.origen,
        destino: item.destino,
        timeStr: hour ? `${hour}:00` : '10:00 AM',
        colorClass: 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-300'
      }]);
    } else if (source === 'scheduled') {
      setScheduled(prev => prev.map(s => 
        s.id === item.id 
          ? { ...s, dateStr, hour: hour !== undefined ? hour : s.hour, timeStr: hour ? `${hour}:00` : s.timeStr } 
          : s
      ));
    }
    setDraggedItem(null);
  };

  const handleDropToPending = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { item, source } = draggedItem;
    
    if (source === 'scheduled') {
      setScheduled(prev => prev.filter(s => s.id !== item.id));
      setPendings(prev => [...prev, {
        id: item.id,
        tipo: item.tipo,
        origen: item.origen,
        destino: item.destino,
        bgColor: 'bg-white dark:bg-slate-800'
      }]);
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
  const [dayDetailsModal, setDayDetailsModal] = useState<{isOpen: boolean, dateStr: string, blocks: any[]}>({ isOpen: false, dateStr: '', blocks: [] });
  const [newSvrTipo, setNewSvrTipo] = useState('Interprovincial');
  const [newSvrOrigen, setNewSvrOrigen] = useState('');
  const [newSvrDestino, setNewSvrDestino] = useState('');

  const currentMonthStr = `${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const handleCrearServicio = () => {
    if(!newSvrOrigen || !newSvrDestino) return alert('Debes completar el Origen y Destino');
    
    setPendings(prev => [...prev, {
      id: `p${Math.random().toString().slice(2, 6)}`,
      tipo: newSvrTipo,
      origen: newSvrOrigen,
      destino: newSvrDestino,
      bgColor: 'bg-white dark:bg-slate-800'
    }]);

    setNewSvrOrigen('');
    setNewSvrDestino('');
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
                 {[...Array(4)].map((_,i) => <span key={`e-${i}`} className="text-slate-300 dark:text-slate-600 py-1">{27+i}</span>)}
                 {[...Array(31)].map((_,i) => {
                    const d = i + 1;
                    return (
                      <span 
                        key={`d-${i}`} 
                        onClick={() => {
                          const newDate = new Date(currentDate);
                          newDate.setDate(d);
                          setCurrentDate(newDate);
                          setViewMode('Día');
                        }}
                        className={cn("w-6 h-6 flex items-center justify-center rounded-full mx-auto cursor-pointer transition-colors", 
                           d === currentDate.getDate() && viewMode === 'Día' ? "bg-blue-600 text-white font-bold" : "hover:bg-slate-200 dark:hover:bg-slate-700",
                           d === currentDate.getDate() && viewMode !== 'Día' ? "ring-2 ring-blue-500 font-bold" : ""
                        )}
                      >
                        {d}
                      </span>
                    );
                 })}
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
               </select>

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
                              const pseudoDriver = conductores[Math.floor(Math.random() * conductores.length)];

                              return (
                                <div 
                                  key={block.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, block, 'scheduled')}
                                  onMouseEnter={(e) => handleMouseEnterTooltip(e, block)}
                                  onMouseLeave={handleMouseLeaveTooltip}
                                  className={cn(
                                    "absolute left-1 right-1 rounded-md shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all flex flex-col p-1.5 border border-transparent hover:border-blue-400 z-10 hover:z-50",
                                    block.colorClass
                                  )}
                                  style={{ top: `${topOffset + 2}px`, height: `${heightOffset - 4}px` }}
                                >
                                  <div className="font-semibold text-[10px] leading-tight truncate flex justify-between gap-1 items-center mb-0.5">
                                    <span>{block.tipo}</span>
                                  </div>
                                  <div className="text-[9px] leading-tight truncate opacity-80">{pseudoDriver.nombre} - {pseudoDriver.vehiculo}</div>
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
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, block, 'scheduled')}
                                  onMouseEnter={(e) => handleMouseEnterTooltip(e, block)}
                                  onMouseLeave={handleMouseLeaveTooltip}
                                  className={cn(
                                    "absolute left-1 right-1 rounded-md shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all flex flex-col p-1.5 border border-transparent hover:border-blue-400 z-10 hover:z-50",
                                    block.colorClass
                                  )}
                                  style={{ top: `${topOffset + 2}px`, height: `${heightOffset - 4}px` }}
                                >
                                  <div className="font-semibold text-xs leading-tight truncate flex mb-0.5">
                                    <span>{block.tipo}</span>
                                  </div>
                                  <div className="mt-auto flex flex-col gap-1 pt-1 opacity-90">
                                    <div className="text-[10px] truncate leading-tight"><span className="opacity-70 mr-1">Ruta:</span> {block.origen} - {block.destino}</div>
                                    <div className="flex items-center justify-between w-full">
                                       <div className="flex items-center gap-1 opacity-80 text-[10px] font-medium">
                                         <Clock className="w-3 h-3 text-current" />
                                         <span>{block.hour}:00 - {block.hour + block.duration}:00</span>
                                       </div>
                                       <span className="font-bold text-[10px] tracking-wider opacity-80">{c.vehiculo}</span>
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
                                 draggable
                                 onDragStart={(e) => handleDragStart(e, block, 'scheduled')}
                                 onMouseEnter={(e) => handleMouseEnterTooltip(e, block)}
                                 onMouseLeave={handleMouseLeaveTooltip}
                                 className={cn(
                                   "text-[10px] font-medium px-2 py-1 rounded shadow-sm border truncate cursor-grab active:cursor-grabbing hover:opacity-90 transition-opacity bg-blue-500 text-white border-blue-600 dark:bg-blue-600 dark:border-blue-700",
                                   !isCurrentMonth && "opacity-60"
                                 )}
                               >
                                 <span className="font-semibold opacity-90 mr-1">• {block.timeStr.split(' ')[0]}</span> {block.tipo}
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
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setIsNewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
            <button onClick={handleCrearServicio} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">Crear Servicio</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={dayDetailsModal.isOpen} onClose={() => setDayDetailsModal({ ...dayDetailsModal, isOpen: false })} title={`Servicios del ${dayDetailsModal.dateStr}`}>
         <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {dayDetailsModal.blocks.map(block => (
               <div key={block.id} className={cn("p-3 rounded-lg border", block.colorClass)}>
                 <div className="flex justify-between items-start mb-1">
                   <span className="font-semibold text-slate-900 dark:text-white">{block.tipo}</span>
                   <span className="text-xs font-medium px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">{block.timeStr}</span>
                 </div>
                 <div className="text-sm opacity-90 text-slate-800 dark:text-slate-200 leading-tight mb-2"><span className="opacity-70">Ruta:</span> {block.origen} - {block.destino}</div>
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
