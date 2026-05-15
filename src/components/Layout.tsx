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
  LogOut
} from 'lucide-react';
import { navigation } from '../config/navigation';
import { cn } from '../lib/utils';
import { useTheme } from './ThemeProvider';
import { useCompany } from '../contexts/CompanyContext';
import { ChatBot } from './chatbot/ChatBot';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { companies, activeCompanyId, setActiveCompanyId } = useCompany();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
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

  // Expand parent menu if child is active on load
  React.useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    
    navigation.forEach(item => {
      if (item.submodules.some(sub => location.pathname.startsWith(sub.href))) {
        if (!expandedMenus.includes(item.title)) {
          setExpandedMenus([item.title]);
        }
      }
    });
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
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
          {navigation.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedMenus.includes(item.title);
            const isActive = location.pathname.startsWith(item.href);

            return (
              <div key={item.title} className="mb-2">
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

                {/* Submodules */}
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
              </div>
            );
          })}
        </div>
        
        {/* User profile brief in sidebar */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800 dark:bg-slate-900">
              <UserCircle className="h-8 w-8 text-slate-400" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">Admin Usuario</span>
                <span className="text-xs text-slate-500 text-blue-400 dark:text-slate-400">Súper Administrador</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-sm z-10 transition-colors duration-200">
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

            {/* Selector de Empresa - Solo Super Administrador */}
            <div className="flex items-center sm:ml-2 border-l border-slate-200 dark:border-slate-700 pl-2 lg:ml-4 lg:pl-4">
              <Building className="hidden sm:block h-4 w-4 text-slate-500 dark:text-slate-400 mr-2 shrink-0" />
              <select
                value={activeCompanyId}
                onChange={(e) => setActiveCompanyId(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 cursor-pointer appearance-none pr-6 sm:pr-8 py-1 truncate max-w-[120px] sm:max-w-[200px] xl:max-w-[300px]"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, 
                  backgroundRepeat: 'no-repeat', 
                  backgroundPosition: 'right center', 
                  backgroundSize: '16px' 
                }}
              >
                {companies.map(company => (
                  <option key={company.id} value={company.id} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">
                    {company.name} {company.id !== 'GLOBAL' && `(${company.fleetSize} vehiculos)`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={toggleTheme}
              className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
            </button>
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
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Admin Usuario</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">admin@pulser.com</p>
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
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                      <LogOut className="h-4 w-4" /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      <ChatBot />
    </div>
  );
}
