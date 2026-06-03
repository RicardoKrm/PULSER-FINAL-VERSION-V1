import React, { useState, useEffect, useMemo } from 'react';
import { Download, Search, Hourglass, DollarSign, Wrench, Package, BarChart3, Info } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import Swal from 'sweetalert2';

export default function GestionOperativa() {
  const { activeCompanyId } = useCompany();
  const [empresa, setEmpresa] = useState<any>(null);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [repuestos, setRepuestos] = useState<any[]>([]);
  const [ots, setOts] = useState<any[]>([]);
  const [insumosOt, setInsumosOt] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [fechaDesde, setFechaDesde] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaHasta, setFechaHasta] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  );
  
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string>('');

  useEffect(() => {
    if (activeCompanyId) {
      fetchData();
    }
  }, [activeCompanyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        { data: empData }, 
        { data: vehData }, 
        { data: repData }, 
        { data: otData }, 
        { data: insData }
      ] = await Promise.all([
         supabase.from('empresa').select('razon_social, detalles').eq('id', activeCompanyId).single(),
         supabase.from('vehiculo').select('id, patente, modelo, marca').eq('empresa_id', activeCompanyId),
         supabase.from('logistica_repuestos').select('*').eq('empresa_id', activeCompanyId),
         supabase.from('orden_de_trabajo').select('id, vehiculo_id, fecha_creacion, tipo, estado').eq('empresa_id', activeCompanyId),
         supabase.from('detalle_insumo_ot').select('*')
      ]);

      if (empData) setEmpresa(empData);
      if (vehData) setVehiculos(vehData);
      if (repData) setRepuestos(repData);
      if (otData) setOts(otData);
      if (insData) setInsumosOt(insData);
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const { 
    gastoReal, 
    inmovilizadoBodega, 
    repuestosRanking, 
    vehiculosRanking,
    selectedVehiculoDetalle
  } = useMemo(() => {
     const filteredOts: any[] = ots.filter((ot: any) => {
        const d = (ot.fecha_creacion || ot.created_at || "").split('T')[0];
        return d >= fechaDesde && d <= fechaHasta;
     });
     
     const otMap = new Map(filteredOts.map((o: any) => [o.id, o]));
     const repMap = new Map(repuestos.map((r: any) => [r.id, r]));
     
     // 1. Calculate Inmovilizado (stock total value in warehouse)
     const inmovilizado = repuestos.reduce((acc: number, r: any) => acc + (Number(r.stock_actual || r.stock || 0) * Number(r.precio_unitario || 0)), 0);

     // 2. Aggregate Data
     const repuestosUsage: Record<string, { id: string, nombre: string, cantidad: number, costo: number, stockRestante: number }> = {};
     const vehiculosGasto: Record<string, { id: string, patente: string, totalRepuestos: number, otCount: number }> = {};

     vehiculos.forEach((v: any) => {
        vehiculosGasto[v.id] = { id: v.id, patente: v.patente || 'Sin Patente', totalRepuestos: 0, otCount: 0 };
     });

     let gasto = 0;

     filteredOts.forEach((ot: any) => {
        if (ot.vehiculo_id && vehiculosGasto[ot.vehiculo_id]) {
           vehiculosGasto[ot.vehiculo_id].otCount += 1;
        }
     });

     insumosOt.forEach((i: any) => {
        if (otMap.has(i.orden_id)) {
           const otRef = otMap.get(i.orden_id);
           const rId = i.repuesto_id || (i.repuesto ? i.repuesto.id : null);
           const repObj = repMap.get(rId) || (i.repuesto || {});
           const repNombre = repObj?.nombre || 'Repuesto Desconocido';
           
           const qty = Number(i.cantidad || 0);
           const pUnit = i.costo_unitario_aplicado || repObj?.precio_unitario || 0;
           const subtotal = qty * pUnit;

           gasto += subtotal;

           if (rId) {
              if (!repuestosUsage[rId]) {
                 repuestosUsage[rId] = { 
                    id: rId, 
                    nombre: repNombre, 
                    cantidad: 0, 
                    costo: 0, 
                    stockRestante: Number(repObj?.stock_actual || repObj?.stock || 0) 
                 };
              }
              repuestosUsage[rId].cantidad += qty;
              repuestosUsage[rId].costo += subtotal;
           }

           if (otRef?.vehiculo_id && vehiculosGasto[otRef.vehiculo_id]) {
              vehiculosGasto[otRef.vehiculo_id].totalRepuestos += subtotal;
           }
        }
     });

     const rRanking = Object.values(repuestosUsage).sort((a: any, b: any) => b.cantidad - a.cantidad);
     const vRanking = Object.values(vehiculosGasto).filter((v: any) => v.totalRepuestos > 0 || v.otCount > 0).sort((a: any, b: any) => b.totalRepuestos - a.totalRepuestos);

     // 3. Vehiculo Detalle
     let vehDetalle = null;
     if (selectedVehiculoId) {
        const vOts = filteredOts.filter((o: any) => String(o.vehiculo_id) === selectedVehiculoId);
        const vOtsDetail = vOts.map((o: any) => {
           const oInsumos = insumosOt.filter((io: any) => io.orden_id === o.id).map((io: any) => {
              const repId = io.repuesto_id || (io.repuesto ? io.repuesto.id : null);
              const repObj = repMap.get(repId) || io.repuesto || {};
              const qty = Number(io.cantidad || 0);
              const pUnit = io.costo_unitario_aplicado || repObj?.precio_unitario || 0;
              return { 
                 nombre: repObj.nombre || 'Repuesto Desconocido',
                 cantidad: qty,
                 subtotal: qty * pUnit
              };
           });
           
           const totalOtCost = oInsumos.reduce((acc: number, io: any) => acc + io.subtotal, 0);

           return {
             ...o,
             insumos: oInsumos,
             costoRepuestos: totalOtCost
           };
        });

        vehDetalle = {
           vehiculo: vehiculos.find(v => String(v.id) === selectedVehiculoId),
           ots: vOtsDetail,
           totalOts: vOtsDetail.length,
           totalCosto: vOtsDetail.reduce((a: number, b: any) => a + b.costoRepuestos, 0)
        };
     }

     return {
        gastoReal: gasto,
        inmovilizadoBodega: inmovilizado,
        repuestosRanking: rRanking,
        vehiculosRanking: vRanking,
        selectedVehiculoDetalle: vehDetalle
     };

  }, [ots, insumosOt, repuestos, vehiculos, fechaDesde, fechaHasta, selectedVehiculoId]);

  const setPresupuesto = async () => {
     const { value: formValues } = await Swal.fire({
        title: 'Asignar Presupuesto Mensual',
        html: '<input id="swal-input1" class="swal2-input" type="number" placeholder="Ej: 50000000">',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
           return (document.getElementById('swal-input1') as HTMLInputElement).value;
        }
     });

     if (formValues && activeCompanyId) {
        const newPresupuesto = parseFloat(formValues);
        const currentDetalles = empresa?.detalles || {};
        const updateDetalles = { ...currentDetalles, presupuesto_mensual: newPresupuesto };

        const { error } = await supabase.from('empresa').update({ detalles: updateDetalles }).eq('id', activeCompanyId);
        
        if (!error) {
           setEmpresa({ ...empresa, detalles: updateDetalles });
           Swal.fire('Guardado', 'Presupuesto asignado', 'success');
        } else {
           Swal.fire('Error', 'No se pudo guardar', 'error');
        }
     }
  };

  const exportToCSV = () => {
    const headers = ['Patente', 'Total Repuestos Consumidos ($)', 'Total OTs Realizadas'];
    const rows = vehiculosRanking.map(veh => [
      `"${veh.patente}"`,
      veh.totalRepuestos,
      veh.otCount
    ].join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `analisis_suministros_${fechaDesde}_${fechaHasta}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPresupuesto = parseFloat(empresa?.detalles?.presupuesto_mensual || 0);
  const cajaDisponible = totalPresupuesto - gastoReal;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] xl:h-[calc(100vh-100px)]">
       <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-[1400px] mx-auto space-y-6">
             
             {/* Header Tools */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Gestión Operativa // Comercial de Suministro</h1>
                  <p className="text-slate-500 text-sm mt-1">Análisis de consumo, gestión presupuestaria e inventario inmovilizado.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                   <div className="flex border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 w-full sm:w-auto">
                      <div className="px-3 py-2 border-r border-slate-300 dark:border-slate-700 text-xs text-slate-500 flex flex-col justify-center bg-slate-50 dark:bg-slate-900">
                         <span className="font-bold uppercase tracking-wider mb-0.5" style={{fontSize: '9px'}}>Desde</span>
                         <input type="date" className="bg-transparent outline-none font-medium text-slate-800 dark:text-slate-200" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}/>
                      </div>
                      <div className="px-3 py-2 text-xs text-slate-500 flex flex-col justify-center">
                         <span className="font-bold uppercase tracking-wider mb-0.5" style={{fontSize: '9px'}}>Hasta</span>
                         <input type="date" className="bg-transparent outline-none font-medium text-slate-800 dark:text-slate-200" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}/>
                      </div>
                   </div>
                   <button onClick={exportToCSV} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                      <Download className="w-4 h-4" /> Exportar
                   </button>
                </div>
             </div>

             {/* KPIs */}
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-[#5c4ae8] p-6 justify-between flex flex-col rounded-xl text-white shadow-md relative overflow-hidden group min-h-[140px] cursor-pointer hover:bg-[#4d3cd9] transition-colors" onClick={setPresupuesto}>
                   <p className="font-bold text-sm tracking-wider uppercase opacity-90">Presupuesto Mes</p>
                   <div className="mt-4 relative z-10">
                      <p className="text-3xl font-black">${totalPresupuesto.toLocaleString('es-CL')}</p>
                      <p className="text-[11px] font-bold text-[#b5aeff] mt-1 uppercase tracking-wider">+ Clic para Asignar</p>
                   </div>
                   <DollarSign className="absolute top-4 right-4 text-[#7565eb] w-6 h-6 z-0" />
                </div>

                <div className="bg-[#e11d48] p-6 justify-between flex flex-col rounded-xl text-white shadow-md relative overflow-hidden min-h-[140px]">
                   <p className="font-bold text-sm tracking-wider uppercase opacity-90">Caja (Dinero Disponible) <span className="inline-flex w-4 h-4 bg-white/20 rounded-full text-[10px] items-center justify-center ml-1 font-black cursor-help" title="Presupuesto Mensual - Gasto Real de Repuestos">?</span></p>
                   <div className="mt-4 relative z-10">
                      <p className="text-3xl font-black">${cajaDisponible.toLocaleString('es-CL')}</p>
                      <div className="mt-2 bg-black/20 text-[10px] font-bold uppercase py-1 px-2 rounded backdrop-blur-sm w-fit inline-flex items-center gap-1 tracking-wider">
                         Saldo Restante
                      </div>
                   </div>
                </div>

                <div className="bg-[#0ea5e9] p-6 justify-between flex flex-col rounded-xl text-white shadow-md relative overflow-hidden min-h-[140px]">
                   <p className="font-bold text-sm tracking-wider uppercase opacity-90">Gasto Real (Repuestos)</p>
                   <div className="mt-4 relative z-10">
                      <p className="text-3xl font-black">${gastoReal.toLocaleString('es-CL')}</p>
                      <div className="mt-2 text-[10px] font-bold uppercase tracking-wider bg-black/10 py-1 px-2 rounded inline-block">Consumo en OTs</div>
                   </div>
                   <Wrench className="absolute top-4 right-4 text-[#4cbff0] w-6 h-6 z-0" />
                </div>

                <div className="bg-[#f59e0b] p-6 justify-between flex flex-col rounded-xl text-white shadow-md relative overflow-hidden min-h-[140px]">
                   <p className="font-bold text-sm tracking-wider uppercase opacity-90">Inmovilizado en Bodega</p>
                   <div className="mt-4 relative z-10">
                      <p className="text-3xl font-black">${inmovilizadoBodega.toLocaleString('es-CL')}</p>
                      <div className="mt-2 text-[10px] font-bold uppercase tracking-wider bg-black/10 py-1 px-2 rounded inline-block">Valor stock actual</div>
                   </div>
                   <Package className="absolute top-4 right-4 text-[#fcd34d] w-6 h-6 z-0" />
                </div>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 {/* Ranking Repuestos */}
                 <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                       <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                          <Package className="w-5 h-5 text-indigo-500" /> Repuestos Más Usados (Periodo)
                       </h3>
                    </div>
                    <div className="overflow-x-auto flex-1">
                       <table className="w-full text-sm text-left">
                          <thead className="bg-[#f8f9fa] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                             <tr>
                                <th className="px-5 py-3">Repuesto</th>
                                <th className="px-5 py-3 text-center">Unid. Usadas</th>
                                <th className="px-5 py-3 text-right">Costo Total</th>
                                <th className="px-5 py-3 text-center">Stock Disp.</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                             {loading ? (
                                <tr><td colSpan={4} className="py-12 text-center text-slate-500">Cargando...</td></tr>
                             ) : repuestosRanking.length === 0 ? (
                                <tr><td colSpan={4} className="py-12 text-center text-slate-500 font-medium italic">No hay consumo de repuestos en el rango.</td></tr>
                             ) : repuestosRanking.slice(0, 8).map(rep => (
                                <tr key={rep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                   <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-200 max-w-[200px] truncate" title={rep.nombre}>{rep.nombre}</td>
                                   <td className="px-5 py-3 text-center font-black text-rose-500">{rep.cantidad}</td>
                                   <td className="px-5 py-3 text-right font-medium text-slate-700 dark:text-slate-300">${rep.costo.toLocaleString('es-CL')}</td>
                                   <td className="px-5 py-3 text-center font-bold text-emerald-600 dark:text-emerald-500">{rep.stockRestante}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </Card>

                 {/* Analisis Costos por Vehículo */}
                 <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                       <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-rose-500" /> Dónde Gastamos Más Dinero
                       </h3>
                    </div>
                    <div className="overflow-x-auto flex-1">
                       <table className="w-full text-sm text-left">
                          <thead className="bg-[#f8f9fa] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                             <tr>
                                <th className="px-5 py-3">Vehículo</th>
                                <th className="px-5 py-3 text-center">Nº OTs</th>
                                <th className="px-5 py-3 text-right">Gasto en Repuestos</th>
                                <th className="px-5 py-3 text-center">Detalle</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                             {loading ? (
                                <tr><td colSpan={4} className="py-12 text-center text-slate-500">Cargando...</td></tr>
                             ) : vehiculosRanking.length === 0 ? (
                                <tr><td colSpan={4} className="py-12 text-center text-slate-500 font-medium italic">No hay registros para mostrar.</td></tr>
                             ) : vehiculosRanking.map((veh, idx) => (
                                <tr key={veh.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${selectedVehiculoId === veh.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                   <td className="px-5 py-3">
                                      <div className="flex items-center gap-2">
                                         <span className="font-medium text-slate-500 dark:text-slate-400 text-xs">#{idx + 1}</span>
                                         <span className="font-black text-slate-800 dark:text-slate-200 uppercase">{veh.patente}</span>
                                      </div>
                                   </td>
                                   <td className="px-5 py-3 text-center font-bold text-slate-600 dark:text-slate-400">{veh.otCount}</td>
                                   <td className="px-5 py-3 text-right font-black text-rose-600 dark:text-rose-400">${veh.totalRepuestos.toLocaleString('es-CL')}</td>
                                   <td className="px-5 py-3 text-center">
                                      <button 
                                        onClick={() => setSelectedVehiculoId(selectedVehiculoId === veh.id ? '' : veh.id)}
                                        className="text-xs bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-800/80 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1.5 rounded transition-colors"
                                      >
                                         {selectedVehiculoId === veh.id ? 'Cerrar' : 'Revisar'}
                                      </button>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </Card>
             </div>

             {/* Detailed Vehicle View */}
             {selectedVehiculoId && selectedVehiculoDetalle && (
                <Card className="shadow-sm border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-300 mt-6">
                   <div className="p-5 border-b border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/20 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
                      <div className="relative z-10">
                         <h3 className="font-black text-indigo-900 dark:text-indigo-100 text-xl tracking-tight uppercase">
                            Análisis Detallado: {selectedVehiculoDetalle.vehiculo?.patente || 'Vehículo'}
                         </h3>
                         <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded">
                               {selectedVehiculoDetalle.totalOts} OTs en el periodo
                            </span>
                            <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                               Gasto Total: ${selectedVehiculoDetalle.totalCosto.toLocaleString('es-CL')}
                            </span>
                         </div>
                      </div>
                      <Wrench className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-600/5 dark:text-indigo-400/5 transform -rotate-12 z-0" />
                   </div>
                   
                   <div className="p-5 overflow-x-auto">
                      <table className="w-full text-sm text-left">
                         <thead className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <tr>
                               <th className="px-4 py-2">Fecha OT</th>
                               <th className="px-4 py-2">Tipo OT</th>
                               <th className="px-4 py-2">Estado</th>
                               <th className="px-4 py-2">Repuestos Utilizados</th>
                               <th className="px-4 py-2 text-right">Costo Repuestos</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {selectedVehiculoDetalle.ots.length === 0 ? (
                               <tr><td colSpan={5} className="py-8 text-center text-slate-500 italic">No hay órdenes de trabajo registradas en este periodo.</td></tr>
                            ) : (
                               selectedVehiculoDetalle.ots.map((ot: any) => (
                                  <tr key={ot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                     <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-300">
                                        {(ot.fecha_creacion || ot.created_at)?.split('T')[0]}
                                     </td>
                                     <td className="px-4 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${ot.tipo === 'Preventivo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                           {ot.tipo || 'General'}
                                        </span>
                                     </td>
                                     <td className="px-4 py-4">
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                           {ot.estado || 'N/A'}
                                        </span>
                                     </td>
                                     <td className="px-4 py-4">
                                        {ot.insumos.length === 0 ? (
                                           <span className="text-xs text-slate-400 italic">Sin repuestos cargados.</span>
                                        ) : (
                                           <ul className="space-y-1">
                                              {ot.insumos.map((ins: any, idx: number) => (
                                                 <li key={idx} className="text-xs flex flex-wrap items-center gap-2">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{ins.cantidad}x</span> 
                                                    <span className="text-slate-600 dark:text-slate-400">{ins.nombre}</span>
                                                    <span className="text-slate-400 text-[10px]">(${ins.subtotal.toLocaleString('es-CL')})</span>
                                                 </li>
                                              ))}
                                           </ul>
                                        )}
                                     </td>
                                     <td className="px-4 py-4 text-right font-black text-rose-600 dark:text-rose-400">
                                        ${ot.costoRepuestos.toLocaleString('es-CL')}
                                     </td>
                                  </tr>
                               ))
                            )}
                         </tbody>
                      </table>
                   </div>
                </Card>
             )}

          </div>
       </div>
    </div>
  );
}

