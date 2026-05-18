import { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Search, MapPin, ClipboardList, CheckCircle, DollarSign, ArrowRight, TrendingDown, Clock, Activity, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const MOCK_TRAZABILIDAD: any[] = [];

export default function Trazabilidad() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    // Evitar que el click en los botones dispare el expand
    if ((e.target as HTMLElement).closest('button')) return;
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6 text-indigo-400" /> Trazabilidad Integral</h1>
          <p className="text-slate-400 mt-1">Rastreo de dinero, operación, rendimientos y costos ocultos.</p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
      </div>

      <div className="relative w-full md:w-1/2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input placeholder="Buscar OT, folio de servicio, patente..." className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div className="space-y-4">
         {MOCK_TRAZABILIDAD.length > 0 ? (
           MOCK_TRAZABILIDAD.map(srv => {
              const isExpanded = expandedId === srv.id;
              
              return (
                <Card key={srv.id} className="bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden transition-all duration-200">
                   <div 
                     className={`p-4 flex flex-col md:flex-row md:items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800' : ''}`}
                     onClick={(e) => toggleExpand(srv.id, e)}
                   >
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                         <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400 w-24">{srv.id}</h3>
                            <Badge variant={srv.estado === 'Pagado' ? 'success' : srv.estado === 'Facturado' ? 'secondary' : 'warning'}>{srv.estado}</Badge>
                         </div>
                         <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                         <div>
                           <p className="font-bold text-slate-800 dark:text-slate-200">{srv.cliente}</p>
                           <p className="text-xs text-slate-500">{srv.servicio}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-6 justify-between md:justify-end">
                         <div className="text-right">
                           <p className="text-[10px] text-slate-400 font-bold uppercase">Rentabilidad</p>
                           <p className={`font-mono font-bold ${srv.finanzas.ganancia > 100000 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>${srv.finanzas.ganancia.toLocaleString()}</p>
                         </div>
                         <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="hidden sm:inline-flex h-8 text-xs font-bold whitespace-nowrap"><FileText className="w-3 h-3 mr-1"/> Docs</Button>
                            <div className="text-slate-400 w-6 flex justify-center">
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                         </div>
                      </div>
                   </div>
  
                   {isExpanded && (
                     <CardContent className="p-6 bg-white dark:bg-slate-900">
                       
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          {/* COL 1: Info Base */}
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Detalle de Operación</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{srv.cliente}</p>
                            <p className="text-sm text-slate-500 mb-2">Fecha Ops: {srv.fecha}</p>
  
                            <div className="grid grid-cols-2 gap-2 mt-4">
                               <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Distancia</p>
                                  <p className="font-bold text-slate-700 dark:text-slate-300">{srv.estadisticas.distancia} km</p>
                               </div>
                               <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Duración</p>
                                  <p className="font-bold text-slate-700 dark:text-slate-300">{srv.estadisticas.duracion}</p>
                               </div>
                               <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700 col-span-2 flex justify-between items-center">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase">Costo por KM</span>
                                  <span className="font-mono text-sm font-black text-rose-500">${srv.estadisticas.costoKm}</span>
                               </div>
                            </div>
                          </div>
  
                          {/* COL 2: Finanzas */}
                          <div className="border-l-0 md:border-l-2 border-t-2 md:border-t-0 border-slate-100 dark:border-slate-800 pt-6 md:pt-0 md:pl-6 mt-6 md:mt-0">
                             <p className="text-xs font-bold text-slate-400 uppercase mb-4">Estructura Financiera</p>
                             <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Ingreso Facturado</span>
                                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${srv.finanzas.ingreso.toLocaleString()}</span>
                                </div>
                                <div className="pt-2">
                                   <p className="text-[10px] text-slate-400 font-bold mb-1">COSTOS DIRECTOS</p>
                                   {srv.finanzas.costos.map((c, i) => (
                                     <div key={i} className="flex justify-between items-center text-sm py-0.5">
                                       <span className="text-slate-500">- {c.concepto}</span>
                                       <span className="font-mono text-rose-500">-${c.monto.toLocaleString()}</span>
                                     </div>
                                   ))}
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700 mt-2">
                                  <span className="font-bold text-slate-700 dark:text-slate-200">Ganancia Neta</span>
                                  <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">${srv.finanzas.ganancia.toLocaleString()}</span>
                                </div>
                             </div>
                          </div>
  
                          {/* COL 3: Costos Ocultos */}
                          <div className="border-l-0 md:border-l-2 border-t-2 md:border-t-0 border-slate-100 dark:border-slate-800 pt-6 md:pt-0 md:pl-6 mt-6 md:mt-0">
                             <p className="text-xs font-bold text-rose-500 uppercase mb-4 flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Alertas de Costos Ocultos</p>
                             {srv.costos_ocultos.length > 0 ? (
                               srv.costos_ocultos.map((co, i) => (
                                 <div key={i} className="bg-rose-50 dark:bg-rose-900/10 p-3 rounded-lg border border-rose-200 dark:border-rose-900/50 mb-2">
                                    <p className="font-bold text-rose-800 dark:text-rose-300 text-sm">{co.alerta}</p>
                                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{co.detalle}</p>
                                    <p className="font-mono font-bold text-rose-700 dark:text-rose-300 mt-2 text-right">Pérdida: -${co.impacto.toLocaleString()}</p>
                                 </div>
                               ))
                             ) : (
                               <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/50 mb-2 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Sin fugas detectadas</p>
                               </div>
                             )}
                          </div>
                       </div>
  
                       {/* Timeline Operacional */}
                       <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                         <p className="text-xs font-bold text-slate-400 uppercase mb-6 text-center">Línea de Tiempo Operacional y de Pagos</p>
                         <div className="flex flex-col md:flex-row justify-between items-center relative gap-6 md:gap-0">
                            <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 hidden md:block z-0" />
                            
                            {srv.etapas.map((etapa, idx) => {
                               const Icon = etapa.icon;
                               const isCompleted = etapa.status === 'completed';
                               const isCurrent = etapa.status === 'current';
                               
                               return (
                                 <div key={idx} className="relative z-10 flex flex-col items-center gap-2 w-full md:w-auto">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors bg-white dark:bg-slate-900 ${
                                       isCompleted ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 
                                       isCurrent ? 'border-blue-500 text-blue-600 dark:text-blue-400 ring-4 ring-blue-50 dark:ring-blue-900/30' : 
                                       'border-slate-200 dark:border-slate-700 text-slate-400'
                                    }`}>
                                       <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="text-center bg-white dark:bg-slate-900 md:px-2 rounded">
                                      <p className={`text-[10px] font-bold uppercase tracking-wider ${isCompleted ? 'text-indigo-600 dark:text-indigo-400' : isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>{etapa.nombre}</p>
                                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{etapa.date}</p>
                                    </div>
                                 </div>
                               )
                            })}
                         </div>
                       </div>
                     </CardContent>
                   )}
                </Card>
              )
           })
         ) : (
           <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <Activity className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">No hay trazabilidad activa</h3>
             <p className="text-slate-500 max-w-md mx-auto relative z-10">
               El registro de trazabilidad se generará automáticamente a medida que los servicios pasen por sus etapas operativos y se documenten los costos.
             </p>
           </div>
         )}
      </div>
    </div>
  )
}
