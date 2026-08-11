import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useProduccion } from '../../../contexts/ProduccionContext';
import { 
  TrendingUp, Calendar, Filter, User, Truck, BarChart3, 
  Activity, Users, Map, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function ReporteYAnaliticaMina() {
  const { metas } = useProduccion();
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<any[]>([]);

  // Filters
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroAno, setFiltroAno] = useState<string>('2026');
  const [filtroTurno, setFiltroTurno] = useState<string>('todos');
  const [filtroSupervisor, setFiltroSupervisor] = useState<string>('todos');
  const [filtroEquipo, setFiltroEquipo] = useState<string>('todos');

  // Tabs
  const [activeTab, setActiveTab] = useState<'produccion' | 'equipos' | 'personal' | 'gestion'>('produccion');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produccion_registro_diario_mina')
        .select('*')
        .order('fecha', { ascending: true });
        
      if (error && error.code !== '42P01') {
        console.error("Error fetching data:", error);
      }
      
      if (data) {
        setRawData(data);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const filteredData = useMemo(() => {
    return rawData.filter(row => {
      if (!row.fecha) return false;
      const date = new Date(row.fecha);
      
      // We parse the date manually assuming YYYY-MM-DD
      const [yearStr, monthStr] = row.fecha.split('-');
      
      const passAno = filtroAno === 'todos' || yearStr === filtroAno;
      const passMes = filtroMes === 'todos' || monthStr === filtroMes.padStart(2, '0');
      const passTurno = filtroTurno === 'todos' || row.turno === filtroTurno;
      const passEquipo = filtroEquipo === 'todos' || row.equipo === filtroEquipo;
      
      // Para supervisor, si row.equipo === SUPERVISOR_TURNO, el operador es el supervisor.
      // Pero si queremos filtrar *toda la producción* de ese supervisor, necesitamos mapearlo.
      // Simplificaremos permitiendo filtrar por operador si no tenemos la info completa.
      const passSupervisor = filtroSupervisor === 'todos' || row.operador === filtroSupervisor;
      
      return passAno && passMes && passTurno && passEquipo && passSupervisor;
    });
  }, [rawData, filtroAno, filtroMes, filtroTurno, filtroEquipo, filtroSupervisor]);

  // --- KPI CALCULATIONS ---
  const totalToneladas = filteredData.reduce((acc, row) => acc + (Number(row.tonelaje) || 0), 0);
  const totalVueltas = filteredData.reduce((acc, row) => acc + (Number(row.vueltas) || 0), 0);
  const avgTonVuelta = totalVueltas > 0 ? totalToneladas / totalVueltas : 0;
  
  const caexUtilizados = new Set(filteredData.filter(r => r.equipo && r.equipo.toUpperCase().includes('CAEX')).map(r => r.equipo)).size;
  
  // Real Cumplimiento based on meta
  const metaToneladas = metas.minaMonthly;
  const cumplimiento = metaToneladas > 0 ? (totalToneladas / metaToneladas) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filters */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Analítica de Producción Mina
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Dashboard ejecutivo y control de indicadores</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select 
            value={filtroAno} 
            onChange={(e) => setFiltroAno(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="todos">Todos los años</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <select 
            value={filtroMes} 
            onChange={(e) => setFiltroMes(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="todos">Todos los meses</option>
            <option value="01">Enero</option>
            <option value="02">Febrero</option>
            <option value="03">Marzo</option>
            <option value="04">Abril</option>
            <option value="05">Mayo</option>
            <option value="06">Junio</option>
            <option value="07">Julio</option>
            <option value="08">Agosto</option>
            <option value="09">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>
          
          <select 
            value={filtroEquipo} 
            onChange={(e) => setFiltroEquipo(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="todos">Todos los equipos</option>
            {Array.from(new Set(rawData.filter(r => r.equipo && !['REPORTE_COMPAÑIA', 'SUPERVISOR_TURNO'].includes(r.equipo)).map(r => r.equipo))).sort().map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <select 
            value={filtroSupervisor} 
            onChange={(e) => setFiltroSupervisor(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="todos">Todos los operadores/sup</option>
            {Array.from(new Set(rawData.filter(r => r.operador).map(r => r.operador))).sort().map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <select 
            value={filtroTurno} 
            onChange={(e) => setFiltroTurno(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="todos">Todos los turnos</option>
            <option value="Día">Día</option>
            <option value="Noche">Noche</option>
          </select>
        </div>
      </div>

      {/* Main KPIs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-blue-500">
          <p className="text-xs font-bold text-slate-500 uppercase">Toneladas Totales</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{formatNumber(totalToneladas)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold text-slate-500 uppercase">Vueltas Totales</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{formatNumber(totalVueltas)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-slate-500 uppercase">Promedio Ton/Vuelta</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{formatNumber(avgTonVuelta)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-purple-500">
          <p className="text-xs font-bold text-slate-500 uppercase">CAEX Utilizados</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{caexUtilizados}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-indigo-500">
          <p className="text-xs font-bold text-slate-500 uppercase">Cumplimiento</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{cumplimiento.toFixed(1)}%</p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-1">
        <button
          onClick={() => setActiveTab('produccion')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'produccion' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Producción
        </button>
        <button
          onClick={() => setActiveTab('equipos')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'equipos' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" /> Equipos
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'personal' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Personal
        </button>
        <button
          onClick={() => setActiveTab('gestion')}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'gestion' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" /> Gestión
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'produccion' && <TabProduccion data={filteredData} formatNumber={formatNumber} meta={metaToneladas} cumplimiento={cumplimiento} />}
      {activeTab === 'equipos' && <TabEquipos data={filteredData} formatNumber={formatNumber} COLORS={COLORS} />}
      {activeTab === 'personal' && <TabPersonal data={filteredData} formatNumber={formatNumber} />}
      {activeTab === 'gestion' && <TabGestion data={filteredData} formatNumber={formatNumber} totalToneladas={totalToneladas} />}

    </div>
  );
}

function TabProduccion({ data, formatNumber, meta, cumplimiento }: { data: any[], formatNumber: (n: number) => string, meta: number, cumplimiento: number }) {
  // Chart 1: Daily Production Line
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => {
      const ton = Number(r.tonelaje) || 0;
      if (r.fecha && r.equipo !== 'REPORTE_COMPAÑIA' && r.equipo !== 'SUPERVISOR_TURNO') {
        map[r.fecha] = (map[r.fecha] || 0) + ton;
      }
    });
    return Object.entries(map).map(([fecha, ton]) => ({ fecha, ton })).sort((a,b) => a.fecha.localeCompare(b.fecha));
  }, [data]);

  // Chart 2: Shift Distribution
  const shiftData = useMemo(() => {
    const map: Record<string, number> = { 'Día': 0, 'Noche': 0 };
    data.forEach(r => {
      const ton = Number(r.tonelaje) || 0;
      if (r.turno && map[r.turno] !== undefined && r.equipo !== 'REPORTE_COMPAÑIA' && r.equipo !== 'SUPERVISOR_TURNO') {
        map[r.turno] += ton;
      }
    });
    return [
      { name: 'Día', value: map['Día'] },
      { name: 'Noche', value: map['Noche'] }
    ];
  }, [data]);
  
  const totalShift = shiftData.reduce((acc, s) => acc + s.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase mb-4">Producción Diaria (Toneladas)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="fecha" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} 
                tickFormatter={(val) => {
                  const parts = val.split('-');
                  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : val;
                }}
              />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} 
                tickFormatter={(val) => `${val / 1000}k`}
              />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${formatNumber(value)} T`, 'Tonelaje']}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Line type="monotone" dataKey="ton" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase mb-4">Distribución por Turno</h3>
        <div className="flex-1 flex flex-col justify-center">
          <div className="space-y-4">
            {shiftData.map((shift, i) => {
              const pct = totalShift > 0 ? (shift.value / totalShift) * 100 : 0;
              return (
                <div key={shift.name}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{shift.name}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold">{formatNumber(shift.value)} T</span>
                      <span className="text-xs text-slate-500 ml-2">({pct.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${shift.name === 'Día' ? 'bg-amber-400' : 'bg-indigo-600'}`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase mb-4">Producción Acumulada vs Meta</h3>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <div className="absolute top-0 bottom-0 left-0 bg-emerald-500" style={{ width: `${Math.min(cumplimiento, 100)}%` }}></div>
          </div>
          <div className="text-right w-32">
            <span className="text-lg font-black text-slate-800 dark:text-white">{cumplimiento.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 font-medium">
          <span>0 T</span>
          <span>Meta: {formatNumber(meta)} T</span>
        </div>
      </div>
    </div>
  );
}

function TabEquipos({ data, formatNumber, COLORS }: { data: any[], formatNumber: (n: number) => string, COLORS: string[] }) {
  const equiposData = useMemo(() => {
    const map: Record<string, { ton: number, vueltas: number }> = {};
    data.forEach(r => {
      const eq = r.equipo;
      const ton = Number(r.tonelaje) || 0;
      const vueltas = Number(r.vueltas) || 0;
      
      if (eq && eq.toUpperCase().includes('CAEX')) {
        if (!map[eq]) map[eq] = { ton: 0, vueltas: 0 };
        map[eq].ton += ton;
        map[eq].vueltas += vueltas;
      }
    });
    
    return Object.entries(map)
      .map(([name, vals]) => ({ 
        name, 
        tonelaje: vals.ton, 
        vueltas: vals.vueltas,
        promedio: vals.vueltas > 0 ? vals.ton / vals.vueltas : 0
      }))
      .sort((a,b) => b.tonelaje - a.tonelaje);
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase mb-4">Toneladas por Equipo</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={equiposData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={80} />
              <RechartsTooltip 
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${formatNumber(value)} T`, 'Tonelaje']}
              />
              <Bar dataKey="tonelaje" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase mb-4">Promedio Ton/Vuelta por Equipo</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={[...equiposData].sort((a,b) => b.promedio - a.promedio)} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, 70]} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={80} />
              <RechartsTooltip 
                cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${value.toFixed(1)} T/V`, 'Promedio']}
              />
              <Bar dataKey="promedio" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function TabPersonal({ data, formatNumber }: { data: any[], formatNumber: (n: number) => string }) {
  // Production by operator
  const operadoresData = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(r => {
      const op = r.operador;
      const ton = Number(r.tonelaje) || 0;
      if (op && op !== 'Desconocido' && r.equipo !== 'SUPERVISOR_TURNO' && r.equipo !== 'REPORTE_COMPAÑIA') {
        map[op] = (map[op] || 0) + ton;
      }
    });
    return Object.entries(map).map(([name, ton]) => ({ name, ton })).sort((a,b) => b.ton - a.ton).slice(0, 10); // Top 10
  }, [data]);

  // Production by supervisor (using SUPERVISOR_TURNO records or inferred from notes if needed, but let's assume we can map from data)
  // For now we just mock or extract if possible. The app has SUPERVISOR_TURNO rows where 'operador' is the supervisor.
  // Wait, let's look for SUPERVISOR_TURNO entries.
  const supervisorData = useMemo(() => {
    const map: Record<string, number> = {};
    const supervisorByDateShift: Record<string, string> = {};
    
    // First pass: identify supervisor for each date/shift
    data.forEach(r => {
      if (r.equipo === 'SUPERVISOR_TURNO' && r.operador) {
        supervisorByDateShift[`${r.fecha}-${r.turno}`] = r.operador;
      }
    });
    
    // Second pass: assign tons to that supervisor
    data.forEach(r => {
      if (r.equipo !== 'REPORTE_COMPAÑIA' && r.equipo !== 'SUPERVISOR_TURNO') {
        const sup = supervisorByDateShift[`${r.fecha}-${r.turno}`] || 'Sin Supervisor';
        const ton = Number(r.tonelaje) || 0;
        map[sup] = (map[sup] || 0) + ton;
      }
    });
    
    return Object.entries(map).map(([name, ton]) => ({ name, ton })).sort((a,b) => b.ton - a.ton);
  }, [data]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase mb-4">Top 10 Operadores (Toneladas)</h3>
        <div className="space-y-3 mt-4">
          {operadoresData.map((op, idx) => {
            const max = operadoresData[0]?.ton || 1;
            const pct = (op.ton / max) * 100;
            return (
              <div key={op.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400 w-4 inline-block">{idx + 1}.</span> {op.name}
                  </span>
                  <span className="font-bold">{formatNumber(op.ton)} T</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            )
          })}
          {operadoresData.length === 0 && <p className="text-sm text-slate-500">No hay datos de operadores.</p>}
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase mb-4">Producción por Supervisor</h3>
        <div className="space-y-4 mt-4">
          {supervisorData.map((sup) => {
            const max = supervisorData[0]?.ton || 1;
            const pct = (sup.ton / max) * 100;
            return (
              <div key={sup.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{sup.name}</span>
                  <span className="font-bold">{formatNumber(sup.ton)} T</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3">
                  <div className="bg-indigo-500 h-3 rounded-full" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            )
          })}
          {supervisorData.length === 0 && <p className="text-sm text-slate-500">No hay datos de supervisores.</p>}
        </div>
      </div>
    </div>
  );
}

function TabGestion({ data, formatNumber, totalToneladas }: { data: any[], formatNumber: (n: number) => string, totalToneladas: number }) {
  // Reconciliation: Supervisor vs Company
  const { metas } = useProduccion();
  
  // Calculate Proyección
  const proyeccion = useMemo(() => {
    // Basic projection: Avg daily tons * 30 days
    const uniqueDays = new Set(data.map(d => d.fecha).filter(Boolean)).size;
    if (uniqueDays === 0) return 0;
    const avgDaily = totalToneladas / uniqueDays;
    return avgDaily * 30; // approx 30 days in month
  }, [data, totalToneladas]);

  const concilData = useMemo(() => {
    const map: Record<string, { supervisor: number, compania: number }> = {};
    
    data.forEach(r => {
      const key = `${r.fecha}-${r.turno}`;
      if (!map[key]) map[key] = { supervisor: 0, compania: 0 };
      
      if (r.equipo === 'REPORTE_COMPAÑIA') {
        map[key].compania += Number(r.tonelaje) || 0;
      } else if (r.equipo !== 'SUPERVISOR_TURNO') {
        map[key].supervisor += Number(r.tonelaje) || 0;
      }
    });
    
    return Object.entries(map).map(([key, vals]) => {
      const diff = vals.supervisor - vals.compania;
      return {
        key,
        fecha: key.split('-').slice(0,3).join('-'),
        turno: key.split('-')[3],
        supervisor: vals.supervisor,
        compania: vals.compania,
        diferencia: diff,
        hasCompania: vals.compania > 0
      };
    }).filter(x => x.hasCompania).sort((a,b) => a.key.localeCompare(b.key));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Reportes Conciliados</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{concilData.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Diferencia Total (Ton)</p>
          <p className="text-2xl font-black text-amber-500 mt-1">
            {formatNumber(concilData.reduce((acc, r) => acc + r.diferencia, 0))}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase">Proyección Cierre Mes</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{formatNumber(proyeccion)} <span className="text-sm font-normal text-slate-500">Ton (Proy)</span></p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase">Historial de Conciliaciones</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha - Turno</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Supervisor</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Compañía</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {concilData.map(row => (
                <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {row.fecha} <span className="text-slate-400 text-xs ml-1 bg-slate-100 dark:bg-slate-700 px-1.5 rounded">{row.turno}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{formatNumber(row.supervisor)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">{formatNumber(row.compania)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      row.diferencia > 0 ? 'bg-emerald-100 text-emerald-700' : 
                      row.diferencia < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {row.diferencia > 0 ? '+' : ''}{formatNumber(row.diferencia)} T
                    </span>
                  </td>
                </tr>
              ))}
              {concilData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No hay conciliaciones registradas (Reporte Compañía vs Supervisor).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
