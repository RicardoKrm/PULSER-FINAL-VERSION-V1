import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import Swal from 'sweetalert2';

interface CrearTareaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrear: (nuevaTarea: any) => void;
}

export function CrearTareaModal({ isOpen, onClose, onCrear }: CrearTareaModalProps) {
  const { currentCompany } = useCompany();
  
  const [descripcion, setDescripcion] = useState('');
  const [tiempoEstandarMinutos, setTiempoEstandarMinutos] = useState<number | ''>(60);
  const [costoManoObra, setCostoManoObra] = useState<number | ''>(25000);
  const [color, setColor] = useState('bg-blue-500');

  const resetForm = () => {
    setDescripcion('');
    setTiempoEstandarMinutos(60);
    setCostoManoObra(25000);
    setColor('bg-blue-500');
  };

  const colors = [
    'bg-slate-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
    'bg-emerald-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-fuchsia-500', 'bg-rose-500'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion || !currentCompany?.id) return;

    try {
      const { data, error } = await supabase
        .from('mantenimiento_tarea')
        .insert([{
          empresa_id: currentCompany.id,
          descripcion,
          tiempo_estandar_minutos: tiempoEstandarMinutos || 0,
          costo_mano_obra: costoManoObra || 0,
          color,
          estado: 'Activo'
        }])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newDbTarea = data[0];
        const newTarea = {
          id: newDbTarea.id,
          descripcion: newDbTarea.descripcion,
          tiempoEstandarMinutos: newDbTarea.tiempo_estandar_minutos,
          costoManoObra: newDbTarea.costo_mano_obra,
          color: newDbTarea.color,
          estado: newDbTarea.estado
        };
        onCrear(newTarea);
        
        Swal.fire({
          title: '¡Guardado!', 
          text: 'La tarea ha sido creada exitosamente.', 
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
        
        onClose();
        resetForm();
      }
    } catch (err: any) {
       console.error("Error saving tarea:", err);
       Swal.fire('Error', 'Hubo un error al guardar la tarea.', 'error');
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Crear Nueva Tarea"
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
                 onChange={(e) => setTiempoEstandarMinutos(e.target.value === '' ? '' : Number(e.target.value))}
                 className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
               />
            </div>
            <div>
               <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Costo Mano de Obra ($)</label>
               <input 
                 type="number"
                 value={costoManoObra}
                 onChange={(e) => setCostoManoObra(e.target.value === '' ? '' : Number(e.target.value))}
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
           <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
           <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-sm shadow-indigo-600/20">
             Crear Tarea
           </Button>
         </div>
      </form>
    </Modal>
  );
}
