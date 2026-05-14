import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
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
  Target
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GestionCombustible() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vehiculos' | 'cargas' | 'precios'>('dashboard');
  const [busqueda, setBusqueda] = useState('');
  
  // Modal states
  const [isAjustarMetasOpen, setIsAjustarMetasOpen] = useState(false);
  const [isRegistrarCargaOpen, setIsRegistrarCargaOpen] = useState(false);
  const [isActualizarPrecioOpen, setIsActualizarPrecioOpen] = useState(false);

  // Detail panel state
  const [selectedKpi, setSelectedKpi] = useState<'costo' | 'rendimiento' | 'costokm' | 'alertas' | null>(null);

  // Date filters
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Mocks
  const kpis = {
    costoTotal30d: 3450000,
    rendimientoPromedio: 12.5,
    costoKmPromedio: 230,
    vehiculosCriticos: 4
  };

  const tablaFlota = [
    {
      id: 1,
      patente: 'AB-CD-12',
      numeroInterno: 'V-101',
      marca: 'Mercedes-Benz',
      modelo: 'Actros 2645',
      rendimientoObjetivo: 2.5,
      rendimientoHistorico: 2.8,
      costoKm30d: 415,
      estado: 'Óptimo',
    },
    {
      id: 2,
      patente: 'WX-YZ-99',
      numeroInterno: 'V-102',
      marca: 'Volvo',
      modelo: 'FH 460',
      rendimientoObjetivo: 2.6,
      rendimientoHistorico: 2.1,
      costoKm30d: 550,
      estado: 'Crítico',
    },
    {
      id: 3,
      patente: 'KL-MN-34',
      numeroInterno: 'V-103',
      marca: 'Scania',
      modelo: 'R 450',
      rendimientoObjetivo: 3.0,
      rendimientoHistorico: 2.9,
      costoKm30d: 390,
      estado: 'Regular',
    },
    {
      id: 4,
      patente: 'OP-QR-56',
      numeroInterno: 'V-104',
      marca: 'Mercedes-Benz',
      modelo: 'Sprinter 315',
      rendimientoObjetivo: 14.0,
      rendimientoHistorico: 12.5,
      costoKm30d: 260,
      estado: 'Crítico',
    }
  ];

  const chartData = [
    { date: '1 May', costo: 120000, rendimiento: 12.1 },
    { date: '4 May', costo: 150000, rendimiento: 12.3 },
    { date: '8 May', costo: 90000, rendimiento: 12.2 },
    { date: '12 May', costo: 210000, rendimiento: 12.5 },
    { date: '16 May', costo: 180000, rendimiento: 12.4 },
    { date: '20 May', costo: 130000, rendimiento: 12.6 }
  ];

  const cargasRegistradas = [
    { id: 101, fecha: '20-May-2026', vehiculo: 'V-101', conductor: 'Juan Pérez', ruta: 'Santiago - Valparaíso', litros: 150, km: 45000, total: 135000 },
    { id: 102, fecha: '19-May-2026', vehiculo: 'V-102', conductor: 'Carlos Silva', ruta: 'Santiago - Concepción', litros: 300, km: 125000, total: 270000 },
    { id: 103, fecha: '18-May-2026', vehiculo: 'V-104', conductor: 'Pedro Lagos', ruta: 'Urbano Lampa', litros: 45, km: 12000, total: 40500 },
  ];

  const filteredFlota = tablaFlota.filter(v => 
    v.patente.toLowerCase().includes(busqueda.toLowerCase()) || 
    v.numeroInterno.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
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
        
        <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl shadow-inner border border-slate-200/50 dark:border-slate-800/50 overflow-x-auto">
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
            <CarFront className="w-4 h-4" /> Rendimiento Vehículos
          </button>
          <button 
            onClick={() => setActiveTab('cargas')}
            className={cn(
               "flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all",
               activeTab === 'cargas' ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            )}
          >
            <Droplet className="w-4 h-4" /> Registro Cargas
          </button>
          <button 
            onClick={() => setActiveTab('precios')}
            className={cn(
               "flex items-center whitespace-nowrap gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all",
               activeTab === 'precios' ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            )}
          >
            <Banknote className="w-4 h-4" /> Precios
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className={cn("flex flex-col gap-6 w-full transition-all duration-300", selectedKpi ? "lg:w-2/3" : "w-full")}>
            
            <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm w-full">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                <Calendar className="w-4 h-4" /> Periodo:
              </div>
              <input 
                 type="date" 
                 value={fechaDesde}
                 onChange={e => setFechaDesde(e.target.value)}
                 className="p-2 border rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-sm"
              />
              <span className="text-slate-400">a</span>
              <input 
                 type="date" 
                 value={fechaHasta}
                 onChange={e => setFechaHasta(e.target.value)}
                 className="p-2 border rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-sm"
              />
              <Button variant="outline" size="sm" className="ml-auto">Aplicar Filtro</Button>
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", selectedKpi ? "lg:grid-cols-2" : "lg:grid-cols-4")}>
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
                      <h3 className="text-3xl font-black text-red-600 dark:text-red-500">{kpis.vehiculosCriticos}</h3>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" /></div>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-4">Vehículos muy por debajo del objetivo</p>
                </CardContent>
              </Card>
            </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="col-span-full lg:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle>Evolución Consumo vs Costo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value / 1000}k`} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} type="number" domain={[10, 15]} tick={{ fontSize: 12, fill: '#64748b' }} />
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
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-sm border-amber-200 dark:border-amber-900/50 h-full">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center"><AlertTriangle className="w-4 h-4 mr-2 text-amber-500"/>Alertas de Eficiencia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tablaFlota.filter(v => v.estado !== 'Óptimo').map(v => (
                     <div key={v.id} className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700 rounded-lg">
                       <div className="flex justify-between items-center">
                         <div>
                           <span className="font-bold text-sm text-slate-800 dark:text-slate-200 block">{v.numeroInterno}</span>
                           <span className="text-xs text-slate-500">{v.modelo}</span>
                         </div>
                         <Badge variant={v.estado === 'Crítico' ? 'destructive' : 'default'} className={v.estado === 'Regular' ? 'bg-amber-500 hover:bg-amber-600' : ''}>{v.estado}</Badge>
                       </div>
                       <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded border dark:border-slate-700 text-xs mt-1">
                         <div className="text-center w-full">
                            <span className="block text-slate-500">Real</span>
                            <span className={cn("font-bold text-sm", v.estado === 'Crítico' ? "text-red-500" : "text-amber-500")}>{v.rendimientoHistorico}</span>
                         </div>
                         <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                         <div className="text-center w-full">
                            <span className="block text-slate-500">Meta</span>
                            <span className="font-bold text-emerald-600 text-sm">{v.rendimientoObjetivo}</span>
                         </div>
                       </div>
                     </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {selectedKpi && (
            <div className="w-full lg:w-1/3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-lg p-6 sticky top-6 self-start mt-6 lg:mt-0">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                  <Info className="w-5 h-5 text-blue-500" />
                  Detalle del KPI
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedKpi(null)} className="h-8 w-8 p-0 rounded-full">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {selectedKpi === 'costo' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-white">Costo Total (30d)</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Sumatoria del costo de todas las cargas de combustible registradas en los últimos 30 días.</p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border dark:border-slate-700 text-sm space-y-2">
                    <p className="flex justify-between"><span className="text-slate-500">Total Litros:</span><span className="font-medium text-slate-700 dark:text-white">3,450 L</span></p>
                    <p className="flex justify-between"><span className="text-slate-500">Precio Promedio:</span><span className="font-medium text-slate-700 dark:text-white">$1,000 / L</span></p>
                    <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                    <p className="flex justify-between font-bold"><span className="text-slate-700 dark:text-slate-300">Total Estimado:</span><span className="text-blue-600">${kpis.costoTotal30d.toLocaleString()}</span></p>
                  </div>
                </div>
              )}
              {selectedKpi === 'rendimiento' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-white">Rendimiento Promedio</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Distancia total recorrida dividida por los litros totales consumidos por toda la flota activa.</p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border dark:border-slate-700 text-sm space-y-2">
                    <p className="flex justify-between"><span className="text-slate-500">Total Km:</span><span className="font-medium text-slate-700 dark:text-white">43,125 km</span></p>
                    <p className="flex justify-between"><span className="text-slate-500">Total Litros:</span><span className="font-medium text-slate-700 dark:text-white">3,450 L</span></p>
                    <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                    <p className="flex justify-between font-bold"><span className="text-slate-700 dark:text-slate-300">Promedio Flota:</span><span className="text-emerald-600">{kpis.rendimientoPromedio} km/L</span></p>
                  </div>
                </div>
              )}
              {selectedKpi === 'costokm' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-white">Costo por Km</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Relación directa entre el gasto en combustible y los kilómetros producidos en el periodo.</p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border dark:border-slate-700 text-sm space-y-2">
                    <p className="flex justify-between"><span className="text-slate-500">Costo Total:</span><span className="font-medium text-slate-700 dark:text-white">${kpis.costoTotal30d.toLocaleString()}</span></p>
                    <p className="flex justify-between"><span className="text-slate-500">Total Km:</span><span className="font-medium text-slate-700 dark:text-white">43,125 km</span></p>
                    <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                    <p className="flex justify-between font-bold"><span className="text-slate-700 dark:text-slate-300">Costo/km:</span><span className="text-blue-600">${kpis.costoKmPromedio}</span></p>
                  </div>
                </div>
              )}
              {selectedKpi === 'alertas' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 dark:text-white">Desviaciones Críticas</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Vehículos cuyo rendimiento real está un 15% o más por debajo de su meta (Rendimiento Objetivo).</p>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border dark:border-slate-700 text-sm space-y-2">
                    <p className="flex justify-between"><span className="text-slate-500">Flota Activa:</span><span className="font-medium text-slate-700 dark:text-white">42 Vehículos</span></p>
                    <p className="flex justify-between"><span className="text-slate-500">En Rango (Verde/Amarillo):</span><span className="font-medium text-slate-700 dark:text-white">38 Vehículos</span></p>
                    <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                    <p className="flex justify-between font-bold"><span className="text-slate-700 dark:text-slate-300">Fuera de Rango (Rojo):</span><span className="text-red-500">{kpis.vehiculosCriticos} Vehículos</span></p>
                  </div>
                </div>
              )}
            </div>
        )}
        </div>
      )}

      {activeTab === 'vehiculos' && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 pb-4">
            <div>
              <CardTitle>Rendimiento por Vehículo</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Comparativa real vs objetivos teóricos por modelo</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar patente o N° interno..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="pl-9 pr-4 py-2 border rounded-lg text-sm bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                />
              </div>
              <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filtros</Button>
              <Button onClick={() => setIsAjustarMetasOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Target className="w-4 h-4 mr-2" /> Ajustar Metas</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Vehículo</th>
                    <th className="px-6 py-4 font-semibold">Modelo</th>
                    <th className="px-6 py-4 font-semibold text-center">Meta (km/L)</th>
                    <th className="px-6 py-4 font-semibold text-center">Real (30d)</th>
                    <th className="px-6 py-4 font-semibold text-center">Costo/km</th>
                    <th className="px-6 py-4 font-semibold text-center">Semáforo</th>
                    <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredFlota.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-zinc-100">{v.numeroInterno}</div>
                        <div className="text-xs text-slate-500">{v.patente}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{v.marca}</div>
                        <div className="text-xs text-slate-500">{v.modelo}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-600 dark:text-slate-400">
                        {v.rendimientoObjetivo.toFixed(1)} 
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "font-bold px-2 py-1 rounded",
                          v.estado === 'Óptimo' ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30" : 
                          v.estado === 'Regular' ? "text-amber-700 bg-amber-50 dark:bg-amber-900/30" : "text-red-700 bg-red-50 dark:bg-red-900/30"
                        )}>
                          {v.rendimientoHistorico.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        ${v.costoKm30d}
                      </td>
                      <td className="px-6 py-4 text-center">
                         <div className="flex justify-center">
                            <div className={cn(
                                "w-3 h-3 rounded-full shadow-inner",
                                v.estado === 'Óptimo' ? "bg-emerald-500" : 
                                v.estado === 'Regular' ? "bg-amber-500" : "bg-red-500"
                            )}></div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                           Ver Detalle
                         </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'cargas' && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 pb-4">
            <div>
              <CardTitle>Historial de Cargas</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Registro de combustible, kilómetros y costeo automático</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filtros</Button>
              <Button onClick={() => setIsRegistrarCargaOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" /> Registrar Carga</Button>
            </div>
          </CardHeader>
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
                  {cargasRegistradas.map(carga => (
                    <tr key={carga.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-slate-600 dark:text-slate-300">
                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                            {carga.fecha}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-zinc-100">{carga.vehiculo}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                         <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-slate-400" />
                            {carga.conductor}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                         <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                            {carga.ruta}
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-600 dark:text-slate-400">{carga.km.toLocaleString()} km</td>
                      <td className="px-6 py-4 text-right font-semibold text-blue-600 dark:text-blue-400">{carga.litros} L</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200">${carga.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'precios' && (
        <Card className="shadow-sm">
           <CardHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 pb-4">
            <div>
              <CardTitle>Gestión de Precios</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Configuración del costo por litro para valorización dinámica</p>
            </div>
            <Button onClick={() => setIsActualizarPrecioOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="w-4 h-4 mr-2" /> Actualizar Precio</Button>
          </CardHeader>
          <CardContent className="p-8 text-center text-slate-500">
             <div className="flex flex-col items-center justify-center space-y-4">
                 <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                     <History className="w-8 h-8 text-slate-400" />
                 </div>
                 <h3 className="text-lg font-medium text-slate-900 dark:text-white">Historial de Precios de Combustible</h3>
                 <p className="max-w-md mx-auto">Aquí se muestra el listado histórico de los precios del litro de combustible (Diésel, Gasolina). El sistema utiliza el precio activo en la fecha de la carga para calcular el costo de manera automática y precisa.</p>
             </div>
          </CardContent>
        </Card>
      )}
      
      {/* Modals */}
      <Modal isOpen={isAjustarMetasOpen} onClose={() => setIsAjustarMetasOpen(false)} title="Ajustar Meta de Rendimiento">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Seleccione el modelo comercial para establecer una nueva meta de rendimiento (km/L) a evaluar.</p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Modelo Comercial</label>
            <select className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm">
               <option>Mercedes-Benz Actros 2645</option>
               <option>Volvo FH 460</option>
               <option>Scania R 450</option>
               <option>Mercedes-Benz Sprinter 315</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nuevo Objetivo (km/L)</label>
            <input type="number" step="0.1" placeholder="Ej: 2.8" className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsAjustarMetasOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Guardar Meta</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isRegistrarCargaOpen} onClose={() => setIsRegistrarCargaOpen(false)} title="Registrar Carga de Combustible">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Fecha de Carga</label>
            <input type="date" className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Vehículo</label>
            <select className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm">
               <option>V-101 (AB-CD-12)</option>
               <option>V-102 (WX-YZ-99)</option>
               <option>V-103 (KL-MN-34)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Conductor (Opcional)</label>
            <input type="text" placeholder="Ej: Juan Pérez" className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Kilometraje Total (Odómetro)</label>
            <input type="number" placeholder="Ej: 45000" className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Litros Cargados</label>
            <input type="number" step="0.1" placeholder="Ej: 150" className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Ruta Asociada (Opcional)</label>
            <input type="text" placeholder="Ej: Santiago - Valparaíso" className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsRegistrarCargaOpen(false)}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Registrar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isActualizarPrecioOpen} onClose={() => setIsActualizarPrecioOpen(false)} title="Actualizar Precio Combustible">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha de Vigencia</label>
            <input type="date" className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" />
            <p className="text-xs text-slate-500">Este precio aplicará a todas las cargas a partir de esta fecha.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Combustible</label>
            <select className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm">
               <option>Diésel</option>
               <option>Gasolina 93</option>
               <option>Gasolina 95</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Precio por Litro ($ CLP)</label>
            <input type="number" placeholder="Ej: 1050" className="w-full p-2 border rounded-md dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm" />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsActualizarPrecioOpen(false)}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Guardar Precio</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
