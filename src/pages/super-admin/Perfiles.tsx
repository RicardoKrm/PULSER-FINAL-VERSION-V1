import React, { useState } from 'react';
import { Shield, Key, Plus, Check, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { navigation } from '../../config/navigation';

export default function SuperAdminPerfiles() {
  const [selectedRole, setSelectedRole] = useState('Admin Flota');
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);

  const roles = [
    { id: '1', name: 'Super Administrador', users: 1, type: 'Sistema' },
    { id: '2', name: 'Admin Flota', users: 24, type: 'Cliente' },
    { id: '3', name: 'Supervisor Terreno', users: 45, type: 'Cliente' },
    { id: '4', name: 'Jefe de Taller', users: 18, type: 'Cliente' },
  ];

  // Initializing permissions state
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    'Super Administrador': navigation.flatMap(m => [m.title, ...m.submodules.map(s => `${m.title}:${s.title}`)]),
    'Admin Flota': navigation.flatMap(m => {
      if (m.title === 'Super Administrador') return [];
      const subs = m.submodules.filter(s => !s.title.includes('RR.HH')).map(s => `${m.title}:${s.title}`);
      return [m.title, ...subs];
    }),
    'Supervisor Terreno': [],
    'Jefe de Taller': []
  });

  const currentPerms = rolePermissions[selectedRole] || [];

  const toggleModule = (moduleTitle: string) => {
    setRolePermissions(prev => {
      const rolePerms = prev[selectedRole] || [];
      const isEnabled = rolePerms.includes(moduleTitle);
      let newPerms;
      if (isEnabled) {
        newPerms = rolePerms.filter(p => p !== moduleTitle && !p.startsWith(`${moduleTitle}:`));
      } else {
        const m = navigation.find(x => x.title === moduleTitle);
        const subPerms = m ? m.submodules.map(s => `${moduleTitle}:${s.title}`) : [];
        newPerms = [...rolePerms, moduleTitle, ...subPerms];
      }
      return { ...prev, [selectedRole]: newPerms };
    });
  };

  const toggleSubmodule = (moduleTitle: string, subTitle: string) => {
    setRolePermissions(prev => {
      const rolePerms = prev[selectedRole] || [];
      const subKey = `${moduleTitle}:${subTitle}`;
      const isEnabled = rolePerms.includes(subKey);
      let newPerms;
      if (isEnabled) {
        newPerms = rolePerms.filter(p => p !== subKey);
      } else {
        newPerms = [...rolePerms, subKey];
        if (!newPerms.includes(moduleTitle)) {
          newPerms.push(moduleTitle);
        }
      }
      return { ...prev, [selectedRole]: newPerms };
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Key className="h-6 w-6 text-indigo-600 dark:text-indigo-500" />
            Gestor de Perfiles y Permisos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Crea roles y asigna herramientas personalizadas a las empresas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowNewProfileModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4" /> Nuevo Usuario
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
                placeholder="Buscar perfil..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.name)}
                className={cn(
                  "w-full text-left px-3 py-3 rounded-lg transition-all border",
                  selectedRole === role.name 
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300" 
                    : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                )}
              >
                <div className="font-semibold text-sm flex items-center justify-between">
                  {role.name}
                  {role.type === 'Sistema' && <Shield className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                  <span>{role.users} usuarios</span>
                  <span className="opacity-70">{role.type}</span>
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
                Configurando: {selectedRole}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Selecciona qué módulos y herramientas estarán disponibles para este perfil.
              </p>
            </div>
            {/* Removed Edit2 and Trash2 icons */}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {navigation.map((module) => {
              if (module.title === 'Super Administrador') return null; // No mostrar este menú en la asignación

              const isModuleEnabled = currentPerms.includes(module.title);
              
              return (
                <div key={module.href} className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isModuleEnabled} 
                      onChange={() => toggleModule(module.title)}
                    />
                    <div className={cn(
                      "flex items-center justify-center w-5 h-5 rounded border",
                      isModuleEnabled ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                    )}>
                      {isModuleEnabled && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      <module.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      {module.title}
                    </div>
                  </label>
                  
                  <div className="pl-6 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 ml-5">
                    {module.submodules.map((sub) => {
                      const isSubEnabled = currentPerms.includes(`${module.title}:${sub.title}`);
                      
                      return (
                        <label key={sub.href} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={isSubEnabled}
                            onChange={() => toggleSubmodule(module.title, sub.title)}
                          />
                          <div className={cn(
                            "flex items-center justify-center w-4 h-4 rounded border transition-colors",
                            isSubEnabled ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover:border-indigo-300"
                          )}>
                            {isSubEnabled && <Check className="h-3 w-3" />}
                          </div>
                          <span className={cn(
                            "text-sm transition-colors",
                            isSubEnabled ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-500 dark:text-slate-500"
                          )}>
                            {sub.title}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 mt-auto rounded-b-xl">
            <button className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              Cancelar
            </button>
            <button className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
              Guardar Permisos
            </button>
          </div>
        </div>
      </div>

      {/* Modal Nuevo Usuario */}
      {showNewProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Nuevo Usuario (Personal)</h2>
              <button 
                onClick={() => setShowNewProfileModal(false)} 
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form className="space-y-6">
                
                {/* Datos Personales */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Datos Personales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                      <input type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: Juan" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">RUT</label>
                      <input type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: 12.345.678-9" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Apellido Paterno</label>
                      <input type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: Pérez" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Apellido Materno</label>
                      <input type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: González" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sexo</label>
                      <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white">
                        <option value="HOMBRE">Hombre</option>
                        <option value="MUJER">Mujer</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Datos Laborales */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Datos Laborales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Empresa</label>
                      <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white">
                        <option value="">Seleccionar empresa...</option>
                        <option value="1">Transportes del Norte</option>
                        <option value="2">Logística Sur</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cargo</label>
                      <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white">
                        <option value="">Seleccionar cargo...</option>
                        <option value="1">Mecánico de Mantenimiento</option>
                        <option value="2">Conductor</option>
                        <option value="3">Jefe de Taller</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rol en el Sistema</label>
                      <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white">
                        <option value="ADMINISTRADOR">Administrador</option>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="MECANICO">Mecánico</option>
                        <option value="ASISTENTE">Asistente</option>
                        <option value="BODEGUERO">Bodeguero</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo Prestador</label>
                      <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white">
                        <option value="INTERNO">Interno</option>
                        <option value="EXTERNO">Externo</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
                      <select className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white">
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Datos Económicos */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Datos Económicos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sueldo Base ($)</label>
                      <input type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: 500000" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor Hora Normal ($)</label>
                      <input type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: 5000" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor Hora Extra ($)</label>
                      <input type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: 7500" />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50">
              <button 
                onClick={() => setShowNewProfileModal(false)} 
                className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              >
                Cancelar
              </button>
              <button className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
                Guardar Usuario
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

