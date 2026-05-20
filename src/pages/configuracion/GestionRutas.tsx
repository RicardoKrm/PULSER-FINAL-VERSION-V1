import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Search, Map as MapIcon, MoreVertical, Edit2, Trash2, Navigation } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

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

function GestionRutasContent() {
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
      setMapOriginCoords(null);
      setMapDestCoords(null);
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

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nueva Ruta">
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre de la Ruta *</label>
               <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. STGO - CALAMA (Ruta Norte)" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
             </div>
             
             {!hasValidKey ? (
                <div style={{textAlign:'left', padding: '16px', background: '#fff3cd', borderRadius: '8px', color: '#856404'}}>
                  <h4 style={{fontWeight: 'bold', marginBottom: '8px'}}>Google Maps API Key Required</h4>
                  <p className="text-sm font-medium"><strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener" className="underline">Get an API Key</a></p>
                  <p className="text-sm font-medium"><strong>Step 2:</strong> Add your key as a secret in AI Studio:</p>
                  <ul className="text-sm list-disc pl-5 mt-2 space-y-1">
                    <li>Open <strong>Settings</strong> (⚙️ gear icon, <strong>top-right corner</strong>)</li>
                    <li>Select <strong>Secrets</strong></li>
                    <li>Type <code>GOOGLE_MAPS_PLATFORM_KEY</code> as the secret name, press <strong>Enter</strong></li>
                    <li>Paste your API key as the value, press <strong>Enter</strong></li>
                  </ul>
                  <p className="text-sm mt-2">The app rebuilds automatically after you add the secret.</p>
                </div>
             ) : (
                <MapRouteBuilder 
                   origen={origen} setOrigen={setOrigen}
                   destino={destino} setDestino={setDestino}
                   setDistanciaKm={setDistanciaKm}
                   setTiempoEstimadoMins={setTiempoEstimadoMins}
                   setMapOriginCoords={setMapOriginCoords}
                   setMapDestCoords={setMapDestCoords}
                   mapOriginCoords={mapOriginCoords}
                   mapDestCoords={mapDestCoords}
                />
             )}

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
      )}
    </div>
  );
}

function MapRouteBuilder({ origen, setOrigen, destino, setDestino, setDistanciaKm, setTiempoEstimadoMins, setMapOriginCoords, setMapDestCoords, mapOriginCoords, mapDestCoords }: any) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const placesLib = useMapsLibrary('places');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const handleGeocode = async (address: string, type: 'origen' | 'destino') => {
    if (!address || !placesLib || !map) return;
    placesLib.Place.searchByText({
       textQuery: `${address}, Chile`,
       fields: ['location', 'displayName', 'formattedAddress'],
       maxResultCount: 1,
    }).then(({ places }) => {
       if (places && places.length > 0) {
          const loc = places[0].location;
          if (loc) {
             const coords = { lat: loc.lat(), lng: loc.lng() };
             if (type === 'origen') setMapOriginCoords(coords);
             else setMapDestCoords(coords);
             map.panTo(coords);
             map.setZoom(14);
          }
       } else {
          alert('No se encontraron resultados en Chile.');
       }
    }).catch(e => {
       console.error(e);
       alert('Error de conexión al buscar la dirección.');
    });
  };

  useEffect(() => {
    if (!routesLib || !map) return;
    // Clear previous route
    polylinesRef.current.forEach(p => p.setMap(null));

    if (mapOriginCoords && mapDestCoords) {
      routesLib.Route.computeRoutes({
        origin: mapOriginCoords,
        destination: mapDestCoords,
        travelMode: 'DRIVING',
        fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
      }).then(({ routes }) => {
        if (routes?.[0]) {
          const newPolylines = routes[0].createPolylines();
          newPolylines.forEach(p => p.setMap(map));
          polylinesRef.current = newPolylines;
          
          setDistanciaKm((routes[0].distanceMeters! / 1000).toFixed(1));
          setTiempoEstimadoMins(Math.round(routes[0].durationMillis! / 60000).toString());
          
          if (routes[0].viewport) map.fitBounds(routes[0].viewport);
        }
      }).catch(e => console.error("Error computing route:", e));
    }
    
    return () => polylinesRef.current.forEach(p => p.setMap(null));
  }, [routesLib, map, mapOriginCoords, mapDestCoords, setDistanciaKm, setTiempoEstimadoMins]);

  // Click map behavior
  useEffect(() => {
     if (!map) return;
     const listener = map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        if (!mapOriginCoords) {
           setMapOriginCoords({ lat, lng });
           setOrigen(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        } else if (!mapDestCoords) {
           setMapDestCoords({ lat, lng });
           setDestino(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        } else {
           setMapOriginCoords({ lat, lng });
           setOrigen(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
           setMapDestCoords(null);
           setDestino('');
        }
     });
     return () => {
        google.maps.event.removeListener(listener);
     };
  }, [map, mapOriginCoords, mapDestCoords, setOrigen, setDestino, setMapOriginCoords, setMapDestCoords]);

  return (
     <>
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
         <GoogleMap
            defaultCenter={{ lat: -33.4372, lng: -70.6506 }} // Santiago, Chile defaults
            defaultZoom={10}
            mapId="ROUTE_MAP_ID"
            disableDefaultUI
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
         >
            {mapOriginCoords && (
               <AdvancedMarker position={mapOriginCoords} title="Origen">
                 <Pin background="#10b981" glyphColor="#fff" borderColor="#047857" />
               </AdvancedMarker>
            )}
            {mapDestCoords && (
               <AdvancedMarker position={mapDestCoords} title="Destino">
                 <Pin background="#6366f1" glyphColor="#fff" borderColor="#4338ca" />
               </AdvancedMarker>
            )}
         </GoogleMap>
         <div className="absolute top-2 right-2 z-[1000] bg-white/90 dark:bg-slate-900/90 p-2 rounded shadow-md text-xs backdrop-blur-sm pointer-events-none">
            <p>1° Click: Origen</p>
            <p>2° Click: Destino</p>
            <p>3° Click: Reiniciar</p>
         </div>
       </div>
     </>
  );
}

export default function GestionRutas() {
  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <GestionRutasContent />
    </APIProvider>
  );
}
