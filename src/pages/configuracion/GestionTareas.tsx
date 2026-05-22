import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { 
  Plus, 
  Trash2, 
  Search, 
  Edit3,
  ClipboardList,
  Activity,
  Clock,
  DollarSign
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';

interface Tarea {
  id: string;
  descripcion: string;
  tiempoEstandarMinutos: number;
  costoManoObra: number;
  color: string;
  estado: 'Activo' | 'Inactivo';
}

export default function GestionTareas() {
  const { currentCompany } = useCompany();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTareaId, setEditingTareaId] = useState<string | null>(null);
  
  // Form state
  const [descripcion, setDescripcion] = useState('');
  const [tiempoEstandarMinutos, setTiempoEstandarMinutos] = useState<number>(60);
  const [costoManoObra, setCostoManoObra] = useState<number>(25000);
  const [color, setColor] = useState('bg-blue-500');

  useEffect(() => {
    fetchTareas();
  }, [currentCompany?.id]);

  const resetForm = () => {
    setEditingTareaId(null);
    setDescripcion('');
    setTiempoEstandarMinutos(60);
    setCostoManoObra(25000);
    setColor('bg-blue-500');
  };

  const handleOpenNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditClick = (tarea: Tarea) => {
    setEditingTareaId(tarea.id);
    setDescripcion(tarea.descripcion);
    setTiempoEstandarMinutos(tarea.tiempoEstandarMinutos);
    setCostoManoObra(tarea.costoManoObra);
    setColor(tarea.color);
    setIsModalOpen(true);
  };

  const fetchTareas = async () => {
    if (!currentCompany?.id) return;
    try {
      const { data, error } = await supabase
        .from('mantenimiento_tarea')
        .select('*')
        .eq('empresa_id', currentCompany.id);
      
      if (error) throw error;
      if (data) {
        setTareas(data.map(t => ({
          id: t.id,
          descripcion: t.descripcion,
          tiempoEstandarMinutos: t.tiempo_estandar_minutos,
          costoManoObra: t.costo_mano_obra,
          color: t.color,
          estado: t.estado as 'Activo' | 'Inactivo'
        })));
      }
    } catch (err) {
      console.error('Error fetching tareas:', err);
    }
  };

  const filteredTareas = tareas.filter(t => 
    t.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion || !currentCompany?.id) return;

    try {
      if (editingTareaId) {
        const { error } = await supabase
          .from('mantenimiento_tarea')
          .update({
            descripcion,
            tiempo_estandar_minutos: tiempoEstandarMinutos,
            costo_mano_obra: costoManoObra,
            color
          })
          .eq('id', editingTareaId);

        if (error) throw error;
        
        setTareas(tareas.map(t => t.id === editingTareaId ? {
          ...t,
          descripcion,
          tiempoEstandarMinutos: tiempoEstandarMinutos,
          costoManoObra: costoManoObra,
          color
        } : t));
        
        Swal.fire({
          title: '¡Actualizado!', 
          text: 'La tarea ha sido actualizada exitosamente.', 
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
      } else {
        const { data, error } = await supabase
          .from('mantenimiento_tarea')
          .insert([{
            empresa_id: currentCompany.id,
            descripcion,
            tiempo_estandar_minutos: tiempoEstandarMinutos,
            costo_mano_obra: costoManoObra,
            color,
            estado: 'Activo'
          }])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const newDbTarea = data[0];
          const newTarea: Tarea = {
            id: newDbTarea.id,
            descripcion: newDbTarea.descripcion,
            tiempoEstandarMinutos: newDbTarea.tiempo_estandar_minutos,
            costoManoObra: newDbTarea.costo_mano_obra,
            color: newDbTarea.color,
            estado: newDbTarea.estado
          };
          setTareas([newTarea, ...tareas]);
        }
        
        Swal.fire({
          title: '¡Guardado!', 
          text: 'La tarea ha sido registrada exitosamente.', 
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
       console.error("Error saving tarea:", err);
       Swal.fire('Error', 'Hubo un error al guardar la tarea.', 'error');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: '¿Confirmar eliminación?',
      text: `Se eliminará permanentemente la tarea: "${name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from('mantenimiento_tarea').delete().eq('id', id);
          if (error) throw error;
          setTareas(tareas.filter(t => t.id !== id));
          Swal.fire('Eliminada!', 'La tarea fue borrada exitosamente.', 'success');
        } catch (err) {
          console.error("Error deleting tarea:", err);
          Swal.fire('Error', 'Hubo un error al eliminar la tarea.', 'error');
        }
      }
    });
  };

  const colors = [
    'bg-slate-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-emerald-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-fuchsia-500', 'bg-rose-500'
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
             <ClipboardList className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
             Catálogo de Tareas
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-sm">Gestión de tiempos y costos estándar de mano de obra.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            className="flex items-center gap-2 font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            onClick={handleOpenNew}
          >
            <Plus className="w-5 h-5" /> Nueva Tarea
          </Button>
        </div>
      </div>

      {/* Toolbox */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por descripción..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white"
            />
         </div>
         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <div className="px-4 py-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">Total: <span className="text-indigo-600 dark:text-indigo-400">{tareas.length}</span></div>
         </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTareas.map((tarea) => (
          <div key={tarea.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col h-full">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${tarea.color}`}></div>
            
            <div className="flex justify-between items-start mb-4">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <div className={`w-3 h-3 rounded-full ${tarea.color} shadow-sm border border-white dark:border-slate-800`}></div>
                     <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">ID: {tarea.id.slice(0, 5)}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight pr-4">{tarea.descripcion}</h3>
               </div>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditClick(tarea)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                     <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(tarea.id, tarea.descripcion)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                     <Trash2 className="w-4 h-4" />
                  </button>
               </div>
            </div>

            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{tarea.tiempoEstandarMinutos} min estándar</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span>${tarea.costoManoObra.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
               <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Costo / Hr:</span>
                  <span className="text-[12px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                     ${Math.round((tarea.costoManoObra / tarea.tiempoEstandarMinutos) * 60).toLocaleString()}
                  </span>
               </div>
               <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                     tarea.estado === 'Activo' 
                     ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                     : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                     {tarea.estado}
                  </span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTareas.length === 0 && (
         <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-1">No hay tareas</h3>
            <p className="text-slate-500 text-sm font-medium">No se encontraron resultados para tu búsqueda.</p>
         </div>
      )}

      {/* Modal - Nueva/Editar Tarea */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingTareaId ? "Editar Tarea" : "Crear Nueva Tarea"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Descripción de la Tarea *</label>
              <input 
                type="text" 
                required
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all" 
                placeholder="Ej. Reemplazo de Filtro de Aire" 
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Tiempo Estándar (Min)</label>
                 <input 
                   type="number"
                   value={tiempoEstandarMinutos}
                   onChange={(e) => setTiempoEstandarMinutos(Number(e.target.value))}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                 />
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Costo Mano de Obra ($)</label>
                 <input 
                   type="number"
                   value={costoManoObra}
                   onChange={(e) => setCostoManoObra(Number(e.target.value))}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                 />
              </div>
           </div>

           <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Color Base</label>
              <div className="flex gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex-wrap justify-between items-center h-[42px]">
                 {colors.slice(0, 7).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-5 h-5 rounded-full ${c} ${color === c ? 'ring-2 ring-offset-1 ring-slate-800 dark:ring-white dark:ring-offset-slate-900' : ''}`}
                    />
                 ))}
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
             <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
             <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-sm shadow-indigo-600/20">
               {editingTareaId ? "Actualizar Tarea" : "Crear Tarea"}
             </Button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
