import React, { useState, useEffect } from 'react';
import { Shield, Users, Check, Search, Save, UserCheck, AlertCircle, Briefcase } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import Swal from 'sweetalert2';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export default function AsignacionPermisos() {
  const { personal, setPersonal } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  type CargoInfo = { nombre: string, perfil: string, permisos: string[] };
  const [availableCargos, setAvailableCargos] = useState<CargoInfo[]>([]);

  useEffect(() => {
    const fetchCargos = async () => {
      try {
        const { data, error } = await supabase.from('cargo').select('nombre, perfil, permisos');
        if (error) {
          console.warn('Cargos table might not exist yet', error);
        } else if (data) {
          setAvailableCargos(data as CargoInfo[]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCargos();
  }, []);

  const selectedUser = personal.find(u => u.id === selectedUserId);
  const filteredUsers = personal.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.rut.includes(searchTerm)
  );

  const handleCargoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedUserId) return;
    
    const newCargo = e.target.value;
    const isMec = newCargo.includes('Mecánic');
    const isCond = newCargo.includes('Conductor');
    const isSup = newCargo.includes('Supervisor') || newCargo === 'Administrador';

    setPersonal(personal.map(u => {
      if (u.id === selectedUserId) {
        return {
          ...u,
          role: newCargo,
          roleBadgeText: newCargo,
          isMecanico: isMec,
          isConductor: isCond,
          isSupervisor: isSup
        };
      }
      return u;
    }));
  };

  const handleSave = () => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Configuración guardada correctamente',
      showConfirmButton: false,
      timer: 1500
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-500" />
            Asignación de Cargos y Permisos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Asigna roles operativos a tu personal para definir a qué módulos tienen acceso.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Users List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col transition-colors max-h-[70vh]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar personal..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredUsers.length === 0 ? (
              <div className="text-center p-4 text-slate-500 text-sm">
                No se encontraron usuarios.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-lg transition-all border",
                    selectedUserId === user.id 
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300" 
                      : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <div className="font-semibold text-sm flex items-center justify-between">
                     <span className="truncate">{user.name}</span>
                     {selectedUserId === user.id && <UserCheck className="h-4 w-4 text-indigo-500 shrink-0 ml-2" />}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
                     <span>{user.roleBadgeText}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Assignment Editor */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col transition-colors min-h-[500px]">
          {selectedUser ? (
            <>
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xl text-slate-600 dark:text-slate-300 shrink-0">
                       {selectedUser.initials}
                     </div>
                     <div>
                       <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedUser.name}</h2>
                       <p className="text-sm font-medium text-slate-500 dark:text-slate-400">RUT: {selectedUser.rut}</p>
                     </div>
                   </div>

                   <div className="w-full md:w-64 shrink-0">
                     <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Cargo Asignado</label>
                     <select 
                       value={selectedUser.roleBadgeText}
                       onChange={handleCargoChange}
                       className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors dark:text-slate-100"
                     >
                       <option value="" disabled>Seleccionar cargo...</option>
                       {availableCargos.map(cargo => (
                         <option key={cargo.nombre} value={cargo.nombre}>{cargo.nombre} (Perfil: {cargo.perfil})</option>
                       ))}
                       {/* Add the current one if not in list */}
                       {!availableCargos.some(c => c.nombre === selectedUser.roleBadgeText) && selectedUser.roleBadgeText !== 'Empleado' && (
                          <option value={selectedUser.roleBadgeText}>{selectedUser.roleBadgeText} (Cargo Actual)</option>
                       )}
                     </select>
                   </div>
                </div>
              </div>

              <div className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl mb-6 text-indigo-800 dark:text-indigo-300 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>
                    Al asignar el cargo <strong>{selectedUser.roleBadgeText}</strong>, el usuario hereda automáticamente los permisos configurados para ese cargo por el Super Administrador en la matriz central.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-700 dark:text-slate-200">Resumen de Permisos Heredados</h3>
                  
                  {/* Visualization of assumed inherited modules based on role (Mock view just to give the feedback) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {selectedUser.roleBadgeText.includes('Mecánico') && (
                       <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2 mb-2">
                             <Check className="w-4 h-4 text-emerald-500" /> Módulo de Mantenimiento
                          </h4>
                          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pl-6">
                            <li>• Ver Órdenes de Trabajo</li>
                            <li>• Crear Órdenes</li>
                            <li>• Cerrar Órdenes</li>
                          </ul>
                       </div>
                     )}
                     {selectedUser.roleBadgeText.includes('Conductor') && (
                       <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2 mb-2">
                             <Check className="w-4 h-4 text-emerald-500" /> Portal Conductor
                          </h4>
                          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pl-6">
                            <li>• Check-in de Viaje</li>
                            <li>• Reporte de Novedades</li>
                          </ul>
                       </div>
                     )}
                     {(selectedUser.roleBadgeText.includes('Supervisor') || selectedUser.roleBadgeText === 'Administrador') && (
                       <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2 mb-2">
                             <Check className="w-4 h-4 text-emerald-500" /> Módulo de Flota y Personal
                          </h4>
                          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pl-6">
                            <li>• Asignar Conductores</li>
                            <li>• Aprobar Presupuestos</li>
                            <li>• Administrar Usuarios</li>
                          </ul>
                       </div>
                     )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 mt-auto rounded-b-xl">
                <Button 
                  onClick={handleSave}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Guardar Configuración
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500">
              <Users className="h-16 w-16 text-slate-200 dark:text-slate-800 mb-4" />
              <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Ningún usuario seleccionado</p>
              <p className="text-sm mt-1 text-center max-w-sm">Selecciona un colaborador en la lista para asignar su cargo operativo y visualizar los permisos que hereda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
