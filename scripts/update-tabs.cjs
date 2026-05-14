const fs = require('fs');

const file = 'src/pages/flota/GestionNeumaticos.tsx';
let text = fs.readFileSync(file, 'utf8');

// Handle URL query parameters for default tab
text = text.replace(
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'inventario' | 'inspeccion'>('dashboard');",
  `const queryParams = new URLSearchParams(window.location.search);
  const initialTab = (queryParams.get('tab') as 'dashboard' | 'inventario' | 'inspeccion') || 'dashboard';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventario' | 'inspeccion'>(initialTab);`
);

// Remarcar botones
text = text.replace(
  `        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setActiveTab('dashboard')}
            className={activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'dark:border-slate-800 dark:text-slate-300'}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Rentabilidad
          </Button>
          <Button 
            variant={activeTab === 'inventario' ? 'default' : 'outline'}
            onClick={() => setActiveTab('inventario')}
            className={activeTab === 'inventario' ? 'bg-blue-600 text-white' : 'dark:border-slate-800 dark:text-slate-300'}
          >
            <CircleDashed className="w-4 h-4 mr-2" />
            Inventario
          </Button>
          <Button 
            variant={activeTab === 'inspeccion' ? 'default' : 'outline'}
            onClick={() => setActiveTab('inspeccion')}
            className={activeTab === 'inspeccion' ? 'bg-blue-600 text-white' : 'dark:border-slate-800 dark:text-slate-300'}
          >
            <Activity className="w-4 h-4 mr-2" />
            Nueva Inspección
          </Button>
        </div>`,
  `        <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl shadow-inner border border-slate-200/50 dark:border-slate-800/50">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
               "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all",
               activeTab === 'dashboard' ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            )}
          >
            <BarChart3 className="w-4 h-4" /> Rentabilidad KPI
          </button>
          <button 
            onClick={() => setActiveTab('inventario')}
            className={cn(
               "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all",
               activeTab === 'inventario' ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            )}
          >
            <CircleDashed className="w-4 h-4" /> Inventario Maestro
          </button>
          <button 
            onClick={() => setActiveTab('inspeccion')}
            className={cn(
               "flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all",
               activeTab === 'inspeccion' ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-emerald-900/30 ring-1 ring-emerald-500/20" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            )}
          >
            <Activity className="w-4 h-4" /> Registrar Inspección
          </button>
        </div>`
);

fs.writeFileSync(file, text);
console.log("Updated active tabs styling");
