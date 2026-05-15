import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const dataTendencia = [
  { name: 'Ene', value: 88 },
  { name: 'Feb', value: 92 },
  { name: 'Mar', value: 90 },
  { name: 'Abr', value: 95 },
  { name: 'May', value: 93 },
  { name: 'Jun', value: 94 },
];

const dataEstrategia = [
  { name: 'Preventivo', value: 72 },
  { name: 'Correctivo', value: 28 },
];
const COLORS = ['#3b82f6', '#ef4444']; 

const dataCostos = [
  { name: 'Ene', corr: 2500, prev: 4100 },
  { name: 'Feb', corr: 1500, prev: 3000 },
  { name: 'Mar', corr: 5000, prev: 2400 },
  { name: 'Abr', corr: 4000, prev: 2800 },
  { name: 'May', corr: 5000, prev: 2000 },
  { name: 'Jun', corr: 2800, prev: 3400 },
];

const dataCuellos = [
  { name: 'Otros', value: 10 },
  { name: 'Aprobación Ppto', value: 15 },
  { name: 'Falta Mano Obra', value: 35 },
  { name: 'Taller Externo', value: 65 },
  { name: 'Falta Repuestos', value: 95 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [fechaDesde, setFechaDesde] = useState('2023-10-01');
  const [fechaHasta, setFechaHasta] = useState('2023-10-31');
  
  const [tendenciaData, setTendenciaData] = useState(dataTendencia);
  const [costosData, setCostosData] = useState(dataCostos);

  const handleFilter = () => {
    // Simulate filtering by randomly slightly modifying values 
    // to give feedback that filtering worked.
    const factor = Math.random() * 0.2 + 0.9; // 0.9 - 1.1
    setTendenciaData(dataTendencia.map(d => ({ ...d, value: Math.min(100, Math.round(d.value * factor)) })));
    setCostosData(dataCostos.map(d => ({ ...d, corr: Math.round(d.corr * factor), prev: Math.round(d.prev * (2 - factor)) })));
  };

  const currentHour = new Date().getHours();
  let greeting = 'Buenos días';
  if (currentHour >= 12 && currentHour < 19) {
    greeting = 'Buenas tardes';
  } else if (currentHour >= 19) {
    greeting = 'Buenas noches';
  }
  
  const userName = 'Usuario'; // Could be dynamic from context

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bienvenido, {userName}</h1>
          <p className="text-slate-500 text-sm mt-1">Indicadores clave de rendimiento y salud operativa</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex border border-slate-200 bg-white rounded-md overflow-hidden">
            <div className="px-3 py-2 flex items-center border-r border-slate-200">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Desde</span>
                <input 
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="text-sm font-medium text-slate-700 bg-transparent outline-none p-0 border-none focus:ring-0"
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
                  className="text-sm font-medium text-slate-700 bg-transparent outline-none p-0 border-none focus:ring-0"
                />
              </div>
            </div>
          </div>
          <button 
            onClick={handleFilter}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-md transition-colors"
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
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">Disponibilidad Flota</span>
              <span className="text-2xl font-bold text-slate-800 mt-1">94.2%</span>
            </div>
            <div className="bg-emerald-50 text-emerald-500 p-2 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            2.1% <span className="text-slate-400 font-normal ml-1">vs mes anterior</span>
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => navigate('/flota/mantenimiento')}
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">Cumplimiento Prev.</span>
              <span className="text-2xl font-bold text-slate-800 mt-1">87.5%</span>
            </div>
            <div className="bg-blue-50 text-blue-500 p-2 rounded-lg">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
            1.5% <span className="text-slate-400 font-normal ml-1">vs mes anterior</span>
          </div>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => navigate('/dashboard/tco')}
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">Gasto Mensual</span>
              <span className="text-2xl font-bold text-slate-800 mt-1">$ 8.4M</span>
            </div>
            <div className="bg-amber-50 text-amber-500 p-2 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-rose-500">
            <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
            5.4% <span className="text-slate-400 font-normal ml-1">vs mes anterior</span>
          </div>
        </div>

        {/* Card 4 */}
        <div 
          onClick={() => navigate('/operaciones/alertas')}
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between h-32 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">Alertas Críticas</span>
              <span className="text-2xl font-bold text-slate-800 mt-1">2</span>
            </div>
            <div className="bg-rose-50 text-rose-500 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-rose-500">
            <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
            2 veh <span className="text-slate-400 font-normal ml-1">vs mes anterior</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div 
          onClick={() => navigate('/dashboard/kpi-flota')}
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 lg:col-span-2 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Tendencia de Disponibilidad</h3>
              <p className="text-xs text-slate-500">Evolución semestral vs Meta</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">
              Meta: 95%
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tendenciaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[80, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <ReferenceLine y={95} stroke="#94a3b8" strokeDasharray="3 4" strokeWidth={2} />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div 
          onClick={() => navigate('/flota/mantenimiento')}
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Salud de Flota</h3>
              <p className="text-xs text-slate-500">Estado actual de mantenimientos</p>
            </div>
            <button className="text-xs font-bold text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100 group-hover:text-indigo-700 px-3 py-1.5 rounded flex items-center transition-colors">
              Ver Detalle <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
          <div className="space-y-4 mt-8">
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                <span className="font-semibold text-rose-700">Vencidos</span>
              </div>
              <span className="text-xl font-bold text-rose-700">3</span>
            </div>
            
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <span className="font-semibold text-amber-700">Próximos</span>
              </div>
              <span className="text-xl font-bold text-amber-700">0</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <span className="font-semibold text-emerald-700">Al Día</span>
              </div>
              <span className="text-xl font-bold text-emerald-700">19</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => navigate('/dashboard/kpi-flota')}
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <div>
            <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Estrategia</h3>
            <p className="text-xs text-slate-500">Mix Preventivo vs Correctivo</p>
          </div>
          <div className="w-full h-[240px] mt-4 relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataEstrategia}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  stroke="none"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataEstrategia.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-800">72%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Preventivo</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-xs font-semibold text-rose-500">Correctivo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs font-semibold text-blue-500">Preventivo</span>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/dashboard/kpi-flota')}
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <div>
            <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Costos ($)</h3>
            <p className="text-xs text-slate-500">Evolución mensual por tipo</p>
          </div>
          <div className="w-full h-[240px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costosData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="prev" stackId="a" fill="#3b82f6" />
                <Bar dataKey="corr" stackId="a" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-xs font-semibold text-rose-500">Corr.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs font-semibold text-blue-500">Prev.</span>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/dashboard/fallas')}
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Cuellos de Botella</h3>
              <p className="text-xs text-slate-500">Motivos de pausa (Top 5)</p>
            </div>
            <button className="text-[10px] font-bold text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100 group-hover:text-indigo-700 px-2 py-1 rounded flex items-center transition-colors">
              <ClipboardCheck className="w-3 h-3 mr-1" />
              Detalle
            </button>
          </div>
          <div className="w-full h-[240px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataCuellos} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
