import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ChevronLeft, ChevronRight, Clock, GripVertical, Search, AlertCircle, Plus, Calendar as CalendarIcon, Check, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

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
  isOverdue?: boolean;
  estado?: 'EN_PROCESO' | 'PAUSADA' | 'PAUSADA_MECANICO' | 'TERMINADA' | 'PROGRAMADA';
  tiempoAplicacion?: string;
  tiempoAtraso?: string;
}

interface MecanicoMock {
  id: string;
  nombre: string;
  especialidad: string;
  selected: boolean;
  ots: OtMock[];
}

const getTipoColor = (tipo: string) => {
  switch (tipo) {
    case 'Preventiva': return 'bg-blue-500 hover:bg-blue-600';
    case 'Correctiva': return 'bg-red-500 hover:bg-red-600';
    case 'Evaluativa': return 'bg-emerald-500 hover:bg-emerald-600';
    case 'Preventiva Neumático': return 'bg-amber-400 hover:bg-amber-500';
    case 'Correctiva Neumático': return 'bg-orange-500 hover:bg-orange-600';
    case 'Evaluativa Neumático': return 'bg-indigo-500 hover:bg-indigo-600';
    case 'Inspección': return 'bg-purple-500 hover:bg-purple-600';
    default: return 'bg-slate-500 hover:bg-slate-600';
  }
};

export default function PizarraProgramacion() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'Día' | 'Semana' | 'Mes'>('Mes');
  const [currentDate, setCurrentDate] = useState(new Date('2026-05-14T12:00:00'));
  const [draggedOt, setDraggedOt] = useState<string | null>(null);
  
  const [isNewOtModalOpen, setIsNewOtModalOpen] = useState(false);
  const [dayEventsModal, setDayEventsModal] = useState<{ isOpen: boolean, date: number | null, events: any[] }>({ isOpen: false, date: null, events: [] });
  
  const hours = Array.from({length: 11}, (_, i) => i + 8); // 8 to 18

  const [pendingOts, setPendingOts] = useState<OtMock[]>([
    { id: 'ot4', folio: 'OT-004', tipo: 'Preventiva', patente: 'EF-GH-34', actividad: 'Revisión técnica', estado: 'PROGRAMADA' },
    { id: 'ot5', folio: 'OT-005', tipo: 'Correctiva', patente: 'AB-CD-12', actividad: 'Cambio de aceite transmisión', estado: 'PROGRAMADA' },
    { id: 'ot6', folio: 'OT-006', tipo: 'Correctiva', patente: 'XY-ZW-99', actividad: 'Reparación de aire acondicionado', estado: 'PROGRAMADA' },
    { id: 'ot7', folio: 'OT-007', tipo: 'Preventiva', patente: 'KL-NM-11', actividad: 'Alineación y balanceo', estado: 'PROGRAMADA' },
  ]);

  const [mecanicos, setMecanicos] = useState<MecanicoMock[]>([
    {
      id: 'm1', nombre: 'Carlos Ruiz', especialidad: 'Mecánico General', selected: true,
      ots: [
        { id: 'ot1', folio: 'OT-001', tipo: 'Preventiva', patente: 'AB-CD-12', actividad: 'Mantenimiento preventivo.', startHour: 8, duration: 2, dayOffset: 0, estado: 'EN_PROCESO', tiempoAplicacion: '01:30:00', tiempoAtraso: '+ 30 min', isOverdue: true },
        { id: 'ot8', folio: 'OT-008', tipo: 'Correctiva', patente: 'EF-GH-34', actividad: 'Cambio pastillas freno.', startHour: 10.5, duration: 1.5, dayOffset: 0, estado: 'PROGRAMADA' },
        { id: 'ot9', folio: 'OT-009', tipo: 'Preventiva', patente: 'XX-YY-01', actividad: 'Pauta Mantenimiento 10K', startHour: 14, duration: 2, dayOffset: -1, estado: 'TERMINADA', tiempoAplicacion: '01:50:00' },
        { id: 'ot10', folio: 'OT-010', tipo: 'Correctiva', patente: 'ZZ-WW-02', actividad: 'Reparación motor', startHour: 8, duration: 4, dayOffset: 1, estado: 'PAUSADA_MECANICO', tiempoAplicacion: '02:00:00', tiempoAtraso: '+ 1 hr' },
        { id: 'ot11', folio: 'OT-011', tipo: 'Preventiva', patente: 'ZZ-WW-02', actividad: 'Revisión fluidos', startHour: 14, duration: 1, dayOffset: 1, estado: 'PROGRAMADA' }
      ]
    },
    {
      id: 'm2', nombre: 'Pedro Gómez', especialidad: 'Electricista', selected: true,
      ots: [
        { id: 'ot2', folio: 'OT-002', tipo: 'Preventiva', patente: 'AB-CD-12', actividad: 'Revisión sist. eléctrico.', startHour: 9, duration: 2, dayOffset: 0, estado: 'EN_PROCESO', tiempoAplicacion: '00:45:00' },
        { id: 'ot12', folio: 'OT-012', tipo: 'Correctiva', patente: 'XY-AA-10', actividad: 'Cambio de alternador', startHour: 12, duration: 2.5, dayOffset: 0, estado: 'PAUSADA', tiempoAplicacion: '01:10:00', isOverdue: true },
        { id: 'ot13', folio: 'OT-013', tipo: 'Preventiva', patente: 'AB-CD-12', actividad: 'Chequeo baterías', startHour: 15, duration: 1, dayOffset: -1, estado: 'TERMINADA', tiempoAplicacion: '00:55:00' },
        { id: 'ot14', folio: 'OT-014', tipo: 'Preventiva', patente: 'ZZ-KK-88', actividad: 'Revisión luces', startHour: 10, duration: 1, dayOffset: 1, estado: 'PROGRAMADA' },
        { id: 'ot15', folio: 'OT-015', tipo: 'Correctiva', patente: 'XY-AA-11', actividad: 'Diagnóstico escáner', startHour: 12, duration: 1.5, dayOffset: 1, estado: 'PROGRAMADA' }
      ]
    },
    {
      id: 'm3', nombre: 'Luis Silva', especialidad: 'Lubricador', selected: true,
      ots: [
        { id: 'ot3', folio: 'OT-003', tipo: 'Correctiva', patente: 'EF-GH-34', actividad: 'Cambio aceite motor', startHour: 8, duration: 1.5, dayOffset: -1, estado: 'TERMINADA', tiempoAplicacion: '01:20:00' },
        { id: 'ot16', folio: 'OT-016', tipo: 'Preventiva', patente: 'AB-CD-12', actividad: 'Engrase general', startHour: 8, duration: 2, dayOffset: 0, estado: 'EN_PROCESO', tiempoAplicacion: '00:30:00' },
        { id: 'ot17', folio: 'OT-017', tipo: 'Preventiva', patente: 'EF-GH-34', actividad: 'Revisión niveles', startHour: 11, duration: 1, dayOffset: 0, estado: 'PROGRAMADA' },
        { id: 'ot18', folio: 'OT-018', tipo: 'Correctiva', patente: 'KL-NM-11', actividad: 'Cambio filtro aire', startHour: 14, duration: 1.5, dayOffset: 0, estado: 'PAUSADA', tiempoAplicacion: '00:20:00' },
      ]
    },
    {
      id: 'm4', nombre: 'M. Santibáñez', especialidad: 'Esp. Diésel', selected: true,
      ots: [
        { id: 'ot19', folio: 'OT-019', tipo: 'Correctiva', patente: 'TR-CK-55', actividad: 'Reparación inyectores', startHour: 9, duration: 3, dayOffset: 0, estado: 'EN_PROCESO', tiempoAplicacion: '02:15:00', isOverdue: true, tiempoAtraso: '+ 45 min' },
        { id: 'ot20', folio: 'OT-020', tipo: 'Preventiva', patente: 'TR-CK-99', actividad: 'Afinamiento diésel', startHour: 14, duration: 2.5, dayOffset: -1, estado: 'TERMINADA', tiempoAplicacion: '02:30:00' },
        { id: 'ot21', folio: 'OT-021', tipo: 'Correctiva', patente: 'TR-CK-55', actividad: 'Cambio turbo', startHour: 10, duration: 4, dayOffset: 1, estado: 'PROGRAMADA' }
      ]
    }
  ]);

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

  const handleDrop = (e: React.DragEvent, mechanicId: string, hour: number, dayOffset: number = 0) => {
    e.preventDefault();
    const otId = e.dataTransfer.getData('text/plain');
    
    // Simplification for the mockup
    const pendingOt = pendingOts.find(ot => ot.id === otId);
    if (pendingOt) {
      setPendingOts(pendingOts.filter(ot => ot.id !== otId));
      setMecanicos(mecanicos.map(m => m.id === mechanicId ? {
        ...m, ots: [...m.ots, { ...pendingOt, startHour: hour, duration: 2, dayOffset }]
      } : m));
    } else {
       // Moving an assigned OT to another mechanic or hour
       let movedOt: OtMock | undefined;
       const newMecanicos = mecanicos.map(m => {
          const found = m.ots.find(ot => ot.id === otId);
          if (found) {
             movedOt = found;
             return { ...m, ots: m.ots.filter(ot => ot.id !== otId) };
          }
          return m;
       });

       if (movedOt) {
          setMecanicos(newMecanicos.map(m => m.id === mechanicId ? {
            ...m, ots: [...m.ots, { ...movedOt, startHour: hour, dayOffset }]
          } : m));
       }
    }
    setDraggedOt(null);
  };

  const handleDropToPending = (e: React.DragEvent) => {
    e.preventDefault();
    const otId = e.dataTransfer.getData('text/plain');
    
    if (pendingOts.find(ot => ot.id === otId)) return;

    let movedOt: OtMock | undefined;
    const newMecanicos = mecanicos.map(m => {
       const found = m.ots.find(ot => ot.id === otId);
       if (found) {
          movedOt = found;
          return { ...m, ots: m.ots.filter(ot => ot.id !== otId) };
       }
       return m;
    });

    if (movedOt) {
       setMecanicos(newMecanicos);
       setPendingOts([{ ...movedOt, startHour: undefined, duration: undefined, dayOffset: undefined }, ...pendingOts]);
    }
    setDraggedOt(null);
  };

  const handleDropOnDay = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    const otId = e.dataTransfer.getData('text/plain');
    const dayOffset = dayIndex - 14; // specific to this mock

    const pendingOt = pendingOts.find(ot => ot.id === otId);
    if (pendingOt) {
      setPendingOts(pendingOts.filter(ot => ot.id !== otId));
      // Assign to the first selected mechanic as default 
      const firstMec = mecanicos.find(m => m.selected) || mecanicos[0];
      setMecanicos(mecanicos.map(m => m.id === firstMec.id ? {
        ...m, ots: [...m.ots, { ...pendingOt, startHour: 8, duration: 2, dayOffset }]
      } : m));
    } else {
       // Re-scheduling already placed OT to a different day
       setMecanicos(mecanicos.map(m => {
          const found = m.ots.find(ot => ot.id === otId);
          if (found) {
             return { ...m, ots: m.ots.map(ot => ot.id === otId ? {...ot, dayOffset} : ot) };
          }
          return m;
       }));
    }
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

  // Generate Month Days (mock logic for May 2026)
  const renderMonthGrid = () => {
    const startDayOfWeek = 4; // May 1, 2026 is Friday (0=Mon, 1=Tue... 4=Fri)
    const daysInMonth = 31;
    const days = [];
    
    // Previous month padding
    for(let i=0; i<startDayOfWeek; i++) {
       days.push({ day: 27 + i, isCurrentMonth: false, events: [] });
    }
    
    // Current month
    for(let i=1; i<=daysInMonth; i++) {
       const dayOffset = i - 14;
       let dailyEvents: {title: string, color: string, isOverdue?: boolean, otId: string}[] = [];
       mecanicos.filter(m => m.selected).forEach(m => {
          m.ots.filter(ot => ot.dayOffset === dayOffset).forEach(ot => {
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
       
       days.push({ day: i, isCurrentMonth: true, isToday: i === 14, events: dailyEvents });
    }

    // Next month padding
    const remaining = 42 - days.length; // 6 rows of 7
    for(let i=1; i<=remaining; i++) {
        days.push({ day: i, isCurrentMonth: false, events: [] });
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
                 const newDate = new Date(currentDate);
                 newDate.setDate(d.day);
                 setCurrentDate(newDate);
                 setViewMode('Día');
               } : undefined}
               className={cn(
                 "border-r border-b border-slate-200 dark:border-slate-800 p-1 flex flex-col transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                 !d.isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/30",
                 d.isCurrentMonth && "cursor-pointer"
               )}
               onDragOver={handleDragOver}
               onDrop={d.isCurrentMonth ? (e) => handleDropOnDay(e, d.day) : undefined}
             >
               <div className="flex justify-center mb-1">
                 <span 
                   className={cn(
                     "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mt-1 transition-all",
                     d.isToday ? "bg-blue-600 text-white" : (d.isCurrentMonth ? "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700" : "text-slate-400 dark:text-slate-600")
                   )}
                 >
                   {d.day}
                 </span>
               </div>
               <div className="flex-1 overflow-y-auto space-y-1.5 px-1 scrollbar-none pb-1">
                 {d.events.slice(0, 2).map((ev, i) => (
                    <div 
                      key={i} 
                      onClick={(e) => { e.stopPropagation(); navigate(`/flota/ordenes-trabajo/${ev.otId}`); }}
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
                 <div className={cn("text-lg font-normal mb-1", wd.date.getDate() === new Date('2026-05-14T12:00:00').getDate() ? "text-blue-600 font-bold" : "text-slate-800 dark:text-slate-200")}>
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
                 const dayOffset = wd.date.getDate() - 14; 
                 return (
                 <div key={wd.label} className="flex-1 min-w-[120px] border-r border-slate-100 dark:border-slate-800 relative z-10">
                   {hours.map(h => (
                     <div key={h} className="h-20 border-b border-slate-100 dark:border-slate-800 border-dashed hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                     </div>
                   ))}

                   {activeMecanicos.map(m => 
                      m.ots.filter(ot => ot.dayOffset === dayOffset).map(ot => {
                         const top = (ot.startHour! - 8) * 80;
                         const height = ot.duration! * 80;
                         return (
                           <div key={ot.id} onClick={() => navigate(`/flota/ordenes-trabajo/${ot.id}`)}
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
                              <div className="mt-auto text-[9px] truncate opacity-90 flex justify-between items-center gap-1">
                                 <span>{ot.patente}</span>
                                 <div className="flex items-center gap-1">
                                   {ot.tiempoAplicacion && <span>{ot.tiempoAplicacion}</span>}
                                   {ot.tiempoAtraso && <span className="text-red-200">{ot.tiempoAtraso}</span>}
                                 </div>
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
                          onDrop={(e) => handleDrop(e, m.id, h, currentDate.getDate() - 14)}>
                     </div>
                   ))}

                   {m.ots.filter(ot => ot.dayOffset === (currentDate.getDate() - 14)).map(ot => {
                      const top = (ot.startHour! - 8) * 80;
                      const height = ot.duration! * 80;
                      return (
                        <div key={ot.id} onClick={() => navigate(`/flota/ordenes-trabajo/${ot.id}`)}
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
                                <span className="font-bold">{ot.patente}</span>
                              </div>
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
                           d === 14 && viewMode !== 'Día' ? "ring-2 ring-blue-500 font-bold" : "" // Highlight today if not selected
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
                 <button onClick={() => { setCurrentDate(new Date('2026-05-14T12:00:00')); setViewMode('Día'); }} className="text-sm font-medium px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
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

         {/* Calendar Views */}
         <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30 dark:bg-slate-950/50">
            {viewMode === 'Mes' && renderMonthGrid()}
            {viewMode === 'Día' && renderDayView()}
            {viewMode === 'Semana' && renderWeekGrid()}
         </div>

      </div>

      {/* Modals */}
      <Modal isOpen={isNewOtModalOpen} onClose={() => setIsNewOtModalOpen(false)} title="Crear Orden de Trabajo">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Crea una nueva Orden de Trabajo para programarla en la pizarra.
          </p>
          <div className="space-y-3">
             <div className="space-y-1">
               <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Vehículo</label>
               <select className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                 <option>LDPJ-99 (MB Sprinter)</option>
                 <option>KHYT-22 (Ford Transit)</option>
                 <option>MNQP-15 (Peugeot Boxer)</option>
               </select>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Fecha Programada</label>
                 <input type="date" className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tipo Mantenimiento</label>
                 <select className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                   <option>Preventiva</option>
                   <option>Correctiva</option>
                   <option>Evaluativa</option>
                   <option>Preventiva Neumático</option>
                   <option>Correctiva Neumático</option>
                   <option>Evaluativa Neumático</option>
                   <option>Inspección</option>
                 </select>
               </div>
             </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsNewOtModalOpen(false)}>Cancelar</Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => setIsNewOtModalOpen(false)}>Crear OT</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={dayEventsModal.isOpen} onClose={() => setDayEventsModal({ isOpen: false, date: null, events: [] })} title={`Programación del ${dayEventsModal.date} de Mayo`}>
         <div className="space-y-2">
            {dayEventsModal.events.map((ev, i) => (
               <div 
                 key={i} 
                 onClick={() => {
                   navigate(`/flota/ordenes-trabajo/${ev.otId}`);
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
