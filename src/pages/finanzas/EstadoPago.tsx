import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, Download, DollarSign, Calendar, MessageSquare, Mail, FileText, CheckCircle, Clock, AlertTriangle, ArrowRight, TrendingUp, ClipboardList, X, Upload } from 'lucide-react';

const MOCK_PAGOS: any[] = [];

export default function EstadoPago() {
  const [selectedFactura, setSelectedFactura] = useState<any | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-indigo-600 dark:bg-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Cobranza y Estado de Pago</h1>
          <p className="text-indigo-200 mt-1">Ingresos, proyecciones y automatización de cobros.</p>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-3">
           <Button onClick={() => setIsManualModalOpen(true)} className="!bg-emerald-500 !text-white hover:!bg-emerald-600 font-bold shadow-lg">
             <DollarSign className="w-4 h-4 mr-2" /> Registrar Pago Manual
           </Button>
           <Button onClick={() => setIsExcelModalOpen(true)} variant="outline" className="!bg-white/10 !text-white border-white/20 hover:!bg-white/20 font-bold">
             <Download className="w-4 h-4 mr-2" /> Subir planilla Excel
           </Button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      </div>

      {/* Alerta Inteligente AI */}
      <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-xl p-4 flex items-start gap-4">
         <div className="bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg text-slate-600 dark:text-slate-400 mt-1">
             <CheckCircle className="w-5 h-5" />
         </div>
         <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300">Rendimiento Operacional Normal</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">En este momento, la inteligencia artificial no detecta anomalías. Esperando ingesta de transacciones...</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
           <CardContent className="p-5">
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Cobrado (Este Mes)</p>
             <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">$0</p>
             <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 w-fit px-2 py-1 rounded">
                <TrendingUp className="w-3 h-3" /> 0% vs mes anterior
             </div>
           </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
           <CardContent className="p-5">
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Proyección (Por Cobrar)</p>
             <p className="text-2xl font-black text-blue-600 dark:text-blue-400">$0</p>
             <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                <span>Flujo esperado a 30 días</span>
             </div>
           </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
           <CardContent className="p-5">
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Cartera Morosa</p>
             <p className="text-2xl font-black text-rose-600 dark:text-rose-400">$0</p>
             <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-rose-500 h-full w-[0%]"></div>
             </div>
             <p className="text-[10px] text-slate-400 mt-1 text-right">0% de morosidad total</p>
           </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
           <CardContent className="p-5">
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Promedio de Pago</p>
             <p className="text-2xl font-black text-slate-700 dark:text-slate-200">0 <span className="text-sm font-medium text-slate-400">Días</span></p>
             <p className="text-[10px] text-slate-400 mt-2">Déficit de flujo de caja es nulo.</p>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
           <Card className="bg-white dark:bg-slate-900 shadow-sm border-none ring-1 ring-slate-200 dark:ring-slate-800 p-0 overflow-hidden">
             <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between bg-slate-50/50 dark:bg-slate-800/20">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-indigo-500"/> Facturas Activas</h3>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" className="h-8 text-xs"><Filter className="w-3 h-3 mr-1" /> Filtros</Button>
                </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                   <tr>
                     <th className="p-4">Factura</th>
                     <th className="p-4">Cliente</th>
                     <th className="p-4">Vencimiento</th>
                     <th className="p-4 text-right">Monto</th>
                     <th className="p-4 text-center">Estado (Semáforo)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {MOCK_PAGOS.map(pago => (
                     <tr key={pago.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => setSelectedFactura(pago)}>
                       <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">{pago.id}</td>
                       <td className="p-4 font-medium">{pago.cliente}</td>
                       <td className="p-4">
                          <span className={pago.estado === 'Pendiente' ? 'text-emerald-600' : 'text-rose-600'}>{pago.vencimiento}</span>
                       </td>
                       <td className="p-4 font-mono text-right font-semibold">${pago.monto.toLocaleString()}</td>
                       <td className="p-4 text-center">
                         <div className={`w-3 h-3 rounded-full mx-auto shadow-sm ${pago.estado === 'Pendiente' ? 'bg-emerald-500 shadow-emerald-500/50' : pago.estado === 'Atrasado' ? 'bg-amber-500 shadow-amber-500/50 animate-pulse' : 'bg-rose-600 shadow-rose-600/50 animate-pulse'}`}></div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </Card>
        </div>

        <div className="lg:col-span-1">
           <Card className="bg-white dark:bg-slate-900 border-none shadow-lg ring-1 ring-slate-200 dark:ring-slate-800 sticky top-6">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                 <h3 className="font-bold text-slate-800 dark:text-slate-200">Gestión de Factura{selectedFactura ? `: ${selectedFactura.id}` : ''}</h3>
              </div>
              {selectedFactura ? (
                <CardContent className="p-5">
                   <div className="mb-6">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cliente</h4>
                     <p className="font-bold text-lg">{selectedFactura.cliente}</p>
                     <p className="text-sm text-slate-500">{selectedFactura.servicio}</p>
                   </div>
  
                   <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-6">
                      <div>
                        <p className="text-xs text-slate-500 font-bold mb-1">MONTO ADEUDADO</p>
                        <p className="text-2xl font-black font-mono">${selectedFactura.monto.toLocaleString()}</p>
                      </div>
                      <div>
                        <Badge variant={selectedFactura.estado === 'Pendiente' ? 'success' : 'destructive'} className="uppercase">
                           {selectedFactura.estado}
                        </Badge>
                      </div>
                   </div>
  
                   <div className="mb-6 relative pb-6 border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-4">
                      <div className="relative pl-6">
                         <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                         <p className="text-xs font-bold text-slate-500">Emitida</p>
                         <p className="text-sm font-medium">{selectedFactura.emitido}</p>
                      </div>
                      {selectedFactura.estado !== 'Pendiente' && (
                         <div className="relative pl-6">
                           <span className="absolute -left-[6px] top-1 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-50 dark:ring-amber-900/30"></span>
                           <p className="text-xs font-bold text-amber-600">Vencida</p>
                           <p className="text-sm font-medium">{selectedFactura.vencimiento} <span className="text-xs text-slate-400 font-normal">({selectedFactura.recordatorios} días de atraso)</span></p>
                         </div>
                      )}
                   </div>
  
                   <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cobranza Automática</h4>
                      <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white flex justify-between items-center">
                         <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Enviar WhatsApp</span>
                         <ArrowRight className="w-4 h-4 opacity-50" />
                      </Button>
                      <Button variant="outline" className="w-full flex justify-between items-center text-slate-700 dark:text-slate-300">
                         <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> Enviar Correo con PDF</span>
                         <ArrowRight className="w-4 h-4 opacity-50" />
                      </Button>
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                         <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                            Registrar Pago Recibido
                         </Button>
                      </div>
                   </div>
                </CardContent>
              ) : (
                <div className="p-8 text-center text-slate-500">
                   <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                   <p className="text-sm">Selecciona una factura de la tabla para gestionar su cobranza.</p>
                </div>
              )}
           </Card>
        </div>
      </div>

      {/* Modal Ingreso Manual */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" /> Registrar Pago</h2>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Factura a Pagar</label>
                <select className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 outline-none focus:border-indigo-500">
                  {MOCK_PAGOS.filter(p => p.estado !== 'Pagado').map(p => (
                     <option key={p.id}>{p.id} - {p.cliente}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Medio de Pago</label>
                <select className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 outline-none focus:border-indigo-500">
                  <option>Transferencia Bancaria</option>
                  <option>Cheque</option>
                  <option>Efectivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Monto Pagado ($)</label>
                <input type="number" placeholder="Ej: 1250000" className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 outline-none focus:border-indigo-500" />
              </div>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 mt-4 rounded-xl transition-colors">
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Subir Excel */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold flex items-center gap-2"><Upload className="w-5 h-5 text-indigo-500" /> Subir Planilla (Recaudación)</h2>
              <button onClick={() => setIsExcelModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 text-center space-y-4 border-2 border-dashed border-slate-200 dark:border-slate-700 m-6 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
               <Upload className="w-12 h-12 text-slate-300 mx-auto" />
               <div>
                 <p className="font-bold text-slate-700 dark:text-slate-200">Haz clic para buscar tu archivo (Excel)</p>
                 <p className="text-sm text-slate-500">o arrástralo aquí</p>
               </div>
            </div>
            <div className="p-6 pt-0">
              <button 
                onClick={() => setIsExcelModalOpen(false)}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-colors">
                Procesar Archivo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
