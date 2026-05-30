import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  Search, 
  UserCircle, 
  ChevronDown, 
  ChevronRight,
  Activity,
  Sun,
  Moon,
  Building,
  PanelLeftClose,
  User,
  LifeBuoy,
  LogOut,
  Lock
} from 'lucide-react';
import { navigation } from '../config/navigation';
import { cn } from '../lib/utils';
import { useTheme } from './ThemeProvider';
import { useCompany } from '../contexts/CompanyContext';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { WhatsAppButton } from './WhatsAppButton';
import { supabase } from '../lib/supabase';
import Swal from 'sweetalert2';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { companies, activeCompanyId, setActiveCompanyId } = useCompany();
  const { currentUser, usuarios, setCurrentUser } = useAppContext();
  const { signOut, user, profile } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [allNotifications, setAllNotifications] = useState([
    { id: 1, type: 'ALERTA_FLOTA', title: 'Vehículo Mantenido Vencido', description: 'El vehículo F-05 ha superado su kilometraje de mantenimiento programado.', time: 'Hace 30 min', read: false, roles: ['Admin', 'Súper Administrador'] },
    { id: 2, type: 'ALERTA_FLOTA', title: 'Revisión de Neumáticos', description: '2 vehículos necesitan inspección urgente de neumáticos (límite < 3.0mm).', time: 'Hace 2 horas', read: false, roles: ['Admin', 'Súper Administrador'] },
    { id: 3, type: 'STOCK_CRITICO', title: 'Stock Crítico en Bodega', description: 'Filtro de Aceite X1 (Stock Actual: 2, Mínimo Requerido: 5)', time: 'Hace 5 horas', read: true, roles: ['Admin', 'Súper Administrador', 'Mecánico'] },
    { id: 4, type: 'INFO', title: 'OT Pendiente', description: 'Tienes 1 Orden de Trabajo asignada (OT-2345).', time: 'Ayer', read: true, roles: ['Mecánico', 'Súper Administrador'] },
    { id: 5, type: 'ALERTA_SUMINISTRO', title: 'Pedido Recibido', description: '✅ ¡Buenas noticias! Llegó el repuesto "Filtro de Aceite X1" que pediste.', time: 'Hace 1 hora', read: false, roles: ['Mecánico'] },
  ]);

  const notifications = allNotifications.filter(n => n.roles.includes(currentUser.cargo));

  const markAllAsRead = () => {
    setAllNotifications(allNotifications.map(n => ({ ...n, read: true })));
  };

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  // Show prompt if profile exists and cambio_clave_pendiente is true
  const showForcePasswordChange = profile?.cambio_clave_pendiente === true;

  const handleForcePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
      return;
    }
    if (newPassword.length < 6) {
      Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error: updateAuthError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateAuthError) throw updateAuthError;

      const { error: updateProfileError } = await supabase
        .from('usuario_aplicacion')
        .update({ cambio_clave_pendiente: false })
        .eq('id', profile?.id);
        
      if (updateProfileError) throw updateProfileError;

      Swal.fire({
        icon: 'success',
        title: 'Contraseña Actualizada',
        text: 'Tu contraseña ha sido cambiada correctamente.',
        showConfirmButton: false,
        timer: 1500
      });
      // reload or sync state by reloading 
      window.location.reload();
    } catch (err: any) {
      console.error('Error changing password:', err);
      Swal.fire('Error', err.message || 'No se pudo actualizar la contraseña', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => 
      prev.includes(title) ? [] : [title]
    );
  };

  // Filter navigation based on user permissions
  const filteredNavigation = React.useMemo(() => {
    const roleName = profile?.rol?.nombre || currentUser?.cargo;
    
    // If no role at all, default to full nav
    if (!roleName) return navigation;
    
    const perms = profile?.rol?.permisos || [];

    // Super Admins can see everything by default EXCEPT 'Crear Servicio' (based on configuration)
    if (['Súper Administrador', 'Super Administrador', 'Administrador', 'Admin'].includes(roleName)) {
      return navigation.map(item => {
        if (item.submodules) {
          return {
            ...item,
            submodules: item.submodules.filter(sub => sub.title !== 'Crear Servicio')
          };
        }
        return item;
      });
    }

    // Explicit permissions configured in DB
    if (Array.isArray(perms) && perms.length > 0) {
      return navigation.reduce((acc, item) => {
        if (perms.includes(item.title)) {
          let filteredSubmodules = item.submodules;
          if (item.submodules) {
            filteredSubmodules = item.submodules.filter((sub) => 
               perms.includes(`${item.title}:${sub.title}`) || sub.title === 'Gestión de Rutas' || sub.title === 'Mantenedores'
            );
          }
          acc.push({ ...item, submodules: filteredSubmodules && filteredSubmodules.length > 0 ? filteredSubmodules : undefined });
        }
        return acc;
      }, [] as typeof navigation);
    }

    return [];
  }, [profile?.rol, currentUser?.cargo, navigation]);

  // Expand parent menu if child is active on load
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    
    filteredNavigation.forEach(item => {
      if (item.submodules?.some(sub => location.pathname.startsWith(sub.href))) {
        if (!expandedMenus.includes(item.title)) {
          setExpandedMenus([item.title]);
        }
      }
    });
  }, [location.pathname, filteredNavigation]);

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-slate-900 dark:bg-slate-950 text-slate-300 transition-all duration-300 ease-in-out flex flex-col fixed inset-y-0 left-0 z-50 lg:static",
          sidebarOpen ? "w-72 translate-x-0" : "w-20 -translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <Link to="/operaciones/alertas" className="flex items-center gap-3 text-white overflow-hidden whitespace-nowrap outline-none">
            <div className="bg-blue-600 p-1.5 rounded-lg shrink-0">
              <Activity className="h-6 w-6 text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-xl tracking-tight hover:text-blue-400 transition-colors">PULSER <span className="text-blue-500">TMS</span></span>
            )}
          </Link>
          {sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Ocultar panel"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedMenus.includes(item.title);
            const isActive = location.pathname.startsWith(item.href);

            return (
              <div key={item.title} className="mb-2">
                {item.submodules ? (
                  <button
                    onClick={() => {
                      if (sidebarOpen) {
                        toggleMenu(item.title);
                      } else {
                        setSidebarOpen(true);
                        setExpandedMenus([item.title]);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group overflow-hidden whitespace-nowrap",
                      isActive ? "bg-slate-800 dark:bg-slate-800/80 text-blue-400" : "hover:bg-slate-800/50 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 shrink-0" />
                      <span 
                        className={cn(
                          "font-medium text-sm text-left transition-all duration-300",
                          sidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                        )}
                      >
                        {item.title}
                      </span>
                    </div>
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 shrink-0 transition-all duration-300 text-slate-500",
                        isExpanded && "rotate-90",
                        sidebarOpen ? "opacity-100" : "opacity-0 translate-x-4"
                      )} 
                    />
                  </button>
                ) : (
                  <NavLink
                    to={item.href}
                    className={({ isActive: isItemActive }) => cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group overflow-hidden whitespace-nowrap",
                      isItemActive ? "bg-slate-800 dark:bg-slate-800/80 text-blue-400" : "hover:bg-slate-800/50 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span 
                      className={cn(
                        "font-medium text-sm text-left transition-all duration-300",
                        sidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                      )}
                    >
                      {item.title}
                    </span>
                  </NavLink>
                )}

                {/* Submodules */}
                {item.submodules && (
                  <div 
                    className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      sidebarOpen && isExpanded ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 mt-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-1 pl-11 pr-2 pb-1">
                        {item.submodules.map(subItem => {
                          const SubIcon = subItem.icon;
                          return (
                            <NavLink
                              key={subItem.href}
                              to={subItem.href}
                              className={({ isActive: isSubActive }) => cn(
                                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap overflow-hidden",
                                isSubActive 
                                  ? "bg-blue-600/10 text-blue-400 font-medium" 
                                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                              )}
                            >
                              <span className="truncate">{subItem.title}</span>
                            </NavLink>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* User profile brief in sidebar */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800 dark:bg-slate-900/50 border border-slate-700 dark:border-slate-800">
              <UserCircle className="h-8 w-8 text-slate-400" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{profile?.nombre || user?.email}</span>
                <span className="text-xs text-blue-400 dark:text-slate-400">{profile?.rol?.nombre || 'Súper Administrador'}</span>
                <span className="text-[10px] text-slate-500">{profile?.empresa?.nombre || ''}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-sm z-10 transition-colors duration-200">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-2 -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all w-full max-w-xs xl:max-w-md">
              <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <input 
                type="text" 
                placeholder="Buscar módulo, OT, patente..." 
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Tenant Context Selector para Super Admin */}
            {useCompany().isSuperAdmin && companies.length > 0 && (
              <div className="hidden sm:flex items-center ml-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mr-2 flex flex-col items-end leading-none">
                  <span>Super Admin</span>
                  <span>Mode</span>
                </div>
                <div className="relative group">
                  <select
                    value={activeCompanyId}
                    onChange={(e) => setActiveCompanyId(e.target.value)}
                    className="appearance-none bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 py-1.5 pl-3 pr-8 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[200px] truncate cursor-pointer transition-colors"
                    title="Cambiar empresa activa (Workspace)"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 font-medium">
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <Building className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={toggleTheme}
              className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Notificaciones"
              >
                <Bell className="h-5 w-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border-2 border-white dark:border-slate-900">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notificaciones</h3>
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Marcar todo leído
                    </button>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={cn(
                            "px-4 py-3 border-b border-slate-50 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer",
                            !notification.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                          )}
                          onClick={() => {
                            setAllNotifications(allNotifications.map(n => n.id === notification.id ? { ...n, read: true } : n));
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-1.5 shrink-0",
                              notification.type === 'ALERTA_FLOTA' ? "bg-red-500" :
                              notification.type === 'STOCK_CRITICO' ? "bg-amber-500" : 
                              "bg-blue-500"
                            )}></div>
                            <div>
                              <p className={cn(
                                "text-sm", 
                                !notification.read ? "font-semibold text-slate-800 dark:text-slate-100" : "font-medium text-slate-600 dark:text-slate-300"
                              )}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                {notification.description}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                        No tienes nuevas notificaciones
                      </div>
                    )}
                  </div>
                  
                  <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80 text-center">
                    <Link 
                      to="/operaciones/alertas" 
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block w-full"
                    >
                      Ver todas las alertas
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
            
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1.5 rounded-lg transition-colors outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-200 dark:border-blue-800">
                  AU
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-200", 
                  profileOpen && "rotate-180"
                )} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{profile?.nombre || user?.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{profile?.rol?.nombre || 'Súper Administrador'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{profile?.empresa?.nombre || ''}</p>
                  </div>
                  
                  <div className="p-1 border-b border-slate-200 dark:border-slate-700">
                    <p className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cambiar Usuario</p>
                    {usuarios.map(u => (
                      <button 
                        key={u.id}
                        onClick={() => { setCurrentUser(u); setProfileOpen(false); }}
                        className={cn(
                          "w-full flex flex-col px-3 py-1.5 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors",
                          currentUser.id === u.id ? "bg-slate-50 dark:bg-slate-800/50" : ""
                        )}
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">{u.nombre}</span>
                        <span className="text-[10px] text-slate-500">{u.cargo}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-1">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
                      <User className="h-4 w-4 text-slate-500 dark:text-slate-400" /> Mi Perfil
                    </button>
                  </div>
                  
                  <div className="p-1 border-t border-slate-200 dark:border-slate-700">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors">
                      <LifeBuoy className="h-4 w-4 text-slate-500 dark:text-slate-400" /> Centro de Soporte
                    </button>
                  </div>

                  <div className="p-1 border-t border-slate-200 dark:border-slate-700">
                    <button 
                      onClick={async () => {
                        await signOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div 
          key={useCompany().currentCompany?.id || 'empty-company'} 
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
        >
          <Outlet />
        </div>
      </main>

      {/* Force Password Change Modal */}
      {showForcePasswordChange && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative px-8 py-10">
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="bg-amber-500/20 p-4 rounded-full mb-4">
                <Lock className="w-8 h-8 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Seguridad Requerida</h2>
              <p className="text-slate-400 text-sm">
                Por seguridad, debes cambiar tu contraseña predeterminada antes de continuar en el sistema.
              </p>
            </div>

            <form onSubmit={handleForcePasswordChange} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-300">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-300">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="Repite tu contraseña"
                />
              </div>
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25"
              >
                {isUpdatingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </form>
          </div>
        </div>
      )}

      <WhatsAppButton />
    </div>
  );
}
