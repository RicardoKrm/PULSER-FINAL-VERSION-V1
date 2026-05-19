import React, { useState, useEffect } from 'react';
import { Shield, Key, Plus, Check, Search, X, Building, Users, Pencil, Trash2, Briefcase, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { navigation } from '../../config/navigation';
import { supabase } from '../../lib/supabase';
import Swal from 'sweetalert2';
import { useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

export default function SuperAdminPerfiles() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'perfiles' | 'usuarios' | 'cargos'>('perfiles');
  const [selectedRole, setSelectedRole] = useState('Admin Flota');
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleType, setNewRoleType] = useState('Cliente');
  
  // Cargos management state
  const [cargos, setCargos] = useState(['Administrador', 'Mecánico', 'Conductor', 'Supervisor Operaciones', 'Prevencionista', 'Despachador']);
  const [selectedCargoForPerms, setSelectedCargoForPerms] = useState('Administrador');

  const handleDeleteCargo = (cargo: string) => {
    Swal.fire({
      title: '¿Eliminar el cargo?',
      text: `Se eliminará el cargo ${cargo}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#slate-500',
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
  
  const [empresas, setEmpresas] = useState<{id: string, nombre: string}[]>([]);
  const [managedEmpresaId, setManagedEmpresaId] = useState<string>('');

  const [roles, setRoles] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  
  // User management state
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [bulkActionRole, setBulkActionRole] = useState('');

  // Auto-generate email
  const [newUserNombre, setNewUserNombre] = useState('');
  const [newUserPaterno, setNewUserPaterno] = useState('');
  const [newUserEmpresaId, setNewUserEmpresaId] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  
  const generateEmail = (nombre: string, paterno: string, empresaId: string) => {
    if (!nombre || !paterno) return '';
    const n = nombre.charAt(0).toLowerCase();
    const p = paterno.toLowerCase().replace(/[^a-z]/g, '');
    let emp = 'empresa';
    if (empresaId) {
      const empresa = empresas.find(e => e.id === empresaId);
      if (empresa) {
        emp = empresa.nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
      }
    }
    return `${n}${p}@${emp}.cl`;
  };

  useEffect(() => {
    if (newUserNombre && newUserPaterno) {
      setNewUserEmail(generateEmail(newUserNombre, newUserPaterno, newUserEmpresaId));
    } else {
      setNewUserEmail('');
    }
  }, [newUserNombre, newUserPaterno, newUserEmpresaId, empresas]);

  const handleToggleEstadoUsuario = async (u: any) => {
    try {
      const nuevoEstado = u.estado?.toLowerCase() === 'activo' ? 'Inactivo' : 'Activo';
      const { error } = await supabase.from('usuario_aplicacion').update({ estado: nuevoEstado }).eq('id', u.id);
      if (error) throw error;
      fetchUsuarios();
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success', title: `Usuario ${nuevoEstado}`, showConfirmButton: false, timer: 1500
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo cambiar el estado del usuario', 'error');
    }
  };

  const handleDeleteUsuario = async (u: any) => {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar usuario?',
        text: `Se eliminará a ${u.nombre}. Si también existe en Authentication, tendrás que borrarlo manualmente desde el panel de Supabase.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        const { error } = await supabase.from('usuario_aplicacion').delete().eq('id', u.id);
        if (error) throw error;
        
        fetchUsuarios();
        Swal.fire({
          toast: true, position: 'top-end', icon: 'success', title: 'Usuario eliminado', showConfirmButton: false, timer: 1500
        });
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire('Error', err.message || 'No se pudo eliminar el usuario', 'error');
    }
  };

  useEffect(() => {
    // If navigation state has an empresa_id, set it as managed
    if (location.state && location.state.empresaId) {
      setManagedEmpresaId(location.state.empresaId);
    }
  }, [location.state]);

  useEffect(() => {
    if (showNewUserModal) {
      if (managedEmpresaId) {
        setNewUserEmpresaId(managedEmpresaId);
      }
    } else {
      setNewUserNombre('');
      setNewUserPaterno('');
      setNewUserEmpresaId('');
      setNewUserEmail('');
    }
  }, [showNewUserModal, managedEmpresaId]);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase.from('rol').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      if (data) {
        setRoles(data.map(r => ({ id: r.id, name: r.nombre, users: 0, type: r.tipo })));
        const perms: Record<string, string[]> = {};
        data.forEach(r => perms[r.nombre] = r.permisos || []);
        setRolePermissions(perms);
        if (data.length > 0 && !selectedRole) setSelectedRole(data[0].nombre);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsuarios = async () => {
    try {
      let query = supabase.from('usuario_aplicacion')
        .select('*, rol(nombre), empresa(nombre)');
      if (managedEmpresaId) {
        query = query.eq('empresa_id', managedEmpresaId);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (data) setUsuarios(data);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    }
  };

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const { data, error } = await supabase.from('empresa').select('id, nombre').order('nombre');
        if (error) throw error;
        setEmpresas(data || []);
      } catch (error) {
        console.error('Error fetching empresas:', error);
      }
    };
    
    fetchEmpresas();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (activeTab === 'usuarios') {
      fetchUsuarios();
    }
  }, [activeTab, managedEmpresaId]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    
    try {
      const { data, error } = await supabase.from('rol').insert([{
        nombre: newRoleName,
        tipo: newRoleType,
        permisos: []
      }]).select().single();

      if (error) throw error;

      if (data) {
        setRoles([...roles, { id: data.id, name: data.nombre, users: 0, type: data.tipo }]);
        setRolePermissions(prev => ({ ...prev, [data.nombre]: [] }));
        setShowNewRoleModal(false);
        setNewRoleName('');
        setSelectedRole(data.nombre);
        Swal.fire('Éxito', 'Rol creado exitosamente', 'success');
      }
    } catch(err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo crear el rol', 'error');
    }
  };

  const handleEditRoleName = async (roleId: string, currentName: string) => {
    const { value: formValues } = await Swal.fire({
      title: 'Editar nombre del perfil',
      html: `
        <input id="swal-input1" class="swal2-input" value="${currentName}" placeholder="Nombre del perfil">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement).value
        ]
      }
    });

    if (formValues) {
      const newName = formValues[0].trim();
      if (!newName || newName === currentName) return;

      try {
        const { error } = await supabase
          .from('rol')
          .update({ nombre: newName })
          .eq('id', roleId);

        if (error) throw error;
        
        fetchRoles();
        
        if (selectedRole === currentName) {
          setSelectedRole(newName);
        }

        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Nombre de perfil actualizado', showConfirmButton: false, timer: 1500 });
      } catch (err: any) {
        console.error(err);
        Swal.fire('Error', err.message || 'No se pudo actualizar el nombre del perfil', 'error');
      }
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar perfil?',
      text: `Se eliminará el perfil "${roleName}". Si tiene usuarios asignados, esta acción podría fallar.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('rol')
          .delete()
          .eq('id', roleId);

        if (error) throw error;

        fetchRoles();
        if (selectedRole === roleName) {
          setSelectedRole('');
        }
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'El perfil ha sido eliminado', showConfirmButton: false, timer: 1500 });
      } catch (err: any) {
        console.error(err);
        Swal.fire('Error', err.message || 'No se pudo eliminar el perfil. Es posible que esté en uso.', 'error');
      }
    }
  };

  const handleSavePermissions = async () => {
    const roleId = roles.find(r => r.name === selectedRole)?.id;
    if (!roleId) return;

    try {
      const { error } = await supabase
        .from('rol')
        .update({ permisos: currentPerms })
        .eq('id', roleId);
      
      if (error) throw error;
      Swal.fire({
        icon: 'success',
        title: 'Permisos actualizados correctamente',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Hubo un error al guardar los permisos', 'error');
    }
  };

  const handleAssignRoleToUsers = async () => {
    if (!bulkActionRole) {
      Swal.fire('Atención', 'Selecciona un rol a asignar', 'warning');
      return;
    }
    if (selectedUserIds.length === 0) {
      Swal.fire('Atención', 'Selecciona al menos un usuario', 'warning');
      return;
    }

    try {
      const { error } = await supabase
        .from('usuario_aplicacion')
        .update({ rol_id: bulkActionRole })
        .in('id', selectedUserIds);

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Rol asignado correctamente',
        showConfirmButton: false,
        timer: 1500
      });
      setSelectedUserIds([]);
      setBulkActionRole('');
      fetchUsuarios();
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo asignar el rol', 'error');
    }
  };

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
        const subPerms = m ? (m.submodules || []).map(s => `${moduleTitle}:${s.title}`) : [];
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

  const toggleSelectAllUsers = () => {
    if (selectedUserIds.length === filteredUsuarios.length && filteredUsuarios.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsuarios.map(u => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(userId => userId !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const filteredUsuarios = usuarios.filter(u => {
    const term = userSearchTerm.toLowerCase();
    return (
      (u.nombre || '').toLowerCase().includes(term) ||
      (u.rut || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    );
  });

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
            Crea roles, asigna herramientas y gestiona los permisos de los usuarios.
          </p>
          {managedEmpresaId && (
            <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg w-fit border border-indigo-100 dark:border-indigo-800">
              <Building className="h-4 w-4" />
              <span className="font-medium">Gestionando roles/usuarios para: </span>
              <span className="font-bold">{empresas.find(e => e.id === managedEmpresaId)?.nombre || 'Cargando...'}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowNewRoleModal(true)}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4" /> Nuevo Perfil
          </button>
          <button 
            onClick={handleCreateCargo}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4" /> Nuevo Cargo
          </button>
          <button 
            onClick={() => setShowNewUserModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4" /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('perfiles')}
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'perfiles'
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-700"
          )}
        >
          <Shield className="h-4 w-4" />
          Perfiles y Módulos
        </button>
        <button
          onClick={() => setActiveTab('cargos')}
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'cargos'
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-700"
          )}
        >
          <Briefcase className="h-4 w-4" />
          Cargos y Acciones
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={cn(
            "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
            activeTab === 'usuarios'
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-700"
          )}
        >
          <Users className="h-4 w-4" />
          Asignación a Usuarios
        </button>
      </div>

      {activeTab === 'perfiles' ? (
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
                    <span>{role.type}</span>
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
              
              {/* Acciones de Perfil */}
              {selectedRole && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const r = roles.find(r => r.name === selectedRole);
                      if (r) handleEditRoleName(r.id, r.name);
                    }}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    title="Editar nombre"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      const r = roles.find(r => r.name === selectedRole);
                      if (r) handleDeleteRole(r.id, r.name);
                    }}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Eliminar perfil"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {navigation.map((module) => {
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
                    
                    {module.submodules && module.submodules.length > 0 && (
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
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 mt-auto rounded-b-xl">
              <button className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={handleSavePermissions} className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
                Guardar Permisos
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'usuarios' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre, RUT o email..." 
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select 
                value={bulkActionRole}
                onChange={(e) => setBulkActionRole(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="">Seleccionar Perfil a Asignar...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <button 
                onClick={handleAssignRoleToUsers}
                disabled={selectedUserIds.length === 0 || !bulkActionRole}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Aplicar Perfil
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedUserIds.length === filteredUsuarios.length && filteredUsuarios.length > 0}
                      onChange={toggleSelectAllUsers}
                    />
                  </th>
                  <th className="p-4 font-medium">Usuario</th>
                  <th className="p-4 font-medium">RUT</th>
                  <th className="p-4 font-medium">Empresa</th>
                  <th className="p-4 font-medium">Perfil Asignado</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredUsuarios.map((u) => (
                  <tr 
                    key={u.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => toggleSelectUser(u.id)}
                  >
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                        checked={selectedUserIds.includes(u.id)}
                        readOnly
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{u.nombre}</div>
                      {u.email && <div className="text-xs text-slate-500">{u.email}</div>}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{u.rut}</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{u.empresa?.nombre || '-'}</td>
                    <td className="p-4">
                      {u.rol?.nombre ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {u.rol.nombre}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        u.estado?.toLowerCase() === 'activo' 
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                      )}>
                        {u.estado || 'Activo'}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleEstadoUsuario(u); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                          u.estado?.toLowerCase() === 'activo'
                            ? "text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/40"
                            : "text-green-600 border-green-200 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/40"
                        )}
                      >
                        {u.estado?.toLowerCase() === 'activo' ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteUsuario(u); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border text-red-600 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsuarios.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'cargos' ? (
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
                  className={cn(
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
              {[
                { section: 'Módulo de Flota', perms: ['Ver Vehículos', 'Crear/Editar Vehículos', 'Asignar Conductores', 'Archivar Vehículos'] },
                { section: 'Módulo de Mantenimiento', perms: ['Ver Órdenes de Trabajo', 'Crear Órdenes', 'Aprobar Órdenes', 'Cerrar Órdenes'] },
                { section: 'Módulo de Personal', perms: ['Ver Empleados', 'Crear/Editar Empleados', 'Gestionar Permisos', 'Evaluar Conductores'] },
                { section: 'Reportes y Finanzas', perms: ['Ver Dashboards', 'Exportar Data', 'Ver Costos', 'Aprobar Presupuestos'] },
                { section: 'Gestión de Bodega', perms: ['Ver Inventario', 'Ingresar Stock', 'Realizar Salida', 'Ajustes Manuales'] },
              ].map((group, idx) => (
                <div key={idx} className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                     <input type="checkbox" className="hidden" checked={selectedCargoForPerms === 'Administrador' || idx % 2 === 0} readOnly />
                     <div className={cn(
                        "flex items-center justify-center w-5 h-5 rounded border",
                        (selectedCargoForPerms === 'Administrador' || idx % 2 === 0) ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                      )}>
                        {(selectedCargoForPerms === 'Administrador' || idx % 2 === 0) && <Check className="h-3.5 w-3.5" />}
                     </div>
                     <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {group.section}
                     </div>
                  </label>
                  
                  <div className="pl-6 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 ml-5">
                    {group.perms.map((p, pidx) => (
                      <label key={pidx} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800 p-1 -m-1 rounded transition-colors">
                        <input type="checkbox" className="hidden" checked={selectedCargoForPerms === 'Administrador' || (idx % 2 === 0 && pidx % 2 !== 0)} readOnly />
                        <div className={cn(
                          "flex items-center justify-center w-4 h-4 rounded border transition-colors",
                          (selectedCargoForPerms === 'Administrador' || (idx % 2 === 0 && pidx % 2 !== 0)) ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 group-hover:border-indigo-300"
                        )}>
                           {(selectedCargoForPerms === 'Administrador' || (idx % 2 === 0 && pidx % 2 !== 0)) && <Check className="h-3 w-3" />}
                        </div>
                        <span className={cn(
                          "text-sm transition-colors",
                          (selectedCargoForPerms === 'Administrador' || (idx % 2 === 0 && pidx % 2 !== 0)) ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-500 dark:text-slate-500"
                        )}>
                          {p}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-3 mt-auto rounded-b-xl">
              <button className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                Cancelar
              </button>
              <button 
                onClick={() => Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Permisos de cargo guardados', showConfirmButton: false, timer: 1500 })}
                className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
              >
                Guardar Permisos de Cargo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal Nuevo Usuario */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Nuevo Usuario (Personal)</h2>
              <button 
                onClick={() => setShowNewUserModal(false)} 
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());
              
              try {
                // Generar auto-email si no vino
                const emailToUse = data.email && typeof data.email === 'string' && data.email.trim() !== '' 
                  ? data.email 
                  : newUserEmail;

                if (!emailToUse) {
                  throw new Error("Se requiere un correo electrónico (puede ser el auto-generado).");
                }

                // 1. Create user in Supabase Auth using a temporary client to avoid overwriting the admin session
                const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
                const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';
                const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
                  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
                });

                // RUT serves as initial password
                const initialPassword = String(data.rut).trim();

                const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                  email: emailToUse as string,
                  password: initialPassword,
                });

                if (authError) {
                  console.error("Auth Sign Up Error:", authError);
                  throw new Error(`Error creando usuario en Auth: ${authError.message}`);
                }

                let authUserId = null;
                // Since this is a temporary client and auto-confirm might be off, we still get a user object if successful (authData.user)
                if (authData.user) {
                  authUserId = authData.user.id;
                }

                // 2. Create the profile in usuario_aplicacion
                const fullName = `${data.nombre} ${data.apellido_p} ${data.apellido_m || ''}`.trim();

                const { error } = await supabase.from('usuario_aplicacion').insert([{ 
                  auth_user_id: authUserId,
                  nombre: fullName,
                  rut: data.rut,
                  empresa_id: data.empresa_id,
                  rol_id: data.rol_id,
                  estado: data.estado,
                  email: emailToUse,
                  cambio_clave_pendiente: true
                }]);
                
                if (error) throw error;
                
                Swal.fire({
                  icon: 'success',
                  title: 'Usuario creado exitosamente',
                  showConfirmButton: false,
                  timer: 1500
                });
                setShowNewUserModal(false);
                if (activeTab === 'usuarios') {
                  fetchUsuarios();
                }
              } catch(err: any) {
                Swal.fire({
                  icon: 'error',
                  title: 'Error al crear usuario',
                  text: err?.message || 'Inténtalo de nuevo'
                });
              }
            }} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Datos Personales */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Datos Personales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                      <input name="nombre" value={newUserNombre} onChange={(e) => setNewUserNombre(e.target.value)} required type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: Juan" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">RUT (Será la contraseña inicial)</label>
                      <input name="rut" required type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: 12.345.678-9" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Apellido Paterno</label>
                      <input name="apellido_p" value={newUserPaterno} onChange={(e) => setNewUserPaterno(e.target.value)} required type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: Pérez" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Apellido Materno</label>
                      <input name="apellido_m" type="text" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: González" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Correo Electrónico (Auto-generado)</label>
                      <input name="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} type="email" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: correo@empresa.com" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sexo</label>
                      <select name="sexo" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white">
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
                      <select 
                        name="empresa_id"
                        required
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                        value={newUserEmpresaId}
                        onChange={(e) => setNewUserEmpresaId(e.target.value)}
                      >
                        <option value="" disabled>Seleccionar empresa...</option>
                        {empresas.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cargo</label>
                      <select name="cargo" required defaultValue="" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white">
                        <option value="" disabled>Seleccionar cargo...</option>
                        {cargos.map(cargoOption => (
                           <option key={cargoOption} value={cargoOption}>{cargoOption}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rol en el Sistema</label>
                      <select name="rol_id" required defaultValue="" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white">
                        <option value="" disabled>Seleccionar rol...</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo Prestador</label>
                      <select name="tipo_prestador" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white">
                        <option value="INTERNO">Interno</option>
                        <option value="EXTERNO">Externo</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
                      <select name="estado" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white">
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Datos Económicos */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Datos Económicos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sueldo Base ($) <span className="text-xs font-normal text-slate-400">(Opcional)</span></label>
                      <input name="sueldo_base" type="number" min="0" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: 500000" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor Hora Normal ($) <span className="text-xs font-normal text-slate-400">(Opcional)</span></label>
                      <input name="valor_hora_normal" type="number" min="0" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: 5000" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Valor Hora Extra ($) <span className="text-xs font-normal text-slate-400">(Opcional)</span></label>
                      <input name="valor_hora_extra" type="number" min="0" className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" placeholder="Ej: 7500" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                <button 
                  type="button"
                  onClick={() => setShowNewUserModal(false)} 
                  className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Perfil */}
      {showNewRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Crear Nuevo Perfil</h2>
              <button 
                onClick={() => setShowNewRoleModal(false)} 
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleCreateRole} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre del Perfil</label>
                  <input 
                    type="text" 
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" 
                    placeholder="Ej: Auditor Externo" 
                    required
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Perfil</label>
                  <select 
                    value={newRoleType}
                    onChange={(e) => setNewRoleType(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                  >
                    <option value="Cliente">Cliente</option>
                    <option value="Sistema">Sistema</option>
                  </select>
                </div>
                
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setShowNewRoleModal(false)} 
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                  >
                    Crear Perfil
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


