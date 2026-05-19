import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Truck, Play, CheckCircle2, AlertCircle, FileText, ChevronRight, Briefcase, Baby, Users, Map as MapIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
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
  conductorName: string;
  estado: 'PROGRAMADO' | 'EN_CURSO' | 'FINALIZADO';
  pasajeros?: number;
  maletas?: number;
  sillaNino?: number;
  latOrigen?: number;
  lngOrigen?: number;
  tipoViaje: string;
}

export default function PortalConductor() {
  const { activeCompanyId } = useCompany();
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [mapModalData, setMapModalData] = useState<{ isOpen: boolean; lat?: number; lng?: number; label?: string }>({ isOpen: false });

  useEffect(() => {
    const fetchViajes = async () => {
      let query = supabase.from('operacion_programacion').select('*, conductor:colaborador(nombre), vehiculo:vehiculo(patente)').order('fecha', { ascending: true });
      if (activeCompanyId && activeCompanyId !== 'GLOBAL') {
        query = query.eq('empresa_id', activeCompanyId);
      } else {
        query = query.is('empresa_id', null); // If GLOBAL doesn't fetch everything, adjust based on your logic
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching programming:", error);
        return;
      }

      if (data) {
        const mappedViajes: Viaje[] = data.map((v: any) => ({
          id: v.id,
          fecha: v.fecha,
          horaInicio: `${v.hora || 10}:00`,
          horaFin: `${(v.hora || 10) + (v.duracion || 2)}:00`,
          origen: v.origen,
          destino: v.destino,
          vehiculo: v.vehiculo?.patente || 'Sin Vehículo',
          conductorName: v.conductor?.nombre || 'Sin Conductor',
          estado: v.estado === 'Asignado' ? 'PROGRAMADO' : (v.estado === 'En Curso' ? 'EN_CURSO' : (v.estado === 'Realizado' ? 'FINALIZADO' : 'PROGRAMADO')),
          tipoViaje: v.tipo || 'Servicio'
        }));
        setViajes(mappedViajes);
      }
    };
    
    fetchViajes();
  }, [activeCompanyId]);

  const activeViaje = viajes.find(v => v.estado === 'EN_CURSO');
  const proximosViajes = viajes.filter(v => v.estado === 'PROGRAMADO');

  const iniciarViaje = async (id: string) => {
    try {
      await supabase.from('operacion_programacion').update({ estado: 'En Curso' }).eq('id', id);
      setViajes(prev => prev.map(v => v.id === id ? { ...v, estado: 'EN_CURSO' } : v));
    } catch (e) {
      alert("Error al iniciar el viaje");
    }
  };

  const finalizarViaje = async (id: string) => {
    try {
      await supabase.from('operacion_programacion').update({ estado: 'Realizado' }).eq('id', id);
      setViajes(prev => prev.map(v => v.id === id ? { ...v, estado: 'FINALIZADO' } : v));
    } catch (e) {
      alert("Error al finalizar el viaje");
    }
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
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Conductor: Varios / General • ID: GLOBAL</p>
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
                       {activeViaje.id.substring(0, 8)}
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
                      <p className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">Vehículo y Conductor</p>
                      <p className="font-medium flex items-center gap-2 mt-1 text-sm bg-indigo-500/20 px-2 py-1 rounded">
                        <Truck className="w-4 h-4" /> {activeViaje.vehiculo}
                      </p>
                      <p className="font-medium flex items-center gap-2 mt-1 text-sm bg-indigo-500/20 px-2 py-1 rounded">
                        <Users className="w-4 h-4" /> {activeViaje.conductorName}
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
                    <FileText className="w-5 h-5" /> Checklist
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
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{viaje.id.substring(0, 8)}</span>
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
                          <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Vehículo / Cond.</p>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex flex-col gap-1">
                            <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-slate-400"/> {viaje.vehiculo}</span>
                            <span className="flex items-center gap-1.5 text-slate-500"><Users className="w-3 h-3 text-slate-400"/> {viaje.conductorName}</span>
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
                  No tienes próximos viajes programados en tu compañía.
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
