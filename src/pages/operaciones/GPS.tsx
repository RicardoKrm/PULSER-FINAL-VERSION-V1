import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  AlertOctagon,
  Truck as TruckIcon,
  Navigation,
  FileSpreadsheet,
  Download,
  MapPin,
  X,
  Target,
  Map as MapIcon,
  Pause,
  Play,
  FastForward,
  Rewind,
  Maximize,
  Minimize2,
  Clock,
  Map,
  BarChart3,
  ListFilter,
  CheckCircle2,
  TrendingDown,
  Layers
} from "lucide-react";
import { exportToExcel } from "../../lib/excelExport";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
  Circle,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../lib/supabase";
import { useCompany } from "../../contexts/CompanyContext";
import { RefreshCw } from "lucide-react";

const carFrontSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px; margin-top:2px;"><rect width="14" height="10" x="5" y="8" rx="2" ry="2"/><path d="M2 12h3"/><path d="M19 12h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="m19 8-1.5-4H6.5L5 8"/></svg>`;

const createVehicleIcon = (patente: string, condicion: string) => {
  let borderColor = "border-slate-800";
  let bgColor = "bg-slate-800";
  let badgeColor = "text-slate-800 border-slate-200";
  let pulseHtml = "";

  if (condicion === "detenido") {
    borderColor = "border-red-500";
    bgColor = "bg-red-500";
    badgeColor = "text-red-700 border-red-200 bg-red-50";
    pulseHtml =
      '<div class="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>';
  } else if (condicion === "jamming") {
    borderColor = "border-purple-500";
    bgColor = "bg-purple-600";
    badgeColor = "text-purple-700 border-purple-200 bg-purple-50";
    pulseHtml =
      '<div class="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-75"></div>';
  } else if (condicion === "fatiga") {
    borderColor = "border-pink-500";
    bgColor = "bg-pink-500";
    badgeColor = "text-pink-700 border-pink-200 bg-pink-50";
    pulseHtml =
      '<div class="absolute inset-0 bg-pink-400 rounded-full animate-ping opacity-75"></div>';
  } else if (condicion === "exceso_velocidad") {
    borderColor = "border-yellow-500";
    bgColor = "bg-yellow-500";
    badgeColor = "text-yellow-700 border-yellow-200 bg-yellow-50";
    pulseHtml =
      '<div class="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-75"></div>';
  } else if (condicion === "ralenti") {
    borderColor = "border-orange-500";
    bgColor = "bg-orange-500";
    badgeColor = "text-orange-700 border-orange-200 bg-orange-50";
    pulseHtml =
      '<div class="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-75"></div>';
  } else {
    borderColor = "border-blue-600";
    bgColor = "bg-blue-600";
  }

  return L.divIcon({
    className: "bg-transparent border-none",
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
    iconAnchor: [30, 25],
  });
};

function MapController({
  centerEvent,
  isFollowing,
  selectedLat,
  selectedLng,
}: any) {
  const map = useMap();
  useEffect(() => {
    if (centerEvent && centerEvent.force) {
      map.flyTo([centerEvent.lat, centerEvent.lng], centerEvent.zoom, {
        animate: true,
        duration: 1.2,
      });
    } else if (
      isFollowing &&
      selectedLat != null &&
      selectedLng != null &&
      centerEvent &&
      centerEvent.updateTick
    ) {
      map.flyTo([selectedLat, selectedLng], map.getZoom() || 14, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [centerEvent, isFollowing, selectedLat, selectedLng, map]);
  return null;
}

const geocercasMock = [
  {
    id: 1,
    name: "Puerto Madero",
    type: "Puerto",
    allowedMinutes: 120,
    lat: -20.6,
    lng: -69.3,
    radius: 800,
  },
  {
    id: 2,
    name: "Planta Centro",
    type: "Planta",
    allowedMinutes: 60,
    lat: -20.55,
    lng: -69.35,
    radius: 600,
  },
  {
    id: 3,
    name: "Pesaje Norte",
    type: "Pesaje",
    allowedMinutes: 20,
    lat: -20.58,
    lng: -69.32,
    radius: 300,
  },
  {
    id: 4,
    name: "Zona Espera B",
    type: "Espera",
    allowedMinutes: 180,
    lat: -20.57,
    lng: -69.34,
    radius: 1000,
  },
];

const mockRoutePlanificada: [number, number][] = [
  [-20.6, -69.3],
  [-20.58, -69.32],
  [-20.55, -69.35],
];

const mockRouteReal: [number, number][] = [
  [-20.6, -69.3],
  [-20.585, -69.31], // Deviation
  [-20.58, -69.32],
  [-20.55, -69.35],
];

export default function GPS() {
  const { activeCompanyId } = useCompany();

  const [vehiculosGPS, setVehiculosGPS] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGlobalMonitorOpen, setIsGlobalMonitorOpen] = useState(false);

  // Map Navigation State
  const [centerEvent, setCenterEvent] = useState({
    lat: -20.59,
    lng: -69.31,
    zoom: 11,
    force: false,
    updateTick: 0,
  });
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null,
  );
  const [isFollowing, setIsFollowing] = useState(false);

  // Panels State
  const [isAlertsMinimized, setIsAlertsMinimized] = useState(false);
  const [playbackMode, setPlaybackMode] = useState(false);
  const [activeGlobalTab, setActiveGlobalTab] = useState('rutas');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isFiltering, setIsFiltering] = useState(false);

  const handleFilter = () => {
    if (!dateRange.start || !dateRange.end) {
      alert("Por favor selecciona ambas fechas.");
      return;
    }
    setIsFiltering(true);
    setTimeout(() => {
      setIsFiltering(false);
    }, 1500);
  };

  const fetchGpsVehicles = async (updateOdometer = true) => {
    if (!activeCompanyId) return;

    try {
      const [vehiculosRes, configRes] = await Promise.all([
        supabase
          .from("vehiculo")
          .select("id, patente, kilometraje_actual, detalles")
          .eq("empresa_id", activeCompanyId),
        supabase
          .from("empresa")
          .select("detalles")
          .eq("id", activeCompanyId)
          .single(),
      ]);

      if (vehiculosRes.data && !vehiculosRes.error) {
        let configured = vehiculosRes.data;

        let apiKeys: any = {};
        if (configRes.data && configRes.data.detalles) {
          apiKeys = configRes.data.detalles.gps_config || {};
        }

        let gps2Data: any[] = [];
        if (
          apiKeys.traccar_url &&
          apiKeys.traccar_user &&
          apiKeys.traccar_pass
        ) {
          try {
            const res = await fetch("/api/gps/sync-gps2", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: apiKeys.traccar_url,
                username: apiKeys.traccar_user,
                password: apiKeys.traccar_pass,
              }),
            });
            if (res.ok) {
              const parsed = await res.json();
              if (Array.isArray(parsed)) gps2Data = parsed;
            }
          } catch (e) {
            console.error("Error fetching GPS2 via proxy:", e);
          }
        }

        const liveDataPromises = configured.map(async (v, i) => {
          const prov = v.detalles?.gps_proveedor;

          // Random spread for realism if no true coordinates
          let lat =
            v.detalles?.ultima_ubicacion?.lat !== undefined
              ? v.detalles.ultima_ubicacion.lat
              : -20.59 + (Math.random() * 0.1 - 0.05);
          let lng =
            v.detalles?.ultima_ubicacion?.lng !== undefined
              ? v.detalles.ultima_ubicacion.lng
              : -69.31 + (Math.random() * 0.1 - 0.05);
          let velocidad = v.detalles?.ultima_ubicacion?.velocidad || 0;
          let newKm = v.kilometraje_actual || 0;
          let gpsName = prov || "dominio";
          let updatedTimestamp: string | null = null;

          if (prov === "gpsglobal" && apiKeys.gpsglobal) {
            try {
              const res = await fetch("/api/gps/sync-gps1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  patente: v.patente,
                  token: apiKeys.gpsglobal,
                }),
              });
              if (res.ok) {
                const resData = await res.json();
                if (
                  resData &&
                  resData.data &&
                  Array.isArray(resData.data) &&
                  resData.data.length > 0
                ) {
                  const ult = resData.data[resData.data.length - 1];
                  if (ult.latitud && ult.longitud) {
                    lat = parseFloat(ult.latitud) || lat;
                    lng = parseFloat(ult.longitud) || lng;
                    velocidad = parseFloat(ult.velocidad) || 0;
                  }
                }
              }
            } catch (e) {}
          } else if (prov === "traccar") {
            const registro = gps2Data.find(
              (x: any) => x.plateNumber === v.patente,
            );
            if (registro) {
              lat = registro.lat || lat;
              lng = registro.lng || lng;
              velocidad = registro.speed
                ? Math.round(registro.speed)
                : velocidad;
              if (registro.odometer) {
                const km = parseInt(registro.odometer);
                if (km > newKm) newKm = km;
              }
            }
          } else if (prov === "dominio" || !prov) {
            gpsName = "dominio";
            try {
              const token =
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzgwNTk0MDAxLCJleHAiOjQ5MzQxOTQwMDF9.XSMC_zxhn-d_BXzsWLuILtVkep4QxIhekRBGR0Hc8WA";
              const now = new Date();

              let past = v.detalles?.fecha_actualizacion_km
                ? new Date(v.detalles.fecha_actualizacion_km)
                : null;
              if (!past || isNaN(past.getTime())) {
                past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              }

              const formatLocalStr = (d: Date) => {
                const pad = (n: number) => n.toString().padStart(2, "0");
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
              };

              const desde = formatLocalStr(past);
              const hasta = formatLocalStr(now);

              const res = await fetch("/api/gps/dominio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  patente: v.patente,
                  desde,
                  hasta,
                  token,
                }),
              });
              if (res.ok) {
                const data = await res.json();
                updatedTimestamp = data.lastTimestamp;
                if (
                  data &&
                  data.rawData &&
                  data.rawData.elements &&
                  Array.isArray(data.rawData.elements) &&
                  data.rawData.elements.length > 0
                ) {
                  const elements = data.rawData.elements;
                  elements.sort(
                    (a: any, b: any) =>
                      new Date(a.timestamp).getTime() -
                      new Date(b.timestamp).getTime(),
                  );
                  const ultimaPosicion = elements[elements.length - 1];

                  if (ultimaPosicion.lat && ultimaPosicion.lng) {
                    lat = parseFloat(ultimaPosicion.lat);
                    lng = parseFloat(ultimaPosicion.lng);
                    velocidad =
                      ultimaPosicion.speed !== undefined
                        ? parseFloat(ultimaPosicion.speed)
                        : 0;
                  }
                  if (data.totalKm && data.totalKm > 0) {
                    newKm += data.totalKm;
                  }
                }
              }
            } catch (e) {}
          }

          const isDetenido = velocidad < 2;
          const isExceso = velocidad > 100;
          const condicion = isDetenido
            ? "detenido"
            : isExceso
              ? "exceso_velocidad"
              : "en_ruta";

          if (
            updateOdometer &&
            newKm > (v.kilometraje_actual || 0) &&
            !v.id.toString().startsWith("mock")
          ) {
            const detalles = v.detalles || {};
            if (
              updatedTimestamp &&
              !isNaN(new Date(updatedTimestamp).getTime())
            ) {
              detalles.fecha_actualizacion_km = new Date(
                updatedTimestamp,
              ).toISOString();
            } else {
              detalles.fecha_actualizacion_km = new Date().toISOString();
            }
            await supabase
              .from("vehiculo")
              .update({ kilometraje_actual: newKm, detalles })
              .eq("id", v.id);
          }

          return {
            id: v.id,
            patente: v.patente,
            kmTracker: Math.round(newKm),
            lat,
            lng,
            velocidad,
            limite: 100,
            estado: isDetenido ? "detenido" : "movimiento",
            condicion,
            conductor: "Conductor Asignado",
            ruta: "Ruta " + (i + 1),
            gps_proveedor: gpsName,
            salud: Math.floor(Math.random() * 20) + 80, // Mock 80-100 score
            etaDestino: "14:30",
            retrasoMin: isDetenido ? Math.floor(Math.random() * 30) : 0,
            cicloEstado: i % 3 === 0 ? "En Espera Carga" : (i % 2 === 0 ? "En Ruta a Descarga" : "Retorno Vacío"),
            tiempoCiclo: "1h " + Math.floor(Math.random() * 60) + "m"
          };
        });

        const liveData = await Promise.all(liveDataPromises);
        setVehiculosGPS(liveData);

        // Emit non-forced update tick for following mechanic
        setCenterEvent((prev) => ({
          ...prev,
          updateTick: prev.updateTick + 1,
          force: false,
        }));

        // Only force center initially if we have vehicle and no force has happened yet
        if (
          liveData.length > 0 &&
          typeof centerEvent.updateTick === "number" &&
          centerEvent.updateTick === 0
        ) {
          const first = liveData[0];
          if (first.lat && first.lng) {
            setCenterEvent({
              lat: first.lat,
              lng: first.lng,
              zoom: 11,
              force: true,
              updateTick: Date.now(),
            });
          }
        }
      }
    } catch (e) {
      console.error("fetchGpsVehicles error:", e);
    }
  };

  useEffect(() => {
    if (!activeCompanyId) return;
    fetchGpsVehicles();
    const interval = setInterval(() => fetchGpsVehicles(), 60000); // Only poll every 60s
    return () => clearInterval(interval);
  }, [activeCompanyId]);

  const handleForceCenter = (lat: number, lng: number, zoom = 14) => {
    setCenterEvent({ lat, lng, zoom, force: true, updateTick: Date.now() });
    setIsFollowing(false);
  };

  const selectedVehicleData = vehiculosGPS.find(
    (v) => v.id === selectedVehicleId,
  );

  return (
    <div className="w-full flex flex-col h-full min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4 px-1">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Monitor GPS FleetSat
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
            Control dinámico de rutas, geocercas y seguimiento de flota.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGlobalMonitorOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Activity className="w-4 h-4" />
            Tabla Global
          </button>
          <button
            onClick={() => {
              setIsSyncing(true);
              fetchGpsVehicles(true).finally(() => setIsSyncing(false));
            }}
            disabled={isSyncing}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2 text-sm ${isSyncing ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <RefreshCw
              className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
            />
            Forzar Sync
          </button>
        </div>
      </div>

      <div className="relative flex-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-sm overflow-hidden z-0 min-h-[600px] h-full flex flex-col">
        {/* Top Indicators Bar (KPI Ejecutivo) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] hidden md:flex items-center bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 rounded-full py-2 divide-x divide-slate-200/60 px-2 lg:px-4">
          <div className="px-3 lg:px-5 flex flex-col items-center min-w-[100px]">
            <span className="text-[10px] font-black text-slate-500 tracking-wider">
              FLOTA ACTIVA
            </span>
            <span className="text-xl font-black text-slate-800 leading-none mt-1">
              {vehiculosGPS.length}
            </span>
          </div>
          <div className="px-3 lg:px-5 flex flex-col items-center min-w-[100px]">
            <span className="text-[10px] font-black text-emerald-600 tracking-wider">
              CUMPLIMIENTO
            </span>
            <span className="text-xl font-black text-emerald-700 leading-none mt-1">
              {vehiculosGPS.length > 0 ? "94%" : "0%"}
            </span>
          </div>
          <div className="px-3 lg:px-5 flex flex-col items-center min-w-[100px]">
            <span className="text-[10px] font-black text-indigo-500 tracking-wider">
              T. PROM CICLO
            </span>
            <span className="text-xl font-black text-indigo-600 leading-none mt-1">
              1h 38m
            </span>
          </div>
          <div className="px-3 lg:px-5 flex flex-col items-center min-w-[100px]">
            <span className="text-[10px] font-black text-amber-500 tracking-wider">
              EN RETRASO
            </span>
            <span className="text-xl font-black text-amber-600 leading-none mt-1">
              {vehiculosGPS.filter((v) => v.retrasoMin > 10).length}
            </span>
          </div>
          <div className="px-3 lg:px-5 flex flex-col items-center min-w-[100px]">
            <span className="text-[10px] font-black text-red-600 tracking-wider">
              EXCEPCIONES
            </span>
            <span className="text-xl font-black text-red-700 leading-none mt-1">
              {vehiculosGPS.filter((v) =>
                [
                  "detenido",
                  "jamming",
                  "exceso_velocidad",
                  "ralenti",
                  "fatiga",
                ].includes(v.condicion),
              ).length + 2}
            </span>
          </div>
        </div>

        {/* Controls Left Panel */}
        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-3">
          <div className="bg-white/95 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-slate-200 flex flex-col gap-1 w-48">
            <button
              onClick={() =>
                handleForceCenter(
                  vehiculosGPS[0]?.lat || -20.59,
                  vehiculosGPS[0]?.lng || -69.31,
                  9,
                )
              }
              className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-slate-700 transition"
            >
              <MapIcon className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold">Vista General</span>
            </button>

            {selectedVehicleId && (
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`flex items-center gap-2 p-2 rounded-lg transition ${isFollowing ? "bg-indigo-600 text-white shadow" : "hover:bg-slate-50 text-slate-700"}`}
              >
                <Target
                  className={`w-4 h-4 ${isFollowing ? "text-white" : "text-emerald-600"}`}
                />
                <span className="text-xs font-bold">
                  {isFollowing ? "Dejar de Seguir" : "Seguir Vehículo"}
                </span>
              </button>
            )}

            <button
              onClick={() => setPlaybackMode(!playbackMode)}
              className={`flex items-center gap-2 p-2 rounded-lg transition ${playbackMode ? "bg-slate-800 text-white shadow" : "hover:bg-slate-50 text-slate-700"}`}
            >
              <Clock
                className={`w-4 h-4 ${playbackMode ? "text-white" : "text-amber-500"}`}
              />
              <span className="text-xs font-bold">Playback Incidentes</span>
            </button>

            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-2 p-2 rounded-lg transition ${showHeatmap ? "bg-red-600 text-white shadow" : "hover:bg-slate-50 text-slate-700"}`}
            >
              <Layers
                className={`w-4 h-4 ${showHeatmap ? "text-white" : "text-red-500"}`}
              />
              <span className="text-xs font-bold">Heatmap Congestión</span>
            </button>
          </div>

          <div className="bg-white/95 backdrop-blur-p-3 p-3 rounded-xl shadow-lg border border-slate-200 w-48">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">
              Corredor Operacional
            </h4>
            <div className="flex flex-col gap-1.5 text-[11px] font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500 rounded"></div> Ruta Central
              </span>
              <span className="flex items-center gap-2">
                <div className="w-4 h-1 bg-emerald-500 opacity-60 rounded"></div> Tolerancia (50m)
              </span>
              <span className="flex items-center gap-2">
                <div className="w-4 h-1 bg-yellow-500 opacity-60 rounded"></div> Moderado (100m)
              </span>
              <span className="flex items-center gap-2">
                <div className="w-4 h-1 bg-red-500 opacity-60 rounded"></div> Crítico (&gt;300m)
              </span>
            </div>
          </div>
        </div>

        {/* Floating Alerts Right Panel */}
        <div
          className={`absolute bottom-6 right-4 z-[400] flex flex-col transition-all duration-300 ${isAlertsMinimized ? "w-[200px]" : "w-[360px]"} shadow-2xl`}
        >
          <div
            className="bg-slate-900 text-white px-4 py-3 rounded-t-xl flex justify-between items-center cursor-pointer border-b border-slate-700 hover:bg-slate-800 transition"
            onClick={() => setIsAlertsMinimized(!isAlertsMinimized)}
          >
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
              <h3 className="font-black tracking-wide text-xs whitespace-nowrap">
                CENTRO DE EXCEPCIONES
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isAlertsMinimized && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse">
                  3
                </span>
              )}
              {isAlertsMinimized ? (
                <Maximize className="w-4 h-4 text-slate-400" />
              ) : (
                <Minimize2 className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          {!isAlertsMinimized && (
            <div className="bg-white/95 backdrop-blur-md max-h-[55vh] overflow-y-auto rounded-b-xl border-x border-b border-slate-300 p-3 flex flex-col gap-3 custom-scrollbar shadow-lg">
              {/* Geofence Alert: Detención no autorizada */}
              <div className="bg-red-50/80 p-3 rounded-lg border border-red-200">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-red-900 flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600" /> CAM-018
                  </span>
                  <span className="bg-red-200 text-red-800 text-[9px] px-1.5 py-0.5 rounded uppercase font-black">
                    Anómala
                  </span>
                </div>
                <p className="text-[11px] text-red-800 mb-2 font-medium leading-relaxed">
                  Detenido <span className="font-black">27 min</span> en Ruta
                  B-400{" "}
                  <strong className="text-red-900">
                    sin geocerca autorizada
                  </strong>
                  .
                </p>
                <button
                  onClick={() => handleForceCenter(-20.585, -69.31, 15)}
                  className="text-[10px] font-black text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded flex items-center justify-center gap-1 w-full transition border border-red-200"
                >
                  <Target className="w-3 h-3" /> ENFOCAR
                </button>
              </div>

              {/* Geofence Alert: Tiempo Excedido */}
              <div className="bg-orange-50/80 p-3 rounded-lg border border-orange-200">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-orange-900 flex items-center gap-1.5 text-sm">
                    <Clock className="w-4 h-4 text-orange-600" /> CAM-023
                  </span>
                  <span className="bg-orange-200 text-orange-800 text-[9px] px-1.5 py-0.5 rounded uppercase font-black text-center max-w-[80px] leading-tight">
                    Tiempo Excedido
                  </span>
                </div>
                <p className="text-[11px] text-orange-800 mb-2 font-medium leading-relaxed">
                  Detenido en <strong>Puerto Madero</strong>.<br />
                  T. Autorizado: 120m | T. Actual:{" "}
                  <span className="font-black text-orange-900">167m</span>{" "}
                  <strong className="text-red-600">(+47m)</strong>
                </p>
                <button
                  onClick={() => handleForceCenter(-20.6, -69.3, 15)}
                  className="text-[10px] font-black text-orange-600 bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded flex items-center justify-center gap-1 w-full transition border border-orange-200"
                >
                  <Target className="w-3 h-3" /> ENFOCAR
                </button>
              </div>

              {/* Geofence Alert: Desvío de Ruta (Corredor) */}
              <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> CAM-015
                  </span>
                  <span className="bg-amber-200 text-amber-800 text-[9px] px-1.5 py-0.5 rounded uppercase font-black text-center leading-tight">
                    Desvío Detectado
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mb-2 font-medium leading-relaxed">
                  Vehículo fuera del corredor operacional por{" "}
                  <span className="font-black text-amber-900">1.2 km</span> (Desvío Crítico).
                </p>
                <button
                  onClick={() => handleForceCenter(-20.585, -69.31, 15)}
                  className="text-[10px] font-black text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded flex items-center justify-center gap-1 w-full transition border border-amber-200"
                >
                  <Target className="w-3 h-3" /> ENFOCAR
                </button>
              </div>

              {/* Dynamic Condition Alerts from DB */}
              {vehiculosGPS
                .filter((v) =>
                  ["exceso_velocidad", "ralenti"].includes(v.condicion),
                )
                .map((v) => (
                  <div
                    key={v.id}
                    className={`p-3 rounded-lg border ${v.condicion === "exceso_velocidad" ? "bg-yellow-50 border-yellow-200" : "bg-amber-50 border-amber-200"}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`font-bold flex items-center gap-1.5 text-sm ${v.condicion === "exceso_velocidad" ? "text-yellow-900" : "text-amber-900"}`}
                      >
                        <AlertTriangle className="w-4 h-4" /> {v.patente}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black ${v.condicion === "exceso_velocidad" ? "bg-yellow-200 text-yellow-800" : "bg-amber-200 text-amber-800"}`}
                      >
                        {v.condicion === "exceso_velocidad"
                          ? "Sobrevelocidad"
                          : "Ralentí Excesivo"}
                      </span>
                    </div>
                    {v.condicion === "exceso_velocidad" && (
                      <p className="text-[11px] text-yellow-800 mb-2 font-medium">
                        Circulando a{" "}
                        <strong className="text-red-600 text-xs">
                          {v.velocidad} km/h
                        </strong>{" "}
                        en zona de {v.limite} km/h.
                      </p>
                    )}
                    <button
                      onClick={() => handleForceCenter(v.lat, v.lng, 15)}
                      className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded flex items-center justify-center gap-1 w-full transition mt-2"
                    >
                      <Target className="w-3 h-3" /> ENFOCAR
                    </button>
                  </div>
                ))}
              {vehiculosGPS.filter((v) =>
                ["exceso_velocidad", "ralenti"].includes(v.condicion),
              ).length === 0 && (
                <div className="text-center p-2">
                  <span className="text-[11px] font-bold text-slate-400">
                    Sin otras alertas dinámicas.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Playback Bar */}
        {playbackMode && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] w-[90%] max-w-2xl bg-slate-900 shadow-2xl rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                <MapIcon className="w-4 h-4 text-indigo-400" /> PLAYBACK
                HISTÓRICO:{" "}
                {selectedVehicleData?.patente || "Seleccione Vehículo primero"}
              </h4>
              <button
                onClick={() => setPlaybackMode(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Playback Stats */}
            <div className="grid grid-cols-4 gap-2 mb-1 text-center">
              <div className="bg-slate-800 p-2 rounded">
                <span className="block text-[8px] tracking-widest text-slate-400 font-bold uppercase">
                  Cumplimiento
                </span>
                <span className="text-sm font-black text-emerald-400">96%</span>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <span className="block text-[8px] tracking-widest text-slate-400 font-bold uppercase">
                  T. Transcurrido
                </span>
                <span className="text-sm font-black text-indigo-400">
                  1h 42m
                </span>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <span className="block text-[8px] tracking-widest text-slate-400 font-bold uppercase">
                  T. Detenido
                </span>
                <span className="text-sm font-black text-amber-400">18m</span>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <span className="block text-[8px] tracking-widest text-slate-400 font-bold uppercase">
                  Infractor / Desv.
                </span>
                <span className="text-sm font-black text-red-400">1</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition">
                <Rewind className="w-4 h-4" />
              </button>
              <button className="p-3 bg-indigo-500 hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] rounded-full text-white transition scale-110">
                <Play className="w-5 h-5 ml-0.5" />
              </button>
              <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition flex items-center gap-1 font-black text-[10px]">
                <FastForward className="w-4 h-4" /> x4
              </button>

              <div className="flex-1 px-4 relative flex flex-col justify-center">
                <input
                  type="range"
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-1"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  <span>Ayer 08:00</span>
                  <span>Ayer 18:30</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaflet Map Context */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden rounded-2xl relative">
          <MapContainer
            center={[centerEvent.lat, centerEvent.lng]}
            zoom={centerEvent.zoom}
            className="h-full w-full absolute inset-0"
            zoomControl={false}
            attributionControl={false}
          >
            <MapController
              centerEvent={centerEvent}
              isFollowing={isFollowing}
              selectedLat={selectedVehicleData?.lat}
              selectedLng={selectedVehicleData?.lng}
            />

            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

            {/* Heatmap Simulation Overlay */}
            {showHeatmap && (
              <Circle
                center={[-20.57, -69.34]}
                radius={800}
                pathOptions={{
                  color: "red",
                  fillColor: "red",
                  fillOpacity: 0.3,
                  stroke: false
                }}
              >
                <Tooltip permanent direction="center" className="bg-transparent border-none shadow-none text-white font-black text-lg opacity-90">Congestión Crítica Alta</Tooltip>
              </Circle>
            )}
            {geocercasMock.map((geo) => (
              <Circle
                key={"geo-" + geo.id}
                center={[geo.lat, geo.lng]}
                radius={geo.radius}
                pathOptions={{
                  color: "#f97316",
                  fillColor: "#f97316",
                  fillOpacity: 0.1,
                  weight: 1.5,
                  dashArray: "4 4",
                }}
              >
                <Tooltip
                  permanent
                  direction="top"
                  className="bg-transparent border-none shadow-none text-orange-700 font-black text-[10px] opacity-80"
                  offset={[0, -10]}
                >
                  {geo.name} ({geo.type}) - Tol: {geo.allowedMinutes}m
                </Tooltip>
              </Circle>
            ))}

            {/* Rutas Simuladas */}
            <Polyline
              positions={mockRoutePlanificada}
              color="#3b82f6"
              weight={5}
              opacity={0.6}
              dashArray="8 8"
            />
            <Polyline
              positions={mockRouteReal}
              color="#10b981"
              weight={4}
              opacity={0.9}
            />

            {/* Vehículos */}
            {vehiculosGPS.map((v) => (
              <Marker
                key={v.id}
                position={[v.lat, v.lng]}
                icon={createVehicleIcon(v.patente, v.condicion)}
                eventHandlers={{
                  click: () => {
                    setSelectedVehicleId(v.id);
                    if (isFollowing) {
                      setCenterEvent({
                        lat: v.lat,
                        lng: v.lng,
                        zoom: 15,
                        force: true,
                        updateTick: Date.now(),
                      });
                    }
                  },
                }}
              >
                <Popup className="font-sans min-w-[240px]">
                  <div className="p-1 -m-1">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                      <h4 className="font-black text-sm text-slate-800">
                        {v.patente}
                      </h4>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${v.condicion === "detenido" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {v.estado}
                      </span>
                    </div>

                    {/* Salud de Ruta KPI */}
                    <div className="mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-black text-slate-500 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-emerald-500" />{" "}
                          Salud Operacional Base
                        </span>
                        <span
                          className={`font-black text-xs ${v.salud >= 90 ? "text-emerald-600" : "text-orange-600"}`}
                        >
                          {v.salud}/100
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${v.salud >= 90 ? "bg-emerald-500" : "bg-orange-500"}`}
                          style={{ width: `${v.salud}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1 text-[9px] font-bold text-slate-400">
                        <span>
                          Desvíos: {v.id === selectedVehicleId ? "1" : "0"}
                        </span>
                        <span>
                          Infracciones:{" "}
                          {v.condicion === "exceso_velocidad" ? 1 : 0}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between border-b border-slate-100 pb-1 pt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                          ETA Destino
                        </span>
                        <span className="font-bold text-[11px] text-slate-700">
                          {v.etaDestino} {v.retrasoMin > 0 && <span className="text-red-500 ml-1">(+{v.retrasoMin}m)</span>}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                          Ciclo Actual
                        </span>
                        <span className="font-bold text-[11px] text-indigo-700">
                          {v.cicloEstado}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                          Velocidad
                        </span>
                        <span
                          className={`font-black text-[11px] ${v.condicion === "exceso_velocidad" ? "text-red-600" : "text-slate-700"}`}
                        >
                          {v.velocidad} km/h
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                          Conductor
                        </span>
                        <span className="font-bold text-[11px] text-slate-700">
                          {v.conductor}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedVehicleId(v.id);
                        setIsFollowing(true);
                        setCenterEvent({
                          lat: v.lat,
                          lng: v.lng,
                          zoom: 16,
                          force: true,
                          updateTick: Date.now(),
                        });
                      }}
                      className={`mt-1 w-full text-white text-[11px] font-bold py-2 rounded-lg flex justify-center items-center gap-1 shadow-sm transition ${isFollowing && selectedVehicleId === v.id ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                    >
                      {isFollowing && selectedVehicleId === v.id ? (
                        <>
                          <Target className="w-3.5 h-3.5" /> Siguiendo Activado
                        </>
                      ) : (
                        <>
                          <Target className="w-3.5 h-3.5" /> Centrar y Seguir
                        </>
                      )}
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Centro de Control Operacional Modal */}
      {isGlobalMonitorOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 h-screen">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
              <h2 className="font-black text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> Centro de Análisis Operacional
              </h2>
              <button 
                onClick={() => setIsGlobalMonitorOpen(false)}
                className="hover:bg-slate-800 p-1 rounded transition"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>
            
            <div className="bg-slate-100 p-2 flex justify-between items-center border-b border-slate-200 shrink-0">
               <div className="flex gap-1">
                 <button 
                   onClick={() => setActiveGlobalTab('rutas')}
                   className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeGlobalTab === 'rutas' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   Estado de Rutas
                 </button>
                 <button 
                   onClick={() => setActiveGlobalTab('cuellos')}
                   className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeGlobalTab === 'cuellos' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   Ranking Cuellos de Botella
                 </button>
                 <button 
                   onClick={() => setActiveGlobalTab('ciclos')}
                   className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeGlobalTab === 'ciclos' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   Tiempos de Ciclo
                 </button>
                 <button 
                   onClick={() => setActiveGlobalTab('turnos')}
                   className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeGlobalTab === 'turnos' ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                   Comparación por Turno
                 </button>
               </div>
               <div className="flex items-center gap-2 px-2 border-l border-slate-300 pl-4">
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-widest"><Clock className="w-3 h-3 inline mr-1" /> Período Análisis</span>
                 <input 
                   type="date" 
                   className="text-xs p-1.5 border border-slate-200 rounded text-slate-700 bg-white shadow-sm font-bold"
                   value={dateRange.start}
                   onChange={e => setDateRange({...dateRange, start: e.target.value})}
                 />
                 <span className="text-slate-400 font-bold text-xs">-</span>
                 <input 
                   type="date" 
                   className="text-xs p-1.5 border border-slate-200 rounded text-slate-700 bg-white shadow-sm font-bold"
                   value={dateRange.end}
                   onChange={e => setDateRange({...dateRange, end: e.target.value})}
                 />
                 <button onClick={handleFilter} disabled={isFiltering} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm hover:bg-indigo-700 transition disabled:opacity-50">
                   {isFiltering ? (
                     <span className="flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin"/> Buscando...</span>
                   ) : "Filtrar Datos"}
                 </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 custom-scrollbar relative">
               {isFiltering && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 rounded-b-2xl">
                     <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                     <p className="text-slate-800 font-bold text-lg">Consultando Base de Datos Histórica...</p>
                     <p className="text-slate-500 text-sm mt-1 text-center max-w-md">Calculando tiempos de ciclo, estadísticos de ruta y cuellos de botella para el período {dateRange.start} al {dateRange.end}.</p>
                  </div>
               )}
               {activeGlobalTab === 'rutas' && (
                 <div className="space-y-3">
                   <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-600"/></div>
                        <div>
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Rutas Normales</span>
                          <span className="text-xl font-black text-slate-800">128</span>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-amber-600"/></div>
                        <div>
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">En Riesgo (Leve)</span>
                          <span className="text-xl font-black text-slate-800">14</span>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-red-200 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertOctagon className="w-5 h-5 text-red-600"/></div>
                        <div>
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Estado Crítico</span>
                          <span className="text-xl font-black text-slate-800">3</span>
                        </div>
                      </div>
                   </div>

                   {vehiculosGPS.map((v) => (
                     <div
                       key={v.id}
                       className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:shadow-md transition-shadow"
                     >
                       <div className="flex items-center gap-4 w-1/3">
                         <div className={`w-2 h-10 rounded-full ${v.retrasoMin > 20 ? 'bg-red-500' : (v.retrasoMin > 5 ? 'bg-amber-500' : 'bg-emerald-500')}`}></div>
                         <div>
                           <h3 className="font-black text-sm text-slate-800">{v.patente}</h3>
                           <p className="text-xs text-slate-500 font-medium">Ciclo: {v.cicloEstado}</p>
                         </div>
                       </div>
                       
                       <div className="flex flex-col items-center justify-center w-1/4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Tiempo Transcurrido</span>
                          <span className="text-sm font-black text-slate-700">{v.tiempoCiclo}</span>
                       </div>

                       <div className="flex flex-col items-end justify-center w-1/4 text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Estado ETA</span>
                          {v.retrasoMin === 0 ? (
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">A TIEMPO</span>
                          ) : (
                            <span className={`text-xs font-black px-2 py-0.5 rounded ${v.retrasoMin > 15 ? 'text-red-700 bg-red-50' : 'text-amber-700 bg-amber-50'}`}>
                              RETRASO +{v.retrasoMin}m
                            </span>
                          )}
                       </div>
                     </div>
                   ))}
                 </div>
               )}

               {activeGlobalTab === 'cuellos' && (
                  <div className="space-y-4">
                     <p className="text-sm text-slate-600 font-medium bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex gap-2">
                       <BarChart3 className="w-5 h-5 text-indigo-600 shrink-0"/> 
                       Las siguientes geocercas presentan los mayores tiempos de espera operativos por encima del nivel de tolerancia permitido (últimos 7 días).
                     </p>
                     
                     <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                       <table className="w-full text-left text-sm text-slate-600">
                         <thead className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase">
                           <tr>
                             <th className="px-4 py-3">Punto Crítico</th>
                             <th className="px-4 py-3">Tipo Zona</th>
                             <th className="px-4 py-3">Tolerancia</th>
                             <th className="px-4 py-3">Promedio Espera</th>
                             <th className="px-4 py-3">Impacto (Horas Perdidas)</th>
                             <th className="px-4 py-3 text-right">Tendencia</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                           <tr className="hover:bg-slate-50">
                             <td className="px-4 py-3 font-bold text-slate-800">Acceso Puerto Norte</td>
                             <td className="px-4 py-3"><span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-black">PUERTO</span></td>
                             <td className="px-4 py-3">120 min</td>
                             <td className="px-4 py-3 font-black text-red-600">3h 22m</td>
                             <td className="px-4 py-3">142 hrs/mes</td>
                             <td className="px-4 py-3 text-right text-red-500 font-bold">+18% <TrendingDown className="w-3 h-3 inline"/></td>
                           </tr>
                           <tr className="hover:bg-slate-50">
                             <td className="px-4 py-3 font-bold text-slate-800">Báscula Planta A</td>
                             <td className="px-4 py-3"><span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-0.5 rounded font-black">PESAJE</span></td>
                             <td className="px-4 py-3">20 min</td>
                             <td className="px-4 py-3 font-black text-amber-600">2h 15m</td>
                             <td className="px-4 py-3">89 hrs/mes</td>
                             <td className="px-4 py-3 text-right text-red-500 font-bold">+5% <TrendingDown className="w-3 h-3 inline"/></td>
                           </tr>
                           <tr className="hover:bg-slate-50">
                             <td className="px-4 py-3 font-bold text-slate-800">Zona de Espera 3</td>
                             <td className="px-4 py-3"><span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded font-black">ESPERA</span></td>
                             <td className="px-4 py-3">180 min</td>
                             <td className="px-4 py-3 font-black text-amber-600">3h 54m</td>
                             <td className="px-4 py-3">45 hrs/mes</td>
                             <td className="px-4 py-3 text-right text-emerald-500 font-bold">-12% <TrendingDown className="w-3 h-3 inline transform rotate-180"/></td>
                           </tr>
                         </tbody>
                       </table>
                     </div>
                  </div>
               )}

               {activeGlobalTab === 'ciclos' && (
                 <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center py-10">
                      <ListFilter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-lg font-black text-slate-800">Análisis de Ciclos Productivos</h3>
                      <p className="text-slate-500 max-w-md mx-auto text-sm mt-1">
                        Visualización avanzada de las fases del ciclo minero (Carga - Transporte - Descarga - Retorno). Seleccione una flota para generar el reporte.
                      </p>
                      <button className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition">Generar Reporte de Ciclos</button>
                    </div>
                 </div>
               )}
               
               {activeGlobalTab === 'turnos' && (
                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-center">
                        <h3 className="font-black text-amber-900 flex items-center gap-2"><Clock className="w-5 h-5"/> Turno Día (08:00 - 20:00)</h3>
                      </div>
                      <div className="p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-500 font-bold text-sm">Viajes Completados</span>
                          <span className="text-xl font-black text-slate-800">125</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-500 font-bold text-sm">Cumplimiento de Ruta</span>
                          <span className="text-xl font-black text-emerald-600">92%</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-500 font-bold text-sm">Alertas Críticas</span>
                          <span className="text-xl font-black text-red-600">4</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold text-sm">T. Promedio Ciclo</span>
                          <span className="text-xl font-black text-slate-800">1h 42m</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-center">
                        <h3 className="font-black text-indigo-900 flex items-center gap-2"><Clock className="w-5 h-5"/> Turno Noche (20:00 - 08:00)</h3>
                      </div>
                      <div className="p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-500 font-bold text-sm">Viajes Completados</span>
                          <span className="text-xl font-black text-slate-800">107</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-500 font-bold text-sm">Cumplimiento de Ruta</span>
                          <span className="text-xl font-black text-amber-600">81%</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-slate-500 font-bold text-sm">Alertas Críticas</span>
                          <span className="text-xl font-black text-red-600">12</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold text-sm">T. Promedio Ciclo</span>
                          <span className="text-xl font-black text-slate-800">2h 15m</span>
                        </div>
                      </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
