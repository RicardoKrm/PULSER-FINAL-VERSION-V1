import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
  Building
} from 'lucide-react';
import { navigation } from '../config/navigation';
import { cn } from '../lib/utils';
import { useTheme } from './ThemeProvider';
import { useCompany } from '../contexts/CompanyContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { companies, activeCompanyId, setActiveCompanyId } = useCompany();

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  // Expand parent menu if child is active on load
  React.useEffect(() => {
    navigation.forEach(item => {
      if (item.submodules.some(sub => location.pathname.startsWith(sub.href))) {
        if (!expandedMenus.includes(item.title)) {
          setExpandedMenus(prev => [...prev, item.title]);
        }
      }
    });
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-slate-900 dark:bg-slate-950 text-slate-300 transition-all duration-300 ease-in-out flex flex-col fixed inset-y-0 left-0 z-50 lg:static",
          sidebarOpen ? "w-72" : "w-20 -translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-white overflow-hidden whitespace-nowrap">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-xl tracking-tight">PULSER <span className="text-blue-500">TMS</span></span>
            )}
          </div>
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
                      setExpandedMenus([...expandedMenus, item.title]);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group",
                    isActive ? "bg-slate-800 dark:bg-slate-800/80 text-blue-400" : "hover:bg-slate-800/50 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0" />
                    {sidebarOpen && (
                      <span className="font-medium text-sm text-left">{item.title}</span>
                    )}
                  </div>
                  {sidebarOpen && (
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 transition-transform text-slate-500",
                        isExpanded && "rotate-90"
                      )} 
                    />
                  )}
                </button>

                {/* Submodules */}
                {sidebarOpen && isExpanded && (
                  <div className="mt-1 space-y-1 pl-11 pr-2">
                    {item.submodules.map(subItem => {
                      const SubIcon = subItem.icon;
                      return (
                        <NavLink
                          key={subItem.href}
                          to={subItem.href}
                          className={({ isActive: isSubActive }) => cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                            isSubActive 
                              ? "bg-blue-600/10 text-blue-400 font-medium" 
                              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                          )}
                        >
                          {/* <SubIcon className="h-4 w-4" /> */}
                          <span>{subItem.title}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
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
                <span className="text-xs text-slate-500 text-blue-400">Súper Administrador</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-sm z-10 transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                placeholder="Buscar módulo, OT, patente..." 
                className="bg-transparent border-none outline-none text-sm ml-2 w-64 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Selector de Empresa - Solo Super Administrador */}
            <div className="hidden lg:flex items-center ml-4 border-l border-slate-200 dark:border-slate-700 pl-4">
              <Building className="h-4 w-4 text-slate-500 dark:text-slate-400 mr-2" />
              <select
                value={activeCompanyId}
                onChange={(e) => setActiveCompanyId(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 cursor-pointer appearance-none pr-8 py-1 truncate max-w-[200px] xl:max-w-[300px]"
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

          <div className="flex items-center gap-2">
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
            <button className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1.5 rounded-lg transition-colors">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-200 dark:border-blue-800">
                AU
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
