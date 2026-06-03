import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DollarSign, Truck, Info, AlertTriangle, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

export default function CostosOperacionales() {
  const { activeCompanyId } = useCompany();
  const [vehiculosStats, setVehiculosStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [fechaDesde, setFechaDesde] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaHasta, setFechaHasta] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  );
  
  useEffect(() => {
    if (activeCompanyId) {
      fetchData();
    }
  }, [activeCompanyId, fechaDesde, fechaHasta]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
         { data: vehData, error: vehError },
         { data: otsData },
         { data: insumosOt }
      ] = await Promise.all([
         supabase.from('vehiculo').select('id, patente, modelo, detalles').eq('empresa_id', activeCompanyId),
         supabase.from('orden_de_trabajo').select('id, vehiculo_id, tipo, estado').eq('empresa_id', activeCompanyId).gte('fecha_creacion', fechaDesde).lte('fecha_creacion', fechaHasta),
         supabase.from('detalle_insumo_ot').select('orden_id, cantidad, costo_unitario_aplicado, repuesto(precio_unitario)')
      ]);
      
      if (!vehError && vehData) {
        
        // Map OT costs
        const otCostByVehiculo: Record<string, { preventivo: number, correctivo: number }> = {};
        
        if (otsData && insumosOt) {
           const otCosts: Record<string, number> = {};
           insumosOt.forEach(io => {
              const qty = Number(io.cantidad || 0);
              const pUnit = Number(io.costo_unitario_aplicado || (io.repuesto as any)?.precio_unitario || 0);
              otCosts[io.orden_id] = (otCosts[io.orden_id] || 0) + (qty * pUnit);
           });
           
           otsData.forEach(ot => {
              const cost = otCosts[ot.id] || 0;
              if (cost > 0) {
                 if (!otCostByVehiculo[ot.vehiculo_id]) {
                    otCostByVehiculo[ot.vehiculo_id] = { preventivo: 0, correctivo: 0 };
                 }
                 const tipo = String(ot.tipo || '').toLowerCase();
                 if (tipo.includes('preventivo')) {
                    otCostByVehiculo[ot.vehiculo_id].preventivo += cost;
                 } else {
                    otCostByVehiculo[ot.vehiculo_id].correctivo += cost;
                 }
              }
           });
        }

        const stats = vehData.map(v => {
           const registros = v.detalles?.registros_financieros || [];
           
           // Filter by date
           const filteredRegistros = registros.filter((r: any) => {
              const rFecha = r.fecha || r.created_at || '';
              return rFecha >= fechaDesde && rFecha <= fechaHasta;
           });

           const gastosBase = filteredRegistros.filter((r: any) => r.tipo === 'Costo/Egreso').map((g: any) => ({
               nombre: g.categoria || g.descripcion,
               monto: Number(g.monto || 0)
           }));
           
           // Add OT maintenance costs if available
           const extraCosts = otCostByVehiculo[v.id] || { preventivo: 0, correctivo: 0 };
           if (extraCosts.preventivo > 0) {
              gastosBase.push({ nombre: 'Mantenimiento Preventivo (OTs)', monto: extraCosts.preventivo });
           }
           if (extraCosts.correctivo > 0) {
              gastosBase.push({ nombre: 'Mantenimiento Correctivo (OTs)', monto: extraCosts.correctivo });
           }

           const ingresos = filteredRegistros.filter((r: any) => r.tipo === 'Ingreso');
           
           const costoTotal = gastosBase.reduce((sum: number, r: any) => sum + r.monto, 0);
           const ingresoTotal = ingresos.reduce((sum: number, r: any) => sum + Number(r.monto || 0), 0);
           const ganancia = ingresoTotal - costoTotal;
           
           let estado = 'normal';
           if (costoTotal > ingresoTotal && ingresoTotal > 0) estado = 'alerta';
           else if (ganancia > costoTotal * 1.5) estado = 'excelente';
           else if (costoTotal > 0 && ingresoTotal === 0) estado = 'regular';
           
           return {
             id: v.id,
             vehiculo: `${v.patente || 'S/P'} - ${v.modelo || 'Sin Modelo'}`,
             estado,
             detalle: gastosBase,
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
           <h1 className="text-3xl font-bold flex items-center gap-3"><DollarSign className="w-8 h-8 text-rose-400" /> Costos Operacionales</h1>
           <p className="text-slate-300 mt-2 text-lg">Análisis de viabilidad y control de costos registrados por unidad (Datos reales).</p>
        </div>
        
        <div className="flex bg-slate-800 rounded-lg p-2 gap-2 border border-slate-700 w-full md:w-auto">
           <div className="flex flex-col px-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Desde</span>
              <input 
                type="date" 
                value={fechaDesde} 
                onChange={e => setFechaDesde(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-semibold text-white [color-scheme:dark]"
              />
           </div>
           <div className="w-px bg-slate-700"></div>
           <div className="flex flex-col px-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hasta</span>
              <input 
                type="date" 
                value={fechaHasta} 
                onChange={e => setFechaHasta(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-semibold text-white [color-scheme:dark]"
              />
           </div>
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
                 <>No hay suficientes gastos registrados en el periodo consultado.</>
               )}
            </p>
         </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-bold flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div>
            Cargando datos operativos...
        </div>
      ) : vehiculosStats.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
           No tienes unidades registradas o sin datos de costos.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {vehiculosStats.map(v => (
             <Card key={v.id} className="bg-white dark:bg-slate-900 border-2 shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-2xl border-slate-200 dark:border-slate-800 flex flex-col">
                <div className={`p-6 border-b-2 flex flex-col gap-2 ${v.estado === 'excelente' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900' : v.estado === 'alerta' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900' : v.estado === 'regular' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}>
                   <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 flex items-center gap-3"><Truck className="w-6 h-6 text-slate-500"/> {v.vehiculo}</h3>
                   <div className="flex flex-wrap gap-2 mt-1">
                       <Badge className="text-[11px] font-bold px-3 py-1 w-fit tracking-wider uppercase" variant={v.estado === 'excelente' ? 'success' : v.estado === 'alerta' ? 'destructive' : v.estado === 'regular' ? 'warning' : 'outline'}>
                          {v.estado === 'excelente' ? 'Alta Rentabilidad' : v.estado === 'alerta' ? 'Alerta: Costos altos' : v.estado === 'regular' ? 'Solo Gastos' : 'Gastos Normales'}
                       </Badge>
                   </div>
                </div>
                <CardContent className="p-6 space-y-6 flex-1 flex flex-col">
                   
                   <div className="flex-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                         <span>Desglose de Gastos</span>
                         <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{v.detalle.length} Registros</span>
                      </h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                         {v.detalle.length === 0 && <p className="text-slate-400 text-sm italic">Sin gastos registrados.</p>}
                         {v.detalle.map((d: any, index: number) => (
                           <div key={index} className="flex justify-between items-center text-sm">
                             <div className="flex items-center gap-2 w-2/3">
                                 <span className={`w-1.5 h-1.5 rounded-full ${d.nombre.includes('Mantenimiento') ? 'bg-indigo-500' : 'bg-rose-500'}`}></span>
                                 <span className="text-slate-600 dark:text-slate-300 truncate" title={d.nombre}>{d.nombre}</span>
                             </div>
                             <span className="font-bold text-slate-700 dark:text-slate-200 font-mono text-xs">
                               ${d.monto.toLocaleString('es-CL')}
                             </span>
                           </div>
                         ))}
                      </div>
                      
                      <div className="flex justify-between items-center mt-6 py-4 border-y border-slate-100 dark:border-slate-800 text-lg font-bold">
                         <span className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">Costo Operacional:</span>
                         <span className="text-rose-600 dark:text-rose-500 font-black font-mono">-${v.costoTotal.toLocaleString('es-CL')}</span>
                      </div>
                   </div>

                   <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 mt-auto">
                      <div className="flex justify-between items-end mb-3">
                         <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Facturado</span>
                         <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-500">${v.ingresos.toLocaleString('es-CL')}</span>
                      </div>
                      
                      <div className="flex justify-between items-end pt-3 border-t border-slate-200 dark:border-slate-700/50">
                         <span className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">Margen Real</span>
                         <span className={`text-2xl font-black font-mono tracking-tight ${v.ganancia < 0 ? 'text-rose-600 dark:text-rose-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                            ${v.ganancia.toLocaleString('es-CL')}
                         </span>
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

