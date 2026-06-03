import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Building2, Search, ArrowUpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

export default function EvaluacionEmpresa() {
  const { activeCompanyId } = useCompany();
  const [empresasEval, setEmpresasEval] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeCompanyId) {
      fetchData();
    }
  }, [activeCompanyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pData, error: pErr } = await supabase.from('proveedores_directorio').select('*').eq('empresa_id', activeCompanyId);
      
      if (!pErr && pData) {
         // Evaluaremos a los proveedores (empresas) registradas
         const arr = pData.map((p: any) => {
             // Mock evaluations based on real data existence
             const hash = p.nombre.length; // consistent mock based on name length
             return {
                id: p.id,
                empresa: p.nombre,
                rut: p.rut,
                contratosActivos: (hash % 3) + 1,
                ticketPromedio: (hash * 150000),
                nivelRiesgo: hash % 2 === 0 ? 'Bajo' : 'Medio',
                salud: hash % 3 === 0 ? 'Regular' : 'Excelente'
             }
         });

         setEmpresasEval(arr);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Building2 className="w-8 h-8 text-yellow-400" /> Evaluación de Empresas (Proveedores)</h1>
        <p className="text-slate-300 mt-2 text-lg">Métricas y evaluación de las empresas y proveedores registrados en su cuenta (Multitenant).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {loading ? (
        <div className="col-span-full text-center py-12 text-slate-500 font-bold">Analizando empresas...</div>
      ) : empresasEval.length === 0 ? (
        <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
           No hay empresas o proveedores registrados en su directorio actualmente. Añádalos en Herramientas &gt; Proveedores.
        </div>
      ) : (
          empresasEval.map((emp, i) => (
             <Card key={i} className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                   <div>
                     <h3 className="font-bold text-xl">{emp.empresa}</h3>
                     <p className="text-slate-500 text-sm">{emp.contratosActivos} Contratos Activos</p>
                   </div>
                   <Badge variant="success">Clasificación A</Badge>
                </div>
                <CardContent className="p-6 space-y-4">
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-bold uppercase">Riesgo</span>
                      <span className="font-bold text-emerald-600">{emp.nivelRiesgo}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-bold uppercase">Salud de Pago</span>
                      <span className="font-bold text-emerald-600">{emp.salud}</span>
                   </div>
                   <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button className="w-full flex items-center justify-center gap-2 text-blue-600 font-bold hover:text-blue-700 text-sm">
                         <Search className="w-4 h-4"/> Ver Reporte Completo
                      </button>
                   </div>
                </CardContent>
             </Card>
          ))
      )}
      </div>
    </div>
  )
}
