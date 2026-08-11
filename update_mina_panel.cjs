const fs = require('fs');

let content = fs.readFileSync('src/pages/produccion/ReporteDiarioMinaPanel.tsx', 'utf-8');

const newLayout = `
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Date Selector Sidebar */}
        <Card className="p-4 lg:w-64 shrink-0 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Filtro y Selección
          </h3>
          
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
              Mes del Reporte
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full text-sm rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-1.5 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
            >
              {availableMonths.length === 0 && <option value="">Sin datos</option>}
              {availableMonths.map(month => {
                const [year, m] = month.split('-');
                const date = new Date(parseInt(year), parseInt(m) - 1, 1);
                const monthName = date.toLocaleString('es-CL', { month: 'long', year: 'numeric' });
                return (
                  <option key={month} value={month}>
                    {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">
            Días disponibles:
          </div>
          <div className="space-y-2 overflow-y-auto flex-1 max-h-[600px] pr-1 custom-scrollbar">
            {data.length === 0 ? (
              <div className="text-sm text-gray-500 italic text-center py-4">No hay días en este mes</div>
            ) : (
              data.map(row => {
                const formattedDate = \`Día \${row.dia.toString().padStart(2, '0')} \`;
                return (
                  <button
                    key={row.dia}
                    onClick={() => setSelectedDate(row.dia)}
                    className={\`w-full text-left px-3 py-2 rounded-md text-sm transition-colors \${
                      selectedDate === row.dia
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800/50'
                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'
                    }\`}
                  >
                    {formattedDate}
                  </button>
                )
              })
            )}
          </div>
        </Card>

        {/* Detalle del día */}
        <div className="flex-1 space-y-6">
          {activeRow ? (
            <>
               {/* Turno Día */}
               <Card className="p-6">
                 <div className="border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                       Fecha: <span className="font-normal text-gray-600 dark:text-slate-400">{selectedMonth}-{activeRow.dia.toString().padStart(2, '0')}</span>
                     </h3>
                     <div className="flex flex-col items-end">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200">
                         Turno: Día
                       </span>
                       {activeRow.supervisor && (
                         <div className="mt-2 flex flex-col items-end">
                           <span className="text-sm text-slate-500 dark:text-slate-400">Supervisor de Turno</span>
                           <div className="mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                             <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{activeRow.supervisor}</span>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                   <div className="text-md text-gray-700 dark:text-slate-300 font-medium">
                     Totales del turno:{' '}
                     <span className="text-blue-600">{activeRow.vueltas_dia} Vueltas</span> |{' '}
                     <span className="text-blue-600">{formatNum(activeRow.produccion_dia)} Toneladas</span>
                   </div>
                 </div>

                 <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                     <thead className="bg-gray-50 dark:bg-slate-800">
                       <tr>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Cant. CAEX</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Operadores</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Acopio / Planta</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Pases CF / Totales</th>
                         <th className="px-4 py-3 text-right text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Prod. Imperia</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                       <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{activeRow.cantidad_caex_dia}</td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{activeRow.operadores_dia}</td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                           <span className="text-emerald-600 dark:text-emerald-400">{activeRow.acopio_dia}</span> / <span className="text-blue-600 dark:text-blue-400">{activeRow.planta_dia}</span>
                         </td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium">
                           {activeRow.pases_cf_dia} / {activeRow.pases_totales_dia}
                         </td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-indigo-600 dark:text-indigo-400">
                           {formatNum(activeRow.produccion_dia)}
                         </td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
               </Card>

               {/* Turno Noche */}
               <Card className="p-6">
                 <div className="border-b border-gray-200 dark:border-slate-700 pb-4 mb-4">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                       Fecha: <span className="font-normal text-gray-600 dark:text-slate-400">{selectedMonth}-{activeRow.dia.toString().padStart(2, '0')}</span>
                     </h3>
                     <div className="flex flex-col items-end">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200">
                         Turno: Noche
                       </span>
                       {activeRow.supervisor_noche && (
                         <div className="mt-2 flex flex-col items-end">
                           <span className="text-sm text-slate-500 dark:text-slate-400">Supervisor de Turno</span>
                           <div className="mt-1 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                             <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">{activeRow.supervisor_noche}</span>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                   <div className="text-md text-gray-700 dark:text-slate-300 font-medium">
                     Totales del turno:{' '}
                     <span className="text-blue-600">{activeRow.vueltas_noche} Vueltas</span> |{' '}
                     <span className="text-blue-600">{formatNum(activeRow.produccion_noche)} Toneladas</span>
                   </div>
                 </div>

                 <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                     <thead className="bg-gray-50 dark:bg-slate-800">
                       <tr>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Cant. CAEX</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Operadores</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Acopio / Planta</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Pases CF / Totales</th>
                         <th className="px-4 py-3 text-right text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Prod. Imperia</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                       <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">{activeRow.cantidad_caex_noche}</td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{activeRow.operadores_noche}</td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                           <span className="text-emerald-600 dark:text-emerald-400">{activeRow.acopio_noche}</span> / <span className="text-blue-600 dark:text-blue-400">{activeRow.planta_noche}</span>
                         </td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium">
                           {activeRow.pases_cf_noche} / {activeRow.pases_totales_noche}
                         </td>
                         <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-indigo-600 dark:text-indigo-400">
                           {formatNum(activeRow.produccion_noche)}
                         </td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
               </Card>
            </>
          ) : (
            <Card className="p-12 flex flex-col items-center justify-center text-center">
              <Database className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-xl font-medium text-slate-700 dark:text-slate-300">Selecciona una fecha</h3>
              <p className="text-slate-500 mt-2 max-w-sm">Usa el panel lateral para ver el detalle de producción diario y las comparativas de los turnos de este mes.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
`;

const startIndex = content.indexOf('<div className="flex flex-col lg:flex-row gap-6">');
if (startIndex !== -1) {
  content = content.substring(0, startIndex) + newLayout;
}

fs.writeFileSync('src/pages/produccion/ReporteDiarioMinaPanel.tsx', content);
