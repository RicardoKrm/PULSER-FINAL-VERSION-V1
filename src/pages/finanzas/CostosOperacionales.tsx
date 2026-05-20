import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DollarSign, Truck, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

export default function CostosOperacionales() {
  const { activeCompanyId } = useCompany();
  const [vehiculosStats, setVehiculosStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (activeCompanyId) {
      fetchData();
    }
  }, [activeCompanyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: vehData, error: vehError } = await supabase
        .from('vehiculo')
        .select('*')
        .eq('empresa_id', activeCompanyId);
      
      if (!vehError && vehData) {
        const stats = vehData.map(v => {
           const registros = v.detalles?.registros_financieros || [];
           const gastos = registros.filter((r: any) => r.tipo === 'Costo/Egreso');
           const ingresos = registros.filter((r: any) => r.tipo === 'Ingreso');
           
           const costoTotal = gastos.reduce((sum: number, r: any) => sum + r.monto, 0);
           const ingresoTotal = ingresos.reduce((sum: number, r: any) => sum + r.monto, 0);
           const ganancia = ingresoTotal - costoTotal;
           
           let estado = 'normal';
           if (costoTotal > ingresoTotal && ingresoTotal > 0) estado = 'alerta';
           else if (ganancia > costoTotal * 1.5) estado = 'excelente';
           else if (costoTotal > 0 && ingresoTotal === 0) estado = 'regular';
           
           return {
             id: v.id,
             vehiculo: `${v.patente || 'S/P'} - ${v.modelo || 'Sin Modelo'}`,
             estado,
             detalle: gastos.map((g: any) => ({ nombre: g.categoria || g.descripcion, monto: g.monto })),
             costoTotal,
             ingresos: ingresoTotal,
             ganancia
           };
        });
        
        stats.sort((a, b) => b.costoTotal - a.costoTotal);
        setVehiculosStats(stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold flex items-center gap-3"><DollarSign className="w-8 h-8 text-rose-400" /> Gastos por Vehículo</h1>
           <p className="text-slate-300 mt-2 text-lg">Análisis de viabilidad y control de costos registrados por unidad (Datos reales).</p>
        </div>
      </div>

      <div className="bg-sky-50 dark:bg-sky-900/20 border-2 border-sky-200 dark:border-sky-900 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
         <div className="bg-sky-100 dark:bg-sky-900/50 p-4 rounded-full text-sky-600 dark:text-sky-400">
             <Info className="w-8 h-8" />
         </div>
         <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-sky-900 dark:text-sky-300">Resumen de Análisis</h3>
            <p className="text-lg text-sky-800 dark:text-sky-400 mt-2">
               {vehiculosStats.length > 0 && vehiculosStats[0].costoTotal > 0 ? (
                 <>El vehículo <strong>{vehiculosStats[0].vehiculo}</strong> presenta el mayor costo registrado. Verifique la relación de gastos en la tarjeta correspondiente.</>
               ) : (
                 <>No hay suficientes gastos registrados aún para generar reportes analíticos.</>
               )}
            </p>
         </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-bold">Cargando datos operativos...</div>
      ) : vehiculosStats.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
           No tienes unidades registradas o sin datos de costos.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {vehiculosStats.map(v => (
             <Card key={v.id} className="bg-white dark:bg-slate-900 border-2 shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800">
                <div className={`p-6 border-b-2 flex flex-col gap-2 ${v.estado === 'excelente' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900' : v.estado === 'alerta' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900' : v.estado === 'regular' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}>
                   <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 flex items-center gap-3"><Truck className="w-6 h-6 text-slate-500"/> {v.vehiculo}</h3>
                   <Badge className="text-sm px-3 py-1 w-fit" variant={v.estado === 'excelente' ? 'success' : v.estado === 'alerta' ? 'destructive' : v.estado === 'regular' ? 'warning' : 'outline'}>
                      {v.estado === 'excelente' ? 'Alta Rentabilidad' : v.estado === 'alerta' ? 'Alerta: Costos altos' : v.estado === 'regular' ? 'Solo Gastos' : 'Gastos Normales'}
                   </Badge>
                </div>
                <CardContent className="p-6 space-y-6">
                   
                   <div>
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 border-b pb-2">Gastos Registrados</h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                         {v.detalle.length === 0 && <p className="text-slate-400 text-sm italic">Sin gastos registrados.</p>}
                         {v.detalle.map((d: any, index: number) => (
                           <div key={index} className="flex justify-between items-center text-sm">
                             <span className="text-slate-600 dark:text-slate-300 w-2/3 truncate" title={d.nombre}>{d.nombre}</span>
                             <span className="font-bold text-rose-600 font-mono">-${d.monto.toLocaleString('es-CL')}</span>
                           </div>
                         ))}
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-slate-100 dark:border-slate-800 text-lg font-bold">
                         <span className="text-slate-800 dark:text-white">Total Gastos:</span>
                         <span className="text-rose-600 font-mono">-${v.costoTotal.toLocaleString('es-CL')}</span>
                      </div>
                   </div>

                   <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Ingresos</span>
                         <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">${v.ingresos.toLocaleString('es-CL')}</span>
                      </div>
                      
                      <div className="flex justify-between items-end mt-4 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                         <span className="text-base font-bold text-slate-800 dark:text-slate-200">Balance Real:</span>
                         <span className={`text-xl font-black font-mono ${v.ganancia < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>${v.ganancia.toLocaleString('es-CL')}</span>
                      </div>
                   </div>

                </CardContent>
             </Card>
          ))}
        </div>
      )}
    </div>
  )
}
