import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { DollarSign, Search, Plus, Trash2, ArrowLeft, Download, Filter, Hourglass, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import Swal from 'sweetalert2';

export default function RegistrosFinancieros() {
  const { activeCompanyId } = useCompany();
  const [empresa, setEmpresa] = useState<any>(null);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('global');

  // Form State para Nuevo Registro
  const [fechaRegistro, setFechaRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [tipoRegistro, setTipoRegistro] = useState('Costo/Egreso');
  const [categoria, setCategoria] = useState('');
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
      const { data: empData, error: empError } = await supabase
        .from('empresa')
        .select('*')
        .eq('id', activeCompanyId)
        .single();
      
      if (!empError && empData) {
        setEmpresa(empData);
      }

      const { data: vehData, error: vehError } = await supabase
        .from('vehiculo')
        .select('*')
        .eq('empresa_id', activeCompanyId);
      
      if (!vehError && vehData) {
        setVehiculos(vehData);
      }
    } catch (e) {
      console.error("Error fetching data:", e);
    } finally {
      setLoading(false);
    }
  };

  const isGlobal = selectedEntityId === 'global';
  const activeEntity = isGlobal ? empresa : vehiculos.find(v => v.id === selectedEntityId);
  const registros = activeEntity?.detalles?.registros_financieros || [];

  const handleSaveRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntity) return;
    if (!descripcion || !monto || !categoria) {
       Swal.fire('Error', 'Complete todos los campos obligatorios', 'error');
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

    const currentDetalles = activeEntity.detalles || {};
    const newRegistros = [nuevoRegistro, ...registros];

    const newDetalles = {
       ...currentDetalles,
       registros_financieros: newRegistros
    };

    try {
      const table = isGlobal ? 'empresa' : 'vehiculo';
      const { error } = await supabase
        .from(table)
        .update({ detalles: newDetalles })
        .eq('id', activeEntity.id);

      if (!error) {
        Swal.fire('Guardado', 'Registro guardado exitosamente', 'success');
        
        if (isGlobal) {
           setEmpresa({ ...empresa, detalles: newDetalles });
        } else {
           setVehiculos(vehiculos.map(v => v.id === activeEntity.id ? { ...v, detalles: newDetalles } : v));
        }
        
        // Form Reset
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
    if (!activeEntity) return;

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
        const currentDetalles = activeEntity.detalles || {};
        const newRegistros = registros.filter((r: any) => r.id !== id);

        const newDetalles = {
           ...currentDetalles,
           registros_financieros: newRegistros
        };

        try {
          const table = isGlobal ? 'empresa' : 'vehiculo';
          const { error } = await supabase
            .from(table)
            .update({ detalles: newDetalles })
            .eq('id', activeEntity.id);

          if (!error) {
            if (isGlobal) {
               setEmpresa({ ...empresa, detalles: newDetalles });
            } else {
               setVehiculos(vehiculos.map(v => v.id === activeEntity.id ? { ...v, detalles: newDetalles } : v));
            }
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

  const categoriasOptions = isGlobal ? [
    'Operaciones y Servicios',
    'Gestión de Flota',
    'Logística y Suministros',
    'Compras y Proveedores',
    'Finanzas',
    'Administración / Otros'
  ] : tipoRegistro === 'Ingreso' ? [
    'Ingreso por Contrato',
    'Ingreso Variable (Viaje, KM)',
    'Otros Ingresos'
  ] : [
    'Costo Fijo (Seguros, Salarios)',
    'Combustible',
    'Mantenimiento y Reparaciones',
    'Neumáticos',
    'Peajes y Estacionamiento',
    'Lubricantes y Fluidos',
    'Costo Extraordinario (Multas)',
    'Otros Gastos'
  ];

  // Auto-select first category when type or entity changes
  useEffect(() => {
     if (isGlobal) {
        setCategoria('Operaciones y Servicios');
     } else if (tipoRegistro === 'Ingreso') {
        setCategoria('Ingreso por Contrato');
     } else {
        setCategoria('Combustible');
     }
  }, [tipoRegistro, isGlobal]);

  const totalIngresos = registros.filter((r:any) => r.tipo === 'Ingreso').reduce((acc: number, r:any) => acc + r.monto, 0);
  const totalCostos = registros.filter((r:any) => r.tipo === 'Costo/Egreso').reduce((acc: number, r:any) => acc + r.monto, 0);
  const balance = totalIngresos - totalCostos;

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex items-center gap-3">
               <TrendingUp className="w-7 h-7 text-[#0ea5e9]" /> Registros Financieros y KPIs
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Ingresa ingresos y costos por vehículo para mantener el control financiero al día.</p>
         </div>
         <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Seleccionar Unidad / Global</label>
            <select 
               value={selectedEntityId}
               onChange={(e) => setSelectedEntityId(e.target.value)}
               className="w-full md:w-72 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0ea5e9] font-medium text-slate-800 dark:text-slate-200">
               <option value="global">Empresa / Software General</option>
               {vehiculos.map(v => (
                  <option key={v.id} value={v.id}>Vehículo: {v.patente || 'S/P'} - {v.modelo || 'Sin Modelo'}</option>
               ))}
            </select>
         </div>
      </div>

      {!activeEntity ? (
         <div className="text-center py-20 text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 font-medium">
            Seleccione una entidad para gestionar sus registros.
         </div>
      ) : (
         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Formulario */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-fit xl:col-span-1">
               <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">Añadir Nuevo Registro</h3>
               </div>
               <CardContent className="p-6">
                  <form onSubmit={handleSaveRegistro} className="space-y-5">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha del Registro</label>
                        <input 
                           type="date" 
                           required
                           value={fechaRegistro}
                           onChange={(e) => setFechaRegistro(e.target.value)}
                           className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                        />
                        <p className="text-[11px] text-slate-500 mt-1">Fecha en que se registró el ingreso o costo.</p>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Registro</label>
                        <select 
                           value={tipoRegistro}
                           onChange={(e) => setTipoRegistro(e.target.value)}
                           className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                           <option value="Ingreso">Ingreso</option>
                           <option value="Costo/Egreso">Costo/Egreso</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                        <select 
                           value={categoria}
                           onChange={(e) => setCategoria(e.target.value)}
                           className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                           {categoriasOptions.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contrato Asociado (Opcional)</label>
                        <select 
                           value={contrato}
                           onChange={(e) => setContrato(e.target.value)}
                           className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                           <option value="">Sin contrato específico</option>
                           <option value="Contrato A">Contrato A (Ejemplo)</option>
                           <option value="Contrato Minero">Contrato Minero (Ejemplo)</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
                        <textarea 
                           required
                           value={descripcion}
                           onChange={(e) => setDescripcion(e.target.value)}
                           placeholder="Ej: Factura de peajes, Contrato mensual..."
                           className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[80px]" 
                        />
                        <p className="text-[11px] text-slate-500 mt-1">Descripción detallada (Ej: 'Factura de peajes A-5', 'Cambio de aceite').</p>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto ($)</label>
                        <input 
                           type="number"
                           required 
                           value={monto}
                           min="0"
                           step="0.01"
                           onChange={(e) => setMonto(e.target.value)}
                           placeholder="Ingrese solo el número, ej: 150000.50"
                           className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono" 
                        />
                        <p className="text-[11px] text-slate-500 mt-1">Monto del registro. Ingresar siempre como número positivo.</p>
                     </div>
                     <button type="submit" className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <Plus className="w-5 h-5" /> Guardar Registro
                     </button>
                  </form>
               </CardContent>
            </Card>

            {/* Listado y KPIs */}
            <div className="xl:col-span-2 space-y-6">
               
               {/* KPIs */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                     <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">Total Ingresos</p>
                     <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500">${totalIngresos.toLocaleString('es-CL')}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center">
                     <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">Total Costos</p>
                     <p className="text-2xl font-black text-rose-600 dark:text-rose-500">${totalCostos.toLocaleString('es-CL')}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center relative overflow-hidden">
                     <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2 relative z-10">Balance / Utilidad</p>
                     <p className={`text-2xl font-black relative z-10 ${balance >= 0 ? 'text-[#0ea5e9]' : 'text-rose-600'}`}>
                        ${balance.toLocaleString('es-CL')}
                     </p>
                  </div>
               </div>

               <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                     <h3 className="font-bold text-slate-800 dark:text-slate-200">
                        Historial de Transacciones ({isGlobal ? 'Global / Software' : 'Unidad'})
                     </h3>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                           <tr>
                              <th className="px-5 py-4">Fecha</th>
                              <th className="px-5 py-4">Categoría</th>
                              <th className="px-5 py-4">Descripción</th>
                              <th className="px-5 py-4 text-right">Monto</th>
                              <th className="px-5 py-4 text-center">Acciones</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                           {registros.length === 0 ? (
                             <tr>
                                <td colSpan={5} className="text-center py-12 text-slate-500 italic">No hay registros financieros.</td>
                             </tr>
                           ) : (
                              registros.map((reg: any) => (
                                <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                   <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-medium">{new Date(reg.fecha).toLocaleDateString('es-CL')}</td>
                                   <td className="px-5 py-4">
                                      <div className="flex flex-col">
                                         <span className={`text-[10px] uppercase font-bold tracking-wider ${reg.tipo === 'Ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>{reg.tipo}</span>
                                         <span className="font-medium text-slate-800 dark:text-slate-200">{reg.categoria}</span>
                                      </div>
                                   </td>
                                   <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-sm max-w-[200px] truncate" title={reg.descripcion}>{reg.descripcion}</td>
                                   <td className={`px-5 py-4 text-right font-bold text-base ${reg.tipo === 'Ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                      {reg.tipo === 'Ingreso' ? '+' : '-'}${reg.monto.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                   </td>
                                   <td className="px-5 py-4 text-center">
                                      <button 
                                        onClick={() => handleDeleteRegistro(reg.id)}
                                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors">
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
      )}
    </div>
  );
}
