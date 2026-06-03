import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { DollarSign, Search, Plus, Trash2, ArrowLeft, Download, Filter, Hourglass, TrendingUp, TrendingDown, Edit } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import Swal from 'sweetalert2';

export default function RegistrosFinancieros() {
  const { activeCompanyId } = useCompany();
  const [empresa, setEmpresa] = useState<any>(null);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('global');

  // Contratos
  const [contratosProveedores, setContratosProveedores] = useState<any[]>([]);
  const [contratosClientes, setContratosClientes] = useState<any[]>([]);

  // Filtros
  const [fechaInicioFiltro, setFechaInicioFiltro] = useState('');
  const [fechaFinFiltro, setFechaFinFiltro] = useState('');

  // Form State para Nuevo Registro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fechaRegistro, setFechaRegistro] = useState(new Date().toISOString().split('T')[0]);
  const [tipoRegistro, setTipoRegistro] = useState('Costo/Egreso');
  const [categoria, setCategoria] = useState('');
  const [otrosDetalle, setOtrosDetalle] = useState('');
  const [contrato, setContrato] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [editingRegistroId, setEditingRegistroId] = useState<string | null>(null);

  useEffect(() => {
    if (activeCompanyId) {
      fetchData();
      fetchContratos();
    }
  }, [activeCompanyId]);

  const fetchContratos = async () => {
     try {
         const [{ data: pData }, { data: cData }] = await Promise.all([
             supabase.from('compras_contratos').select('*').eq('empresa_id', activeCompanyId),
             supabase.from('operacion_contrato').select('*').eq('empresa_id', activeCompanyId)
         ]);
         if(pData) setContratosProveedores(pData);
         if(cData) setContratosClientes(cData);
     } catch (err) {
         console.error('Error fetching contracts', err);
     }
  };

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

  const handleEditClick = (reg: any) => {
     setEditingRegistroId(reg.id);
     setFechaRegistro(reg.fecha);
     setTipoRegistro(reg.tipo);
     
     if (reg.categoria.startsWith('Otros - ')) {
         setCategoria('Otros');
         setOtrosDetalle(reg.categoria.replace('Otros - ', ''));
     } else {
         setCategoria(reg.categoria);
         setOtrosDetalle('');
     }
     
     setContrato(reg.contrato || '');
     setDescripcion(reg.descripcion);
     setMonto(reg.monto.toString());
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
     setEditingRegistroId(null);
     setDescripcion('');
     setMonto('');
     setContrato('');
     setOtrosDetalle('');
     setFechaRegistro(new Date().toISOString().split('T')[0]);
  };

  const handleSaveRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntity) return;
    if (!descripcion || !monto || !categoria) {
       Swal.fire('Error', 'Complete todos los campos obligatorios', 'error');
       return;
    }

    const currentDetalles = activeEntity.detalles || {};
    let newRegistros = [...registros];

    const categoryToSave = categoria === 'Otros' && otrosDetalle ? `Otros - ${otrosDetalle}` : categoria;

    if (editingRegistroId) {
       newRegistros = newRegistros.map((r: any) => 
         r.id === editingRegistroId 
           ? { ...r, fecha: fechaRegistro, tipo: tipoRegistro, categoria: categoryToSave, contrato, descripcion, monto: parseFloat(monto) }
           : r
       );
    } else {
       const nuevoRegistro = {
          id: crypto.randomUUID(),
          fecha: fechaRegistro,
          tipo: tipoRegistro,
          categoria: categoryToSave,
          contrato,
          descripcion,
          monto: parseFloat(monto)
       };
       newRegistros = [nuevoRegistro, ...registros];
    }

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
        cancelEdit();
        setIsModalOpen(false);
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

  const CATEGORIES = [
    { 
      group: 'Ingresos Operacionales', 
      type: 'Ingreso',
      options: ['Facturación por Servicio', 'Ingreso por Kilometraje', 'Bono Producción', 'Arriendo de Equipo', 'Otros'] 
    },
    { 
      group: 'Costos Directos', 
      type: 'Costo/Egreso',
      options: ['Peajes y TAG', 'Estacionamiento', 'Lavado y Aseo', 'Insumos Ruta', 'Viáticos', 'Otros'] 
    },
    { 
      group: 'Costos Administrativos', 
      type: 'Costo/Egreso',
      options: ['Seguro Obligatorio (SOAP)', 'Seguro Automotriz', 'Permiso de Circulación', 'Revisión Técnica', 'Multas y Partes', 'Otros'] 
    }
  ];

  const getCategoriasToRender = () => CATEGORIES.filter(c => c.type === tipoRegistro);

  useEffect(() => {
     setCategoria('');
  }, [tipoRegistro, isGlobal]);

  const getFilteredRegistros = () => {
     return registros.filter((reg: any) => {
         if (fechaInicioFiltro && new Date(reg.fecha) < new Date(fechaInicioFiltro)) return false;
         if (fechaFinFiltro && new Date(reg.fecha) > new Date(fechaFinFiltro)) return false;
         return true;
     }).sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  const filteredRegistros = getFilteredRegistros();
  const totalIngresos = filteredRegistros.filter((r:any) => r.tipo === 'Ingreso').reduce((acc: number, r:any) => acc + r.monto, 0);
  const totalCostos = filteredRegistros.filter((r:any) => r.tipo === 'Costo/Egreso').reduce((acc: number, r:any) => acc + r.monto, 0);
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
         <div className="space-y-6">
            
            {/* Listado y KPIs */}
            <div className="space-y-6">
               
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
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900/50">
                     <h3 className="font-bold text-slate-800 dark:text-slate-200">
                        Historial de Transacciones ({isGlobal ? 'Global / Software' : 'Unidad'})
                     </h3>
                     <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                           <Filter className="w-4 h-4 text-slate-400" />
                           <input 
                              type="date" 
                              value={fechaInicioFiltro}
                              onChange={(e) => setFechaInicioFiltro(e.target.value)}
                              className="bg-transparent border-none outline-none text-xs text-slate-600 dark:text-slate-300"
                           />
                           <span className="text-slate-400 text-xs">-</span>
                           <input 
                              type="date" 
                              value={fechaFinFiltro}
                              onChange={(e) => setFechaFinFiltro(e.target.value)}
                              className="bg-transparent border-none outline-none text-xs text-slate-600 dark:text-slate-300"
                           />
                           {(fechaInicioFiltro || fechaFinFiltro) && (
                              <button onClick={() => { setFechaInicioFiltro(''); setFechaFinFiltro(''); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                                 <Trash2 className="w-3 h-3 text-rose-500" />
                              </button>
                           )}
                        </div>
                        <button
                          onClick={() => { cancelEdit(); setIsModalOpen(true); }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap text-sm"
                        >
                           <Plus className="w-4 h-4" /> Añadir Registro
                        </button>
                     </div>
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
                           {filteredRegistros.length === 0 ? (
                             <tr>
                                <td colSpan={5} className="text-center py-12 text-slate-500 italic">No hay registros financieros que coincidan.</td>
                             </tr>
                           ) : (
                              filteredRegistros.map((reg: any) => (
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
                                        onClick={() => { handleEditClick(reg); setIsModalOpen(true); }}
                                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors mr-1">
                                         <Edit className="w-4 h-4" />
                                      </button>
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

      {/* Modal para Registro Financiero */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); cancelEdit(); }} title={editingRegistroId ? 'Editar Registro' : 'Añadir Nuevo Registro'}>
         <div className="p-4">
            <form onSubmit={handleSaveRegistro} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha del Registro</label>
                  <input 
                     type="date" 
                     required
                     value={fechaRegistro}
                     onChange={(e) => setFechaRegistro(e.target.value)}
                     className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
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
                        required
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                        <option value="">-- Seleccionar --</option>
                        {getCategoriasToRender().map(group => (
                            <optgroup key={group.group} label={group.group}>
                                {group.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </optgroup>
                        ))}
                     </select>
                  </div>
               </div>
               {categoria === 'Otros' && (
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Especificar Otro *</label>
                     <input 
                        type="text" 
                        required
                        value={otrosDetalle}
                        onChange={(e) => setOtrosDetalle(e.target.value)}
                        placeholder="Especifique el motivo de la categoría"
                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                     />
                  </div>
               )}
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contrato Asociado (Opcional)</label>
                  <select 
                     value={contrato}
                     onChange={(e) => setContrato(e.target.value)}
                     className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                     <option value="">Sin contrato específico</option>
                     {tipoRegistro === 'Costo/Egreso' ? 
                       contratosProveedores.map(c => <option key={c.id} value={`PRV-${c.folio}`}>Proveedor: {c.folio} - {c.proveedor_nombre}</option>) :
                       contratosClientes.map(c => <option key={c.id} value={`CLI-${c.folio}`}>Cliente: {c.folio}</option>)
                     }
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
                     className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono" 
                  />
               </div>
               <div className="flex gap-2 pt-4">
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                     <Plus className="w-5 h-5" /> {editingRegistroId ? 'Actualizar' : 'Guardar'}
                  </button>
               </div>
            </form>
         </div>
      </Modal>

    </div>
  );
}
