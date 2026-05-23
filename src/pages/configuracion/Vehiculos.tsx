import React, { useState, useEffect } from 'react';
import { Archive, Undo2, Info, Search, Filter, AlertCircle, FileText, Calendar, Hash, Truck, CheckCircle, Car } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Swal from 'sweetalert2';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { cn } from '../../lib/utils';

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehiculo, setSelectedVehiculo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { activeCompanyId } = useCompany();

  useEffect(() => {
    if (activeCompanyId) {
      fetchVehiculos();
    }
  }, [activeCompanyId]);

  const fetchVehiculos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehiculo')
        .select('*')
        .eq('empresa_id', activeCompanyId);
      
      if (!error && data) {
        setVehiculos(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehiculos = vehiculos.filter(v => 
    (v.patente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.marca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.modelo || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const valA = a.numero_interno || (a.detalles ? a.detalles.numero_interno : '');
    const valB = b.numero_interno || (b.detalles ? b.detalles.numero_interno : '');
    return String(valA).localeCompare(String(valB), undefined, { numeric: true });
  });

  const handleToggleEstado = async (vehiculo: any) => {
    const isActivo = vehiculo.estado === 'Activo';
    const nuevoEstado = isActivo ? 'Descontinuado' : 'Activo';
    
    Swal.fire({
      title: isActivo ? '¿Archivar vehículo?' : '¿Reactivar vehículo?',
      html: `Estás a punto de ${isActivo ? 'archivar' : 'reactivar'} el vehículo <b>${vehiculo.patente}</b>.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: `Sí, ${isActivo ? 'archivar' : 'reactivar'}`,
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase
            .from('vehiculo')
            .update({ estado: nuevoEstado })
            .eq('id', vehiculo.id);

          if (!error) {
            setVehiculos(vehiculos.map(v => v.id === vehiculo.id ? { ...v, estado: nuevoEstado } : v));
            Swal.fire(
              isActivo ? '¡Archivado!' : '¡Reactivado!',
              `El vehículo ha sido ${isActivo ? 'archivado' : 'reactivado'} correctamente.`,
              'success'
            );
          } else {
             throw error;
          }
        } catch (e) {
          Swal.fire('Error', 'Ocurrió un error al actualizar el vehículo.', 'error');
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Car className="w-6 h-6 text-indigo-500" /> Vehículos Activos y Archivados
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Administra la lista completa de vehículos de la flota, activos e inactivos.
              </p>
            </div>
          </div>

          <Card className="shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por patente, marca o modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-4">Vehículo</th>
                    <th className="px-5 py-4">Año</th>
                    <th className="px-5 py-4">Patente</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {loading ? (
                     <tr><td colSpan={5} className="text-center py-8">Cargando...</td></tr>
                  ) : filteredVehiculos.map((vehiculo) => (
                    <tr key={vehiculo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                             <Truck className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                           </div>
                           <div className="flex flex-col">
                             <span className="font-bold text-slate-900 dark:text-slate-100">{vehiculo.marca || '-'} {vehiculo.modelo || '-'}</span>
                             <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{vehiculo.tipo_vehiculo || 'Sin Tipo'}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-medium">
                        {vehiculo.anio || '-'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-black tracking-wider text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {vehiculo.patente || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                         <span className={cn("px-2.5 py-1 rounded-md text-xs font-bold border", 
                            vehiculo.estado === 'Activo' 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50" 
                            : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-100 dark:border-rose-800/50"
                         )}>
                           {vehiculo.estado || 'Activo'}
                         </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 h-9 px-3"
                             onClick={() => setSelectedVehiculo(vehiculo)}
                           >
                             <FileText className="w-4 h-4 mr-2 text-slate-500" /> Detalles
                           </Button>
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className={cn("h-9 px-3", vehiculo.estado === 'Activo' 
                               ? "text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-900/50 dark:hover:bg-rose-900/30"
                               : "text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-900/50 dark:hover:bg-indigo-900/30"
                             )}
                             onClick={() => handleToggleEstado(vehiculo)}
                           >
                             {vehiculo.estado === 'Activo' ? <><Archive className="w-4 h-4 mr-2" /> Archivar</> : <><Undo2 className="w-4 h-4 mr-2" /> Reactivar</>}
                           </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {!loading && filteredVehiculos.length === 0 && (
                     <tr>
                       <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                          No se encontraron vehículos que coincidan con la búsqueda.
                       </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={!!selectedVehiculo}
        onClose={() => setSelectedVehiculo(null)}
        title="Detalles del Vehículo"
      >
         {selectedVehiculo && (
           <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                 <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                   <Truck className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                 </div>
                 <div>
                   <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase tracking-tight">{selectedVehiculo.marca} {selectedVehiculo.modelo}</h3>
                   <div className="flex items-center gap-3 mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                     <span>{selectedVehiculo.tipo_vehiculo} ({selectedVehiculo.anio})</span>
                     <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                     <span className="uppercase text-slate-800 dark:text-slate-200 font-bold tracking-widest">{selectedVehiculo.patente}</span>
                   </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedVehiculo.estado || 'Activo'}</p>
                 </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Kilometraje Actual</p>
                    <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{(selectedVehiculo.kilometraje_actual || 0).toLocaleString('es-CL')} km</p>
                 </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                 <Button type="button" variant="outline" onClick={() => setSelectedVehiculo(null)}>Cerrar</Button>
                 <Button 
                   onClick={() => {
                     const v = selectedVehiculo;
                     setSelectedVehiculo(null);
                     handleToggleEstado(v);
                   }} 
                   className={selectedVehiculo.estado === 'Activo' ? "bg-rose-600 hover:bg-rose-700 text-white font-bold" : "bg-indigo-600 hover:bg-indigo-700 text-white font-bold"}
                 >
                   {selectedVehiculo.estado === 'Activo' ? <><Archive className="w-4 h-4 mr-2" /> Archivar Vehículo</> : <><Undo2 className="w-4 h-4 mr-2" /> Reactivar Vehículo</>}
                 </Button>
              </div>
           </div>
         )}
      </Modal>
    </div>
  );
}
