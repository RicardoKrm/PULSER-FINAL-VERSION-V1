const fs = require('fs');

const file = 'src/pages/flota/GestionNeumaticos.tsx';
let text = fs.readFileSync(file, 'utf8');

// Update DashboardNeumaticos
const dashboardCode = `function DashboardNeumaticos() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-md">
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
        
        <Card className="bg-white dark:bg-slate-900 shadow-md">
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

        <Card className="bg-white dark:bg-slate-900 shadow-md">
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

        <Card className="bg-white dark:bg-slate-900 shadow-md">
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
            {/* Gráfico Simulado */}
            <div className="relative h-64 w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border dark:border-slate-800 p-4 flex flex-col justify-end gap-2 isolate overflow-hidden">
                {/* Background grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 z-0 pointer-events-none opacity-50">
                   {[1,2,3,4,5].map(x => <div key={x} className="w-full border-b dark:border-slate-700/50 flex-1"></div>)}
                </div>
                
                {/* Bars */}
                <div className="flex justify-around items-end w-full h-[80%] z-10 px-2 mt-auto">
                    {[
                      { model: 'Michelin XZE2', value: 95, cost: '$3.00', color: 'bg-emerald-500' },
                      { model: 'BStone R268', value: 85, cost: '$3.11', color: 'bg-emerald-400' },
                      { model: 'GYear KMAX', value: 75, cost: '$3.29', color: 'bg-amber-400' },
                      { model: 'Pirelli Form', value: 60, cost: '$3.68', color: 'bg-red-400' },
                      { model: 'FateCargo', value: 65, cost: '$3.40', color: 'bg-orange-400' },
                    ].map((bar, i) => (
                       <div key={i} className="flex flex-col items-center gap-2 group w-16">
                          <div className="relative w-full rounded-t-sm flex flex-col justify-end items-center opacity-90 group-hover:opacity-100 transition-opacity" style={{height: \`\${bar.value}%\`}}>
                             <div className={cn("absolute inset-0 rounded-t-sm", bar.color)}></div>
                             <span className="relative text-xs font-bold text-white z-10 mb-2 truncate px-1 drop-shadow-md">{bar.cost}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center uppercase leading-tight">{bar.model.replace(' ', '\\n')}</span>
                       </div>
                    ))}
                </div>
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
    </div>
  );
}`;

text = text.replace(/function DashboardNeumaticos\(\) \{[\s\S]*?function InventarioNeumaticos\(\)/, dashboardCode + '\n\nfunction InventarioNeumaticos()');

// Update FormularioInspeccion 2x2
text = text.replace(
  '<option value="6">2 Ejes (6 Neumáticos)</option>',
  '<option value="4">2 Ejes / Config. 2x2 (4 Neumáticos)</option>\n               <option value="6">2 Ejes (6 Neumáticos)</option>'
);

// We need to add imports to lucide-react if missed (DollarSign, ChevronUp)
if(!text.includes('ChevronUp') || !text.includes('DollarSign')) {
  text = text.replace(
    "import { Plus, Search, Activity, CircleDashed, BarChart3, Truck, Trash, ChevronDown, AlertCircle } from 'lucide-react';",
    "import { Plus, Search, Activity, CircleDashed, BarChart3, Truck, Trash, ChevronDown, AlertCircle, ChevronUp, DollarSign } from 'lucide-react';"
  );
}

fs.writeFileSync(file, text);
console.log("Enhanced dashboard and added 2x2");
