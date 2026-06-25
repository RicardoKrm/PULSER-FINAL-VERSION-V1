import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Search, Map as MapIcon, MoreVertical, Edit2, Trash2, Navigation, Clock, Activity, AlertOctagon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
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
  corredor_tolerancia_metros?: number;
}

interface Geocerca {
  id: string;
  nombre: string;
  tipo: string;
  tiempo_tolerancia_mins: number;
  lat: number;
  lng: number;
  radio_metros: number;
}

function GestionRutasContent() {
  const { activeCompanyId } = useCompany();
  // Tabs
  const [activeTab, setActiveTab] = useState<'rutas' | 'geocercas'>('rutas');

  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [geocercas, setGeocercas] = useState<Geocerca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalRutaOpen, setIsModalRutaOpen] = useState(false);
  const [isModalGeoOpen, setIsModalGeoOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ruta Form State
  const [nombre, setNombre] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [distancia_km, setDistanciaKm] = useState('');
  const [tiempo_estimado_mins, setTiempoEstimadoMins] = useState('');
  const [toleranciaRuta, setToleranciaRuta] = useState('50');
  
  const [mapOriginCoords, setMapOriginCoords] = useState<RouteCoords | null>(null);
  const [mapDestCoords, setMapDestCoords] = useState<RouteCoords | null>(null);

  // Geocerca Form State
  const [geoNombre, setGeoNombre] = useState('');
  const [geoTipo, setGeoTipo] = useState('Puerto');
  const [geoTiempoTolerancia, setGeoTiempoTolerancia] = useState('');
  const [geoCoords, setGeoCoords] = useState<RouteCoords | null>(null);
  const [geoRadio, setGeoRadio] = useState('800');

  useEffect(() => {
    fetchData();
  }, [activeCompanyId]);

  const fetchData = async () => {
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

      // Load mock geocercas or extract from empresa.detalles
      if (activeCompanyId && activeCompanyId !== 'GLOBAL') {
          const { data: compData } = await supabase.from('empresa').select('detalles').eq('id', activeCompanyId).single();
          if (compData && compData.detalles && compData.detalles.geocercas) {
             setGeocercas(compData.detalles.geocercas);
          } else {
             setGeocercas([
                { id: '1', nombre: 'Puerto Coloso', tipo: 'Puerto', tiempo_tolerancia_mins: 120, lat: -20.600, lng: -69.300, radio_metros: 800 },
                { id: '2', nombre: 'Planta Principal', tipo: 'Planta', tiempo_tolerancia_mins: 60, lat: -20.550, lng: -69.350, radio_metros: 600 },
             ]);
          }
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

    const payload = {
      empresa_id: saveCompanyId,
      nombre,
      origen,
      destino,
      distancia_km: distancia_km ? parseFloat(distancia_km) : null,
      tiempo_estimado_mins: tiempo_estimado_mins ? parseInt(tiempo_estimado_mins) : null,
      paradas: { corredor_metros: parseInt(toleranciaRuta) } // saving in JSON for now
    };

    const { error } = await supabase.from('operacion_ruta').insert([payload]);

    if (!error) {
      setIsModalRutaOpen(false);
      fetchData();
      setNombre(''); setOrigen(''); setDestino(''); setDistanciaKm(''); setTiempoEstimadoMins(''); setToleranciaRuta('50');
      setMapOriginCoords(null); setMapDestCoords(null);
    } else {
      alert("Error al guardar la ruta. Asegúrate de que la tabla 'operacion_ruta' exista.");
    }
  };

  const handleDeleteRuta = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta ruta?")) {
      await supabase.from('operacion_ruta').delete().eq('id', id);
      setRutas(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleSaveGeocerca = async () => {
    if (!geoNombre || !geoCoords || !geoTiempoTolerancia) {
      alert("Debes llenar nombre, pin en mapa y zona de tolerancia.");
      return;
    }

    const saveCompanyId = activeCompanyId === 'GLOBAL' ? null : activeCompanyId;
    if (!saveCompanyId) {
      alert("Debes seleccionar una empresa.");
      return;
    }

    const newGeo: Geocerca = {
      id: Math.random().toString(36).substr(2, 9),
      nombre: geoNombre,
      tipo: geoTipo,
      tiempo_tolerancia_mins: parseInt(geoTiempoTolerancia),
      lat: geoCoords.lat,
      lng: geoCoords.lng,
      radio_metros: parseInt(geoRadio)
    };

    const updated = [...geocercas, newGeo];
    
    // Save to empresa.detalles JSON
    const { data: comp } = await supabase.from('empresa').select('detalles').eq('id', saveCompanyId).single();
    let detalles = comp?.detalles || {};
    detalles.geocercas = updated;

    await supabase.from('empresa').update({ detalles }).eq('id', saveCompanyId);

    setGeocercas(updated);
    setIsModalGeoOpen(false);
    setGeoNombre(''); setGeoTiempoTolerancia(''); setGeoCoords(null);
  };

  const handleDeleteGeo = async (id: string) => {
    if (confirm("¿Eliminar geocerca?")) {
       const updated = geocercas.filter(g => g.id !== id);
       setGeocercas(updated);
       if (activeCompanyId && activeCompanyId !== 'GLOBAL') {
          const { data: comp } = await supabase.from('empresa').select('detalles').eq('id', activeCompanyId).single();
          let detalles = comp?.detalles || {};
          detalles.geocercas = updated;
          await supabase.from('empresa').update({ detalles }).eq('id', activeCompanyId);
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
            Configuración Operacional
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Define las rutas de servicio y las geocercas para alimentar las alertas operativas del panel FleetSat.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none"
            />
          </div>
          {activeTab === 'rutas' ? (
             <button onClick={() => setIsModalRutaOpen(true)} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
               <Plus className="w-4 h-4" /> Nueva Ruta
             </button>
          ) : (
             <button onClick={() => setIsModalGeoOpen(true)} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
               <Plus className="w-4 h-4" /> Nueva Geocerca
             </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-1 flex gap-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 self-start inline-flex">
        <button
           onClick={() => setActiveTab('rutas')}
           className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'rutas' ? 'bg-slate-100 text-indigo-700 dark:bg-slate-800 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
        >
           <MapPin className="w-4 h-4"/> Construcción de Rutas
        </button>
        <button
           onClick={() => setActiveTab('geocercas')}
           className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'geocercas' ? 'bg-slate-100 text-emerald-700 dark:bg-slate-800 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700'}`}
        >
           <AlertOctagon className="w-4 h-4"/> Geocercas (Zonas de Interés)
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Cargando datos...</div>
      ) : activeTab === 'rutas' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRutas.length > 0 ? filteredRutas.map(ruta => (
            <div key={ruta.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
               <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{ruta.nombre}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <span><Clock className="w-3 h-3 inline mr-1 text-amber-500"/> {ruta.tiempo_estimado_mins || 0} min</span>
                      <span>•</span>
                      <span><Navigation className="w-3 h-3 inline mr-1 text-indigo-500"/> {ruta.distancia_km || 0} km</span>
                    </div>
                  </div>
                  <div className="relative group/menu">
                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 w-40">
                       <button onClick={() => handleDeleteRuta(ruta.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
                         <Trash2 className="w-4 h-4" /> Eliminar Ruta
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
                 
                 <div className="pt-2">
                   <div className="bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded text-xs font-bold text-indigo-700 dark:text-indigo-400 flex justify-between items-center">
                     <span>Corredor Tolerancia Desvío</span>
                     <span className="bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded">{ruta.paradas?.corredor_metros || 50}m</span>
                   </div>
                 </div>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800">
                 <button 
                   onClick={() => handleOpenMap(ruta.origen, ruta.destino)}
                   className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm text-slate-600 dark:text-slate-300 transition-colors"
                 >
                   <Navigation className="w-4 h-4" /> Ver Integración Base
                 </button>
               </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
              No se encontraron rutas. Crea tu primera ruta para agilizar la programación de viajes.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {geocercas.length > 0 ? geocercas.map(geo => (
              <div key={geo.id} className="bg-white border text-left p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition">
                 <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-3">
                   <div>
                     <h3 className="font-black text-lg text-slate-800">{geo.nombre}</h3>
                     <span className="bg-emerald-100 text-emerald-800 uppercase px-2 py-0.5 rounded text-[10px] font-black tracking-widest">{geo.tipo}</span>
                   </div>
                   <button onClick={() => handleDeleteGeo(geo.id)} className="text-slate-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4"/></button>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 text-sm">
                   <div className="bg-slate-50 p-2 rounded">
                     <span className="block text-[10px] uppercase font-bold text-slate-400">Tolerancia Máx.</span>
                     <span className="font-black text-slate-800 flex items-center gap-1.5 mt-0.5"><Clock className="w-4 h-4 text-emerald-500"/> {geo.tiempo_tolerancia_mins} min</span>
                   </div>
                   <div className="bg-slate-50 p-2 rounded">
                     <span className="block text-[10px] uppercase font-bold text-slate-400">Radio Apertura</span>
                     <span className="font-black text-slate-800 flex items-center gap-1.5 mt-0.5"><Activity className="w-4 h-4 text-indigo-500"/> {geo.radio_metros}m</span>
                   </div>
                 </div>
                 
                 <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-2 bg-slate-50 py-1.5 rounded uppercase font-bold border border-slate-100 mt-2">
                    <MapPin className="w-3 h-3 text-slate-400"/>
                    GPS: {geo.lat.toFixed(4)}, {geo.lng.toFixed(4)}
                 </div>
              </div>
           )) : (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
                Aún no has configurado Geocercas para la operación.
              </div>
           )}
        </div>
      )}

      {/* RUTA MODAL */}
      {isModalRutaOpen && (
        <Modal isOpen={isModalRutaOpen} onClose={() => setIsModalRutaOpen(false)} title="Crear Ruta (Monitoreo)">
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre de la Ruta *</label>
               <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. STGO - CALAMA (Ruta Norte)" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
             </div>
             
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

             <div className="grid grid-cols-3 gap-4">
               <div>
                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Distancia (km)</label>
                 <input type="number" readOnly value={distancia_km} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500" />
               </div>
               <div>
                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">ETA Base (mins)</label>
                 <input type="number" readOnly value={tiempo_estimado_mins} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500" />
               </div>
               <div>
                 <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Tolerancia Desvío (m)</label>
                 <select value={toleranciaRuta} onChange={e => setToleranciaRuta(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500">
                   <option value="50">50 metros (Estricto)</option>
                   <option value="100">100 metros (Normal)</option>
                   <option value="300">300 metros (Flexible)</option>
                 </select>
               </div>
             </div>
             
             <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded border border-blue-100 mt-2 font-medium">
               El corredor de tolerancia determinará cuándo el módulo FleetSat levantará una alerta de <strong className="font-black">Desvío de Ruta</strong>. Exceder los {toleranciaRuta}m del eje principal se considerará anomalía.
             </div>

             <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 mt-6">
               <Button variant="outline" onClick={() => setIsModalRutaOpen(false)}>Cancelar</Button>
               <Button variant="primary" onClick={handleSaveRuta}>Guardar Ruta</Button>
             </div>
           </div>
        </Modal>
      )}

      {/* GEOCERCA MODAL */}
      {isModalGeoOpen && (
         <Modal isOpen={isModalGeoOpen} onClose={() => setIsModalGeoOpen(false)} title="Declarar Geocerca Operacional">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre (Punto de Interés)</label>
                   <input type="text" value={geoNombre} onChange={e => setGeoNombre(e.target.value)} placeholder="Ej. Planta Chañaral" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm" />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Geocerca</label>
                   <select value={geoTipo} onChange={e => setGeoTipo(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                     <option value="Puerto">Puerto</option>
                     <option value="Planta">Planta de Proceso</option>
                     <option value="Mina">Mina / Faena</option>
                     <option value="Pesaje">Cancha / Báscula Pesaje</option>
                     <option value="Espera">Zona de Espera Autorizada</option>
                     <option value="Peaje">Peaje</option>
                   </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1">Tolerancia Detenida (Minutos)</label>
                   <input type="number" value={geoTiempoTolerancia} onChange={e => setGeoTiempoTolerancia(e.target.value)} placeholder="120" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-black text-amber-700" />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1">Radio Cobertura (Metros)</label>
                   <input type="number" value={geoRadio} onChange={e => setGeoRadio(e.target.value)} placeholder="800" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm" />
                 </div>
              </div>
              
              <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded border border-amber-100 mt-2 font-medium">
                 Cualquier detención dentro de este perímetro <strong className="font-black">menor a {geoTiempoTolerancia || 'X'} min</strong> se considerará Espera Normal. Si supera este tiempo, FleetSat emitirá alerta <strong className="font-black text-red-700">Tiempo Excedido</strong>.
              </div>

              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1 border-t border-slate-200 pt-4 mt-2">Ubicar en el Mapa * (Click para definir centro)</label>
                 <GeocercaMapPicker geoCoords={geoCoords} setGeoCoords={setGeoCoords} />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 mt-4">
               <Button variant="outline" onClick={() => setIsModalGeoOpen(false)}>Cancelar</Button>
               <Button variant="primary" onClick={handleSaveGeocerca}>Guardar Geocerca</Button>
             </div>
            </div>
         </Modal>
      )}
    </div>
  );
}

function GeocercaMapPicker({ geoCoords, setGeoCoords }: any) {
  function MapEvents() {
    useMapEvents({
      click(e) {
        setGeoCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  }

  return (
    <div className="w-full h-[250px] rounded-lg overflow-hidden border border-slate-200 relative z-0">
         <MapContainer
            center={geoCoords ? [geoCoords.lat, geoCoords.lng] : [-20.60, -69.30]}
            zoom={11}
            className="w-full h-full"
         >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <MapEvents />
            {geoCoords && (
               <Marker position={[geoCoords.lat, geoCoords.lng]} />
            )}
         </MapContainer>
         {geoCoords && (
           <div className="absolute top-2 right-2 z-[1000] bg-white p-2 text-xs font-mono font-bold rounded shadow border border-slate-200 flex flex-col items-center">
             <span>{geoCoords.lat.toFixed(4)}</span>
             <span>{geoCoords.lng.toFixed(4)}</span>
           </div>
         )}
    </div>
  );
}

function MapRouteBuilder({ origen, setOrigen, destino, setDestino, setDistanciaKm, setTiempoEstimadoMins, setMapOriginCoords, setMapDestCoords, mapOriginCoords, mapDestCoords }: any) {
  
  const handleGeocode = async (address: string, type: 'origen' | 'destino') => {
    if (!address) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Chile')}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        if (type === 'origen') setMapOriginCoords(coords);
        else setMapDestCoords(coords);
      } else {
        alert('No se encontraron resultados en Chile.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al buscar la dirección.');
    }
  };

  useEffect(() => {
    if (mapOriginCoords && mapDestCoords) {
      // Simulate distance and time calculation since we don't have a free routing API readily available in the browser without an API key
      const R = 6371e3; // metres
      const φ1 = mapOriginCoords.lat * Math.PI/180;
      const φ2 = mapDestCoords.lat * Math.PI/180;
      const Δφ = (mapDestCoords.lat-mapOriginCoords.lat) * Math.PI/180;
      const Δλ = (mapDestCoords.lng-mapOriginCoords.lng) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      const d = R * c; // in metres
      const distanceKm = (d / 1000) * 1.3; // multiply by 1.3 to approximate road distance from straight line
      
      setDistanciaKm(distanceKm.toFixed(1));
      // Assume average speed of 60 km/h
      setTiempoEstimadoMins(Math.round((distanceKm / 60) * 60).toString());
    }
  }, [mapOriginCoords, mapDestCoords, setDistanciaKm, setTiempoEstimadoMins]);

  function MapRouteEvents() {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
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
      }
    });
    return null;
  }

  return (
     <>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
           <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500" /> Origen *</label>
           <div className="flex gap-2">
             <input type="text" value={origen} onChange={e => setOrigen(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleGeocode(origen, 'origen'); }} placeholder="Dirección o punto origen" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
             <button type="button" onClick={() => handleGeocode(origen, 'origen')} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-3 transition-colors text-slate-500">
                <Search className="w-4 h-4" />
             </button>
           </div>
         </div>
         <div>
           <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2"><MapIcon className="w-4 h-4 text-indigo-500" /> Destino *</label>
           <div className="flex gap-2">
             <input type="text" value={destino} onChange={e => setDestino(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleGeocode(destino, 'destino'); }} placeholder="Dirección o punto destino" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" />
             <button type="button" onClick={() => handleGeocode(destino, 'destino')} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-3 transition-colors text-slate-500">
                <Search className="w-4 h-4" />
             </button>
           </div>
         </div>
       </div>

       <div className="w-full h-[300px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 relative z-0">
         <MapContainer
            center={mapOriginCoords ? [mapOriginCoords.lat, mapOriginCoords.lng] : [-33.4372, -70.6506]}
            zoom={10}
            className="w-full h-full"
         >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <MapRouteEvents />
            {mapOriginCoords && (
               <Marker position={[mapOriginCoords.lat, mapOriginCoords.lng]} />
            )}
            {mapDestCoords && (
               <Marker position={[mapDestCoords.lat, mapDestCoords.lng]} />
            )}
            {mapOriginCoords && mapDestCoords && (
               <Polyline positions={[[mapOriginCoords.lat, mapOriginCoords.lng], [mapDestCoords.lat, mapDestCoords.lng]]} color="blue" />
            )}
         </MapContainer>
         <div className="absolute top-2 right-2 z-[1000] bg-white/90 dark:bg-slate-900/90 p-2 rounded shadow-md text-xs backdrop-blur-sm pointer-events-none">
            <p className="font-bold">Generación de Tolerancia</p>
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
      <GestionRutasContent />
  );
}

