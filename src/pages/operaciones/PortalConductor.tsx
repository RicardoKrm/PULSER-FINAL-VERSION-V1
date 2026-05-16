import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Truck, Play, CheckCircle2, AlertCircle, FileText, ChevronRight, Briefcase, Baby, Users, Map as MapIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix typical Leaflet icon issues in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Viaje {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  origen: string;
  destino: string;
  vehiculo: string;
  estado: 'PROGRAMADO' | 'EN_CURSO' | 'FINALIZADO';
  pasajeros?: number;
  maletas?: number;
  sillaNino?: number;
  latOrigen?: number;
  lngOrigen?: number;
  tipoViaje: string;
}

const misViajes: Viaje[] = [
  {
    id: 'V-1020',
    fecha: '16 May 2026',
    horaInicio: '08:00',
    horaFin: '12:30',
    origen: 'Iquique (Terminal)',
    destino: 'Faena Collahuasi',
    vehiculo: 'Minibus Sprinter (AB-CD-12)',
    estado: 'EN_CURSO',
    pasajeros: 12,
    maletas: 12,
    sillaNino: 0,
    latOrigen: -20.213,
    lngOrigen: -70.150,
    tipoViaje: 'Subida Personal',
  },
  {
    id: 'V-1025',
    fecha: '17 May 2026',
    horaInicio: '07:30',
    horaFin: '09:00',
    origen: 'Iquique',
    destino: 'Pozo Almonte',
    vehiculo: 'Camioneta Hilux (XX-YY-99)',
    estado: 'PROGRAMADO',
    pasajeros: 3,
    maletas: 2,
    sillaNino: 1,
    latOrigen: -20.213,
    lngOrigen: -70.150,
    tipoViaje: 'Traslado Equipamiento',
  },
  {
    id: 'V-1026',
    fecha: '18 May 2026',
    horaInicio: '15:00',
    horaFin: '19:30',
    origen: 'Faena Collahuasi',
    destino: 'Iquique',
    vehiculo: 'Minibus Sprinter (AB-CD-12)',
    estado: 'PROGRAMADO',
    pasajeros: 15,
    maletas: 15,
    sillaNino: 0,
    latOrigen: -20.966,
    lngOrigen: -68.616,
    tipoViaje: 'Bajada Personal',
  }
];

export default function PortalConductor() {
  const [viajes, setViajes] = useState<Viaje[]>(misViajes);
  const [mapModalData, setMapModalData] = useState<{ isOpen: boolean; lat?: number; lng?: number; label?: string }>({ isOpen: false });

  const activeViaje = viajes.find(v => v.estado === 'EN_CURSO');
  const proximosViajes = viajes.filter(v => v.estado === 'PROGRAMADO');

  const iniciarViaje = (id: string) => {
    setViajes(prev => prev.map(v => v.id === id ? { ...v, estado: 'EN_CURSO' } : v));
  };

  const finalizarViaje = (id: string) => {
    setViajes(prev => prev.map(v => v.id === id ? { ...v, estado: 'FINALIZADO' } : v));
  };

  const handleOpenMap = (origen: string, lat?: number, lng?: number) => {
    if (lat && lng) {
      setMapModalData({ isOpen: true, lat, lng, label: origen });
    }
  };

  return (
    <div className="w-full flex justify-center py-6">
      <div className="w-full max-w-4xl px-4 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Truck className="w-6 h-6 text-indigo-500" />
              Portal Conductor
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Conductor: Juan Pérez • ID: COND-045</p>
          </div>
          <div className="text-right flex flex-col items-end">
             <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Jornada Actual</div>
             <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
               <CheckCircle2 className="w-4 h-4" /> Activo
             </div>
          </div>
        </div>

        {/* Viaje Activo */}
        {activeViaje ? (
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3">En Curso</h2>
            <div className="bg-indigo-600 rounded-xl p-5 shadow-lg lg:p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Truck className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-indigo-500/50 pb-4">
                   <div>
                     <span className="bg-indigo-500/50 text-indigo-100 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase">
                       {activeViaje.id}
                     </span>
                     <h3 className="text-xl font-bold mt-2">{activeViaje.tipoViaje}</h3>
                   </div>
                   <div className="text-right">
                     <div className="text-indigo-200 text-sm flex items-center justify-end gap-1"><Calendar className="w-4 h-4"/> {activeViaje.fecha}</div>
                     <div className="font-bold text-lg">{activeViaje.horaInicio} - {activeViaje.horaFin}</div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5"><MapPin className="w-5 h-5 text-indigo-300" /></div>
                      <div>
                        <p className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">Origen</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-lg leading-tight">{activeViaje.origen}</p>
                          {activeViaje.latOrigen && (
                            <button 
                              onClick={() => handleOpenMap(activeViaje.origen, activeViaje.latOrigen, activeViaje.lngOrigen)}
                              className="bg-indigo-500/30 hover:bg-indigo-500/50 p-1.5 rounded-full transition-colors"
                              title="Ver en Mapa"
                            >
                              <MapIcon className="w-4 h-4 text-indigo-100" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5"><MapPin className="w-5 h-5 text-indigo-300" /></div>
                      <div>
                        <p className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">Destino</p>
                        <p className="font-medium text-lg leading-tight">{activeViaje.destino}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">Vehículo Asignado</p>
                      <p className="font-medium flex items-center gap-2 mt-1">
                        <Truck className="w-4 h-4" /> {activeViaje.vehiculo}
                      </p>
                    </div>
                    
                    <div className="flex bg-indigo-500/20 rounded-lg p-2 mt-2 divide-x divide-indigo-400/30">
                      <div className="flex-1 px-3 text-center">
                        <Users className="w-4 h-4 mx-auto mb-1 text-indigo-300" />
                        <span className="block text-xl font-bold">{activeViaje.pasajeros || 0}</span>
                        <span className="block text-[10px] uppercase tracking-wider text-indigo-300">Pax</span>
                      </div>
                      <div className="flex-1 px-3 text-center">
                        <Briefcase className="w-4 h-4 mx-auto mb-1 text-indigo-300" />
                        <span className="block text-xl font-bold">{activeViaje.maletas || 0}</span>
                        <span className="block text-[10px] uppercase tracking-wider text-indigo-300">Maletas</span>
                      </div>
                      <div className="flex-1 px-3 text-center">
                        <Baby className="w-4 h-4 mx-auto mb-1 text-indigo-300" />
                        <span className="block text-xl font-bold">{activeViaje.sillaNino || 0}</span>
                        <span className="block text-[10px] uppercase tracking-wider text-indigo-300">Sillas</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-indigo-500/50">
                  <button 
                    onClick={() => finalizarViaje(activeViaje.id)}
                    className="bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex justify-center items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Finalizar Viaje
                  </button>
                  <button className="bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex justify-center items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> Reportar Incidencia
                  </button>
                  <button className="bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-colors flex justify-center items-center gap-2">
                    <FileText className="w-5 h-5" /> Checklist Vehículo
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Sin Viaje Activo</h3>
            <p>Comienza un viaje desde tus próximos viajes programados.</p>
          </div>
        )}

        {/* Próximos Viajes */}
        <div>
           <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3">Próximos Viajes Programados</h2>
           <div className="space-y-4">
             {proximosViajes.map(viaje => (
                <div key={viaje.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{viaje.id}</span>
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{viaje.tipoViaje}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                         <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400"/> {viaje.fecha}</div>
                         <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400"/> {viaje.horaInicio} - {viaje.horaFin}</div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Ruta</p>
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{viaje.origen} <ChevronRight className="w-3 h-3 inline text-slate-400 relative -top-0.5" /> {viaje.destino}</div>
                            {viaje.latOrigen && (
                               <button 
                                 onClick={() => handleOpenMap(viaje.origen, viaje.latOrigen, viaje.lngOrigen)}
                                 className="text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 p-1.5 rounded-full shrink-0 transition-colors"
                                 title="Ver en Mapa"
                               >
                                 <MapIcon className="w-4 h-4" />
                               </button>
                             )}
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Vehículo Asignado</p>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-slate-400"/> {viaje.vehiculo}
                          </div>
                        </div>
                      </div>
                   </div>
                   
                   <div className="md:w-auto shrink-0 flex flex-col md:items-end justify-center pt-3 md:pt-0 border-t border-slate-100 dark:border-slate-800 md:border-none">
                     <button 
                       onClick={() => iniciarViaje(viaje.id)}
                       disabled={!!activeViaje}
                       className={cn(
                         "px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2",
                         activeViaje 
                           ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed" 
                           : "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md"
                       )}
                     >
                       <Play className="w-4 h-4" /> Iniciar Viaje
                     </button>
                     {activeViaje && <p className="text-xs text-slate-400 text-center md:text-right mt-2 line-clamp-2 max-w-[150px]">Debes finalizar el viaje actual primero</p>}
                   </div>
                </div>
             ))}
             {proximosViajes.length === 0 && (
               <div className="text-center py-6 text-slate-500">
                  No tienes próximos viajes programados.
               </div>
             )}
           </div>
        </div>

      </div>

      {/* Map Modal */}
      {mapModalData.isOpen && mapModalData.lat && mapModalData.lng && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-500" />
                Punto de Origen: {mapModalData.label}
              </h2>
              <button 
                onClick={() => setMapModalData({ isOpen: false })}
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 h-[400px] w-full bg-slate-100 dark:bg-slate-900">
              <MapContainer 
                center={[mapModalData.lat, mapModalData.lng]} 
                zoom={14} 
                scrollWheelZoom={true} 
                className="w-full h-full rounded-lg z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[mapModalData.lat, mapModalData.lng]}>
                  <Popup>
                    Origen: {mapModalData.label}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end">
               <button 
                 onClick={() => setMapModalData({ isOpen: false })}
                 className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition"
               >
                 Cerrar Mapa
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
