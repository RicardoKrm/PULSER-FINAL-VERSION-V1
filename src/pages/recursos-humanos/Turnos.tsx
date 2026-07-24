import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search,
  Download,
  Trash2,
  Save,
  UserPlus
} from 'lucide-react';
import { exportToExcel } from "../../lib/excelExport";

import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import Swal from 'sweetalert2';
import { useCompany } from "../../contexts/CompanyContext";
import { supabase } from "../../lib/supabase";

// --- Types ---
type EmployeeStatus = 'ACTIVO' | 'VACACIONES' | 'LICENCIA' | 'AUSENTE' | 'PERMISO' | 'RENUNCIO';
type Area = 'DÍA' | 'NOCHE';

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
  DÍA: [
    { id: 'dia-iqq', title: 'Transporte IQQ', supervisor: '', workers: [] },
    { id: 'dia-hospicio', title: 'Transporte Hospicio', supervisor: '', workers: [] },
    { id: 'dia-taller', title: 'Transporte Taller', supervisor: '', workers: [] },
    { id: 'dia-mina', title: 'Transporte Mina', supervisor: '', workers: [] }
  ],
  NOCHE: [
    { id: 'noche-iqq', title: 'Transporte IQQ', supervisor: '', workers: [] },
    { id: 'noche-hospicio', title: 'Transporte Hospicio', supervisor: '', workers: [] },
    { id: 'noche-mina', title: 'Transporte Mina', supervisor: '', workers: [] }
  ]
};

// --- Helpers ---
const getStatusColor = (status: EmployeeStatus) => {
  switch (status) {
    case 'VACACIONES': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case 'LICENCIA': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
    case 'AUSENTE': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    case 'PERMISO': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case 'RENUNCIO': return 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 line-through';
    case 'ACTIVO': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400';
    default: return 'bg-transparent text-slate-800 dark:text-slate-200';
  }
};

const STATUS_OPTIONS: EmployeeStatus[] = ['ACTIVO', 'VACACIONES', 'LICENCIA', 'PERMISO', 'AUSENTE', 'RENUNCIO'];

const formatDateStr = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' }).format(date);
  } catch (e) {
    return dateStr;
  }
};

export default function Turnos() {
  const { currentCompany } = useCompany();
  const [activeArea, setActiveArea] = useState<Area>('DÍA');
  const [boardData, setBoardData] = useState<Record<Area, ShiftGroup[]>>(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentWeekId, setCurrentWeekId] = useState<string | null>(null);
  const [weekDates, setWeekDates] = useState({ inicio: '', fin: '' });
  const [isNuevoTurnoModalOpen, setIsNuevoTurnoModalOpen] = useState(false);
  const [newWeek, setNewWeek] = useState({ inicio: '', fin: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [allWeeks, setAllWeeks] = useState<any[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  // Selector de trabajador modal
  const [selectorModalOpen, setSelectorModalOpen] = useState(false);
  const [activeSelectorTarget, setActiveSelectorTarget] = useState<{groupId: string, workerId: string} | null>(null);
  const [selectorSearch, setSelectorSearch] = useState('');

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchWeeks();
      fetchColaboradores();
    }
  }, [currentCompany?.id]);

  const fetchColaboradores = async () => {
    if (!currentCompany?.id) return;
    const { data, error } = await supabase
      .from('colaborador')
      .select('id, nombre, rut, rol')
      .eq('empresa_id', currentCompany.id)
      .eq('estado', 'ACTIVO')
      .order('nombre');
    
    if (data) {
      setColaboradores(data);
    }
  };

  const fetchWeeks = async () => {
    if (!currentCompany?.id) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('turnos_semanales')
      .select('id, fecha_inicio, fecha_fin')
      .eq('empresa_id', currentCompany.id)
      .order('fecha_inicio', { ascending: false });

    if (error) {
      console.error("Error fetching weeks:", error);
    } else if (data && data.length > 0) {
      setAllWeeks(data);
      setCurrentWeekIndex(0);
      loadWeekData(data[0].id);
    }
    setIsLoading(false);
  };

  const loadWeekData = async (weekId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('turnos_semanales')
      .select('*')
      .eq('id', weekId)
      .single();

    if (error) {
      console.error("Error fetching week data:", error);
    } else if (data && data.data) {
      setCurrentWeekId(data.id);
      setWeekDates({ inicio: data.fecha_inicio, fin: data.fecha_fin });
      const fetchedData = data.data as any;
      if (!fetchedData['DÍA'] || !fetchedData['NOCHE']) {
        setBoardData(initialData); 
      } else {
        setBoardData(fetchedData as Record<Area, ShiftGroup[]>);
      }
      setHasChanges(false);
    }
    setIsLoading(false);
  };

  const navigatePreviousWeek = () => {
    if (currentWeekIndex < allWeeks.length - 1) {
      if (hasChanges) {
        Swal.fire({
          title: 'Hay cambios sin guardar',
          text: '¿Deseas descartar los cambios?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, descartar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            const newIndex = currentWeekIndex + 1;
            setCurrentWeekIndex(newIndex);
            loadWeekData(allWeeks[newIndex].id);
          }
        });
      } else {
        const newIndex = currentWeekIndex + 1;
        setCurrentWeekIndex(newIndex);
        loadWeekData(allWeeks[newIndex].id);
      }
    }
  };

  const navigateNextWeek = () => {
    if (currentWeekIndex > 0) {
      if (hasChanges) {
        Swal.fire({
          title: 'Hay cambios sin guardar',
          text: '¿Deseas descartar los cambios?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, descartar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            const newIndex = currentWeekIndex - 1;
            setCurrentWeekIndex(newIndex);
            loadWeekData(allWeeks[newIndex].id);
          }
        });
      } else {
        const newIndex = currentWeekIndex - 1;
        setCurrentWeekIndex(newIndex);
        loadWeekData(allWeeks[newIndex].id);
      }
    }
  };

  const saveToDatabase = async () => {
    if (!currentCompany?.id || !currentWeekId) return;
    setIsLoading(true);
    const { error } = await supabase
      .from('turnos_semanales')
      .update({ data: boardData })
      .eq('id', currentWeekId);
    
    if (error) {
      console.error("Error updating turnos:", error);
      Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
    } else {
      setHasChanges(false);
      Swal.fire({
        title: '¡Guardado!',
        text: 'Los cambios se han guardado exitosamente.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
    setIsLoading(false);
  };

  const createNuevoTurno = async () => {
    if (!currentCompany?.id || !newWeek.inicio || !newWeek.fin) return;
    setIsLoading(true);
    const newDataToInsert = boardData || initialData;
    
    const { data, error } = await supabase
      .from('turnos_semanales')
      .insert({
        empresa_id: currentCompany.id,
        area: 'TODAS', 
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
      await fetchWeeks(); // Reload weeks to include the new one
      setIsNuevoTurnoModalOpen(false);
      Swal.fire('¡Éxito!', 'Nuevo turno creado', 'success');
    }
    setIsLoading(false);
  };

  const handleExportExcel = () => {
    const dataToExport: any[] = [];
    boardData[activeArea].forEach(group => {
      group.workers.forEach((worker, index) => {
        dataToExport.push({
          'Turno': activeArea,
          'Grupo': group.title,
          'Supervisor': group.supervisor,
          'N°': index + 1,
          'Trabajador': worker.name,
          'Cargo': worker.role,
          'Detalles / Dirección': worker.details,
          'Estado': worker.status,
          'Desde': worker.fechaInicio || '',
          'Hasta': worker.fechaFin || '',
          'Notas': worker.notes || ''
        });
      });
    });
    exportToExcel(dataToExport, `Turnos_${activeArea}_${weekDates.inicio}`);
  };

  const addEmptyWorker = (groupId: string) => {
    const newData = { ...boardData };
    const group = newData[activeArea].find(g => g.id === groupId);
    if (group) {
      group.workers.push({
        id: crypto.randomUUID(),
        name: '',
        role: '',
        details: '',
        status: 'ACTIVO',
        isApoyo: false,
        notes: '',
        fechaInicio: '',
        fechaFin: ''
      });
      setBoardData(newData);
      setHasChanges(true);
    }
  };

  const updateWorkerField = (groupId: string, workerId: string, field: keyof Worker, value: any) => {
    const newData = { ...boardData };
    const group = newData[activeArea].find(g => g.id === groupId);
    if (group) {
      const worker = group.workers.find(w => w.id === workerId);
      if (worker) {
        // @ts-ignore
        worker[field] = value;

        // If they select an existing employee by name from datalist, auto-fill role
        if (field === 'name') {
          const colab = colaboradores.find(c => c.nombre === value);
          if (colab && !worker.role) {
            worker.role = colab.rol || 'Operador';
          }
        }

        setBoardData(newData);
        setHasChanges(true);
      }
    }
  };

  const removeWorker = (groupId: string, workerId: string) => {
    const newData = { ...boardData };
    const group = newData[activeArea].find(g => g.id === groupId);
    if (group) {
      group.workers = group.workers.filter(w => w.id !== workerId);
      setBoardData(newData);
      setHasChanges(true);
    }
  };

  const updateGroupSupervisor = (groupId: string, supervisor: string) => {
    const newData = { ...boardData };
    const group = newData[activeArea].find(g => g.id === groupId);
    if (group) {
      group.supervisor = supervisor;
      setBoardData(newData);
      setHasChanges(true);
    }
  };

  const handleStartDateChange = (date: string) => {
    setNewWeek(prev => {
      if (date) {
        const [year, month, day] = date.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        // Add 7 days exactly for rotativo 7x7
        startDate.setDate(startDate.getDate() + 7);
        // Format to YYYY-MM-DD
        const yearEnd = startDate.getFullYear();
        const monthEnd = String(startDate.getMonth() + 1).padStart(2, '0');
        const dayEnd = String(startDate.getDate()).padStart(2, '0');
        const endStr = `${yearEnd}-${monthEnd}-${dayEnd}`;
        return { inicio: date, fin: endStr };
      }
      return { ...prev, inicio: date };
    });
  };

  return (
    <div className="p-6 min-h-screen flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Gestión de Turnos</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Edición rápida en formato tabla</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
            <button 
              onClick={navigatePreviousWeek}
              disabled={currentWeekIndex >= allWeeks.length - 1}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-slate-500 transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-1.5 font-bold text-sm text-slate-700 dark:text-slate-200 min-w-[140px] text-center uppercase">
              {weekDates.inicio ? `${formatDateStr(weekDates.inicio)} AL ${formatDateStr(weekDates.fin)}` : 'SELECCIONE SEMANA'}
            </div>
            <button 
              onClick={navigateNextWeek}
              disabled={currentWeekIndex <= 0}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-slate-500 transition-colors"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={handleExportExcel}
            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>

          <button 
            onClick={saveToDatabase}
            disabled={!hasChanges || isLoading}
            className={`font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all shadow-sm ${
              hasChanges 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>

          <button 
            onClick={() => setIsNuevoTurnoModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Semana
          </button>
        </div>
      </div>

      {/* Controls: Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto">
          {(['DÍA', 'NOCHE'] as Area[]).map((area) => (
            <button
              key={area}
              onClick={() => setActiveArea(area)}
              className={`flex-1 sm:flex-none px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeArea === area
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar en la tabla..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Tables Layout */}
      <div className="space-y-8">
        {boardData[activeArea].map((group) => {
          // Filter workers in this group based on search
          const filteredWorkers = group.workers.filter(w => 
            !searchQuery || 
            w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            w.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.details.toLowerCase().includes(searchQuery.toLowerCase())
          );

          return (
            <div key={group.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              {/* Table Header / Group Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                    {group.title}
                  </h2>
                  <span className="bg-white dark:bg-slate-800 text-slate-500 font-bold px-2.5 py-1 rounded-md text-xs border border-slate-200 dark:border-slate-700">
                    {group.workers.length} Trabajadores
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-sm font-bold text-slate-600 dark:text-slate-300 gap-2">
                    Supervisor:
                    <input 
                      type="text" 
                      value={group.supervisor}
                      onChange={(e) => updateGroupSupervisor(group.id, e.target.value)}
                      placeholder="Nombre supervisor"
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium w-48"
                    />
                  </div>
                  <button 
                    onClick={() => addEmptyWorker(group.id)}
                    className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/50 p-2 rounded-lg transition-colors font-bold text-sm flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Añadir Fila
                  </button>
                </div>
              </div>

              {/* Editable Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-800/20">
                      <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase w-12 text-center">N°</th>
                      <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase w-64">Trabajador</th>
                      <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase w-40">Cargo</th>
                      <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase min-w-[200px]">Detalles / Dirección</th>
                      <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase w-44">Estado</th>
                      <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase w-48">Fechas (Desde - Hasta)</th>
                      <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase min-w-[150px]">Notas</th>
                      <th className="p-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase w-16 text-center">Eliminar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredWorkers.map((worker, index) => (
                      <tr key={worker.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="p-2 text-center text-xs font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={worker.name}
                            onClick={() => {
                              setActiveSelectorTarget({ groupId: group.id, workerId: worker.id });
                              setSelectorSearch('');
                              setSelectorModalOpen(true);
                            }}
                            readOnly
                            placeholder="Seleccionar..."
                            className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 dark:hover:border-slate-700 dark:focus:border-indigo-500 rounded px-2 py-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-colors cursor-pointer"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={worker.role}
                            onChange={(e) => updateWorkerField(group.id, worker.id, 'role', e.target.value)}
                            placeholder="Cargo..."
                            className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 dark:hover:border-slate-700 dark:focus:border-indigo-500 rounded px-2 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-colors"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={worker.details}
                            onChange={(e) => updateWorkerField(group.id, worker.id, 'details', e.target.value)}
                            placeholder="Dirección / Comentarios..."
                            className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 dark:hover:border-slate-700 dark:focus:border-indigo-500 rounded px-2 py-1.5 text-sm text-slate-600 dark:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-colors"
                          />
                        </td>
                        <td className="p-2">
                          <select 
                            value={worker.status}
                            onChange={(e) => updateWorkerField(group.id, worker.id, 'status', e.target.value)}
                            className={`w-full appearance-none border border-transparent hover:border-slate-200 focus:border-indigo-500 dark:hover:border-slate-700 rounded px-2 py-1.5 text-xs font-bold cursor-pointer focus:outline-none transition-colors ${getStatusColor(worker.status)}`}
                          >
                            {STATUS_OPTIONS.map(status => (
                              <option key={status} value={status} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <input 
                              type="date" 
                              value={worker.fechaInicio || ''}
                              onChange={(e) => updateWorkerField(group.id, worker.id, 'fechaInicio', e.target.value)}
                              className={`w-[100px] bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 dark:hover:border-slate-700 dark:focus:border-indigo-500 rounded px-1 py-1.5 text-xs font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-colors ${worker.fechaInicio ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}
                            />
                            <span className="text-slate-400 text-xs">-</span>
                            <input 
                              type="date" 
                              value={worker.fechaFin || ''}
                              onChange={(e) => updateWorkerField(group.id, worker.id, 'fechaFin', e.target.value)}
                              className={`w-[100px] bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 dark:hover:border-slate-700 dark:focus:border-indigo-500 rounded px-1 py-1.5 text-xs font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-colors ${worker.fechaFin ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}
                            />
                          </div>
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={worker.notes || ''}
                            onChange={(e) => updateWorkerField(group.id, worker.id, 'notes', e.target.value)}
                            placeholder="Notas..."
                            className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-500 dark:hover:border-slate-700 dark:focus:border-indigo-500 rounded px-2 py-1.5 text-sm text-slate-600 dark:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-colors"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button 
                            onClick={() => removeWorker(group.id, worker.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    {filteredWorkers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                          No hay trabajadores en este grupo. Haz clic en "Añadir Fila" para agregar uno.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

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
                onChange={(e) => handleStartDateChange(e.target.value)}
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

      {/* Selector de Trabajador Modal */}
      <Modal
        isOpen={selectorModalOpen}
        onClose={() => setSelectorModalOpen(false)}
        title="Seleccionar Colaborador"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              value={selectorSearch}
              onChange={(e) => setSelectorSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2 border border-slate-200 dark:border-slate-800">
            {colaboradores
              .filter((c) =>
                c.nombre.toLowerCase().includes(selectorSearch.toLowerCase()) ||
                (c.rut && c.rut.toLowerCase().includes(selectorSearch.toLowerCase()))
              )
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (activeSelectorTarget) {
                      updateWorkerField(activeSelectorTarget.groupId, activeSelectorTarget.workerId, 'name', c.nombre);
                    }
                    setSelectorModalOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{c.nombre}</span>
                    <span className="text-xs font-semibold text-slate-500">{c.rut}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
                    {c.rol || 'N/A'}
                  </span>
                </button>
              ))}
            {colaboradores.length > 0 &&
              colaboradores.filter((c) =>
                c.nombre.toLowerCase().includes(selectorSearch.toLowerCase()) ||
                (c.rut && c.rut.toLowerCase().includes(selectorSearch.toLowerCase()))
              ).length === 0 && (
                <div className="p-4 text-center text-sm font-medium text-slate-500">
                  No se encontraron colaboradores.
                </div>
              )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
