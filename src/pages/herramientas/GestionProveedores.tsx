import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Trash, Plus, Search, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import Swal from 'sweetalert2';

export default function GestionProveedores() {
  const { currentCompany } = useCompany();
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [nombre, setNombre] = useState('');
  const [rut, setRut] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProveedores();
  }, [currentCompany]);

  const fetchProveedores = async () => {
    if (!currentCompany?.id) return;
    try {
      const { data, error } = await supabase
        .from('proveedores_directorio')
        .select('*')
        .eq('empresa_id', currentCompany.id);
      
      if (!error && data) {
         setProveedores(data);
      } else {
         // Fallback a localStorage si la tabla aún no se crea
         const local = localStorage.getItem('proveedores_' + currentCompany.id);
         if (local) setProveedores(JSON.parse(local));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProveedores = proveedores.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !currentCompany?.id) return;
    
    const newProv = {
        empresa_id: currentCompany.id,
        nombre,
        rut,
        direccion,
        telefono,
        email
    };

    try {
      const { error } = await supabase.from('proveedores_directorio').insert([newProv]);
      
      if (error) {
         // Fallback a localStorage si falla la BD
         const updated = [...proveedores, { id: Math.random().toString(), ...newProv }];
         setProveedores(updated);
         localStorage.setItem('proveedores_' + currentCompany.id, JSON.stringify(updated));
      } else {
         fetchProveedores();
      }
      
      setNombre('');
      setRut('');
      setDireccion('');
      setTelefono('');
      setEmail('');
      setIsModalOpen(false);
      Swal.fire('Éxito', 'Proveedor guardado correctamente', 'success');
    } catch (e) {
      Swal.fire('Error', 'No se pudo guardar', 'error');
    }
  };

  const eliminarProveedor = async (id: string) => {
    const res = await Swal.fire({
      title: '¿Eliminar proveedor?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    
    if (res.isConfirmed) {
      try {
        const { error } = await supabase.from('proveedores_directorio').delete().eq('id', id);
        
        if (error) {
           const updated = proveedores.filter(p => p.id !== id);
           setProveedores(updated);
           localStorage.setItem('proveedores_' + currentCompany.id, JSON.stringify(updated));
        } else {
           fetchProveedores();
        }
        Swal.fire('Eliminado', '', 'success');
      } catch (e) {
        // Handle error
      }
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
              <Building2 className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Directorio de Proveedores</h1>
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Administra los proveedores de repuestos, servicios insumos.
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
           <Plus className="w-4 h-4 mr-2" /> 
           Nuevo Proveedor
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
        <div className="relative w-full sm:max-w-md">
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProveedores.map(prov => (
          <Card key={prov.id} className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col group">
             <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
               <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 transition-colors">{prov.nombre}</h3>
               </div>
               <div className="text-sm text-slate-500 mt-1 font-mono">{prov.rut || 'Sin RUT'}</div>
             </div>
             <div className="p-5 flex-1 bg-white dark:bg-slate-900 space-y-3">
                <div className="text-sm">
                  <span className="text-slate-500 block text-xs font-bold uppercase">Email</span>
                  {prov.email || '-'}
                </div>
                <div className="text-sm">
                  <span className="text-slate-500 block text-xs font-bold uppercase">Teléfono</span>
                  {prov.telefono || '-'}
                </div>
                <div className="text-sm">
                  <span className="text-slate-500 block text-xs font-bold uppercase">Dirección</span>
                  {prov.direccion || '-'}
                </div>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
               <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => eliminarProveedor(prov.id)}>
                 <Trash className="w-4 h-4" />
               </Button>
             </div>
          </Card>
        ))}
      </div>

      {filteredProveedores.length === 0 && (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No se encontraron proveedores</h3>
          <p className="text-slate-500 mt-1">Crea un nuevo proveedor en el sistema.</p>
        </div>
      )}
      
      {/* Modal para Crear Proveedor */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Ingresar Nuevo Proveedor">
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre o Razón Social *</label>
              <input 
                type="text" 
                placeholder="Ej: Repuestos XYZ"
                className="w-full p-2 border rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RUT</label>
              <input 
                type="text" 
                placeholder="Ej: 76.123.456-7"
                className="w-full p-2 border rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
                value={rut} 
                onChange={(e) => setRut(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
              <input 
                type="text" 
                placeholder="Ej: +569 1234 5678"
                className="w-full p-2 border rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
                value={telefono} 
                onChange={(e) => setTelefono(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
              <input 
                type="email" 
                placeholder="Ej: contacto@empresa.cl"
                className="w-full p-2 border rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección Comercial</label>
              <input 
                type="text" 
                placeholder="Ej: Av. Principal 123, Santiago"
                className="w-full p-2 border rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
                value={direccion} 
                onChange={(e) => setDireccion(e.target.value)} 
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={!nombre.trim()} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              Guardar Proveedor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
