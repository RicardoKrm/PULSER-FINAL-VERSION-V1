import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { 
  Search, Filter, Plus, FileSpreadsheet, AlertTriangle, 
  CheckCircle, Clock, Truck, ChevronRight, Activity, Wrench
} from 'lucide-react';

export default function PizarraMantenimiento() {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

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

  // Mock data basándose en las variables de readmevies
  const dataFlota = [
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
      estado: 'NORMAL', // NORMAL, PROXIMO, VENCIDO
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
  ];

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
      case 'NORMAL': return <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />;
      case 'PROXIMO': return <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] animate-pulse" />;
      case 'VENCIDO': return <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />;
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pizarra de Mantenimiento</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm border font-medium px-2.5 py-0.5">
              <Clock className="w-3 h-3 mr-1.5" />
              {fechaHoy}
            </Badge>
            <p className="text-sm text-gray-500">Visión general del estado de la flota y próximos mantenimientos</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="bg-white">
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
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehículos Visualizados</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold text-gray-900">{kpis.vehiculosFiltrados}</h3>
                <span className="text-sm font-medium text-gray-500">({kpis.porcentajeFlota}%)</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cumplimiento Normal</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{kpis.nivelCumplimiento}%</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Costo Total Mant.</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">${kpis.costoTotal.toLocaleString('es-CL')}</h3>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Costo Promedio / KM</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">${kpis.costoKm}</h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
              <Wrench className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Buscador */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por equipo, patente o modelo..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Button 
                variant={mostrarFiltros ? "default" : "outline"} 
                className={mostrarFiltros ? "bg-blue-600 hover:bg-blue-700 h-9" : "bg-white h-9"}
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros Avanzados
              </Button>
            </div>
          </div>

          {mostrarFiltros && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Modelo</label>
                <select className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Todos los modelos</option>
                  {modelos.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Tipo de Mantenimiento</label>
                <select className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  {tiposMantenimiento.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Próx. Mantenimiento Desde</label>
                <input type="date" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Próx. Mantenimiento Hasta</label>
                <input type="date" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Último Mantenimiento Desde</label>
                <input type="date" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Último Mantenimiento Hasta</label>
                <input type="date" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="space-y-1 md:col-span-2 flex items-end">
                <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg w-full">
                  <input type="checkbox" id="proximos_alerta" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
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
      <Card className="shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
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
            <tbody className="divide-y divide-gray-100 bg-white">
              {dataFlota.map((vehiculo) => (
                <tr key={vehiculo.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      {getStatusIcon(vehiculo.estado)}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{vehiculo.numeroInterno}</span>
                      <span className="text-xs font-medium text-gray-500">{vehiculo.patente}</span>
                      <span className="text-[10px] text-gray-400">{vehiculo.marca} {vehiculo.modelo}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-mono text-gray-900 font-semibold bg-gray-100 px-2 py-1 rounded inline-block">
                      {vehiculo.kmActual.toLocaleString('es-CL')} km
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
                        {vehiculo.ultimoMant.km.toLocaleString('es-CL')} km
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {vehiculo.ultimoMant.fecha}
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded w-fit uppercase">
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
                      <div className="text-xs font-medium text-gray-600">
                        Proyectado: {vehiculo.proxMant.fechaProg}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded w-fit uppercase">
                          {vehiculo.proxMant.tipo}
                        </span>
                        {vehiculo.proxMant.vencidosStr && (
                          <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1 rounded uppercase animate-pulse">
                            Venc: {vehiculo.proxMant.vencidosStr}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {getStatusBadge(vehiculo.estado)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button variant="ghost" size="icon" className="hover:bg-blue-50 hover:text-blue-600">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {dataFlota.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
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
