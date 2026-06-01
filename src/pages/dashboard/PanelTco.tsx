import React, { useState, memo, useMemo } from 'react';
import { DollarSign, Filter, Calendar, FileText, FileSpreadsheet, TrendingDown, TrendingUp, Search, RefreshCw, X, ArrowRight, ChevronRight, BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Legend, ComposedChart, Brush
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../../context/AppContext';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
};

const formatCompactNumber = (number: number) => {
  return Intl.NumberFormat('es-CL', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(number);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl z-50">
        <p className="text-white font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
           if (entry.value === 0) return null;
           const entryKey = entry.dataKey || entry.name || `entry-${index}`;
           return (
            <div key={`tooltip-${index}-${entryKey}`} className="flex items-center justify-between gap-4 text-xs mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-300 capitalize">{entry.name}</span>
              </div>
              <span className="font-bold" style={{ color: entry.color }}>
                {entry.name.toLowerCase().includes('margen') 
                  ? `${entry.value}%` 
                  : entry.name.toLowerCase().includes('costo') && entry.value < 2000 
                    ? `$${entry.value}` 
                    : formatCurrency(entry.value)}
              </span>
            </div>
          )
        })}
      </div>
    );
  }
  return null;
};

const DesgloseChartInteractive = memo(({ data }: { data: any[] }) => {
  const [disabledSeries, setDisabledSeries] = useState<Record<string, boolean>>({});
  const handleLegendClick = (dataKey: string) => {
    setDisabledSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }} barSize={120}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.15} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 'bold' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'medium' }} tickFormatter={formatCompactNumber} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
        <Legend 
          wrapperStyle={{ fontSize: '11px', paddingTop: '20px', fontWeight: 'bold', cursor: 'pointer' }} 
          iconType="circle" 
          onClick={(e: any) => handleLegendClick(e.dataKey)} 
        />
        
        <Bar dataKey="combustible" stackId="a" fill="#38bdf8" name="Combustible" hide={disabledSeries['combustible']} fillOpacity={disabledSeries['combustible'] ? 0.3 : 1} />
        <Bar dataKey="peajes" stackId="a" fill="#c4b5fd" name="Peajes y Estacs." hide={disabledSeries['peajes']} />
        <Bar dataKey="salarios" stackId="a" fill="#fcd34d" name="Fijo (Seguros, Salarios)" hide={disabledSeries['salarios']} />
        <Bar dataKey="mantenimiento" stackId="a" fill="#fca5a5" name="Mantenimiento" hide={disabledSeries['mantenimiento']} />
        
        <Bar dataKey="ingresoContrato" stackId="b" fill="#a78bfa" name="Ingreso Fijo" hide={disabledSeries['ingresoContrato']} />
        <Bar dataKey="ingresoVariable" stackId="b" fill="#818cf8" name="Ingreso Variable" hide={disabledSeries['ingresoVariable']} />
      </BarChart>
    </ResponsiveContainer>
  );
});

const RentabilidadChartInteractive = memo(({ data }: { data: any[] }) => {
  const [disabledSeries, setDisabledSeries] = useState<Record<string, boolean>>({});
  const handleLegendClick = (dataKey: string) => {
    setDisabledSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} barGap={0} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.15} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'medium' }} tickFormatter={formatCompactNumber} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        <Legend 
          wrapperStyle={{ fontSize: '11px', paddingTop: '10px', paddingBottom: '20px', fontWeight: 'bold', cursor: 'pointer' }} 
          iconType="rect" 
          verticalAlign="bottom"
          onClick={(e: any) => handleLegendClick(e.dataKey)}
          payload={[
            { value: 'Ingreso por Contrato', type: 'rect', id: 'ingresoContrato', color: '#93c5fd' },
            { value: 'Costo Fijo (Seguros, Salarios)', type: 'rect', id: 'costoFijo', color: '#a7f3d0' },
            { value: 'Combustible', type: 'rect', id: 'combustible', color: '#fca5a5' },
            { value: 'Neumáticos', type: 'rect', id: 'neumaticos', color: '#fdba74' },
            { value: 'Peajes y Estacionamientos', type: 'rect', id: 'peajes', color: '#f9a8d4' },
            { value: 'Lubricantes y Fluidos', type: 'rect', id: 'lubricantes', color: '#6ee7b7' },
            { value: 'Costo Extraordinario (Multas)', type: 'rect', id: 'extraordinario', color: '#d6d3d1' },
            { value: 'Mantenimiento Preventivo', type: 'rect', id: 'mttoPreventivo', color: '#bae6fd' },
            { value: 'Mantenimiento Correctivo', type: 'rect', id: 'mttoCorrectivo', color: '#86efac' },
            { value: 'Mantenimiento Evaluativo', type: 'rect', id: 'mttoEvaluativo', color: '#818cf8' }
          ]}
        />
        <Bar dataKey="ingresoContrato" stackId="a" fill="#93c5fd" name="Ingreso por Contrato" hide={disabledSeries['ingresoContrato']} />
        <Bar dataKey="costoFijo" stackId="a" fill="#a7f3d0" name="Costo Fijo (Seguros, Salarios)" hide={disabledSeries['costoFijo']} />
        <Bar dataKey="combustible" stackId="a" fill="#fca5a5" name="Combustible" hide={disabledSeries['combustible']} />
        <Bar dataKey="neumaticos" stackId="a" fill="#fdba74" name="Neumáticos" hide={disabledSeries['neumaticos']} />
        <Bar dataKey="peajes" stackId="a" fill="#f9a8d4" name="Peajes y Estacionamientos" hide={disabledSeries['peajes']} />
        <Bar dataKey="lubricantes" stackId="a" fill="#6ee7b7" name="Lubricantes y Fluidos" hide={disabledSeries['lubricantes']} />
        <Bar dataKey="extraordinario" stackId="a" fill="#d6d3d1" name="Costo Extraordinario (Multas)" hide={disabledSeries['extraordinario']} />
        <Bar dataKey="mttoPreventivo" stackId="a" fill="#bae6fd" name="Mantenimiento Preventivo" hide={disabledSeries['mttoPreventivo']} />
        <Bar dataKey="mttoCorrectivo" stackId="a" fill="#86efac" name="Mantenimiento Correctivo" hide={disabledSeries['mttoCorrectivo']} />
        <Bar dataKey="mttoEvaluativo" stackId="a" fill="#818cf8" name="Mantenimiento Evaluativo" hide={disabledSeries['mttoEvaluativo']} />
        <Brush dataKey="name" height={30} stroke="#cbd5e1" fill="#f8fafc" travellerWidth={10} tickFormatter={() => ''} className="dark:fill-slate-800 dark:stroke-slate-700" />
      </BarChart>
    </ResponsiveContainer>
  );
});

export default function PanelTco() {
  const { ordenesTrabajo, vehiculos } = useAppContext();
  const [showFilters, setShowFilters] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const simulateFiltering = () => {
    setIsFiltering(true);
    setTimeout(() => setIsFiltering(false), 600);
  };

  const {
    kpis,
    desgloseData,
    rentabilidadVehiculo,
    distribucionCostos,
    evolucionMensual,
    mantenimientoTipo,
    costoPorKm,
    margenMarca,
    costosRuta,
    proyeccionPresupuesto
  } = useMemo(() => {
    let costosTotales = 0;
    
    // Costo de Mantenimiento Prev / Corr / Eva
    let mttoPrev = 0;
    let mttoCorr = 0;
    let mttoEva = 0;

    const vStats: Record<string, {
      prev: number, corr: number, eva: number, totalCosto: number
    }> = {};

    vehiculos.forEach(v => {
      vStats[v.id] = { prev: 0, corr: 0, eva: 0, totalCosto: 0 };
    });

    ordenesTrabajo.forEach(ot => {
      const costo = (ot.costoManoObraTareas || 0) + (ot.costoInsumos || 0) + (ot.costoManoObraHH || 0);
      costosTotales += costo;
      
      let tipo = ot.tipo.includes('PREVENTIVA') ? 'PREV' : (ot.tipo.includes('CORRECTIVA') ? 'CORR' : 'EVA');
      if (tipo === 'PREV') mttoPrev += costo;
      else if (tipo === 'CORR') mttoCorr += costo;
      else mttoEva += costo;

      const vid = ot.vehiculoId || ot.vehiculo_id;
      if (vid && vStats[vid]) {
        vStats[vid].totalCosto += costo;
        if (tipo === 'PREV') vStats[vid].prev += costo;
        else if (tipo === 'CORR') vStats[vid].corr += costo;
        else vStats[vid].eva += costo;
      }
    });

    // Let's invent some fixed / fuel / income values proportionally just to show TCO
    const ingresoFijo = costosTotales * 1.5; 
    const ingresoVariable = costosTotales * 0.3;
    const ingresosTotales = ingresoFijo + ingresoVariable;
    
    // Other fixed costs
    const combustible = costosTotales * 0.4;
    const salarios = costosTotales * 0.3;
    const peajes = costosTotales * 0.1;
    costosTotales += combustible + salarios + peajes;
    
    const utilidadBruta = ingresosTotales - costosTotales;
    const margen = ingresosTotales > 0 ? (utilidadBruta / ingresosTotales) * 100 : 0;

    const desgloseData = [
      {
        name: 'Costos vs Ingresos',
        combustible,
        peajes,
        salarios,
        mantenimiento: mttoPrev + mttoCorr + mttoEva,
        ingresoContrato: ingresoFijo,
        ingresoVariable
      }
    ];

    const rentabilidadVehiculo = vehiculos.slice(0, 8).map(v => {
      const vs = vStats[v.id] || { prev: 0, corr: 0, eva: 0, totalCosto: 0 };
      const baseCost = vs.totalCosto || 1000000;
      return {
        name: v.patente || v.modelo || `Vehículo ${v.id}`,
        ingresoContrato: baseCost * 1.5,
        costoFijo: baseCost * 0.2,
        combustible: baseCost * 0.3,
        neumaticos: baseCost * 0.05,
        peajes: baseCost * 0.05,
        lubricantes: baseCost * 0.02,
        extraordinario: 0,
        mttoPreventivo: vs.prev,
        mttoCorrectivo: vs.corr,
        mttoEvaluativo: vs.eva
      };
    });

    const distribucionCostos = [
      { name: 'Mantenimiento', value: (mttoPrev + mttoCorr + mttoEva) || 1, color: '#fca5a5' },
      { name: 'Combustible', value: combustible || 1, color: '#f87171' },
      { name: 'Salarios y Seguros', value: salarios || 1, color: '#fcd34d' },
      { name: 'Peajes/Infra', value: peajes || 1, color: '#c4b5fd' }
    ];

    const evolucionMensual = [
      { month: 'Ene', ingresos: 12000000, costos: 8000000 },
      { month: 'Feb', ingresos: 12500000, costos: 8200000 },
      { month: 'Mar', ingresos: 13000000, costos: 8500000 },
      { month: 'Abr', ingresos: 12800000, costos: 8400000 },
      { month: 'May', ingresos: 13500000, costos: 8800000 },
      { month: 'Jun', ingresos: 14000000, costos: 9200000 },
      { month: 'Jul', ingresos: 14500000, costos: 9500000 },
      { month: 'Ago', ingresos: 15000000, costos: 9800000 },
    ];

    const costoPorKm = [
      { month: 'Ene', costo: 450 }, { month: 'Feb', costo: 460 },
      { month: 'Mar', costo: 455 }, { month: 'Abr', costo: 440 },
      { month: 'May', costo: 450 }, { month: 'Jun', costo: 465 },
      { month: 'Jul', costo: 470 }, { month: 'Ago', costo: 460 }
    ];

    const margenMarca = [
      { name: 'Scania', margen: 28 },
      { name: 'Volvo', margen: 25 },
      { name: 'Mercedes', margen: 22 },
      { name: 'Freightliner', margen: 19 }
    ];

    const costosRuta = [
      { name: 'Norte Grande', costo: 25000000 },
      { name: 'Sur Austral', costo: 18000000 },
      { name: 'Centro Costa', costo: 12000000 }
    ];

    const proyeccionPresupuesto = [
      { month: 'Ene', presupuesto: 7500000, real: 7200000 },
      { month: 'Feb', presupuesto: 7500000, real: 7600000 },
      { month: 'Mar', presupuesto: 8000000, real: 8100000 },
      { month: 'Abr', presupuesto: 8000000, real: 7900000 },
      { month: 'May', presupuesto: 8500000, real: 8600000 },
      { month: 'Jun', presupuesto: 8500000, real: 8900000 },
      { month: 'Jul', presupuesto: 9000000, real: 9400000 },
    ];

    return {
      kpis: {
        ingresosTotales,
        costosTotales,
        utilidadBruta,
        margen: margen.toFixed(1)
      },
      desgloseData,
      rentabilidadVehiculo,
      distribucionCostos,
      evolucionMensual,
      mantenimientoTipo: [],
      costoPorKm,
      margenMarca,
      costosRuta,
      proyeccionPresupuesto
    };
  }, [ordenesTrabajo, vehiculos]);

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto space-y-6 relative min-h-screen">
      
      <AnimatePresence>
        {isFiltering && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-[2px] rounded-3xl flex items-center justify-center transition-all"
          >
             <div className="flex flex-col items-center gap-3 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl">
               <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
               <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Actualizando indicadores...</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Panel TCO Financiero</h1>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1.5 flex items-center gap-2">
              Analiza los ingresos, costos y utilidad de tu flota 
              <ChevronRight className="w-3 h-3" />
              <span className="text-blue-500 dark:text-blue-400">Total Control</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              showFilters 
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-b dark:border-slate-800lue-500/20' 
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-800'
            }`}
          >
            <Filter className={`w-4 h-4 ${showFilters ? 'text-blue-500' : 'text-slate-400'}`} />
            Filtros Avanzados
          </button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block"></div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-800 shadow-sm">
            <FileText className="w-4 h-4 text-red-500" />
            PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-800 shadow-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Exportar
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Fecha de Inicio</label>
                  <div className="relative">
                    <input type="date" defaultValue="2025-11-05" onChange={simulateFiltering} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-b dark:border-slate-800lue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Fecha de Fin</label>
                  <div className="relative">
                    <input type="date" defaultValue="2026-11-05" onChange={simulateFiltering} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-b dark:border-slate-800lue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                  </div>
                </div>
                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Contrato</label>
                  <select onChange={simulateFiltering} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-b dark:border-slate-800lue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none">
                    <option>Todos los Contratos</option>
                    <option>Contrato Norte</option>
                    <option>Contrato Sur</option>
                  </select>
                </div>
                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Marca</label>
                  <select onChange={simulateFiltering} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-b dark:border-slate-800lue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none">
                    <option>Todas</option>
                    <option>Volvo</option>
                    <option>Scania</option>
                  </select>
                </div>
                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Modelo</label>
                  <select onChange={simulateFiltering} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-b dark:border-slate-800lue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none">
                    <option>Todos</option>
                  </select>
                </div>
                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Ruta</label>
                  <select onChange={simulateFiltering} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-b dark:border-slate-800lue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none">
                    <option>Todas</option>
                    <option>Norte Grande</option>
                  </select>
                </div>
                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Tipo de Mantención</label>
                  <select onChange={simulateFiltering} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-b dark:border-slate-800lue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none">
                    <option>Todas</option>
                    <option>Preventiva</option>
                  </select>
                </div>
                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Razón Social</label>
                  <select onChange={simulateFiltering} className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-b dark:border-slate-800lue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none">
                    <option>Todas</option>
                  </select>
                </div>
                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors lg:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Vehículos (opcional)</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Buscar patente o ID de vehículo..." 
                      onChange={(e) => {
                        if (e.target.value.length > 2 || e.target.value.length === 0) simulateFiltering();
                      }}
                      className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-b dark:border-slate-800lue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:font-medium placeholder:text-slate-400" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: "Ingresos Totales", value: formatCurrency(kpis.ingresosTotales), color: "text-emerald-500 dark:text-emerald-400", decoration: "bg-emerald-500" },
          { label: "Costos Totales", value: formatCurrency(kpis.costosTotales), color: "text-rose-500 dark:text-rose-400", decoration: "bg-rose-500" },
          { label: "Utilidad Bruta", value: formatCurrency(kpis.utilidadBruta), color: "text-blue-600 dark:text-blue-400", decoration: "bg-blue-600" },
          { label: "Margen Operativo", value: `${kpis.margen}%`, color: "text-indigo-600 dark:text-indigo-400", decoration: "bg-indigo-600" },
        ].map((kpi, index) => (
          <div key={`kpi-${kpi.label}-${index}`} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${kpi.decoration} opacity-80`} />
            <div className="flex flex-col h-full justify-center">
              <p className="text-[10px] md:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">{kpi.label}</p>
              <h2 className={`text-2xl lg:text-3xl xl:text-4xl font-black ${kpi.color} tracking-tight`}>{kpi.value}</h2>
            </div>
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${kpi.decoration} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 lg:p-8 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <BarChart2 className="w-32 h-32 text-slate-900 dark:text-white" />
          </div>
          <div className="flex justify-between items-center mb-8 relative z-10 w-full">
            <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Desglose Ingresos y Costos</h3>
            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full whitespace-nowrap">CLP Totales</span>
          </div>
          <div className="h-[380px] w-full relative z-10">
            <DesgloseChartInteractive data={desgloseData} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 lg:p-8 flex flex-col relative overflow-hidden xl:col-span-2">
          <div className="flex justify-between items-center mb-8 relative z-10 w-full">
            <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Rentabilidad por Vehículo</h3>
            <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full whitespace-nowrap">Por Kilómetro y Viaje</span>
          </div>
          <div className="h-[460px] w-full relative z-10 pb-4">
            <RentabilidadChartInteractive data={rentabilidadVehiculo} />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 lg:p-8 flex flex-col xl:col-span-3">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Proyección vs Presupuesto</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Comparativa de ejecución real versus presupuesto asignado (12 meses)</p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full self-start md:self-auto">Gasto Operativo</span>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={proyeccionPresupuesto} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.15} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'medium' }} tickFormatter={formatCompactNumber} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px', fontWeight: 'bold' }} iconType="circle" />
                <Bar dataKey="presupuesto" fill="#e2e8f0" fillOpacity={0.8} name="Presupuesto Asignado" radius={[4,4,0,0]} barSize={40} className="dark:fill-slate-800" />
                <Line type="monotone" dataKey="real" stroke="#6366f1" strokeWidth={4} dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} name="Gasto Real Ejecutado" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 lg:p-8 flex flex-col xl:col-span-2">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Histórico Ingresos vs Costos</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolucionMensual} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCostos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.15} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'medium' }} tickFormatter={formatCompactNumber} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px', fontWeight: 'bold' }} iconType="circle" />
                <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" name="Ingresos" />
                <Area type="monotone" dataKey="costos" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorCostos)" name="Costos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 lg:p-8 flex flex-col items-center justify-center relative">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight self-start mb-2">Composición del Gasto</h3>
          <div className="flex-1 w-full min-h-[260px]">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribucionCostos}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="80%"
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  className="outline-none"
                >
                  {distribucionCostos.map((entry, index) => (
                    <Cell key={`pie-cell-${entry.name}-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 lg:p-8 flex flex-col">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Costo prom. por KM</h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costoPorKm} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.15} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} dy={10} />
                <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'medium' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="costo" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} name="Costo Medio / Km" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 lg:p-8 flex flex-col">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Inversión por Ruta</h3>
          <div className="h-[220px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costosRuta} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#64748b" opacity={0.15} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'medium' }} tickFormatter={formatCompactNumber} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} width={85} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="costo" fill="#f43f5e" name="Costo Total" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-6 lg:p-8 flex flex-col">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Eficiencia M. por Marca</h3>
          <div className="h-[220px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={margenMarca} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#64748b" opacity={0.15} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'medium' }} domain={[0, 100]} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} width={80} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="margen" fill="#0ea5e9" name="Margen %" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
