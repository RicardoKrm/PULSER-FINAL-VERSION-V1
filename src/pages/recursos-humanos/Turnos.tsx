import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search,
  MoreVertical,
  UserCheck,
  Plane,
  Stethoscope,
  UserX,
  GripVertical,
  Sun,
  Moon,
  Clock,
  Download
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { exportToExcel } from "../../lib/excelExport";

import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import Swal from 'sweetalert2';
import { useCompany } from "../../contexts/CompanyContext";
import { supabase } from "../../lib/supabase";

// --- Types ---
type EmployeeStatus = 'ACTIVO' | 'VACACIONES' | 'LICENCIA' | 'AUSENTE';
type Area = 'TRANSPORTE' | 'EXTRACCION' | 'TALLER';

interface Worker {
  id: string;
  name: string;
  role: string;
  details: string;
  status: EmployeeStatus;
  isApoyo: boolean;
  notes?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

interface ShiftGroup {
  id: string;
  title: string;
  supervisor: string;
  workers: Worker[];
}

// --- Mock Data ---
const initialData: Record<Area, ShiftGroup[]> = {
  TRANSPORTE: [
    {
      id: 'g1',
      title: 'Ingreso a las 07:00 - Transfer Iqq',
      supervisor: 'Claudio Pavez',
      workers: [
        { id: 'w1', name: 'Oscar Rodriguez', role: 'Conductor', details: 'Diego Portales c/ galvarino', status: 'ACTIVO', isApoyo: false },
        { id: 'w2', name: 'Miguel Carrasco', role: 'Conductor', details: 'Iquique f/9-31886139', status: 'ACTIVO', isApoyo: false },
        { id: 'w3', name: 'Lizardo Leon', role: 'Carpero', details: 'Manuel Rodriguez 1015', status: 'ACTIVO', isApoyo: false },
        { id: 'w4', name: 'Adalberto Frey', role: 'Puntero', details: 'Chanavayita (NO VIENE 15 Y 16)', status: 'VACACIONES', isApoyo: false },
        { id: 'w5', name: 'Patricio Martinez', role: 'Puntero', details: 'REEMPLAZO 15 ADALBERTO', status: 'ACTIVO', isApoyo: true },
      ]
    },
    {
      id: 'g2',
      title: 'Ingreso a las 07:00 - Transfer Hospicio',
      supervisor: 'Patricio Pacheco',
      workers: [
        { id: 'w6', name: 'Gustavo Vega', role: 'Conductor', details: 'Calle 1, N 3517 999783837', status: 'VACACIONES', isApoyo: false },
        { id: 'w7', name: 'Alvaro Avila', role: 'Conductor', details: 'GUINDALES - KIWIS', status: 'ACTIVO', isApoyo: false },
        { id: 'w8', name: 'Jackson Zamora', role: 'Conductor', details: 'Chanavayita LICENCIA HASTA EL 17', status: 'LICENCIA', isApoyo: false },
        { id: 'w9', name: 'Claudio Acuña', role: 'Conductor', details: 'Av. San rosa de huara #4220', status: 'ACTIVO', isApoyo: false },
      ]
    },
    {
      id: 'g3',
      title: 'Ingreso a las 19:00 - Transfer Iqq',
      supervisor: 'Jorge Vilches',
      workers: [
        { id: 'w10', name: 'Gianni Garay', role: 'Conductor', details: '4 reinas condominio', status: 'AUSENTE', isApoyo: false },
        { id: 'w11', name: 'Rodrigo Muñoz', role: 'Conductor', details: 'Chanavallita', status: 'ACTIVO', isApoyo: false },
      ]
    }
  ],
  EXTRACCION: [
    {
      id: 'g4',
      title: 'Turno Mina - Grupo A',
      supervisor: 'Luis Pozo',
      workers: [
        { id: 'w12', name: 'Andres Apablaza', role: 'Caex', details: 'los manzanos con datiles', status: 'ACTIVO', isApoyo: false },
        { id: 'w13', name: 'Felipe Colman', role: 'Multiple', details: 'Gabriela Mistral / Argentina', status: 'LICENCIA', isApoyo: false },
      ]
    }
  ],
  TALLER: [
    {
      id: 'g5',
      title: 'Ingreso a las 7:00 - Taller Principal',
      supervisor: 'José Rojas',
      workers: [
        { id: 'w14', name: 'Marcelo Toro', role: 'Vulcanizador', details: 'Los Perales 3241 alto hospicio', status: 'ACTIVO', isApoyo: false },
        { id: 'w15', name: 'Sebastian Cofre', role: 'Mecánico', details: 'Av. Las parcelas 4178', status: 'AUSENTE', isApoyo: false },
        { id: 'w16', name: 'Einar Medina', role: 'Mecánico', details: 'Videla 1290', status: 'LICENCIA', isApoyo: false },
      ]
    }
  ]
};

// --- Helpers ---
const getStatusColor = (status: EmployeeStatus) => {
  switch (status) {
    case 'VACACIONES': return 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300';
    case 'LICENCIA': return 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300';
    case 'AUSENTE': return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300';
    case 'ACTIVO': return 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400';
    default: return 'bg-white border-slate-200';
  }
};

const getStatusIcon = (status: EmployeeStatus) => {
  switch (status) {
    case 'VACACIONES': return <Plane className="w-4 h-4" />;
    case 'LICENCIA': return <Stethoscope className="w-4 h-4" />;
    case 'AUSENTE': return <UserX className="w-4 h-4" />;
    case 'ACTIVO': return <UserCheck className="w-4 h-4" />;
  }
};

const getTurnoTipo = (title: string) => {
  const upper = title.toUpperCase();
  if (upper.includes('07:00') || upper.includes('7:00')) {
    return { 
      tipo: 'DÍA', 
      icon: <Sun className="w-3.5 h-3.5 text-amber-500" />, 
      color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-400' 
    };
  }
  if (upper.includes('19:00') || upper.includes('20:00')) {
    return { 
      tipo: 'NOCHE', 
      icon: <Moon className="w-3.5 h-3.5 text-indigo-500" />, 
      color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700/50 dark:text-indigo-400' 
    };
  }
  return { 
    tipo: 'VARIABLE', 
    icon: <Clock className="w-3.5 h-3.5 text-slate-500" />, 
    color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300' 
  };
};

export default function Turnos() {
  const { currentCompany } = useCompany();
  const [activeArea, setActiveArea] = useState<Area>('TRANSPORTE');
  const [boardData, setBoardData] = useState<Record<Area, ShiftGroup[]>>(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentWeekId, setCurrentWeekId] = useState<string | null>(null);
  const [weekDates, setWeekDates] = useState({ inicio: '2024-07-15', fin: '2024-07-22' });
  const [isNuevoTurnoModalOpen, setIsNuevoTurnoModalOpen] = useState(false);
  const [newWeek, setNewWeek] = useState({ inicio: '', fin: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [colaboradores, setColaboradores] = useState<any[]>([]);

  const [addWorkerModal, setAddWorkerModal] = useState<{
    isOpen: boolean;
    groupId: string;
  }>({
    isOpen: false,
    groupId: '',
  });

  const [addWorkerSearch, setAddWorkerSearch] = useState('');

  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    workerId: string;
    groupId: string;
    newStatus: EmployeeStatus;
    workerName: string;
    currentStatus: EmployeeStatus;
    fechaInicio?: string;
    fechaFin?: string;
    notes?: string;
  }>({
    isOpen: false,
    workerId: '',
    groupId: '',
    newStatus: 'ACTIVO',
    workerName: '',
    currentStatus: 'ACTIVO',
    fechaInicio: '',
    fechaFin: '',
    notes: ''
  });

  useEffect(() => {
    if (currentCompany?.id) {
      fetchCurrentWeek();
      fetchColaboradores();
    }
  }, [currentCompany?.id]);

  const fetchColaboradores = async () => {
    if (!currentCompany?.id) return;
    const { data, error } = await supabase
      .from('colaborador')
      .select('id, nombre, rol')
      .eq('empresa_id', currentCompany.id)
      .eq('estado', 'ACTIVO')
      .order('nombre');
    
    if (data) {
      setColaboradores(data);
    }
  };

  const fetchCurrentWeek = async () => {
    if (!currentCompany?.id) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('turnos_semanales')
      .select('*')
      .eq('empresa_id', currentCompany.id)
      .order('fecha_inicio', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching turnos:", error);
    } else if (data) {
      setCurrentWeekId(data.id);
      setWeekDates({ inicio: data.fecha_inicio, fin: data.fecha_fin });
      setBoardData(data.data as Record<Area, ShiftGroup[]>);
    }
    setIsLoading(false);
  };

  const saveToDatabase = async (newData: Record<Area, ShiftGroup[]>) => {
    if (!currentCompany?.id) return;
    if (currentWeekId) {
      const { error } = await supabase
        .from('turnos_semanales')
        .update({ data: newData })
        .eq('id', currentWeekId);
      if (error) console.error("Error updating turnos:", error);
    }
  };

  const createNuevoTurno = async () => {
    if (!currentCompany?.id || !newWeek.inicio || !newWeek.fin) return;
    setIsLoading(true);
    // Podríamos limpiar los trabajadores o copiar la semana anterior.
    // Por simplicidad, copiaremos la base de datos actual si existe, sino initialData.
    const newDataToInsert = boardData || initialData;
    
    const { data, error } = await supabase
      .from('turnos_semanales')
      .insert({
        empresa_id: currentCompany.id,
        area: 'TODAS', // En caso de que se agrupen todas en un solo registro
        fecha_inicio: newWeek.inicio,
        fecha_fin: newWeek.fin,
        data: newDataToInsert
      })
      .select()
      .single();
      
    if (error) {
      Swal.fire('Error', 'No se pudo crear el turno', 'error');
      console.error(error);
    } else if (data) {
      setCurrentWeekId(data.id);
      setWeekDates({ inicio: data.fecha_inicio, fin: data.fecha_fin });
      setBoardData(data.data as Record<Area, ShiftGroup[]>);
      setIsNuevoTurnoModalOpen(false);
      Swal.fire('¡Éxito!', 'Nuevo turno creado', 'success');
    }
    setIsLoading(false);
  };

  const getWorkerCurrentShift = (workerName: string) => {
    for (const area of Object.keys(boardData) as Area[]) {
      for (const group of boardData[area]) {
        if (group.workers.some(w => w.name === workerName)) {
          return `${area} - ${group.title}`;
        }
      }
    }
    return null;
  };

  const handleQuickAddWorker = (colaborador: any) => {
    const newData = { ...boardData };
    const group = newData[activeArea].find(g => g.id === addWorkerModal.groupId);
    
    if (group) {
      const newWorker: Worker = {
        id: colaborador.id || crypto.randomUUID(),
        name: colaborador.nombre,
        role: colaborador.rol || 'Operador',
        details: '',
        status: 'ACTIVO',
        isApoyo: false
      };
      
      group.workers.push(newWorker);
      setBoardData(newData);
      saveToDatabase(newData);
      setAddWorkerModal({ ...addWorkerModal, isOpen: false });
      setAddWorkerSearch('');
      Swal.fire({
        title: '¡Agregado!',
        text: 'Trabajador agregado exitosamente.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleExportExcel = () => {
    const dataToExport: any[] = [];
    boardData[activeArea].forEach(group => {
      const turnoTipo = getTurnoTipo(group.title);
      group.workers.forEach((worker, index) => {
        dataToExport.push({
          'Turno / Grupo': group.title,
          'Tipo de Turno': turnoTipo.tipo,
          'Supervisor': group.supervisor,
          'N°': index + 1,
          'Trabajador': worker.name,
          'Cargo': worker.role,
          'Detalles / Dirección': worker.details,
          'Estado': worker.status,
          'Apoyo': worker.isApoyo ? 'SI' : 'NO'
        });
      });
    });
    exportToExcel(dataToExport, `Turnos_${activeArea}_15_al_22_Julio`);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      // Reorder within the same group
      const groupIndex = boardData[activeArea].findIndex(g => g.id === source.droppableId);
      const group = boardData[activeArea][groupIndex];
      const newWorkers = Array.from(group.workers);
      const [moved] = newWorkers.splice(source.index, 1);
      newWorkers.splice(destination.index, 0, moved);

      const newData = { ...boardData };
      newData[activeArea][groupIndex] = { ...group, workers: newWorkers };
      setBoardData(newData);
      saveToDatabase(newData);
    } else {
      // Move between groups
      const sourceGroupIndex = boardData[activeArea].findIndex(g => g.id === source.droppableId);
      const destGroupIndex = boardData[activeArea].findIndex(g => g.id === destination.droppableId);
      
      const sourceGroup = boardData[activeArea][sourceGroupIndex];
      const destGroup = boardData[activeArea][destGroupIndex];
      
      const sourceWorkers = Array.from(sourceGroup.workers);
      const destWorkers = Array.from(destGroup.workers);
      
      const [moved] = sourceWorkers.splice(source.index, 1);
      destWorkers.splice(destination.index, 0, moved);

      const newData = { ...boardData };
      newData[activeArea][sourceGroupIndex] = { ...sourceGroup, workers: sourceWorkers };
      newData[activeArea][destGroupIndex] = { ...destGroup, workers: destWorkers };
      setBoardData(newData);
      saveToDatabase(newData);
    }
  };

  const openStatusModal = (groupId: string, workerId: string) => {
    const group = boardData[activeArea].find(g => g.id === groupId);
    if (group) {
      const worker = group.workers.find(w => w.id === workerId);
      if (worker) {
        setStatusModal({
          isOpen: true,
          workerId: worker.id,
          groupId: group.id,
          workerName: worker.name,
          currentStatus: worker.status,
          newStatus: worker.status,
          fechaInicio: worker.fechaInicio || '',
          fechaFin: worker.fechaFin || '',
          notes: worker.notes || ''
        });
      }
    }
  };

  const saveStatus = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a cambiar el estado de ${statusModal.workerName} a ${statusModal.newStatus}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        const newData = { ...boardData };
        const group = newData[activeArea].find(g => g.id === statusModal.groupId);
        if (group) {
          const worker = group.workers.find(w => w.id === statusModal.workerId);
          if (worker) {
            worker.status = statusModal.newStatus;
            worker.fechaInicio = statusModal.fechaInicio;
            worker.fechaFin = statusModal.fechaFin;
            worker.notes = statusModal.notes;
            setBoardData(newData);
            saveToDatabase(newData);
            Swal.fire('¡Actualizado!', 'El estado ha sido actualizado.', 'success');
            setStatusModal({ ...statusModal, isOpen: false });
          }
        }
      }
    });
  };

  const filteredGroups = boardData[activeArea].map(group => ({
    ...group,
    workers: group.workers.filter(w => 
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }));

  return (
    <div className="p-6 h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Gestión de Turnos</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Organiza y supervisa la disponibilidad del personal</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-1.5 font-bold text-sm text-slate-700 dark:text-slate-200 min-w-[140px] text-center uppercase">
              {weekDates.inicio ? `${weekDates.inicio} AL ${weekDates.fin}` : '15 AL 22 DE JULIO'}
            </div>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={() => handleExportExcel()}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>

          <button 
            onClick={() => setIsNuevoTurnoModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Turno
          </button>
        </div>
      </div>

      {/* Controls: Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto">
          {(['TRANSPORTE', 'EXTRACCION', 'TALLER'] as Area[]).map((area) => (
            <button
              key={area}
              onClick={() => setActiveArea(area)}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeArea === area
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar trabajador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Board Layout */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-full items-start">
            {filteredGroups.map(group => (
              <div key={group.id} className="w-80 shrink-0 flex flex-col max-h-full bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                {/* Group Header */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight flex-1">
                      {group.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${getTurnoTipo(group.title).color}`}>
                        {getTurnoTipo(group.title).icon}
                        {getTurnoTipo(group.title).tipo}
                      </span>
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold px-1.5 py-0.5 rounded">
                        {group.workers.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
                      <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-600 dark:text-slate-300">
                        {group.supervisor.charAt(0)}
                      </div>
                      <span className="truncate">Sup: {group.supervisor}</span>
                    </div>
                  </div>
                </div>

                {/* Droppable Area for Workers */}
                <Droppable droppableId={group.id}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto p-2 space-y-2 transition-colors min-h-[150px] ${
                        snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                      }`}
                    >
                      {group.workers.map((worker, index) => (
                        // @ts-expect-error key is required by React
                        <Draggable key={worker.id} draggableId={worker.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`rounded-xl border p-2 shadow-sm transition-all group relative ${getStatusColor(worker.status)} ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500 scale-105 z-50' : 'hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              <div className="flex items-start gap-1.5">
                                <div 
                                  {...provided.dragHandleProps}
                                  className="mt-0.5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1 mb-0.5">
                                    <h4 className="font-bold text-xs truncate pr-1">
                                      {worker.name}
                                    </h4>
                                    <button 
                                      onClick={() => openStatusModal(group.id, worker.id)}
                                      title="Cambiar Estado"
                                      className="shrink-0 p-1 hover:bg-black/5 rounded-md transition-colors"
                                    >
                                      {getStatusIcon(worker.status)}
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[9px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 opacity-80 leading-none">
                                      {worker.role}
                                    </span>
                                    {worker.isApoyo && (
                                      <span className="text-[9px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 leading-none">
                                        APOYO
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] opacity-70 truncate leading-tight" title={worker.details}>
                                    {worker.details}
                                  </p>
                                  {worker.notes && (
                                    <p className="text-[9px] font-medium mt-0.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-1 py-0.5 rounded truncate">
                                      {worker.notes}
                                    </p>
                                  )}
                                  {(worker.fechaInicio || worker.fechaFin) && (
                                    <p className="text-[9px] font-bold mt-0.5 opacity-80">
                                      {worker.fechaInicio && `Desde: ${worker.fechaInicio}`} {worker.fechaFin && `Hasta: ${worker.fechaFin}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                
                {/* Add Worker Button */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50">
                  <button 
                    onClick={() => setAddWorkerModal({ ...addWorkerModal, isOpen: true, groupId: group.id })}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-dashed border-slate-300 dark:border-slate-600"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Agregar Trabajador Modal */}
      <Modal 
        isOpen={addWorkerModal.isOpen} 
        onClose={() => {
          setAddWorkerModal({ ...addWorkerModal, isOpen: false });
          setAddWorkerSearch('');
        }}
        title="Agregar Trabajador al Turno"
        size="md"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              value={addWorkerSearch}
              onChange={(e) => setAddWorkerSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Buscar colaborador por nombre o rol..."
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {colaboradores
              .filter(c => 
                c.nombre.toLowerCase().includes(addWorkerSearch.toLowerCase()) || 
                (c.rol && c.rol.toLowerCase().includes(addWorkerSearch.toLowerCase()))
              )
              .map(c => {
                const currentShift = getWorkerCurrentShift(c.nombre);
                
                return (
                  <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg border ${currentShift ? 'border-slate-200 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 opacity-60' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                    <div>
                      <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{c.nombre}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{c.rol || 'Operador'}</p>
                    </div>
                    {currentShift ? (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-2 py-1 rounded">
                          En: {currentShift}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleQuickAddWorker(c)}
                        className="text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Agregar
                      </button>
                    )}
                  </div>
                );
              })}
            
            {colaboradores.length === 0 && (
              <div className="text-center py-4 text-sm text-slate-500">
                No hay colaboradores registrados en la base de datos.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Status Edit Modal */}
      <Modal 
        isOpen={statusModal.isOpen} 
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        title={`Cambiar Estado: ${statusModal.workerName}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nuevo Estado
            </label>
            <select
              value={statusModal.newStatus}
              onChange={(e) => setStatusModal({ ...statusModal, newStatus: e.target.value as EmployeeStatus })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ACTIVO">Activo</option>
              <option value="VACACIONES">Vacaciones</option>
              <option value="LICENCIA">Licencia</option>
              <option value="AUSENTE">Ausente</option>
            </select>
          </div>

          {statusModal.newStatus === 'VACACIONES' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Desde</label>
                <input 
                  type="date"
                  value={statusModal.fechaInicio}
                  onChange={(e) => setStatusModal({ ...statusModal, fechaInicio: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Hasta</label>
                <input 
                  type="date"
                  value={statusModal.fechaFin}
                  onChange={(e) => setStatusModal({ ...statusModal, fechaFin: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {statusModal.newStatus === 'LICENCIA' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Hasta la fecha</label>
              <input 
                type="date"
                value={statusModal.fechaFin}
                onChange={(e) => setStatusModal({ ...statusModal, fechaFin: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nota / Observación
            </label>
            <textarea
              value={statusModal.notes}
              onChange={(e) => setStatusModal({ ...statusModal, notes: e.target.value })}
              placeholder="Ej. Reemplazo por Juan Perez..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => setStatusModal({ ...statusModal, isOpen: false })}>
              Cancelar
            </Button>
            <Button onClick={saveStatus}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>

      {/* Nuevo Turno Modal */}
      <Modal 
        isOpen={isNuevoTurnoModalOpen} 
        onClose={() => setIsNuevoTurnoModalOpen(false)}
        title="Crear Nueva Semana de Turnos"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha Inicio</label>
              <input 
                type="date"
                value={newWeek.inicio}
                onChange={(e) => setNewWeek({ ...newWeek, inicio: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha Fin</label>
              <input 
                type="date"
                value={newWeek.fin}
                onChange={(e) => setNewWeek({ ...newWeek, fin: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Se creará una copia de la distribución actual para esta nueva semana, la cual podrás modificar independientemente.
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => setIsNuevoTurnoModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createNuevoTurno} disabled={isLoading || !newWeek.inicio || !newWeek.fin}>
              {isLoading ? 'Creando...' : 'Crear Turno'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
