const fs = require('fs');

const file = 'src/pages/flota/GestionNeumaticos.tsx';
let text = fs.readFileSync(file, 'utf8');

if (!text.includes('recharts')) {
  text = text.replace(
    `import Modal from '../../components/ui/Modal';`,
    `import Modal from '../../components/ui/Modal';\nimport { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';`
  );
}

const oldChartStr = `{/* Gráfico Simulado */}
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
            </div>`;

const newChartStr = `            {/* Gráfico Real (Recharts) */}
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
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => \`\${value / 1000}k\`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => \`$\${value}\`} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }}
                     formatter={(value, name) => {
                       if (name === 'Vida Útil (km)') return [\`\${value.toLocaleString()} km\`, name];
                       if (name === 'CPK ($/km)') return [\`$\${(value as number).toFixed(2)}\`, name];
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
                        <Cell key={\`cell-\${index}\`} fill={entry.cpk < 3.2 ? '#10b981' : entry.cpk < 3.5 ? '#f59e0b' : '#ef4444'} />
                      ))
                    }
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="cpk" name="CPK ($/km)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>`;

text = text.replace(oldChartStr, newChartStr);

fs.writeFileSync(file, text);
console.log("Replaced chart with Recharts");
