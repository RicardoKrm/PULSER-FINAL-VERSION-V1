import React, { useState } from 'react';
import { Shield, Key, Plus, Check, Search, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { navigation } from '../../config/navigation';

export default function SuperAdminPerfiles() {
  const [selectedRole, setSelectedRole] = useState('Admin Flota');

  const roles = [
    { id: '1', name: 'Super Administrador', users: 1, type: 'Sistema' },
    { id: '2', name: 'Admin Flota', users: 24, type: 'Cliente' },
    { id: '3', name: 'Supervisor Terreno', users: 45, type: 'Cliente' },
    { id: '4', name: 'Jefe de Taller', users: 18, type: 'Cliente' },
  ];

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
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <Plus className="h-4 w-4" /> Nuevo Perfil
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
            <div className="flex gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <Edit2 className="h-5 w-5" />
              </button>
              <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {navigation.map((module) => {
              if (module.title === 'Super Administrador') return null; // No mostrar este menú en la asignación

              // Simulate checkboxes based on role selection
              const isModuleEnabled = selectedRole === 'Super Administrador' || selectedRole === 'Admin Flota';
              
              return (
                <div key={module.href} className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
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
                      const isSubEnabled = isModuleEnabled && (selectedRole === 'Admin Flota' ? !sub.title.includes('RR.HH') : true);
                      
                      return (
                        <label key={sub.href} className="flex items-center gap-3 cursor-pointer group">
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
    </div>
  );
}
