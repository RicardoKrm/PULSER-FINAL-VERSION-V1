import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Activity, CircleDashed, BarChart3, Truck, Trash, ChevronDown, AlertCircle, ChevronUp, DollarSign, X, Info, TrendingUp, AlertTriangle } from 'lucide-react';
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
            <CircleDashed className="w-4 h-4" /> Inventario Maestro
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
  const inventory = [
    { id: "DOT-M1933", marca: "Michelin", modelo: "XZE2", medida: "295/80R22.5", tipo: "Original", estado: "Montado", placa: "KBCX-45", pos: 3, costo: 450000, km: 45000 },
    { id: "DOT-B9921", marca: "Bridgestone", modelo: "M729", medida: "295/80R22.5", tipo: "Reencauche (R1)", estado: "Montado", placa: "LDPJ-99", pos: 8, costo: 180000, km: 12000 },
    { id: "DOT-G551x", marca: "Goodyear", modelo: "KMAX S", medida: "295/80R22.5", tipo: "Original", estado: "Bodega", placa: "-", pos: null, costo: 395000, km: 0 },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800 rounded-t-xl mb-4 p-4">
         <CardTitle>Registro Maestro de Neumáticos</CardTitle>
         <Button className="bg-blue-600 text-white" size="sm"><Plus className="w-4 h-4 mr-2" /> Agregar</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-left border-b dark:border-slate-800">
              <tr>
                <th className="pb-3 pr-4">ID/DOT</th>
                <th className="pb-3 px-4">Marca y Modelo</th>
                <th className="pb-3 px-4">Medida</th>
                <th className="pb-3 px-4">Tipo</th>
                <th className="pb-3 px-4">Estado Actual</th>
                <th className="pb-3 px-4">Ubicación</th>
                <th className="pb-3 px-4 text-right">Km Recorrido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {inventory.map((inv, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 pr-4 font-mono text-sm text-slate-800 dark:text-slate-200 font-semibold">{inv.id}</td>
                  <td className="py-3 px-4">
                     <div className="font-semibold text-slate-700 dark:text-slate-300">{inv.marca}</div>
                     <div className="text-xs text-slate-500 dark:text-slate-400">{inv.modelo}</div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{inv.medida}</td>
                  <td className="py-3 px-4">
                     <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{inv.tipo}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded uppercase",
                      inv.estado === 'Montado' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                      {inv.estado}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                     {inv.estado === 'Montado' ? `${inv.placa} (Pos: ${inv.pos})` : 'Bodega Central'}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                     {inv.km.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
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
