import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Edit3,
  AlertCircle,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';
import { useAppContext } from '../../context/AppContext';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';

export default function GestionFallas() {
  const { tiposFalla, crearTipoFalla, eliminarTipoFalla } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [modeloAfectado, setModeloAfectado] = useState('');
  const [criticidad, setCriticidad] = useState<'Baja' | 'Media' | 'Alta' | 'Muy Alta'>('Alta');
  const [causa, setCausa] = useState('MECÁNICA');
  const [tfs, setTfs] = useState(20);

  const filteredFallas = tiposFalla.filter(f => 
    (f.nombre || f.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { activeCompanyId } = useCompany();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const totalPages = Math.ceil(filteredFallas.length / itemsPerPage);
  const paginatedFallas = filteredFallas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion) return;

    try {
      const dbFalla = {
        empresa_id: activeCompanyId,
        nombre: descripcion,
        descripcion,
        modelo_afectado: modeloAfectado,
        criticidad: criticidad?.toUpperCase() || 'ALTA',
        causa: causa,
        tfs_predeterminado_horas: tfs
      };

      const { data, error } = await supabase.from('tipo_falla').insert(dbFalla).select().single();
      
      if (error) throw error;

      if (data) {
        crearTipoFalla({
          ...data,
          id: data.id,
          nombre: data.nombre,
          descripcion: data.descripcion,
          modelo_afectado: data.modelo_afectado,
          criticidad: data.criticidad,
          causa: data.causa,
          tfs_predeterminado_horas: Number(data.tfs_predeterminado_horas)
        } as any);
      }

      Swal.fire({
        title: '¡Guardado!', 
        text: 'El tipo de falla ha sido registrado exitosamente.', 
        icon: 'success',
        confirmButtonColor: '#4f46e5'
      });
      
      setIsModalOpen(false);
      setDescripcion('');
      setModeloAfectado('');
      setCriticidad('Alta');
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: '¿Confirmar eliminación?',
      text: `Se eliminará permanentemente la falla: "${name}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { error } = await supabase.from('tipo_falla').delete().eq('id', id);
        if (error) {
          Swal.fire('Error', error.message, 'error');
        } else {
          eliminarTipoFalla(id);
          Swal.fire('Eliminado!', 'El tipo de falla fue borrado exitosamente.', 'success');
        }
      }
    });
  };

  const hashColor = (str: string) => {
     const hash = Array.from(str).reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
     const cNames = ['bg-slate-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-rose-500'];
     return cNames[Math.abs(hash) % cNames.length];
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
             <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-500" />
             Gestión de Fallas
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-sm">Catálogo de incidencias mecánicas y operativas.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button 
            className="flex items-center gap-2 font-bold px-6 bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-5 h-5" /> Nueva Falla
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500/50 outline-none transition-all dark:text-white"
            />
         </div>
         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <div className="px-4 py-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">Total: <span className="text-rose-600 dark:text-rose-400">{tiposFalla.length}</span></div>
         </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Descripción / Nombre</th>
                <th className="px-6 py-4">Modelo Afectado</th>
                <th className="px-6 py-4">Causa</th>
                <th className="px-6 py-4 text-center">TFS (Horas)</th>
                <th className="px-6 py-4 text-center">Criticidad</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFallas.map((falla) => (
                <tr key={falla.id} className="border-b last:border-0 border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-200">{falla.nombre || falla.descripcion}</td>
                  <td className="px-6 py-3 font-mono text-slate-500">{falla.modelo_afectado || 'General'}</td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{falla.causa || 'N/A'}</td>
                  <td className="px-6 py-3 text-center font-mono">{Number(falla.tfs_predeterminado_horas || 0).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      falla.criticidad === 'ALTA' || falla.criticidad === 'Alta' 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' 
                        : (falla.criticidad === 'MEDIA' || falla.criticidad === 'Media' 
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' 
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400')
                    }`}>
                      {falla.criticidad}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => handleDelete(falla.id, falla.nombre || falla.descripcion || 'Falla')} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors inline-block">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <span className="text-sm font-medium text-slate-500">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {filteredFallas.length === 0 && (
         <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-1">No hay fallas</h3>
            <p className="text-slate-500 text-sm font-medium">No se encontraron resultados para tu búsqueda.</p>
         </div>
      )}

      {/* Modal - Nueva Falla */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Falla"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
              <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Descripción de la Falla *</label>
              <input 
                type="text" 
                required
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none dark:text-white transition-all" 
                placeholder="Ej. Pérdida de Potencia Motor" 
              />
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Modelo Afectado</label>
                 <input 
                   type="text"
                   value={modeloAfectado}
                   onChange={e => setModeloAfectado(e.target.value)}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none dark:text-white transition-all"
                   placeholder="Ej. O 500 RS E III"
                 />
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Criticidad</label>
                 <select 
                   value={criticidad}
                   onChange={(e) => setCriticidad(e.target.value as any)}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none dark:text-white transition-all"
                 >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Muy Alta">Muy Alta</option>
                 </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Causa Raíz</label>
                 <input 
                   type="text"
                   value={causa}
                   onChange={e => setCausa(e.target.value)}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none dark:text-white transition-all"
                 />
              </div>
              <div className="col-span-2 md:col-span-1">
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">TFS (Horas) *</label>
                 <input 
                   type="number"
                   step="0.01"
                   value={tfs}
                   onChange={e => setTfs(Number(e.target.value))}
                   className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none dark:text-white transition-all"
                 />
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
             <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
             <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 shadow-sm shadow-rose-600/20">
               Crear Falla
             </Button>
           </div>
        </form>
      </Modal>
    </div>
  );
}
