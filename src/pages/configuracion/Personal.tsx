import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  Briefcase,
  Search, 
  UserPlus, 
  Download,
  UserCheck,
  Phone,
  Eye,
  Wrench,
  MoreVertical,
  Mail,
  DollarSign,
  Clock,
  Save,
  Edit,
  RefreshCw,
  ChevronRight,
  UserMinus
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';
import { Collaborator } from '../../types';
import { useAppContext } from '../../context/AppContext';

const DEPARTMENTS_ROLES: Record<string, string[]> = {
  'Operaciones y Servicios': ['Supervisor Operaciones', 'Programador', 'Despachador', 'Conductor'],
  'Gestión de Flota': ['Jefe de Flota', 'Supervisor Mantenimiento', 'Mecánico', 'Pañolero'],
  'Logística y Suministros': ['Jefe de Bodega', 'Auditor de Logística', 'Operario de Suministros'],
  'Compras y Proveedores': ['Comprador', 'Analista de Compras', 'Encargado de Proveedores'],
  'Finanzas': ['Analista Financiero', 'Contador', 'Gestor de Pagos'],
  'Configuración y Herramientas': ['Prevencionista']
};

const AVAILABLE_PANELS = [
  { label: 'Dashboard General', value: '/dashboard' },
  { label: 'Operaciones', value: '/operaciones' },
  { label: 'Portal Conductor', value: '/operaciones/portal-conductor' },
  { label: 'Gestión de Flota / OTs', value: '/flota' },
  { label: 'Logística', value: '/logistica' },
  { label: 'Compras', value: '/compras' },
  { label: 'Finanzas', value: '/finanzas' },
  { label: 'Configuración', value: '/configuracion' }
];

export default function Personal() {
  const { personal: users, setPersonal: setUsers } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchColaboradores = async () => {
      const { data, error } = await supabase.from('colaborador').select('*');
      if (error) {
        console.error('Error fetching colaboradores:', error);
      } else if (data) {
        const mappedUsers = data.map(c => ({
          id: c.id,
          initials: (c.nombre?.substring(0, 2) || '').toUpperCase(),
          name: c.nombre || '',
          rut: c.rut || '',
          role: c.rol || 'Empleado',
          roleBadgeText: c.rol || 'Empleado',
          department: c.detalles?.departamento || '-',
          status: (c.estado || 'ACTIVO').toUpperCase(),
          email: c.email || '',
          phone: c.telefono || '',
          sueldoBase: c.detalles?.sueldo_base || undefined,
          valorHH: c.detalles?.valor_hh || undefined,
          prestadorServicio: c.detalles?.prestador_de_servicio || 'INTERNO'
        }));
        setUsers(mappedUsers);
      }
    };
    fetchColaboradores();
  }, [setUsers]);

  const [isModalColaboradorOpen, setIsModalColaboradorOpen] = useState(false);
  const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<Collaborator | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState('');
  const [selectedNewDepartment, setSelectedNewDepartment] = useState('');

  const [newUserName, setNewUserName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserRUT, setNewUserRUT] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('Operaciones y Servicios');
  const [newUserPanel, setNewUserPanel] = useState('/dashboard');
  const [newUserSexo, setNewUserSexo] = useState<'HOMBRE' | 'MUJER' | 'OTRO'>('HOMBRE');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<Collaborator | null>(null);
  const [editSueldoBase, setEditSueldoBase] = useState<number | ''>('');
  const [editValorHH, setEditValorHH] = useState<number | ''>('');

  const filteredUsers = users.filter(u => {
    return u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           u.roleBadgeText.toLowerCase().includes(searchTerm.toLowerCase()) ||
           u.rut.includes(searchTerm);
  });

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'ACTIVO': return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      case 'LICENCIA': return 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
      case 'VACACIONES': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const handleAssignRoleClick = (user: Collaborator) => {
    setSelectedUserForRole(user);
    setSelectedNewRole(user.roleBadgeText);
    setIsAssignRoleModalOpen(true);
  };

  const handleOpenProfileClick = (user: Collaborator) => {
    setSelectedUserForProfile(user);
    setEditSueldoBase(user.sueldoBase || '');
    setEditValorHH(user.valorHH || '');
    setIsProfileModalOpen(true);
  };

  const handleSaveRemuneration = () => {
    if (selectedUserForProfile) {
      setUsers(users.map(u => {
        if (u.id === selectedUserForProfile.id) {
          return {
            ...u,
            sueldoBase: Number(editSueldoBase) || undefined,
            valorHH: Number(editValorHH) || undefined,
          };
        }
        return u;
      }));
      
      // Update selected profile state so the view updates instantly
      setSelectedUserForProfile({
        ...selectedUserForProfile,
        sueldoBase: Number(editSueldoBase) || undefined,
        valorHH: Number(editValorHH) || undefined,
      });

      Swal.fire({
        title: '¡Guardado!',
        text: 'La información de remuneración ha sido actualizada.',
        icon: 'success',
        confirmButtonColor: '#4f46e5'
      });
    }
  };

  const handleSaveNewUser = () => {
    if (!newUserName || !newUserRUT) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor complete los campos obligatorios (Nombres y RUT).',
        icon: 'error'
      });
      return;
    }
    const fullName = `${newUserName} ${newUserLastName}`.trim();
    const isMec = newUserRole.includes('Mecánic');
    const isCond = newUserRole.includes('Conductor');
    const isSup = newUserRole.includes('Supervisor') || newUserRole === 'Administrador' || newUserRole === 'Jefe';

    const newUser: Collaborator = {
      id: Math.random().toString(36).substr(2, 9),
      initials: fullName.substring(0,2).toUpperCase(),
      name: fullName,
      rut: newUserRUT,
      role: newUserRole || 'Empleado',
      roleBadgeText: newUserRole || 'Empleado',
      departamento: newUserDepartment,
      panelInicio: newUserPanel,
      sexo: newUserSexo,
      phone: newUserPhone,
      email: newUserEmail,
      status: 'ACTIVO',
      isConductor: isCond,
      isMecanico: isMec,
      isSupervisor: isSup
    };

    setUsers([...users, newUser]);
    setIsModalColaboradorOpen(false);
    
    // Reset form
    setNewUserName('');
    setNewUserLastName('');
    setNewUserRUT('');
    setNewUserRole('');
    setNewUserEmail('');
    setNewUserPhone('');

    Swal.fire({
      title: '¡Colaborador Creado!',
      text: `El colaborador ha sido registrado y su panel de inicio es ${AVAILABLE_PANELS.find(p => p.value === newUserPanel)?.label}.`,
      icon: 'success',
      confirmButtonColor: '#4f46e5'
    });
  };

  const handleChangeStatusClick = (user: Collaborator, newStatus: Collaborator['status']) => {
    setUsers(users.map(u => {
      if (u.id === user.id) {
        return { ...u, status: newStatus };
      }
      return u;
    }));
    Swal.fire({
      title: 'Estado Actualizado',
      text: `El estado de ${user.name} ha sido cambiado a ${newStatus}.`,
      icon: 'success',
      confirmButtonColor: '#4f46e5'
    });
  };

  const handleDisableUser = (user: Collaborator) => {
    Swal.fire({
      title: '¿Inhabilitar empleado?',
      text: `Estás a punto de inhabilitar a ${user.name}. Perderá el acceso y se desactivará de las operaciones.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, inhabilitar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setUsers(users.filter(u => u.id !== user.id));
        Swal.fire('¡Inhabilitado!', 'El usuario ha sido inhabilitado.', 'success');
      }
    });
  };

  const handleSaveRole = () => {
    if (selectedUserForRole && selectedNewRole) {
      setUsers(users.map(u => {
        if (u.id === selectedUserForRole.id) {
          return {
            ...u,
            roleBadgeText: selectedNewRole,
            role: selectedNewRole,
            isConductor: selectedNewRole === 'Conductor',
            isMecanico: selectedNewRole === 'Mecánico',
            isSupervisor: selectedNewRole.includes('Supervisor') || selectedNewRole === 'Administrador'
          };
        }
        return u;
      }));
      setIsAssignRoleModalOpen(false);
      Swal.fire({
        title: '¡Cargo Asignado!',
        text: `El colaborador ${selectedUserForRole.name} ahora tiene el rol de ${selectedNewRole}.`,
        icon: 'success',
        confirmButtonColor: '#4f46e5'
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" /> Personal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
             Gestión de equipo, colaboradores y operaciones organizacionales.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="flex items-center gap-2 font-bold px-6 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
            <Download className="w-4 h-4" /> Exportar Data
          </Button>
          <Button 
            className="flex items-center gap-2 font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            onClick={() => setIsModalColaboradorOpen(true)}
          >
            <UserPlus className="w-5 h-5" /> Nuevo Colaborador
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, RUT, o cargo (ej. conductor)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Users Table List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-visible shadow-sm relative z-0">
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs">
                <th className="p-4 pl-6">Colaborador</th>
                <th className="p-4">Cargo / Rol Asignado</th>
                <th className="p-4">Contacto / Detalles</th>
                <th className="p-4">Estado Laboral</th>
                <th className="p-4 pr-6 text-right w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-black text-slate-500 dark:text-slate-400 shadow-inner border border-slate-200 dark:border-slate-700">
                        {u.initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{u.name}</div>
                        <div className="text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">{u.rut}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-bold leading-none border border-transparent dark:border-indigo-800/50">
                        {u.isMecanico ? <Wrench className="w-3 h-3" /> : u.isSupervisor ? <UserCheck className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                        {u.roleBadgeText}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                         <Mail className="w-3.5 h-3.5" />
                         {u.email || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs space-y-1.5">
                      <div className="flex gap-2 items-center">
                        <span className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider w-16">TEL:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{u.phone}</span>
                      </div>
                      {u.isConductor && (
                        <div className="flex gap-2 items-center">
                          <span className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider w-16">LIC:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-500">{u.licencia}</span>
                        </div>
                      )}
                      {u.isMecanico && (
                        <div className="flex gap-2 items-center">
                          <span className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider w-16">ESP:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{u.especialidad}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border ${getStatusClasses(u.status)}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="relative inline-block text-left group/menu z-50">
                       <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg transition-colors focus:ring-2 focus:ring-indigo-500">
                           <MoreVertical className="w-4 h-4" />
                       </button>
                       {/* Dropdown Menu */}
                       <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-focus-within/menu:opacity-100 group-focus-within/menu:visible transition-all z-50 divide-y divide-slate-100 dark:divide-slate-700">
                          <div className="py-1">
                             <button 
                                onClick={() => handleOpenProfileClick(u)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                             >
                                <Edit className="w-4 h-4 flex-shrink-0" /> Editar Información
                             </button>
                             <div className="group/status relative">
                               <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                     <RefreshCw className="w-4 h-4 flex-shrink-0" /> Cambiar Estado
                                  </div>
                                  <ChevronRight className="w-4 h-4" />
                               </button>
                               {/* Sub-menu status */}
                               <div className="absolute top-0 right-[calc(100%-8px)] w-40 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-50 overflow-hidden">
                                   <div className="py-1">
                                      {['ACTIVO', 'LICENCIA', 'VACACIONES'].map(status => (
                                          <button 
                                            key={status}
                                            onClick={() => handleChangeStatusClick(u, status as any)}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                          >
                                             {status}
                                          </button>
                                      ))}
                                   </div>
                               </div>
                             </div>
                             <button 
                                onClick={() => handleAssignRoleClick(u)}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                             >
                                <Briefcase className="w-4 h-4 flex-shrink-0" /> Asignar Cargo
                             </button>
                          </div>
                          <div className="py-1">
                             <button 
                               onClick={() => handleDisableUser(u)}
                               className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium border border-transparent flex items-center gap-2"
                             >
                                <UserMinus className="w-4 h-4 flex-shrink-0" /> Inhabilitar Empleado
                             </button>
                          </div>
                       </div>

                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-500">
                      No se encontraron usuarios para la búsqueda.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Nuevo Colaborador */}
      <Modal 
        isOpen={isModalColaboradorOpen} 
        onClose={() => setIsModalColaboradorOpen(false)}
        title="Crear Nuevo Colaborador"
        fullWidth
      >
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Nombres *</label>
                 <input value={newUserName} onChange={e => setNewUserName(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" placeholder="Ej. Juan Andrés" />
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Apellido Paterno *</label>
                 <input value={newUserLastName} onChange={e => setNewUserLastName(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" placeholder="Ej. Pérez" />
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Apellido Materno</label>
                 <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" placeholder="Ej. Silva" />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">RUT *</label>
                 <input value={newUserRUT} onChange={e => setNewUserRUT(e.target.value)} type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" placeholder="Ej. 12.345.678-9" />
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Sexo</label>
                 <select value={newUserSexo} onChange={e => setNewUserSexo(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100">
                    <option value="HOMBRE">Hombre</option>
                    <option value="MUJER">Mujer</option>
                    <option value="OTRO">Otro</option>
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Estado Inicial</label>
                 <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100">
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                 </select>
              </div>
           </div>

           {/* Divisor */}
           <div className="flex items-center gap-4 py-2">
             <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Organización y Rol</span>
             <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Departamento</label>
                 <select value={newUserDepartment} onChange={e => { setNewUserDepartment(e.target.value); setNewUserRole(''); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100">
                    {Object.keys(DEPARTMENTS_ROLES).map(dept => (
                       <option key={dept} value={dept}>{dept}</option>
                    ))}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Cargo / Rol</label>
                 <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100">
                    <option value="">Seleccione un rol...</option>
                    {DEPARTMENTS_ROLES[newUserDepartment]?.map(role => (
                       <option key={role} value={role}>{role}</option>
                    ))}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Panel de Inicio</label>
                 <select value={newUserPanel} onChange={e => setNewUserPanel(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-indigo-700 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                    {AVAILABLE_PANELS.map(panel => (
                       <option key={panel.value} value={panel.value}>{panel.label}</option>
                    ))}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Prestador de servicio</label>
                 <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100">
                    <option>INTERNO</option>
                    <option>EXTERNO</option>
                 </select>
              </div>
           </div>

           {/* Divisor */}
           <div className="flex items-center gap-4 py-2">
             <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Remuneración Base</span>
             <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Sueldo Base ($)</label>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                   <input type="number" className="w-full pl-8 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-slate-100" placeholder="0" />
                 </div>
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Valor HH ($)</label>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                   <input type="number" className="w-full pl-8 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-slate-100" placeholder="0" />
                 </div>
              </div>
              <div>
                 <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">HH Extras ($)</label>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                   <input type="number" className="w-full pl-8 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-slate-100" placeholder="0" />
                 </div>
              </div>
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
             <Button variant="outline" onClick={() => setIsModalColaboradorOpen(false)}>Cancelar</Button>
             <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-8 rounded-xl shadow-sm"
                onClick={handleSaveNewUser}
             >
               Guardar Empleado
             </Button>
           </div>
        </div>
      </Modal>

      {/* MODAL: Asignar Cargo */}
      <Modal 
        isOpen={isAssignRoleModalOpen} 
        onClose={() => setIsAssignRoleModalOpen(false)}
        title="Asignar Nuevo Cargo"
      >
        <div className="space-y-6">
           {selectedUserForRole && (
             <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-sm font-black text-slate-500 dark:text-slate-400 shrink-0 border border-slate-200 dark:border-slate-700">
                  {selectedUserForRole.initials}
               </div>
               <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{selectedUserForRole.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Cargo actual: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedUserForRole.roleBadgeText}</span></p>
               </div>
             </div>
           )}

            <div>
               <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">1. Departamentos Operativos</label>
               <div className="flex flex-wrap gap-2 mb-4">
                  {Object.keys(DEPARTMENTS_ROLES).map(dept => (
                     <button
                        key={dept}
                        onClick={() => setSelectedNewDepartment(dept)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${selectedNewDepartment === dept ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                     >
                        {dept}
                     </button>
                  ))}
               </div>
               {selectedNewDepartment && (
                  <>
                     <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">2. Seleccionar Nuevo Rol en {selectedNewDepartment}</label>
                     <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {DEPARTMENTS_ROLES[selectedNewDepartment].map(role => (
                           <label key={role} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedNewRole === role ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                              <input 
                                type="radio" 
                                name="roleAssignment" 
                                value={role} 
                                checked={selectedNewRole === role} 
                                onChange={() => setSelectedNewRole(role)}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className={`font-bold text-sm ${selectedNewRole === role ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{role}</span>
                           </label>
                        ))}
                     </div>
                  </>
               )}
            </div>

           <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
             <Button variant="outline" onClick={() => setIsAssignRoleModalOpen(false)}>Cancelar</Button>
             <Button 
                onClick={handleSaveRole}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 h-10 rounded-xl shadow-md shadow-indigo-500/20"
             >
               Confirmar Asignación
             </Button>
           </div>
        </div>
      </Modal>

      {/* MODAL: Editar Información (Perfil) */}
      <Modal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)}
        title="Editar Perfil del Colaborador"
        fullWidth
      >
        {selectedUserForProfile && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Remuneration Section (Moved to side) */}
                <div className="lg:col-span-1 order-last lg:order-first bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                   <div className="flex items-center gap-2 mb-6">
                      <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg">Remuneración</h3>
                   </div>
                   
                   <div className="space-y-4">
                      <div>
                         <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                            Sueldo Base (CLP)
                         </label>
                         <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input 
                               type="number" 
                               value={editSueldoBase}
                               onChange={(e) => setEditSueldoBase(e.target.value ? Number(e.target.value) : '')}
                               className="w-full pl-8 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-slate-100" 
                               placeholder="0" 
                            />
                         </div>
                      </div>

                      <div>
                         <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                            Valor HH Normal
                         </label>
                         <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                               type="number" 
                               defaultValue={0}
                               className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-slate-100" 
                               placeholder="0" 
                            />
                         </div>
                      </div>

                      <div>
                         <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                            Valor Hora Extra (HH)
                         </label>
                         <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                               type="number" 
                               value={editValorHH}
                               onChange={(e) => setEditValorHH(e.target.value ? Number(e.target.value) : '')}
                               className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-slate-100" 
                               placeholder="0" 
                            />
                         </div>
                         <p className="text-[10px] font-medium text-slate-400 mt-1.5 leading-snug">
                            Este valor se utilizará para calcular el pago en el reporte finisecuario.
                         </p>
                      </div>

                      <Button 
                         onClick={handleSaveRemuneration}
                         className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2"
                      >
                         <Save className="w-4 h-4" /> Guardar Remuneración
                      </Button>
                   </div>
                </div>

                {/* Personal Information */}
                <div className="lg:col-span-2 space-y-6">
                   {/* User Header Info - Read Only View */}
                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-start gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-xl font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 shrink-0">
                         {selectedUserForProfile.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-start justify-between gap-4">
                            <div>
                               <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">{selectedUserForProfile.name}</h2>
                               <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">{selectedUserForProfile.rut}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border shrink-0 ${getStatusClasses(selectedUserForProfile.status)}`}>
                               {selectedUserForProfile.status}
                            </span>
                         </div>
                         <div className="mt-4 flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                               <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                               <span className="font-semibold">{selectedUserForProfile.roleBadgeText}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                               <Phone className="w-3.5 h-3.5 text-slate-400" />
                               <span className="font-medium">{selectedUserForProfile.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                               <Mail className="w-3.5 h-3.5 text-slate-400" />
                               <span className="font-medium truncate">{selectedUserForProfile.email || 'No registrado'}</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Editable Form */}
                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                       <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                          Información Laboral
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                             <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Nombres</label>
                             <input type="text" defaultValue={selectedUserForProfile.name.split(' ')[0]} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" />
                          </div>
                          <div>
                             <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Apellidos</label>
                             <input type="text" defaultValue={selectedUserForProfile.name.split(' ').slice(1).join(' ')} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" />
                          </div>
                          <div>
                             <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Empresa</label>
                             <input type="text" defaultValue="Empresa Principal" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" />
                          </div>
                          <div>
                             <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Departamento</label>
                             <input type="text" defaultValue="Operaciones" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100" />
                          </div>
                          <div>
                             <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Sexo</label>
                             <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100">
                                <option value="HOMBRE">Hombre</option>
                                <option value="MUJER">Mujer</option>
                                <option value="OTRO">Otro</option>
                             </select>
                          </div>
                          <div>
                             <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Prestador de servicio</label>
                             <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100">
                                <option value="INTERNO">Interno</option>
                                <option value="EXTERNO">Externo</option>
                             </select>
                          </div>
                       </div>
                       
                       <div className="mt-6 flex justify-end">
                         <Button 
                           onClick={() => {
                             Swal.fire({
                                title: '¡Información Actualizada!',
                                text: 'Los datos del empleado han sido guardados.',
                                icon: 'success',
                                confirmButtonColor: '#4f46e5'
                             });
                             setIsProfileModalOpen(false);
                           }}
                           className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-xl"
                         >
                            Guardar Cambios
                         </Button>
                       </div>
                   </div>
                </div>

             </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
