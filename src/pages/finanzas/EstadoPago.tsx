import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DollarSign, MessageSquare, Mail, ClipboardList, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

export default function EstadoPago() {
  const { activeCompanyId } = useCompany();
  const [pagos, setPagos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeCompanyId) {
      fetchRegistros();
    }
  }, [activeCompanyId]);

  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const { data: empData, error: empErr } = await supabase.from('empresa').select('id, detalles').eq('id', activeCompanyId).single();
      const { data: vehData, error: vehErr } = await supabase.from('vehiculo').select('id, patente, modelo, detalles').eq('empresa_id', activeCompanyId);

      let allRegistros: any[] = [];
      
      if (!empErr && empData && empData.detalles?.registros_financieros) {
         empData.detalles.registros_financieros.filter((r:any) => r.tipo === 'Ingreso').forEach((r:any) => {
            allRegistros.push({ ...r, fuente: 'Global / Empresa', fuenteId: empData.id, entityType: 'empresa' });
         });
      }

      if (!vehErr && vehData) {
         vehData.forEach(v => {
            if (v.detalles?.registros_financieros) {
               v.detalles.registros_financieros.filter((r:any) => r.tipo === 'Ingreso').forEach((r:any) => {
                  allRegistros.push({ ...r, fuente: `Unidad: ${v.patente || v.modelo}`, fuenteId: v.id, entityType: 'vehiculo' });
               });
            }
         });
      }

      // Ordenar por fecha mas reciente
      allRegistros.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      
      // Proyección basada en ingresos registrados en los últimos 30 días v/s todo
      setPagos(allRegistros.map(r => ({ ...r, estado_pago: r.estado_pago || 'Pendiente' })));

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstadoPago = async (pago: any) => {
      const newEstado = pago.estado_pago === 'Pagado' ? 'Pendiente' : 'Pagado';
      setPagos(pagos.map(p => p.id === pago.id ? { ...p, estado_pago: newEstado } : p));
      
      try {
         const { data, error } = await supabase.from(pago.entityType).select('detalles').eq('id', pago.fuenteId).single();
         if (data && !error) {
             const currentDetalles = data.detalles || {};
             const regs = currentDetalles.registros_financieros || [];
             const newRegs = regs.map((r: any) => r.id === pago.id ? { ...r, estado_pago: newEstado } : r);
             
             await supabase.from(pago.entityType).update({ detalles: { ...currentDetalles, registros_financieros: newRegs } }).eq('id', pago.fuenteId);
         }
      } catch(err) {
         console.error(err);
         fetchRegistros();
      }
  };

  const totalPagado = pagos.filter(p => p.estado_pago === 'Pagado').reduce((acc, p) => acc + p.monto, 0);
  const totalPendiente = pagos.filter(p => p.estado_pago === 'Pendiente').reduce((acc, p) => acc + p.monto, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-indigo-600 dark:bg-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Estado de Pago e Ingresos</h1>
          <p className="text-indigo-200 mt-1">Registros de ingresos consolidados globalmente (Datos Reales).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
           <CardContent className="p-5">
             <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Cobrado (Pagado)</p>
             <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">${totalPagado.toLocaleString('es-CL')}</p>
           </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
           <CardContent className="p-5">
             <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Pendiente</p>
             <p className="text-2xl font-black text-amber-600 dark:text-amber-400">${totalPendiente.toLocaleString('es-CL')}</p>
           </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
         <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-indigo-500"/> Historial de Pagos Recibidos y Ventas</h3>
         </div>
         <div className="overflow-x-auto">
           {loading ? (
             <div className="p-12 text-center text-slate-500 font-bold">Cargando ingresos...</div>
           ) : pagos.length === 0 ? (
             <div className="p-12 text-center text-slate-500 font-bold">No hay ingresos registrados en el sistema global.</div>
           ) : (
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase font-bold">
                 <tr>
                   <th className="p-4">Fecha</th>
                   <th className="p-4">Origen / Fuente</th>
                   <th className="p-4">Categoría</th>
                   <th className="p-4">Descripción</th>
                   <th className="p-4 text-center">Estado</th>
                   <th className="p-4 text-right">Monto</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {pagos.map((pago, i) => (
                   <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                     <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{new Date(pago.fecha).toLocaleDateString('es-CL')}</td>
                     <td className="p-4 font-medium">{pago.fuente}</td>
                     <td className="p-4 text-slate-500">{pago.categoria}</td>
                     <td className="p-4 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{pago.descripcion}</td>
                     <td className="p-4 text-center">
                        <button 
                           onClick={() => toggleEstadoPago(pago)}
                           className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors ${pago.estado_pago === 'Pagado' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'}`}
                        >
                           {pago.estado_pago}
                        </button>
                     </td>
                     <td className="p-4 text-right font-black text-slate-800 dark:text-slate-200">
                       ${pago.monto.toLocaleString('es-CL')}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
         </div>
      </Card>
    </div>
  )
}
