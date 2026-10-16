import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { 
  Droplet, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Filter, 
  Search,
  Plus,
  BarChart3,
  CarFront,
  Banknote,
  MapPin,
  Calendar,
  User,
  History,
  Info,
  X,
  Target,
  RotateCcw,
  Gauge,
  Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  if (!data) return null;

  return (
    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2.5 min-w-[240px] z-50">
      <div className="font-bold text-slate-800 dark:text-slate-100 border-b pb-1.5 dark:border-slate-800 flex justify-between items-center">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          Día {label}
        </span>
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          {data.totalVehiculos} {data.totalVehiculos === 1 ? 'unidad' : 'unidades'}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
          <span>Gasto Total:</span>
          <span className="font-bold text-slate-900 dark:text-white">${data.costo.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
          <span>Combustible:</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">{data.litros.toLocaleString()} L</span>
        </div>
      </div>

      {/* Discriminación de rendimiento / consumo por tipo */}
      {(data.rendimientoKmL !== null || data.consumoLh !== null) && (
        <div className="pt-2 border-t dark:border-slate-800 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Métricas del Día
          </div>

          {data.rendimientoKmL !== null && (
            <div className="flex justify-between items-center bg-blue-50/80 dark:bg-blue-950/40 p-2 rounded-lg border border-blue-200/60 dark:border-blue-900/40">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Ruta ({data.vehiculosKmLCount} {data.vehiculosKmLCount === 1 ? 'vehículo' : 'vehículos'}):
                </span>
              </div>
              <span className="font-bold text-blue-700 dark:text-blue-300 font-mono text-xs">
                {data.rendimientoKmL} km/L
              </span>
            </div>
          )}

          {data.consumoLh !== null && (
            <div className="flex justify-between items-center bg-amber-50/80 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Faena ({data.vehiculosLhCount} {data.vehiculosLhCount === 1 ? 'maquinaria' : 'maquinarias'}):
                </span>
              </div>
              <span className="font-bold text-amber-700 dark:text-amber-300 font-mono text-xs">
                {data.consumoLh} L/h
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function GestionCombustible() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vehiculos' | 'cargas'>('dashboard');
  
  // Modal states
  const [isAjustarMetasOpen, setIsAjustarMetasOpen] = useState(false);
  const [isRegistrarCargaOpen, setIsRegistrarCargaOpen] = useState(false);
  const [isKmManual, setIsKmManual] = useState(false);

  // Detail panel state
  const [selectedKpi, setSelectedKpi] = useState<'costo' | 'rendimiento' | 'costokm' | 'alertas' | null>(null);

  // Date filters
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  // Filtros específicos para el Dashboard (Marca y Modelo)
  const [dashMarca, setDashMarca] = useState('todos');
  const [dashModelo, setDashModelo] = useState('todos');

  // Filtros multidimensionales para Rend. Vehículos
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroMarca, setFiltroMarca] = useState('todos');
  const [filtroModelo, setFiltroModelo] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroRuta, setFiltroRuta] = useState('todos');
  const [filtroAplicacion, setFiltroAplicacion] = useState('todos');

  // Filtros para panel Cargas
  const [filtroCargasVehiculo, setFiltroCargasVehiculo] = useState('todos');
  const [busquedaCargas, setBusquedaCargas] = useState('');
  const { currentCompany } = useCompany();

  // Real data state
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [cargasRegistradas, setCargasRegistradas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [formCarga, setFormCarga] = useState({
    fecha: new Date().toISOString().split('T')[0],
    vehiculo_id: '',
    conductor: '',
    odometro: '',
    litros: '',
    ruta: '',
    costo_total: '',
    tipo_combustible: 'Diésel'
  });
  
  const [formMeta, setFormMeta] = useState<{
    vehiculo_id: string;
    tipo_medicion: 'km_l' | 'l_h';
    rendimiento_objetivo: string;
  }>({
    vehiculo_id: '',
    tipo_medicion: 'km_l',
    rendimiento_objetivo: ''
  });

  const handleOpenAjustarMetas = (vehiculo?: any) => {
    if (vehiculo) {
      const tipoMed = (vehiculo.tipoMedicion || vehiculo.detalles?.tipo_medicion || 'km_l') as 'km_l' | 'l_h';
      const obj = vehiculo.rendimientoObjetivo !== undefined 
        ? String(vehiculo.rendimientoObjetivo) 
        : (vehiculo.detalles?.rendimiento_objetivo !== undefined 
            ? String(vehiculo.detalles.rendimiento_objetivo) 
            : (tipoMed === 'l_h' ? '15.0' : '2.8'));
      setFormMeta({
        vehiculo_id: vehiculo.id,
        tipo_medicion: tipoMed,
        rendimiento_objetivo: obj
      });
    } else if (vehiculos.length > 0) {
      const currentId = formMeta.vehiculo_id || vehiculos[0].id;
      const v = vehiculos.find(veh => veh.id === currentId) || vehiculos[0];
      const tipoMed = (v.detalles?.tipo_medicion as 'km_l' | 'l_h') || 'km_l';
      const obj = v.detalles?.rendimiento_objetivo !== undefined ? String(v.detalles.rendimiento_objetivo) : (tipoMed === 'l_h' ? '15.0' : '2.8');
      setFormMeta({
        vehiculo_id: v.id,
        tipo_medicion: tipoMed,
        rendimiento_objetivo: obj
      });
    }
    setIsAjustarMetasOpen(true);
  };

  const [preciosActuales, setPreciosActuales] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, [currentCompany]);

  const fetchData = async () => {
    if (!currentCompany) return;
    try {
      setLoading(true);
      const [vehiculoRes, cargasRes, preciosRes] = await Promise.all([
        supabase.from('vehiculo').select('*').eq('empresa_id', currentCompany.id),
        supabase.from('registro_combustible').select('*, vehiculo:vehiculo_id(patente, detalles)').eq('empresa_id', currentCompany.id).order('fecha', { ascending: false }),
        supabase.from('log_actividad').select('detalles').eq('empresa_id', currentCompany.id).eq('accion', 'PRECIO_COMBUSTIBLE').order('created_at', { ascending: false })
      ]);
      
      const newPrecios: Record<string, number> = {};
      if (preciosRes.data) {
         // Because it's ordered by latest first, we only take the first occurrence of each type
         preciosRes.data.forEach(log => {
            try {
               const det = JSON.parse(log.detalles || '{}');
               if (det.tipo && det.precio && !newPrecios[det.tipo]) {
                  newPrecios[det.tipo] = Number(det.precio);
               }
            } catch (e) {}
         });
      }
      setPreciosActuales(newPrecios);

      if (vehiculoRes.data) {
        const dataSorted = [...vehiculoRes.data].sort((a, b) => {
          const valA = a.numero_interno || (a.detalles ? a.detalles.numero_interno : '');
          const valB = b.numero_interno || (b.detalles ? b.detalles.numero_interno : '');
          return String(valA).localeCompare(String(valB), undefined, { numeric: true });
        });
        setVehiculos(dataSorted);
      }
      if (cargasRes.data) setCargasRegistradas(cargasRes.data.map((c: any) => ({
         ...c,
         vehiculoName: c.vehiculo ? (c.vehiculo.detalles?.numero_interno || c.vehiculo.patente) : c.patente,
         fechaFormateada: new Date(c.fecha).toLocaleDateString()
      })));
    } catch (error) {
      console.error("Error fetching fuel data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCarga = async () => {
    if (!currentCompany || !formCarga.vehiculo_id || !formCarga.litros) return alert('Complete los campos obligatorios');
    try {
      const selectedV = vehiculos.find(v => v.id === formCarga.vehiculo_id);
      const nuevaCarga = {
        empresa_id: currentCompany.id,
        vehiculo_id: formCarga.vehiculo_id,
        patente: selectedV?.patente || '',
        fecha: formCarga.fecha,
        conductor: formCarga.conductor,
        odometro: parseFloat(formCarga.odometro) || 0,
        litros: parseFloat(formCarga.litros) || 0,
        costo_total: parseFloat(formCarga.costo_total) || 0,
        ruta: formCarga.ruta
      };
      
      const { error } = await supabase.from('registro_combustible').insert([nuevaCarga]);
      if (error) throw error;
      
      if (!isKmManual && parseFloat(formCarga.odometro) > 0) {
        await supabase.from('vehiculo').update({ kilometraje_actual: parseFloat(formCarga.odometro) }).eq('id', formCarga.vehiculo_id);
      }
      
      setIsRegistrarCargaOpen(false);
      setFormCarga({fecha: new Date().toISOString().split('T')[0], vehiculo_id: '', conductor: '', odometro: '', litros: '', ruta: '', costo_total: '', tipo_combustible: 'Diésel'});
      fetchData();
    } catch (err: any) {
      alert("Error al registrar carga: " + err.message);
    }
  };

  const handleSaveMeta = async () => {
    if (!formMeta.vehiculo_id || !formMeta.rendimiento_objetivo) return alert('Completa los campos');
    try {
       const selectedV = vehiculos.find(v => v.id === formMeta.vehiculo_id);
       const obj = parseFloat(formMeta.rendimiento_objetivo);
       const detalles = selectedV?.detalles || {};
       await supabase.from('vehiculo').update({
         detalles: {
           ...detalles,
           tipo_medicion: formMeta.tipo_medicion,
           rendimiento_objetivo: obj
         }
       }).eq('id', formMeta.vehiculo_id);
       setIsAjustarMetasOpen(false);
       fetchData();
    } catch (err: any) {
       alert("Error al guardar meta: " + err.message);
    }
  };

  // 1. Filtrado base de cargas por rango de fecha (afecta a Dashboard, Rend. Vehículos y Cargas)
  const cargasFiltradasPorFecha = React.useMemo(() => {
    return cargasRegistradas.filter(c => {
      const cDate = c.fecha ? c.fecha.substring(0, 10) : '';
      if (fechaDesde && cDate < fechaDesde) return false;
      if (fechaHasta && cDate > fechaHasta) return false;
      return true;
    });
  }, [cargasRegistradas, fechaDesde, fechaHasta]);

  // 1.1 Opciones y segmentación específica para el Dashboard (Marca y Modelo)
  const opcionesDashMarcas = React.useMemo(() => {
    const s = new Set<string>();
    vehiculos.forEach(v => {
      const m = v.marca || v.detalles?.marca;
      if (m && m !== 'N/A') s.add(m);
    });
    return Array.from(s).sort();
  }, [vehiculos]);

  const opcionesDashModelos = React.useMemo(() => {
    const s = new Set<string>();
    vehiculos.forEach(v => {
      const m = v.marca || v.detalles?.marca;
      if (dashMarca !== 'todos' && m !== dashMarca) return;
      const mod = v.modelo || v.detalles?.modelo;
      if (mod && mod !== 'N/A') s.add(mod);
    });
    return Array.from(s).sort();
  }, [vehiculos, dashMarca]);

  const vehiculosDashboard = React.useMemo(() => {
    return vehiculos.filter(v => {
      const m = v.marca || v.detalles?.marca;
      const mod = v.modelo || v.detalles?.modelo;
      if (dashMarca !== 'todos' && m !== dashMarca) return false;
      if (dashModelo !== 'todos' && mod !== dashModelo) return false;
      return true;
    });
  }, [vehiculos, dashMarca, dashModelo]);

  const vehiculosDashboardIds = React.useMemo(() => {
    return new Set(vehiculosDashboard.map(v => v.id));
  }, [vehiculosDashboard]);

  const cargasDashboard = React.useMemo(() => {
    return cargasFiltradasPorFecha.filter(c => vehiculosDashboardIds.has(c.vehiculo_id));
  }, [cargasFiltradasPorFecha, vehiculosDashboardIds]);

  // 1.2 Mapa maestro de deltas (km u horas) y rendimientos/consumos reales calculados por carga en base a odómetros/horómetros históricos
  const metricasPorCarga = React.useMemo(() => {
    const cargasPorVehiculo: Record<string, any[]> = {};
    cargasRegistradas.forEach(c => {
      if (!cargasPorVehiculo[c.vehiculo_id]) cargasPorVehiculo[c.vehiculo_id] = [];
      cargasPorVehiculo[c.vehiculo_id].push(c);
    });

    const deltaMap: Record<string, number> = {};
    const rendMap: Record<string, number> = {};

    const vehiculoMap: Record<string, any> = {};
    vehiculos.forEach(v => { vehiculoMap[v.id] = v; });

    Object.keys(cargasPorVehiculo).forEach(vId => {
      const v = vehiculoMap[vId];
      const tipoMedicion = (v?.detalles?.tipo_medicion || 'km_l') as 'km_l' | 'l_h';

      const sorted = [...cargasPorVehiculo[vId]].sort((a, b) => {
        const tA = new Date(a.fecha).getTime();
        const tB = new Date(b.fecha).getTime();
        if (tA !== tB) return tA - tB;
        return (parseFloat(a.odometro) || 0) - (parseFloat(b.odometro) || 0);
      });

      for (let i = 0; i < sorted.length; i++) {
        const c = sorted[i];
        const odo = parseFloat(c.odometro) || 0;
        const litros = parseFloat(c.litros) || 0;

        if (i === 0) {
          deltaMap[c.id] = 0;
          rendMap[c.id] = 0;
        } else {
          const prevOdo = parseFloat(sorted[i - 1].odometro) || 0;
          const delta = odo > prevOdo ? (odo - prevOdo) : 0;
          deltaMap[c.id] = delta;
          if (tipoMedicion === 'l_h') {
            // Litros por Hora: litros consumidos / delta horas
            rendMap[c.id] = (delta > 0 && litros > 0) ? Number((litros / delta).toFixed(2)) : 0;
          } else {
            // Kilómetros por Litro: delta km / litros consumidos
            rendMap[c.id] = (delta > 0 && litros > 0) ? Number((delta / litros).toFixed(2)) : 0;
          }
        }
      }
    });

    return { deltaMap, rendMap };
  }, [cargasRegistradas, vehiculos]);

  // 2. Procesar tabla de la flota (con cálculo delta y atributos de tipo, ruta, aplicación y unidad km/L o L/h)
  const tablaFlota = React.useMemo(() => {
    return vehiculos.map(v => {
       const tipoMedicion = (v.detalles?.tipo_medicion || 'km_l') as 'km_l' | 'l_h';
       const unidadMedida = tipoMedicion === 'l_h' ? 'L/h' : 'km/L';
       const unidadDelta = tipoMedicion === 'l_h' ? 'hrs' : 'km';
       const unidadCosto = tipoMedicion === 'l_h' ? '$/h' : '$/km';

       const vCargas = cargasFiltradasPorFecha.filter(c => c.vehiculo_id === v.id);
       const vTotalCosto = vCargas.reduce((acc, c) => acc + (parseFloat(c.costo_total)||0), 0);
       const vTotalLitros = vCargas.reduce((acc, c) => acc + (parseFloat(c.litros)||0), 0);
       const rendimientoObjetivo = parseFloat(v.detalles?.rendimiento_objetivo || (tipoMedicion === 'l_h' ? '15.0' : '2.5'));
       const tieneCargasEnPeriodo = vCargas.length > 0;
       
       let vTotalKm = 0; // Total deltas (km u horas según tipoMedicion)
       let rendimientoHistorico = 0;

       if (tieneCargasEnPeriodo) {
          // Sumar deltas reales (km u horas) calculados en base al odómetro/horómetro previo
          vTotalKm = vCargas.reduce((acc, c) => acc + (metricasPorCarga.deltaMap[c.id] || 0), 0);

          // Obtener los rendimientos/consumos operacionales válidos de las cargas en este periodo
          const rendsValidos = vCargas
            .map(c => metricasPorCarga.rendMap[c.id])
            .filter(r => r !== undefined && r > 0);

          if (rendsValidos.length > 0) {
             rendimientoHistorico = Number((rendsValidos.reduce((a, b) => a + b, 0) / rendsValidos.length).toFixed(2));
          } else if (vTotalKm > 0 && vTotalLitros > 0) {
             if (tipoMedicion === 'l_h') {
               rendimientoHistorico = Number((vTotalLitros / vTotalKm).toFixed(2));
             } else {
               rendimientoHistorico = Number((vTotalKm / vTotalLitros).toFixed(2));
             }
          } else {
             // Si no hay delta previo (primera carga histórica del vehículo), usar su meta
             rendimientoHistorico = rendimientoObjetivo;
          }
       }
       
       const costoKm30d = vTotalKm > 0 ? Math.round(vTotalCosto / vTotalKm) : 0;
       
       let estado = 'N/A';
       let desviacionPct = 0;

       if (tieneCargasEnPeriodo && rendimientoHistorico > 0) {
          if (tipoMedicion === 'l_h') {
             // Para Litros / Hora: menor es mejor!
             // Si el consumo supera la meta en >15%, es Crítico; entre 5% y 15% es Regular; <=5% es Óptimo
             desviacionPct = Number((((rendimientoHistorico - rendimientoObjetivo) / rendimientoObjetivo) * 100).toFixed(1));
             if (rendimientoHistorico > rendimientoObjetivo * 1.15) estado = 'Crítico';
             else if (rendimientoHistorico > rendimientoObjetivo * 1.05) estado = 'Regular';
             else estado = 'Óptimo';
          } else {
             // Para km/L: mayor es mejor!
             // Si el rendimiento cae por debajo del 85% de la meta es Crítico; entre 85% y 95% es Regular; >=95% es Óptimo
             desviacionPct = Number((((rendimientoHistorico - rendimientoObjetivo) / rendimientoObjetivo) * 100).toFixed(1));
             if (rendimientoHistorico < rendimientoObjetivo * 0.85) estado = 'Crítico';
             else if (rendimientoHistorico < rendimientoObjetivo * 0.95) estado = 'Regular';
             else estado = 'Óptimo';
          }
       } else {
          estado = 'Sin Datos';
       }

       const rutasCargas = Array.from(new Set(vCargas.map(c => c.ruta).filter(Boolean))) as string[];
       const rutaPrincipal = rutasCargas.length > 0 ? rutasCargas[0] : (v.detalles?.ruta || 'General');

       return {
          id: v.id,
          patente: v.patente,
          numeroInterno: v.detalles?.numero_interno || v.patente,
          marca: v.marca || v.detalles?.marca || 'N/A',
          modelo: v.modelo || v.detalles?.modelo || 'N/A',
          tipo: v.tipo || v.detalles?.tipo || v.detalles?.tipo_vehiculo || 'Bus / Camión',
          aplicacion: v.detalles?.tipo_uso || v.detalles?.aplicacion || v.detalles?.faena || 'Operación General',
          ruta: rutaPrincipal,
          rutas: rutasCargas,
          tipoMedicion,
          unidadMedida,
          unidadDelta,
          unidadCosto,
          rendimientoObjetivo,
          rendimientoHistorico,
          desviacionPct,
          costoKm30d,
          vTotalKm,
          vTotalLitros,
          vTotalCosto,
          tieneCargasEnPeriodo,
          totalCargas: vCargas.length,
          estado
       };
    });
  }, [vehiculos, cargasFiltradasPorFecha, metricasPorCarga]);

  // Segmentación de alertas y flota para el Dashboard
  const tablaFlotaDashboard = React.useMemo(() => {
    return tablaFlota.filter(v => vehiculosDashboardIds.has(v.id));
  }, [tablaFlota, vehiculosDashboardIds]);

  const alertasDashboard = React.useMemo(() => {
    return tablaFlotaDashboard.filter(v => v.tieneCargasEnPeriodo && (v.estado === 'Crítico' || v.estado === 'Regular'));
  }, [tablaFlotaDashboard]);

  const vehiculosCriticos = tablaFlotaDashboard.filter(v => v.tieneCargasEnPeriodo && v.estado === 'Crítico').length;
  const alertasRegularesCount = tablaFlotaDashboard.filter(v => v.tieneCargasEnPeriodo && v.estado === 'Regular').length;

  // 3. Procesar KPIs del Dashboard (calculados discriminando estrictamente ruta km/L y faena L/h)
  const kpis = React.useMemo(() => {
    let costoTotal30d = 0;
    let totalLitros = 0;
    let costoTotalKmL = 0;
    let litrosKmL = 0;
    let costoTotalLh = 0;
    let litrosLh = 0;

    const vehiculoMap: Record<string, any> = {};
    vehiculos.forEach(v => { vehiculoMap[v.id] = v; });

    cargasDashboard.forEach(c => {
       const cost = parseFloat(c.costo_total) || 0;
       const lit = parseFloat(c.litros) || 0;
       costoTotal30d += cost;
       totalLitros += lit;

       const v = vehiculoMap[c.vehiculo_id];
       const tipoMed = v?.detalles?.tipo_medicion || 'km_l';
       if (tipoMed === 'l_h') {
         costoTotalLh += cost;
         litrosLh += lit;
       } else {
         costoTotalKmL += cost;
         litrosKmL += lit;
       }
    });

    const totalKm = tablaFlotaDashboard.filter(v => v.tipoMedicion !== 'l_h').reduce((acc, v) => acc + (v.vTotalKm || 0), 0);
    const totalHoras = tablaFlotaDashboard.filter(v => v.tipoMedicion === 'l_h').reduce((acc, v) => acc + (v.vTotalKm || 0), 0);

    // Rendimiento Promedio Ruta: Solo unidades con tipo_medicion === 'km_l'
    const vehiculosKmL = tablaFlotaDashboard.filter(v => v.tieneCargasEnPeriodo && v.tipoMedicion !== 'l_h' && v.rendimientoHistorico > 0);
    const sumaRendimientosKmL = vehiculosKmL.reduce((acc, v) => acc + v.rendimientoHistorico, 0);
    const rendimientoPromedio = vehiculosKmL.length > 0 
      ? (sumaRendimientosKmL / vehiculosKmL.length).toFixed(2)
      : '0';

    // Consumo Promedio Maquinaria: Solo unidades con tipo_medicion === 'l_h'
    const vehiculosLh = tablaFlotaDashboard.filter(v => v.tieneCargasEnPeriodo && v.tipoMedicion === 'l_h' && v.rendimientoHistorico > 0);
    const sumaConsumoLh = vehiculosLh.reduce((acc, v) => acc + v.rendimientoHistorico, 0);
    const consumoPromedioLh = vehiculosLh.length > 0
      ? (sumaConsumoLh / vehiculosLh.length).toFixed(1)
      : null;

    // Costos unitarios independientes: ¡jamás mezclados!
    const costoKmRuta = totalKm > 0 ? Math.round(costoTotalKmL / totalKm) : 0;
    const costoHoraMaq = totalHoras > 0 ? Math.round(costoTotalLh / totalHoras) : 0;

    const criticosKmL = tablaFlotaDashboard.filter(v => v.tieneCargasEnPeriodo && v.tipoMedicion !== 'l_h' && v.estado === 'Crítico').length;
    const criticosLh = tablaFlotaDashboard.filter(v => v.tieneCargasEnPeriodo && v.tipoMedicion === 'l_h' && v.estado === 'Crítico').length;

    return {
      costoTotal30d,
      totalLitros,
      costoTotalKmL,
      litrosKmL,
      costoTotalLh,
      litrosLh,
      totalKm,
      totalHoras,
      vehiculosEvaluados: vehiculosKmL.length + vehiculosLh.length,
      vehiculosKmLCount: vehiculosKmL.length,
      vehiculosLhCount: vehiculosLh.length,
      sumaRendimientos: Number(sumaRendimientosKmL.toFixed(2)),
      rendimientoPromedio,
      consumoPromedioLh,
      costoKmRuta,
      costoHoraMaq,
      criticosKmL,
      criticosLh,
      costoKmPromedio: costoKmRuta,
    };
  }, [cargasDashboard, tablaFlotaDashboard, vehiculos]);

  // 4. Opciones dinámicas para filtros multidimensionales en Rend. Vehículos
  const opcionesMarcas = React.useMemo(() => {
    const s = new Set<string>();
    tablaFlota.forEach(v => { if (v.marca && v.marca !== 'N/A') s.add(v.marca); });
    return Array.from(s).sort();
  }, [tablaFlota]);

  const opcionesModelos = React.useMemo(() => {
    const s = new Set<string>();
    tablaFlota.forEach(v => {
      if (filtroMarca !== 'todos' && v.marca !== filtroMarca) return;
      if (v.modelo && v.modelo !== 'N/A') s.add(v.modelo);
    });
    return Array.from(s).sort();
  }, [tablaFlota, filtroMarca]);

  const opcionesTipos = React.useMemo(() => {
    const s = new Set<string>();
    tablaFlota.forEach(v => { if (v.tipo && v.tipo !== 'N/A') s.add(v.tipo); });
    return Array.from(s).sort();
  }, [tablaFlota]);

  const opcionesRutas = React.useMemo(() => {
    const s = new Set<string>();
    tablaFlota.forEach(v => {
      if (v.ruta && v.ruta !== 'General') s.add(v.ruta);
      if (Array.isArray(v.rutas)) v.rutas.forEach((r: string) => s.add(r));
    });
    cargasFiltradasPorFecha.forEach(c => { if (c.ruta) s.add(c.ruta); });
    return Array.from(s).sort();
  }, [tablaFlota, cargasFiltradasPorFecha]);

  const opcionesAplicaciones = React.useMemo(() => {
    const s = new Set<string>();
    tablaFlota.forEach(v => { if (v.aplicacion) s.add(v.aplicacion); });
    return Array.from(s).sort();
  }, [tablaFlota]);

  // 5. Filtrado multidimensional de vehículos
  const filteredFlota = React.useMemo(() => {
    const hayFiltroFecha = Boolean(fechaDesde || fechaHasta);

    return tablaFlota.filter(v => {
      // Si hay un filtro de fecha activo, solo mostrar unidades que tuvieron cargas en ese periodo
      if (hayFiltroFecha && !v.tieneCargasEnPeriodo) return false;

      if (filtroTexto.trim()) {
        const query = filtroTexto.toLowerCase().trim();
        const matchNum = v.numeroInterno?.toLowerCase().includes(query);
        const matchPat = v.patente?.toLowerCase().includes(query);
        if (!matchNum && !matchPat) return false;
      }
      if (filtroMarca !== 'todos' && v.marca !== filtroMarca) return false;
      if (filtroModelo !== 'todos' && v.modelo !== filtroModelo) return false;
      if (filtroTipo !== 'todos' && v.tipo !== filtroTipo) return false;
      if (filtroRuta !== 'todos') {
        const hasRuta = v.ruta === filtroRuta || (Array.isArray(v.rutas) && v.rutas.includes(filtroRuta));
        if (!hasRuta) return false;
      }
      if (filtroAplicacion !== 'todos' && v.aplicacion !== filtroAplicacion) return false;
      return true;
    });
  }, [tablaFlota, fechaDesde, fechaHasta, filtroTexto, filtroMarca, filtroModelo, filtroTipo, filtroRuta, filtroAplicacion]);

  const hayFiltrosActivosVehiculos = 
    filtroTexto.trim() !== '' || 
    filtroMarca !== 'todos' || 
    filtroModelo !== 'todos' || 
    filtroTipo !== 'todos' || 
    filtroRuta !== 'todos' || 
    filtroAplicacion !== 'todos';

  const limpiarFiltrosVehiculos = () => {
    setFiltroTexto('');
    setFiltroMarca('todos');
    setFiltroModelo('todos');
    setFiltroTipo('todos');
    setFiltroRuta('todos');
    setFiltroAplicacion('todos');
  };

  // 6. Filtrado para el panel de Cargas
  const cargasFiltradasTab = React.useMemo(() => {
    return cargasFiltradasPorFecha.filter(c => {
      if (filtroCargasVehiculo !== 'todos' && c.vehiculo_id !== filtroCargasVehiculo) {
        return false;
      }
      if (busquedaCargas.trim()) {
        const q = busquedaCargas.toLowerCase().trim();
        const matchVeh = c.vehiculoName?.toLowerCase().includes(q) || c.patente?.toLowerCase().includes(q);
        const matchCond = c.conductor?.toLowerCase().includes(q);
        const matchRuta = c.ruta?.toLowerCase().includes(q);
        if (!matchVeh && !matchCond && !matchRuta) return false;
      }
      return true;
    });
  }, [cargasFiltradasPorFecha, filtroCargasVehiculo, busquedaCargas]);

  const totalLitrosCargasTab = React.useMemo(() => {
    return cargasFiltradasTab.reduce((acc, c) => acc + (parseFloat(c.litros) || 0), 0);
  }, [cargasFiltradasTab]);

  const totalCostoCargasTab = React.useMemo(() => {
    return cargasFiltradasTab.reduce((acc, c) => acc + (parseFloat(c.costo_total) || 0), 0);
  }, [cargasFiltradasTab]);

  const totalKmCargasTab = React.useMemo(() => {
    const vehiculoMap: Record<string, any> = {};
    vehiculos.forEach(v => { vehiculoMap[v.id] = v; });
    return cargasFiltradasTab
      .filter(c => vehiculoMap[c.vehiculo_id]?.detalles?.tipo_medicion !== 'l_h')
      .reduce((acc, c) => acc + (metricasPorCarga.deltaMap[c.id] || 0), 0);
  }, [cargasFiltradasTab, vehiculos, metricasPorCarga]);

  const totalHorasCargasTab = React.useMemo(() => {
    const vehiculoMap: Record<string, any> = {};
    vehiculos.forEach(v => { vehiculoMap[v.id] = v; });
    return cargasFiltradasTab
      .filter(c => vehiculoMap[c.vehiculo_id]?.detalles?.tipo_medicion === 'l_h')
      .reduce((acc, c) => acc + (metricasPorCarga.deltaMap[c.id] || 0), 0);
  }, [cargasFiltradasTab, vehiculos, metricasPorCarga]);

  // 7. Gráfico histórico agrupado por fecha (discriminando estrictamente km/L y L/h)
  const chartData = React.useMemo(() => {
     const sortedFiltradas = [...cargasDashboard].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
     const grouped: Record<string, {
       costo: number;
       litros: number;
       rendimientosKmL: number[];
       consumosLh: number[];
       vehiculosKmLIds: Set<string>;
       vehiculosLhIds: Set<string>;
     }> = {};

     const vehiculoMap: Record<string, any> = {};
     vehiculos.forEach(v => { vehiculoMap[v.id] = v; });

     sortedFiltradas.forEach(c => {
        const d = c.fecha ? c.fecha.substring(0, 10) : (c.fechaFormateada || '');
        const parts = d.split('-');
        const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.substring(0, 5);

        if (!grouped[shortDate]) {
          grouped[shortDate] = { 
            costo: 0, 
            litros: 0, 
            rendimientosKmL: [], 
            consumosLh: [],
            vehiculosKmLIds: new Set<string>(),
            vehiculosLhIds: new Set<string>()
          };
        }
        grouped[shortDate].costo += parseFloat(c.costo_total) || 0;
        grouped[shortDate].litros += parseFloat(c.litros) || 0;
        
        const v = vehiculoMap[c.vehiculo_id];
        const tipoMed = v?.detalles?.tipo_medicion || 'km_l';
        
        if (tipoMed === 'l_h') {
          grouped[shortDate].vehiculosLhIds.add(c.vehiculo_id);
          const cons = metricasPorCarga.rendMap[c.id];
          if (cons && cons > 0) {
            grouped[shortDate].consumosLh.push(cons);
          } else {
            const consObj = parseFloat(v?.detalles?.rendimiento_objetivo || '15.0');
            if (consObj > 0) grouped[shortDate].consumosLh.push(consObj);
          }
        } else {
          grouped[shortDate].vehiculosKmLIds.add(c.vehiculo_id);
          const rend = metricasPorCarga.rendMap[c.id];
          if (rend && rend > 0) {
             grouped[shortDate].rendimientosKmL.push(rend);
          } else {
             // Si no tiene delta histórico (primera carga base del vehículo), usar su meta operacional
             const rendObj = parseFloat(v?.detalles?.rendimiento_objetivo || '3.0');
             if (rendObj > 0) grouped[shortDate].rendimientosKmL.push(rendObj);
          }
        }
     });

     return Object.keys(grouped).map(d => {
        const g = grouped[d];
        const rends = g.rendimientosKmL;
        const cons = g.consumosLh;
        
        const avgRendKmL = rends.length > 0 
          ? Number((rends.reduce((a, b) => a + b, 0) / rends.length).toFixed(1))
          : null;

        const avgConsumoLh = cons.length > 0
          ? Number((cons.reduce((a, b) => a + b, 0) / cons.length).toFixed(1))
          : null;

        const allVehIds = new Set([...g.vehiculosKmLIds, ...g.vehiculosLhIds]);

        return {
          date: d,
          costo: g.costo,
          litros: Math.round(g.litros),
          rendimientoKmL: avgRendKmL,
          consumoLh: avgConsumoLh,
          rendimiento: avgRendKmL,
          vehiculosKmLCount: g.vehiculosKmLIds.size,
          vehiculosLhCount: g.vehiculosLhIds.size,
          totalVehiculos: allVehIds.size,
        };
     });
  }, [cargasDashboard, metricasPorCarga, vehiculos]);

  const hasMaquinariaEnGrafico = React.useMemo(() => {
    return chartData.some(d => d.consumoLh !== null);
  }, [chartData]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Droplet className="w-6 h-6 text-blue-500" /> 
            Control de Combustible
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Inteligencia operativa y eficiencia energética de la flota.
          </p>
        </div>
      </div>

      {!selectedVehicle && (
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border dark:border-slate-800 justify-between overflow-x-auto">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <Calendar className="w-4 h-4 text-blue-500" /> Rango Fecha:
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Desde:</span>
              <input 
                 type="date" 
                 value={fechaDesde}
                 onChange={e => setFechaDesde(e.target.value)}
                 className="p-1.5 px-2.5 border rounded-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-sm shadow-sm"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Hasta:</span>
              <input 
                 type="date" 
                 value={fechaHasta}
                 onChange={e => setFechaHasta(e.target.value)}
                 className="p-1.5 px-2.5 border rounded-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-sm shadow-sm"
              />
            </div>
            {(fechaDesde || fechaHasta) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1 h-8 px-2"
                title="Limpiar filtro de fechas"
              >
                <X className="w-3.5 h-3.5" /> Limpiar fechas
              </Button>
            )}
          </div>
          
          <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl shadow-inner border border-slate-200/50 dark:border-slate-800/50">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                 "flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all",
                 activeTab === 'dashboard' ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
              )}
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('vehiculos')}
              className={cn(
                 "flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all",
                 activeTab === 'vehiculos' ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
              )}
            >
              <CarFront className="w-4 h-4" /> Rend. Vehículos
            </button>
            <button 
              onClick={() => setActiveTab('cargas')}
              className={cn(
                 "flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all",
                 activeTab === 'cargas' ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
              )}
            >
              <Droplet className="w-4 h-4" /> Cargas
            </button>
          </div>
        </div>
      )}

      {!selectedVehicle && activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Barra de Filtros del Dashboard: Marca y Modelo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 px-4 rounded-xl shadow-sm border dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Filter className="w-3.5 h-3.5 text-blue-500" /> Segmentar Dashboard:
              </div>
              <div className="w-48">
                <select
                  value={dashMarca}
                  onChange={e => { setDashMarca(e.target.value); setDashModelo('todos'); }}
                  className="w-full py-1.5 px-3 border rounded-lg text-xs bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todas las Marcas</option>
                  {opcionesDashMarcas.map(m => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>
              <div className="w-48">
                <select
                  value={dashModelo}
                  onChange={e => setDashModelo(e.target.value)}
                  className="w-full py-1.5 px-3 border rounded-lg text-xs bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los Modelos</option>
                  {opcionesDashModelos.map(m => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>
              {(dashMarca !== 'todos' || dashModelo !== 'todos') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDashMarca('todos'); setDashModelo('todos'); }}
                  className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-7 px-2 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restablecer
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>
                {Boolean(fechaDesde || fechaHasta) ? (
                  <>Mostrando <strong className="text-slate-800 dark:text-slate-200">{kpis.vehiculosEvaluados}</strong> unidades con cargas ({vehiculosDashboard.length} en segmento)</>
                ) : (
                  <>Mostrando <strong className="text-slate-800 dark:text-slate-200">{vehiculosDashboard.length}</strong> de {vehiculos.length} unidades</>
                )}
              </span>
              {(dashMarca !== 'todos' || dashModelo !== 'todos') && (
                <Badge variant="outline" className="text-blue-600 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 text-xs">Segmentado</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card 
                className={cn("bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-md cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'costo' && "ring-2 ring-blue-300")}
                onClick={() => setSelectedKpi('costo')}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-blue-100 text-sm font-medium">Costo Total ({fechaDesde || fechaHasta ? 'Periodo' : '30d'})</p>
                      <h3 className="text-3xl font-black">${kpis.costoTotal30d.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-white/20 rounded-lg"><DollarSign className="w-5 h-5 text-white" /></div>
                  </div>
                  {kpis.totalHoras > 0 && kpis.totalKm > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs text-blue-100 font-medium">
                      <span>Ruta: ${kpis.costoTotalKmL.toLocaleString()}</span>
                      <span>Faena: ${kpis.costoTotalLh.toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card 
                className={cn("bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'rendimiento' && "ring-2 ring-emerald-500")}
                onClick={() => setSelectedKpi('rendimiento')}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 flex-1">
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        {kpis.consumoPromedioLh && kpis.vehiculosKmLCount > 0 ? 'Eficiencia Flota' : kpis.consumoPromedioLh ? 'Consumo Promedio' : 'Rend. Promedio'}
                      </p>
                      {kpis.consumoPromedioLh && kpis.vehiculosKmLCount > 0 ? (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-baseline justify-between pr-2">
                            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{kpis.rendimientoPromedio}</span>
                            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-900/60">km/L Ruta</span>
                          </div>
                          <div className="flex items-baseline justify-between pr-2">
                            <span className="text-2xl font-black text-amber-700 dark:text-amber-400">{kpis.consumoPromedioLh}</span>
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/60">L/h Faena</span>
                          </div>
                        </div>
                      ) : kpis.consumoPromedioLh ? (
                        <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400">{kpis.consumoPromedioLh} <span className="text-base font-medium text-slate-400">L/h</span></h3>
                      ) : (
                        <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{kpis.rendimientoPromedio} <span className="text-base font-medium text-slate-400">km/L</span></h3>
                      )}
                    </div>
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg shrink-0 ml-2"><TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={cn("bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'costokm' && "ring-2 ring-blue-500")}
                onClick={() => setSelectedKpi('costokm')}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 flex-1">
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        {kpis.totalHoras > 0 && kpis.totalKm > 0 ? 'Costo Unitario Flota' : kpis.totalHoras > 0 ? 'Costo por Hora' : 'Costo/km Flota'}
                      </p>
                      {kpis.totalHoras > 0 && kpis.totalKm > 0 ? (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-baseline justify-between pr-2">
                            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">${kpis.costoKmRuta.toLocaleString()}</span>
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border dark:border-slate-700">/ km Ruta</span>
                          </div>
                          <div className="flex items-baseline justify-between pr-2">
                            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">${kpis.costoHoraMaq.toLocaleString()}</span>
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border dark:border-slate-700">/ hr Faena</span>
                          </div>
                        </div>
                      ) : kpis.totalHoras > 0 ? (
                        <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">${kpis.costoHoraMaq} <span className="text-base font-medium text-slate-400">/ hr</span></h3>
                      ) : (
                        <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">${kpis.costoKmRuta} <span className="text-base font-medium text-slate-400">/ km</span></h3>
                      )}
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0 ml-2"><Banknote className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={cn("bg-white dark:bg-slate-900 shadow-sm border-red-200 dark:border-red-900/50 cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'alertas' && "ring-2 ring-red-500")}
                onClick={() => setSelectedKpi('alertas')}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Desviaciones Críticas</p>
                      <h3 className="text-3xl font-black text-red-600 dark:text-red-500">{vehiculosCriticos}</h3>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" /></div>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-4">
                    {kpis.criticosLh > 0 && kpis.criticosKmL > 0 ? (
                      `${kpis.criticosKmL} en ruta • ${kpis.criticosLh} en faena`
                    ) : (
                      'Vehículos muy por debajo del objetivo'
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>

          {/* Gráfica de evolución a ancho completo */}
          <Card className="shadow-sm border dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 pb-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Evolución Consumo vs Costo
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Comparativa temporal de gasto ($), rendimiento ruta (km/L){hasMaquinariaEnGrafico ? ' y consumo faena (L/h)' : ''} en la flota
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full mt-4">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value / 1000}k`} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} type="number" domain={[0, 'auto']} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <RechartsTooltip content={<CustomChartTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar yAxisId="left" dataKey="costo" name="Costo ($)" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={40} />
                      <Line yAxisId="right" type="monotone" dataKey="rendimientoKmL" name="Rendimiento Ruta (km/L)" stroke="#3b82f6" strokeWidth={3} connectNulls={false} dot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                      {hasMaquinariaEnGrafico && (
                        <Line yAxisId="right" type="monotone" dataKey="consumoLh" name="Consumo Faena (L/h)" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="4 4" connectNulls={false} dot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                     <BarChart3 className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                     <p className="text-slate-500 font-medium">No hay suficientes datos registrados en el periodo seleccionado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Alertas de Eficiencia trasladada DEBAJO de la gráfica */}
          <Card className="shadow-sm border border-amber-200/80 dark:border-amber-900/50 overflow-hidden">
            <CardHeader className="bg-amber-50/40 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/40 py-3.5 px-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    Alertas de Eficiencia Energética
                    <Badge variant="outline" className="text-amber-700 bg-amber-100/60 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-semibold text-xs">
                      {alertasDashboard.length} {alertasDashboard.length === 1 ? 'unidad observada' : 'unidades observadas'}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Vehículos con desviación respecto a su meta operacional ({vehiculosCriticos} críticas, {alertasRegularesCount} regulares)
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveTab('vehiculos')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold"
              >
                Ver toda la flota →
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {alertasDashboard.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Vehículo</th>
                        <th className="px-6 py-3 font-semibold">Modelo</th>
                        <th className="px-6 py-3 font-semibold">Tipo / Aplicación</th>
                        <th className="px-6 py-3 font-semibold">Ruta</th>
                        <th className="px-6 py-3 font-semibold text-center">Meta</th>
                        <th className="px-6 py-3 font-semibold text-center">Real</th>
                        <th className="px-6 py-3 font-semibold text-center">Desviación</th>
                        <th className="px-6 py-3 font-semibold text-center">Costo / Unidad</th>
                        <th className="px-6 py-3 font-semibold text-center">Semáforo</th>
                        <th className="px-6 py-3 font-semibold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {alertasDashboard.map(v => (
                        <tr key={v.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="font-bold text-slate-900 dark:text-zinc-100">{v.numeroInterno}</div>
                            <div className="text-xs text-slate-500 font-mono">{v.patente}</div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{v.marca}</div>
                            <div className="text-xs text-slate-500">{v.modelo}</div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              {v.tipo}
                              <Badge variant="outline" className="text-[10px] px-1 py-0 font-bold border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                {v.unidadMedida}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-500">{v.aplicacion}</div>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border dark:border-slate-700">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {v.ruta}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center font-medium text-slate-600 dark:text-slate-400">
                            {v.rendimientoObjetivo.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">{v.unidadMedida}</span>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={cn(
                              "font-bold px-2 py-0.5 rounded text-xs",
                              v.estado === 'Crítico' ? "text-red-700 bg-red-100/80 dark:bg-red-900/40" : "text-amber-700 bg-amber-100/80 dark:bg-amber-900/40"
                            )}>
                              {v.rendimientoHistorico.toFixed(1)} {v.unidadMedida}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={cn(
                              "font-bold text-xs",
                              v.estado === 'Crítico' ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                            )}>
                              {v.desviacionPct > 0 ? `+${v.desviacionPct}%` : `${v.desviacionPct}%`}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                            ${v.costoKm30d} <span className="text-[10px] text-slate-400 font-normal">{v.unidadCosto}</span>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className={cn(
                                "w-2.5 h-2.5 rounded-full shadow-inner",
                                v.estado === 'Crítico' ? "bg-red-500 animate-pulse" : "bg-amber-500"
                              )} />
                              <span className={cn(
                                "text-xs font-semibold",
                                v.estado === 'Crítico' ? "text-red-600" : "text-amber-600"
                              )}>
                                {v.estado}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-semibold" 
                                onClick={() => setSelectedVehicle(v)}
                              >
                                Ver Detalle
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                onClick={() => handleOpenAjustarMetas(v)}
                                title="Ajustar Meta / Tipo"
                              >
                                <Target className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-slate-500 font-medium py-10 bg-slate-50/50 dark:bg-slate-900/50">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sin alertas de consumo registradas en el periodo seleccionado</p>
                  <p className="text-xs text-slate-400 mt-1">Todas las unidades se encuentran operando dentro de su rendimiento objetivo.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sidebar KPI Details Layer */}
      {selectedKpi && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedKpi(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white dark:bg-slate-900 shadow-2xl border-l dark:border-slate-800 z-50 flex flex-col overflow-y-auto animate-in slide-in-from-right">
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
              <div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Detalle de Gestión</h3>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                  Métricas de Combustible
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedKpi(null)} className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 flex-1 space-y-6">
              {/* Info box similar to screenshot */}
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex gap-3 text-sm">
                 <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                 <div>
                    <strong className="block mb-1">FÓRMULA Y MÉTRICA:</strong>
                    {selectedKpi === 'costo' && "Costo Total = ∑ (Litros consumidos × Precio del litro vigente en cada carga)"}
                    {selectedKpi === 'rendimiento' && "Rendimiento Flota: Promedio de km/L en unidades de ruta y consumo en L/h en faena/maquinaria (calculados estrictamente por separado)."}
                    {selectedKpi === 'costokm' && "Costo Unitario: Costo/km en ruta = Gasto Ruta / km totales • Costo/hr en faena = Gasto Faena / horas totales."}
                    {selectedKpi === 'alertas' && "Desviaciones Críticas = Conteo de unidades cuyo rendimiento o consumo se desvía más del 15% de su meta individual."}
                  </div>
              </div>

              {/* Data content layer */}
              <div className="space-y-4 pt-4">
                <h4 className="font-bold text-sm uppercase text-slate-500 tracking-wider">Desglose de Datos</h4>
                
                {selectedKpi === 'costo' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Total Litros Flota</span>
                      <span className="font-bold text-slate-900 dark:text-white">{(kpis.totalLitros || 0).toLocaleString()} L</span>
                    </div>
                    {kpis.litrosLh > 0 && (
                      <div className="space-y-1.5 px-3 py-2 bg-slate-100/70 dark:bg-slate-800/30 rounded-lg text-xs">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>Litros Consumidos en Ruta:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{kpis.litrosKmL.toLocaleString()} L</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>Litros Consumidos en Faena:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{kpis.litrosLh.toLocaleString()} L</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Precio Promedio (PMP)</span>
                      <span className="font-bold text-slate-900 dark:text-white">${kpis.totalLitros > 0 ? Math.round(kpis.costoTotal30d / kpis.totalLitros).toLocaleString() : 0} / L</span>
                    </div>
                    {kpis.totalHoras > 0 && (
                      <div className="space-y-1.5 px-3 py-2 bg-slate-100/70 dark:bg-slate-800/30 rounded-lg text-xs">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>Gasto Operativo Ruta:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">${kpis.costoTotalKmL.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>Gasto Operativo Faena:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">${kpis.costoTotalLh.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-4 bg-blue-600 text-white rounded-lg shadow-inner">
                      <span className="font-medium">Total Estimado</span>
                      <span className="font-black text-xl">${kpis.costoTotal30d.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {selectedKpi === 'rendimiento' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Total Unidades Evaluadas</span>
                      <span className="font-bold text-slate-900 dark:text-white">{kpis.vehiculosEvaluados} Vehículos</span>
                    </div>

                    {/* Sección Ruta (km/L) */}
                    <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/40 space-y-2.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        <Gauge className="w-4 h-4 text-blue-600" /> Rendimiento en Ruta (Km / Litro)
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                        <span>Vehículos en Ruta Evaluados:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{kpis.vehiculosKmLCount} unidades</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                        <span>Distancia Producida:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{(kpis.totalKm || 0).toLocaleString()} km</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                        <span>Combustible Consumido:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{(kpis.litrosKmL || 0).toLocaleString()} L</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-blue-600 text-white rounded-lg shadow-sm">
                        <span className="font-medium text-xs">Promedio Flota Ruta:</span>
                        <span className="font-black text-lg">{kpis.rendimientoPromedio} km/L</span>
                      </div>
                    </div>

                    {/* Sección Maquinaria (L/h) si existe */}
                    {kpis.vehiculosLhCount > 0 && (
                      <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 space-y-2.5">
                        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
                          <Clock className="w-4 h-4 text-amber-600" /> Consumo en Faena (Litros / Hora)
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                          <span>Maquinarias Evaluadas:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{kpis.vehiculosLhCount} unidades</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                          <span>Horas Operacionales:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{(kpis.totalHoras || 0).toLocaleString()} hrs</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                          <span>Combustible Consumido:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{(kpis.litrosLh || 0).toLocaleString()} L</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-amber-600 text-white rounded-lg shadow-sm">
                          <span className="font-medium text-xs">Consumo Promedio Faena:</span>
                          <span className="font-black text-lg">{kpis.consumoPromedioLh} L/h</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {selectedKpi === 'costokm' && (
                  <div className="space-y-4">
                    {/* Costo por KM Ruta */}
                    <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/40 space-y-2.5">
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        <Gauge className="w-4 h-4 text-blue-600" /> Costo Unitario de Ruta
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                        <span>Gasto Combustible Ruta:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">${(kpis.costoTotalKmL || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                        <span>Kilómetros Producidos:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{(kpis.totalKm || 0).toLocaleString()} km</span>
                      </div>
                      <div className="flex justify-between items-center p-2.5 bg-slate-900 text-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <span className="font-medium text-xs">Costo por KM:</span>
                        <span className="font-black text-lg">${kpis.costoKmRuta.toLocaleString()} / km</span>
                      </div>
                    </div>

                    {/* Costo por Hora Faena si existe */}
                    {kpis.totalHoras > 0 && (
                      <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 space-y-2.5">
                        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
                          <Clock className="w-4 h-4 text-amber-600" /> Costo Unitario de Faena
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                          <span>Gasto Combustible Faena:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">${(kpis.costoTotalLh || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                          <span>Horas Operacionales:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{(kpis.totalHoras || 0).toLocaleString()} hrs</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 bg-amber-700 text-white rounded-lg shadow-sm">
                          <span className="font-medium text-xs">Costo por Hora:</span>
                          <span className="font-black text-lg">${kpis.costoHoraMaq.toLocaleString()} / hr</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {selectedKpi === 'alertas' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Flota Evaluada</span>
                      <span className="font-bold text-slate-900 dark:text-white">{tablaFlotaDashboard.length} Vehículos</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400 text-emerald-600">Dentro de Meta</span>
                      <span className="font-bold text-slate-900 dark:text-white">{tablaFlotaDashboard.filter(v => v.estado === 'Óptimo').length} Vehículos</span>
                    </div>
                    <div className="space-y-2 mt-4 border-t dark:border-slate-800 pt-4">
                      <p className="text-sm font-semibold text-red-600 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" /> Vehículos Críticos ({vehiculosCriticos})
                      </p>
                      {tablaFlotaDashboard.filter(v => v.estado === 'Crítico').map(v => (
                         <div key={v.id} className="flex justify-between items-center text-sm p-2.5 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 rounded-r">
                           <div>
                             <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                               {v.numeroInterno}
                               <Badge variant="outline" className="text-[10px] px-1 py-0 font-bold border-slate-300 dark:border-slate-700">
                                 {v.unidadMedida}
                               </Badge>
                             </div>
                             <div className="text-xs text-slate-500 font-mono">{v.patente}</div>
                           </div>
                           <div className="text-right">
                             <div className="text-red-600 font-bold">{v.rendimientoHistorico} {v.unidadMedida}</div>
                             <div className="text-[11px] text-slate-400">Meta: {v.rendimientoObjetivo} {v.unidadMedida}</div>
                           </div>
                         </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedVehicle && activeTab === 'vehiculos' && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b dark:border-slate-800 pb-4 gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CarFront className="w-5 h-5 text-blue-500" /> Rendimiento por Vehículo
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">Comparativa operacional real vs metas teóricas por unidad</p>
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto">
              <Button onClick={() => handleOpenAjustarMetas()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                <Target className="w-4 h-4 mr-2" /> Ajustar Metas
              </Button>
            </div>
          </CardHeader>

          {/* Barra de Filtros Multidimensionales: Máquina, Marca, Modelo, Tipo, Ruta, Aplicación */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/40 border-b dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Filtro 1: N° Máquina o Patente */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="N° Máquina / Patente..."
                  value={filtroTexto}
                  onChange={e => setFiltroTexto(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Filtro 2: Marca */}
              <div>
                <select
                  value={filtroMarca}
                  onChange={e => {
                    setFiltroMarca(e.target.value);
                    setFiltroModelo('todos');
                  }}
                  className="w-full py-2 px-3 border rounded-lg text-xs bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todas las Marcas</option>
                  {opcionesMarcas.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Filtro 3: Modelo */}
              <div>
                <select
                  value={filtroModelo}
                  onChange={e => setFiltroModelo(e.target.value)}
                  className="w-full py-2 px-3 border rounded-lg text-xs bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los Modelos</option>
                  {opcionesModelos.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Filtro 4: Tipo de Vehículo */}
              <div>
                <select
                  value={filtroTipo}
                  onChange={e => setFiltroTipo(e.target.value)}
                  className="w-full py-2 px-3 border rounded-lg text-xs bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los Tipos</option>
                  {opcionesTipos.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Filtro 5: Ruta */}
              <div>
                <select
                  value={filtroRuta}
                  onChange={e => setFiltroRuta(e.target.value)}
                  className="w-full py-2 px-3 border rounded-lg text-xs bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todas las Rutas</option>
                  {opcionesRutas.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Filtro 6: Aplicación */}
              <div>
                <select
                  value={filtroAplicacion}
                  onChange={e => setFiltroAplicacion(e.target.value)}
                  className="w-full py-2 px-3 border rounded-lg text-xs bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todas las Aplicaciones</option>
                  {opcionesAplicaciones.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  {Boolean(fechaDesde || fechaHasta) ? (
                    <>Mostrando <strong className="text-slate-800 dark:text-slate-200">{filteredFlota.length}</strong> unidades con cargas en el periodo (de {tablaFlota.length} en flota)</>
                  ) : (
                    <>Mostrando <strong className="text-slate-800 dark:text-slate-200">{filteredFlota.length}</strong> de {tablaFlota.length} unidades</>
                  )}
                </span>
                {hayFiltrosActivosVehiculos && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    Filtros activos
                  </Badge>
                )}
              </div>

              {hayFiltrosActivosVehiculos && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={limpiarFiltrosVehiculos}
                  className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-7 px-2 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restablecer filtros
                </Button>
              )}
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Vehículo</th>
                    <th className="px-6 py-4 font-semibold">Modelo</th>
                    <th className="px-6 py-4 font-semibold">Tipo de Vehículo</th>
                    <th className="px-6 py-4 font-semibold">Ruta / Aplicación</th>
                    <th className="px-6 py-4 font-semibold text-center">Meta</th>
                    <th className="px-6 py-4 font-semibold text-center">Real</th>
                    <th className="px-6 py-4 font-semibold text-center">Desviación</th>
                    <th className="px-6 py-4 font-semibold text-center">Costo / Unidad</th>
                    <th className="px-6 py-4 font-semibold text-center">Semáforo</th>
                    <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredFlota.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-zinc-100">{v.numeroInterno}</div>
                        <div className="text-xs text-slate-500 font-mono">{v.patente}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{v.marca}</div>
                        <div className="text-xs text-slate-500">{v.modelo}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border dark:border-slate-700">
                            {v.tipo}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1 py-0 font-bold border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            {v.unidadMedida}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {v.ruta}
                        </div>
                        <div className="text-xs text-slate-500">{v.aplicacion}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-600 dark:text-slate-400">
                        {v.rendimientoObjetivo.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">{v.unidadMedida}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "font-bold px-2 py-1 rounded text-xs",
                          v.estado === 'Óptimo' ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30" : 
                          v.estado === 'Regular' ? "text-amber-700 bg-amber-50 dark:bg-amber-900/30" : 
                          v.estado === 'Sin Datos' ? "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400" :
                          "text-red-700 bg-red-50 dark:bg-red-900/30"
                        )}>
                          {v.estado === 'Sin Datos' ? '-' : `${v.rendimientoHistorico.toFixed(1)} ${v.unidadMedida}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {v.estado === 'Sin Datos' ? (
                          <span className="text-slate-400 text-xs">-</span>
                        ) : (
                          <span className={cn(
                            "font-bold text-xs",
                            v.estado === 'Óptimo' ? "text-emerald-600 dark:text-emerald-400" :
                            v.estado === 'Regular' ? "text-amber-600 dark:text-amber-400" :
                            "text-red-600 dark:text-red-400"
                          )}>
                            {v.desviacionPct > 0 ? `+${v.desviacionPct}%` : `${v.desviacionPct}%`}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        ${v.costoKm30d} <span className="text-[10px] text-slate-400 font-normal">{v.unidadCosto}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <div className="flex items-center justify-center gap-1.5">
                            <div className={cn(
                                "w-2.5 h-2.5 rounded-full shadow-inner",
                                v.estado === 'Óptimo' ? "bg-emerald-500" : 
                                v.estado === 'Regular' ? "bg-amber-500" : 
                                v.estado === 'Sin Datos' ? "bg-slate-300 dark:bg-slate-600" :
                                "bg-red-500 animate-pulse"
                            )}></div>
                            <span className="text-xs text-slate-600 dark:text-slate-400">{v.estado}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <div className="flex items-center justify-center gap-1">
                           <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-semibold" onClick={() => setSelectedVehicle(v)}>
                             Ver Detalle
                           </Button>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" 
                             onClick={() => handleOpenAjustarMetas(v)}
                             title="Ajustar Meta / Tipo"
                           >
                             <Target className="w-3.5 h-3.5" />
                           </Button>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {filteredFlota.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                        No se encontraron vehículos que coincidan con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedVehicle && activeTab === 'cargas' && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b dark:border-slate-800 pb-4 gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-blue-500" /> Historial de Cargas
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">Registro de combustible, kilómetros y costeo automático por carga</p>
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto">
              <Button onClick={() => setIsRegistrarCargaOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                <Plus className="w-4 h-4 mr-2" /> Registrar Carga
              </Button>
            </div>
          </CardHeader>

          {/* Barra de Filtro de Cargas por Máquina y Búsqueda */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-900/40 border-b dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Filtro por Máquina */}
              <div className="sm:w-72">
                <select
                  value={filtroCargasVehiculo}
                  onChange={e => setFiltroCargasVehiculo(e.target.value)}
                  className="w-full py-2 px-3 border rounded-lg text-xs bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todas las Máquinas (Flota Completa)</option>
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.detalles?.numero_interno || v.patente} - {v.patente} ({v.marca} {v.modelo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Búsqueda rápida por Conductor / Ruta */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar conductor, ruta, patente..."
                  value={busquedaCargas}
                  onChange={e => setBusquedaCargas(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {(filtroCargasVehiculo !== 'todos' || busquedaCargas.trim() !== '') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFiltroCargasVehiculo('todos'); setBusquedaCargas(''); }}
                  className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 px-2 flex items-center gap-1 self-end sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Quitar filtros
                </Button>
              )}
            </div>

            {/* Resumen dinámico del filtro de cargas */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <span className="text-slate-500 font-medium">
                Mostrando <strong className="text-slate-800 dark:text-slate-200">{cargasFiltradasTab.length}</strong> cargas
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                Total: {totalLitrosCargasTab.toLocaleString()} Litros
              </span>
              {totalKmCargasTab > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border dark:border-slate-700">
                    Distancia: {totalKmCargasTab.toLocaleString()} km
                  </span>
                </>
              )}
              {totalHorasCargasTab > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                    Operación: {totalHorasCargasTab.toLocaleString()} hrs
                  </span>
                </>
              )}
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border dark:border-slate-700">
                Gasto Total: ${totalCostoCargasTab.toLocaleString()}
              </span>
            </div>
          </div>

          <CardContent className="p-0">
             <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Fecha</th>
                    <th className="px-6 py-4 font-semibold">Vehículo</th>
                    <th className="px-6 py-4 font-semibold">Conductor</th>
                    <th className="px-6 py-4 font-semibold">Ruta</th>
                    <th className="px-6 py-4 font-semibold text-right">Lectura (km / hrs)</th>
                    <th className="px-6 py-4 font-semibold text-right">Litros</th>
                    <th className="px-6 py-4 font-semibold text-right">Costo Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {cargasFiltradasTab.map(carga => (
                    <tr key={carga.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-slate-600 dark:text-slate-300">
                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                            {carga.fechaFormateada}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-zinc-100">{carga.vehiculoName}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                         <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-slate-400" />
                            {carga.conductor || 'No asignado'}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                         <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                            {carga.ruta || 'S/N'}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {(carga.odometro || 0).toLocaleString()} {vehiculos.find(v => v.id === carga.vehiculo_id)?.detalles?.tipo_medicion === 'l_h' ? 'hrs' : 'km'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-blue-600 dark:text-blue-400">{carga.litros} L</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200">${(carga.costo_total || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {cargasFiltradasTab.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No hay cargas de combustible registradas para los filtros y fechas seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedVehicle && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Button variant="ghost" onClick={() => setSelectedVehicle(null)} className="mb-2 -ml-2 text-slate-500">
            ← Volver a la lista
          </Button>

          <Card className="shadow-sm border-t-4 border-t-blue-500">
            <CardHeader className="border-b dark:border-slate-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                 <CardTitle className="text-2xl flex items-center gap-2">
                   {selectedVehicle.numeroInterno} 
                   <Badge variant={selectedVehicle.estado === 'Crítico' ? 'destructive' : 'default'} className={selectedVehicle.estado === 'Regular' ? 'bg-amber-500 hover:bg-amber-600' : ''}>
                     {selectedVehicle.estado}
                   </Badge>
                   <Badge variant="outline" className="text-xs font-mono font-bold border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300">
                     {selectedVehicle.unidadMedida}
                   </Badge>
                 </CardTitle>
                 <p className="text-slate-500 mt-1">{selectedVehicle.marca} {selectedVehicle.modelo} • Patente: {selectedVehicle.patente} • {selectedVehicle.tipo}</p>
              </div>
              <div className="flex items-center gap-3">
                 <Button 
                   size="sm" 
                   variant="outline" 
                   onClick={() => handleOpenAjustarMetas(selectedVehicle)} 
                   className="text-xs flex items-center gap-1.5 h-9 font-semibold border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                 >
                   <Target className="w-3.5 h-3.5 text-emerald-600" /> Ajustar Meta / Tipo
                 </Button>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border dark:border-slate-700 text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Periodo Evaluado</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {fechaDesde && fechaHasta ? `${fechaDesde} a ${fechaHasta}` : (fechaDesde ? `Desde ${fechaDesde}` : (fechaHasta ? `Hasta ${fechaHasta}` : 'Histórico Total Flota'))}
                    </p>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700 shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-2 h-full bg-blue-500"></div>
                  <p className="text-sm text-slate-500 mb-1">
                    {selectedVehicle.tipoMedicion === 'l_h' ? 'Consumo Horario Actual' : 'Rendimiento Actual'}
                  </p>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-100">
                    {selectedVehicle.rendimientoHistorico} <span className="text-base text-slate-400 font-medium">{selectedVehicle.unidadMedida}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-2 flex items-center">
                    {selectedVehicle.tipoMedicion === 'l_h' ? 'Meta Máxima:' : 'Meta Operacional:'}{' '}
                    <strong className="ml-1 text-slate-700 dark:text-slate-300">
                      {selectedVehicle.rendimientoObjetivo} {selectedVehicle.unidadMedida}
                    </strong>
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700 shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-2 h-full bg-emerald-500"></div>
                  <p className="text-sm text-slate-500 mb-1">
                    {selectedVehicle.tipoMedicion === 'l_h' ? 'Costo por Hora' : 'Costo por KM'}
                  </p>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-100">
                    ${selectedVehicle.costoKm30d} <span className="text-base text-slate-400 font-medium">{selectedVehicle.unidadCosto}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {selectedVehicle.tipoMedicion === 'l_h' ? 'Costo operacional por hora' : `Promedio flota: $${kpis.costoKmPromedio}/km`}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700 shadow-sm relative overflow-hidden">
                   <div className="absolute right-0 top-0 w-2 h-full bg-purple-500"></div>
                   <p className="text-sm text-slate-500 mb-1 flex items-center gap-1">
                     {selectedVehicle.tipoMedicion === 'l_h' ? (
                       <><Clock className="w-3.5 h-3.5 text-blue-500"/> Horómetro de Operación</>
                     ) : (
                       <><MapPin className="w-3.5 h-3.5 text-blue-500"/> Distancia Recorrida</>
                     )}
                   </p>
                   <p className="text-3xl font-black text-slate-800 dark:text-slate-100">
                     {(selectedVehicle.vTotalKm || 0).toLocaleString()} <span className="text-base text-slate-400 font-medium">{selectedVehicle.unidadDelta}</span>
                   </p>
                   <p className="text-xs text-slate-500 mt-2">
                     En {selectedVehicle.totalCargas || 0} cargas ({selectedVehicle.vTotalLitros?.toLocaleString()} L consumidos)
                   </p>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2 flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5 text-slate-400" /> Insights y Diagnóstico
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                 <div className="p-5 border border-dashed dark:border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center">
                   <User className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2"/>
                   <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Comportamiento Conducción</h4>
                   <p className="text-slate-500 text-xs mt-2">No hay suficientes datos de telemetría y rendimiento para generar insights sobre los conductores asociados a este vehículo.</p>
                 </div>
                 <div className="p-5 border border-dashed dark:border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center">
                   <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2"/>
                   <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Análisis de Ruta</h4>
                   <p className="text-slate-500 text-xs mt-2">Se requieren registros de consumo consistentes vinculados a rutas específicas para identificar desviaciones y generar recomendaciones operativas.</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Modals */}
      <Modal isOpen={isAjustarMetasOpen} onClose={() => setIsAjustarMetasOpen(false)} title="Configurar Meta y Modo de Eficiencia">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define la unidad de cálculo y meta operacional para la unidad seleccionada. Esto ajustará los cálculos en los paneles de control, reportes y alertas.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Vehículo / Unidad</label>
            <select 
               value={formMeta.vehiculo_id || ''}
               onChange={(e) => {
                 const vId = e.target.value;
                 const v = vehiculos.find(item => item.id === vId);
                 const tMed = (v?.detalles?.tipo_medicion as 'km_l' | 'l_h') || 'km_l';
                 const obj = v?.detalles?.rendimiento_objetivo !== undefined 
                   ? String(v.detalles.rendimiento_objetivo) 
                   : (tMed === 'l_h' ? '15.0' : '2.8');
                 setFormMeta({
                   vehiculo_id: vId,
                   tipo_medicion: tMed,
                   rendimiento_objetivo: obj
                 });
               }}
               className="w-full p-2.5 border rounded-lg dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500"
            >
               <option value="" disabled>Seleccione un vehículo</option>
               {vehiculos.map(v => (
                 <option key={v.id} value={v.id}>
                   {v.detalles?.numero_interno || v.patente} - {v.marca} {v.modelo} ({v.patente}) [{v.detalles?.tipo_medicion === 'l_h' ? 'L/h' : 'km/L'}]
                 </option>
               ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Tipo de Medición / Cálculo Operacional
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormMeta({ ...formMeta, tipo_medicion: 'km_l' })}
                className={cn(
                  "p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 relative cursor-pointer",
                  formMeta.tipo_medicion === 'km_l'
                    ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Km / Litro
                  </span>
                  <Badge variant="outline" className={cn("text-xs font-mono font-bold", formMeta.tipo_medicion === 'km_l' ? "border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" : "")}>
                    Km/L
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ruta y Transporte en carretera. Rendimiento por distancia: mayor es mejor.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormMeta({ ...formMeta, tipo_medicion: 'l_h' })}
                className={cn(
                  "p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 relative cursor-pointer",
                  formMeta.tipo_medicion === 'l_h'
                    ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Litros / Hora
                  </span>
                  <Badge variant="outline" className={cn("text-xs font-mono font-bold", formMeta.tipo_medicion === 'l_h' ? "border-blue-500 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : "")}>
                    L/H
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Maquinaria, Faena y Horómetro. Consumo por hora trabajada: menor es mejor.
                </p>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {formMeta.tipo_medicion === 'l_h' ? 'Meta de Consumo Máximo (Litros / Hora)' : 'Meta de Rendimiento Objetivo (Kilómetros / Litro)'}
            </label>
            <div className="relative">
              <input 
                 type="number" 
                 step="0.1" 
                 placeholder={formMeta.tipo_medicion === 'l_h' ? "Ej: 14.5" : "Ej: 2.8"}
                 value={formMeta.rendimiento_objetivo}
                 onChange={(e) => setFormMeta({...formMeta, rendimiento_objetivo: e.target.value})}
                 className="w-full p-2.5 pr-14 border rounded-lg dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500" 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                {formMeta.tipo_medicion === 'l_h' ? 'L/h' : 'km/L'}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formMeta.tipo_medicion === 'l_h' 
                ? 'Límite operacional en faena: el semáforo y las alertas se activarán si el consumo por hora supera esta meta.'
                : 'Objetivo operacional en ruta: el semáforo y las alertas se activarán si el rendimiento cae por debajo de esta meta.'}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-800 mt-4">
            <Button variant="outline" onClick={() => setIsAjustarMetasOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMeta} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">Guardar Configuración</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isRegistrarCargaOpen} onClose={() => setIsRegistrarCargaOpen(false)} title="Registrar Carga de Combustible">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Fecha de Carga</label>
            <input 
              type="date" 
              value={formCarga.fecha}
              onChange={(e) => setFormCarga({...formCarga, fecha: e.target.value})}
              className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Vehículo</label>
            <select 
               value={formCarga.vehiculo_id || ''}
               onChange={(e) => {
                 const v = vehiculos.find(v => v.id === e.target.value);
                 if (v && !isKmManual) {
                   setFormCarga(prev => ({...prev, vehiculo_id: e.target.value, odometro: (v.kilometraje_actual || 0).toString()}));
                 } else {
                   setFormCarga(prev => ({...prev, vehiculo_id: e.target.value}));
                 }
               }}
               className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
            >
               <option value="" disabled>Seleccione vehículo</option>
               {vehiculos.map(v => (
                 <option key={v.id} value={v.id}>{v.detalles?.numero_interno || v.patente} ({v.patente})</option>
               ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Conductor (Opcional)</label>
            <input 
              type="text" placeholder="Ej: Juan Pérez" 
              value={formCarga.conductor}
              onChange={(e) => setFormCarga({...formCarga, conductor: e.target.value})}
              className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" 
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">
                {(() => {
                  const vSel = vehiculos.find(v => v.id === formCarga.vehiculo_id);
                  return vSel?.detalles?.tipo_medicion === 'l_h' ? 'Horas de Trabajo (Horómetro)' : 'Kilometraje Total (Odómetro)';
                })()}
              </label>
              <div className="flex items-center gap-2">
                <input 
                   type="checkbox" 
                   id="manual-km" 
                   checked={isKmManual}
                   onChange={(e) => setIsKmManual(e.target.checked)}
                   className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                />
                <label htmlFor="manual-km" className="text-xs text-slate-500 cursor-pointer">Ingreso Manual</label>
              </div>
            </div>
            <div className="relative">
              <input 
                type="number" 
                placeholder={!isKmManual ? "Obteniendo lectura..." : (vehiculos.find(v => v.id === formCarga.vehiculo_id)?.detalles?.tipo_medicion === 'l_h' ? "Ej: 1450 hrs" : "Ej: 45000 km")} 
                disabled={!isKmManual}
                value={formCarga.odometro}
                onChange={(e) => setFormCarga({...formCarga, odometro: e.target.value})}
                className={cn(
                  "w-full p-2 border rounded-md text-sm transition-colors",
                  !isKmManual ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                )} 
              />
              {!isKmManual && <MapPin className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-pulse" />}
            </div>
            {!isKmManual && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {vehiculos.find(v => v.id === formCarga.vehiculo_id)?.detalles?.tipo_medicion === 'l_h' 
                  ? 'Lectura de horómetro extraída desde telemetría de máquina.' 
                  : 'Lectura de odómetro extraída desde telemetría GPS.'}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Litros Cargados</label>
            <input 
              type="number" step="0.1" placeholder="Ej: 150" 
              value={formCarga.litros}
              onChange={(e) => {
                 const newLitros = e.target.value;
                 const px = preciosActuales[formCarga.tipo_combustible] || 0;
                 const newCost = newLitros ? Math.round(Number(newLitros) * px).toString() : '';
                 setFormCarga({...formCarga, litros: newLitros, costo_total: newCost});
              }}
              className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              Tipo de Combustible
              {preciosActuales[formCarga.tipo_combustible] ? (
                 <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    ${preciosActuales[formCarga.tipo_combustible]}/L
                 </span>
              ) : (
                 <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    Precio no conf.
                 </span>
              )}
            </label>
            <select 
              value={formCarga.tipo_combustible}
              onChange={(e) => {
                 const newType = e.target.value;
                 const px = preciosActuales[newType] || 0;
                 const newCost = formCarga.litros ? Math.round(Number(formCarga.litros) * px).toString() : formCarga.costo_total;
                 setFormCarga({...formCarga, tipo_combustible: newType, costo_total: newCost});
              }}
              className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm bg-white"
            >
               <option>Diésel</option>
               <option>Gasolina 93</option>
               <option>Gasolina 95</option>
               <option>Gasolina 97</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Costo Total ($)</label>
            <input 
              type="number" step="1" placeholder="Ej: 150000" 
              value={formCarga.costo_total}
              onChange={(e) => setFormCarga({...formCarga, costo_total: e.target.value})}
              className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" 
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Ruta Asociada (Opcional)</label>
            <input 
              type="text" placeholder="Ej: Santiago - Valparaíso" 
              value={formCarga.ruta}
              onChange={(e) => setFormCarga({...formCarga, ruta: e.target.value})}
              className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" 
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsRegistrarCargaOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCarga} className="bg-blue-600 hover:bg-blue-700 text-white">Registrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
