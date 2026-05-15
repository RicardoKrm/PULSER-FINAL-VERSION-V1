import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Plus, 
  Trash2, 
  Search, 
  AlertTriangle,
  ChevronRight,
  Filter,
  MoreVertical
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';

interface TipoFalla {
  id: number;
  nombre: string;
  criticidad: string;
  frecuencia: string;
}

export default function GestionFallas() {
  const [tiposFalla, setTiposFalla] = useState<TipoFalla[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    fetchFallas();
  }, []);

  const fetchFallas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/configuracion/fallas');
      const data = await res.json();
      setTiposFalla(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Swal.fire('¡Éxito!', 'El tipo de falla ha sido registrado.', 'success');
    setIsModalOpen(false);
    setNombre('');
  };

  const getCriticidadStyle = (criticidad: string) => {
    switch (criticidad) {
      case 'MUY ALTA': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'ALTA': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'MEDIA': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const filteredFallas = tiposFalla.filter(f => f.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
             Tipos de <span className="text-cyan-600">Falla</span>
          </h1>
          <p className="text-slate-500 font-medium italic">Catálogo de incidencias mecánicas y operativas.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 h-12 px-6 rounded-2xl shadow-lg shadow-cyan-600/20 font-black">
           <Plus className="w-5 h-5 mr-2" /> NUEVA FALLA
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm col-span-1 md:col-span-2">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Top Falla Crítica</span>
                <div className="text-sm font-black text-slate-800 dark:text-slate-100">Problema Inyectores</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-medium italic">Frecuencia detectada en 12% de la flota Volvo FH16 este semestre.</p>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por tipo de falla..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-cyan-500 transition-all font-bold text-sm outline-none" 
              />
           </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre / Descripción</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Criticidad</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Frecuencia</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                 <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Cargando catálogo...</td></tr>
              ) : filteredFallas.map((tf) => (
                <tr key={tf.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="font-black text-slate-400">#{tf.id}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-[15px] uppercase">{tf.nombre}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${getCriticidadStyle(tf.criticidad)}`}>
                      {tf.criticidad}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-slate-600 dark:text-slate-400 text-sm">
                    {tf.frecuencia}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button className="p-2 text-slate-400 hover:text-cyan-600 transition-colors">
                          <Trash2 className="w-5 h-5" />
                       </button>
                       <ChevronRight className="w-5 h-5 text-slate-200" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Tipo de Falla">
        <form onSubmit={handleSubmit} className="space-y-6 p-2">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descripción de la Falla</label>
                <input 
                  type="text" 
                  placeholder="Ej: Fugas de aire comprimido..."
                  className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)} 
                  required 
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Criticidad</label>
                  <select className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all">
                     <option>BAJA</option>
                     <option>MEDIA</option>
                     <option>ALTA</option>
                     <option>MUY ALTA</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Frecuencia</label>
                  <select className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all">
                     <option>BAJA</option>
                     <option>MEDIA</option>
                     <option>ALTA</option>
                  </select>
               </div>
            </div>

            <Button type="submit" className="w-full bg-cyan-600 h-14 rounded-2xl font-black text-lg shadow-xl shadow-cyan-600/20">REGISTRAR FALLA EN CATÁLOGO</Button>
        </form>
      </Modal>
    </div>
  );
}
