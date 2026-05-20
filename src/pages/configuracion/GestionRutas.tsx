import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Search, Map as MapIcon, MoreVertical, Edit2, Trash2, Navigation } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

interface Ruta {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
  paradas?: any[];
  distancia_km?: number;
  tiempo_estimado_mins?: number;
}

export default function GestionRutas() {
  const { activeCompanyId } = useCompany();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [nombre, setNombre] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [distancia_km, setDistanciaKm] = useState('');
  const [tiempo_estimado_mins, setTiempoEstimadoMins] = useState('');

  useEffect(() => {
    fetchRutas();
  }, [activeCompanyId]);

  const fetchRutas = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('operacion_ruta').select('*').order('created_at', { ascending: false });
      
      if (activeCompanyId && activeCompanyId !== 'GLOBAL') {
        query = query.eq('empresa_id', activeCompanyId);
      }
      
      const { data, error } = await query;
      if (!error && data) {
        setRutas(data);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleSaveRuta = async () => {
    if (!nombre || !origen || !destino) {
      alert("Por favor complete los campos requeridos (Nombre, Origen y Destino).");
      return;
    }

    const saveCompanyId = activeCompanyId === 'GLOBAL' ? null : activeCompanyId;
    if (!saveCompanyId) {
      alert("Debes seleccionar una empresa para crear una ruta.");
      return;
    }

    const { error } = await supabase.from('operacion_ruta').insert([{
      empresa_id: saveCompanyId,
      nombre,
      origen,
      destino,
      distancia_km: distancia_km ? parseFloat(distancia_km) : null,
      tiempo_estimado_mins: tiempo_estimado_mins ? parseInt(tiempo_estimado_mins) : null
    }]);

    if (!error) {
      setIsModalOpen(false);
      fetchRutas();
      setNombre('');
      setOrigen('');
      setDestino('');
      setDistanciaKm('');
      setTiempoEstimadoMins('');
    } else {
      alert("Error al guardar la ruta. Asegúrate de que la tabla 'operacion_ruta' exista.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta ruta?")) {
      const { error } = await supabase.from('operacion_ruta').delete().eq('id', id);
      if (!error) {
        setRutas(prev => prev.filter(r => r.id !== id));
      }
    }
  };

  const handleOpenMap = (origenMap: string, destinoMap: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origenMap)}&destination=${encodeURIComponent(destinoMap)}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const filteredRutas = rutas.filter(r => 
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.origen.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.destino.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MapIcon className="w-6 h-6 text-indigo-500" />
            Gestión de Rutas
          </h1>
          <p className="text-slate-500 mt-1">Crea y administra rutas predefinidas con origen, destino y trazado de mapas.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar ruta..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva Ruta
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-10">Cargando rutas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRutas.length > 0 ? filteredRutas.map(ruta => (
            <div key={ruta.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
               <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{ruta.nombre}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <span>{ruta.distancia_km || 0} km</span>
                      <span>•</span>
                      <span>{ruta.tiempo_estimado_mins || 0} min</span>
                    </div>
                  </div>
                  <div className="relative group/menu">
                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                       <button onClick={() => handleDelete(ruta.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
                         <Trash2 className="w-4 h-4" /> Eliminar
                       </button>
                    </div>
                  </div>
               </div>
               <div className="p-5 space-y-4">
                 <div className="flex items-start gap-3">
                   <MapPin className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                   <div>
                     <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Origen</p>
                     <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{ruta.origen}</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-3">
                   <div className="w-4 h-4 rounded-full border-2 border-indigo-500 flex items-center justify-center mt-1 shrink-0">
                     <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                   </div>
                   <div>
                     <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Destino</p>
                     <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{ruta.destino}</p>
                   </div>
                 </div>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800">
                 <button 
                   onClick={() => handleOpenMap(ruta.origen, ruta.destino)}
                   className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm text-slate-600 dark:text-slate-300 transition-colors"
                 >
                   <Navigation className="w-4 h-4" /> Ver Ruta en Mapas
                 </button>
               </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
              No se encontraron rutas. Crea tu primera ruta para agilizar la programación de viajes.
            </div>
          )}
        </div>
      )}

      {/* Modal Nueva Ruta */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nueva Ruta">
         <div className="space-y-4">
           <div>
             <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre de la Ruta *</label>
             <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. STGO - CALAMA (Ruta Norte)" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500" /> Origen *</label>
               <input type="text" value={origen} onChange={e => setOrigen(e.target.value)} placeholder="Dirección o punto origen" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
             </div>
             <div>
               <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2"><MapIcon className="w-4 h-4 text-indigo-500" /> Destino *</label>
               <input type="text" value={destino} onChange={e => setDestino(e.target.value)} placeholder="Dirección o punto destino" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
             </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Distancia estimada (km)</label>
               <input type="number" value={distancia_km} onChange={e => setDistanciaKm(e.target.value)} placeholder="Ej. 120" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
             </div>
             <div>
               <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Tiempo estimado (mins)</label>
               <input type="number" value={tiempo_estimado_mins} onChange={e => setTiempoEstimadoMins(e.target.value)} placeholder="Ej. 180" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
             </div>
           </div>

           <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 mt-6">
             <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
             <Button variant="primary" onClick={handleSaveRuta}>Guardar Ruta</Button>
           </div>
         </div>
      </Modal>
    </div>
  );
}
