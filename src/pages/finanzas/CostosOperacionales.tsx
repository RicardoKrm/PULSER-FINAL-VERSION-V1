import { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DollarSign, Truck, AlertTriangle, Info, X, Upload } from 'lucide-react';

const MOCK_COSTOS: any[] = [];

export default function CostosOperacionales() {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold flex items-center gap-3"><DollarSign className="w-8 h-8 text-rose-400" /> Gastos por Vehículo</h1>
           <p className="text-slate-300 mt-2 text-lg">Revisa fácilmente cuánto gasta cada vehículo y cuánto dinero le deja a la empresa.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
           <button onClick={() => setIsManualModalOpen(true)} className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center shadow-lg transition-colors">
              <DollarSign className="w-5 h-5 mr-2" /> Agregar Gasto Manual
           </button>
           <button onClick={() => setIsExcelModalOpen(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl border border-white/20 flex items-center justify-center transition-colors">
              Subir Archivo Excel
           </button>
        </div>
      </div>

      <div className="bg-sky-50 dark:bg-sky-900/20 border-2 border-sky-200 dark:border-sky-900 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
         <div className="bg-sky-100 dark:bg-sky-900/50 p-4 rounded-full text-sky-600 dark:text-sky-400">
             <Info className="w-8 h-8" />
         </div>
         <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-sky-900 dark:text-sky-300">Resumen Sencillo</h3>
            <p className="text-lg text-sky-800 dark:text-sky-400 mt-2">
               El vehículo <strong>AB-CD-12</strong> está gastando mucho en taller y combustible. Le recomendamos revisar si vale la pena arreglarlo o usarlo solo en rutas cortas.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {MOCK_COSTOS.map(v => (
           <Card key={v.id} className="bg-white dark:bg-slate-900 border-2 shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800">
              <div className={`p-6 border-b-2 flex flex-col gap-2 ${v.estado === 'excelente' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900' : v.estado === 'regular' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}>
                 <h3 className="font-bold text-2xl text-slate-800 dark:text-slate-200 flex items-center gap-3"><Truck className="w-6 h-6 text-slate-500"/> {v.vehiculo}</h3>
                 <Badge className="text-sm px-3 py-1 w-fit" variant={v.estado === 'regular' ? 'warning' : 'success'}>
                    {v.estado === 'regular' ? 'Revisar Gastos' : 'Gastos Normales'}
                 </Badge>
              </div>
              <CardContent className="p-6 md:p-8 space-y-6">
                 
                 <div>
                    <h4 className="text-lg font-bold text-slate-500 mb-4 border-b pb-2">Gastos del Mes</h4>
                    <div className="space-y-3">
                       {v.detalle.map((d: any, index: number) => (
                         <div key={index} className="flex justify-between items-center text-lg">
                           <span className="text-slate-600 dark:text-slate-300">{d.nombre}</span>
                           <span className="font-medium text-rose-600 font-mono">-${d.monto.toLocaleString()}</span>
                         </div>
                       ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t-2 text-xl font-bold">
                       <span className="text-slate-800 dark:text-white">Total Gastos:</span>
                       <span className="text-rose-600 font-mono">-${v.costoTotal.toLocaleString()}</span>
                    </div>
                 </div>

                 <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-lg text-slate-600 dark:text-slate-300">Total Ganado (Ingresos)</span>
                       <span className="text-xl font-bold font-mono text-slate-800 dark:text-white">${v.ingresos.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-end mt-4 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                       <span className="text-xl font-bold text-slate-800 dark:text-slate-200">Dinero que quedó:</span>
                       <span className={`text-2xl font-black font-mono ${v.ganancia < 1000000 ? 'text-amber-600' : 'text-emerald-600'}`}>${v.ganancia.toLocaleString()}</span>
                    </div>
                 </div>

              </CardContent>
           </Card>
        ))}
      </div>

      {/* Modal Ingreso Manual */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold flex items-center gap-2"><DollarSign className="w-5 h-5 text-rose-500" /> Registrar Gasto</h2>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Vehículo / Patente</label>
                <select className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 outline-none focus:border-rose-500">
                  <option>LDPJ-99 (Van Sprinter)</option>
                  <option>AB-CD-12 (Minibús Volare)</option>
                  <option>MNQP-15 (Van Transit)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Gasto</label>
                <select className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 outline-none focus:border-rose-500">
                  <option>Combustible</option>
                  <option>Taller / Repuestos</option>
                  <option>Peajes</option>
                  <option>Limpieza</option>
                  <option>Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Monto ($)</label>
                <input type="number" placeholder="Ej: 45000" className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 bg-white dark:bg-slate-800 outline-none focus:border-rose-500" />
              </div>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 mt-4 rounded-xl transition-colors">
                Guardar Gasto
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
              <h2 className="text-xl font-bold flex items-center gap-2"><Upload className="w-5 h-5 text-indigo-500" /> Subir Gastos Excel</h2>
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

