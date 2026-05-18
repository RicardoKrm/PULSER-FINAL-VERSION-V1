import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, AlertOctagon, MessageSquareWarning, Truck as TruckIcon, Navigation, FileSpreadsheet, Download, MapPin, X } from 'lucide-react';
import { exportToExcel } from '../../lib/excelExport';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const carFrontSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px; margin-top:2px;"><rect width="14" height="10" x="5" y="8" rx="2" ry="2"/><path d="M2 12h3"/><path d="M19 12h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="m19 8-1.5-4H6.5L5 8"/></svg>`;

const createVehicleIcon = (patente: string, condicion: string) => {
  let borderColor = 'border-slate-800';
  let bgColor = 'bg-slate-800';
  let badgeColor = 'text-slate-800 border-slate-200';
  let pulseHtml = '';
  
  if (condicion === 'detenido') {
    borderColor = 'border-red-500'; bgColor = 'bg-red-500'; badgeColor = 'text-red-700 border-red-200 bg-red-50';
    pulseHtml = '<div class="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>';
  } else if (condicion === 'jamming') {
    borderColor = 'border-purple-500'; bgColor = 'bg-purple-600'; badgeColor = 'text-purple-700 border-purple-200 bg-purple-50';
    pulseHtml = '<div class="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-75"></div>';
  } else if (condicion === 'fatiga') {
    borderColor = 'border-pink-500'; bgColor = 'bg-pink-500'; badgeColor = 'text-pink-700 border-pink-200 bg-pink-50';
    pulseHtml = '<div class="absolute inset-0 bg-pink-400 rounded-full animate-ping opacity-75"></div>';
  } else if (condicion === 'exceso_velocidad') {
    borderColor = 'border-yellow-500'; bgColor = 'bg-yellow-500'; badgeColor = 'text-yellow-700 border-yellow-200 bg-yellow-50';
    pulseHtml = '<div class="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-75"></div>';
  } else if (condicion === 'ralenti') {
    borderColor = 'border-orange-500'; bgColor = 'bg-orange-500'; badgeColor = 'text-orange-700 border-orange-200 bg-orange-50';
    pulseHtml = '<div class="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-75"></div>';
  } else {
    borderColor = 'border-blue-600'; bgColor = 'bg-blue-600';
  }
  
  return L.divIcon({
    className: 'bg-transparent border-none',
    html: `<div class="relative flex flex-col items-center">
            <div class="relative flex items-center justify-center h-8 w-8">
              ${pulseHtml}
              <div class="relative z-10 w-7 h-7 rounded-full border-2 border-white shadow-md flex justify-center items-center ${bgColor}">
                ${carFrontSvg}
              </div>
            </div>
            <span class="mt-1 rounded bg-white px-2 py-0.5 text-[10px] font-extrabold shadow-sm border ${badgeColor} whitespace-nowrap">${patente}</span>
           </div>`,
    iconSize: [60, 50],
    iconAnchor: [30, 25]
  });
};

function MapController({ center }: { center: {lat: number, lng: number, zoom: number, ts: number} }) {
  const map = useMap();
  useEffect(() => {
    if (center.ts > 0) {
      map.flyTo([center.lat, center.lng], center.zoom, { animate: true, duration: 1.2 });
    }
  }, [center.ts, map]);
  return null;
}

interface FallbackInfraction {
  tramo: string;
  duracion: string;
  maxVel: number;
}

const initialVehicles: any[] = [];

export default function GPS() {
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number, zoom: number, ts: number}>({ 
    lat: -20.590, lng: -69.310, zoom: 9, ts: 0 
  }); 

  const [isGlobalMonitorOpen, setIsGlobalMonitorOpen] = useState(false);

  const [vehiculosGPS, setVehiculosGPS] = useState<any[]>(initialVehicles);

  const handleCenterMap = (lat: number, lng: number) => {
    setMapCenter({ lat, lng, zoom: 14, ts: Date.now() });
  };

  const handleExport = () => {
    const dataToExport = vehiculosGPS.map(v => ({
      Patente: v.patente,
      Conductor: v.conductor,
      Velocidad: v.velocidad,
      Limite: v.limite,
      Condicion: v.condicion,
      Ruta: v.ruta,
      Estado: v.estado
    }));
    exportToExcel(dataToExport, 'Monitoreo_GPS_Flota', 'GPS');
  };

  return (
    <div className="w-full flex flex-col h-full min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Integración GPS: Iquique - Collahuasi
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">
            Monitoreo dinámico con visualización en tiempo real e incidencias.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGlobalMonitorOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 text-sm max-w-[fit-content]"
          >
            <Activity className="w-4 h-4" />
            Monitoreo Global
          </button>
          <button 
            onClick={handleExport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 text-sm max-w-[fit-content]"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px] lg:h-[calc(100vh-14rem)]">
        {/* Left Area: Map */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col relative h-[500px] lg:h-auto z-0">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10 shrink-0">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-indigo-500" />
              Mapa de Operaciones FleetSat
            </h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tracking-wider">LIVE</span>
            </div>
          </div>
          
          <div className="flex-1 w-full bg-slate-100 dark:bg-slate-800 z-0 relative">
            <MapContainer 
              center={[mapCenter.lat, mapCenter.lng]} 
              zoom={mapCenter.zoom} 
              className="h-full w-full"
              zoomControl={false}
            >
              <MapController center={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              
              {/* Markers de Vehículos */}
              {vehiculosGPS.map((v) => (
                <Marker 
                  key={v.id} 
                  position={[v.lat, v.lng]} 
                  icon={createVehicleIcon(v.patente, v.condicion)}
                  eventHandlers={{ click: () => handleCenterMap(v.lat, v.lng) }}
                >
                  <Popup className="font-sans">
                    <div className="p-1 min-w-[200px]">
                      <div className="font-black border-b border-slate-100 pb-2 mb-2 text-sm flex items-center justify-between text-slate-800 dark:text-slate-200">
                        {v.patente}
                        <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${v.condicion === 'detenido' || v.condicion === 'exceso_velocidad' ? 'bg-red-100 text-red-700' : v.condicion === 'ralenti' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                          {v.condicion === 'detenido' ? 'DETENIDO' : v.condicion === 'exceso_velocidad' ? 'SOBREVELOCIDAD' : v.condicion === 'ralenti' ? 'RALENTÍ' : 'EN RUTA'}
                        </span>
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                        <p className="flex justify-between">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Conductor:</span> 
                          <span className="font-bold">{v.conductor}</span>
                        </p>
                        <p className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Ruta:</span> 
                          <span className="font-medium text-right ml-2">{v.ruta}</span>
                        </p>
                        <div className={`p-2 rounded-lg mt-2 border ${v.condicion === 'exceso_velocidad' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                          <p className="flex justify-between items-center pb-1 mb-1 border-b border-slate-200/50">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Límite Tramo:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{v.limite} km/h</span>
                          </p>
                          <p className="flex justify-between items-center">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Velocidad Actual:</span> 
                            <span className={`text-sm ${v.condicion === 'exceso_velocidad' ? 'text-red-600 font-black' : v.velocidad === 0 ? 'text-amber-600 font-bold' : 'text-indigo-600 font-bold'}`}>
                              {v.velocidad} km/h
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Right Area: Panels */}
        <div className="w-full lg:w-[420px] flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          
          {/* Right Area: Panels (Removed Panel 3 to Modal) */}
          
          {/* Panel 1: Emergencias */}
          <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden shadow-sm shrink-0">
            <div className="px-5 py-3 border-b border-red-200 dark:border-red-900/50 bg-white/50 dark:bg-slate-900/50 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-500" />
              <h3 className="font-black text-red-700 dark:text-red-400 text-sm tracking-tight">INCIDENCIAS OPERATIVAS (EMERGENCIAS)</h3>
            </div>
            <div className="p-4 space-y-4">
              {vehiculosGPS.filter(v => ['detenido', 'jamming'].includes(v.condicion)).length === 0 && (
                <p className="text-xs text-red-400 text-center italic py-2 font-medium">Sin incidencias críticas.</p>
              )}
              {vehiculosGPS.filter(v => ['detenido', 'jamming'].includes(v.condicion)).map(v => (
                <div 
                  key={v.id} 
                  className={`bg-white dark:bg-slate-900 p-4 rounded-xl border ${v.condicion === 'jamming' ? 'border-purple-200 dark:border-purple-900/30 hover:border-purple-400' : 'border-red-100 dark:border-red-900/30 hover:border-red-400'} shadow-sm relative overflow-hidden transition-all group`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${v.condicion === 'jamming' ? 'bg-purple-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <div className="flex justify-between items-center mb-3 ml-2 cursor-pointer" onClick={() => handleCenterMap(v.lat, v.lng)}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${v.condicion === 'jamming' ? 'text-purple-500' : 'text-red-500'}`} />
                      <span className="font-bold text-slate-900 dark:text-white">{v.patente}</span>
                    </div>
                    <span className={`${v.condicion === 'jamming' ? 'bg-purple-600' : 'bg-red-500'} text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider animate-pulse`}>
                        {v.condicion === 'jamming' ? 'ANTI-JAMMING!' : 'Revisión Urgente'}
                    </span>
                  </div>
                  <div className={`${v.condicion === 'jamming' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'} p-2.5 rounded-lg mb-3 ml-2`}>
                    <p className="text-xs italic font-semibold">"{v.incidencia}"</p>
                  </div>
                  
                  {v.condicion === 'jamming' && (
                     <div className="ml-2 mb-3 mt-1 flex gap-2">
                        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold py-1.5 rounded flex justify-center items-center gap-1 uppercase tracking-wider" onClick={() => alert('Comando de Bloqueo Motor/Cortacorriente enviado exitosamente. Vehículo inmovilizado.')}>
                           Cortacorriente Remoto
                        </button>
                        <button className="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold py-1.5 rounded flex justify-center items-center gap-1 uppercase tracking-wider" onClick={() => alert('Sirena de cabina activada remotamente.')}>
                           Activar Sirena
                        </button>
                     </div>
                  )}

                  <div className="flex justify-between items-center ml-2 border-t border-slate-100 dark:border-slate-800 pt-3 cursor-pointer" onClick={() => handleCenterMap(v.lat, v.lng)}>
                     <span className="text-xs text-slate-500 dark:text-slate-400 font-medium cursor-default">{v.conductor}</span>
                     <button className="text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1 group-hover:text-indigo-700 transition-colors">
                       <Navigation className="w-3 h-3" />
                       Ir al mapa
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2: Alertas Conducción */}
          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-200 dark:border-orange-900/50 overflow-hidden shadow-sm shrink-0">
            <div className="px-5 py-3 border-b border-orange-200 dark:border-orange-900/50 bg-white/50 dark:bg-slate-900/50 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-500" />
              <h3 className="font-black text-orange-700 dark:text-orange-400 text-sm tracking-tight">ALERTAS DE CONDUCCIÓN</h3>
            </div>
            <div className="p-4 space-y-4">
              {vehiculosGPS.filter(v => ['exceso_velocidad', 'ralenti', 'fatiga'].includes(v.condicion) || v.historialInfracciones?.length).length === 0 && (
                <p className="text-xs text-orange-400 text-center italic py-2 font-medium">Sin alertas registradas.</p>
              )}
              {vehiculosGPS.filter(v => ['exceso_velocidad', 'ralenti', 'fatiga'].includes(v.condicion) || v.historialInfracciones?.length).map(v => (
                <div 
                  key={'alert-' + v.id} 
                  className={`bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm relative overflow-hidden cursor-pointer transition-all group ${v.condicion === 'exceso_velocidad' ? 'border-orange-200 dark:border-orange-900/50 hover:border-orange-400' : v.condicion === 'fatiga' ? 'border-pink-200 dark:border-pink-900/50 hover:border-pink-400' : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}
                  onClick={() => handleCenterMap(v.lat, v.lng)}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${v.condicion === 'exceso_velocidad' ? 'bg-orange-400' : v.condicion === 'ralenti' ? 'bg-amber-400' : v.condicion === 'fatiga' ? 'bg-pink-400 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                  
                  <div className="flex justify-between items-center mb-3 ml-2">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {v.patente}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${v.condicion === 'exceso_velocidad' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800 animate-pulse' : v.condicion === 'ralenti' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : v.condicion === 'fatiga' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border border-pink-200 dark:border-pink-800' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}>
                      {v.condicion === 'exceso_velocidad' ? 'SOBREVELOCIDAD' : v.condicion === 'ralenti' ? 'EXCESO RALENTÍ' : v.condicion === 'fatiga' ? 'FATIGA/SUEÑO' : 'HISTORIAL ADVERT.'}
                    </span>
                  </div>

                  {v.condicion === 'exceso_velocidad' && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-3 rounded-lg mb-3 ml-2 flex flex-col gap-2 relative">
                       <div className="flex justify-between items-end">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Actual</span>
                        <strong className="text-red-600 dark:text-red-400 text-lg leading-none">{v.velocidad} km/h</strong>
                       </div>
                    </div>
                  )}

                  {v.condicion === 'fatiga' && (
                    <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-100 dark:border-pink-900/30 p-3 rounded-lg mb-3 ml-2">
                       <p className="text-[11px] text-pink-800 dark:text-pink-300 font-medium leading-relaxed italic">
                         "{v.incidencia}"
                       </p>
                       <button className="mt-2 text-[10px] uppercase font-bold bg-pink-100 dark:bg-pink-800 text-pink-700 dark:text-pink-100 px-2 py-1 rounded w-full" onClick={(e) => { e.stopPropagation(); alert('Protocolo de fatiga iniciado: Llamada a cabina y desvío a zona de descanso coordinado.') }}>Aplicar Protocolo Fatiga</button>
                    </div>
                  )}

                  {v.condicion === 'ralenti' && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-3 rounded-lg mb-3 ml-2">
                       <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                         Motor encendido sin avance por <strong className="font-black text-amber-900 dark:text-amber-200">&gt; 8 min</strong>. Límite excedido.
                       </p>
                    </div>
                  )}

                  {v.historialInfracciones && v.historialInfracciones.length > 0 && (
                    <div className="mb-3 ml-2">
                      <p className="text-[10px] font-black tracking-wider text-slate-500 mb-2 uppercase dark:text-slate-400">Infracción Registrada (Ya Redujo):</p>
                      <div className="space-y-1 mt-1 pl-2 border-l-2 border-slate-200 dark:border-slate-800">
                        {v.historialInfracciones.map((inf, i) => (
                           <div key={i} className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                             <p className="flex gap-2"><span className="opacity-50">•</span> <span>Tramo: <strong className="text-slate-900 dark:text-slate-200">{inf.tramo}</strong></span></p>
                             <p className="pl-3 mt-0.5 opacity-80">Mantuvo <strong className="text-slate-900 dark:text-slate-300">{inf.maxVel} km/h</strong> (Límite {v.limite}) por {inf.duracion}.</p>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center ml-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                     <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{v.conductor}</span>
                     <button className="text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1 group-hover:text-indigo-700 transition-colors">
                       <Navigation className="w-3 h-3" />
                       Ubicar
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Modal Monitoreo Global */}
      {isGlobalMonitorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-5 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                 <Activity className="w-5 h-5 text-blue-500" />
                 <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-wide text-[15px]">MONITOREO GLOBAL EN TIEMPO REAL</h2>
               </div>
               <button 
                 onClick={() => setIsGlobalMonitorOpen(false)}
                 className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="px-6 shrink-0">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-md flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700">
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">TOTAL FLOTA</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{vehiculosGPS.length}</span>
                  </div>
                  <div className="bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-md flex flex-col items-center justify-center border border-blue-100/50 dark:border-blue-800/50">
                    <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">EN RUTA</span>
                    <span className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1.5">{vehiculosGPS.filter(v => v.estado !== 'detenido').length}</span>
                  </div>
               </div>
            </div>

            <div className="px-6 pt-6 pb-6 overflow-y-auto flex-1">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">UNIDADES CIRCULANDO</h4>
              <div className="space-y-3">
                {vehiculosGPS.map(v => {
                  let borderColor = 'border-slate-200';
                  let speedColor = 'text-emerald-600';
                  let iconColor = 'text-slate-400 border-slate-200';
                  
                  if (v.condicion === 'exceso_velocidad') {
                    borderColor = 'border-yellow-400 shadow-yellow-100/50';
                    speedColor = 'text-red-600';
                    iconColor = 'text-yellow-500 border-yellow-200';
                  } else if (v.velocidad === 0) {
                    borderColor = 'border-orange-300 shadow-orange-100/50';
                    speedColor = 'text-orange-600';
                    iconColor = 'text-orange-500 border-orange-200';
                  }

                  return (
                    <div 
                      key={'modal-mon-'+v.id} 
                      className={`bg-white dark:bg-slate-800 border ${borderColor} p-4 py-3.5 rounded-xl flex justify-between items-center shadow-sm cursor-pointer hover:shadow-md transition-all group`}
                      onClick={() => {
                        handleCenterMap(v.lat, v.lng);
                        setIsGlobalMonitorOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-full border flex items-center justify-center bg-white ${iconColor}`}>
                          <TruckIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex flex-col justify-center">
                          <h5 className="font-bold text-sm text-slate-800 dark:text-white leading-tight mb-0.5">{v.patente}</h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">{v.ruta}</p>
                          <p className="text-[10px] text-slate-400">Cond: {v.conductor}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <span className={`text-sm font-bold ${speedColor}`}>
                          {v.velocidad} km/h
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
