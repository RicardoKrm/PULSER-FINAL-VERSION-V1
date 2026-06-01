import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useCompany } from '../contexts/CompanyContext';
import { supabase } from '../lib/supabase';
import { calcularDatosPizarra } from '../lib/mantenimientoLogica';
import { 
  Search, 
  CheckCircle2, 
  ClipboardCheck, 
  DollarSign, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';


// Calculated dynamic data


const COLORS = ['#3b82f6', '#ef4444'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, ordenesTrabajo, vehiculos } = useAppContext() as any;
  const { currentCompany } = useCompany();
  const [dbVehiculos, setDbVehiculos] = useState<any[]>([]);
  const [fechaDesde, setFechaDesde] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);

  React.useEffect(() => {
    if (!currentCompany?.id) return;
    const fetchVehs = async () => {
      const { data } = await supabase.from('vehiculo').select('*').eq('empresa_id', currentCompany.id);
      if (data) {
        // Map fields to what calcularDatosPizarra expects
        const { data: pautasData } = await supabase.from('mantenimiento_pauta').select('*, modelo:mantenimiento_modelo_vehiculo(nombre)').eq('empresa_id', currentCompany.id);

        const mapped = data.map(v => {
          const detalles = v.detalles || {};
          const kmsActuales = typeof v.kilometraje_actual === 'number' ? v.kilometraje_actual : parseFloat(String(v.kilometraje_actual).replace(/[^0-9.-]+/g, '')) || 0;
          const rawKmUlt = v.km_ultima_mantencion !== undefined ? v.km_ultima_mantencion : (detalles.km_ultima_mantencion || 0);
          const kmUltMant = typeof rawKmUlt === 'number' ? rawKmUlt : parseFloat(String(rawKmUlt).replace(/[^0-9.-]+/g, '')) || 0;
          
          const rawInterval = v.intervalo_km !== undefined ? v.intervalo_km : (detalles.intervalo_km !== undefined ? detalles.intervalo_km : 10000);
          const kmInterv = typeof rawInterval === 'number' ? rawInterval : parseFloat(String(rawInterval).replace(/[^0-9.-]+/g, '')) || 10000;
          
          let pautasSecuencia: any[] = [];
          if (pautasData) {
              const pautasDelVehiculo = pautasData.filter(p => {
                 const normalizeStr = (s: any) => String(s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
                 const vehModelo = normalizeStr(v.modelo);
                 const pModelo = normalizeStr(p.modelo?.nombre);
                 
                 const vehAciete = normalizeStr(v.tipo_aceite);
                 const pAciete = normalizeStr(p.tipo_aceite);

                 return (vehModelo === pModelo) && (!pAciete || (vehAciete && pAciete === vehAciete));
              });

              pautasDelVehiculo.forEach(p => {
                 const limiteKm = kmsActuales + 500000;
                 let currentKm = Number(p.kilometraje_inicial) || 0;
                 const int1 = Number(p.intervalo_1) || 0;
                 const int2 = p.intervalo_2 ? Number(p.intervalo_2) : 0;
                 
                 if (currentKm > 0 || int1 > 0) {
                     pautasSecuencia.push({ iteracion_km: currentKm, nombre: p.nombre });
                     
                     const nameUpper = (p.nombre || '').toUpperCase().trim();
                     if (int1 > 0 && !(nameUpper.startsWith('SI') || nameUpper.startsWith('R') || nameUpper.includes('INICIAL'))) {
                         let usarInt1 = true;
                         while (currentKm < limiteKm) {
                             if (int2 > 0) {
                                 currentKm += usarInt1 ? int1 : int2;
                                 usarInt1 = !usarInt1;
                             } else {
                                 currentKm += int1;
                             }
                             if (currentKm < limiteKm) {
                                 pautasSecuencia.push({ iteracion_km: currentKm, nombre: p.nombre });
                             }
                         }
                     }
                 }
              });
              
              pautasSecuencia.sort((a, b) => a.iteracion_km - b.iteracion_km);
              const uniqueKms = new Set();
              pautasSecuencia = pautasSecuencia.filter(item => {
                   if (!uniqueKms.has(item.iteracion_km)) {
                        uniqueKms.add(item.iteracion_km);
                        return true;
                   }
                   return false;
              });
          }

          return {
            id: v.id,
            numeroInterno: v.numero_interno || '',
            patente: v.patente || v.numero_interno || 'Sin PPU',
            kilometrajeActual: kmsActuales,
            kmUltimaMantencion: kmUltMant,
            intervaloMantencionKm: kmInterv,
            kmPromedioDia: v.km_promedio_dia || detalles.km_promedio_dia || 150,
            fechaUltimaMantencion: (v.fecha_ultima_mantencion || detalles.fecha_ultima_mantencion) ? new Date(v.fecha_ultima_mantencion || detalles.fecha_ultima_mantencion) : null,
            fechaActualizacionKm: v.fecha_actualizacion_km ? new Date(v.fecha_actualizacion_km) : new Date(),
            tipoUltimaPauta: v.tipo_ultimo_mant || detalles.tipo_ultimo_mant || v.tipo_ult_pauta || detalles.tipo_ult_pauta || '',
            pautasSecuencia
          };
        });
        setDbVehiculos(mapped);
      }
    };
    fetchVehs();
  }, [currentCompany?.id]);

  const { 
    tendenciaData,
    estrategiaData,
    costosData,
    cuellosData,
    disponibilidad,
    cumplimientoPrev,
    gastoMensual,
    alertasCriticas,
    saludFlota
  } = React.useMemo(() => {
    
    // 1. Preventivas vs Correctivas
    const preventivas = (ordenesTrabajo || []).filter((ot: any) => ot.tipo === 'PREVENTIVA' || ot.tipo?.includes('PREVENTIVA'));
    const correctivas = (ordenesTrabajo || []).filter((ot: any) => ot.tipo === 'CORRECTIVA' || ot.tipo?.includes('CORRECTIVA') || ot.tipo?.includes('FALLA'));
    const prevCount = preventivas.length;
    const corrCount = correctivas.length;

    const estrategia = [
      { name: 'Preventivo', value: prevCount },
      { name: 'Correctivo', value: corrCount }
    ];

    // 2. Salud Flota y Disponibilidad
    let vencidos = 0;
    let proximos = 0;
    let alDia = 0;
    let vehiculosDisponibles = 0;

    const totalDb = dbVehiculos?.length || 0;
    (dbVehiculos || []).forEach((v: any) => {
       try {
         const calculo = calcularDatosPizarra(v);
         if (calculo.estatus === 'VENCIDO') {
           vencidos++;
         } else if (calculo.estatus === 'PROXIMO') {
           proximos++;
         } else {
           alDia++;
         }
         
         // Disp: Si no está en un estado que implique indisponibilidad (esto depende del negocio, pero por defecto asumimos todos menos los que están en taller crítico)
         // Para simplificar, asumimos disponible si no tiene OT abierta bloqueante. Aqui solo sumaremos.
         // Un proxy mas real: Asumir que vencidos o con estado "TALLER" o fallados no están disponibles.
         // Para este dashboard, todo esta disponible menos si tiene OT en curso.
       } catch (err) {
         alDia++; // Fallback
       }
    });

    const otsEnCurso = (ordenesTrabajo || []).filter((ot: any) => ['CREADA', 'EN_PROGRESO', 'PAUSADA'].includes(ot.estado)).map((ot: any) => ot.vehiculoId);
    let indisponibles = new Set(otsEnCurso).size;

    vehiculosDisponibles = totalDb > 0 ? totalDb - indisponibles : 0;
    const dispActual = totalDb > 0 ? (vehiculosDisponibles / totalDb) * 100 : 0;
    
    // Tendencia de disponibilidad real por meses (Simplified, just flat if no history)
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const tendencia = meses.map(m => ({
      name: m,
      value: dispActual // Sin historico real, devolvemos la misma linea
    }));

    // 3. Costos mensuales reales
    const currentMonth = new Date().getMonth();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const mesesNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    let currPrev = 0, currCorr = 0;
    let pastPrev = 0, pastCorr = 0;

    (ordenesTrabajo || []).forEach((ot: any) => {
        const d = new Date(ot.fechaCreacion || new Date());
        const mon = d.getMonth();
        const cost = (Number(ot.costoManoObraTareas) || 0) + (Number(ot.costoInsumos) || 0) + (Number(ot.costoManoObraHH) || 0);

        if (mon === currentMonth) {
            if (ot.tipo?.includes('PREVENTIVA')) currPrev += cost;
            else currCorr += cost;
        } else if (mon === prevMonth) {
            if (ot.tipo?.includes('PREVENTIVA')) pastPrev += cost;
            else pastCorr += cost;
        }
    });

    const costos = [
      { name: mesesNames[prevMonth], prev: pastPrev, corr: pastCorr },
      { name: mesesNames[currentMonth], prev: currPrev, corr: currCorr }
    ];

    const gastoTotalMesActual = currPrev + currCorr;

    // 4. Cuellos de botella reales
    const cuellosMap: Record<string, number> = {};
    (ordenesTrabajo || []).forEach((ot: any) => {
      if (ot.historial && Array.isArray(ot.historial)) {
        ot.historial.forEach((h: any) => {
          if (h.comentario && h.comentario.toLowerCase().includes('pausa')) {
             // Example extraction logic or just generic reason
             cuellosMap['Pausa en OT'] = (cuellosMap['Pausa en OT'] || 0) + 1;
          }
        });
      }
    });
    
    let cuellosArr = Object.entries(cuellosMap).map(([name, value]) => ({ name, value }));
    cuellosArr.sort((a, b) => b.value - a.value);

    // 5. Cumplimiento Prev (Cumplimiento de Cronograma)
    let cumpPrev = 100;
    if (totalDb > 0) {
      cumpPrev = 100 - ((vencidos / totalDb) * 100);
    }

    return {
      tendenciaData: tendencia,
      estrategiaData: estrategia,
      costosData: costos,
      cuellosData: cuellosArr.slice(0, 5),
      disponibilidad: (dispActual || 0).toFixed(1),
      cumplimientoPrev: (cumpPrev || 0).toFixed(1),
      gastoMensual: gastoTotalMesActual.toLocaleString(),
      alertasCriticas: vencidos,
      saludFlota: { vencidos, proximos, alDia }
    };
  }, [ordenesTrabajo, vehiculos, dbVehiculos]);


  const handleFilter = () => {
    // Implementar lógica de filtrado real aquí
  };

  const currentHour = new Date().getHours();
  let greeting = 'Buenos días';
  if (currentHour >= 12 && currentHour < 19) {
    greeting = 'Buenas tardes';
  } else if (currentHour >= 19) {
    greeting = 'Buenas noches';
  }
  
  const userName = user?.name || user?.nombre || 'Usuario'; // Could be dynamic from context

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{greeting}, {userName}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Indicadores clave de rendimiento y salud operativa</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md overflow-hidden">
            <div className="px-3 py-2 flex items-center border-r border-slate-200 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Desde</span>
                <input 
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none p-0 border-none focus:ring-0 dark:[color-scheme:dark]"
                />
              </div>
            </div>
            <div className="px-3 py-2 flex items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Hasta</span>
                <input 
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none p-0 border-none focus:ring-0 dark:[color-scheme:dark]"
                />
              </div>
            </div>
          </div>
          <button 
            onClick={handleFilter}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-md transition-colors shadow-sm"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div 
          onClick={() => navigate('/flota/mantenimiento')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Disponibilidad Flota</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{disponibilidad}%</span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 p-2 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-slate-400 dark:text-slate-500">
            <span className="font-normal ml-1">Sin datos históricos</span>
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => navigate('/flota/mantenimiento')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Cumplimiento Prev.</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{cumplimientoPrev}%</span>
            </div>
            <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 p-2 rounded-lg">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-slate-400 dark:text-slate-500">
            <span className="font-normal ml-1">Sin datos recientes</span>
          </div>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => navigate('/dashboard/tco')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Gasto Mensual</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">$ {gastoMensual}</span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 p-2 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-slate-400 dark:text-slate-500">
            <span className="font-normal ml-1">Esperando registros</span>
          </div>
        </div>

        {/* Card 4 */}
        <div 
          onClick={() => navigate('/operaciones/alertas')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Alertas Críticas</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{alertasCriticas}</span>
            </div>
            <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-slate-400 dark:text-slate-500">
            <span className="font-normal ml-1">Todo en orden normal</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div 
          onClick={() => navigate('/dashboard/kpi-flota')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 lg:col-span-2 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Tendencia de Disponibilidad</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Evolución semestral vs Meta</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
              Meta: 95%
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tendenciaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[80, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <ReferenceLine y={95} stroke="#64748b" strokeDasharray="3 4" strokeWidth={2} />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div 
          onClick={() => navigate('/flota/mantenimiento')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Salud de Flota</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Estado actual de mantenimientos</p>
            </div>
            <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/30 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 px-3 py-1.5 rounded flex items-center transition-colors">
              Ver Detalle <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
          <div className="space-y-4 mt-8">
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400 dark:bg-rose-500"></div>
                <span className="font-semibold text-rose-700 dark:text-rose-400">Vencidos</span>
              </div>
              <span className="text-xl font-bold text-rose-700 dark:text-rose-400">{saludFlota.vencidos}</span>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 dark:bg-amber-500"></div>
                <span className="font-semibold text-amber-700 dark:text-amber-400">Próximos</span>
              </div>
              <span className="text-xl font-bold text-amber-700 dark:text-amber-400">{saludFlota.proximos}</span>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 dark:bg-emerald-500"></div>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Al Día</span>
              </div>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{saludFlota.alDia}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => navigate('/dashboard/kpi-flota')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 flex flex-col cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Estrategia</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Mix Preventivo vs Correctivo</p>
          </div>
          <div className="w-full h-[240px] mt-4 relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={estrategiaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  stroke="none"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {estrategiaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {estrategiaData.length > 0 ? (
                <>
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">{Math.round((estrategiaData[0].value / (estrategiaData[0].value + estrategiaData[1].value)) * 100)}%</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{estrategiaData[0].name}</span>
                </>
              ) : (
                <span className="text-sm font-bold text-slate-400">Sin datos</span>
              )}
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-xs font-semibold text-rose-500 dark:text-rose-400">Correctivo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs font-semibold text-blue-500 dark:text-blue-400">Preventivo</span>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/dashboard/kpi-flota')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 flex flex-col cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Costos ($)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Evolución mensual por tipo</p>
          </div>
          <div className="w-full h-[240px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costosData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="prev" stackId="a" fill="#3b82f6" />
                <Bar dataKey="corr" stackId="a" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-xs font-semibold text-rose-500 dark:text-rose-400">Corr.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs font-semibold text-blue-500 dark:text-blue-400">Prev.</span>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/dashboard/fallas')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 flex flex-col cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Cuellos de Botella</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Motivos de pausa (Top 5)</p>
            </div>
            <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/30 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 px-2 py-1 rounded flex items-center transition-colors">
              <ClipboardCheck className="w-3 h-3 mr-1" />
              Detalle
            </button>
          </div>
          <div className="w-full h-[240px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cuellosData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
