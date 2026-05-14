import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ChevronLeft, ChevronRight, Clock, GripVertical, Download, Search, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface OtMock {
  id: string;
  folio: string;
  patente: string;
  tipo: 'Preventiva' | 'Correctiva' | 'Inspección';
  actividad: string;
  startHour?: number;
  duration?: number;
  isOverdue?: boolean;
}

interface MecanicoMock {
  id: string;
  nombre: string;
  especialidad: string;
  ots: OtMock[];
}

export default function PizarraProgramacion() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'Día' | 'Semana' | 'Mes'>('Día');
  const [currentDate, setCurrentDate] = useState(new Date('2026-05-14'));
  const [draggedOt, setDraggedOt] = useState<string | null>(null);
  
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  const [pendingOts, setPendingOts] = useState<OtMock[]>([
    { id: 'p1', folio: 'OT-1045', tipo: 'Preventiva', patente: 'LDPJ-99', actividad: 'Mantenimiento A' },
    { id: 'p2', folio: 'OT-1046', tipo: 'Correctiva', patente: 'KHYT-22', actividad: 'Cambio de Alternador' },
    { id: 'p3', folio: 'OT-1047', tipo: 'Correctiva', patente: 'MNQP-15', actividad: 'Revisión Frenos' },
    { id: 'p4', folio: 'OT-1048', tipo: 'Preventiva', patente: 'FRTY-12', actividad: 'Lubricación General' },
    { id: 'p5', folio: 'OT-1049', tipo: 'Inspección', patente: 'BVCX-33', actividad: 'Diagnóstico Emisiones' },
  ]);

  const [mecanicos, setMecanicos] = useState<MecanicoMock[]>([
    {
      id: 'm1',
      nombre: 'Carlos Ruiz',
      especialidad: 'Mecánico General',
      ots: [
        { id: 'e1', folio: 'OT-1040', tipo: 'Preventiva', patente: 'HGTY-88', actividad: 'Mantenimiento B', startHour: 10, duration: 2.5 }
      ]
    },
    {
      id: 'm2',
      nombre: 'Pedro Gómez',
      especialidad: 'Electricista',
      ots: [
        { id: 'e2', folio: 'OT-1042', tipo: 'Correctiva', patente: 'PLKX-10', actividad: 'Falla Sist. Eléctrico', startHour: 11, duration: 3, isOverdue: true }
      ]
    },
    {
      id: 'm3',
      nombre: 'Luis Silva',
      especialidad: 'Lubricador',
      ots: [
        { id: 'e3', folio: 'OT-1043', tipo: 'Preventiva', patente: 'VBNM-55', actividad: 'Cambio Aceite', startHour: 14, duration: 2.5 }
      ]
    },
    {
      id: 'm4',
      nombre: 'M. Santibáñez',
      especialidad: 'Esp. Diésel',
      ots: [
        { id: 'e4', folio: 'OT-1044', tipo: 'Preventiva', patente: 'DFGH-21', actividad: 'Inyectores', startHour: 9, duration: 2 }
      ]
    }
  ]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedOt(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, mechanicId: string, hour: number) => {
    e.preventDefault();
    const otId = e.dataTransfer.getData('text/plain');
    
    const pendingOt = pendingOts.find(ot => ot.id === otId);
    if (pendingOt) {
      setPendingOts(pendingOts.filter(ot => ot.id !== otId));
      setMecanicos(mecanicos.map(m => {
        if (m.id === mechanicId) {
          return {
            ...m,
            ots: [...m.ots, { ...pendingOt, startHour: hour, duration: 2 }]
          };
        }
        return m;
      }));
    } else {
      // Re-scheduling already placed OTs
      setMecanicos(mecanicos.map(m => {
        const found = m.ots.find(ot => ot.id === otId);
        if (found && m.id === mechanicId) {
           return { ...m, ots: m.ots.map(ot => ot.id === otId ? {...ot, startHour: hour} : ot) };
        } else if (found) {
           return { ...m, ots: m.ots.filter(ot => ot.id !== otId) };
        }
        return m;
      }).map(m => {
        // If moved to a different mechanic
        const isTarget = m.id === mechanicId;
        const previousMechanic = mecanicos.find(pm => pm.ots.some(ot => ot.id === otId));
        if (isTarget && previousMechanic && previousMechanic.id !== mechanicId) {
             const otToMove = previousMechanic.ots.find(ot => ot.id === otId)!;
             return { ...m, ots: [...m.ots, { ...otToMove, startHour: hour }] };
        }
        return m;
      }));
    }
    setDraggedOt(null);
  };

  const navigateDays = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d);
  };

  const formatTime = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getEventStyles = (type: string) => {
    switch (type) {
      case 'Preventiva': return 'bg-[#FEF5D9] border-[#FDE08B] text-[#936B00]';
      case 'Correctiva': return 'bg-[#E3EFFF] border-[#A8CFFF] text-[#004A99]';
      case 'Inspección': return 'bg-[#F1F5F9] border-[#CBD5E1] text-[#334155]';
      default: return 'bg-slate-100 border-slate-200 text-slate-800';
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-slate-50/50 dark:bg-slate-950 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Panel de Programación</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Vista estilo Calendar, control de mecánicos, asignación y Drag & Drop.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-10">
            <Download className="w-4 h-4 mr-2" /> Exportar Excel
          </Button>
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm h-10 items-center">
            {['Día', 'Semana', 'Mes'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={cn(
                  "px-4 py-1 rounded-md text-sm font-semibold transition-all",
                  viewMode === mode 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Date Navigation */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-sm gap-4">
        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
          <div className="space-y-1.5 w-full sm:w-48">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mecánico</label>
            <select className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500">
              <option>Todos</option>
              {mecanicos.map(m => <option key={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 w-full sm:w-64">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Buscar (Folio, Patente)</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Ej: OT-1045" 
                className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 justify-between w-full xl:w-auto">
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
            <button onClick={() => navigateDays(-1)} className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrentDate(new Date('2026-05-14'))} className="px-5 py-2.5 border-x border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors">
              Hoy
            </button>
            <button onClick={() => navigateDays(1)} className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm font-black text-slate-800 dark:text-slate-100 min-w-[120px] text-right">
             {currentDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50 mb-4 flex gap-3 text-sm shrink-0">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="block mb-0.5">Control de Tiempos y Tolerancia</strong>
          <p>Para empresas con más de 20 mecánicos, utilice el selector de vista (Semana/Mes) o el filtro de mecánicos para limpiar la matriz. El control de tiempo exacto y alertas de atraso se validan automáticamente cuando el mecánico "Inicia" y "Detiene" el reloj en el detalle de la Orden de Trabajo a través de la App Móvil o Tablet del Taller.</p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden gap-6">
        {/* Sidebar OTs Pendientes */}
        <div className="w-80 flex flex-col shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">OTs Pendientes</h3>
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{pendingOts.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {pendingOts.map(ot => (
                <div 
                  key={ot.id} 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, ot.id)}
                  onClick={() => navigate(`/flota/ordenes-trabajo/${ot.id}`)}
                  className={cn(
                    "bg-white dark:bg-slate-950 border rounded-xl p-3 flex shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 dark:hover:border-blue-500 transition-all group",
                    ot.id === draggedOt ? "opacity-50 border-blue-500 border-2" : "border-slate-200 dark:border-slate-800"
                  )}
                >
                  <div className="mr-3 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{ot.tipo}</h4>
                       <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">{ot.folio}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs truncate mt-0.5">{ot.patente} • {ot.actividad}</p>
                    <p className="text-blue-500 dark:text-blue-400 text-[10px] font-semibold mt-2.5 uppercase tracking-wide">Arrastrar para programar</p>
                  </div>
                </div>
              ))}
              {pendingOts.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8">
                   No hay órdenes pendientes.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden overflow-x-auto">
          {viewMode === 'Día' ? (
            <>
              {/* Calendar Header */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 min-w-max">
                <div className="w-16 border-r border-slate-200 dark:border-slate-800 shrink-0 sticky left-0 z-20 bg-slate-50/50 dark:bg-slate-900/50"></div>
                {mecanicos.map(m => (
                  <div key={m.id} className="w-[200px] flex-1 py-4 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{m.especialidad}</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">{m.nombre}</div>
                  </div>
                ))}
              </div>
              
              {/* Calendar Body */}
              <div className="flex-1 overflow-y-auto scrollbar-thin bg-slate-50/30 dark:bg-slate-950 flex relative min-w-max">
                {/* Time Column */}
                <div className="w-16 shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 z-10 sticky left-0">
                  {hours.map(h => (
                    <div key={h} className="h-24 border-b border-slate-100 dark:border-slate-800/50 flex justify-center pt-2">
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{h}:00</span>
                    </div>
                  ))}
                </div>

                {/* Mechanics Columns */}
                {mecanicos.map(m => (
                  <div key={m.id} className="w-[200px] flex-1 border-r border-slate-100 dark:border-slate-800/50 last:border-r-0 relative">
                    {/* Grid Lines functioning as Drop Zones */}
                    {hours.map(h => (
                      <div 
                        key={h} 
                        className="h-24 border-b border-slate-100 dark:border-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, m.id, h)}
                      ></div>
                    ))}

                    {/* Events */}
                    {m.ots.map(ot => {
                      const top = (ot.startHour! - 8) * 96;
                      const height = ot.duration! * 96;
                      const theme = getEventStyles(ot.tipo);

                      return (
                        <div 
                          key={ot.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ot.id)}
                          onClick={() => navigate(`/flota/ordenes-trabajo/${ot.id.replace('e', '')}`)}
                          className={cn(
                            "absolute left-2 right-2 rounded-xl p-3 shadow-sm border overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5 hover:shadow-md group",
                            theme,
                            ot.isOverdue && "border-red-400 dark:border-red-500 ring-2 ring-red-500/20"
                          )}
                          style={{ top: `${top}px`, height: `${height}px` }}
                        >
                          <div className="flex justify-between items-start mb-1">
                             <h4 className="font-bold text-sm leading-tight flex items-center gap-1">
                               {ot.tipo}
                               {ot.isOverdue && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                             </h4>
                          </div>
                          <p className="opacity-80 text-xs truncate font-medium">{ot.patente} • {ot.folio}</p>
                          <p className={cn("opacity-70 text-[11px] mt-0.5 line-clamp-2", height <= 96 && "truncate line-clamp-1")}>{ot.actividad}</p>

                          <div className="absolute bottom-3 left-3 flex items-center opacity-70 text-[10px] font-bold tracking-wide">
                            <Clock className="w-3 h-3 mr-1.5" />
                            {formatTime(ot.startHour!)} - {formatTime(ot.startHour! + ot.duration!)}
                          </div>
                          {ot.isOverdue && (
                            <div className="absolute top-2 right-2 flex items-center text-red-600 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded text-[9px] font-bold">
                               Atrasada
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900">
               <CalendarIcon className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
               <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Vista {viewMode} en Desarrollo</h3>
               <p className="text-slate-500 mt-2 max-w-md">La vista de {viewMode.toLowerCase()} presentará los días como columnas y permitirá filtrar por mecánico. Las mismas funciones de Drag & Drop y control de alertas de atraso estarán disponibles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Just adding Calendar Icon since we used it in the placeholder
import { Calendar as CalendarIcon } from 'lucide-react';

