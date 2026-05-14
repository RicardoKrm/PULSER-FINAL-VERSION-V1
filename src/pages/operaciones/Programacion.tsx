import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Download, Filter, Search, GripVertical, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

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
  { id: 's1', dateStr: '2026-04-07', hour: 10, duration: 2, tipo: 'Interprovincial', origen: 'Antofagasta', destino: 'Valparaíso', timeStr: '09:00 AM', colorClass: 'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-100' },
  { id: 's2', dateStr: '2026-04-08', hour: 11, duration: 2, tipo: 'Carga Peligrosa', origen: 'Santiago', destino: 'Calama', timeStr: '10:00 AM', colorClass: 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200' },
  { id: 's3', dateStr: '2026-04-09', hour: 13, duration: 2, tipo: 'Personal', origen: 'Antofagasta', destino: 'Valparaíso', timeStr: '11:00 AM', colorClass: 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200' },
  { id: 's4', dateStr: '2026-04-10', hour: 14, duration: 2, tipo: 'Interprovincial', origen: 'Santiago', destino: 'Calama', timeStr: '12:00 PM', colorClass: 'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-100' },
  { id: 's5', dateStr: '2026-04-12', hour: 15, duration: 2, tipo: 'Personal', origen: 'Santiago', destino: 'Calama', timeStr: '02:00 PM', colorClass: 'bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200' },
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 to 19

export default function Programacion() {
  const [viewMode, setViewMode] = useState<'Día' | 'Semana' | 'Mes'>('Semana');
  const [currentDate, setCurrentDate] = useState<Date>(INIT_DATE);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [scheduled, setScheduled] = useState([...SCHEDULED_BLOCKS]);
  const [pendings, setPendings] = useState([...PENDING_SERVICES]);

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
        colorClass: 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-100'
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

  const currentMonthStr = `${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  return (
    <div className="w-full h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 shrink-0 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Panel de Programación
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Vista estilo Calendar, control Anticolisión y Drag & Drop.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 text-sm text-nowrap whitespace-nowrap">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
          <div className="flex bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            {['Día', 'Semana', 'Mes'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={cn(
                  "px-4 py-2 text-sm font-bold transition-colors",
                  viewMode === mode 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros y Navegación de Fecha */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mb-6 flex flex-wrap gap-4 shrink-0 justify-between items-end">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-full sm:w-48 relative">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1 dark:text-slate-400">Contrato</label>
            <select className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white">
              <option>Todos</option>
              <option>Minera Escondida</option>
              <option>Codelco</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1 dark:text-slate-400">Ruta (Origen/Destino)</label>
            <input 
              type="text" 
              placeholder="Ej: Santiago"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 h-[42px]">
           <button onClick={() => navigateDate(-1)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
             <ChevronLeft className="w-4 h-4" />
           </button>
           <button onClick={goToToday} className="px-3 py-1 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
             Hoy
           </button>
           <button onClick={() => navigateDate(1)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
             <ChevronRight className="w-4 h-4" />
           </button>
           <div className="px-3 border-l border-slate-200 dark:border-slate-700 flex items-center min-w-[140px] justify-center">
             <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">{currentMonthStr}</span>
           </div>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* Left Sidebar - Pending Services */}
        <div className="w-full lg:w-72 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">Servicios Pendientes</h2>
          </div>
          <div className="p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {pendings.map((servicio) => (
              <div 
                key={servicio.id}
                draggable
                onDragStart={(e) => handleDragStart(e, servicio, 'pending')}
                className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex items-start gap-2"
              >
                <div className="mt-1 cursor-grab">
                  <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{servicio.tipo}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{servicio.origen} - {servicio.destino}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">Arrastrar para programar</p>
                </div>
              </div>
            ))}
            {pendings.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm font-medium">
                No hay servicios pendientes
              </div>
            )}
          </div>
        </div>

        {/* Right Area - Calendar Board */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden min-w-0">
          
          <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950/50 relative scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            
            {/* VISTA DÍA Y SEMANA (Grid por horas) */}
            {(viewMode === 'Día' || viewMode === 'Semana') && (
              <div className="min-w-[600px] h-full flex flex-col">
                {/* Calendar Header */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 sticky top-0 z-20">
                  <div className="w-16 shrink-0 border-r border-slate-200 dark:border-slate-800"></div>
                  {visibleDays.map((day, idx) => {
                     const isToday = formatDateString(day) === formatDateString(new Date());
                     return (
                      <div key={idx} className="flex-1 text-center py-3 border-r border-slate-200 dark:border-slate-800 last:border-r-0 flex flex-col items-center justify-center gap-1">
                        <span className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">{DAYS_ES[day.getDay() === 0 ? 6 : day.getDay() - 1]}</span>
                        <span className={cn(
                          "bg-transparent w-8 h-8 flex items-center justify-center rounded-full text-lg font-black text-slate-900 dark:text-white",
                          isToday && "bg-indigo-600 text-white dark:text-white shadow-md shadow-indigo-600/20"
                        )}>
                          {day.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 flex relative">
                  {/* Time Axis */}
                  <div className="w-16 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sticky left-0 z-10">
                    {HOURS.map((hour) => (
                      <div key={hour} className="h-24 border-b border-slate-200 dark:border-slate-800 last:border-b-0 relative flex items-start justify-end px-2 py-1">
                        <span className="text-[10px] font-bold text-slate-400">{hour}:00</span>
                      </div>
                    ))}
                  </div>

                  {/* Day Columns */}
                  <div className="flex-1 flex relative bg-white dark:bg-slate-900">
                    {visibleDays.map((day) => {
                      const dateStr = formatDateString(day);
                      return (
                        <div key={dateStr} className="flex-1 border-r border-slate-200 dark:border-slate-800 last:border-r-0 relative flex flex-col">
                          {HOURS.map((hour) => (
                            <div 
                              key={`${dateStr}-${hour}`} 
                              className="h-24 border-b border-slate-200/50 dark:border-slate-800/50 border-dashed relative group"
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, dateStr, hour)}
                            >
                              <div className="absolute inset-0 hidden group-hover:block bg-indigo-50/50 dark:bg-indigo-900/10 z-0"></div>
                            </div>
                          ))}
                        </div>
                      );
                    })}

                    {/* Scheduled Blocks Render */}
                    {scheduled.map((block) => {
                      const blockDate = new Date(block.dateStr + 'T00:00:00'); // Force local interpretation correctly
                      const dayIndex = visibleDays.findIndex(d => formatDateString(d) === block.dateStr);
                      if (dayIndex === -1) return null; // Not in visible range

                      const topOffset = (block.hour - 8) * 6; // 6rem (96px) per hour 
                      const heightOffset = block.duration * 6;

                      return (
                        <div 
                          key={block.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, block, 'scheduled')}
                          onMouseEnter={(e) => handleMouseEnterTooltip(e, block)}
                          onMouseLeave={handleMouseLeaveTooltip}
                          className={cn(
                            "absolute rounded-lg border p-2 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow overflow-hidden z-10",
                            block.colorClass
                          )}
                          style={{
                            top: `calc(${topOffset}rem + 4px)`,
                            left: `calc(${(dayIndex / visibleDays.length) * 100}% + 4px)`,
                            width: `calc(${100 / visibleDays.length}% - 8px)`,
                            height: `calc(${heightOffset}rem - 8px)`
                          }}
                        >
                          <h4 className="font-bold text-xs mb-1 truncate">{block.tipo}</h4>
                          <p className="text-[10px] opacity-80 leading-tight truncate">{block.origen} - {block.destino}</p>
                          <div className="flex items-center gap-1 mt-2 opacity-70">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-bold">{block.timeStr}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* VISTA MES (Grid por días sin horas) */}
            {viewMode === 'Mes' && (
              <div className="min-w-[600px] h-full flex flex-col bg-slate-50 dark:bg-slate-900">
                {/* Headers Semana Mes */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 sticky top-0 z-20">
                  {DAYS_ES.map((dayName, idx) => (
                    <div key={idx} className="flex-1 text-center py-3 border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                      <span className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">{dayName}</span>
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

                      return (
                        <div 
                          key={dateStr}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, dateStr)}
                          className={cn(
                            "border-r border-b border-slate-200 dark:border-slate-800 relative p-1.5 overflow-hidden group hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col",
                            !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600"
                          )}
                        >
                          <div className="flex justify-end mb-1">
                            <span className={cn(
                              "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                              isToday 
                                ? "bg-indigo-600 text-white" 
                                : (isCurrentMonth ? "text-slate-700 dark:text-slate-300" : "text-opacity-50")
                            )}>
                              {day.getDate()}
                            </span>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none">
                            {dayBlocks.map(block => (
                               <div 
                                 key={block.id}
                                 draggable
                                 onDragStart={(e) => handleDragStart(e, block, 'scheduled')}
                                 onMouseEnter={(e) => handleMouseEnterTooltip(e, block)}
                                 onMouseLeave={handleMouseLeaveTooltip}
                                 className={cn(
                                   "text-[9px] font-bold px-1.5 py-1 rounded border truncate cursor-grab",
                                   block.colorClass,
                                   !isCurrentMonth && "opacity-60"
                                 )}
                               >
                                 {block.timeStr.split(' ')[0]} {block.tipo}
                               </div>
                            ))}
                          </div>
                        </div>
                      )
                   })}
                 </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Global Tooltip */}
      <AnimatePresence>
        {hoveredTooltip && (
          <motion.div 
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] w-64 flex-col bg-slate-900 border border-slate-700 text-left text-white rounded-2xl shadow-2xl pointer-events-none overflow-hidden"
            style={{
              left: Math.min(hoveredTooltip.x, window.innerWidth - 270), // Prevent going off-screen right
              top: hoveredTooltip.y + 10 + 140 > window.innerHeight 
                ? hoveredTooltip.y - hoveredTooltip.height - 145 // Show above block if near bottom
                : hoveredTooltip.y + 5 // Show below block otherwise
            }}
          >
            <div className="p-4">
              <h5 className="font-black text-sm mb-3 text-white">{hoveredTooltip.block.tipo}</h5>
              <div className="space-y-1.5">
                 <p className="text-xs text-slate-300 flex justify-between"><span className="text-slate-400">Origen:</span> <span className="font-semibold text-white ml-2 text-right">{hoveredTooltip.block.origen}</span></p>
                 <p className="text-xs text-slate-300 flex justify-between"><span className="text-slate-400">Destino:</span> <span className="font-semibold text-white ml-2 text-right">{hoveredTooltip.block.destino}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-indigo-900/40 border-t border-slate-700/50">
               <Clock className="w-4 h-4 text-indigo-300 shrink-0" />
               <span className="text-xs font-bold text-indigo-100">{hoveredTooltip.block.timeStr} • Duración: {hoveredTooltip.block.duration}h</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
