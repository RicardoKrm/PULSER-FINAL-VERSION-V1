import React, { useState } from 'react';
import { 
  Briefcase,
  Check,
  Plus,
  ShieldCheck,
  Trash2,
  Users
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import Swal from 'sweetalert2';

export default function GestionCargos() {
  const [roles, setRoles] = useState(['Administrador', 'Mecánico', 'Conductor', 'Supervisor Operaciones', 'Prevencionista', 'Despachador']);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState('Administrador');

  const handleDeleteRole = (role: string) => {
    Swal.fire({
      title: '¿Eliminar el rol?',
      html: `Estás a punto de eliminar el rol <b>${role}</b>. Esta acción no se puede deshacer y los usuarios con este rol podrían perder acceso.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#slate-500',
      confirmButtonText: 'Sí, eliminar rol',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setRoles(roles.filter(r => r !== role));
        setSelectedRoleForPerms('Administrador');
        Swal.fire(
          '¡Eliminado!',
          'El rol ha sido eliminado correctamente.',
          'success'
        );
      }
    });
  };

  const handleCreateRole = () => {
    Swal.fire({
      title: 'Crear nuevo rol',
      input: 'text',
      inputLabel: 'Nombre del rol',
      inputPlaceholder: 'Ej. Coordinador de Flota',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Crear Rol',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar un nombre para el rol';
        }
        if (roles.includes(value)) {
          return 'Este rol ya existe';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setRoles([...roles, result.value]);
        setSelectedRoleForPerms(result.value);
        Swal.fire('¡Creado!', 'El nuevo rol ha sido creado y lo hemos seleccionado para que configures sus permisos.', 'success');
      }
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-500" /> Cargos y Roles
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Gestión centralizada de roles organizacionales y configuración de permisos de acceso.
          </p>
        </div>
        <Button 
          onClick={handleCreateRole}
          className="flex items-center gap-2 font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" /> Crear Rol
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 min-h-[70vh]">
        {/* Sidebar Cargos */}
        <div className="w-full md:w-[280px] flex flex-col gap-2 border-r border-slate-200 dark:border-slate-800 pr-0 md:pr-6 shrink-0">
           <div className="font-black text-slate-500 dark:text-slate-400 text-xs mb-3 flex items-center gap-1.5 uppercase tracking-widest pb-2 border-b border-slate-100 dark:border-slate-800">
              <Briefcase className="w-4 h-4 text-emerald-500" /> Roles Definidos
           </div>
           
           <div className="space-y-2 overflow-y-auto pr-1">
             {roles.map(role => (
                <button 
                  key={role}
                  onClick={() => setSelectedRoleForPerms(role)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 ${
                    selectedRoleForPerms === role 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                  }`}
                >
                   <Users className={`w-4 h-4 ${selectedRoleForPerms === role ? 'text-indigo-500' : 'text-slate-400'}`} />
                   {role}
                </button>
             ))}
           </div>
        </div>

        {/* Permissions Matrix */}
        <div className="flex-1 flex flex-col min-w-0">
           <div className="mb-6 shrink-0 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                 <div>
                   <h3 className="font-black text-2xl text-slate-800 dark:text-slate-100 leading-none mb-2">{selectedRoleForPerms}</h3>
                   <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Configura los permisos de acceso y acciones mediante la siguiente matriz.</p>
                 </div>
                 {selectedRoleForPerms !== 'Administrador' && (
                    <Button 
                      variant="outline"
                      onClick={() => handleDeleteRole(selectedRoleForPerms)}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-900/50 dark:hover:bg-rose-900/30 flex items-center gap-2 h-10 px-4"
                    >
                       <Trash2 className="w-4 h-4" /> Eliminar Rol
                    </Button>
                 )}
              </div>
           </div>

           <div className="flex-1 overflow-y-auto space-y-6 pr-2 rounded-xl">
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
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 bg-white dark:bg-slate-900 border-t border-white dark:border-slate-900">
                       {group.perms.map((p, pidx) => (
                          <label key={pidx} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800 p-2 -m-2 rounded-lg transition-colors">
                             <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors shadow-sm ${selectedRoleForPerms === 'Administrador' || pidx % 2 === 0 ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 group-hover:border-indigo-400'}`}>
                               {(selectedRoleForPerms === 'Administrador' || pidx % 2 === 0) && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                             </div>
                             <span className="text-sm font-bold text-slate-700 dark:text-slate-300 select-none group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{p}</span>
                          </label>
                       ))}
                    </div>
                 </div>
              ))}
           </div>

           <div className="shrink-0 flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 pb-2">
             <Button 
               className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-8 shadow-sm shadow-indigo-600/20"
               onClick={() => Swal.fire('¡Guardado!', 'Los permisos del rol han sido actualizados.', 'success')}
             >
               Guardar Permisos
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
