import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Building2, Users, MapPin, Plus, Trash2, Search, Edit2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function Mantenedores() {
  const [activeTab, setActiveTab] = useState('empresas');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [empresas, setEmpresas] = useState<{id:number, nombre: string}[]>([]);
  const [tiposCliente, setTiposCliente] = useState<{id:number, nombre: string}[]>([]);
  const [origenes, setOrigenes] = useState<{id:number, ruta: string}[]>([]);

  const [newItem, setNewItem] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resEmpresas, resTipos, resRutas] = await Promise.all([
        supabase.from('empresa_cliente').select('*').order('id', { ascending: true }),
        supabase.from('tipo_cliente_empresa').select('*').order('id', { ascending: true }),
        supabase.from('rutas_origen_destino').select('*').order('id', { ascending: true }),
      ]);

      if (resEmpresas.data) setEmpresas(resEmpresas.data);
      if (resTipos.data) setTiposCliente(resTipos.data);
      if (resRutas.data) setOrigenes(resRutas.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if(!newItem.trim()) return;

    try {
      if (editingId) {
        // Edit mode
        if(activeTab === 'empresas') {
          const { error } = await supabase.from('empresa_cliente').update({ nombre: newItem }).eq('id', editingId);
          if (error) throw error;
        } else if(activeTab === 'tiposCliente') {
          const { error } = await supabase.from('tipo_cliente_empresa').update({ nombre: newItem }).eq('id', editingId);
          if (error) throw error;
        } else if(activeTab === 'origenes') {
          const { error } = await supabase.from('rutas_origen_destino').update({ ruta: newItem }).eq('id', editingId);
          if (error) throw error;
        }
        toast.success('Registro actualizado exitosamente');
      } else {
        // Create mode
        if(activeTab === 'empresas') {
          const { data, error } = await supabase.from('empresa_cliente').insert([{ nombre: newItem }]).select();
          if (error) throw error;
          if (data) setEmpresas([...empresas, data[0]]);
        } else if(activeTab === 'tiposCliente') {
          const { data, error } = await supabase.from('tipo_cliente_empresa').insert([{ nombre: newItem }]).select();
          if (error) throw error;
          if (data) setTiposCliente([...tiposCliente, data[0]]);
        } else if(activeTab === 'origenes') {
          const { data, error } = await supabase.from('rutas_origen_destino').insert([{ ruta: newItem }]).select();
          if (error) throw error;
          if (data) setOrigenes([...origenes, data[0]]);
        }
        toast.success('Registro creado exitosamente');
      }
      
      setNewItem('');
      setEditingId(null);
      setShowModal(false);
      
      if (editingId) {
        fetchData(); // reload on edit
      }
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error('Ocurrió un error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm('¿Estás seguro de que deseas eliminar este registro?')) return;
    
    try {
      if(activeTab === 'empresas') {
        const { error } = await supabase.from('empresa_cliente').delete().eq('id', id);
        if (error) throw error;
        setEmpresas(empresas.filter(e => e.id !== id));
      } else if(activeTab === 'tiposCliente') {
        const { error } = await supabase.from('tipo_cliente_empresa').delete().eq('id', id);
        if (error) throw error;
        setTiposCliente(tiposCliente.filter(e => e.id !== id));
      } else if(activeTab === 'origenes') {
        const { error } = await supabase.from('rutas_origen_destino').delete().eq('id', id);
        if (error) throw error;
        setOrigenes(origenes.filter(e => e.id !== id));
      }
      toast.success('Registro eliminado');
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast.error('No se pudo eliminar el registro');
    }
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setNewItem(item.nombre || item.ruta);
    setShowModal(true);
  };

  const tabs = [
    { id: 'empresas', label: 'Empresas (Clientes)', icon: Building2 },
    { id: 'tiposCliente', label: 'Tipos de Cliente', icon: Users },
    { id: 'origenes', label: 'Orígenes y Destinos', icon: MapPin },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mantenedores y Tablas Maestras</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Gestiona los catálogos y valores predeterminados del sistema.
        </p>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                isActive 
                  ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-700"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      
      <div className="flex flex-col gap-6">
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={`Buscar ${tabs.find((t) => t.id === activeTab)?.label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow dark:text-white"
              />
            </div>
            <Button 
               onClick={() => {
                 setNewItem('');
                 setEditingId(null);
                 setShowModal(true);
               }}
               className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-2 font-medium"
            >
               <Plus className="h-4 w-4" />
               Añadir {tabs.find((t) => t.id === activeTab)?.label}
            </Button>
          </div>
          
          <CardContent className="p-0">
             <table className="w-full text-left">
               <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                 <tr>
                   <th className="py-3 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                   <th className="py-3 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre / Descripción</th>
                   <th className="py-3 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {activeTab === 'empresas' && empresas.filter(e => e.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                       <td className="py-3 px-6 text-sm text-slate-500 dark:text-slate-400 font-medium">#{e.id}</td>
                       <td className="py-3 px-6 text-sm font-semibold text-slate-700 dark:text-slate-200">{e.nombre}</td>
                       <td className="py-3 px-6 text-right space-x-2">
                          <button onClick={() => openEditModal(e)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Editar">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                       </td>
                    </tr>
                 ))}
                 {activeTab === 'tiposCliente' && tiposCliente.filter(e => e.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                       <td className="py-3 px-6 text-sm text-slate-500 dark:text-slate-400 font-medium">#{e.id}</td>
                       <td className="py-3 px-6 text-sm font-semibold text-slate-700 dark:text-slate-200">{e.nombre}</td>
                       <td className="py-3 px-6 text-right space-x-2">
                          <button onClick={() => openEditModal(e)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Editar">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                       </td>
                    </tr>
                 ))}
                 {activeTab === 'origenes' && origenes.filter(e => e.ruta.toLowerCase().includes(searchTerm.toLowerCase())).map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                       <td className="py-3 px-6 text-sm text-slate-500 dark:text-slate-400 font-medium">#{e.id}</td>
                       <td className="py-3 px-6 text-sm font-semibold text-slate-700 dark:text-slate-200">{e.ruta}</td>
                       <td className="py-3 px-6 text-right space-x-2">
                          <button onClick={() => openEditModal(e)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Editar">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                       </td>
                    </tr>
                 ))}
               </tbody>
             </table>
             {(
               (activeTab === 'empresas' && empresas.length === 0) ||
               (activeTab === 'tiposCliente' && tiposCliente.length === 0) ||
               (activeTab === 'origenes' && origenes.length === 0)
             ) && (
               <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                 No hay registros encontrados.
               </div>
             )}
          </CardContent>
        </Card>

        {/* Modal Overlay para crear */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
               <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                 <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                   <Plus className="h-4 w-4 text-blue-500" />
                   {editingId ? 'Editar Registro' : 'Añadir Nuevo Registro'}
                 </h3>
                 <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                   <X className="h-5 w-5" />
                 </button>
               </div>
               <div className="p-6 space-y-4 bg-slate-50/50 dark:bg-slate-800/20">
                 <div>
                   <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                     {activeTab === 'origenes' ? 'Nombre de la Ruta' : 'Nombre o Descripción'}
                   </label>
                   <input 
                     autoFocus
                     className="w-full px-4 py-2 border border-slate-200 rounded-lg dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:text-white" 
                     placeholder={activeTab === 'origenes' ? 'Ej. Aeropuerto SCEL' : 'Ej. TransCompany S.A.'} 
                     value={newItem}
                     onChange={(e) => setNewItem(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                   />
                 </div>
               </div>
               <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900">
                  <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
                  <Button 
                    onClick={handleAdd} 
                    disabled={!newItem.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center gap-2 font-medium"
                  >
                    {editingId ? 'Guardar Cambios' : 'Guardar Registro'}
                  </Button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
