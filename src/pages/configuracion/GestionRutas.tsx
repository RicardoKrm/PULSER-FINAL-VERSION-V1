import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Search, Map as MapIcon, MoreVertical, Edit2, Trash2, Navigation } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteCoords {
  lat: number;
  lng: number;
}

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
  
  const [mapOriginCoords, setMapOriginCoords] = useState<RouteCoords | null>(null);
  const [mapDestCoords, setMapDestCoords] = useState<RouteCoords | null>(null);
  const [routeLine, setRouteLine] = useState<[number, number][]>([]);

  const fetchRouteOSRM = async (orig: RouteCoords, dest: RouteCoords) => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${orig.lng},${orig.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`);
      const data = await res.json();
      if (data && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords = route.geometry.coordinates.map((c: any) => [c[1], c[0]]);
        setRouteLine(coords);
        setDistanciaKm((route.distance / 1000).toFixed(1));
        setTiempoEstimadoMins(Math.round(route.duration / 60).toString());
      }
    } catch(e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (mapOriginCoords && mapDestCoords) {
      fetchRouteOSRM(mapOriginCoords, mapDestCoords);
    } else {
      setRouteLine([]);
    }
  }, [mapOriginCoords, mapDestCoords]);

  const handleGeocode = async (address: string, type: 'origen' | 'destino') => {
    if (!address) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        if (type === 'origen') {
           setMapOriginCoords(coords);
        } else {
           setMapDestCoords(coords);
        }
      } else {
        alert('No se encontraron resultados para la dirección.');
      }
    } catch (error) {
       console.error(error);
       alert('Error de conexión al buscar la dirección.');
    }
  };

  const MapBounds = ({ origen, destino }: { origen: RouteCoords | null, destino: RouteCoords | null }) => {
    const map = useMap();
    useEffect(() => {
      if (origen && destino) {
        map.fitBounds([
          [origen.lat, origen.lng],
          [destino.lat, destino.lng]
        ], { padding: [50, 50] });
      } else if (origen) {
        map.flyTo([origen.lat, origen.lng], 14, { animate: true });
      } else if (destino) {
        map.flyTo([destino.lat, destino.lng], 14, { animate: true });
      }
    }, [origen, destino, map]);
    return null;
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        if (!mapOriginCoords) {
           setMapOriginCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
           setOrigen(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`);
        } else if (!mapDestCoords) {
           setMapDestCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
           setDestino(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`);
        } else {
           setMapOriginCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
           setOrigen(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)}`);
           setMapDestCoords(null);
           setDestino('');
           setRouteLine([]);
        }
      }
    });
    return null;
  };

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
               <div className="flex gap-2">
                 <input type="text" value={origen} onChange={e => setOrigen(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleGeocode(origen, 'origen'); }} placeholder="Dirección o punto origen" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
                 <button onClick={() => handleGeocode(origen, 'origen')} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-3 transition-colors text-slate-500">
                    <Search className="w-4 h-4" />
                 </button>
               </div>
             </div>
             <div>
               <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2"><MapIcon className="w-4 h-4 text-indigo-500" /> Destino *</label>
               <div className="flex gap-2">
                 <input type="text" value={destino} onChange={e => setDestino(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleGeocode(destino, 'destino'); }} placeholder="Dirección o punto destino" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
                 <button onClick={() => handleGeocode(destino, 'destino')} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-3 transition-colors text-slate-500">
                    <Search className="w-4 h-4" />
                 </button>
               </div>
             </div>
           </div>

           <div className="w-full h-[300px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 relative z-0">
             <MapContainer center={[-33.4372, -70.6506]} zoom={10} scrollWheelZoom={true} className="w-full h-full">
               <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
               <MapClickHandler />
               <MapBounds origen={mapOriginCoords} destino={mapDestCoords} />
               {mapOriginCoords && (
                 <Marker position={[mapOriginCoords.lat, mapOriginCoords.lng]}>
                   <Popup>Origen</Popup>
                 </Marker>
               )}
               {mapDestCoords && (
                 <Marker position={[mapDestCoords.lat, mapDestCoords.lng]}>
                   <Popup>Destino</Popup>
                 </Marker>
               )}
               {routeLine.length > 0 && (
                 <Polyline positions={routeLine} color="#4f46e5" weight={5} />
               )}
             </MapContainer>
             <div className="absolute top-2 right-2 z-[1000] bg-white/90 dark:bg-slate-900/90 p-2 rounded shadow-md text-xs backdrop-blur-sm pointer-events-none">
                <p>1° Click: Origen</p>
                <p>2° Click: Destino</p>
                <p>3° Click: Reiniciar</p>
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
