import React, { useState } from 'react';
import { Archive, Undo2, Info, Search, Filter, AlertCircle, FileText, Calendar, Hash, Truck } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Swal from 'sweetalert2';
import { Modal } from '../../components/ui/Modal';

interface VehiculoArchivado {
  id: string;
  numeroInterno: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  tipo: string;
  km: number;
  fechaArchivo: string;
  motivoArchivo: string;
  observaciones: string;
  usuarioArchivo: string;
}

const INITIAL_DATA: VehiculoArchivado[] = [
  {
    id: '1',
    numeroInterno: 'CAM-015',
    patente: 'HRVW-54',
    marca: 'Mercedes-Benz',
    modelo: 'Actros 3344',
    anio: 2018,
    tipo: 'Tractocamión',
    km: 845000,
    fechaArchivo: '2025-10-15',
    motivoArchivo: 'Renovación de Flota',
    observaciones: 'Vehículo vendido a tercero por renovación de unidad operativa. Patente transferida.',
    usuarioArchivo: 'Admin Flota'
  },
  {
    id: '2',
    numeroInterno: 'CAM-008',
    patente: 'GKLM-12',
    marca: 'Volvo',
    modelo: 'FMX 460',
    anio: 2016,
    tipo: 'Camión Tolva',
    km: 920500,
    fechaArchivo: '2025-08-02',
    motivoArchivo: 'Siniestro Total',
    observaciones: 'Pérdida total por accidente en faena minera. Liquidación del seguro completada.',
    usuarioArchivo: 'Admin Flota'
  },
  {
    id: '3',
    numeroInterno: 'CAM-022',
    patente: 'LPRT-88',
    marca: 'Scania',
    modelo: 'G 410',
    anio: 2019,
    tipo: 'Tractocamión',
    km: 650000,
    fechaArchivo: '2026-01-20',
    motivoArchivo: 'Falla Mecánica Irreparable',
    observaciones: 'Falla de motor severa, costo de reparación excede el valor comercial del vehículo.',
    usuarioArchivo: 'Jefe Taller'
  }
];

export default function VehiculosArchivados() {
  const [archivados, setArchivados] = useState<VehiculoArchivado[]>(INITIAL_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiculoArchivado | null>(null);

  const filteredArchivados = archivados.filter(v => 
    v.numeroInterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.motivoArchivo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReactivar = (vehiculo: VehiculoArchivado) => {
    Swal.fire({
      title: '¿Reactivar vehículo?',
      html: `Estás a punto de reactivar el vehículo <b>${vehiculo.numeroInterno} (${vehiculo.patente})</b> en la flota activa.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setArchivados(archivados.filter(v => v.id !== vehiculo.id));
        Swal.fire(
          '¡Reactivado!',
          'El vehículo ha sido vuelto a incluir en la flota activa.',
          'success'
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Archive className="w-6 h-6 text-indigo-500" /> Vehículos Archivados
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Consulta el historial de vehículos dados de baja o reactiva unidades.
          </p>
        </div>
      </div>

      {archivados.length === 0 ? (
         <div className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-4">
               <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-400 tracking-tight mb-2">No hay vehículos archivados</h3>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-500 max-w-sm">
              Todos los vehículos de la flota se encuentran actualmente activos.
            </p>
         </div>
      ) : (
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por equipo, patente o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2">
               <Filter className="w-4 h-4" /> Filtros
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-5 py-4">Vehículo</th>
                  <th className="px-5 py-4">Motivo de Baja</th>
                  <th className="px-5 py-4">Fecha de Archivo</th>
                  <th className="px-5 py-4">Kilometraje</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredArchivados.map((vehiculo) => (
                  <tr key={vehiculo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                           <Truck className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                         </div>
                         <div className="flex flex-col">
                           <span className="font-bold text-slate-900 dark:text-slate-100">{vehiculo.numeroInterno}</span>
                           <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{vehiculo.marca} {vehiculo.modelo}</span>
                           <span className="inline-flex mt-1 uppercase text-[10px] font-black tracking-wider text-slate-500 w-fit">
                             {vehiculo.patente}
                           </span>
                         </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                         <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50">
                           {vehiculo.motivoArchivo}
                         </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-medium text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(vehiculo.fechaArchivo).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono text-sm font-medium bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded inline-block text-slate-700 dark:text-slate-300">
                        {vehiculo.km.toLocaleString('es-CL')} km
                      </div>
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
                           className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-900/50 dark:hover:bg-indigo-900/30 h-9 px-3"
                           onClick={() => handleReactivar(vehiculo)}
                         >
                           <Undo2 className="w-4 h-4 mr-2" /> Reactivar
                         </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredArchivados.length === 0 && (
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
      )}

      <Modal
        isOpen={!!selectedVehiculo}
        onClose={() => setSelectedVehiculo(null)}
        title="Detalles de Vaja del Vehículo"
      >
         {selectedVehiculo && (
           <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                 <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                   <Truck className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                 </div>
                 <div>
                   <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 uppercase tracking-tight">{selectedVehiculo.numeroInterno}</h3>
                   <div className="flex items-center gap-3 mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                     <span>{selectedVehiculo.marca} {selectedVehiculo.modelo} ({selectedVehiculo.anio})</span>
                     <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                     <span className="uppercase text-slate-800 dark:text-slate-200 font-bold tracking-widest">{selectedVehiculo.patente}</span>
                   </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Motivo de Baja</p>
                    <p className="font-semibold text-rose-600 dark:text-rose-400">{selectedVehiculo.motivoArchivo}</p>
                 </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Fecha de Baja</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{new Date(selectedVehiculo.fechaArchivo).toLocaleDateString()}</p>
                 </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Kilometraje Final</p>
                    <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedVehiculo.km.toLocaleString('es-CL')} km</p>
                 </div>
                 <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Procesado por</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedVehiculo.usuarioArchivo}</p>
                 </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Observaciones de Baja</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedVehiculo.observaciones}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 md:mt-8">
                 <Button type="button" variant="outline" onClick={() => setSelectedVehiculo(null)}>Cerrar</Button>
                 <Button 
                   onClick={() => {
                     const v = selectedVehiculo;
                     setSelectedVehiculo(null);
                     handleReactivar(v);
                   }} 
                   className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                 >
                   <Undo2 className="w-4 h-4 mr-2" /> Reactivar Vehículo
                 </Button>
              </div>
           </div>
         )}
      </Modal>
    </div>
  );
}
