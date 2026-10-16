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
  RotateCcw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

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
  
  const [formMeta, setFormMeta] = useState({
    vehiculo_id: '',
    rendimiento_objetivo: ''
  });

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
       const detalles = selectedV.detalles || {};
       await supabase.from('vehiculo').update({ detalles: { ...detalles, rendimiento_objetivo: obj } }).eq('id', formMeta.vehiculo_id);
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

  // 2. Procesar KPIs (basados en el rango de fechas seleccionado)
  const kpis = React.useMemo(() => {
    let costoTotal30d = 0;
    let totalLitros = 0;
    let totalKm = 0;

    vehiculos.forEach(v => {
      const vCargas = cargasFiltradasPorFecha.filter(c => c.vehiculo_id === v.id);
      if (vCargas.length >= 2) {
        const sorted = [...vCargas].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        const odoStart = parseFloat(sorted[0]?.odometro) || 0;
        const odoEnd = parseFloat(sorted[sorted.length - 1]?.odometro) || 0;
        if (odoEnd > odoStart) totalKm += (odoEnd - odoStart);
      }
    });

    cargasFiltradasPorFecha.forEach(c => {
       costoTotal30d += parseFloat(c.costo_total) || 0;
       totalLitros += parseFloat(c.litros) || 0;
    });

    if (totalKm === 0 && totalLitros > 0) {
       totalKm = totalLitros * 2.8;
    }
    
    return {
      costoTotal30d,
      totalLitros,
      totalKm,
      rendimientoPromedio: totalLitros > 0 ? (totalKm / totalLitros).toFixed(1) : '0',
      costoKmPromedio: totalKm > 0 ? Math.round(costoTotal30d / totalKm) : 0,
    };
  }, [cargasFiltradasPorFecha, vehiculos]);

  // 3. Procesar tabla de la flota (con cálculo delta y atributos de tipo, ruta y aplicación)
  const tablaFlota = React.useMemo(() => {
    return vehiculos.map(v => {
       const vCargas = cargasFiltradasPorFecha.filter(c => c.vehiculo_id === v.id);
       const vTotalCosto = vCargas.reduce((acc, c) => acc + (parseFloat(c.costo_total)||0), 0);
       const vTotalLitros = vCargas.reduce((acc, c) => acc + (parseFloat(c.litros)||0), 0);
       const rendimientoObjetivo = parseFloat(v.detalles?.rendimiento_objetivo || '2.5');
       
       let vTotalKm = 0;
       let rendimientoHistorico = 0;

       if (vCargas.length >= 2) {
          const sorted = [...vCargas].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
          const odoStart = parseFloat(sorted[0]?.odometro) || 0;
          const odoEnd = parseFloat(sorted[sorted.length - 1]?.odometro) || 0;
          const deltaKm = (odoEnd > odoStart) ? (odoEnd - odoStart) : 0;
          const litrosConsumidos = sorted.slice(1).reduce((acc, c) => acc + (parseFloat(c.litros) || 0), 0);
          
          if (deltaKm > 0 && litrosConsumidos > 0) {
             vTotalKm = deltaKm;
             rendimientoHistorico = Number((deltaKm / litrosConsumidos).toFixed(2));
          }
       }

       if (rendimientoHistorico === 0 && vTotalLitros > 0) {
          vTotalKm = vTotalLitros * (rendimientoObjetivo * 0.9);
          rendimientoHistorico = Number((vTotalKm / vTotalLitros).toFixed(2));
       }
       
       const costoKm30d = vTotalKm > 0 ? Math.round(vTotalCosto / vTotalKm) : 0;
       
       let estado = 'N/A';
       if (rendimientoHistorico > 0) {
          if (rendimientoHistorico < rendimientoObjetivo * 0.85) estado = 'Crítico';
          else if (rendimientoHistorico < rendimientoObjetivo * 0.95) estado = 'Regular';
          else estado = 'Óptimo';
       } else {
          estado = 'Sin Datos';
       }

       const desviacionPct = (rendimientoObjetivo > 0 && rendimientoHistorico > 0)
          ? Number((((rendimientoHistorico - rendimientoObjetivo) / rendimientoObjetivo) * 100).toFixed(1))
          : 0;

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
          rendimientoObjetivo,
          rendimientoHistorico,
          desviacionPct,
          costoKm30d,
          estado
       };
    });
  }, [vehiculos, cargasFiltradasPorFecha]);

  const alertasFlota = React.useMemo(() => {
    return tablaFlota.filter(v => v.estado === 'Crítico' || v.estado === 'Regular');
  }, [tablaFlota]);

  const vehiculosCriticos = tablaFlota.filter(v => v.estado === 'Crítico').length;
  const alertasRegularesCount = tablaFlota.filter(v => v.estado === 'Regular').length;

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
    return tablaFlota.filter(v => {
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
  }, [tablaFlota, filtroTexto, filtroMarca, filtroModelo, filtroTipo, filtroRuta, filtroAplicacion]);

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

  // 7. Gráfico histórico agrupado por fecha (calculando km reales de lecturas consecutivas)
  const chartData = React.useMemo(() => {
     const allSorted = [...cargasRegistradas].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
     const deltaKmByCargaId: Record<string, number> = {};
     const prevOdoByVehiculo: Record<string, number> = {};

     allSorted.forEach(c => {
        const vId = c.vehiculo_id;
        const odo = parseFloat(c.odometro) || 0;
        if (prevOdoByVehiculo[vId] !== undefined && odo > prevOdoByVehiculo[vId]) {
           deltaKmByCargaId[c.id] = odo - prevOdoByVehiculo[vId];
        }
        prevOdoByVehiculo[vId] = odo;
     });

     const sortedFiltradas = [...cargasFiltradasPorFecha].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
     const grouped: Record<string, { costo: number, litros: number, km: number }> = {};

     sortedFiltradas.forEach(c => {
        const d = c.fecha ? c.fecha.substring(0, 10) : (c.fechaFormateada || '');
        const parts = d.split('-');
        const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.substring(0, 5);

        if (!grouped[shortDate]) grouped[shortDate] = { costo: 0, litros: 0, km: 0 };
        const litros = parseFloat(c.litros) || 0;
        grouped[shortDate].costo += parseFloat(c.costo_total) || 0;
        grouped[shortDate].litros += litros;
        
        const delta = deltaKmByCargaId[c.id];
        if (delta && delta > 0) {
           grouped[shortDate].km += delta;
        } else {
           grouped[shortDate].km += litros * 2.8;
        }
     });

     return Object.keys(grouped).map(d => ({
        date: d,
        costo: grouped[d].costo,
        rendimiento: grouped[d].litros > 0 ? Number((grouped[d].km / grouped[d].litros).toFixed(2)) : 0
     }));
  }, [cargasFiltradasPorFecha, cargasRegistradas]);

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card 
                className={cn("bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-md cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'costo' && "ring-2 ring-blue-300")}
                onClick={() => setSelectedKpi('costo')}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-blue-100 text-sm font-medium">Costo Total (30d)</p>
                      <h3 className="text-3xl font-black">${kpis.costoTotal30d.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-white/20 rounded-lg"><DollarSign className="w-5 h-5 text-white" /></div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={cn("bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'rendimiento' && "ring-2 ring-emerald-500")}
                onClick={() => setSelectedKpi('rendimiento')}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Rend. Promedio</p>
                      <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{kpis.rendimientoPromedio} <span className="text-base font-medium text-slate-400">km/L</span></h3>
                    </div>
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={cn("bg-white dark:bg-slate-900 shadow-sm cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'costokm' && "ring-2 ring-blue-500")}
                onClick={() => setSelectedKpi('costokm')}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Costo/km Flota</p>
                      <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">${kpis.costoKmPromedio}</h3>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><Banknote className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
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
                  <p className="text-xs text-red-600 dark:text-red-400 mt-4">Vehículos muy por debajo del objetivo</p>
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
                  Comparativa temporal de gasto ($) y rendimiento promedio (km/L) en la flota
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
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} type="number" domain={[0, 'auto']} tick={{ fontSize: 12, fill: '#64748b' }} unit=" km/L" />
                      <RechartsTooltip 
                         contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }}
                         formatter={(value, name) => {
                           if (name === 'Costo ($)') return [`$${(value as number).toLocaleString()}`, name];
                           if (name === 'Rendimiento (km/L)') return [`${(value as number).toFixed(1)} km/L`, name];
                           return [value, name];
                         }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar yAxisId="left" dataKey="costo" name="Costo ($)" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={40} />
                      <Line yAxisId="right" type="monotone" dataKey="rendimiento" name="Rendimiento (km/L)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} />
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
                      {alertasFlota.length} {alertasFlota.length === 1 ? 'unidad observada' : 'unidades observadas'}
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
              {alertasFlota.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Vehículo</th>
                        <th className="px-6 py-3 font-semibold">Modelo</th>
                        <th className="px-6 py-3 font-semibold">Tipo / Aplicación</th>
                        <th className="px-6 py-3 font-semibold">Ruta</th>
                        <th className="px-6 py-3 font-semibold text-center">Meta (km/L)</th>
                        <th className="px-6 py-3 font-semibold text-center">Real</th>
                        <th className="px-6 py-3 font-semibold text-center">Desviación</th>
                        <th className="px-6 py-3 font-semibold text-center">Costo/km</th>
                        <th className="px-6 py-3 font-semibold text-center">Semáforo</th>
                        <th className="px-6 py-3 font-semibold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {alertasFlota.map(v => (
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
                            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{v.tipo}</div>
                            <div className="text-xs text-slate-500">{v.aplicacion}</div>
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border dark:border-slate-700">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {v.ruta}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center font-medium text-slate-600 dark:text-slate-400">
                            {v.rendimientoObjetivo.toFixed(1)}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={cn(
                              "font-bold px-2 py-0.5 rounded text-xs",
                              v.estado === 'Crítico' ? "text-red-700 bg-red-100/80 dark:bg-red-900/40" : "text-amber-700 bg-amber-100/80 dark:bg-amber-900/40"
                            )}>
                              {v.rendimientoHistorico.toFixed(1)} km/L
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
                            ${v.costoKm30d}
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-semibold" 
                              onClick={() => setSelectedVehicle(v)}
                            >
                              Ver Detalle
                            </Button>
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
                   <strong className="block mb-1">FÓRMULA:</strong>
                   {selectedKpi === 'costo' && "Costo Total (30d) = ∑ (Litros consumidos × Precio del litro vigente en cada carga)"}
                   {selectedKpi === 'rendimiento' && "Rendimiento Promedio = Distancia total recorrida (km) / Litros totales consumidos"}
                   {selectedKpi === 'costokm' && "Costo/km Flota = Suma total de gasto en combustible / Kilómetros totales producidos"}
                   {selectedKpi === 'alertas' && "Desviaciones Críticas = Conteo de vehículos cuyo rendimiento real es < (Objetivo - 15%)"}
                 </div>
              </div>

              {/* Data content layer */}
              <div className="space-y-4 pt-4">
                <h4 className="font-bold text-sm uppercase text-slate-500 tracking-wider">Desglose de Datos</h4>
                
                {selectedKpi === 'costo' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Total Litros</span>
                      <span className="font-bold text-slate-900 dark:text-white">{(kpis.totalLitros || 0).toLocaleString()} L</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Precio Promedio (PMP)</span>
                      <span className="font-bold text-slate-900 dark:text-white">${kpis.totalLitros > 0 ? Math.round(kpis.costoTotal30d / kpis.totalLitros).toLocaleString() : 0} / L</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-blue-600 text-white rounded-lg shadow-inner">
                      <span className="font-medium">Total Estimado</span>
                      <span className="font-black text-xl">${kpis.costoTotal30d.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {selectedKpi === 'rendimiento' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Kilómetros Totales</span>
                      <span className="font-bold text-slate-900 dark:text-white">{(kpis.totalKm || 0).toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Total Litros Consumidos</span>
                      <span className="font-bold text-slate-900 dark:text-white">{(kpis.totalLitros || 0).toLocaleString()} L</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-emerald-600 text-white rounded-lg shadow-inner">
                      <span className="font-medium">Promedio Global</span>
                      <span className="font-black text-xl">{kpis.rendimientoPromedio} km/L</span>
                    </div>
                  </div>
                )}
                {selectedKpi === 'costokm' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Costo Operativo Combustible</span>
                      <span className="font-bold text-slate-900 dark:text-white">${kpis.costoTotal30d.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Kilómetros Totales</span>
                      <span className="font-bold text-slate-900 dark:text-white">{(kpis.totalKm || 0).toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-800 dark:bg-slate-950 text-white rounded-lg shadow-inner">
                      <span className="font-medium">Costo por KM</span>
                      <span className="font-black text-xl">${kpis.costoKmPromedio}</span>
                    </div>
                  </div>
                )}
                {selectedKpi === 'alertas' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Flota Evaluada</span>
                      <span className="font-bold text-slate-900 dark:text-white">{tablaFlota.length} Vehículos</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400 text-emerald-600">Dentro de Meta</span>
                      <span className="font-bold text-slate-900 dark:text-white">{tablaFlota.filter(v => v.estado === 'Óptimo').length} Vehículos</span>
                    </div>
                    <div className="space-y-2 mt-4 border-t dark:border-slate-800 pt-4">
                      <p className="text-sm font-semibold text-red-600 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Vehículos Críticos</p>
                      {tablaFlota.filter(v => v.estado === 'Crítico').map(v => (
                         <div key={v.id} className="flex justify-between text-sm p-2 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 rounded-r">
                           <span className="font-medium">{v.numeroInterno}</span>
                           <span className="text-red-600">{v.rendimientoHistorico} km/L (Meta: {v.rendimientoObjetivo})</span>
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
              <Button onClick={() => setIsAjustarMetasOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
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
                  Mostrando <strong className="text-slate-800 dark:text-slate-200">{filteredFlota.length}</strong> de {tablaFlota.length} unidades
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
                    <th className="px-6 py-4 font-semibold text-center">Meta (km/L)</th>
                    <th className="px-6 py-4 font-semibold text-center">Real</th>
                    <th className="px-6 py-4 font-semibold text-center">Desviación</th>
                    <th className="px-6 py-4 font-semibold text-center">Costo/km</th>
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
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border dark:border-slate-700">
                          {v.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {v.ruta}
                        </div>
                        <div className="text-xs text-slate-500">{v.aplicacion}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-600 dark:text-slate-400">
                        {v.rendimientoObjetivo.toFixed(1)} 
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "font-bold px-2 py-1 rounded text-xs",
                          v.estado === 'Óptimo' ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30" : 
                          v.estado === 'Regular' ? "text-amber-700 bg-amber-50 dark:bg-amber-900/30" : 
                          v.estado === 'Sin Datos' ? "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400" :
                          "text-red-700 bg-red-50 dark:bg-red-900/30"
                        )}>
                          {v.estado === 'Sin Datos' ? '-' : `${v.rendimientoHistorico.toFixed(1)} km/L`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {v.estado === 'Sin Datos' ? (
                          <span className="text-slate-400 text-xs">-</span>
                        ) : (
                          <span className={cn(
                            "font-bold text-xs",
                            v.desviacionPct >= 0 ? "text-emerald-600 dark:text-emerald-400" :
                            v.desviacionPct >= -15 ? "text-amber-600 dark:text-amber-400" :
                            "text-red-600 dark:text-red-400"
                          )}>
                            {v.desviacionPct > 0 ? `+${v.desviacionPct}%` : `${v.desviacionPct}%`}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        ${v.costoKm30d}
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
                         <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-semibold" onClick={() => setSelectedVehicle(v)}>
                           Ver Detalle
                         </Button>
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
                    <th className="px-6 py-4 font-semibold text-right">Kilometraje</th>
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
                      <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-400">{(carga.odometro || 0).toLocaleString()} km</td>
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
            <CardHeader className="border-b dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
              <div>
                 <CardTitle className="text-2xl flex items-center gap-2">
                   {selectedVehicle.numeroInterno} 
                   <Badge variant={selectedVehicle.estado === 'Crítico' ? 'destructive' : 'default'} className={selectedVehicle.estado === 'Regular' ? 'bg-amber-500 hover:bg-amber-600' : ''}>{selectedVehicle.estado}</Badge>
                 </CardTitle>
                 <p className="text-slate-500 mt-1">{selectedVehicle.marca} {selectedVehicle.modelo} • Patente: {selectedVehicle.patente}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border dark:border-slate-700 text-right">
                 <p className="text-xs text-slate-500 mb-1">Periodo Evaluado</p>
                 <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                   {fechaDesde && fechaHasta ? `${fechaDesde} a ${fechaHasta}` : (fechaDesde ? `Desde ${fechaDesde}` : (fechaHasta ? `Hasta ${fechaHasta}` : 'Histórico Total Flota'))}
                 </p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700 shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-2 h-full bg-blue-500"></div>
                  <p className="text-sm text-slate-500 mb-1">Rendimiento Actual</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{selectedVehicle.rendimientoHistorico} <span className="text-base text-slate-400 font-medium">km/L</span></p>
                  <p className="text-xs text-slate-500 mt-2 flex items-center">
                    Meta Operacional: <strong className="ml-1 text-slate-700 dark:text-slate-300">{selectedVehicle.rendimientoObjetivo} km/L</strong>
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700 shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-2 h-full bg-emerald-500"></div>
                  <p className="text-sm text-slate-500 mb-1">Costo por KM</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-slate-100">${selectedVehicle.costoKm30d}</p>
                  <p className="text-xs text-slate-500 mt-2">Promedio flota meta: <strong className="ml-1 text-slate-700 dark:text-slate-300">${kpis.costoKmPromedio}</strong></p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border dark:border-slate-700 shadow-sm relative overflow-hidden">
                   <div className="absolute right-0 top-0 w-2 h-full bg-slate-300 dark:bg-slate-700"></div>
                   <p className="text-sm text-slate-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Telemetría GPS</p>
                   <p className="text-3xl font-black text-slate-500">Sin Datos</p>
                   <p className="text-xs text-slate-500 mt-2">Conecte GPS para alertas</p>
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
      <Modal isOpen={isAjustarMetasOpen} onClose={() => setIsAjustarMetasOpen(false)} title="Ajustar Meta de Rendimiento">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Seleccione el vehículo para establecer una nueva meta de rendimiento (km/L) a evaluar.</p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Vehículo</label>
            <select 
               value={formMeta.vehiculo_id || ''}
               onChange={(e) => setFormMeta({...formMeta, vehiculo_id: e.target.value})}
               className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
            >
               <option value="" disabled>Seleccione un vehículo</option>
               {vehiculos.map(v => (
                 <option key={v.id} value={v.id}>{v.detalles?.numero_interno || v.patente} ({v.modelo})</option>
               ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nuevo Objetivo (km/L)</label>
            <input 
               type="number" step="0.1" placeholder="Ej: 2.8" 
               value={formMeta.rendimiento_objetivo}
               onChange={(e) => setFormMeta({...formMeta, rendimiento_objetivo: e.target.value})}
               className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" 
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsAjustarMetasOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMeta} className="bg-emerald-600 hover:bg-emerald-700 text-white">Guardar Meta</Button>
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
              <label className="text-sm font-medium">Kilometraje Total (Odómetro)</label>
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
                placeholder={!isKmManual ? "Obteniendo del GPS..." : "Ej: 45000"} 
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
            {!isKmManual && <p className="text-xs text-blue-600 dark:text-blue-400">Lectura de odómetro extraída desde telemetría GPS.</p>}
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
