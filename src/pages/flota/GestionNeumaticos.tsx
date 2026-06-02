import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Activity, CircleDashed, BarChart3, Truck, Trash, ChevronDown, AlertCircle, ChevronUp, DollarSign, X, Info, TrendingUp, AlertTriangle, ChevronRight, Box } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Modal } from '../../components/ui/Modal';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

export default function GestionNeumaticos() {
  const queryParams = new URLSearchParams(window.location.search);
  const initialTab = (queryParams.get('tab') as 'dashboard' | 'inventario' | 'inspeccion') || 'dashboard';
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventario' | 'inspeccion'>(initialTab);
  const { currentCompany } = useCompany();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CircleDashed className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            Gestión de Neumáticos y Rentabilidad
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Sistema de trazabilidad, control de desgaste y cálculo de CPK ($/km)
          </p>
        </div>
        <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl shadow-inner border border-slate-200/50 dark:border-slate-800/50">
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
            <CircleDashed className="w-4 h-4" /> Neumáticos
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
        </div>
      </div>

      {activeTab === 'dashboard' && <DashboardNeumaticos />}
      {activeTab === 'inventario' && <InventarioNeumaticos />}
      {activeTab === 'inspeccion' && <FormularioInspeccion />}
    </div>
  );
}

function DashboardNeumaticos() {
  const [selectedKpi, setSelectedKpi] = useState<'cpk' | 'activos' | 'alertas' | 'ahorro' | null>(null);
  const [stats, setStats] = useState({
    cpkPromedio: 0,
    neumaticosActivos: 0,
    alertasCriticas: 0,
    ahorroEstimado: 0
  });
  const { currentCompany } = useCompany();

  useEffect(() => {
    const loadDashboardInfo = async () => {
      if (!currentCompany) return;
      const { data, error } = await supabase
        .from('neumatico')
        .select('*')
        .eq('empresa_id', currentCompany.id);

      if (!error && data) {
        setStats({
          cpkPromedio: 0,
          neumaticosActivos: data.filter(d => d.ubicacion !== 'DESECHO').length,
          alertasCriticas: data.filter(d => d.profundidad_actual && d.profundidad_actual <= 3).length,
          ahorroEstimado: 0
        });
      }
    };
    loadDashboardInfo();
  }, [currentCompany]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className={cn("bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-md cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'cpk' && "ring-2 ring-blue-300")}
          onClick={() => setSelectedKpi('cpk')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-blue-100 text-sm font-medium">CPK Promedio Flota</p>
                <h3 className="text-3xl font-black">${stats.cpkPromedio.toFixed(2)} <span className="text-base font-medium text-blue-200">/ km</span></h3>
              </div>
              <div className="p-3 bg-white/20 rounded-lg"><BarChart3 className="w-5 h-5 text-white" /></div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={cn("bg-white dark:bg-slate-900 shadow-md cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'activos' && "ring-2 ring-blue-500")}
          onClick={() => setSelectedKpi('activos')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Neumáticos Activos</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.neumaticosActivos}</h3>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"><CircleDashed className="w-5 h-5 text-slate-600 dark:text-slate-300" /></div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn("bg-white dark:bg-slate-900 shadow-md cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'alertas' && "ring-2 ring-red-500")}
          onClick={() => setSelectedKpi('alertas')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Alertas Críticas</p>
                <h3 className="text-3xl font-black text-red-600 dark:text-red-500">{stats.alertasCriticas}</h3>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" /></div>
            </div>
             <p className="text-xs text-red-600 dark:text-red-400 mt-4 flex items-center">Requieren retiro inmediato</p>
          </CardContent>
        </Card>

        <Card 
          className={cn("bg-white dark:bg-slate-900 shadow-md cursor-pointer transition-transform hover:scale-[1.02]", selectedKpi === 'ahorro' && "ring-2 ring-emerald-500")}
          onClick={() => setSelectedKpi('ahorro')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Ahorro Proyectado</p>
                <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-500">${stats.ahorroEstimado}</h3>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
            </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 flex items-center">Al optimizar presión (+10% vida útil)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="col-span-full lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Rentabilidad y Vida Útil (Sin Datos)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full mt-4 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className="text-center">
                <BarChart3 className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 font-medium">No hay suficientes datos de neumáticos<br/> para generar el gráfico de rentabilidad.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
               <CardTitle className="text-sm">Alertas de Inspección</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {stats.alertasCriticas === 0 && (
                 <div className="text-center py-6 text-emerald-600 dark:text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    Sin alertas críticas recientes
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sidebar KPI Details Layer */}
      {selectedKpi && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedKpi(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white dark:bg-slate-900 shadow-2xl border-l dark:border-slate-800 z-50 flex flex-col overflow-y-auto animate-in slide-in-from-right">
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-10 backdrop-blur-md">
              <div>
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">Detalle de Gestión</h3>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                  Métricas de Neumáticos
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedKpi(null)} className="h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 flex-1 space-y-6">
              {/* Info box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex gap-3 text-sm">
                 <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                 <div>
                   <strong className="block mb-1">FÓRMULA / DEFINICIÓN:</strong>
                   {selectedKpi === 'cpk' && "CPK ($/km) = (Costo de Adquisición + Costo Reparaciones) / Kilómetros Recorridos."}
                   {selectedKpi === 'activos' && "Neumáticos Activos = Total de unidades actualmente montadas o en inventario como stock disponible."}
                   {selectedKpi === 'alertas' && "Alertas Críticas = Neumáticos con surco menor a 3mm, daños severos, o desgaste irregular detectado en inspección."}
                   {selectedKpi === 'ahorro' && "Ahorro Proyectado = Reducción estimada de compras anualizadas si se maximiza la vida útil al estándar esperado (+10%)."}
                 </div>
              </div>

              {/* Data content layer */}
              <div className="space-y-4 pt-4">
                <h4 className="font-bold text-sm uppercase text-slate-500 tracking-wider">Desglose de Datos</h4>
                
                {selectedKpi === 'cpk' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Total Inversión Activa</span>
                      <span className="font-bold text-slate-900 dark:text-white">$75,500,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Total Kilómetros Producidos</span>
                      <span className="font-bold text-slate-900 dark:text-white">23,230,769 km</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-blue-600 text-white rounded-lg shadow-inner">
                      <span className="font-medium">CPK Promedio Ponderado</span>
                      <span className="font-black text-xl">$3.25/km</span>
                    </div>
                  </div>
                )}
                {selectedKpi === 'activos' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Montados en Vehículos</span>
                      <span className="font-bold text-slate-900 dark:text-white">135 Unidades</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Stock Bodega (Repuestos)</span>
                      <span className="font-bold text-slate-900 dark:text-white">7 Unidades</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-slate-800 dark:bg-slate-950 text-white rounded-lg shadow-inner">
                      <span className="font-medium">Total Unidades Activas</span>
                      <span className="font-black text-xl">142</span>
                    </div>
                  </div>
                )}
                {selectedKpi === 'alertas' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Surco Crítico (&lt; 3mm)</span>
                      <span className="font-bold text-slate-900 dark:text-white">2 Unidades</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400 text-red-600">Presión Baja Peligrosa</span>
                      <span className="font-bold text-slate-900 dark:text-white">2 Unidades</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Desgaste Irregular Grave</span>
                      <span className="font-bold text-slate-900 dark:text-white">1 Unidad</span>
                    </div>
                    <div className="space-y-2 mt-4 border-t dark:border-slate-800 pt-4">
                      <p className="text-sm font-semibold text-red-600 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Necesidad de Retiro</p>
                      {[
                        { pos: 'LDPJ-99 - Pos 8', desc: 'Surco crítico (3mm)' },
                        { pos: 'LDPJ-99 - Pos 9', desc: 'Surco crítico (3mm)' },
                        { pos: 'FRTY-12 - Pos 2', desc: 'Desgaste irregular' },
                      ].map((v, idx) => (
                         <div key={idx} className="flex justify-between text-sm p-2 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 rounded-r">
                           <span className="font-medium">{v.pos}</span>
                           <span className="text-red-600">{v.desc}</span>
                         </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedKpi === 'ahorro' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Ahorro en Renuevos Esperado</span>
                      <span className="font-bold text-slate-900 dark:text-white">$800,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <span className="text-slate-600 dark:text-slate-400">Menor Combustible por Presión</span>
                      <span className="font-bold text-slate-900 dark:text-white">$400,000</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-emerald-600 text-white rounded-lg shadow-inner">
                      <span className="font-medium">Total Potencial Anual</span>
                      <span className="font-black text-xl">$1.2M</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

function InventarioNeumaticos() {
  const [selectedNeu, setSelectedNeu] = useState<any | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentCompany } = useCompany();

  useEffect(() => {
    const fetchInventory = async () => {
      if (!currentCompany) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('neumatico')
          .select('*')
          .eq('empresa_id', currentCompany.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;

        const mappedData = (data || []).map(item => {
          let statusColorStr = "text-slate-700 bg-slate-200";
          const e = (item.estado || '').toUpperCase();
          if (e === 'NUEVO') statusColorStr = "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400";
          else if (e === 'BUENO') statusColorStr = "text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
          else if (e === 'REGULAR') statusColorStr = "text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
          else if (e === 'CRITICO') statusColorStr = "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400";

          return {
            id: item.codigo_interno,
            marca: item.marca || '-',
            modelo: item.modelo || '-',
            medida: item.medida || '-',
            estado: e || 'NUEVO',
            statusColor: statusColorStr,
            ubicacion: (item.ubicacion || 'BODEGA').toUpperCase(),
            vehiculo: item.patente_asignada || '-',
            pos: item.posicion || '',
            profActual: item.profundidad_actual || 0,
            profNueva: item.profundidad_nueva || 18,
            km: item.km_acumulados || 0,
            costo: item.costo || 0,
            instalacion: item.fecha_instalacion || '-'
          };
        });

        setInventory(mappedData);
      } catch (err) {
        console.error("Error fetching neumaticos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [currentCompany]);

  const getProgressBarColor = (actual: number, max: number) => {
    const ratio = actual / max;
    if (ratio > 0.6) return "bg-emerald-500";
    if (ratio > 0.3) return "bg-amber-500";
    if (ratio > 0.15) return "bg-orange-500";
    return "bg-red-600";
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden lg:h-[calc(100vh-140px)] min-h-[500px] w-full">
      <div className="flex-1 flex flex-col w-full h-full">
        
        {/* Filters Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por código, marca o patente..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <select className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-48">
            <option>Todas las ubicaciones</option>
            <option>Montado</option>
            <option>Bodega</option>
            <option>Desecho</option>
          </select>
          <select className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-48">
            <option>Todos los estados</option>
            <option>Nuevo</option>
            <option>Bueno</option>
            <option>Regular</option>
            <option>Crítico</option>
          </select>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto w-full">
          <table className="w-full text-left min-w-[800px]">
             <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10">
               <tr className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                 <th className="py-4 px-6 tracking-wide">Código</th>
                 <th className="py-4 px-6 tracking-wide">Marca / Modelo</th>
                 <th className="py-4 px-6 tracking-wide">Medida</th>
                 <th className="py-4 px-6 tracking-wide">Estado</th>
                 <th className="py-4 px-6 tracking-wide">Ubicación</th>
                 <th className="py-4 px-6 tracking-wide w-48">Profundidad</th>
                 <th className="py-4 px-6 tracking-wide text-right">Km Acum.</th>
                 <th className="py-4 pr-6 pl-2 tracking-wide text-center">Acciones</th>
               </tr>
             </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {inventory.map((inv) => (
                  <tr 
                    key={inv.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{inv.id}</span>
                    </td>
                    <td className="py-4 px-6 flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{inv.marca}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{inv.modelo}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">{inv.medida}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className={cn("px-2 py-1 rounded text-xs font-bold uppercase", inv.statusColor)}>
                        {inv.estado}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
                          {inv.ubicacion === 'MONTADO' && <Truck className="w-3.5 h-3.5 mr-1.5" />}
                          {inv.ubicacion === 'BODEGA' && <Box className="w-3.5 h-3.5 mr-1.5" />}
                          {inv.ubicacion === 'DESECHO' && <Trash className="w-3.5 h-3.5 mr-1.5" />}
                          {inv.ubicacion}
                        </div>
                        {inv.ubicacion === 'MONTADO' && (
                          <span className="text-xs text-slate-500">{inv.vehiculo} &bull; {inv.pos}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                       <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{inv.profActual}mm</span>
                          <span className="text-slate-400">/ {inv.profNueva}mm</span>
                       </div>
                       <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden flex">
                          <div 
                            className={cn("h-full rounded-full transition-all", getProgressBarColor(inv.profActual, inv.profNueva))} 
                            style={{ width: `${Math.min(100, Math.max(0, (inv.profActual / inv.profNueva) * 100))}%` }}
                           />
                       </div>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                      {inv.km.toLocaleString()} km
                    </td>
                    <td className="py-4 pr-6 pl-2 text-center">
                      <button 
                        onClick={() => setSelectedNeu(inv)}
                        className="p-2 text-slate-400 group-hover:text-blue-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </div>

      {/* Right Drawer / Detail View Modal */}
      {selectedNeu && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/20 backdrop-blur-sm" onClick={() => setSelectedNeu(null)}>
          <div 
            className="w-[420px] bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl animate-in slide-in-from-right duration-300 transform"
            onClick={(e) => e.stopPropagation()}
          >
             {/* Header */}
           <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pb-8 relative pt-8">
             <button onClick={() => setSelectedNeu(null)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
               <X className="w-5 h-5" />
             </button>
             <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/50">
                 <CircleDashed className="w-6 h-6" />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                   {selectedNeu.id}
                 </h2>
                 <p className="text-sm text-slate-500 font-medium">{selectedNeu.marca} {selectedNeu.modelo}</p>
               </div>
             </div>

             <div className="flex gap-3">
               <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Medida</p>
                 <p className="font-semibold text-slate-900 dark:text-white">{selectedNeu.medida}</p>
               </div>
               <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Costo</p>
                 <p className="font-semibold text-slate-900 dark:text-white">${selectedNeu.costo.toLocaleString()}</p>
               </div>
             </div>
           </div>

           {/* Scrollable Content */}
           <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Estado Actual */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                 <h3 className="text-sm font-bold text-violet-800 dark:text-violet-400 flex items-center mb-4">
                   <Activity className="w-4 h-4 mr-2" /> Estado Actual
                 </h3>
                 
                 <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Condición</span>
                    <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", selectedNeu.statusColor)}>
                      {selectedNeu.estado}
                    </span>
                 </div>

                 <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                       <span className="text-slate-600 dark:text-slate-400">Profundidad de Huella</span>
                       <span className="font-bold text-slate-900 dark:text-white">{selectedNeu.profActual} mm</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden flex mb-2">
                      <div 
                        className={cn("h-full rounded-full transition-all", getProgressBarColor(selectedNeu.profActual, selectedNeu.profNueva))} 
                        style={{ width: `${Math.min(100, Math.max(0, (selectedNeu.profActual / selectedNeu.profNueva) * 100))}%` }}
                       />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                       <span>0 mm (Desecho)</span>
                       <span>{selectedNeu.profNueva} mm (Nuevo)</span>
                    </div>
                 </div>

                 <div className="flex gap-3 text-sm">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg flex flex-col justify-center">
                       <span className="text-slate-500 mb-1">KM Acumulados</span>
                       <span className="font-bold text-base text-slate-900 dark:text-white">{selectedNeu.km.toLocaleString()}</span>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg flex flex-col justify-center">
                       <span className="text-slate-500 mb-1">Costo / KM</span>
                       <span className="font-bold text-base text-slate-900 dark:text-white">${selectedNeu.km > 0 ? (selectedNeu.costo / selectedNeu.km).toFixed(1) : '-.-'}</span>
                    </div>
                 </div>
              </div>

              {/* Ubicacion */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                 <h3 className="text-sm font-bold text-violet-800 dark:text-violet-400 flex items-center mb-4">
                   <Truck className="w-4 h-4 mr-2" /> Ubicación
                 </h3>
                 
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                       {selectedNeu.ubicacion === 'MONTADO' && <Truck className="w-5 h-5 text-blue-600 dark:text-blue-500" />}
                       {selectedNeu.ubicacion === 'BODEGA' && <Box className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />}
                       {selectedNeu.ubicacion === 'DESECHO' && <Trash className="w-5 h-5 text-slate-500" />}
                    </div>
                    <div>
                       {selectedNeu.ubicacion === 'MONTADO' ? (
                         <>
                           <p className="font-bold text-slate-900 dark:text-white text-base">Vehículo {selectedNeu.vehiculo.replace('#', '')}</p>
                           <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Posición: <span className="font-semibold text-slate-800 dark:text-slate-300">{selectedNeu.pos}</span></p>
                           <p className="text-xs text-slate-400 mt-2">Instalado el {selectedNeu.instalacion}</p>
                         </>
                       ) : (
                         <p className="font-bold text-slate-900 dark:text-white text-base mt-2 capitalize">{selectedNeu.ubicacion.toLowerCase()}</p>
                       )}
                    </div>
                 </div>
              </div>

           </div>

           {/* Footer Actions */}
           <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-3 z-10 sticky bottom-0">
              <Button 
                variant="outline" 
                className="flex-1 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                onClick={() => setIsHistoryModalOpen(true)}
              >
                Historial
              </Button>
              <Button className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-medium">
                {selectedNeu.ubicacion === 'MONTADO' ? 'Desmontar' : 'Montar en Vehículo'}
              </Button>
           </div>
        </div>
        </div>
      )}

      {/* Historial Modal */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Historial: ${selectedNeu?.id || ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            A continuación se muestra el historial de movimientos y mantenciones del neumático seleccionado.
          </p>
          <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6 pb-4">
             <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-1.5 top-1"></div>
                <p className="text-xs text-slate-500 font-bold mb-0.5">15 MAY 2026</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Inspección Rutinaria</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Profundidad registrada: {selectedNeu?.profActual} mm. Se detectó desgaste regular.</p>
             </div>
             <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-1.5 top-1"></div>
                <p className="text-xs text-slate-500 font-bold mb-0.5">01 ENE 2023</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Montaje en Vehículo</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Instalado en {selectedNeu?.vehiculo || 'vehículo'} posición {selectedNeu?.pos || 'N/A'}.</p>
             </div>
             <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-slate-300 dark:bg-slate-600 rounded-full -left-1.5 top-1"></div>
                <p className="text-xs text-slate-500 font-bold mb-0.5">10 DIC 2022</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ingreso a Bodega</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Compra inicial de lote. Costo: ${selectedNeu?.costo?.toLocaleString() || 0}.</p>
             </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
             <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const CONFIGURACIONES: Record<string, any> = {
  "1": {
    nombre: "Configuración 1 (4x2 - 4 Neum.)",
    label: "CONFIGURACIÓN 1",
    ejes: [
      { tipo: "simple", neumaticos: [1, 2] },
      { tipo: "simple", neumaticos: [3, 4] }
    ],
    tablaPosiciones: [1, 2, 3, 4]
  },
  "2": {
    nombre: "Configuración 2 (4x2 - 6 Neum.)",
    label: "CONFIGURACIÓN 2",
    ejes: [
      { tipo: "simple", neumaticos: [1, 2] },
      { tipo: "dual", neumaticos: [3, 4, 5, 6] }
    ],
    tablaPosiciones: [1, 2, 3, 4, 5, 6]
  },
  "3": {
    nombre: "Configuración 3 (6x2 - 8 Neum. E3 Simple)",
    label: "CONFIGURACIÓN 3",
    ejes: [
      { tipo: "simple", neumaticos: [1, 2] },
      { tipo: "dual", neumaticos: [3, 4, 5, 6] },
      { tipo: "simple", neumaticos: [7, 8] }
    ],
    tablaPosiciones: [1, 2, 3, 4, 5, 6, 7, 8]
  },
  "4": {
    nombre: "Configuración 4 (10 Neumáticos)",
    label: "CONFIGURACIÓN 4",
    ejes: [
      { tipo: "simple", neumaticos: [1, 2] },
      { tipo: "dual", neumaticos: [3, 4, 5, 6] },
      { tipo: "dual", neumaticos: [7, 8, 9, 10] }
    ],
    tablaPosiciones: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  "5": {
    nombre: "Configuración 5 (14 Neumáticos - 10x6)",
    label: "CONFIGURACIÓN 5",
    ejes: [
      { tipo: "simple", neumaticos: [1, 2] },
      { tipo: "simple", neumaticos: [3, 4] },
      { tipo: "simple", neumaticos: [5, 6] },
      { tipo: "dual", neumaticos: [7, 8, 9, 10] },
      { tipo: "dual", neumaticos: [11, 12, 13, 14] }
    ],
    tablaPosiciones: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
  },
  "6": {
    nombre: "Configuración 6 (16 Neumáticos)",
    label: "CONFIGURACIÓN 6",
    ejes: [
      { tipo: "simple", neumaticos: [1, 2] },
      { tipo: "simple", neumaticos: [3, 4] },
      { tipo: "dual", neumaticos: [5, 6, 7, 8] },
      { tipo: "dual", neumaticos: [9, 10, 11, 12] },
      { tipo: "dual", neumaticos: [13, 14, 15, 16] }
    ],
    tablaPosiciones: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  },
  "7": {
    nombre: "Semi-remolque 2 Ejes (8 Neumáticos)",
    label: "SEMI-REMOLQUE 2 EJES",
    isTrailer: true,
    ejes: [
      { tipo: "dual", neumaticos: [1, 2, 3, 4] },
      { tipo: "dual", neumaticos: [5, 6, 7, 8] }
    ],
    tablaPosiciones: [1, 2, 3, 4, 5, 6, 7, 8]
  },
  "8": {
    nombre: "Semi-remolque 3 Ejes (12 Neumáticos)",
    label: "SEMI-REMOLQUE 3 EJES",
    isTrailer: true,
    ejes: [
      { tipo: "dual", neumaticos: [1, 2, 3, 4] },
      { tipo: "dual", neumaticos: [5, 6, 7, 8] },
      { tipo: "dual", neumaticos: [9, 10, 11, 12] }
    ],
    tablaPosiciones: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  },
  "9": {
    nombre: "Semi-remolque 4 Ejes (16 Neumáticos)",
    label: "SEMI-REMOLQUE 4 EJES",
    isTrailer: true,
    ejes: [
      { tipo: "dual", neumaticos: [1, 2, 3, 4] },
      { tipo: "dual", neumaticos: [5, 6, 7, 8] },
      { tipo: "dual", neumaticos: [9, 10, 11, 12] },
      { tipo: "dual", neumaticos: [13, 14, 15, 16] }
    ],
    tablaPosiciones: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  }
};

function SvgNeumaticos({ configId }: { configId: string }) {
  const config = CONFIGURACIONES[configId];
  if (!config) return null;

  const svgHeight = 400;
  const totalEjes = config.ejes.length;

  const renderNeumatico = (x: number, y: number, id: number) => {
    const w = 30;
    const h = 50;
    return (
      <g key={id}>
        <rect x={x} y={y} width={w} height={h} rx={6} fill="#000000" />
        {/* Bandas de rodadura realistas */}
        <line x1={x+6} y1={y} x2={x+6} y2={y+h} stroke="#1e293b" strokeWidth={1.2} strokeDasharray="3,3" />
        <line x1={x+w-6} y1={y} x2={x+w-6} y2={y+h} stroke="#1e293b" strokeWidth={1.2} strokeDasharray="3,3" />
        {/* Identificación numérica destacada */}
        <text x={x + w/2} y={y + h/2 + 4} fill="#ffffff" fontSize={12} fontWeight={900} textAnchor="middle" fontFamily="sans-serif">{id}</text>
      </g>
    );
  };

  const elements = [];

  if (config.isTrailer) {
    elements.push(
      <g transform="translate(150, 40)" key="acople">
        <path d="M-15,10 L15,10 L0,-15 Z" fill="#475569" stroke="#1e293b" strokeWidth={2} />
        <circle cx={0} cy={5} r={4.5} fill="#f59e0b" />
      </g>
    );
    elements.push(
      <line x1={150} y1={40} x2={150} y2={340} stroke="#64748b" strokeWidth={4} strokeDasharray="5,5" key="chasis-line" />
    );
    elements.push(
      <rect x={135} y={65} width={30} height={20} rx={3} fill="#334155" key="chasis-rect" />
    );

    const startY = 340 - ((totalEjes - 1) * 55);
    const ejeSpacing = 55;

    config.ejes.forEach((eje: any, index: number) => {
      const y = startY + (index * ejeSpacing);
      const etiquetaEje = `EJE ${index + 1}`;

      elements.push(
        <g key={`eje-${index}`}>
          <line x1={60} y1={y} x2={240} y2={y} stroke="black" strokeWidth={6} strokeLinecap="round" />
          <text x={265} y={y + 3.5} fontSize={10} fontWeight={900} fill="#475569" fontFamily="sans-serif">{etiquetaEje}</text>
          
          {eje.tipo === "simple" && (
            <>
              {renderNeumatico(45, y - 25, eje.neumaticos[0])}
              {renderNeumatico(225, y - 25, eje.neumaticos[1])}
            </>
          )}
          {eje.tipo === "dual" && (
            <>
              {renderNeumatico(45, y - 25, eje.neumaticos[0])}
              {renderNeumatico(80, y - 25, eje.neumaticos[1])}
              {renderNeumatico(190, y - 25, eje.neumaticos[2])}
              {renderNeumatico(225, y - 25, eje.neumaticos[3])}
            </>
          )}
        </g>
      );
    });
  } else {
    const ejeSpacing = totalEjes > 1 ? (svgHeight - 60) / (totalEjes - 1) : 0;
    const startY = 30;

    config.ejes.forEach((eje: any, index: number) => {
      const y = startY + (index * ejeSpacing);
      const etiquetaEje = `EJE ${index + 1}`;

      elements.push(
        <g key={`eje-${index}`}>
          <line x1={60} y1={y} x2={240} y2={y} stroke="black" strokeWidth={6} strokeLinecap="round" />
          <text x={265} y={y + 3.5} fontSize={10} fontWeight={900} fill="#475569" fontFamily="sans-serif">{etiquetaEje}</text>
          
          {eje.tipo === "simple" && (
            <>
              {renderNeumatico(45, y - 25, eje.neumaticos[0])}
              {renderNeumatico(225, y - 25, eje.neumaticos[1])}
            </>
          )}
          {eje.tipo === "dual" && (
            <>
              <circle cx={150} cy={y} r={10} fill="#1e293b" />
              <circle cx={150} cy={y} r={4} fill="#f59e0b" />
              {renderNeumatico(45, y - 25, eje.neumaticos[0])}
              {renderNeumatico(80, y - 25, eje.neumaticos[1])}
              {renderNeumatico(190, y - 25, eje.neumaticos[2])}
              {renderNeumatico(225, y - 25, eje.neumaticos[3])}
            </>
          )}
        </g>
      );
    });
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" className="w-full h-full font-sans">
      <rect width="100%" height="100%" fill="none" />
      {elements}
    </svg>
  );
}

export function FormularioInspeccion({ 
  prefilledVehiculoId,
  prefilledCliente,
  onClose
}: {
  prefilledVehiculoId?: string;
  prefilledCliente?: string;
  onClose?: () => void;
} = {}) {
  const [configId, setConfigId] = useState("5");
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const { currentCompany } = useCompany();

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!currentCompany) return;
      const { data } = await supabase.from('vehiculo').select('id, patente, modelo').eq('empresa_id', currentCompany.id);
      if (data) setVehiculos(data);
    }
    fetchVehicles();
  }, [currentCompany]);

  const activeConfig = CONFIGURACIONES[configId];
  const allPositions = Array.from({length: 16}, (_, i) => i + 1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col p-6 w-full">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 pt-2 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-2 relative">
            <Truck className="w-6 h-6 text-amber-500" />
            Pauta de Inspección Técnica de Neumáticos
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5 ml-8">Control de flota y desgaste operativo</p>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[9px] uppercase text-slate-400 font-extrabold tracking-wider">Configuración Activa</label>
          <select 
            value={configId}
            onChange={(e) => setConfigId(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded px-3 py-2 text-xs focus:outline-none focus:border-amber-500 cursor-pointer font-bold w-full sm:w-[260px]"
          >
            {Object.entries(CONFIGURACIONES).map(([key, config]) => (
              <option key={key} value={key}>{config.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Datos Generales Formulario */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 text-xs border-b border-slate-100 dark:border-slate-800 pb-6 print-header-grid">
        <div className="border-b border-slate-200 dark:border-slate-700 py-1">
          <span className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Cliente / Operación:</span>
          <input type="text" placeholder="-" defaultValue={prefilledCliente || ""} className="w-full font-bold focus:outline-none border-0 p-0 text-slate-800 dark:text-slate-100 bg-transparent" />
        </div>
        <div className="border-b border-slate-200 dark:border-slate-700 py-1">
          <span className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Patente / ID Equipo:</span>
          <select defaultValue={prefilledVehiculoId || ""} className="w-full font-bold focus:outline-none border-0 p-0 text-slate-800 dark:text-slate-100 bg-transparent appearance-none">
            <option value="">Seleccione Equipo</option>
            {vehiculos.map(v => (
              <option key={v.id} value={v.id}>{v.patente} {v.modelo ? `- ${v.modelo}` : ''}</option>
            ))}
          </select>
        </div>
        <div className="border-b border-slate-200 dark:border-slate-700 py-1">
          <span className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Kilometraje Actual:</span>
          <input type="text" placeholder="Ej: 124,530" className="w-full font-bold focus:outline-none border-0 p-0 text-slate-800 dark:text-slate-100 bg-transparent" />
        </div>
        <div className="border-b border-slate-200 dark:border-slate-700 py-1">
          <span className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Fecha Inspección:</span>
          <input type="date" defaultValue={new Date().toISOString().substring(0, 10)} className="w-full font-bold focus:outline-none border-0 p-0 text-slate-800 dark:text-slate-100 bg-transparent" />
        </div>
        <div className="border-b border-slate-200 dark:border-slate-700 py-1">
          <span className="block text-[9px] text-slate-400 uppercase font-bold mb-1">Inspector / Supervisor:</span>
          <input type="text" placeholder="Nombre completo" className="w-full font-bold focus:outline-none border-0 p-0 text-slate-800 dark:text-slate-100 bg-transparent" />
        </div>
      </div>

      {/* Workspace Dos Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6">
        {/* Columna Izquierda: Esquema Vectorial */}
        <div className="lg:col-span-5 flex flex-col items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between w-full mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Esquema Vectorial</span>
            <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded tracking-wider uppercase">
              {activeConfig?.label}
            </span>
          </div>
          <div className="w-full max-w-[280px] aspect-[3/4] flex items-center justify-center">
            <SvgNeumaticos configId={configId} />
          </div>
        </div>

        {/* Columna Derecha: Glosario de Parámetros y Notas */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between h-full">
          {/* Glosario */}
          <div className="bg-amber-50/70 dark:bg-amber-900/10 border-l-4 border-amber-500 p-4 rounded-lg text-[11px] text-amber-900 dark:text-amber-200">
            <h4 className="font-extrabold uppercase mb-1.5 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Glosario de Medición y Control</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1.5 mt-2 font-semibold">
              <div><strong>Presión (PSI):</strong> Caliente / Frío</div>
              <div><strong>Prof. Remanente:</strong> Cocada en mm</div>
              <div><strong>Ext/Int:</strong> Cocada Exterior/Interior</div>
              <div><strong>Nº R:</strong> Número de Reencauches</div>
              <div><strong>Reens:</strong> Neumático Reencauchado</div>
              <div><strong>TV:</strong> Tapa Válvula (SÍ/NO)</div>
              <div className="col-span-2"><strong>Exten:</strong> Extensión de Válvula</div>
            </div>
          </div>

          {/* Notas de Campo */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/30 flex-grow">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5" /> Notas de Campo
            </h3>
            <textarea className="w-full h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" placeholder="Escriba aquí observaciones críticas encontradas durante la medición (ej: cortes en flancos, desalineación excesiva, neumáticos listos para reencauche)..."></textarea>
          </div>
        </div>
      </div>

      {/* Tabla de Inspección */}
      <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm mb-4">
        <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-900 text-white uppercase text-[9px] tracking-wider text-center">
            <tr>
              <th className="py-2 px-1 border-r border-slate-700 w-10">Pos</th>
              <th className="py-2 px-2 border-r border-slate-700 w-24">Código/DOT</th>
              <th className="py-2 px-2 border-r border-slate-700 w-24">Marca</th>
              <th className="py-2 px-2 border-r border-slate-700 w-24">Medida</th>
              <th className="py-2 px-2 border-r border-slate-700 w-24">Diseño</th>
              <th className="py-2 px-2 border-r border-slate-700 w-16">Presión</th>
              <th className="py-2 px-2 border-r border-slate-700 w-14">C/F</th>
              <th className="py-2 px-2 border-r border-slate-700 w-12">Ext-1</th>
              <th className="py-2 px-2 border-r border-slate-700 w-12">Ext-2</th>
              <th className="py-2 px-2 border-r border-slate-700 w-12">Int-1</th>
              <th className="py-2 px-2 border-r border-slate-700 w-12">Int-2</th>
              <th className="py-2 px-1 border-r border-slate-700 w-10">NR</th>
              <th className="py-2 px-1 border-r border-slate-700 w-14">Reens</th>
              <th className="py-2 px-1 border-r border-slate-700 w-12">TV</th>
              <th className="py-2 px-1 border-r border-slate-700 w-14">Exten</th>
              <th className="py-2 px-3 text-left">Observaciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {allPositions.map((pos) => {
              const isVisible = activeConfig?.tablaPosiciones.includes(pos);
              if (!isVisible) return null;

              return (
                <tr key={pos} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-1 px-1 text-center font-black bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100">{pos}</td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800"><input type="text" className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs uppercase font-mono bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none" placeholder="---" /></td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800"><input type="text" className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none" placeholder="---" /></td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800"><input type="text" className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none" placeholder="---" /></td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800"><input type="text" className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none" placeholder="---" /></td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800"><input type="number" className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs font-semibold bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none" placeholder="110" /></td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800">
                    <select className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs bg-transparent cursor-pointer font-bold outline-none">
                      <option value="F">F</option>
                      <option value="C">C</option>
                    </select>
                  </td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800"><input type="number" step="0.1" className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none" placeholder="0.0" /></td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800"><input type="number" step="0.1" className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none" placeholder="0.0" /></td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800"><input type="number" step="0.1" className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none" placeholder="0.0" /></td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800"><input type="number" step="0.1" className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none" placeholder="0.0" /></td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800"><input type="number" className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none" placeholder="0" /></td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800">
                    <select className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs bg-transparent font-bold cursor-pointer outline-none">
                      <option value="NO">NO</option>
                      <option value="SI">SÍ</option>
                    </select>
                  </td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800">
                    <select className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs bg-transparent font-bold cursor-pointer outline-none">
                      <option value="SI">SÍ</option>
                      <option value="NO">NO</option>
                    </select>
                  </td>
                  <td className="py-0.5 px-0.5 border-r border-slate-200 dark:border-slate-800">
                    <select className="w-full text-center focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs bg-transparent font-bold cursor-pointer outline-none">
                      <option value="SI">SÍ</option>
                      <option value="NO">NO</option>
                    </select>
                  </td>
                  <td className="py-0.5 px-2">
                    <input type="text" className="w-full focus:ring-1 focus:ring-amber-500 rounded p-1 text-xs bg-transparent outline-none" placeholder="..." />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Button Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" className="dark:border-slate-700 dark:text-slate-300" onClick={onClose}>Descartar</Button>
        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold border-none shadow-md">
          <Activity className="w-4 h-4 mr-2" /> Guardar Inspección
        </Button>
      </div>

    </div>
  );
}
