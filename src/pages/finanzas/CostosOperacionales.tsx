import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DollarSign, Search, Plus, Calendar, Trash2, ArrowLeft, Download, Filter, Hourglass } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import Swal from 'sweetalert2';

export default function CostosOperacionales() {
  const { activeCompanyId } = useCompany();
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVehiculo, setSelectedVehiculo] = useState<any | null>(null);

  // Form State para Nuevo Registro
  const [fechaRegistro, setFechaRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [tipoRegistro, setTipoRegistro] = useState('Costo/Egreso');
  const [categoria, setCategoria] = useState('Mantenimiento y Reparaciones');
  const [contrato, setContrato] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');

  useEffect(() => {
    if (activeCompanyId) {
      fetchData();
    }
  }, [activeCompanyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener vehículos
      const { data: vehData, error: vehError } = await supabase
        .from('vehiculo')
        .select('*')
        .eq('empresa_id', activeCompanyId);
      
      if (!vehError && vehData) {
        setVehiculos(vehData);
      }

      // Obtener datos empresa para presupuesto (opcional)
      const { data: empData, error: empError } = await supabase
        .from('empresa')
        .select('razon_social, detalles')
        .eq('id', activeCompanyId)
        .single();
      
      if (!empError && empData) {
        setEmpresa(empData);
      }

    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehiculo) return;
    if (!descripcion || !monto) {
       Swal.fire('Error', 'Ingrese descripción y monto', 'error');
       return;
    }

    const nuevoRegistro = {
       id: crypto.randomUUID(),
       fecha: fechaRegistro,
       tipo: tipoRegistro,
       categoria,
       contrato,
       descripcion,
       monto: parseFloat(monto)
    };

    const currentDetalles = selectedVehiculo.detalles || {};
    const registros = currentDetalles.registros_financieros || [];
    const newRegistros = [nuevoRegistro, ...registros];
    
    // Convert to Date for sorting if needed, but prepending is fine

    const newDetalles = {
       ...currentDetalles,
       registros_financieros: newRegistros
    };

    try {
      const { error } = await supabase
        .from('vehiculo')
        .update({ detalles: newDetalles })
        .eq('id', selectedVehiculo.id);

      if (!error) {
        Swal.fire('Guardado', 'Registro guardado exitosamente', 'success');
        // Update local state
        const updatedVeh = { ...selectedVehiculo, detalles: newDetalles };
        setSelectedVehiculo(updatedVeh);
        setVehiculos(vehiculos.map(v => v.id === updatedVeh.id ? updatedVeh : v));
        
        // Reset form
        setDescripcion('');
        setMonto('');
      } else {
        throw error;
      }
    } catch(err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar el registro', 'error');
    }
  };

  const handleDeleteRegistro = async (id: string) => {
    if (!selectedVehiculo) return;

    Swal.fire({
      title: '¿Eliminar registro?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const currentDetalles = selectedVehiculo.detalles || {};
        const registros = currentDetalles.registros_financieros || [];
        const newRegistros = registros.filter((r: any) => r.id !== id);

        const newDetalles = {
           ...currentDetalles,
           registros_financieros: newRegistros
        };

        try {
          const { error } = await supabase
            .from('vehiculo')
            .update({ detalles: newDetalles })
            .eq('id', selectedVehiculo.id);

          if (!error) {
            const updatedVeh = { ...selectedVehiculo, detalles: newDetalles };
            setSelectedVehiculo(updatedVeh);
            setVehiculos(vehiculos.map(v => v.id === updatedVeh.id ? updatedVeh : v));
            Swal.fire('Eliminado!', 'El registro ha sido eliminado.', 'success');
          } else {
             throw error;
          }
        } catch(err) {
          Swal.fire('Error', 'No se pudo eliminar', 'error');
        }
      }
    });
  };

  // Calculations
  const calculateVehiculoTotals = (veh: any) => {
     const registros = veh.detalles?.registros_financieros || [];
     let ingresos = 0;
     let costos = 0;

     registros.forEach((r: any) => {
        if (r.tipo === 'Ingreso') ingresos += r.monto;
        else if (r.tipo === 'Costo/Egreso') costos += r.monto;
     });

     return { ingresos, costos, utilidad: ingresos - costos };
  };

  // Global KPIs
  let totalPresupuesto = parseFloat(empresa?.detalles?.presupuesto_mensual || 0); // If implemented
  let totalCostosRango = 0;
  let totalIngresosRango = 0;

  vehiculos.forEach(v => {
     const { ingresos, costos } = calculateVehiculoTotals(v);
     totalIngresosRango += ingresos;
     totalCostosRango += costos;
  });
  
  let cajaDisponible = totalIngresosRango - totalCostosRango;
  let inmovilizadoBodega = 3536437210; // Mock from image

  // VIEWS
  if (selectedVehiculo) {
     const { ingresos, costos, utilidad } = calculateVehiculoTotals(selectedVehiculo);
     const registros = selectedVehiculo.detalles?.registros_financieros || [];

     return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
           <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto space-y-6">
                 
                 <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div>
                       <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 uppercase">Costos y Tendencias del Vehículo</h1>
                       <p className="text-sm font-medium text-slate-500 mt-1">{selectedVehiculo.id} - {selectedVehiculo.modelo}</p>
                    </div>
                    <button 
                       onClick={() => setSelectedVehiculo(null)}
                       className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-slate-700 dark:text-slate-300">
                       <ArrowLeft className="w-4 h-4" /> Volver a la Pizarra
                    </button>
                 </div>

                 {/* KPI Cards */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Ingresos</p>
                       <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500">${ingresos.toLocaleString('es-CL')}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Costos</p>
                       <p className="text-3xl font-black text-rose-600 dark:text-rose-500">${costos.toLocaleString('es-CL')}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                       <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Utilidad Neta</p>
                       <p className={`text-3xl font-black ${utilidad >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>${utilidad.toLocaleString('es-CL')}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Add Record Form */}
                    <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-fit">
                       <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                          <h3 className="font-bold text-slate-800 dark:text-slate-200">Añadir Nuevo Registro</h3>
                       </div>
                       <CardContent className="p-5">
                          <form onSubmit={handleSaveRegistro} className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha del Registro</label>
                                <input 
                                   type="date" 
                                   required
                                   value={fechaRegistro}
                                   onChange={(e) => setFechaRegistro(e.target.value)}
                                   className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500" 
                                />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Registro</label>
                                <select 
                                   value={tipoRegistro}
                                   onChange={(e) => setTipoRegistro(e.target.value)}
                                   className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500">
                                   <option value="Costo/Egreso">Costo/Egreso</option>
                                   <option value="Ingreso">Ingreso</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                                <select 
                                   value={categoria}
                                   onChange={(e) => setCategoria(e.target.value)}
                                   className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500">
                                   <option value="Mantenimiento y Reparaciones">Mantenimiento y Reparaciones</option>
                                   <option value="Combustible">Combustible</option>
                                   <option value="Seguros y Documentación">Seguros y Documentación</option>
                                   <option value="Otros Ingresos">Otros Ingresos</option>
                                   <option value="Otros Gastos">Otros Gastos</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contrato Asociado (Opcional)</label>
                                <select 
                                   value={contrato}
                                   onChange={(e) => setContrato(e.target.value)}
                                   className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500">
                                   <option value="">Sin contrato específico</option>
                                   <option value="Contrato A">Contrato A</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                                <textarea 
                                   required
                                   value={descripcion}
                                   onChange={(e) => setDescripcion(e.target.value)}
                                   placeholder="Ej: Factura #100, Cambio de aceite..."
                                   className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" 
                                />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto ($)</label>
                                <input 
                                   type="number"
                                   required 
                                   value={monto}
                                   onChange={(e) => setMonto(e.target.value)}
                                   placeholder="Ingrese solo el número, ej: 150000.50"
                                   className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500" 
                                />
                             </div>
                             <button type="submit" className="w-full bg-[#38bdf8] hover:bg-[#0ea5e9] text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                <Plus className="w-4 h-4" /> Guardar Registro
                             </button>
                          </form>
                       </CardContent>
                    </Card>

                    {/* Table Records */}
                    <Card className="lg:col-span-2 shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                       <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                          <h3 className="font-bold text-slate-800 dark:text-slate-200">Historial de Registros</h3>
                       </div>
                       <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                             <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                                <tr>
                                   <th className="px-5 py-3">Fecha</th>
                                   <th className="px-5 py-3">Tipo</th>
                                   <th className="px-5 py-3">Categoría</th>
                                   <th className="px-5 py-3">Descripción</th>
                                   <th className="px-5 py-3 text-right">Monto</th>
                                   <th className="px-5 py-3 text-center">Acciones</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {registros.length === 0 ? (
                                  <tr>
                                     <td colSpan={6} className="text-center py-8 text-slate-500">No hay registros financieros.</td>
                                  </tr>
                                ) : (
                                   registros.map((reg: any) => (
                                     <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{new Date(reg.fecha).toLocaleDateString('es-CL')}</td>
                                        <td className="px-5 py-3">
                                           <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                                              reg.tipo === 'Ingreso' 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30' 
                                                : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30'
                                           }`}>
                                              {reg.tipo}
                                           </span>
                                        </td>
                                        <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-300">{reg.categoria}</td>
                                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{reg.descripcion}</td>
                                        <td className={`px-5 py-3 text-right font-bold ${reg.tipo === 'Ingreso' ? 'text-slate-800 dark:text-slate-200' : 'text-slate-800 dark:text-slate-200'}`}>
                                           {reg.tipo === 'Ingreso' ? '' : '-'}${reg.monto.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                           <button 
                                             onClick={() => handleDeleteRegistro(reg.id)}
                                             className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded border border-rose-200 dark:border-rose-800/50 transition-colors">
                                              <Trash2 className="w-4 h-4" />
                                           </button>
                                        </td>
                                     </tr>
                                   ))
                                )}
                             </tbody>
                          </table>
                       </div>
                    </Card>
                 </div>
              </div>
           </div>
        </div>
     );
  }

  // MAIN DASHBOARD VIEW
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
       <div className="flex-1 overflow-y-auto p-6">
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
                         <input type="date" className="bg-transparent outline-none font-medium text-slate-800 dark:text-slate-200" defaultValue="2026-05-01"/>
                      </div>
                      <div className="px-3 py-2 text-xs text-slate-500 flex flex-col justify-center">
                         <span className="font-bold uppercase tracking-wider mb-0.5" style={{fontSize: '9px'}}>Hasta</span>
                         <input type="date" className="bg-transparent outline-none font-medium text-slate-800 dark:text-slate-200" defaultValue="2026-05-31"/>
                      </div>
                   </div>
                   <button className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold py-3 px-5 rounded-lg transition-colors">
                      Filtrar
                   </button>
                   <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg flex items-center gap-2 transition-colors">
                      <Download className="w-4 h-4" /> Excel
                   </button>
                </div>
             </div>

             {/* KPIs */}
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-[#5c4ae8] hover:bg-[#4f3fd6] transition-colors p-6 justify-between flex flex-col rounded-xl text-white shadow-md relative overflow-hidden cursor-pointer group min-h-[140px]">
                   <p className="font-bold text-sm tracking-wider uppercase opacity-90">Presupuesto Mes</p>
                   <div className="mt-4">
                      <p className="text-3xl font-black">${totalPresupuesto.toLocaleString('es-CL')}</p>
                      <p className="text-xs font-bold text-[#b5aeff] mt-1 group-hover:text-white transition-colors">+ CLIC PARA ASIGNAR</p>
                   </div>
                   <DollarSign className="absolute top-4 right-4 text-[#7565eb] w-6 h-6" />
                </div>

                <div className="bg-[#e11d48] hover:bg-[#be123c] transition-colors p-6 justify-between flex flex-col rounded-xl text-white shadow-md relative overflow-hidden h-full min-h-[140px]">
                   <p className="font-bold text-sm tracking-wider uppercase opacity-90">Caja Disponible <span className="inline-flex w-4 h-4 bg-white/20 rounded-full text-[10px] items-center justify-center ml-1">!</span></p>
                   <div className="mt-4">
                      <p className="text-3xl font-black">${cajaDisponible.toLocaleString('es-CL')}</p>
                      <div className="mt-2 bg-black/20 text-xs font-bold uppercase py-1 px-2 rounded backdrop-blur-sm w-fit inline-flex items-center gap-1">
                         Responsable: Bruno Gaval
                      </div>
                   </div>
                </div>

                <div className="bg-[#0ea5e9] hover:bg-[#0284c7] transition-colors p-6 justify-between flex flex-col rounded-xl text-white shadow-md relative overflow-hidden min-h-[140px]">
                   <p className="font-bold text-sm tracking-wider uppercase opacity-90">Gasto Real Rango</p>
                   <div className="mt-4">
                      <p className="text-3xl font-black">${totalCostosRango.toLocaleString('es-CL')}</p>
                      <div className="mt-2 text-xs font-medium bg-black/10 py-1 px-2 rounded inline-block">Suma total de costos</div>
                   </div>
                   <Search className="absolute top-4 right-4 text-[#4cbff0] w-5 h-5" />
                </div>

                <div className="bg-[#f59e0b] hover:bg-[#d97706] transition-colors p-6 justify-between flex flex-col rounded-xl text-white shadow-md relative overflow-hidden min-h-[140px]">
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
                            <th className="px-5 py-3 text-xs">Modelo</th>
                            <th className="px-5 py-3 text-xs text-right">Costo Total Rango</th>
                            <th className="px-5 py-3 text-xs text-right w-24">Acciones</th>
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
                                  <td className="px-5 py-3 font-medium text-slate-600 dark:text-slate-400 uppercase text-xs">
                                     {veh.modelo || 'No especificado'}
                                  </td>
                                  <td className="px-5 py-3 text-right font-black text-rose-600 dark:text-rose-500">
                                     ${stats.costos.toLocaleString('es-CL')}
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                     <button 
                                        onClick={() => setSelectedVehiculo(veh)}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-800 border-b border-blue-600 hover:border-blue-800 transition-colors uppercase">
                                        Ver Detalles
                                     </button>
                                  </td>
                               </tr>
                            );
                         })}
                         {!loading && vehiculos.length === 0 && (
                            <tr>
                               <td colSpan={5} className="py-8 text-center text-slate-500">
                                  No se encontraron vehículos para esta empresa.
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

