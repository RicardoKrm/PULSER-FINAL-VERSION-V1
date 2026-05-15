import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Trash, Plus, Search, View, Package, Wrench, Edit, ArrowRight } from 'lucide-react';
import { KitRepuesto, KitRepuestoDetalle } from '../../types';

export default function GestionKits() {
  const { kitsRepuesto, crearKitRepuesto, eliminarKitRepuesto } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [detalles, setDetalles] = useState<KitRepuestoDetalle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Local state for pushing new details
  const [newRepuesto, setNewRepuesto] = useState('');
  const [newCantidad, setNewCantidad] = useState(1);

  const filteredKits = kitsRepuesto.filter(kit => kit.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddDetalle = () => {
    if (!newRepuesto.trim() || newCantidad <= 0) return;
    setDetalles([...detalles, { repuesto: newRepuesto, cantidad: newCantidad }]);
    setNewRepuesto('');
    setNewCantidad(1);
  };

  const handleRemoveDetalle = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || detalles.length === 0) return;
    
    crearKitRepuesto({ 
      id: Math.random().toString(36).substr(2, 9), 
      nombre,
      descripcion,
      detalles
    });
    
    setNombre('');
    setDescripcion('');
    setDetalles([]);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
              <Package className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Agrupación de Repuestos (Kits)</h1>
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Administra kits precargados para asignar rápidamente a Órdenes de Trabajo Reparativas/Preventivas.
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
           <Plus className="w-4 h-4 mr-2" /> 
           Crear Nuevo Kit
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
        <div className="relative w-full sm:max-w-md">
          <input 
            type="text" 
            placeholder="Buscar por nombre de kit..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKits.map(kit => (
          <Card key={kit.id} className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col group">
             <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
               <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 transition-colors uppercase">{kit.nombre}</h3>
                  <div className="flex bg-slate-200 dark:bg-slate-700 rounded-full w-8 h-8 items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    {kit.detalles?.length || 0}
                  </div>
               </div>
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 min-h-[40px] italic">
                 {kit.descripcion || 'Sin descripción...'}
               </p>
             </div>
             <div className="p-5 flex-1 bg-white dark:bg-slate-900">
                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-3 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> Repuestos Incluidos
                </h4>
                <ul className="space-y-2">
                  {kit.detalles?.slice(0, 3).map((det, idx) => (
                    <li key={idx} className="flex justify-between text-sm py-1 border-b border-dashed border-slate-200 dark:border-slate-800 last:border-0">
                      <span className="text-slate-600 dark:text-slate-300 truncate pr-4">{det.repuesto}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 min-w-max">x {det.cantidad}</span>
                    </li>
                  ))}
                  {(kit.detalles?.length || 0) > 3 && (
                     <li className="text-xs text-center text-cyan-600 font-medium pt-2">
                       + {(kit.detalles?.length || 0) - 3} repuestos más
                     </li>
                  )}
                  {(!kit.detalles || kit.detalles.length === 0) && (
                    <li className="text-sm text-slate-400">Kit vacío</li>
                  )}
                </ul>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-2">
               <Button variant="secondary" className="flex-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:text-cyan-600 dark:hover:text-cyan-400">
                 Ver Detalle
               </Button>
               <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => eliminarKitRepuesto(kit.id)}>
                 <Trash className="w-4 h-4" />
               </Button>
             </div>
          </Card>
        ))}
      </div>

      {filteredKits.length === 0 && (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No se encontraron kits</h3>
          <p className="text-slate-500 mt-1">Crea un nuevo kit para agrupar repuestos.</p>
        </div>
      )}
      
      {/* Modal para Crear Kit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nuevo Kit de Repuestos">
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Kit</label>
                <input 
                  type="text" 
                  placeholder="Ej: Kit Mantenedor Mayor Diesel"
                  className="w-full p-2 border rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)} 
                  required 
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                <textarea 
                  rows={2}
                  placeholder="Uso previsto o comentarios..."
                  className="w-full p-2 border rounded-lg dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none transition-all resize-none" 
                  value={descripcion} 
                  onChange={(e) => setDescripcion(e.target.value)} 
                />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-600" />
              Repuestos del Kit
            </h4>
            
            {/* Array Field Add */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Búsqueda de Repuesto / SKU</label>
                <input 
                  type="text" 
                  placeholder="Ej: Filtro de Aceite o 1A-2B"
                  className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 outline-none text-sm" 
                  value={newRepuesto}
                  onChange={(e) => setNewRepuesto(e.target.value)}
                />
              </div>
              <div className="w-24">
                <label className="block text-xs text-slate-500 mb-1">Cant.</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 outline-none text-sm" 
                  value={newCantidad}
                  onChange={(e) => setNewCantidad(parseInt(e.target.value) || 1)}
                />
              </div>
              <Button type="button" variant="secondary" onClick={handleAddDetalle} className="border-slate-300 dark:border-slate-600 h-[38px] px-3 bg-white dark:bg-slate-800">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* List of details */}
            <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {detalles.length === 0 ? (
                  <li className="p-4 text-center text-sm text-slate-400">
                    Aún no añades repuestos al kit.
                  </li>
                ) : (
                  detalles.map((det, index) => (
                    <li key={index} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 px-2 py-0.5 rounded text-xs font-bold">
                          x{det.cantidad}
                        </span>
                        <span className="text-sm font-medium">{det.repuesto}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveDetalle(index)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={!nombre.trim() || detalles.length === 0} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              Guardar Kit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
