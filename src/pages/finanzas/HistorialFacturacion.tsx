import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, Download, FileText, Calendar, TrendingUp, BarChart2, DollarSign } from 'lucide-react';

const MOCK_OP: any[] = [];
const MOCK_HISTORIAL: any[] = [];

export default function HistorialFacturacion() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart2 className="w-6 h-6 text-indigo-400" /> Analítica y Facturación</h1>
          <p className="text-slate-400 mt-1">Rentabilidad por factura, comparativas y márgenes operacionales.</p>
        </div>
        <div className="relative z-10 flex gap-2">
           <Button variant="outline" className="!text-white border-white/20 hover:bg-white/10"><Download className="w-4 h-4 mr-2" /> Exportar (Excel/SII)</Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Comparador Mensual */}
         <Card className="bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 md:col-span-2">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <h3 className="font-bold text-slate-800 dark:text-slate-200">Comparador Mensual</h3>
            </div>
            <CardContent className="p-5 flex gap-4">
               {MOCK_OP.length > 0 ? (
                 MOCK_OP.map(m => {
                    const mt = m.facturacion - m.costo;
                    return (
                      <div key={m.mes} className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                         <p className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-3">{m.mes}</p>
                         <div className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-xs text-slate-500">Facturación</span>
                              <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">${(m.facturacion/1000000).toFixed(1)}M</span>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-xs text-slate-500">Costos</span>
                              <span className="font-mono text-sm font-medium text-rose-500">-${(m.costo/1000000).toFixed(1)}M</span>
                            </div>
                            <div className="flex justify-between items-end pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Margen</span>
                              <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">${(mt/1000000).toFixed(1)}M</span>
                            </div>
                         </div>
                      </div>
                    )
                 })
               ) : (
                  <div className="w-full text-center py-6 text-slate-500">
                    <p className="text-sm">Aún no hay comparativas mensuales dado que no existen registros procesados.</p>
                  </div>
               )}
            </CardContent>
         </Card>

         <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30">
            <div className="p-4 border-b border-indigo-100 dark:border-indigo-900/30">
               <h3 className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Tendencias Automáticas</h3>
            </div>
            <CardContent className="p-5 space-y-4">
               {MOCK_OP.length > 0 ? (
                 <>
                   <div>
                     <p className="text-xs text-indigo-500 font-bold uppercase">Servicio Más Rentable</p>
                     <p className="font-bold text-indigo-900 dark:text-indigo-100 mt-1">Transporte Personal Mensual</p>
                     <p className="text-xs text-indigo-600 dark:text-indigo-400">Generó 55% de la utilidad total.</p>
                   </div>
                   <div>
                     <p className="text-xs text-rose-500 font-bold uppercase">Alerta de Margen</p>
                     <p className="font-bold text-rose-900 dark:text-rose-100 mt-1">Turismo Extremo</p>
                     <p className="text-xs text-rose-600 dark:text-rose-400">Rentabilidad bajó al 10% por altos costos de combustible en ruta.</p>
                   </div>
                 </>
               ) : (
                 <div className="text-center py-4">
                   <p className="text-sm text-indigo-600/70 dark:text-indigo-400/70">Esperando datos operacionales para calcular tendencias.</p>
                 </div>
               )}
            </CardContent>
         </Card>
      </div>

      <Card className="bg-white dark:bg-slate-900">
         <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
             <div>
               <h3 className="font-bold text-slate-800 dark:text-slate-200">Facturación por Operación</h3>
               <p className="text-xs text-slate-500">Análisis detallado de rentabilidad por factura emitida.</p>
             </div>
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input placeholder="Buscar factura..." className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
             </div>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm whitespace-nowrap">
             <thead className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
               <tr className="border-b border-slate-100 dark:border-slate-800">
                 <th className="p-4">Doc</th>
                 <th className="p-4">Detalle Operacional</th>
                 <th className="p-4 text-right">Facturado</th>
                 <th className="p-4 text-right">Costos (Comb/Chofer/Peaje)</th>
                 <th className="p-4 text-right border-l border-slate-100 dark:border-slate-800">Margen Neto</th>
                 <th className="p-4 text-center">% Rentabilidad</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
               {MOCK_HISTORIAL.length > 0 ? (
                 MOCK_HISTORIAL.map(doc => (
                 <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                   <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">{doc.id}</td>
                   <td className="p-4">
                     <p className="font-bold text-slate-800 dark:text-slate-200">{doc.cliente}</p>
                     <p className="text-xs text-slate-500">{doc.servicio} | Vehículo: {doc.vehiculo}</p>
                   </td>
                   <td className="p-4 font-mono text-right font-semibold text-slate-700 dark:text-slate-300">${doc.facturado.toLocaleString()}</td>
                   <td className="p-4 font-mono text-right text-rose-500 font-medium">-${doc.costos.toLocaleString()}</td>
                   <td className="p-4 font-mono text-right text-emerald-600 dark:text-emerald-400 font-black border-l border-slate-100 dark:border-slate-800">${doc.margen.toLocaleString()}</td>
                   <td className="p-4 text-center">
                     <Badge variant={doc.rentabilidad < 20 ? 'destructive' : doc.rentabilidad < 40 ? 'warning' : 'success'}>
                        {doc.rentabilidad}%
                     </Badge>
                   </td>
                 </tr>
                 ))
               ) : (
                 <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="font-bold">No hay facturación registrada</p>
                      <p className="text-sm mt-1">Los datos aparecerán aquí una vez que se emitan facturas de servicios.</p>
                    </td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
      </Card>
    </div>
  )
}
