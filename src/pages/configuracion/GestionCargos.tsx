import React, { useState } from 'react';
import { ShieldCheck, Plus, Check, Trash2, Users, Briefcase } from 'lucide-react';
import Swal from 'sweetalert2';

export default function GestionCargos() {
  const [cargos, setCargos] = useState(['Administrador', 'Mecánico', 'Conductor', 'Supervisor Operaciones', 'Prevencionista', 'Despachador']);
  const [selectedCargoForPerms, setSelectedCargoForPerms] = useState('Administrador');

  const handleDeleteCargo = (cargo: string) => {
    Swal.fire({
      title: '¿Eliminar el cargo?',
      text: `Se eliminará el cargo ${cargo}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setCargos(cargos.filter(r => r !== cargo));
        setSelectedCargoForPerms('Administrador');
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cargo eliminado', showConfirmButton: false, timer: 1500 });
      }
    });
  };

  const handleCreateCargo = () => {
    Swal.fire({
      title: 'Crear nuevo cargo',
      input: 'text',
      inputPlaceholder: 'Nombre del cargo',
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return 'Debes ingresar un nombre';
        if (cargos.includes(value)) return 'Este cargo ya existe';
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setCargos([...cargos, result.value]);
        setSelectedCargoForPerms(result.value);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cargo creado', showConfirmButton: false, timer: 1500 });
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-500" /> Cargos y Roles
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configura los roles y asigna permisos dentro de tu empresa.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 min-h-[60vh]">
        {/* Sidebar Cargos */}
        <div className="w-full md:w-[280px] flex flex-col gap-2 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
           <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
             <div className="font-black text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1.5 uppercase tracking-widest">
                <Briefcase className="w-4 h-4 text-emerald-500" /> Cargos
             </div>
             <button onClick={handleCreateCargo} className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 p-1.5 rounded-lg transition-colors">
               <Plus className="w-4 h-4" />
             </button>
           </div>
           
           <div className="space-y-2 overflow-y-auto pr-1">
             {cargos.map(cargo => (
                <button 
                  key={cargo}
                  onClick={() => setSelectedCargoForPerms(cargo)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 ${
                    selectedCargoForPerms === cargo 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                   <Users className={`w-4 h-4 ${selectedCargoForPerms === cargo ? 'text-indigo-500' : 'text-slate-400'}`} />
                   {cargo}
                </button>
             ))}
           </div>
        </div>

        {/* Permissions Matrix */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
           <div className="mb-6 flex justify-between items-start md:items-center flex-col md:flex-row gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-black text-xl text-slate-800 dark:text-slate-100 leading-none mb-2">{selectedCargoForPerms}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Configura los permisos de acceso y acciones mediante la siguiente matriz.</p>
              </div>
              {selectedCargoForPerms !== 'Administrador' && (
                 <button 
                   onClick={() => handleDeleteCargo(selectedCargoForPerms)}
                   className="text-rose-600 border border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-900/50 dark:hover:bg-rose-900/30 flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors"
                 >
                    <Trash2 className="w-4 h-4" /> Eliminar Cargo
                 </button>
              )}
           </div>

           <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {[
                { section: 'Módulo de Flota', perms: ['Ver Vehículos', 'Crear/Editar Vehículos', 'Asignar Conductores', 'Archivar Vehículos'] },
                { section: 'Módulo de Mantenimiento', perms: ['Ver Órdenes de Trabajo', 'Crear Órdenes', 'Aprobar Órdenes', 'Cerrar Órdenes'] },
                { section: 'Módulo de Personal', perms: ['Ver Empleados', 'Crear/Editar Empleados', 'Gestionar Permisos', 'Evaluar Conductores'] },
                { section: 'Reportes y Finanzas', perms: ['Ver Dashboards', 'Exportar Data', 'Ver Costos', 'Aprobar Presupuestos'] },
                { section: 'Gestión de Bodega', perms: ['Ver Inventario', 'Ingresar Stock', 'Realizar Salida', 'Ajustes Manuales'] },
              ].map((group, idx) => (
                 <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                       <div className="w-1.5 h-4 rounded-full bg-indigo-500"></div>
                       <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">{group.section}</h4>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 bg-white dark:bg-slate-900">
                       {group.perms.map((p, pidx) => (
                          <label key={pidx} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800 p-2 -m-2 rounded-lg transition-colors">
                             <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors shadow-sm ${selectedCargoForPerms === 'Administrador' || pidx % 2 === 0 ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 group-hover:border-indigo-400'}`}>
                               {(selectedCargoForPerms === 'Administrador' || pidx % 2 === 0) && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                             </div>
                             <span className="text-sm font-bold text-slate-700 dark:text-slate-300 select-none group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{p}</span>
                          </label>
                       ))}
                    </div>
                 </div>
              ))}
           </div>

           <div className="shrink-0 flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
             <button 
               className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-10 px-6 rounded-lg transition-colors shadow-sm"
               onClick={() => Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Permisos guardados', showConfirmButton: false, timer: 1500 })}
             >
               Guardar Permisos
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
