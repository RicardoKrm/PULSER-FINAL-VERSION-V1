import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Network, Search, GitBranch } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

export default function Trazabilidad() {
  const { activeCompanyId } = useCompany();
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeCompanyId) {
      fetchServicios();
    }
  }, [activeCompanyId]);

  const fetchServicios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('operacion_servicio')
        .select('id, nombre, estado, cliente, created_at, operacion_programacion(id, estado, conductor:colaborador(nombre), vehiculo:vehiculo(patente))')
        .eq('empresa_id', activeCompanyId)
        .order('created_at', { ascending: false });

      if (!error && data) {
         setServicios(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-teal-600 dark:bg-teal-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Network className="w-6 h-6" /> Origen de Ingresos & Trazabilidad</h1>
          <p className="text-teal-100 mt-1">Conecta cada peso ingresado con el servicio, la unidad y el conductor responsable en vivo.</p>
        </div>
      </div>

      <div className="space-y-4">
         {loading ? (
             <div className="p-12 text-center text-slate-500 font-bold">Cargando relaciones de red...</div>
         ) : servicios.length === 0 ? (
             <div className="p-12 text-center text-slate-500 font-bold bg-white dark:bg-slate-900 rounded-2xl">Aún no existen servicios registrados para rastrear su origen.</div>
         ) : (
           servicios.map((srv, idx) => (
             <Card key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                 <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                       
                       <div className="flex-1">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-1">{srv.nombre || 'Servicio General'}</h3>
                          <p className="text-sm text-slate-500 mb-4">Emisión: {new Date(srv.created_at).toLocaleString('es-CL')}</p>
                          <div className="flex items-center gap-3">
                             <Badge variant={srv.estado === 'Realizado' ? 'success' : 'default'} className="uppercase px-2 py-0.5">{srv.estado}</Badge>
                             <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Cliente: {srv.cliente || 'Desconocido'}</span>
                          </div>
                       </div>
                       
                       <div className="flex-1 border-l-2 border-slate-100 dark:border-slate-800 pl-6 space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest"><GitBranch className="w-3 h-3 inline mr-1"/> Logística de Origen</h4>
                          {srv.operacion_programacion && srv.operacion_programacion.length > 0 ? (
                              srv.operacion_programacion.map((prog: any, pIdx: number) => (
                                <div key={pIdx} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                   <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Ejecución #{prog.id.substring(0,6)}</span>
                                      <span className="text-xs text-teal-600 font-bold">{prog.estado}</span>
                                   </div>
                                   <div className="flex gap-4 mt-2">
                                      <div className="text-xs text-slate-500">
                                         <span className="font-bold">UNIDAD:</span> {prog.vehiculo?.patente || 'S/A'}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                         <span className="font-bold">CHOFER:</span> {prog.conductor?.nombre || 'S/A'}
                                      </div>
                                   </div>
                                </div>
                              ))
                          ) : (
                             <div className="text-xs text-slate-400 italic">No hay programación asignada aún.</div>
                          )}
                       </div>
                    </div>
                 </CardContent>
             </Card>
           ))
         )}
      </div>
    </div>
  )
}
