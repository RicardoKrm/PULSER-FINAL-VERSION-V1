import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Activity, CircleDashed, BarChart3, Truck, Trash, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import Modal from '../../components/ui/Modal';

export default function GestionNeumaticos() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventario' | 'inspeccion'>('dashboard');

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
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setActiveTab('dashboard')}
            className={activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'dark:border-slate-800 dark:text-slate-300'}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Rentabilidad
          </Button>
          <Button 
            variant={activeTab === 'inventario' ? 'default' : 'outline'}
            onClick={() => setActiveTab('inventario')}
            className={activeTab === 'inventario' ? 'bg-blue-600 text-white' : 'dark:border-slate-800 dark:text-slate-300'}
          >
            <CircleDashed className="w-4 h-4 mr-2" />
            Inventario
          </Button>
          <Button 
            variant={activeTab === 'inspeccion' ? 'default' : 'outline'}
            onClick={() => setActiveTab('inspeccion')}
            className={activeTab === 'inspeccion' ? 'bg-blue-600 text-white' : 'dark:border-slate-800 dark:text-slate-300'}
          >
            <Activity className="w-4 h-4 mr-2" />
            Nueva Inspección
          </Button>
        </div>
      </div>

      {activeTab === 'dashboard' && <DashboardNeumaticos />}
      {activeTab === 'inventario' && <InventarioNeumaticos />}
      {activeTab === 'inspeccion' && <FormularioInspeccion />}
    </div>
  );
}

function DashboardNeumaticos() {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Rentabilidad por Marca y Modelo ($/km)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-lg">
            <span className="text-slate-400">Gráfico de Rentabilidad CPK (Simulado)</span>
          </div>
          <div className="mt-6 flex flex-col gap-4">
             <div className="grid grid-cols-4 gap-4 text-xs font-bold text-slate-500 uppercase pb-2 border-b dark:border-slate-800">
               <div>Marca - Perfil</div>
               <div>Vida Útil Prom.</div>
               <div>Costo Prom.</div>
               <div className="text-right">CPK ($/km)</div>
             </div>
             {[
               { m: "Michelin XZE2", v: "150,000 km", c: "$450,000", cpk: "$3.00", color: "text-emerald-500" },
               { m: "Bridgestone R268", v: "135,000 km", c: "$420,000", cpk: "$3.11", color: "text-emerald-500" },
               { m: "Goodyear KMAX", v: "120,000 km", c: "$395,000", cpk: "$3.29", color: "text-orange-500" },
               { m: "Pirelli Formula", v: "95,000 km", c: "$350,000", cpk: "$3.68", color: "text-red-500" }
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
        <Card>
          <CardHeader>
             <CardTitle className="text-sm">Alertas de Inspección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {[
               { pat: "KBCX-45", pos: "Pos 4", txt: "Baja presión (90 PSI)", t: "Hace 2 hrs" },
               { pat: "LDPJ-99", pos: "Pos 8, 9", txt: "Surco crítico (3mm), programar retiro", t: "Ayer" },
               { pat: "FRTY-12", pos: "Pos 2", txt: "Desgaste irregular detectado", t: "Ayer" }
             ].map((a, i) => (
                <div key={i} className="flex gap-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-700 dark:text-red-400">{a.pat} - {a.pos}</p>
                    <p className="text-xs text-red-600 dark:text-red-300">{a.txt}</p>
                    <p className="text-[10px] text-red-400 dark:text-red-500 mt-1">{a.t}</p>
                  </div>
                </div>
             ))}
          </CardContent>
        </Card>
      </div>
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
