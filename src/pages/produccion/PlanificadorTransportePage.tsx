import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useProduccion } from '../../contexts/ProduccionContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { 
  Calculator, Save, RotateCcw, TrendingUp, AlertCircle, 
  Calendar as CalendarIcon, Users, Truck, Database, 
  Settings, Target, Zap, Clock, ShieldAlert, BarChart3, LineChart as LineChartIcon,
  Table as TableIcon
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, Legend, 
  ResponsiveContainer, ReferenceLine, ComposedChart, Area
} from 'recharts';

interface ParametrosSimulacion {
  choferesDia: number;
  choferesNoche: number;
  camionesDisp: number;
  vueltasChofer: number;
  toneladasVuelta: number;
  dispOperacional: number;
  diasDetencion: number;
  horasPerdidasTurno: number;
  incrementoRendimiento: number;
}

interface EscenarioGuardado {
  id: string;
  nombre: string;
  parametros: ParametrosSimulacion;
  resultados: {
    produccionProyectada: number;
    cumplimiento: number;
    diferencia: number;
  };
}

export default function PlanificadorTransportePage() {
  const { currentCompany } = useCompany();
  const { metas } = useProduccion();
  const [loading, setLoading] = useState(true);
  const [mesSeleccionado, setMesSeleccionado] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );
  
  const [activeTab, setActiveTab] = useState<'simulador' | 'graficos'>('simulador');
  const [showChartDetails, setShowChartDetails] = useState<boolean>(false);

  // Datos reales
  const [realData, setRealData] = useState<any[]>([]);
  const [diasMes, setDiasMes] = useState(30);
  const [diasTranscurridos, setDiasTranscurridos] = useState(0);
  
  // Parámetros de simulación
  const [params, setParams] = useState<ParametrosSimulacion>({
    choferesDia: 14,
    choferesNoche: 14,
    camionesDisp: 14,
    vueltasChofer: 6,
    toneladasVuelta: 27.5,
    dispOperacional: 100,
    diasDetencion: 0,
    horasPerdidasTurno: 0,
    incrementoRendimiento: 0
  });

  const [escenarios, setEscenarios] = useState<EscenarioGuardado[]>([]);

  useEffect(() => {
    fetchData();
  }, [mesSeleccionado]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [year, month] = mesSeleccionado.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month
      
      const diasEnElMes = endDate.getDate();
      setDiasMes(diasEnElMes);
      
      const today = new Date();
      let transcurridos = 0;
      if (today.getFullYear() === year && today.getMonth() + 1 === month) {
        transcurridos = today.getDate();
      } else if (today > endDate) {
        transcurridos = diasEnElMes;
      } else {
        transcurridos = 0;
      }
      setDiasTranscurridos(transcurridos);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('produccion_registro_diario')
        .select('*').eq('empresa_id', currentCompany?.id || '').gte('fecha', startDateStr)
        .lte('fecha', endDateStr);

      if (error) throw error;

      setRealData(data || []);

      // Approximate initial params based on real data
      if (data && data.length > 0) {
        // Calculate average distinct drivers per day/shift and trucks
        // For simplicity, we just use defaults or rough estimates
        // In a real scenario we would group by fecha and turno
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const metaMensual = metas.transporteMonthly;
  const diasRestantes = Math.max(0, diasMes - diasTranscurridos);

  // Cálculos de Datos Reales
  const realStats = useMemo(() => {
    let tonAcu = 0;
    let vueltasAcu = 0;
    const daysSet = new Set<string>();

    realData.forEach(r => {
      tonAcu += Number(r.tonelaje) || 0;
      vueltasAcu += Number(r.vueltas) || 0;
      daysSet.add(r.fecha.split('T')[0]);
    });

    const activeDays = Math.max(1, daysSet.size); // Avoid division by zero
    
    return {
      tonAcu,
      vueltasAcu,
      promTonDia: tonAcu / activeDays,
      promVueltasDia: vueltasAcu / activeDays,
      cumplimiento: metaMensual > 0 ? (tonAcu / metaMensual) * 100 : 0
    };
  }, [realData, metaMensual]);

  // Cálculos de Proyección Base (Si sigue igual)
  const baseProjection = useMemo(() => {
    const projDiaria = realStats.promTonDia;
    const vueltasProj = realStats.promVueltasDia;
    
    const tonProjFinal = realStats.tonAcu + (projDiaria * diasRestantes);
    const vueltasFinal = realStats.vueltasAcu + (vueltasProj * diasRestantes);
    
    return {
      tonProjFinal,
      vueltasFinal,
      diferencia: tonProjFinal - metaMensual,
      cumplimiento: metaMensual > 0 ? (tonProjFinal / metaMensual) * 100 : 0
    };
  }, [realStats, diasRestantes, metaMensual]);

  // Cálculos de Simulación
  const simResults = useMemo(() => {
    const choferesEfDia = Math.min(params.choferesDia, params.camionesDisp);
    const choferesEfNoche = Math.min(params.choferesNoche, params.camionesDisp);
    
    let vueltasDia = (choferesEfDia + choferesEfNoche) * params.vueltasChofer;
    
    // Aplicar factores
    vueltasDia *= (params.dispOperacional / 100);
    vueltasDia *= (1 - (params.horasPerdidasTurno / 12)); // assuming 12h shifts
    vueltasDia *= (1 + (params.incrementoRendimiento / 100));

    const tonDiariaProj = vueltasDia * params.toneladasVuelta;
    const diasOp = Math.max(0, diasRestantes - params.diasDetencion);
    
    const tonProjFinal = realStats.tonAcu + (tonDiariaProj * diasOp);
    const vueltasFinal = realStats.vueltasAcu + (vueltasDia * diasOp);

    return {
      tonDiariaProj,
      vueltasDiariaProj: vueltasDia,
      tonProjFinal,
      vueltasFinal,
      diferencia: tonProjFinal - metaMensual,
      cumplimiento: metaMensual > 0 ? (tonProjFinal / metaMensual) * 100 : 0
    };
  }, [params, realStats, diasRestantes, metaMensual]);

  const handleApplyPreset = (type: string) => {
    const current = { ...params };
    switch(type) {
      case 'normal':
        setParams({
          choferesDia: 14, choferesNoche: 14, camionesDisp: 14,
          vueltasChofer: 6, toneladasVuelta: 27.5, dispOperacional: 100,
          diasDetencion: 0, horasPerdidasTurno: 0, incrementoRendimiento: 0
        });
        break;
      case 'alta_prod':
        setParams({ ...current, vueltasChofer: 6.5, incrementoRendimiento: 5, dispOperacional: 100, diasDetencion: 0, horasPerdidasTurno: 0 });
        break;
      case 'baja_dot':
        setParams({ ...current, choferesDia: 8, choferesNoche: 8 });
        break;
      case 'transporte_detenido':
        setParams({ ...current, dispOperacional: 0 });
        break;
      case 'detencion':
        setParams({ ...current, diasDetencion: current.diasDetencion + 1 });
        break;
    }
  };

  const handleSaveScenario = () => {
    const nombre = `Escenario ${escenarios.length + 1}`;
    setEscenarios([...escenarios, {
      id: Date.now().toString(),
      nombre,
      parametros: { ...params },
      resultados: {
        produccionProyectada: simResults.tonProjFinal,
        cumplimiento: simResults.cumplimiento,
        diferencia: simResults.diferencia
      }
    }]);
  };

  // Generate chart data
  const chartData = useMemo(() => {
    const data = [];
    let acuReal = 0;
    let acuBase = realStats.tonAcu; // starting point for projection
    let acuSim = realStats.tonAcu;
    
    // Map real data by day
    const realByDay = new Map<number, number>();
    realData.forEach(r => {
      const day = parseInt(r.fecha.split('-')[2], 10);
      realByDay.set(day, (realByDay.get(day) || 0) + (Number(r.tonelaje) || 0));
    });

    for (let day = 1; day <= diasMes; day++) {
      let isFuture = day > diasTranscurridos;
      
      let realVal = null;
      let baseVal = null;
      let simVal = null;

      if (!isFuture) {
        const dVal = realByDay.get(day) || 0;
        acuReal += dVal;
        realVal = acuReal;
        baseVal = acuReal;
        simVal = acuReal;
      } else {
        acuBase += realStats.promTonDia;
        baseVal = acuBase;
        
        // Sim is 0 on maintenance days
        const isMaintenanceDay = (day > diasTranscurridos && day <= diasTranscurridos + params.diasDetencion);
        if (!isMaintenanceDay) {
          acuSim += simResults.tonDiariaProj;
        }
        simVal = acuSim;
      }

      data.push({
        day,
        real: realVal,
        proyeccion: baseVal,
        simulacion: simVal,
        metaLine: (metaMensual / diasMes) * day, // Ideal cumulative line
        dailyReal: isFuture ? null : (realByDay.get(day) || 0),
        dailySim: isFuture ? ( (day <= diasTranscurridos + params.diasDetencion) ? 0 : simResults.tonDiariaProj ) : null
      });
    }
    return data;
  }, [realData, diasMes, diasTranscurridos, realStats, simResults, params.diasDetencion, metaMensual]);

  const generateRecommendations = () => {
    if (simResults.diferencia >= 0) return ["Proyección favorable. Mantener operación actual."];
    
    const recs = [];
    const diff = Math.abs(simResults.diferencia);
    const diasOp = Math.max(1, diasRestantes - params.diasDetencion);
    
    const requiredDailyExtra = diff / diasOp;
    
    // Check if adding trucks helps (if we have more drivers than trucks)
    const choferesTotal = params.choferesDia + params.choferesNoche;
    if (choferesTotal > params.camionesDisp * 2) {
      recs.push(`Agregar 1-2 camiones (conductores disponibles sin equipo).`);
    }

    // Check if adding drivers helps
    if (params.choferesNoche < params.camionesDisp) {
      const extraNeeded = Math.ceil(requiredDailyExtra / (params.vueltasChofer * params.toneladasVuelta));
      recs.push(`Agregar ${extraNeeded} choferes al turno noche.`);
    }

    // Increase vueltas
    const extraVueltas = (requiredDailyExtra / (choferesTotal / 2)) / params.toneladasVuelta;
    if (extraVueltas < 1.5) {
      recs.push(`Aumentar ${extraVueltas.toFixed(1)} vueltas promedio por chofer.`);
    }

    if (params.diasDetencion > 0) {
      recs.push(`Evitar / posponer detención de planta programada.`);
    }

    if (recs.length === 0) {
      recs.push("Aumentar rendimiento operacional (+5%) para compensar.");
    }
    return recs;
  };

  const recomendaciones = generateRecommendations();

  const formatNum = (num: number) => new Intl.NumberFormat('es-CL').format(Math.round(num));

  if (loading) return <div className="p-6">Cargando datos del mes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Planificador de Producción</h1>
          <p className="text-sm text-gray-500">Simulador de escenarios y proyección mensual de transporte.</p>
        </div>
        <div className="flex space-x-2">
          <select 
            className="border rounded px-3 py-1.5 text-sm"
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
          >
            <option value="2026-06">Junio 2026</option>
            <option value="2026-07">Julio 2026</option>
            <option value="2026-08">Agosto 2026</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: RESUMEN Y SIMULADOR */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Resumen Real */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span>Resumen del Mes (Real)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Meta Mensual</p>
                  <p className="font-bold text-gray-900">{formatNum(metaMensual)} T</p>
                </div>
                <div>
                  <p className="text-gray-500">Acumulado Real</p>
                  <p className="font-bold text-gray-900">{formatNum(realStats.tonAcu)} T</p>
                </div>
                <div>
                  <p className="text-gray-500">Días Transcurridos</p>
                  <p className="font-semibold text-gray-900">{diasTranscurridos} / {diasMes}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cumplimiento</p>
                  <p className="font-bold text-blue-600">{realStats.cumplimiento.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Prom. Diario (Real)</p>
                  <p className="font-semibold text-gray-900">{formatNum(realStats.promTonDia)} T/día</p>
                </div>
                <div>
                  <p className="text-gray-500">Días Restantes</p>
                  <p className="font-semibold text-gray-900">{diasRestantes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Proyección Automática */}
          <Card>
            <CardHeader className="pb-3 bg-gray-50 border-b">
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-gray-600" />
                <span>Proyección Automática</span>
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">Si la operación continúa igual</p>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{formatNum(baseProjection.tonProjFinal)} T</p>
                  <p className="text-sm text-gray-500">Proyección a fin de mes</p>
                </div>
                <div className={`px-3 py-1 rounded-full font-bold text-sm ${baseProjection.cumplimiento >= 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {baseProjection.cumplimiento.toFixed(1)}%
                </div>
              </div>
              <div className="text-sm mt-2">
                <span className="text-gray-500">Diferencia: </span>
                <span className={`font-semibold ${baseProjection.diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {baseProjection.diferencia > 0 ? '+' : ''}{formatNum(baseProjection.diferencia)} T
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 6. Recomendaciones */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center space-x-2 text-blue-800">
                <Zap className="w-4 h-4" />
                <span>Recomendaciones del Sistema</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-blue-900">
                {recomendaciones.map((rec, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

        </div>

        {/* COLUMNA CENTRAL: SIMULADOR */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex border-b border-gray-200 bg-white rounded-t-lg px-2">
            <button
              onClick={() => setActiveTab('simulador')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'simulador' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Simulador
            </button>
            <button
              onClick={() => setActiveTab('graficos')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center space-x-2 ${activeTab === 'graficos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <LineChartIcon className="w-4 h-4" />
              <span>Gráficos</span>
            </button>
          </div>

          {activeTab === 'simulador' && (
            <div className="space-y-6">
              <Card className="shadow-md border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center space-x-2 text-blue-900">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <span>Simulador de Escenarios</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleApplyPreset('normal')} className="text-xs h-7">
                    Restaurar Original
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSaveScenario} className="text-xs h-7 bg-blue-600">
                    <Save className="w-3 h-3 mr-1" />
                    Guardar Escenario
                  </Button>
                </div>
              </div>
              
              {/* Escenarios Rápidos */}
              <div className="flex flex-wrap gap-2 pt-3">
                <BadgeBtn label="Alta Producción" onClick={() => handleApplyPreset('alta_prod')} />
                <BadgeBtn label="Baja Dotación" onClick={() => handleApplyPreset('baja_dot')} />
                <BadgeBtn label="Detención Planta" onClick={() => handleApplyPreset('detencion')} />
                <BadgeBtn label="Transporte Detenido" onClick={() => handleApplyPreset('transporte_detenido')} />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Bloque: Dotación y Equipos */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 flex items-center border-b pb-2">
                    <Users className="w-4 h-4 mr-2" /> Dotación y Equipos
                  </h3>
                  <div>
                    <label className="text-sm text-gray-600 flex justify-between">
                      <span>Choferes T. Día</span>
                      <span className="font-bold">{params.choferesDia}</span>
                    </label>
                    <input type="range" min="5" max="30" value={params.choferesDia} onChange={e => setParams({...params, choferesDia: Number(e.target.value)})} className="w-full accent-blue-600" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 flex justify-between">
                      <span>Choferes T. Noche</span>
                      <span className="font-bold">{params.choferesNoche}</span>
                    </label>
                    <input type="range" min="5" max="30" value={params.choferesNoche} onChange={e => setParams({...params, choferesNoche: Number(e.target.value)})} className="w-full accent-blue-600" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 flex justify-between">
                      <span>Camiones Disponibles</span>
                      <span className="font-bold">{params.camionesDisp}</span>
                    </label>
                    <input type="range" min="10" max="40" value={params.camionesDisp} onChange={e => setParams({...params, camionesDisp: Number(e.target.value)})} className="w-full accent-blue-600" />
                  </div>
                </div>

                {/* Bloque: Rendimiento */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 flex items-center border-b pb-2">
                    <Truck className="w-4 h-4 mr-2" /> Rendimiento
                  </h3>
                  <div>
                    <label className="text-sm text-gray-600 flex justify-between">
                      <span>Vueltas / Chofer / Turno</span>
                      <span className="font-bold">{params.vueltasChofer.toFixed(1)}</span>
                    </label>
                    <input type="range" min="3" max="10" step="0.5" value={params.vueltasChofer} onChange={e => setParams({...params, vueltasChofer: Number(e.target.value)})} className="w-full accent-indigo-600" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 flex justify-between">
                      <span>Ton / Vuelta</span>
                      <span className="font-bold">{params.toneladasVuelta.toFixed(1)} T</span>
                    </label>
                    <input type="range" min="20" max="35" step="0.5" value={params.toneladasVuelta} onChange={e => setParams({...params, toneladasVuelta: Number(e.target.value)})} className="w-full accent-indigo-600" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 flex justify-between">
                      <span>Factor Eficiencia (%)</span>
                      <span className="font-bold">{params.incrementoRendimiento > 0 ? '+' : ''}{params.incrementoRendimiento}%</span>
                    </label>
                    <input type="range" min="-20" max="20" step="1" value={params.incrementoRendimiento} onChange={e => setParams({...params, incrementoRendimiento: Number(e.target.value)})} className="w-full accent-indigo-600" />
                  </div>
                </div>

                {/* Bloque: Operación */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 flex items-center border-b pb-2">
                    <ShieldAlert className="w-4 h-4 mr-2" /> Operación
                  </h3>
                  <div>
                    <label className="text-sm text-gray-600 flex justify-between">
                      <span>Disp. Operacional (%)</span>
                      <span className="font-bold">{params.dispOperacional}%</span>
                    </label>
                    <input type="range" min="50" max="100" step="1" value={params.dispOperacional} onChange={e => setParams({...params, dispOperacional: Number(e.target.value)})} className="w-full accent-orange-500" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 flex justify-between">
                      <span>Días Detención Planta</span>
                      <span className="font-bold">{params.diasDetencion}</span>
                    </label>
                    <input type="range" min="0" max="5" step="1" value={params.diasDetencion} onChange={e => setParams({...params, diasDetencion: Number(e.target.value)})} className="w-full accent-orange-500" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 flex justify-between">
                      <span>Hrs Perdidas / Turno</span>
                      <span className="font-bold">{params.horasPerdidasTurno} h</span>
                    </label>
                    <input type="range" min="0" max="4" step="0.5" value={params.horasPerdidasTurno} onChange={e => setParams({...params, horasPerdidasTurno: Number(e.target.value)})} className="w-full accent-orange-500" />
                  </div>
                </div>

              </div>

              {/* Barra de Progreso en Vivo */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Resultado Simulación</p>
                    <div className="flex items-baseline space-x-3">
                      <span className="text-4xl font-extrabold text-blue-900">{formatNum(simResults.tonProjFinal)}</span>
                      <span className="text-lg text-gray-500 font-medium">Toneladas</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${simResults.diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {simResults.diferencia >= 0 ? '+' : ''}{formatNum(simResults.diferencia)} T
                    </p>
                    <p className="text-sm text-gray-500">vs Meta ({formatNum(metaMensual)})</p>
                  </div>
                </div>

                <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden mt-3">
                  <div 
                    className={`absolute top-0 left-0 h-full flex items-center justify-end pr-2 text-xs font-bold text-white transition-all duration-500 ${simResults.cumplimiento >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, simResults.cumplimiento)}%` }}
                  >
                    {simResults.cumplimiento.toFixed(1)}%
                  </div>
                  {/* Meta Line */}
                  <div className="absolute top-0 bottom-0 left-[100%] border-l-2 border-dashed border-gray-800 z-10" />
                </div>
              </div>

              {/* Indicadores KPI */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Indicadores Proyectados</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <p className="text-gray-500 text-xs">Ton / Chofer / Turno</p>
                    <p className="font-bold text-blue-900">{formatNum(simResults.tonDiariaProj / Math.max(1, (params.choferesDia + params.choferesNoche)))}</p>
                  </div>
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <p className="text-gray-500 text-xs">Ton / Camión / Día</p>
                    <p className="font-bold text-blue-900">{formatNum(simResults.tonDiariaProj / Math.max(1, params.camionesDisp))}</p>
                  </div>
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <p className="text-gray-500 text-xs">Utilización Equipos</p>
                    <p className="font-bold text-blue-900">
                      {Math.min(100, ((params.choferesDia + params.choferesNoche) / (params.camionesDisp * 2)) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <p className="text-gray-500 text-xs">Días para Meta</p>
                    <p className="font-bold text-blue-900">
                      {simResults.tonDiariaProj > 0 ? formatNum(Math.max(0, metaMensual - realStats.tonAcu) / simResults.tonDiariaProj) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparador de Escenarios */}
          {escenarios.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparador de Escenarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Escenario</th>
                        <th className="py-2 px-3 font-semibold text-right">Toneladas</th>
                        <th className="py-2 px-3 font-semibold text-right">Cumplimiento</th>
                        <th className="py-2 px-3 font-semibold text-right">Diferencia</th>
                        <th className="py-2 px-3 font-semibold text-center">Choferes</th>
                        <th className="py-2 px-3 font-semibold text-center">Camiones</th>
                        <th className="py-2 px-3 font-semibold text-center">Vueltas/Ch.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr className="bg-blue-50/30">
                        <td className="py-2 px-3 font-medium text-gray-900">Proyección Base</td>
                        <td className="py-2 px-3 text-right font-semibold">{formatNum(baseProjection.tonProjFinal)} T</td>
                        <td className="py-2 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${baseProjection.cumplimiento >= 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {baseProjection.cumplimiento.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-gray-500">{formatNum(baseProjection.diferencia)} T</td>
                        <td className="py-2 px-3 text-center">-</td>
                        <td className="py-2 px-3 text-center">-</td>
                        <td className="py-2 px-3 text-center">-</td>
                      </tr>
                      {escenarios.map(esc => (
                        <tr key={esc.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setParams(esc.parametros)}>
                          <td className="py-2 px-3 font-medium text-blue-600">{esc.nombre}</td>
                          <td className="py-2 px-3 text-right font-semibold">{formatNum(esc.resultados.produccionProyectada)} T</td>
                          <td className="py-2 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${esc.resultados.cumplimiento >= 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {esc.resultados.cumplimiento.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-gray-500">{formatNum(esc.resultados.diferencia)} T</td>
                          <td className="py-2 px-3 text-center">{esc.parametros.choferesDia + esc.parametros.choferesNoche}</td>
                          <td className="py-2 px-3 text-center">{esc.parametros.camionesDisp}</td>
                          <td className="py-2 px-3 text-center">{esc.parametros.vueltasChofer}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

            </div>
          )}

          {activeTab === 'graficos' && (
          <div className="grid grid-cols-1 gap-6">
            
            {/* Acumulado Chart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                    <LineChartIcon className="w-4 h-4 text-gray-500" />
                    <span>Curva de Producción Acumulada</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setShowChartDetails(true)} className="h-7 text-xs">
                    <TableIcon className="w-3 h-3 mr-1" />
                    Ver Detalles
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-80 cursor-pointer" onClick={() => setShowChartDetails(true)}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => (v/1000000).toFixed(1) + 'M'} tick={{ fontSize: 10 }} />
                    <RechartsTooltip formatter={(val: number) => formatNum(val)} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    
                    <Line type="monotone" dataKey="metaLine" name="Meta Ideal" stroke="#94a3b8" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                    <Area type="monotone" dataKey="simulacion" name="Simulación" fill="#e0f2fe" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="real" name="Real" stroke="#1e40af" strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                    <span>Producción Diaria (Real vs Simulación)</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setShowChartDetails(true)} className="h-7 text-xs">
                    <TableIcon className="w-3 h-3 mr-1" />
                    Ver Detalles
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-80 cursor-pointer" onClick={() => setShowChartDetails(true)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={(v) => (v/1000).toFixed(0) + 'k'} tick={{ fontSize: 10 }} />
                    <RechartsTooltip formatter={(val: number) => formatNum(val)} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    
                    <Bar dataKey="dailyReal" name="Real" fill="#1e3a8a" radius={[2,2,0,0]} />
                    <Bar dataKey="dailySim" name="Simulado" fill="#7dd3fc" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          )}
        </div>
      </div>

      {/* Modal Detalles */}
      <Modal 
        isOpen={showChartDetails} 
        onClose={() => setShowChartDetails(false)} 
        title="Detalles de Simulación Diaria"
        size="4xl"
      >
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b sticky top-0 z-10">
              <tr>
                <th className="py-2 px-3 font-semibold">Día</th>
                <th className="py-2 px-3 font-semibold text-right border-l border-gray-200">Real (Día)</th>
                <th className="py-2 px-3 font-semibold text-right">Simulado (Día)</th>
                <th className="py-2 px-3 font-semibold text-right border-l border-gray-200">Acum. Real</th>
                <th className="py-2 px-3 font-semibold text-right">Acum. Simulado</th>
                <th className="py-2 px-3 font-semibold text-right text-gray-400">Meta Ideal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {chartData.map((row) => (
                <tr key={row.day} className={`hover:bg-gray-50 ${row.day === diasTranscurridos ? 'border-b-2 border-blue-400' : ''}`}>
                  <td className="py-1 px-3 font-medium text-gray-900">{row.day}</td>
                  <td className="py-1 px-3 text-right border-l border-gray-200">{row.dailyReal != null ? formatNum(row.dailyReal) : '-'}</td>
                  <td className="py-1 px-3 text-right text-blue-600 font-semibold">{row.dailySim != null ? formatNum(row.dailySim) : '-'}</td>
                  <td className="py-1 px-3 text-right border-l border-gray-200">{row.real != null ? formatNum(row.real) : '-'}</td>
                  <td className="py-1 px-3 text-right text-blue-600 font-semibold">{row.simulacion != null ? formatNum(row.simulacion) : '-'}</td>
                  <td className="py-1 px-3 text-right text-gray-400">{formatNum(row.metaLine)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-4 pt-4 border-t">
          <Button onClick={() => setShowChartDetails(false)}>Cerrar</Button>
        </div>
      </Modal>
    </div>
  );
}

function BadgeBtn({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
    >
      {label}
    </button>
  );
}
