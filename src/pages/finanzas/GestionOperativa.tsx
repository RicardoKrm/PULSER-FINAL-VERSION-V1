import React, { useState, useEffect } from 'react';
import { Download, Search, Hourglass, DollarSign } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

export default function GestionOperativa() {
  const { activeCompanyId } = useCompany();
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [fechaDesde, setFechaDesde] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]);

  const exportToCSV = () => {
    const headers = ['Unidad / Patente', 'Razon Social', 'Costo Total Rango', 'Ingreso Rango', 'Rentabilidad'];
    const rows = vehiculos.map(veh => {
      const stats = calculateVehiculoTotals(veh);
      return [
        `"${veh.id} / ${veh.patente || 'SIN PATENTE'}"`,
        `"${empresa?.razon_social || 'No especificada'}"`,
        stats.costos,
        stats.ingresos,
        stats.utilidad
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `gestion_operativa_${fechaDesde}_${fechaHasta}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        setVehiculos(vehData);
      }

      const { data: empData, error: empError } = await supabase
        .from('empresa')
        .select('razon_social, detalles')
        .eq('id', activeCompanyId)
        .single();
      
      if (!empError && empData) {
        setEmpresa(empData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateVehiculoTotals = (veh: any) => {
     const registros = veh.detalles?.registros_financieros || [];
     let ingresos = 0;
     let costos = 0;
     registros.forEach((r: any) => {
        if (r.fecha >= fechaDesde && r.fecha <= fechaHasta) {
           if (r.tipo === 'Ingreso') ingresos += r.monto;
           else if (r.tipo === 'Costo/Egreso') costos += r.monto;
        }
     });
     return { ingresos, costos, utilidad: ingresos - costos };
  };

  let totalPresupuesto = parseFloat(empresa?.detalles?.presupuesto_mensual || 0);
  let totalCostosRango = 0;
  let totalIngresosRango = 0;

  vehiculos.forEach(v => {
     const { ingresos, costos } = calculateVehiculoTotals(v);
     totalIngresosRango += ingresos;
     totalCostosRango += costos;
  });
  
  let cajaDisponible = totalIngresosRango - totalCostosRango;
  let inmovilizadoBodega = 0;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] xl:h-[calc(100vh-100px)]">
       <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-[1400px] mx-auto space-y-6">
             
             {/* Header Tools */}
             <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Gestión Operativa // Comercial de Suministro</h1>
                  <p className="text-slate-500 text-sm font-medium mt-1">Análisis de rentabilidad real por unidad y gestión presupuestaria.</p>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                   <div className="flex border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                      <div className="px-3 py-2 border-r border-slate-300 dark:border-slate-700 text-xs text-slate-500 flex flex-col justify-center bg-slate-50 dark:bg-slate-900">
                         <span className="font-bold uppercase tracking-wider mb-0.5" style={{fontSize: '9px'}}>Desde</span>
                         <input type="date" className="bg-transparent outline-none font-medium text-slate-800 dark:text-slate-200" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}/>
                      </div>
                      <div className="px-3 py-2 text-xs text-slate-500 flex flex-col justify-center">
                         <span className="font-bold uppercase tracking-wider mb-0.5" style={{fontSize: '9px'}}>Hasta</span>
                         <input type="date" className="bg-transparent outline-none font-medium text-slate-800 dark:text-slate-200" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}/>
                      </div>
                   </div>
                   <button onClick={exportToCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg flex items-center gap-2 transition-colors">
                      <Download className="w-4 h-4" /> Excel
                   </button>
                </div>
             </div>

             {/* KPIs */}
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-[#5c4ae8] p-6 justify-between flex flex-col rounded-xl text-white shadow-md relative overflow-hidden group min-h-[140px]">
                   <p className="font-bold text-sm tracking-wider uppercase opacity-90">Presupuesto Mes</p>
                   <div className="mt-4">
                      <p className="text-3xl font-black">${totalPresupuesto.toLocaleString('es-CL')}</p>
                      <p className="text-xs font-bold text-[#b5aeff] mt-1">+ CLIC PARA ASIGNAR</p>
                   </div>
                   <DollarSign className="absolute top-4 right-4 text-[#7565eb] w-6 h-6" />
                </div>

                <div className="bg-[#e11d48] p-6 justify-between flex flex-col rounded-xl text-white shadow-md relative overflow-hidden min-h-[140px]">
                   <p className="font-bold text-sm tracking-wider uppercase opacity-90">Caja Disponible <span className="inline-flex w-4 h-4 bg-white/20 rounded-full text-[10px] items-center justify-center ml-1">!</span></p>
                   <div className="mt-4">
                      <p className="text-3xl font-black">${cajaDisponible.toLocaleString('es-CL')}</p>
                      <div className="mt-2 bg-black/20 text-xs font-bold uppercase py-1 px-2 rounded backdrop-blur-sm w-fit inline-flex items-center gap-1">
                         Balance Actual
                      </div>
                   </div>
                </div>

                <div className="bg-[#0ea5e9] p-6 justify-between flex flex-col rounded-xl text-white shadow-md relative overflow-hidden min-h-[140px]">
                   <p className="font-bold text-sm tracking-wider uppercase opacity-90">Gasto Real Rango</p>
                   <div className="mt-4">
                      <p className="text-3xl font-black">${totalCostosRango.toLocaleString('es-CL')}</p>
                      <div className="mt-2 text-xs font-medium bg-black/10 py-1 px-2 rounded inline-block">Suma total de costos</div>
                   </div>
                   <Search className="absolute top-4 right-4 text-[#4cbff0] w-5 h-5" />
                </div>

                <div className="bg-[#f59e0b] p-6 justify-between flex flex-col rounded-xl text-white shadow-md relative overflow-hidden min-h-[140px]">
                   <p className="font-bold text-sm tracking-wider uppercase opacity-90">Inmovilizado Bodega</p>
                   <div className="mt-4">
                      <p className="text-3xl font-black">${inmovilizadoBodega.toLocaleString('es-CL')}</p>
                      <div className="mt-2 text-xs font-medium bg-black/10 py-1 px-2 rounded inline-block">Valor total stock hoy</div>
                   </div>
                   <Hourglass className="absolute top-4 right-4 text-[#fcd34d] w-5 h-5" />
                </div>
             </div>

             {/* Alerts Table */}
             <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 border-t-4 border-t-rose-500">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                   <h3 className="font-bold text-rose-600 dark:text-rose-500 flex items-center gap-2 text-sm tracking-tight"><DollarSign className="w-5 h-5" /> Repuestos con Quiebre Inminente</h3>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-xs text-left">
                      <thead className="bg-[#f8f9fa] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 font-black uppercase">
                         <tr>
                            <th className="px-5 py-3">Repuesto</th>
                            <th className="px-5 py-3 text-center">Stock</th>
                            <th className="px-5 py-3 text-center">Días de vida</th>
                            <th className="px-5 py-3 text-right">Acciones</th>
                         </tr>
                      </thead>
                      <tbody>
                         <tr>
                            <td colSpan={4} className="py-12 text-center text-slate-700 dark:text-slate-300 font-medium italic">
                               No hay alertas críticas en este periodo.
                            </td>
                         </tr>
                      </tbody>
                   </table>
                </div>
             </Card>

             {/* Ranking de Eficiencia Table */}
             <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
                   <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">Ranking de Eficiencia por Unidad</h3>
                   <div className="relative w-full md:w-72">
                      <input 
                         type="text"
                         placeholder="Patente, Razón Social, Modelo..."
                         className="w-full border border-slate-200 dark:border-slate-700 rounded text-sm px-3 py-1.5 focus:outline-none focus:border-slate-400 bg-slate-50 dark:bg-slate-800 dark:text-slate-200 font-medium"
                      />
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-[#f8f9fa] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 font-black uppercase">
                         <tr>
                            <th className="px-5 py-3 text-xs w-32">Unidad / Patente</th>
                            <th className="px-5 py-3 text-xs">Razón Social</th>
                            <th className="px-5 py-3 text-xs text-right">Costo Total Rango</th>
                            <th className="px-5 py-3 text-xs text-right">Ingreso Rango</th>
                            <th className="px-5 py-3 text-xs text-right">Rentabilidad</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                         {loading ? (
                            <tr><td colSpan={5} className="py-12 text-center">Cargando...</td></tr>
                         ) : vehiculos.map(veh => {
                            const stats = calculateVehiculoTotals(veh);
                            return (
                               <tr key={veh.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-100">
                                     <div className="flex flex-col">
                                        <span className="text-base uppercase">{veh.id}</span>
                                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-wider">{veh.patente || 'SIN PATENTE'}</span>
                                     </div>
                                  </td>
                                  <td className="px-5 py-3 font-bold text-slate-900 dark:text-slate-200 text-sm">
                                     {empresa?.razon_social || 'No especificada'}
                                  </td>
                                  <td className="px-5 py-3 text-right font-black text-rose-600 dark:text-rose-500">
                                     ${stats.costos.toLocaleString('es-CL')}
                                  </td>
                                  <td className="px-5 py-3 text-right font-black text-emerald-600 dark:text-emerald-500">
                                     ${stats.ingresos.toLocaleString('es-CL')}
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                     <span className={`px-2 py-1 rounded text-xs font-bold border ${stats.utilidad >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                        ${stats.utilidad.toLocaleString('es-CL')}
                                     </span>
                                  </td>
                               </tr>
                            );
                         })}
                         {!loading && vehiculos.length === 0 && (
                            <tr>
                               <td colSpan={5} className="py-8 text-center text-slate-500">
                                  No se encontraron vehículos.
                               </td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </Card>
          </div>
       </div>
    </div>
  );
}
