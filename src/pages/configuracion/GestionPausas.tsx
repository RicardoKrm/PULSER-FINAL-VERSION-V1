import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Search, 
  Edit3,
  StopCircle,
  MoreVertical,
  Activity
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';

interface TipoPausa {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  impacto: 'Bajo' | 'Medio' | 'Alto';
  estado: 'Activo' | 'Inactivo';
}

const INITIAL_DATA: TipoPausa[] = [
  { id: '1', nombre: 'Falta de Repuestos', descripcion: 'Pausa por stock insuficiente o retraso logístico.', color: 'bg-rose-500', impacto: 'Alto', estado: 'Activo' },
  { id: '2', nombre: 'Falta de Personal', descripcion: 'Pausa por ausencia de mecánicos o especialistas.', color: 'bg-amber-500', impacto: 'Alto', estado: 'Activo' },
  { id: '3', nombre: 'Esperando Herramienta', descripcion: 'Herramienta especial en uso o dañada.', color: 'bg-blue-500', impacto: 'Medio', estado: 'Activo' },
  { id: '4', nombre: 'Fin de Turno', descripcion: 'El mecánico terminó su turno antes de cerrar la OT.', color: 'bg-slate-500', impacto: 'Bajo', estado: 'Activo' },
  { id: '5', nombre: 'Esperando Aprobación', descripcion: 'Presupuesto o tarea crítica esperando OK.', color: 'bg-indigo-500', impacto: 'Medio', estado: 'Activo' },
  { id: '6', nombre: 'Sin Bahía Disponible', descripcion: 'Falta de espacio en taller para continuar.', color: 'bg-orange-500', impacto: 'Alto', estado: 'Inactivo' },
];

export default function GestionPausas() {
  const [tiposPausa, setTiposPausa] = useState<TipoPausa[]>(INITIAL_DATA);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [impacto, setImpacto] = useState<'Bajo' | 'Medio' | 'Alto'>('Medio');
  const [color, setColor] = useState('bg-slate-500');

  const filteredPausas = tiposPausa.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre) return;

    const newPausa: TipoPausa = {
      id: Date.now().toString(),
      nombre,
      descripcion,
      color,
      impacto,
      estado: 'Activo'
    };

    setTiposPausa([newPausa, ...tiposPausa]);
    
    Swal.fire({
      title: '¡Guardado!', 
      text: 'El tipo de pausa ha sido registrado exitosamente.', 
      icon: 'success',
      confirmButtonColor: '#4f46e5'
    });
    
    setIsModalOpen(false);
    setNombre('');
    setDescripcion('');
    setImpacto('Medio');
    setColor('bg-slate-500');
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: '¿Confirmar eliminación?',
      text: `Se eliminará permanentemente el tipo de pausa: "${name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setTiposPausa(tiposPausa.filter(p => p.id !== id));
        Swal.fire('Eliminado!', 'El tipo de pausa fue borrado exitosamente.', 'success');
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
             <StopCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
             Gestión de Pausas
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-sm">Causas de interrupción de Órdenes de Trabajo.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            className="flex items-center gap-2 font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-5 h-5" /> Nuevo Tipo
          </Button>
        </div>
      </div>

      {/* Toolbox */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o descripción..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white"
            />
         </div>
         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <div className="px-4 py-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">Total: <span className="text-indigo-600 dark:text-indigo-400">{tiposPausa.length}</span></div>
         </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPausas.map((pausa) => (
          <div key={pausa.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden flex flex-col h-full">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${pausa.color}`}></div>
            
            <div className="flex justify-between items-start mb-4">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <div className={`w-3 h-3 rounded-full ${pausa.color} shadow-sm border border-white dark:border-slate-800`}></div>
                     <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">ID: {pausa.id.slice(0, 5)}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight pr-4">{pausa.nombre}</h3>
               </div>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                     <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(pausa.id, pausa.nombre)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                     <Trash2 className="w-4 h-4" />
                  </button>
               </div>
            </div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 flex-1">
               {pausa.descripcion}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
               <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Impacto:</span>
                  <span className={`text-[11px] font-black uppercase tracking-wider ${
                     pausa.impacto === 'Alto' ? 'text-rose-600 dark:text-rose-500' :
                     pausa.impacto === 'Medio' ? 'text-amber-600 dark:text-amber-500' :
                     'text-emerald-600 dark:text-emerald-500'
                  }`}>{pausa.impacto}</span>
               </div>
               <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                     pausa.estado === 'Activo' 
                     ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                     : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                     {pausa.estado}
                  </span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPausas.length === 0 && (
         <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
            <StopCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-1">No hay pausas</h3>
            <p className="text-slate-500 text-sm font-medium">No se encontraron resultados para tu búsqueda.</p>
         </div>
      )}

      {/* Modal - Nuevo Tipo */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Crear Tipo de Pausa"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Nombre de la Pausa *</label>
              <input 
                type="text" 
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all" 
                placeholder="Ej. Falta de Repuestos" 
              />
           </div>

           <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Descripción</label>
              <textarea 
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all resize-none" 
                placeholder="Breve explicación de cuándo usar esta pausa..." 
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Impacto en Tiempos</label>
                 <select 
                   value={impacto}
                   onChange={(e) => setImpacto(e.target.value as any)}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                 >
                    <option value="Bajo">Bajo</option>
                    <option value="Medio">Medio</option>
                    <option value="Alto">Alto</option>
                 </select>
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
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
             <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
             <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-sm shadow-indigo-600/20">
               Crear Pausa
             </Button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
