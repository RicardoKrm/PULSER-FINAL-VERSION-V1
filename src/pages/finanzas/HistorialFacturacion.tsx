import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { FileText, Building2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

export default function HistorialFacturacion() {
  const { activeCompanyId } = useCompany();
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeCompanyId) {
      fetchRegistros();
    }
  }, [activeCompanyId]);

  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const { data: empData } = await supabase.from('empresa').select('id, detalles').eq('id', activeCompanyId).single();
      const { data: vehData } = await supabase.from('vehiculo').select('id, patente, modelo, detalles').eq('empresa_id', activeCompanyId);

      let allRegistros: any[] = [];
      
      if (empData && empData.detalles?.registros_financieros) {
         empData.detalles.registros_financieros.forEach((r:any) => {
            allRegistros.push({ ...r, origen: 'Empresa', origenDetalle: 'Global' });
         });
      }

      if (vehData) {
         vehData.forEach(v => {
            if (v.detalles?.registros_financieros) {
               v.detalles.registros_financieros.forEach((r:any) => {
                  allRegistros.push({ ...r, origen: 'Unidad', origenDetalle: v.patente || v.modelo || v.id });
               });
            }
         });
      }

      allRegistros.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      
      setRegistros(allRegistros);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-blue-400" /> Historial y Trazabilidad Operacional</h1>
          <p className="text-slate-300 mt-1">Todos los movimientos financieros consolidados de la plataforma.</p>
        </div>
      </div>

      <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800">
         <div className="overflow-x-auto">
           {loading ? (
             <div className="p-12 text-center text-slate-500 font-bold">Cargando movimientos...</div>
           ) : registros.length === 0 ? (
             <div className="p-12 text-center text-slate-500 font-bold">No hay movimientos registrados globalmente.</div>
           ) : (
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase font-bold">
                 <tr>
                   <th className="p-4">Fecha</th>
                   <th className="p-4">Tipo</th>
                   <th className="p-4">Categoría</th>
                   <th className="p-4">Origen / Relación</th>
                   <th className="p-4">Descripción</th>
                   <th className="p-4 text-right">Monto</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {registros.map((reg, i) => (
                   <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                     <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{new Date(reg.fecha).toLocaleDateString('es-CL')}</td>
                     <td className="p-4 font-medium">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${reg.tipo === 'Ingreso' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                           {reg.tipo}
                        </span>
                     </td>
                     <td className="p-4 text-slate-600 dark:text-slate-400">{reg.categoria}</td>
                     <td className="p-4">
                        <div className="text-xs font-bold text-slate-500">{reg.origen}</div>
                        <div className="text-sm">{reg.origenDetalle}</div>
                     </td>
                     <td className="p-4 text-slate-600 dark:text-slate-400">{reg.descripcion}</td>
                     <td className={`p-4 text-right font-black ${reg.tipo === 'Ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                       {reg.tipo === 'Ingreso' ? '+' : '-'}${reg.monto.toLocaleString('es-CL')}
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
