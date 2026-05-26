import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, Edit, Trash2, MapPin
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

export default function GestionBodegas() {
  const [bodegas, setBodegas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBodega, setEditingBodega] = useState<any | null>(null);

  const { proveedores } = useAppContext();
  const { currentCompany } = useCompany();
  const [bodegueros, setBodegueros] = useState<any[]>([]);

  useEffect(() => {
    fetchBodegas();
  }, []);

  useEffect(() => {
    const fetchColaboradores = async () => {
      if (!currentCompany?.id) return;
      const { data, error } = await supabase.from('colaborador')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .ilike('rol', '%bodeguero%');
      if (error) {
        console.error('Error fetching colaboradores:', error);
      } else if (data) {
        setBodegueros(data);
      }
    };
    fetchColaboradores();
  }, [currentCompany]);

  const fetchBodegas = async () => {
    try {
      const res = await fetch('/api/bodegas');
      const data = await res.json();
      setBodegas(data);
    } catch (e) {
      console.error(e);
    }
  };

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Principal',
    identificador: 1,
    proveedor: '',
    responsable: '',
    ubicacion: 'Sin ubicación',
    estado: 'Activo'
  });

  const filteredBodegas = bodegas.filter(b => 
    b.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.responsable.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBodega) {
        await fetch(`/api/bodegas/${editingBodega.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch('/api/bodegas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      fetchBodegas();
      setIsModalOpen(false);
      setEditingBodega(null);
      setFormData({ nombre: '', tipo: 'Principal', identificador: 1, proveedor: '', responsable: '', ubicacion: 'Sin ubicación', estado: 'Activo' });
      Swal.fire('Éxito', 'Bodega guardada correctamente', 'success');
    } catch (e) {
      Swal.fire('Error', 'No se pudo guardar', 'error');
    }
  };

  const openEditModal = (bodega: typeof bodegas[0] & { identificador?: number, proveedor?: string }) => {
    setEditingBodega(bodega as any);
    setFormData({
      nombre: bodega.nombre,
      tipo: bodega.tipo,
      identificador: bodega.identificador || 1,
      proveedor: bodega.proveedor || '',
      responsable: bodega.responsable,
      ubicacion: bodega.ubicacion,
      estado: bodega.estado
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#ef4444'
    });
    if (result.isConfirmed) {
      try {
        await fetch(`/api/bodegas/${id}`, { method: 'DELETE' });
        fetchBodegas();
        Swal.fire('Eliminado!', 'La bodega ha sido eliminada.', 'success');
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-slate-800 dark:text-slate-200" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestión de Bodegas</h1>
          </div>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Crea y administra las bodegas y ubicaciones de almacenamiento
          </p>
        </div>

        <Button 
          className="bg-[#06b6d4] hover:bg-[#0891b2] text-white"
          onClick={() => {
            setEditingBodega(null);
            setFormData({ nombre: '', tipo: 'Principal', identificador: 1, proveedor: '', responsable: '', ubicacion: 'Sin ubicación', estado: 'Activo' });
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Bodega
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-sm">
            <input 
              type="text" 
              placeholder="Buscar por nombre o responsable..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">NOMBRE DE LA BODEGA</th>
                <th className="px-6 py-4 font-semibold">TIPO</th>
                <th className="px-6 py-4 font-semibold">RESPONSABLE</th>
                <th className="px-6 py-4 font-semibold">UBICACIÓN</th>
                <th className="px-6 py-4 font-semibold text-center">ESTADO</th>
                <th className="px-6 py-4 font-semibold text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBodegas.map((bodega) => (
                <tr key={bodega.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      {bodega.nombre}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{bodega.tipo}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{bodega.responsable}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {bodega.ubicacion}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      bodega.estado === 'Activo' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {bodega.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(bodega)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(bodega.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title=""
      >
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-black text-[#1e293b] dark:text-white mb-6">
            {editingBodega ? 'Editar Bodega' : 'Crear Nueva Bodega'}
          </h2>
          
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">NOMBRE DE LA BODEGA</label>
              <input 
                required
                type="text"
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#0891b2] outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">TIPO</label>
                <select
                  value={formData.tipo}
                  onChange={e => setFormData({...formData, tipo: e.target.value})}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#0891b2] outline-none transition-all"
                >
                  <option value="Principal">Principal</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Transitoria">Transitoria</option>
                  <option value="Proveedor">Proveedor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">N° IDENTIFICADOR</label>
                <input
                  type="number"
                  min="1"
                  value={formData.identificador}
                  onChange={e => setFormData({...formData, identificador: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#0891b2] outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5">PROVEEDOR ASOCIADO</label>
              <span className="block text-[10px] text-slate-400 italic mb-1.5">(Solo si la bodega es de consignación)</span>
              <select
                value={formData.proveedor}
                onChange={e => setFormData({...formData, proveedor: e.target.value})}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#0891b2] outline-none transition-all"
              >
                <option value="" disabled>---------</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.nombre}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-0.5">RESPONSABLE DE BODEGA</label>
              <span className="block text-[10px] text-slate-400 italic mb-1.5">Seleccione al usuario encargado de este inventario.</span>
              <select
                value={formData.responsable}
                onChange={e => setFormData({...formData, responsable: e.target.value})}
                className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#0891b2] outline-none transition-all"
              >
                <option value="" disabled>Sin responsable asignado</option>
                {bodegueros.map(b => (
                  <option key={b.id} value={`${b.nombre} ${b.apellidoPaterno || ''}`.trim()}>
                    {b.nombre} {b.apellidoPaterno}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 border-dashed">
              <Button type="submit" className="w-full bg-[#0891b2] hover:bg-[#0e7490] text-white font-bold py-3.5 rounded-xl uppercase tracking-wider mb-4">
                GUARDAR BODEGA
              </Button>
              
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="text-sm font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors"
                >
                  Cancelar y volver
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
