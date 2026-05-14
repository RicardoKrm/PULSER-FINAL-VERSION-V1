import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Search, Filter, Plus, FileSpreadsheet, AlertTriangle, 
  CheckCircle, Clock, Truck, ChevronRight, Activity, Wrench,
  MoreVertical, Edit3, History, TrendingUp, Archive, Trash2
} from 'lucide-react';

export default function PizarraMantenimiento() {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Mocks for dropdowns
  const modelos = ['Sprinter 315', 'Transit Custom', 'Rav4'];
  const tiposMantenimiento = ['Todos los tipos', 'Inicial', 'PM-1', 'PM-2', 'PM-3', 'PM-4'];

  const kpis = {
    vehiculosFiltrados: 24,
    porcentajeFlota: 100,
    nivelCumplimiento: 85.5,
    costoTotal: 12500000,
    costoKm: 14.5
  };

  const [dataFlota, setDataFlota] = useState([
    {
      id: 1,
      numeroInterno: 'V-101',
      patente: 'AB-CD-12',
      marca: 'Mercedes-Benz',
      modelo: 'Sprinter 315',
      kmActual: 125430,
      ultimoMant: {
        km: 115000,
        fecha: '2026-01-15',
        tipo: 'PM-2（Mantenimiento B）'
      },
      proxMant: {
        kmFaltante: 4570,
        fechaProg: '2026-04-20',
        tipo: 'PM-3（Mantenimiento C）'
      },
      estado: 'NORMAL',
    },
    {
      id: 2,
      numeroInterno: 'V-102',
      patente: 'WX-YZ-99',
      marca: 'Ford',
      modelo: 'Transit Custom',
      kmActual: 89000,
      ultimoMant: {
        km: 70000,
        fecha: '2025-11-10',
        tipo: 'PM-1'
      },
      proxMant: {
        kmFaltante: -1000,
        kmVencido: 1000,
        fechaProg: '2026-03-01',
        tipo: 'PM-2',
        vencidosStr: 'PM-2'
      },
      estado: 'VENCIDO',
    },
    {
      id: 3,
      numeroInterno: 'SUV-01',
      patente: 'KL-MN-34',
      marca: 'Toyota',
      modelo: 'Rav4',
      kmActual: 44500,
      ultimoMant: {
        km: 35000,
        fecha: '2025-12-05',
        tipo: 'Inicial'
      },
      proxMant: {
        kmFaltante: 500,
        fechaProg: '2026-03-18',
        tipo: 'PM-1'
      },
      estado: 'PROXIMO',
    }
  ]);

  const handleArchive = (id: number) => {
    setDataFlota(dataFlota.filter(v => v.id !== id));
    setActionMenuOpen(null);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'NORMAL':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm"><CheckCircle className="w-3 h-3 mr-1" /> NORMALIDAD</Badge>;
      case 'PROXIMO':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 shadow-sm"><Clock className="w-3 h-3 mr-1" /> MANT. PRÓX</Badge>;
      case 'VENCIDO':
        return <Badge className="bg-red-100 text-red-800 border-red-200 shadow-sm"><AlertTriangle className="w-3 h-3 mr-1" /> VENCIDO</Badge>;
      default:
        return <Badge variant="default">{estado}</Badge>;
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'NORMAL': return <div className="h-2 w-2 rounded-full bg-emerald-50 dark:bg-emerald-900/300 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />;
      case 'PROXIMO': return <div className="h-2 w-2 rounded-full bg-orange-50 dark:bg-orange-900/300 shadow-[0_0_8px_rgba(249,115,22,0.5)] animate-pulse" />;
      case 'VENCIDO': return <div className="h-2 w-2 rounded-full bg-red-50 dark:bg-red-900/300 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />;
      default: return null;
    }
  };

  const opcionesFecha: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fechaTexto = new Date().toLocaleDateString('es-ES', opcionesFecha);
  const fechaHoy = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Pizarra de Mantenimiento</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 border-blue-200 shadow-sm border dark:border-slate-800 font-medium px-2.5 py-0.5">
              <Clock className="w-3 h-3 mr-1.5" />
              {fechaHoy}
            </Badge>
            <p className="text-sm text-slate-500 dark:text-slate-400">Visión general del estado de la flota y próximos mantenimientos</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="bg-white dark:bg-slate-900">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
            Exportar XLSX
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Nueva OT
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vehículos Visualizados</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpis.vehiculosFiltrados}</h3>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">({kpis.porcentajeFlota}%)</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cumplimiento Normal</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{kpis.nivelCumplimiento}%</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Costo Total Mant.</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">${kpis.costoTotal.toLocaleString('es-CL')}</h3>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Costo Promedio / KM</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">${kpis.costoKm}</h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600">
              <Wrench className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Buscador */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por equipo, patente o modelo..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:bg-slate-900 transition-colors"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Button 
                variant={mostrarFiltros ? "default" : "outline"} 
                className={mostrarFiltros ? "bg-blue-600 hover:bg-blue-700 h-9" : "bg-white dark:bg-slate-900 h-9"}
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros Avanzados
              </Button>
            </div>
          </div>

          {mostrarFiltros && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Modelo</label>
                <select className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500">
                  <option value="">Todos los modelos</option>
                  {modelos.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tipo de Mantenimiento</label>
                <select className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500">
                  {tiposMantenimiento.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Próx. Mantenimiento Desde</label>
                <input type="date" className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Próx. Mantenimiento Hasta</label>
                <input type="date" className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Último Mantenimiento Desde</label>
                <input type="date" className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Último Mantenimiento Hasta</label>
                <input type="date" className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500" />
              </div>
              <div className="space-y-1 md:col-span-2 flex items-end">
                <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/30 border dark:border-slate-800 border-orange-200 rounded-lg w-full">
                  <input type="checkbox" id="proximos_alerta" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:text-slate-100" />
                  <label htmlFor="proximos_alerta" className="text-sm font-medium text-orange-800">
                    Mostrar solo vehículos con mantenimientos PRÓXIMOS o VENCIDOS
                  </label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla Maestro de Flota */}
      <Card className="shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-5 py-4 w-12 text-center">STS</th>
                <th className="px-5 py-4">Vehículo</th>
                <th className="px-5 py-4">KM Actual</th>
                <th className="px-5 py-4">Último Mantenimiento</th>
                <th className="px-5 py-4">Próximo Mantenimiento</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {dataFlota.map((vehiculo) => (
                <tr key={vehiculo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      {getStatusIcon(vehiculo.estado)}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{vehiculo.numeroInterno}</span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{vehiculo.patente}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 dark:text-slate-400">{vehiculo.marca} {vehiculo.modelo}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-mono text-slate-900 dark:text-slate-100 font-semibold bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded inline-block">
                      {vehiculo.kmActual.toLocaleString('es-CL')} km
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 dark:text-slate-400" />
                        {vehiculo.ultimoMant.km.toLocaleString('es-CL')} km
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {vehiculo.ultimoMant.fecha}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded w-fit uppercase">
                        {vehiculo.ultimoMant.tipo}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                        <Activity className="w-3.5 h-3.5" />
                        Faltan: {vehiculo.proxMant.kmFaltante.toLocaleString('es-CL')} km
                      </div>
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Proyectado: {vehiculo.proxMant.fechaProg}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-900/30 border dark:border-slate-800 border-b dark:border-slate-800lue-200 px-1.5 py-0.5 rounded w-fit uppercase">
                          {vehiculo.proxMant.tipo}
                        </span>
                        {vehiculo.proxMant.vencidosStr && (
                          <span className="text-[9px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 border dark:border-slate-800 border-red-200 px-1 rounded uppercase animate-pulse">
                            Venc: {vehiculo.proxMant.vencidosStr}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {getStatusBadge(vehiculo.estado)}
                  </td>
                  <td className="px-5 py-4 text-right relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-500"
                      onClick={() => setActionMenuOpen(actionMenuOpen === vehiculo.id ? null : vehiculo.id)}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                    {actionMenuOpen === vehiculo.id && (
                      <div 
                        ref={menuRef}
                        className="absolute right-8 top-10 w-56 bg-white dark:bg-slate-900 rounded-md shadow-lg border border-slate-200 dark:border-slate-800 z-50 overflow-hidden"
                      >
                        <div className="py-1">
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">
                            <Edit3 className="w-4 h-4 mr-2" /> Actualizar KM
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">
                            <History className="w-4 h-4 mr-2" /> Ver Historial
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" /> Costos y Tendencias
                          </button>
                          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center font-medium"
                            onClick={() => handleArchive(vehiculo.id)}
                          >
                            <Archive className="w-4 h-4 mr-2" /> Archivar Vehículo
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center">
                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar Definitivamente
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {dataFlota.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    No se encontraron vehículos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
