import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Activity, CircleDashed, BarChart3, Truck, Trash, ChevronDown, AlertCircle, ChevronUp, DollarSign, X, Info, TrendingUp, AlertTriangle, ChevronRight, Box } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Modal } from '../../components/ui/Modal';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function GestionNeumaticos() {
  const queryParams = new URLSearchParams(window.location.search);
  const initialTab = (queryParams.get('tab') as 'dashboard' | 'inventario' | 'inspeccion') || 'dashboard';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventario' | 'inspeccion'>(initialTab);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CircleDashed className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            Gestión de Neumáticos y Rentabilidad
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Sistema de trazabilidad, control de desgaste y cálculo de CPK ($/km)
          </p>
        </div>
        <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl shadow-inner border border-slate-200/50 dark:border-slate-800/50">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
               "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all",
               activeTab === 'dashboard' ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            )}
          >
            <BarChart3 className="w-4 h-4" /> Rentabilidad KPI
          </button>
          <button 
            onClick={() => setActiveTab('inventario')}
            className={cn(
               "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all",
               activeTab === 'inventario' ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            )}
          >
            <CircleDashed className="w-4 h-4" /> Neumáticos
          </button>
          <button 
            onClick={() => setActiveTab('inspeccion')}
            className={cn(
               "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all",
               activeTab === 'inspeccion' ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-emerald-900/30 ring-1 ring-emerald-500/20" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            )}
          >
            <Activity className="w-4 h-4" /> Registrar Inspección
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && <DashboardNeumaticos />}
      {activeTab === 'inventario' && <InventarioNeumaticos />}
      {activeTab === 'inspeccion' && <FormularioInspeccion />}
    </div>
  );
}

function DashboardNeumaticos() {
  const [selectedKpi, setSelectedKpi] = useState<'cpk' | 'activos' | 'alertas' | 'ahorro' | null>(null);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className={cn("bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-md cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'cpk' && "ring-2 ring-blue-300")}
          onClick={() => setSelectedKpi('cpk')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-blue-100 text-sm font-medium">CPK Promedio Flota</p>
                <h3 className="text-3xl font-black">$3.25 <span className="text-base font-medium text-blue-200">/ km</span></h3>
              </div>
              <div className="p-3 bg-white/20 rounded-lg"><BarChart3 className="w-5 h-5 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={cn("bg-white dark:bg-slate-900 shadow-md cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'activos' && "ring-2 ring-blue-500")}
          onClick={() => setSelectedKpi('activos')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Neumáticos Activos</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">142</h3>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"><CircleDashed className="w-5 h-5 text-slate-600 dark:text-slate-300" /></div>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-4 flex items-center"><ChevronUp className="w-3 h-3 mr-1"/> 92% estado óptimo</p>
          </CardContent>
        </Card>

        <Card 
          className={cn("bg-white dark:bg-slate-900 shadow-md cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'alertas' && "ring-2 ring-red-500")}
          onClick={() => setSelectedKpi('alertas')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Alertas Críticas</p>
                <h3 className="text-3xl font-black text-red-600 dark:text-red-500">5</h3>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" /></div>
            </div>
             <p className="text-xs text-red-600 dark:text-red-400 mt-4 flex items-center">Requieren retiro inmediato</p>
          </CardContent>
        </Card>

        <Card 
          className={cn("bg-white dark:bg-slate-900 shadow-md cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'ahorro' && "ring-2 ring-emerald-500")}
          onClick={() => setSelectedKpi('ahorro')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Ahorro Proyectado</p>
                <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-500">$1.2M</h3>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
            </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 flex items-center">Al optimizar presión (+10% vida útil)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="col-span-full lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Rentabilidad y Vida Útil por Modelo</CardTitle>
          </CardHeader>
          <CardContent>
                        {/* Gráfico Real (Recharts) */}
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={[
                    { name: 'Michelin XZE2', vidaUtil: 150000, cpk: 3.00 },
                    { name: 'BStone R268', vidaUtil: 135000, cpk: 3.11 },
                    { name: 'GYear KMAX', vidaUtil: 120000, cpk: 3.29 },
                    { name: 'FCargo SR-200', vidaUtil: 105000, cpk: 3.40 },
                    { name: 'Pirelli Form', vidaUtil: 95000, cpk: 3.68 },
                  ]}
                  margin={{ top: 20, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value / 1000}k`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value}`} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }}
                     formatter={(value, name) => {
                       if (name === 'Vida Útil (km)') return [`${value.toLocaleString()} km`, name];
                       if (name === 'CPK ($/km)') return [`${(value as number).toFixed(2)}`, name];
                       return [value, name];
                     }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar yAxisId="left" dataKey="vidaUtil" name="Vida Útil (km)" radius={[4, 4, 0, 0]} barSize={40}>
                    {
                      [
                        { name: 'Michelin XZE2', vidaUtil: 150000, cpk: 3.00 },
                        { name: 'BStone R268', vidaUtil: 135000, cpk: 3.11 },
                        { name: 'GYear KMAX', vidaUtil: 120000, cpk: 3.29 },
                        { name: 'FCargo SR-200', vidaUtil: 105000, cpk: 3.40 },
                        { name: 'Pirelli Form', vidaUtil: 95000, cpk: 3.68 },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cpk < 3.2 ? '#10b981' : entry.cpk < 3.5 ? '#f59e0b' : '#ef4444'} />
                      ))
                    }
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="cpk" name="CPK ($/km)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 flex flex-col gap-4">
               <div className="grid grid-cols-4 gap-4 text-xs font-bold text-slate-500 uppercase pb-2 border-b dark:border-slate-800">
                 <div>Marca - Perfil</div>
                 <div>Vida Útil Prom.</div>
                 <div>Costo Prom.</div>
                 <div className="text-right">CPK ($/km)</div>
               </div>
               {[
                 { m: "Michelin XZE2", v: "150,000 km", c: "$450,000", cpk: "$3.00", color: "text-emerald-600 dark:text-emerald-400" },
                 { m: "Bridgestone R268", v: "135,000 km", c: "$420,000", cpk: "$3.11", color: "text-emerald-600 dark:text-emerald-400" },
                 { m: "Goodyear KMAX", v: "120,000 km", c: "$395,000", cpk: "$3.29", color: "text-amber-600 dark:text-amber-500" },
                  { m: "FateCargo SR-200", v: "105,000 km", c: "$360,000", cpk: "$3.40", color: "text-orange-600 dark:text-orange-500" },
                 { m: "Pirelli Formula", v: "95,000 km", c: "$350,000", cpk: "$3.68", color: "text-red-600 dark:text-red-500" }
               ].map((it, i) => (
                  <div key={i} className="grid grid-cols-4 gap-4 items-center border-b dark:border-slate-800 pb-3">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{it.m}</div>
                    <div className="text-slate-600 dark:text-slate-400">{it.v}</div>
                    <div className="text-slate-600 dark:text-slate-400">{it.c}</div>
                    <div className={cn("text-right font-black", it.color)}>{it.cpk}</div>
                  </div>
               ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
               <CardTitle className="text-sm">Alertas de Inspección</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {[
                 { pat: "KBCX-45", pos: "Pos 4", txt: "Baja presión (90 PSI)", t: "Hace 2 hrs" },
                 { pat: "LDPJ-99", pos: "Pos 8, 9", txt: "Surco crítico (3mm), programar retiro", t: "Ayer" },
                 { pat: "FRTY-12", pos: "Pos 2", txt: "Desgaste irregular detectado", t: "Ayer" }
               ].map((a, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-700 dark:text-red-400">{a.pat} - {a.pos}</p>
                      <p className="text-xs text-red-600 dark:text-red-300 mt-0.5 leading-snug">{a.txt}</p>
                      <p className="text-[10px] text-red-400 dark:text-red-500 mt-1.5 font-medium">{a.t}</p>
                    </div>
                  </div>
               ))}
            </CardContent>
          </Card>
        </div>
      </div>

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
                  Métricas de Neumáticos
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedKpi(null)} className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 flex-1 space-y-6">
              {/* Info box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex gap-3 text-sm">
                 <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                 <div>
                   <strong className="block mb-1">FÓRMULA / DEFINICIÓN:</strong>
                   {selectedKpi === 'cpk' && "CPK ($/km) = (Costo de Adquisición + Costo Reparaciones) / Kilómetros Recorridos."}
                   {selectedKpi === 'activos' && "Neumáticos Activos = Total de unidades actualmente montadas o en inventario como stock disponible."}
                   {selectedKpi === 'alertas' && "Alertas Críticas = Neumáticos con surco menor a 3mm, daños severos, o desgaste irregular detectado en inspección."}
                   {selectedKpi === 'ahorro' && "Ahorro Proyectado = Reducción estimada de compras anualizadas si se maximiza la vida útil al estándar esperado (+10%)."}
                 </div>
              </div>

              {/* Data content layer */}
              <div className="space-y-4 pt-4">
                <h4 className="font-bold text-sm uppercase text-slate-500 tracking-wider">Desglose de Datos</h4>
                
                {selectedKpi === 'cpk' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Total Inversión Activa</span>
                      <span className="font-bold text-slate-900 dark:text-white">$75,500,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Total Kilómetros Producidos</span>
                      <span className="font-bold text-slate-900 dark:text-white">23,230,769 km</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-blue-600 text-white rounded-lg shadow-inner">
                      <span className="font-medium">CPK Promedio Ponderado</span>
                      <span className="font-black text-xl">$3.25/km</span>
                    </div>
                  </div>
                )}
                {selectedKpi === 'activos' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Montados en Vehículos</span>
                      <span className="font-bold text-slate-900 dark:text-white">135 Unidades</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Stock Bodega (Repuestos)</span>
                      <span className="font-bold text-slate-900 dark:text-white">7 Unidades</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-800 dark:bg-slate-950 text-white rounded-lg shadow-inner">
                      <span className="font-medium">Total Unidades Activas</span>
                      <span className="font-black text-xl">142</span>
                    </div>
                  </div>
                )}
                {selectedKpi === 'alertas' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Surco Crítico (&lt; 3mm)</span>
                      <span className="font-bold text-slate-900 dark:text-white">2 Unidades</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400 text-red-600">Presión Baja Peligrosa</span>
                      <span className="font-bold text-slate-900 dark:text-white">2 Unidades</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Desgaste Irregular Grave</span>
                      <span className="font-bold text-slate-900 dark:text-white">1 Unidad</span>
                    </div>
                    <div className="space-y-2 mt-4 border-t dark:border-slate-800 pt-4">
                      <p className="text-sm font-semibold text-red-600 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Necesidad de Retiro</p>
                      {[
                        { pos: 'LDPJ-99 - Pos 8', desc: 'Surco crítico (3mm)' },
                        { pos: 'LDPJ-99 - Pos 9', desc: 'Surco crítico (3mm)' },
                        { pos: 'FRTY-12 - Pos 2', desc: 'Desgaste irregular' },
                      ].map((v, idx) => (
                         <div key={idx} className="flex justify-between text-sm p-2 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 rounded-r">
                           <span className="font-medium">{v.pos}</span>
                           <span className="text-red-600">{v.desc}</span>
                         </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedKpi === 'ahorro' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Ahorro en Renuevos Esperado</span>
                      <span className="font-bold text-slate-900 dark:text-white">$800,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Menor Combustible por Presión</span>
                      <span className="font-bold text-slate-900 dark:text-white">$400,000</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-emerald-600 text-white rounded-lg shadow-inner">
                      <span className="font-medium">Total Potencial Anual</span>
                      <span className="font-black text-xl">$1.2M</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

function InventarioNeumaticos() {
  const [selectedNeu, setSelectedNeu] = useState<any | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const inventory = [
    { id: "NEU-001", marca: "Michelin", modelo: "X Multi Z", medida: "295/80R22.5", estado: "BUENO", statusColor: "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", ubicacion: "MONTADO", vehiculo: "#101", pos: "Delantero Izq", profActual: 12, profNueva: 16, km: 45000, costo: 450000, instalacion: "01/01/2023" },
    { id: "NEU-002", marca: "Michelin", modelo: "X Multi Z", medida: "295/80R22.5", estado: "BUENO", statusColor: "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", ubicacion: "MONTADO", vehiculo: "#101", pos: "Delantero Der", profActual: 11.5, profNueva: 16, km: 45000, costo: 450000, instalacion: "01/01/2023" },
    { id: "NEU-003", marca: "Bridgestone", modelo: "M729", medida: "295/80R22.5", estado: "REGULAR", statusColor: "text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800", ubicacion: "MONTADO", vehiculo: "#101", pos: "Trasero Izq Ext", profActual: 6, profNueva: 18, km: 120000, costo: 380000, instalacion: "15/06/2022" },
    { id: "NEU-004", marca: "Bridgestone", modelo: "M729", medida: "295/80R22.5", estado: "REGULAR", statusColor: "text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800", ubicacion: "MONTADO", vehiculo: "#101", pos: "Trasero Izq Int", profActual: 5.8, profNueva: 18, km: 120000, costo: 380000, instalacion: "15/06/2022" },
    { id: "NEU-005", marca: "Goodyear", modelo: "Wrangler", medida: "265/65R17", estado: "NUEVO", statusColor: "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400", ubicacion: "MONTADO", vehiculo: "#102", pos: "Delantero Izq", profActual: 9, profNueva: 9, km: 2000, costo: 210000, instalacion: "10/05/2026" },
    { id: "NEU-006", marca: "Goodyear", modelo: "Wrangler", medida: "265/65R17", estado: "NUEVO", statusColor: "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400", ubicacion: "MONTADO", vehiculo: "#102", pos: "Delantero Der", profActual: 9, profNueva: 9, km: 2000, costo: 210000, instalacion: "10/05/2026" },
    { id: "NEU-007", marca: "Michelin", modelo: "X Multi D", medida: "295/80R22.5", estado: "CRITICO", statusColor: "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400", ubicacion: "MONTADO", vehiculo: "#103", pos: "Trasero Der Ext", profActual: 2.5, profNueva: 18, km: 180000, costo: 480000, instalacion: "10/11/2021" },
    { id: "NEU-008", marca: "Pirelli", modelo: "FG88", medida: "13R22.5", estado: "NUEVO", statusColor: "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400", ubicacion: "BODEGA", vehiculo: "-", pos: "", profActual: 20, profNueva: 20, km: 0, costo: 420000, instalacion: "-" },
    { id: "NEU-009", marca: "Pirelli", modelo: "FG88", medida: "13R22.5", estado: "NUEVO", statusColor: "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400", ubicacion: "BODEGA", vehiculo: "-", pos: "", profActual: 20, profNueva: 20, km: 0, costo: 420000, instalacion: "-" },
    { id: "NEU-010", marca: "Michelin", modelo: "X Multi Z", medida: "295/80R22.5", estado: "BAJA", statusColor: "text-slate-700 bg-slate-200 dark:bg-slate-800 dark:text-slate-400", ubicacion: "DESECHO", vehiculo: "-", pos: "", profActual: 1, profNueva: 16, km: 210000, costo: 450000, instalacion: "-" },
  ];

  const getProgressBarColor = (actual: number, max: number) => {
    const ratio = actual / max;
    if (ratio > 0.6) return "bg-emerald-500";
    if (ratio > 0.3) return "bg-amber-500";
    if (ratio > 0.15) return "bg-orange-500";
    return "bg-red-600";
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden lg:h-[calc(100vh-140px)] min-h-[500px] w-full">
      <div className="flex-1 flex flex-col w-full h-full">
        
        {/* Filters Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por código, marca o patente..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <select className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-48">
            <option>Todas las ubicaciones</option>
            <option>Montado</option>
            <option>Bodega</option>
            <option>Desecho</option>
          </select>
          <select className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-48">
            <option>Todos los estados</option>
            <option>Nuevo</option>
            <option>Bueno</option>
            <option>Regular</option>
            <option>Crítico</option>
          </select>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto w-full">
          <table className="w-full text-left min-w-[800px]">
             <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10">
               <tr className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                 <th className="py-4 px-6 tracking-wide">Código</th>
                 <th className="py-4 px-6 tracking-wide">Marca / Modelo</th>
                 <th className="py-4 px-6 tracking-wide">Medida</th>
                 <th className="py-4 px-6 tracking-wide">Estado</th>
                 <th className="py-4 px-6 tracking-wide">Ubicación</th>
                 <th className="py-4 px-6 tracking-wide w-48">Profundidad</th>
                 <th className="py-4 px-6 tracking-wide text-right">Km Acum.</th>
                 <th className="py-4 pr-6 pl-2 tracking-wide text-center">Acciones</th>
               </tr>
             </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {inventory.map((inv) => (
                  <tr 
                    key={inv.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{inv.id}</span>
                    </td>
                    <td className="py-4 px-6 flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{inv.marca}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{inv.modelo}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">{inv.medida}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={cn("px-2 py-1 rounded text-xs font-bold uppercase", inv.statusColor)}>
                        {inv.estado}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
                          {inv.ubicacion === 'MONTADO' && <Truck className="w-3.5 h-3.5 mr-1.5" />}
                          {inv.ubicacion === 'BODEGA' && <Box className="w-3.5 h-3.5 mr-1.5" />}
                          {inv.ubicacion === 'DESECHO' && <Trash className="w-3.5 h-3.5 mr-1.5" />}
                          {inv.ubicacion}
                        </div>
                        {inv.ubicacion === 'MONTADO' && (
                          <span className="text-xs text-slate-500">{inv.vehiculo} &bull; {inv.pos}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                       <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{inv.profActual}mm</span>
                          <span className="text-slate-400">/ {inv.profNueva}mm</span>
                       </div>
                       <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden flex">
                          <div 
                            className={cn("h-full rounded-full transition-all", getProgressBarColor(inv.profActual, inv.profNueva))} 
                            style={{ width: `${Math.min(100, Math.max(0, (inv.profActual / inv.profNueva) * 100))}%` }}
                           />
                       </div>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                      {inv.km.toLocaleString()} km
                    </td>
                    <td className="py-4 pr-6 pl-2 text-center">
                      <button 
                        onClick={() => setSelectedNeu(inv)}
                        className="p-2 text-slate-400 group-hover:text-blue-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>

      {/* Right Drawer / Detail View Modal */}
      {selectedNeu && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 backdrop-blur-sm" onClick={() => setSelectedNeu(null)}>
          <div 
            className="w-[420px] bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300 transform"
            onClick={(e) => e.stopPropagation()}
          >
             {/* Header */}
           <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pb-8 relative pt-8">
             <button onClick={() => setSelectedNeu(null)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
               <X className="w-5 h-5" />
             </button>
             <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/50">
                 <CircleDashed className="w-6 h-6" />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                   {selectedNeu.id}
                 </h2>
                 <p className="text-sm text-slate-500 font-medium">{selectedNeu.marca} {selectedNeu.modelo}</p>
               </div>
             </div>

             <div className="flex gap-3">
               <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Medida</p>
                 <p className="font-semibold text-slate-900 dark:text-white">{selectedNeu.medida}</p>
               </div>
               <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Costo</p>
                 <p className="font-semibold text-slate-900 dark:text-white">${selectedNeu.costo.toLocaleString()}</p>
               </div>
             </div>
           </div>

           {/* Scrollable Content */}
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Estado Actual */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                 <h3 className="text-sm font-bold text-violet-800 dark:text-violet-400 flex items-center mb-4">
                   <Activity className="w-4 h-4 mr-2" /> Estado Actual
                 </h3>
                 
                 <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Condición</span>
                    <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", selectedNeu.statusColor)}>
                      {selectedNeu.estado}
                    </span>
                 </div>

                 <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                       <span className="text-slate-600 dark:text-slate-400">Profundidad de Huella</span>
                       <span className="font-bold text-slate-900 dark:text-white">{selectedNeu.profActual} mm</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden flex mb-2">
                      <div 
                        className={cn("h-full rounded-full transition-all", getProgressBarColor(selectedNeu.profActual, selectedNeu.profNueva))} 
                        style={{ width: `${Math.min(100, Math.max(0, (selectedNeu.profActual / selectedNeu.profNueva) * 100))}%` }}
                       />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                       <span>0 mm (Desecho)</span>
                       <span>{selectedNeu.profNueva} mm (Nuevo)</span>
                    </div>
                 </div>

                 <div className="flex gap-3 text-sm">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg flex flex-col justify-center">
                       <span className="text-slate-500 mb-1">KM Acumulados</span>
                       <span className="font-bold text-base text-slate-900 dark:text-white">{selectedNeu.km.toLocaleString()}</span>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg flex flex-col justify-center">
                       <span className="text-slate-500 mb-1">Costo / KM</span>
                       <span className="font-bold text-base text-slate-900 dark:text-white">${selectedNeu.km > 0 ? (selectedNeu.costo / selectedNeu.km).toFixed(1) : '-.-'}</span>
                    </div>
                 </div>
              </div>

              {/* Ubicacion */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                 <h3 className="text-sm font-bold text-violet-800 dark:text-violet-400 flex items-center mb-4">
                   <Truck className="w-4 h-4 mr-2" /> Ubicación
                 </h3>
                 
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                       {selectedNeu.ubicacion === 'MONTADO' && <Truck className="w-5 h-5 text-blue-600 dark:text-blue-500" />}
                       {selectedNeu.ubicacion === 'BODEGA' && <Box className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />}
                       {selectedNeu.ubicacion === 'DESECHO' && <Trash className="w-5 h-5 text-slate-500" />}
                    </div>
                    <div>
                       {selectedNeu.ubicacion === 'MONTADO' ? (
                         <>
                           <p className="font-bold text-slate-900 dark:text-white text-base">Vehículo {selectedNeu.vehiculo.replace('#', '')}</p>
                           <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Posición: <span className="font-semibold text-slate-800 dark:text-slate-300">{selectedNeu.pos}</span></p>
                           <p className="text-xs text-slate-400 mt-2">Instalado el {selectedNeu.instalacion}</p>
                         </>
                       ) : (
                         <p className="font-bold text-slate-900 dark:text-white text-base mt-2 capitalize">{selectedNeu.ubicacion.toLowerCase()}</p>
                       )}
                    </div>
                 </div>
              </div>

           </div>

           {/* Footer Actions */}
           <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-3 z-10 sticky bottom-0">
              <Button 
                variant="outline" 
                className="flex-1 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                onClick={() => setIsHistoryModalOpen(true)}
              >
                Historial
              </Button>
              <Button className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-medium">
                {selectedNeu.ubicacion === 'MONTADO' ? 'Desmontar' : 'Montar en Vehículo'}
              </Button>
           </div>
        </div>
        </div>
      )}

      {/* Historial Modal */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Historial: ${selectedNeu?.id || ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            A continuación se muestra el historial de movimientos y mantenciones del neumático seleccionado.
          </p>
          <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6 pb-4">
             <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-1.5 top-1"></div>
                <p className="text-xs text-slate-500 font-bold mb-0.5">15 MAY 2026</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Inspección Rutinaria</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Profundidad registrada: {selectedNeu?.profActual} mm. Se detectó desgaste regular.</p>
             </div>
             <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-1.5 top-1"></div>
                <p className="text-xs text-slate-500 font-bold mb-0.5">01 ENE 2023</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Montaje en Vehículo</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Instalado en {selectedNeu?.vehiculo || 'vehículo'} posición {selectedNeu?.pos || 'N/A'}.</p>
             </div>
             <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full -left-1.5 top-1"></div>
                <p className="text-xs text-slate-500 font-bold mb-0.5">10 DIC 2022</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ingreso a Bodega</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Compra inicial de lote. Costo: ${selectedNeu?.costo?.toLocaleString() || 0}.</p>
             </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
             <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FormularioInspeccion() {
  const [numPositions, setNumPositions] = useState(6); // Default 6 wheels
  const positions = Array.from({length: numPositions}, (_, i) => i + 1);

  return (
    <Card className="border shadow-lg">
      <CardHeader className="bg-slate-900 text-white rounded-t-xl pb-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Formulario de Inspección Técnica Ocular</CardTitle>
            <p className="text-slate-300 text-sm mt-1">Captura de presiones, desgaste de surcos y observaciones</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4">
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vehículo / Placa</label>
             <select className="w-full p-2 border rounded-md dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 text-sm">
               <option>Seleccione equipo</option>
               <option>Camión KBCX-45</option>
               <option>Semirremolque SR-88</option>
             </select>
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Inspección</label>
             <input type="date" className="w-full p-2 border rounded-md dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 text-sm" />
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Odómetro (Km)</label>
             <input type="number" placeholder="Ej: 125000" className="w-full p-2 border rounded-md dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 text-sm" />
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Configuración Ejes</label>
             <select 
               className="w-full p-2 border rounded-md dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-100 text-sm"
               onChange={(e) => setNumPositions(parseInt(e.target.value))}
               value={numPositions}
             >
               <option value="4">2 Ejes / Config. 2x2 (4 Neumáticos)</option>
               <option value="6">2 Ejes (6 Neumáticos)</option>
               <option value="10">3 Ejes (10 Neumáticos)</option>
               <option value="14">4 Ejes (14 Neumáticos)</option>
               <option value="18">5 Ejes (18 Neumáticos)</option>
             </select>
           </div>
        </div>
        
        <div className="p-6 overflow-x-auto">
           <table className="w-full min-w-max border-collapse">
             <thead>
               <tr>
                 <th colSpan={3} className="border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-xs text-center text-slate-600 dark:text-slate-300">Identificación</th>
                 <th colSpan={2} className="border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-xs text-center text-slate-600 dark:text-slate-300">Condición Operativa</th>
                 <th colSpan={4} className="border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-xs text-center text-slate-600 dark:text-slate-300">Profundidad del Surco (mm)</th>
                 <th colSpan={4} className="border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-xs text-center text-slate-600 dark:text-slate-300">Detalles Adicionales</th>
                 <th colSpan={1} className="border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 text-xs text-center text-slate-600 dark:text-slate-300">Obs</th>
               </tr>
               <tr className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 uppercase">
                 <th className="p-2 border-r dark:border-slate-700 w-12 text-center">Pos</th>
                 <th className="p-2 border-r dark:border-slate-700 w-32">Serie/DOT</th>
                 <th className="p-2 border-r dark:border-slate-700 w-40">Marca / Diseño</th>
                 <th className="p-2 border-r dark:border-slate-700 w-24">Presión (PSI)</th>
                 <th className="p-2 border-r dark:border-slate-700 w-20">Estado (C/F)</th>
                 <th className="p-2 border-r dark:border-slate-700 w-16 text-center">Ext-1</th>
                 <th className="p-2 border-r dark:border-slate-700 w-16 text-center">Ext-2</th>
                 <th className="p-2 border-r dark:border-slate-700 w-16 text-center">Int-1</th>
                 <th className="p-2 border-r dark:border-slate-700 w-16 text-center">Int-2</th>
                 <th className="p-2 border-r dark:border-slate-700 w-14 text-center">N° R</th>
                 <th className="p-2 border-r dark:border-slate-700 w-16 text-center">Reenc</th>
                 <th className="p-2 border-r dark:border-slate-700 w-12 text-center" title="Tapa Válvula">TV</th>
                 <th className="p-2 border-r dark:border-slate-700 w-12 text-center" title="Extensión Válvula">Ext</th>
                 <th className="p-2 w-48">Observaciones</th>
               </tr>
             </thead>
             <tbody>
                {positions.map(pos => (
                  <tr key={pos} className="border-b border-x border-slate-200 dark:border-slate-700 dark:bg-slate-900/30">
                    <td className="p-2 border-r dark:border-slate-700 text-center font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50">{pos}</td>
                    <td className="p-1.5 border-r dark:border-slate-700">
                      <input type="text" className="w-full px-2 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs font-mono dark:text-slate-100" placeholder="Ej: DOT-123" />
                    </td>
                    <td className="p-1.5 border-r dark:border-slate-700">
                      <select className="w-full px-2 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs dark:text-slate-100">
                        <option>Michelin XZE2</option>
                        <option>Bridgestone M729</option>
                        <option>Goodyear KMAX</option>
                        <option>Otro...</option>
                      </select>
                    </td>
                    <td className="p-1.5 border-r dark:border-slate-700">
                      <input type="number" className="w-full px-2 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs text-center dark:text-slate-100" placeholder="110" />
                    </td>
                    <td className="p-1.5 border-r dark:border-slate-700">
                      <select className="w-full px-2 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs dark:text-slate-100 text-center">
                        <option title="Frio">F</option>
                        <option title="Caliente">C</option>
                      </select>
                    </td>
                    <td className="p-1.5 border-r dark:border-slate-700">
                      <input type="number" step="0.1" className="w-full px-1 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs text-center dark:text-slate-100" placeholder="12.5" />
                    </td>
                    <td className="p-1.5 border-r dark:border-slate-700">
                      <input type="number" step="0.1" className="w-full px-1 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs text-center dark:text-slate-100" placeholder="12.5" />
                    </td>
                    <td className="p-1.5 border-r dark:border-slate-700">
                      <input type="number" step="0.1" className="w-full px-1 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs text-center dark:text-slate-100" placeholder="12.8" />
                    </td>
                    <td className="p-1.5 border-r dark:border-slate-700">
                      <input type="number" step="0.1" className="w-full px-1 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs text-center dark:text-slate-100" placeholder="12.8" />
                    </td>
                    <td className="p-1.5 border-r dark:border-slate-700">
                      <input type="number" className="w-full px-1 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs text-center dark:text-slate-100" placeholder="0" />
                    </td>
                    <td className="p-1.5 border-r dark:border-slate-700">
                      <input type="text" className="w-full px-1 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs text-center dark:text-slate-100" placeholder="-" />
                    </td>
                    <td className="p-1.5 border-r dark:border-slate-700 text-center">
                      <input type="checkbox" className="w-4 h-4 cursor-pointer dark:text-slate-100" />
                    </td>
                    <td className="p-1.5 border-r dark:border-slate-700 text-center">
                      <input type="checkbox" className="w-4 h-4 cursor-pointer dark:text-slate-100" />
                    </td>
                    <td className="p-1.5">
                      <input type="text" className="w-full px-2 py-1.5 border dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-xs dark:text-slate-100" placeholder="Cortes, desgaste irregular..." />
                    </td>
                  </tr>
                ))}
             </tbody>
           </table>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-800 flex justify-end gap-3 rounded-b-xl">
           <Button variant="outline" className="dark:border-slate-700 dark:text-slate-300">Descartar</Button>
           <Button className="bg-blue-600 hover:bg-blue-700 text-white">Guardar Inspección</Button>
        </div>
      </CardContent>
    </Card>
  )
}
