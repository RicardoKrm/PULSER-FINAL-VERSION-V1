import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Star, ShieldAlert, CheckCircle, Building, AlertTriangle, TrendingUp, Cpu } from 'lucide-react';

const MOCK_EMPRESAS: any[] = [];

export default function EvaluacionEmpresa() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Cpu className="w-6 h-6 text-indigo-400" /> Inteligencia Gerencial: Evaluación</h1>
          <p className="text-slate-400 mt-1">Evaluación financiera y operacional apoyada por IA.</p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-xl p-4 flex items-start gap-4">
         <div className="bg-slate-100 dark:bg-slate-900/50 p-2 rounded-lg text-slate-600 dark:text-slate-400 mt-1">
             <Cpu className="w-5 h-5" />
         </div>
         <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300">Esperando Datos...</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">La IA necesita que comiences a registrar estados de pago, trazabilidad y cobros para generar análisis financieros.</p>
         </div>
      </div>

      {MOCK_EMPRESAS.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <Building className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Sin Evaluaciones Disponibles</h3>
          <p className="text-slate-500 max-w-md mx-auto relative z-10">
            Aún no hay suficiente información histórica para calificar o generar modelos de riesgo sobre las empresas cliente. Registre operaciones y estados de pago para comenzar el análisis.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_EMPRESAS.map(emp => (
            <Card key={emp.id} className="bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col">
               <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/20">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
                      <Building className="w-5 h-5" />
                   </div>
                   <h3 className="font-bold text-slate-800 dark:text-slate-200">{emp.nombre}</h3>
                 </div>
               </div>
               
               <CardContent className="pt-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                         <Star key={i} className={`w-4 h-4 ${i < Math.floor(emp.calificacion) ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
                      ))}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{emp.calificacion.toFixed(1)} / 5.0</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                     <div>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Riesgo Financiero</p>
                       <Badge variant={emp.eval_fin === 'Bajo' ? 'success' : emp.eval_fin === 'Medio' ? 'warning' : 'destructive'} className="uppercase">
                         {emp.eval_fin}
                       </Badge>
                     </div>
                     <div>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Eficiencia Ops</p>
                       <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{emp.eval_ops}</span>
                     </div>
                     <div>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Morosidad Histórica</p>
                       <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{emp.morosidad}</span>
                     </div>
                     <div>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Margen Utilidad Real</p>
                       <span className={`font-bold text-sm ${parseFloat(emp.utilidad) > 30 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{emp.utilidad}</span>
                     </div>
                  </div>

                  <div className="mt-auto bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 italic leading-relaxed">"{emp.comentarios}"</p>
                  </div>
               </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
