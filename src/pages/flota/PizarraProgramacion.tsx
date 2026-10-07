import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ChevronLeft, ChevronRight, Clock, GripVertical, Search, AlertCircle, Plus, Calendar as CalendarIcon, Check, MoreHorizontal, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { CrearOTModal } from '../../components/flota/CrearOTModal';
import { useAppContext } from '../../context/AppContext';

type OTTipo = 'Preventiva' | 'Correctiva' | 'Evaluativa' | 'Preventiva Neumático' | 'Correctiva Neumático' | 'Evaluativa Neumático' | 'Inspección';

interface OtMock {
  id: string;
  folio: string;
  patente: string;
  tipo: OTTipo;
  actividad: string;
  startHour?: number;
  duration?: number;
  dayOffset?: number; // 0 = today, 1 = tomorrow, etc.
  fechaProgramada?: string; // YYYY-MM-DD
  isOverdue?: boolean;
  estado?: 'EN_PROCESO' | 'PAUSADA' | 'PAUSADA_MECANICO' | 'TERMINADA' | 'PROGRAMADA';
  tiempoAplicacion?: string;
  tiempoAtraso?: string;
  progress?: number;
  startedLate?: boolean;
  finishedLate?: boolean;
}

interface MecanicoMock {
  id: string;
  nombre: string;
  especialidad: string;
  selected: boolean;
  ots: OtMock[];
}

const formatDateStr = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const getSpanishMonthName = (date: Date) => {
  return date.toLocaleDateString('es-CL', { month: 'long' });
};

const getTipoColor = (tipoRaw: string) => {
  const tipo = (tipoRaw || '').toUpperCase().replace(/_/g, ' ').trim();
  
  if (tipo.includes('PREVENTIVA NEUMATICO') || tipo.includes('PREVENTIVO NEUMATICO') || tipo.includes('PREVENTIVA NEUMÁTICO') || tipo.includes('PREVENTIVO NEUMÁTICO')) {
     return 'bg-yellow-400 hover:bg-yellow-500 text-slate-950';
  }
  if (tipo.includes('CORRECTIVA NEUMATICO') || tipo.includes('CORRECTIVO NEUMATICO') || tipo.includes('CORRECTIVA NEUMÁTICO') || tipo.includes('CORRECTIVO NEUMÁTICO')) {
     return 'bg-red-700 hover:bg-red-800 text-white';
  }
  if (tipo.includes('EVALUATIVA NEUMATICO') || tipo.includes('EVALUATIVO NEUMATICO') || tipo.includes('EVALUATIVA NEUMÁTICO') || tipo.includes('EVALUATIVO NEUMÁTICO')) {
     return 'bg-[#c29153] hover:bg-[#b08044] text-white'; // marrón claro
  }
  
  if (tipo.includes('PREVENTIV')) {
     return 'bg-blue-600 hover:bg-blue-700 text-white';
  }
  if (tipo.includes('CORRECTIV')) {
     return 'bg-red-600 hover:bg-red-700 text-white';
  }
  if (tipo.includes('EVALUA') || tipo.includes('EVALUAC')) {
     return 'bg-green-600 hover:bg-green-700 text-white';
  }
  if (tipo.includes('INSPECC')) {
     return 'bg-purple-600 hover:bg-purple-700 text-white';
  }

  // legacy fallback support of basic types
  switch (tipoRaw) {
    case 'Preventiva': return 'bg-blue-600 hover:bg-blue-700 text-white';
    case 'Correctiva': return 'bg-red-600 hover:bg-red-700 text-white';
    case 'Evaluativa': return 'bg-green-600 hover:bg-green-700 text-white';
    case 'Preventiva Neumático': return 'bg-yellow-400 hover:bg-yellow-500 text-slate-950';
    case 'Correctiva Neumático': return 'bg-red-700 hover:bg-red-800 text-white';
    case 'Evaluativa Neumático': return 'bg-[#c29153] hover:bg-[#b08044] text-white';
    case 'Inspección': return 'bg-purple-600 hover:bg-purple-700 text-white';
    default: return 'bg-slate-500 hover:bg-slate-600 text-white';
  }
};

export default function PizarraProgramacion() {
  const navigate = useNavigate();
  const { personal, ordenesTrabajo, vehiculos, actualizarOrdenTrabajo } = useAppContext();
  
  const [viewMode, setViewMode] = useState<'Día' | 'Semana' | 'Mes'>('Mes');
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [draggedOt, setDraggedOt] = useState<string | null>(null);
  
  const [isNewOtModalOpen, setIsNewOtModalOpen] = useState(false);
  const [isColorCodeOpen, setIsColorCodeOpen] = useState(false);
  const [dayEventsModal, setDayEventsModal] = useState<{ isOpen: boolean, date: number | null, events: any[] }>({ isOpen: false, date: null, events: [] });
  
  const hours = Array.from({length: 11}, (_, i) => i + 8); // 8 to 18

  const [pendingOts, setPendingOts] = useState<OtMock[]>([]);
  const [mecanicos, setMecanicos] = useState<MecanicoMock[]>([]);

  // Sincronizar mecánicos y OTs desde el estado global/Supabase
  useEffect(() => {
    // 1. Filtrar mecánicos del personal y complementarlo con los asignados en las OTs
    const personalMecanicos = [...personal.filter(p => 
      p.isMecanico || 
      p.roleBadgeText?.toLowerCase().includes('mecanic') || 
      p.role?.toLowerCase().includes('mecanic') ||
      p.roleBadgeText?.toLowerCase().includes('mantenimiento') ||
      p.role?.toLowerCase().includes('mantenimiento') ||
      p.roleBadgeText?.toLowerCase().includes('taller') ||
      p.role?.toLowerCase().includes('taller') ||
      p.roleBadgeText?.toLowerCase().includes('tecnic') ||
      p.role?.toLowerCase().includes('tecnic') ||
      p.roleBadgeText?.toLowerCase().includes('técnic') ||
      p.role?.toLowerCase().includes('técnic')
    )];

    // Extraer todos los nombres de técnicos responsables asignados en las OTs
    const activeTechNames = new Set<string>(
      ordenesTrabajo
        .map(ot => ot.tecnicoResponsable)
        .filter((tr): tr is string => !!tr && tr.trim().length > 0)
    );

    activeTechNames.forEach(techNameStr => {
      const techName = techNameStr as string;
      const exists = personalMecanicos.some(p => (p.name as string).trim().toLowerCase() === techName.trim().toLowerCase());
      if (!exists) {
        const found = personal.find(p => (p.name as string).trim().toLowerCase() === techName.trim().toLowerCase());
        if (found) {
          personalMecanicos.push(found);
        } else {
          personalMecanicos.push({
            id: techName,
            name: techName,
            role: 'Técnico',
            roleBadgeText: 'Técnico',
            isMecanico: true,
            isConductor: false,
            initials: techName.substring(0, 2).toUpperCase()
          } as any);
        }
      }
    });

    // 2. Mapear todas las OTs activas al formato OtMock
    const mappedOtsList: OtMock[] = ordenesTrabajo.map(ot => {
      const veh = vehiculos.find(v => v.id === ot.vehiculoId);
      const patente = veh ? veh.patente : 'S/P';
      
      // Parsear Hora de Inicio
      let startHour = 8;
      if (ot.horaInicioProgramada) {
        const parts = ot.horaInicioProgramada.split(':');
        if (parts.length > 0) {
          const h = parseInt(parts[0], 10);
          if (!isNaN(h)) startHour = h;
        }
      }
      
      // Parsear Duración
      let duration = 2;
      if (ot.horaInicioProgramada && ot.horaTerminoProgramada) {
        const startParts = ot.horaInicioProgramada.split(':');
        const endParts = ot.horaTerminoProgramada.split(':');
        if (startParts.length > 0 && endParts.length > 0) {
          const sh = parseInt(startParts[0], 10);
          const eh = parseInt(endParts[0], 10);
          if (!isNaN(sh) && !isNaN(eh) && eh > sh) {
            duration = eh - sh;
          }
        }
      }
      
      // Check start times
      let isOverdue = false;
      let startedLate = false;
      let tiempoAplicacion = '';

      if (ot.fechaProgramada && ot.horaInicioProgramada) {
         try {
           const progDate = new Date(`${ot.fechaProgramada}T${ot.horaInicioProgramada.length === 5 ? ot.horaInicioProgramada + ':00' : ot.horaInicioProgramada}`);
           if (ot.inicio_proceso) {
             const initDate = new Date(ot.inicio_proceso);
             if (initDate > progDate) {
               startedLate = true;
             }
           } else {
             if (new Date() > progDate && (ot.estado === 'ABIERTA' || ot.estado === 'PROGRAMADA' || ot.estado === 'PENDIENTE')) {
               isOverdue = true;
               startedLate = true;
             }
           }
         } catch(e) {}
      }

      if (ot.inicio_proceso) {
         const initD = new Date(ot.inicio_proceso);
         tiempoAplicacion = `Inició: ${initD.toLocaleDateString('es-CL', {day: '2-digit', month: '2-digit'})} ${initD.toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}`;
      } else if (ot.estado === 'ABIERTA' || ot.estado === 'PROGRAMADA' || ot.estado === 'PENDIENTE') {
          if (startedLate) {
              tiempoAplicacion = '¡Atrasada sin iniciar!';
          } else {
              tiempoAplicacion = 'Pendiente inicio';
          }
      }

      let estado: OtMock['estado'] = 'PROGRAMADA';
      if (ot.estado === 'EN_PROCESO') estado = 'EN_PROCESO';
      else if (ot.estado === 'PAUSADA' || ot.estado === 'PAUSADA_MECANICO') estado = 'PAUSADA';
      else if (ot.estado === 'FINALIZADA' || ot.estado === 'TERMINADA' || ot.estado === 'CERRADA_POR_MECANICO') estado = 'TERMINADA';

      return {
        id: ot.id,
        folio: ot.folio,
        patente: patente,
        tipo: (ot.tipo || 'Inspección') as OTTipo,
        actividad: ot.observacionInicial || 'Orden de trabajo',
        startHour,
        duration,
        fechaProgramada: ot.fechaProgramada || undefined,
        isOverdue,
        estado,
        tiempoAplicacion,
        startedLate,
        progress: ot.estado === 'EN_PROCESO' ? 50 : (ot.estado === 'FINALIZADA' || ot.estado === 'TERMINADA' || ot.estado === 'CERRADA_POR_MECANICO') ? 100 : 0
      };
    });

    // 3. Asignar OTs a sus respectivos mecánicos
    const updatedMecanicos = personalMecanicos.map(p => {
      const idStr = p.id.toString();
      
      const assignedOts = mappedOtsList.filter(ot => {
        const dbOt = ordenesTrabajo.find(o => o.id === ot.id);
        if (!dbOt) return false;
        
        const tr = (dbOt.tecnicoResponsable || '').trim().toLowerCase();
        const pName = p.name.trim().toLowerCase();
        
        return tr && (tr === pName || pName.includes(tr) || tr.includes(pName)) && dbOt.fechaProgramada;
      });

      const prevMec = mecanicos.find(m => m.id === idStr);
      const isSelected = prevMec ? prevMec.selected : true;

      return {
        id: idStr,
        nombre: p.name,
        especialidad: p.especialidad || 'Mecánico General',
        selected: isSelected,
        ots: assignedOts
      };
    });

    setMecanicos(updatedMecanicos);

    // 4. Cualquier OT que no tenga mecánico asignado o no tenga fecha programada se considera pendiente (sin asignar)
    const assignedOtIds = new Set(updatedMecanicos.flatMap(m => m.ots.map(ot => ot.id)));
    const unassignedOts = mappedOtsList.filter(ot => !assignedOtIds.has(ot.id));

    setPendingOts(unassignedOts);

  }, [personal, ordenesTrabajo, vehiculos, currentDate]);

  const toggleMechanic = (id: string) => {
    setMecanicos(mecanicos.map(m => m.id === id ? { ...m, selected: !m.selected } : m));
  };

  const navigateDays = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setDraggedOt(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, mechanicId: string, hour: number, targetDateStr: string) => {
    e.preventDefault();
    const otId = e.dataTransfer.getData('text/plain');
    
    // Obtener la OT original
    const targetOt = ordenesTrabajo.find(ot => ot.id === otId);
    if (!targetOt) return;

    // Obtener el mecánico
    const targetMec = personal.find(p => p.id.toString() === mechanicId);
    if (!targetMec) return;

    // Calcular horas estructuradas
    const startHourStr = `${String(hour).padStart(2, '0')}:00`;
    const endHourStr = `${String(hour + 2).padStart(2, '0')}:00`;

    // Actualizar remotamente en Supabase
    const updatedOt = {
      ...targetOt,
      tecnicoResponsable: targetMec.name,
      fechaProgramada: targetDateStr,
      horaInicioProgramada: startHourStr,
      horaTerminoProgramada: endHourStr,
    };

    actualizarOrdenTrabajo(updatedOt);
    setDraggedOt(null);
  };

  const handleDropToPending = async (e: React.DragEvent) => {
    e.preventDefault();
    const otId = e.dataTransfer.getData('text/plain');
    
    const targetOt = ordenesTrabajo.find(ot => ot.id === otId);
    if (!targetOt) return;

    // Desasignar de mecánico y fecha
    const updatedOt = {
      ...targetOt,
      tecnicoResponsable: undefined,
      fechaProgramada: undefined,
      horaInicioProgramada: undefined,
      horaTerminoProgramada: undefined,
    };

    actualizarOrdenTrabajo(updatedOt);
    setDraggedOt(null);
  };

  const handleDropOnDay = async (e: React.DragEvent, dateObj: Date) => {
    e.preventDefault();
    const otId = e.dataTransfer.getData('text/plain');
    
    const targetOt = ordenesTrabajo.find(ot => ot.id === otId);
    if (!targetOt) return;

    const fechaProgramadaStr = formatDateStr(dateObj);

    let updatedOt = {
      ...targetOt,
      fechaProgramada: fechaProgramadaStr
    };

    // Si aún no tiene programado un técnico ni hora, asignar uno por defecto al primer mecánico activo
    if (!targetOt.tecnicoResponsable) {
      if (mecanicos.length > 0) {
        updatedOt.tecnicoResponsable = mecanicos[0].nombre;
        updatedOt.horaInicioProgramada = '08:00';
        updatedOt.horaTerminoProgramada = '10:00';
      } else {
        updatedOt.tecnicoResponsable = 'Técnico General';
        updatedOt.horaInicioProgramada = '08:00';
        updatedOt.horaTerminoProgramada = '10:00';
      }
    }

    actualizarOrdenTrabajo(updatedOt);
    setDraggedOt(null);
  };

  const getFormatDate = (date: Date) => {
    if (viewMode === 'Día') {
      const fullDateStr = date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      return fullDateStr.charAt(0).toUpperCase() + fullDateStr.slice(1);
    }
    if (viewMode === 'Semana') {
       const d = new Date(date);
       const day = d.getDay(); 
       const diff = d.getDate() - day + (day === 0 ? -6 : 1);
       const monday = new Date(d.setDate(diff));
       const sunday = new Date(monday);
       sunday.setDate(monday.getDate() + 6);
       
       const startStr = monday.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
       const endStr = sunday.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
       return `${startStr} al ${endStr}`;
    }
    return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  };

  // Generate Month Days dynamically
  const renderMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const startDayOfWeekIndex = (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1);

    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Today's comparison variables
    const today = new Date();
    const isSameMonthYearAsToday = today.getFullYear() === year && today.getMonth() === month;

    // Previous month padding
    for (let i = startDayOfWeekIndex - 1; i >= 0; i--) {
      const dayNum = lastDayOfPrevMonth - i;
      const dObj = new Date(year, month - 1, dayNum);
      days.push({ 
        day: dayNum, 
        dateObj: dObj, 
        isCurrentMonth: false, 
        isToday: false, 
        events: [] 
      });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dObj = new Date(year, month, i);
      const dateStr = formatDateStr(dObj);
      
      let dailyEvents: {title: string, color: string, isOverdue?: boolean, otId: string}[] = [];
      mecanicos.filter(m => m.selected).forEach(m => {
        m.ots.filter(ot => ot.fechaProgramada === dateStr).forEach(ot => {
          dailyEvents.push({
            title: `${ot.startHour}:00 ${ot.tipo} ${ot.patente}`,
            color: getTipoColor(ot.tipo),
            isOverdue: ot.isOverdue,
            otId: ot.id
          });
        });
      });

      // Sort by time
      dailyEvents.sort((a,b) => a.title.localeCompare(b.title));

      days.push({ 
        day: i, 
        dateObj: dObj, 
        isCurrentMonth: true, 
        isToday: isSameMonthYearAsToday && today.getDate() === i, 
        events: dailyEvents 
      });
    }

    // Next month padding
    const remaining = 42 - days.length; // 6 rows of 7
    for (let i = 1; i <= remaining; i++) {
      const dObj = new Date(year, month + 1, i);
      days.push({ 
        day: i, 
        dateObj: dObj, 
        isCurrentMonth: false, 
        isToday: false, 
        events: [] 
      });
    }

    const weekDaysInfo = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
           {weekDaysInfo.map(d => (
             <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 last:border-r-0 uppercase">
                {d}
             </div>
           ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-6 auto-rows-[1fr] overflow-hidden">
           {days.map((d, idx) => (
             <div key={idx} 
               onClick={d.isCurrentMonth ? () => {
                 setCurrentDate(d.dateObj);
                 setViewMode('Día');
               } : undefined}
               className={cn(
                 "border-r border-b border-slate-200 dark:border-slate-800 p-1 flex flex-col transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                 !d.isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/30",
                 d.isCurrentMonth && "cursor-pointer"
               )}
               onDragOver={handleDragOver}
               onDrop={d.isCurrentMonth ? (e) => handleDropOnDay(e, d.dateObj) : undefined}
             >
               <div className="flex justify-center mb-1">
                 <span 
                   className={cn(
                     "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mt-1 transition-all",
                     d.isToday ? "bg-blue-600 text-white font-bold shadow-sm" : (d.isCurrentMonth ? "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700" : "text-slate-400 dark:text-slate-600")
                   )}
                 >
                    {d.day}
                 </span>
               </div>
               <div className="flex-1 overflow-y-auto space-y-1.5 px-1 scrollbar-none pb-1">
                 {d.events.slice(0, 2).map((ev, i) => (
                    <div 
                      key={i} 
                      onClick={(e) => { e.stopPropagation(); navigate(`/flota/ordenes-trabajo/${ev.otId}`, { state: { fromPizarra: true } }); }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ev.otId)}
                      className={cn("text-[10px] px-1.5 py-1 rounded truncate cursor-pointer hover:opacity-90 flex items-center gap-1.5 font-medium shadow-sm transition-opacity",
                         ev.color,
                         ev.isOverdue ? "ring-2 ring-red-500" : "",
                         "text-white"
                      )}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white opacity-80 shrink-0"></div>
                      <span className="truncate">{ev.title}</span>
                    </div>
                 ))}
                 {d.events.length > 2 && (
                    <div 
                      onClick={(e) => { e.stopPropagation(); setDayEventsModal({ isOpen: true, date: d.day, events: d.events }); }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer pl-1 mt-1"
                    >
                      +{d.events.length - 2} más
                    </div>
                 )}
               </div>
             </div>
           ))}
                </div>
      </div>
    );
  };

  const renderWeekGrid = () => {
     const d = new Date(currentDate);
     const day = d.getDay(); 
     const diff = d.getDate() - day + (day === 0 ? -6 : 1);
     const monday = new Date(d.setDate(diff));
     
     const weekDaysInfo = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
     const weekDates = Array.from({length: 7}, (_, i) => {
        const nd = new Date(monday);
        nd.setDate(monday.getDate() + i);
        return {
           date: nd,
           label: weekDaysInfo[i],
           dayNum: nd.getDate()
        };
     });

     const activeMecanicos = mecanicos.filter(m => m.selected);

     return (
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
           <div className="flex border-b border-slate-200 dark:border-slate-800">
             <div className="w-16 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20"></div>
             {weekDates.map(wd => (
               <div key={wd.label} className="flex-1 min-w-[120px] py-2 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                 <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">{wd.label}</div>
                 <div className={cn("text-lg font-normal mb-1", isSameDay(wd.date, new Date()) ? "text-blue-600 font-bold" : "text-slate-800 dark:text-slate-200")}>
                    {wd.dayNum}
                 </div>
               </div>
             ))}
           </div>
           
           <div className="flex-1 overflow-y-auto overflow-x-auto relative flex">
              <div className="w-16 shrink-0 border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-20">
                 {hours.map(h => (
                   <div key={h} className="h-20 border-b border-slate-100 dark:border-slate-800 relative bg-white dark:bg-slate-900">
                     <span className="absolute -top-2.5 right-2 text-[10px] text-slate-500 font-medium">{h}:00</span>
                   </div>
                 ))}
              </div>
              {weekDates.map(wd => {
                 const dateStr = formatDateStr(wd.date);
                 return (
                 <div key={wd.label} className="flex-1 min-w-[120px] border-r border-slate-100 dark:border-slate-800 relative z-10">
                   {hours.map(h => (
                     <div key={h} className="h-20 border-b border-slate-100 dark:border-slate-800 border-dashed hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                          onDragOver={handleDragOver}
                          onDrop={(e) => {
                            if (activeMecanicos.length > 0) {
                              handleDrop(e, activeMecanicos[0].id, h, dateStr);
                            }
                          }}>
                     </div>
                   ))}
 
                   {activeMecanicos.map(m => 
                      m.ots.filter(ot => ot.fechaProgramada === dateStr).map(ot => {
                         const top = (ot.startHour! - 8) * 80;
                         const height = ot.duration! * 80;
                         return (
                           <div key={ot.id} onClick={() => navigate(`/flota/ordenes-trabajo/${ot.id}`, { state: { fromPizarra: true } })}
                                className={cn("absolute left-1 right-1 flex flex-col rounded p-1.5 text-white shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all hover:z-50", 
                                  getTipoColor(ot.tipo),
                                  ot.isOverdue && "ring-2 ring-red-500 animate-pulse border-2 border-red-500"
                                )}
                                style={{ top: `${top + 1}px`, height: `${height - 2}px` }}>
                              <div className="text-[9px] font-bold opacity-90 truncate flex justify-between gap-1 items-center">
                                 <span>{ot.folio}</span>
                                 {ot.estado && <span className={cn("px-1 rounded-sm text-[7px] uppercase tracking-wider font-bold truncate shrink-0 max-w-[60px]", 
                                   ot.estado === 'EN_PROCESO' ? "bg-white/20 text-white" :
                                   ot.estado === 'PAUSADA' ? "bg-amber-400/20 text-white" :
                                   ot.estado === 'PAUSADA_MECANICO' ? "bg-orange-500/80 text-white" :
                                   ot.estado === 'TERMINADA' ? "bg-emerald-500/80 text-white" : "bg-white/10 text-white"
                                 )}>{ot.estado.replace('_', ' ')}</span>}
                              </div>
                              <div className="text-[9px] leading-tight truncate mt-0.5 font-medium">{m.nombre}</div>
                              <div className="mt-auto flex flex-col gap-0.5">
                                 <div className="text-[9px] truncate opacity-90 flex justify-between items-center gap-1 w-full">
                                    <span className={'flex gap-0.5 items-center'}>
                                      {ot.startedLate && <span className="bg-red-500 text-white px-0.5 text-[7px] rounded" title="Inició atrasada">I</span>}
                                      {ot.finishedLate && <span className="bg-red-500 text-white px-0.5 text-[7px] rounded" title="Terminó atrasada">T</span>}
                                      <span>{ot.patente}</span>
                                    </span>
                                    <div className="flex items-center gap-0.5 shrink-0 text-[8px]">
                                      {ot.tiempoAplicacion && <span>{ot.tiempoAplicacion}</span>}
                                      {ot.tiempoAtraso && <span className="text-red-200">{ot.tiempoAtraso}</span>}
                                    </div>
                                 </div>
                                 {ot.progress !== undefined && (
                                   <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden flex">
                                      <div className={cn("h-full transition-all", ot.tiempoAtraso ? "bg-red-400" : "bg-white")} style={{width: `${Math.min(ot.progress, 100)}%`}}></div>
                                   </div>
                                 )}
                              </div>
                           </div>
                         )
                      })
                   )}
                 </div>
                 )
              })}
           </div>
        </div>
     );
  };

  const renderDayView = () => {
     const activeMecanicos = mecanicos.filter(m => m.selected);
     return (
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
           <div className="flex border-b border-slate-200 dark:border-slate-800">
             <div className="w-16 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-20"></div>
             {activeMecanicos.map(m => (
               <div key={m.id} className="flex-1 min-w-[150px] py-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                 <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate px-2">{m.nombre}</div>
                 <div className="text-[10px] text-slate-500 uppercase mt-0.5">{m.especialidad}</div>
               </div>
             ))}
             {activeMecanicos.length === 0 && (
                <div className="flex-1 py-4 text-center text-slate-500 text-sm">Seleccione mecánicos en el panel izquierdo.</div>
             )}
           </div>
           
           <div className="flex-1 overflow-y-auto overflow-x-auto relative flex">
              <div className="w-16 shrink-0 border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 z-20">
                 {hours.map(h => (
                   <div key={h} className="h-20 border-b border-slate-100 dark:border-slate-800 relative bg-white dark:bg-slate-900">
                     <span className="absolute -top-2.5 right-2 text-[10px] text-slate-500 font-medium">{h}:00</span>
                   </div>
                 ))}
              </div>
              {activeMecanicos.map(m => (
                 <div key={m.id} className="flex-1 min-w-[150px] border-r border-slate-100 dark:border-slate-800 relative z-10">
                   {hours.map(h => (
                     <div key={h} className="h-20 border-b border-slate-100 dark:border-slate-800 border-dashed hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, m.id, h, formatDateStr(currentDate))}>
                     </div>
                   ))}

                   {m.ots.filter(ot => ot.fechaProgramada === formatDateStr(currentDate)).map(ot => {
                      const top = (ot.startHour! - 8) * 80;
                      const height = ot.duration! * 80;
                      return (
                        <div key={ot.id} onClick={() => navigate(`/flota/ordenes-trabajo/${ot.id}`, { state: { fromPizarra: true } })}
                             draggable
                             onDragStart={(e) => handleDragStart(e, ot.id)}
                             className={cn("absolute left-1 right-1 rounded-lg p-2 text-white shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all flex flex-col", 
                               getTipoColor(ot.tipo),
                               ot.isOverdue && "ring-2 ring-red-500 border-2 border-red-500 animate-pulse"
                             )}
                             style={{ top: `${top + 2}px`, height: `${height - 4}px` }}>
                           <div className="text-[10px] font-bold opacity-90 leading-tight truncate flex justify-between">
                              <span>{ot.folio}</span>
                              {ot.isOverdue && <span className="text-white bg-red-600 px-1 rounded-sm text-[9px] uppercase tracking-wider flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5" /> Atrasada</span>}
                           </div>
                           <div className="font-semibold text-xs leading-tight mt-0.5">{ot.tipo}</div>
                           <div className="text-[10px] leading-tight mt-0.5">{ot.actividad}</div>
                           
                           <div className="mt-auto pt-1 text-[10px] font-medium opacity-90 flex flex-col gap-1 w-full">
                              <div className="flex items-center gap-1 truncate text-[9px] uppercase tracking-wider">
                                {ot.estado && <span className={cn("px-1 rounded-sm font-bold truncate", 
                                   ot.estado === 'EN_PROCESO' ? "bg-white/20 text-white" :
                                   ot.estado === 'PAUSADA' ? "bg-amber-400/20 text-white" :
                                   ot.estado === 'PAUSADA_MECANICO' ? "bg-orange-500/80 text-white" :
                                   ot.estado === 'TERMINADA' ? "bg-emerald-500/80 text-white" : "bg-white/10 text-white"
                                )}>{ot.estado.replace('_', ' ')}</span>}
                                {ot.tiempoAplicacion && <span>| {ot.tiempoAplicacion}</span>}
                                {ot.tiempoAtraso && <span className="text-red-200 font-bold">| {ot.tiempoAtraso}</span>}
                              </div>
                              <div className="flex items-center gap-1 truncate justify-between w-full">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span>{ot.startHour}:00 - {ot.startHour! + ot.duration!}:00</span>
                                </div>
                                <span className={'flex gap-1 items-center'}>
                                  {ot.startedLate && <span className="bg-red-500 text-white px-1 text-[8px] rounded uppercase" title="Inició atrasada">IA</span>}
                                  {ot.finishedLate && <span className="bg-red-500 text-white px-1 text-[8px] rounded uppercase" title="Terminó atrasada">TA</span>}
                                  <span className="font-bold">{ot.patente}</span>
                                </span>
                              </div>
                              {ot.progress !== undefined && (
                                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden flex mt-0.5">
                                   <div className={cn("h-full transition-all", ot.tiempoAtraso ? "bg-red-400" : "bg-white")} style={{width: `${Math.min(ot.progress, 100)}%`}}></div>
                                </div>
                              )}
                           </div>
                        </div>
                      )
                   })}
                 </div>
              ))}
           </div>
        </div>
     );
  };

  const atrasadasOts = ordenesTrabajo.filter(ot => {
    if (ot.estado !== 'PROGRAMADA') return false;
    const progDate = ot.fechaProgramada || ot.fechaCreacion;
    if (!progDate) return false;
    return new Date(progDate).getTime() < new Date().getTime();
  });

  return (
    <div className="h-[calc(100vh-4rem)] -mt-6 -mx-6 flex bg-white dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Left Sidebar (Google Calendar Style) */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
         <div className="p-4 pt-6">
            <Button variant="outline" onClick={() => setIsNewOtModalOpen(true)} className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full py-6 pr-4 pl-3 justify-start">
              <Plus className="w-6 h-6 mr-2 text-slate-500" />
              <span className="font-medium text-sm text-slate-700 dark:text-slate-200">Crear OT</span>
            </Button>
         </div>

         <div className="flex-1 overflow-y-auto scrollbar-thin px-4 space-y-6">
            
            {/* Nav Mini Calendar (Mock) */}
            <div>
               <div className="flex justify-between items-center mb-2 px-1">
                 <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">{getFormatDate(currentDate)}</span>
                 <div className="flex gap-1">
                   <button className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded p-1"><ChevronLeft className="w-4 h-4" /></button>
                   <button className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded p-1"><ChevronRight className="w-4 h-4" /></button>
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
                           d === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && viewMode !== 'Día' ? "ring-2 ring-blue-500 font-bold" : "" // Highlight today if not selected
                        )}
                      >
                        {d}
                      </span>
                    );
                 })}
               </div>
            </div>

            {/* Pending OTs (Drag and Drop List) */}
            <div
               onDragOver={handleDragOver}
               onDrop={handleDropToPending}
               className={cn("transition-colors rounded-lg", draggedOt && !pendingOts.find(ot => ot.id === draggedOt) ? "bg-slate-50 dark:bg-slate-800/50 outline-dashed outline-2 outline-slate-300 dark:outline-slate-700 p-1" : "")}
            >
               <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 px-1 flex items-center justify-between">
                 OTs Sin Asignar
                 <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full text-[10px]">{pendingOts.length}</span>
               </h3>
               <div className="space-y-2">
                 {pendingOts.map(ot => (
                    <div key={ot.id} draggable onDragStart={(e) => handleDragStart(e, ot.id)}
                         className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg text-xs shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors group">
                       <div className="font-bold text-slate-800 dark:text-slate-200 flex justify-between items-center mb-1 text-[11px]">
                         <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{ot.folio}</span>
                         {ot.estado && <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">{ot.estado}</span>}
                         <GripVertical className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                       </div>
                       <div className="font-semibold text-slate-700 dark:text-slate-300">{ot.tipo}</div>
                       <div className="text-slate-500 dark:text-slate-400 mt-0.5 truncate">{ot.actividad}</div>
                    </div>
                 ))}
                 {pendingOts.length === 0 && (
                    <div className="text-xs text-center text-slate-400 py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg mx-1">
                       Todo asignado
                    </div>
                 )}
               </div>
            </div>

            {/* Código de Colores / Tipos */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 pb-2">
               <button 
                 onClick={() => setIsColorCodeOpen(!isColorCodeOpen)}
                 className="flex items-center justify-between w-full text-left py-1.5 px-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors select-none group"
               >
                 <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 uppercase tracking-wider">
                   Color de OTs
                 </span>
                 {isColorCodeOpen ? (
                   <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform" />
                 ) : (
                   <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform" />
                 )}
               </button>
               
               {isColorCodeOpen && (
                  <div className="space-y-2.5 px-1 pt-3 pb-2 transition-all">
                     <div className="flex items-center gap-2.5 text-xs">
                        <span className="w-3 h-3 rounded bg-blue-600 block shrink-0 shadow-sm border border-blue-700/50"></span>
                        <span className="text-slate-600 dark:text-slate-300">Preventiva</span>
                     </div>
                     <div className="flex items-center gap-2.5 text-xs">
                        <span className="w-3 h-3 rounded bg-red-600 block shrink-0 shadow-sm border border-red-700/50"></span>
                        <span className="text-slate-600 dark:text-slate-300">Correctiva</span>
                     </div>
                     <div className="flex items-center gap-2.5 text-xs">
                        <span className="w-3 h-3 rounded bg-green-600 block shrink-0 shadow-sm border border-green-700/50"></span>
                        <span className="text-slate-600 dark:text-slate-300">Evaluativa</span>
                     </div>
                     <div className="flex items-center gap-2.5 text-xs">
                        <span className="w-3 h-3 rounded bg-purple-600 block shrink-0 shadow-sm border border-purple-700/50"></span>
                        <span className="text-slate-600 dark:text-slate-300">Inspección</span>
                     </div>
                     <div className="flex items-center gap-2.5 text-xs">
                        <span className="w-3 h-3 rounded bg-yellow-400 block shrink-0 shadow-sm border border-yellow-500/50"></span>
                        <span className="text-slate-600 dark:text-slate-300">Preventiva Neumáticos</span>
                     </div>
                     <div className="flex items-center gap-2.5 text-xs">
                        <span className="w-3 h-3 rounded bg-red-700 block shrink-0 shadow-sm border border-red-800/50"></span>
                        <span className="text-slate-600 dark:text-slate-300">Correctiva Neumáticos</span>
                     </div>
                     <div className="flex items-center gap-2.5 text-xs">
                        <span className="w-3 h-3 rounded bg-[#c29153] block shrink-0 shadow-sm border border-[#b08044]/50"></span>
                        <span className="text-slate-600 dark:text-slate-300">Evaluativa Neumáticos</span>
                     </div>
                  </div>
               )}
            </div>

            {/* Mechanics Filter */}
            <div className="pb-4">
               <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 mb-3 px-1">
                 Mis Mecánicos
               </h3>
               <div className="space-y-1">
                 {mecanicos.map(m => (
                    <label key={m.id} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800 px-1 py-1.5 rounded-md">
                       <div className={cn("w-4 h-4 rounded appearance-none border flex items-center justify-center transition-colors", 
                          m.selected ? "bg-blue-600 border-transparent" : "border-slate-300 dark:border-slate-600 bg-transparent group-hover:border-slate-400"
                       )}>
                         {m.selected && <Check className="w-3 h-3 text-white" />}
                       </div>
                       <input type="checkbox" className="hidden" checked={m.selected} onChange={() => toggleMechanic(m.id)} />
                       <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 truncate flex-1">{m.nombre}</span>
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
                 <button onClick={() => { const d = new Date(); d.setHours(12, 0, 0, 0); setCurrentDate(d); setViewMode('Día'); }} className="text-sm font-medium px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                   Hoy
                 </button>
                 <div className="flex gap-1">
                   <button onClick={() => navigateDays(viewMode === 'Mes' ? -30 : viewMode === 'Semana' ? -7 : -1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" /></button>
                   <button onClick={() => navigateDays(viewMode === 'Mes' ? 30 : viewMode === 'Semana' ? 7 : 1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" /></button>
                 </div>
                 <h2 className="text-xl lg:text-2xl font-normal text-slate-800 dark:text-slate-100 min-w-[140px] capitalize">
                   {getFormatDate(currentDate)}
                 </h2>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="relative hidden md:block">
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

               <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400"><CalendarIcon className="w-5 h-5" /></button>
            </div>
         </div>

         {atrasadasOts.length > 0 && (
           <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900 px-4 py-3 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
               <AlertTriangle className="w-5 h-5 flex-shrink-0" />
               <p className="text-sm font-medium">
                 {atrasadasOts.length} {atrasadasOts.length === 1 ? 'orden de trabajo programada está retrasada' : 'órdenes de trabajo programadas están retrasadas'} respecto a su hora de inicio.
               </p>
             </div>
             <button 
               onClick={() => {
                 setDayEventsModal({ isOpen: true, date: Date.now(), events: atrasadasOts });
               }}
               className="text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 px-3 py-1.5 rounded-md hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
             >
               Ver Detalles
             </button>
           </div>
         )}

         {/* Calendar Views */}
         <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30 dark:bg-slate-950/50">
            {viewMode === 'Mes' && renderMonthGrid()}
            {viewMode === 'Día' && renderDayView()}
            {viewMode === 'Semana' && renderWeekGrid()}
         </div>

      </div>

      {/* Modals */}
      <CrearOTModal isOpen={isNewOtModalOpen} onClose={() => setIsNewOtModalOpen(false)} />

      <Modal isOpen={dayEventsModal.isOpen} onClose={() => setDayEventsModal({ isOpen: false, date: null, events: [] })} title={`Programación del ${dayEventsModal.date} de ${getSpanishMonthName(currentDate)}`}>
         <div className="space-y-2">
            {dayEventsModal.events.map((ev, i) => (
               <div 
                 key={i} 
                 onClick={() => {
                   navigate(`/flota/ordenes-trabajo/${ev.otId}`, { state: { fromPizarra: true } });
                   setDayEventsModal({ isOpen: false, date: null, events: [] });
                 }}
                 className={cn("px-3 py-2 rounded-md cursor-pointer hover:opacity-90 flex flex-col gap-1 shadow-sm transition-opacity",
                    ev.color,
                    ev.isOverdue ? "ring-2 ring-red-500" : "",
                    "text-white"
                 )}
               >
                 <span className="font-semibold text-sm">{ev.title}</span>
               </div>
            ))}
            {dayEventsModal.events.length === 0 && (
               <p className="text-slate-500 text-sm py-4 text-center">No hay órdenes programadas para este día.</p>
            )}
         </div>
      </Modal>

    </div>
  );
}
