import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Search, Filter, Plus, FileSpreadsheet, AlertTriangle, 
  CheckCircle, Clock, Truck, ChevronRight, Activity, Wrench,
  MoreVertical, Edit3, History, TrendingUp, Archive, Trash2,
  Table as TableIcon, List
} from 'lucide-react';
import { CrearOTModal } from '../../components/flota/CrearOTModal';
import { CrearVehiculoModal } from '../../components/flota/CrearVehiculoModal';
import { Modal } from '../../components/ui/Modal';

export default function PizarraMantenimiento() {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(true);
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);
  const [modalOTOpen, setModalOTOpen] = useState(false);
  const [vehiculoSeleccionadoOT, setVehiculoSeleccionadoOT] = useState<string | undefined>();
  const [selectedVehicleRow, setSelectedVehicleRow] = useState<number | null>(null);
  const [vistaTabla, setVistaTabla] = useState(false);
  
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

  const [filtroModelo, setFiltroModelo] = useState('');
  const [filtroTipoMant, setFiltroTipoMant] = useState('');
  const [soloProximosOVencidos, setSoloProximosOVencidos] = useState(false);
  const [modalVehiculoOpen, setModalVehiculoOpen] = useState(false);

  const [filtroProxMantDesde, setFiltroProxMantDesde] = useState('');
  const [filtroProxMantHasta, setFiltroProxMantHasta] = useState('');
  const [filtroUltMantDesde, setFiltroUltMantDesde] = useState('');
  const [filtroUltMantHasta, setFiltroUltMantHasta] = useState('');

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
        kmTarget: 130000,
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
        kmTarget: 88000,
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
        kmTarget: 45000,
        fechaProg: '2026-03-18',
        tipo: 'PM-1'
      },
      estado: 'PROXIMO',
    }
  ]);

  const [kpiModal, setKpiModal] = useState<string | null>(null);

  const vehiculosFiltrados = dataFlota.filter(v => {
    if (busqueda && !v.patente.toLowerCase().includes(busqueda.toLowerCase()) && !v.numeroInterno.toLowerCase().includes(busqueda.toLowerCase()) && !v.modelo.toLowerCase().includes(busqueda.toLowerCase())) {
      return false;
    }
    if (filtroModelo && v.modelo !== filtroModelo) return false;
    if (filtroTipoMant && filtroTipoMant !== 'Todos los tipos' && !v.proxMant.tipo.includes(filtroTipoMant)) return false;
    if (soloProximosOVencidos && v.estado === 'NORMAL') return false;
    
    if (filtroProxMantDesde && v.proxMant.fechaProg < filtroProxMantDesde) return false;
    if (filtroProxMantHasta && v.proxMant.fechaProg > filtroProxMantHasta) return false;
    
    if (filtroUltMantDesde && v.ultimoMant.fecha < filtroUltMantDesde) return false;
    if (filtroUltMantHasta && v.ultimoMant.fecha > filtroUltMantHasta) return false;

    return true;
  });

  const kpis = {
    vehiculosFiltrados: vehiculosFiltrados.length,
    porcentajeFlota: Math.round((vehiculosFiltrados.length / (dataFlota.length || 1)) * 100),
    nivelCumplimiento: 85.5,
    costoTotal: 12500000,
    costoKm: 14.5
  };

  const handleArchive = (id: number) => {
    setDataFlota(dataFlota.filter(v => v.id !== id));
    setActionMenuOpen(null);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'NORMAL':
        return <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-sm uppercase"><CheckCircle className="w-3 h-3 mr-1" /> NORMALIDAD</div>;
      case 'PROXIMO':
        return <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500 text-white shadow-sm uppercase"><Clock className="w-3 h-3 mr-1" /> MANT. PRÓX</div>;
      case 'VENCIDO':
        return <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-sm uppercase"><AlertTriangle className="w-3 h-3 mr-1" /> VENCIDO</div>;
      default:
        return <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500 text-white shadow-sm uppercase">{estado}</div>;
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'NORMAL': return <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />;
      case 'PROXIMO': return <div className="h-3 w-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" />;
      case 'VENCIDO': return <div className="h-3 w-3 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse" />;
      default: return null;
    }
  };

  const opcionesFecha: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fechaTexto = new Date().toLocaleDateString('es-ES', opcionesFecha);
  const fechaHoy = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);

  const renderTablaDensa = () => (
    <Card className="shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] text-center border-collapse">
          <thead className="bg-[#f8f9fa] dark:bg-slate-900 border-b border-b-slate-200 dark:border-b-slate-700 text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap">
            <tr>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">N° Int. ▲</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">PPU</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">KM Últ. Mant.</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">F. Últ. Mant.</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Tipo Mant.</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Cumplimiento</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Estatus</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Km Vencido</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Pauta Vencida</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">KM Actual</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Fecha KM Actual</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">KM Próx. Mant.</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Tipo Próx. Mant.</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Semáf.</th>
              <th className="px-2 py-3 border-r border-slate-200 dark:border-slate-800">Fecha Próx. Mant.</th>
              <th className="px-2 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-300 bg-white dark:bg-slate-900">
            {vehiculosFiltrados.map((vehiculo) => {
              const fKmActual = vehiculo.ultimoMant.fecha; 
              let cumplimientoText = 'Normal';
              let cumplimientoColor = 'text-slate-700 dark:text-slate-300';
              if (vehiculo.estado === 'VENCIDO') { cumplimientoText = 'Retrasado'; cumplimientoColor = 'text-red-600 font-bold'; }
              if (vehiculo.estado === 'PROXIMO') { cumplimientoText = 'Anticipado'; cumplimientoColor = 'text-emerald-600 font-bold'; }
              if (vehiculo.estado === 'NORMAL') { cumplimientoText = 'Normal'; cumplimientoColor = 'text-slate-700 dark:text-slate-300 font-bold'; }

              return (
                <tr key={`dense-${vehiculo.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 font-bold text-blue-900 dark:text-blue-100 whitespace-nowrap">{vehiculo.numeroInterno}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{vehiculo.patente}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800">{vehiculo.ultimoMant.km.toLocaleString('es-CL')}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{vehiculo.ultimoMant.fecha}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 font-medium whitespace-nowrap">{vehiculo.ultimoMant.tipo}</td>
                  <td className={`px-2 py-2 border-r border-slate-200 dark:border-slate-800 ${cumplimientoColor}`}>{cumplimientoText}</td>
                  <td className="px-1 py-1 border-r border-slate-200 dark:border-slate-800">
                    <div className="flex justify-center w-full transform scale-90">
                      {getStatusBadge(vehiculo.estado)}
                    </div>
                  </td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500">{vehiculo.proxMant.kmVencido ? vehiculo.proxMant.kmVencido.toLocaleString('es-CL') : '--'}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{vehiculo.proxMant.vencidosStr || '--'}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800">{vehiculo.kmActual.toLocaleString('es-CL')}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{fKmActual}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800">{vehiculo.proxMant.kmTarget.toLocaleString('es-CL')}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 font-medium whitespace-nowrap">{vehiculo.proxMant.tipo}</td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800">
                    <div className="flex justify-center">
                      {getStatusIcon(vehiculo.estado)}
                    </div>
                  </td>
                  <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-slate-500 whitespace-nowrap">{vehiculo.proxMant.fechaProg}</td>
                  <td className="px-2 py-2 relative text-right">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setActionMenuOpen(actionMenuOpen === vehiculo.id ? null : vehiculo.id)}>
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                    {actionMenuOpen === vehiculo.id && (
                      <div 
                        ref={menuRef}
                        className="absolute right-8 top-10 w-56 bg-white dark:bg-slate-900 rounded-md shadow-lg border border-slate-200 dark:border-slate-800 z-[100] overflow-hidden text-left"
                      >
                        <div className="py-1">
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center font-bold"
                            onClick={() => {
                              setVehiculoSeleccionadoOT(vehiculo.id.toString());
                              setModalOTOpen(true);
                              setActionMenuOpen(null);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" /> Crear OT
                          </button>
                          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
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
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {vehiculosFiltrados.length === 0 && (
              <tr>
                <td colSpan={16} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                  No se encontraron vehículos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );

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
          <Button 
            variant="outline" 
            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            onClick={() => setVistaTabla(!vistaTabla)}
          >
            {vistaTabla ? (
              <><List className="w-4 h-4 mr-2" /> Vista Tarjetas</>
            ) : (
              <><TableIcon className="w-4 h-4 mr-2" /> Vista Tabla</>
            )}
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={() => {
              setModalVehiculoOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Vehículo
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

        <Card 
          className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          onClick={() => setKpiModal('cumplimiento')}
        >
          <CardContent className="p-4 flex items-center justify-between relative">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cumplimiento del Cronograma</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{kpis.nivelCumplimiento}%</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          onClick={() => setKpiModal('costo_total')}
        >
          <CardContent className="p-4 flex items-center justify-between relative">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Costo Total Mant. <span className="text-[10px]">(PREV. + CORR)</span></p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">${kpis.costoTotal.toLocaleString('es-CL')}</h3>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          onClick={() => setKpiModal('costo_promedio')}
        >
          <CardContent className="p-4 flex items-center justify-between relative">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Costo Promedio / KM</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">${kpis.costoKm}</h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 group-hover:scale-110 transition-transform">
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
                <select 
                  className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500"
                  value={filtroModelo}
                  onChange={(e) => setFiltroModelo(e.target.value)}
                >
                  <option value="">Todos los modelos</option>
                  {modelos.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tipo de Mantenimiento</label>
                <select 
                  className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500"
                  value={filtroTipoMant}
                  onChange={(e) => setFiltroTipoMant(e.target.value)}
                >
                  {tiposMantenimiento.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Próx. Mantenimiento Desde</label>
                <input 
                  type="date" 
                  className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500" 
                  value={filtroProxMantDesde}
                  onChange={(e) => setFiltroProxMantDesde(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Próx. Mantenimiento Hasta</label>
                <input 
                  type="date" 
                  className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500" 
                  value={filtroProxMantHasta}
                  onChange={(e) => setFiltroProxMantHasta(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Último Mantenimiento Desde</label>
                <input 
                  type="date" 
                  className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500" 
                  value={filtroUltMantDesde}
                  onChange={(e) => setFiltroUltMantDesde(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Último Mantenimiento Hasta</label>
                <input 
                  type="date" 
                  className="w-full bg-white dark:bg-slate-700 dark:text-slate-100 dark:border-slate-700 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-b dark:border-slate-800lue-500" 
                  value={filtroUltMantHasta}
                  onChange={(e) => setFiltroUltMantHasta(e.target.value)}
                />
              </div>
              <div className="space-y-1 md:col-span-2 flex items-end">
                <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/30 border dark:border-slate-800 border-orange-200 rounded-lg w-full">
                  <input 
                    type="checkbox" 
                    id="proximos_alerta" 
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:text-slate-100" 
                    checked={soloProximosOVencidos}
                    onChange={(e) => setSoloProximosOVencidos(e.target.checked)}
                  />
                  <label htmlFor="proximos_alerta" className="text-sm font-medium text-orange-800 cursor-pointer w-full h-full block">
                    Mostrar solo vehículos con mantenimientos PRÓXIMOS o VENCIDOS
                  </label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla Maestro de Flota */}
      {vistaTabla ? (
        renderTablaDensa()
      ) : (
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                <tr>
                <th className="px-5 py-4 w-12 text-center"></th>
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
              {vehiculosFiltrados.map((vehiculo) => (
                <tr key={vehiculo.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${selectedVehicleRow === vehiculo.id ? 'bg-blue-50/50 dark:bg-slate-800/50' : 'dark:bg-slate-900/50'}`}>
                  <td className="px-5 py-4 text-center">
                    <input 
                      type="radio" 
                      name="selectedVehicle"
                      className="w-4 h-4 text-blue-600 rounded-full focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                      checked={selectedVehicleRow === vehiculo.id}
                      onChange={() => setSelectedVehicleRow(vehiculo.id)}
                    />
                  </td>
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
                        Próx. Mant.: {vehiculo.proxMant.kmTarget.toLocaleString('es-CL')} km
                      </div>
                      <div className="text-xs font-medium text-slate-500">
                        (Faltan: {vehiculo.proxMant.kmFaltante.toLocaleString('es-CL')} km)
                      </div>
                      <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Fecha Próx.: {vehiculo.proxMant.fechaProg}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-900/30 border dark:border-slate-800 border-b dark:border-slate-800lue-200 px-1.5 py-0.5 rounded w-fit uppercase">
                          Tipo: {vehiculo.proxMant.tipo}
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
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center font-bold"
                            onClick={() => {
                              setVehiculoSeleccionadoOT(vehiculo.id.toString());
                              setModalOTOpen(true);
                              setActionMenuOpen(null);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" /> Crear OT
                          </button>
                          <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
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
              {vehiculosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                    No se encontraron vehículos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </Card>
      )}
      {modalOTOpen && (
        <CrearOTModal 
          isOpen={modalOTOpen} 
          onClose={() => setModalOTOpen(false)} 
          vehiculoPreseleccionadoId={vehiculoSeleccionadoOT}
        />
      )}
      {modalVehiculoOpen && (
        <CrearVehiculoModal 
          isOpen={modalVehiculoOpen} 
          onClose={() => setModalVehiculoOpen(false)} 
        />
      )}
      <Modal isOpen={kpiModal === 'cumplimiento'} onClose={() => setKpiModal(null)} title="Detalle KPI: Cumplimiento del Cronograma">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Este KPI mide la proporción de vehículos que se encuentran al día con sus pautas de mantenimiento respecto al total de la flota activa.</p>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Vehículos al día (NORMAL)</span>
              <span className="font-bold text-emerald-600">{dataFlota.filter(v => v.estado === 'NORMAL').length}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Vehículos con mantenimiento próximo o vencido</span>
              <span className="font-bold text-red-600">{dataFlota.filter(v => v.estado !== 'NORMAL').length}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 flex justify-between items-center">
              <span className="font-bold">Total Flota Visualizada</span>
              <span className="font-bold">{vehiculosFiltrados.length}</span>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={kpiModal === 'costo_total'} onClose={() => setKpiModal(null)} title="Detalle KPI: Costo Total Mantenimiento">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Desglose acumulado de los gastos en órdenes de trabajo que han sido completadas.</p>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Mantenimiento Preventivo</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">$8.500.000</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Mantenimiento Correctivo</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">$4.000.000</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 flex justify-between items-center">
              <span className="font-bold">Total Acumulado</span>
              <span className="font-bold text-orange-600">$12.500.000</span>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={kpiModal === 'costo_promedio'} onClose={() => setKpiModal(null)} title="Detalle KPI: Costo Promedio por KM">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Este valor se calcula al dividir el costo total de los mantenimientos sobre los kilómetros totaes acumulados, indicando qué tan caro es mantener la flota por kilómetro recorrido.</p>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Costo Total Mant.</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">$12.500.000</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">KM Acumulados</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">862.068 km</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 flex justify-between items-center">
              <span className="font-bold">Costo Promedio</span>
              <span className="font-bold text-purple-600">$14.5 / km</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
