import React, { useState } from 'react';
import { ShieldCheck, Plus, Check, Trash2, Search, cn } from 'lucide-react';
import Swal from 'sweetalert2';

export default function GestionCargos() {
  const [cargos, setCargos] = useState(['Administrador', 'Mecánico', 'Conductor', 'Supervisor Operaciones', 'Prevencionista', 'Despachador']);
  const [selectedCargoForPerms, setSelectedCargoForPerms] = useState('Administrador');
  const [cargoPermissions, setCargoPermissions] = useState<Record<string, string[]>>({
    'Administrador': [
      'Módulo de Flota', 'Módulo de Flota:Ver Vehículos', 'Módulo de Flota:Crear/Editar Vehículos', 'Módulo de Flota:Asignar Conductores', 'Módulo de Flota:Archivar Vehículos',
      'Módulo de Mantenimiento', 'Módulo de Mantenimiento:Ver Órdenes de Trabajo', 'Módulo de Mantenimiento:Crear Órdenes', 'Módulo de Mantenimiento:Aprobar Órdenes', 'Módulo de Mantenimiento:Cerrar Órdenes',
      'Módulo de Personal', 'Módulo de Personal:Ver Empleados', 'Módulo de Personal:Crear/Editar Empleados', 'Módulo de Personal:Gestionar Permisos', 'Módulo de Personal:Evaluar Conductores',
      'Reportes y Finanzas', 'Reportes y Finanzas:Ver Dashboards', 'Reportes y Finanzas:Exportar Data', 'Reportes y Finanzas:Ver Costos', 'Reportes y Finanzas:Aprobar Presupuestos',
      'Gestión de Bodega', 'Gestión de Bodega:Ver Inventario', 'Gestión de Bodega:Ingresar Stock', 'Gestión de Bodega:Realizar Salida', 'Gestión de Bodega:Ajustes Manuales'
    ]
  });

  const CARGO_MODULES = [
    { section: 'Módulo de Flota', perms: ['Ver Vehículos', 'Crear/Editar Vehículos', 'Asignar Conductores', 'Archivar Vehículos'] },
    { section: 'Módulo de Mantenimiento', perms: ['Ver Órdenes de Trabajo', 'Crear Órdenes', 'Aprobar Órdenes', 'Cerrar Órdenes'] },
    { section: 'Módulo de Personal', perms: ['Ver Empleados', 'Crear/Editar Empleados', 'Gestionar Permisos', 'Evaluar Conductores'] },
    { section: 'Reportes y Finanzas', perms: ['Ver Dashboards', 'Exportar Data', 'Ver Costos', 'Aprobar Presupuestos'] },
    { section: 'Gestión de Bodega', perms: ['Ver Inventario', 'Ingresar Stock', 'Realizar Salida', 'Ajustes Manuales'] },
  ];

  const handleToggleCargoModule = (groupSection: string, subPerms: string[]) => {
    setCargoPermissions(prev => {
      const perms = prev[selectedCargoForPerms] || [];
      const isEnabled = perms.includes(groupSection);
      let newPerms;
      if (isEnabled) {
        newPerms = perms.filter(p => p !== groupSection && !p.startsWith(`${groupSection}:`));
      } else {
        newPerms = [...perms, groupSection, ...subPerms.map(sp => `${groupSection}:${sp}`)];
      }
      return { ...prev, [selectedCargoForPerms]: newPerms };
    });
  };

  const handleToggleCargoSubPerm = (groupSection: string, p: string) => {
    setCargoPermissions(prev => {
      const perms = prev[selectedCargoForPerms] || [];
      const key = `${groupSection}:${p}`;
      const isEnabled = perms.includes(key);
      let newPerms;
      if (isEnabled) {
        newPerms = perms.filter(x => x !== key);
      } else {
        newPerms = [...perms, key];
        if (!newPerms.includes(groupSection)) newPerms.push(groupSection);
      }
      return { ...prev, [selectedCargoForPerms]: newPerms };
    });
  };

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

  // Helper utility locally for classes
  const _c = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-500" />
            Cargos y Roles
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Configura los roles y asigna permisos dentro de tu empresa.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCreateCargo}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4" /> Nuevo Cargo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar cargo..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {cargos.map((cargo) => (
              <button
                key={cargo}
                onClick={() => setSelectedCargoForPerms(cargo)}
                className={_c(
                  "w-full text-left px-3 py-3 rounded-lg transition-all border",
                  selectedCargoForPerms === cargo 
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300" 
                    : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                )}
              >
                <div className="font-semibold text-sm flex items-center justify-between">
                   {cargo}
                   <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                   <span>Sistema</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Editor */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col transition-colors">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Configurando Cargo: {selectedCargoForPerms}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Selecciona qué herramientas y permisos de acciones estarán disponibles para este cargo en la operativa.
              </p>
            </div>
            
            {/* Acciones de Cargo */}
            {selectedCargoForPerms !== 'Administrador' && selectedCargoForPerms !== '' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteCargo(selectedCargoForPerms)}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Eliminar cargo"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {CARGO_MODULES.map((group, idx) => {
              const isGroupEnabled = (cargoPermissions[selectedCargoForPerms] || []).includes(group.section);
              
              return (
              <div key={idx} className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                   <input type="checkbox" className="hidden" 
                          checked={isGroupEnabled} 
                          onChange={() => handleToggleCargoModule(group.section, group.perms)} />
                   <div className={_c(
                      "flex items-center justify-center w-5 h-5 rounded border",
                      isGroupEnabled ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                    )}>
                      {isGroupEnabled && <Check className="h-3.5 w-3.5" />}
                   </div>
                   <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {group.section}
                   </div>
                </label>
                
                <div className="pl-6 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 ml-5">
                  {group.perms.map((p, pidx) => {
                    const isPermEnabled = (cargoPermissions[selectedCargoForPerms] || []).includes(`${group.section}:${p}`);
                    return (
                    <label key={pidx} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800 p-1 -m-1 rounded transition-colors">
                      <input type="checkbox" className="hidden" 
                             checked={isPermEnabled} 
                             onChange={() => handleToggleCargoSubPerm(group.section, p)} />
                      <div className={_c(
                        "flex items-center justify-center w-4 h-4 rounded border transition-colors",
                        isPermEnabled ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover:border-indigo-300"
                      )}>
                         {isPermEnabled && <Check className="h-3 w-3" />}
                      </div>
                      <span className={_c(
                        "text-sm transition-colors",
                        isPermEnabled ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-500 dark:text-slate-500"
                      )}>
                        {p}
                      </span>
                    </label>
                  )})}
                </div>
              </div>
            )})}
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 mt-auto rounded-b-xl">
            <button className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              Cancelar
            </button>
            <button 
              onClick={() => Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Permisos guardados', showConfirmButton: false, timer: 1500 })}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              Guardar Permisos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
