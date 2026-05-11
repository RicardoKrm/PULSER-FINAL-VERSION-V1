import React from 'react';
import { Clock, AlertCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

// Mock Data
const mantenimientosPendientes = [
  {
    id: 1,
    vehiculo: 'V-001 - AB-CD-12',
    ultimaMantencion: '100.000',
    kmActual: '112.000',
    pauta: 'Mantenimiento Preventivo 10k',
    kmPauta: '10.000',
    kmFaltantes: '2.000',
    estado: 'Vencido',
  },
  {
    id: 2,
    vehiculo: 'V-005 - YX-ZW-99',
    ultimaMantencion: '45.000',
    kmActual: '54.500',
    pauta: 'Cambio de Aceite',
    kmPauta: '10.000',
    kmFaltantes: '500',
    estado: 'Próximo',
  },
];

const ordenesPendientes = [
  {
    id: 1,
    folio: 'OT-2024-001',
    vehiculo: 'AB-CD-12',
    tipo: 'Mecánica General',
    prioridad: 'CRÍTICA',
    estado: 'PENDIENTE',
    fecha: '2024-05-10',
  },
  {
    id: 2,
    folio: 'OT-2024-004',
    vehiculo: 'YX-ZW-99',
    tipo: 'Revisión Eléctrica',
    prioridad: 'ALTA',
    estado: 'EN PROCESO',
    fecha: '2024-05-11',
  },
];

const repuestosCriticos = [
  {
    id: 1,
    repuesto: 'Filtro de Aceite',
    numeroParte: 'FLT-001',
    calidad: 'Original',
    stockActual: 2,
    stockMinimo: 10,
  },
  {
    id: 2,
    repuesto: 'Pastillas de freno',
    numeroParte: 'BRK-456',
    calidad: 'Alternativo OEM',
    stockActual: 0,
    stockMinimo: 4,
  },
];

export default function OperacionesAlertas() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Vehículos con Mantenciones Pendientes */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Vehículos con Mantenciones Pendientes</h2>
          </div>
          <button className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-md transition-colors">
            Ver reporte completo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 font-medium">Vehículo</th>
                <th className="px-4 py-3 font-medium text-right">Última Mantención</th>
                <th className="px-4 py-3 font-medium text-right">KM Actual</th>
                <th className="px-4 py-3 font-medium">Pauta</th>
                <th className="px-4 py-3 font-medium text-right">Km Pauta</th>
                <th className="px-4 py-3 font-medium text-right">Km Faltantes/Pasados</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
              {mantenimientosPendientes.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{item.vehiculo}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{item.ultimaMantencion}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{item.kmActual}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.pauta}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{item.kmPauta}</td>
                  <td className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400">{item.kmFaltantes}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
                      item.estado === 'Vencido' 
                        ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50" 
                        : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50"
                    )}>
                      <AlertCircle className="h-3 w-3" />
                      {item.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Órdenes de Trabajo Pendientes */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Órdenes de Trabajo Pendientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 font-medium">Folio</th>
                <th className="px-4 py-3 font-medium">Vehículo</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Prioridad</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
              {ordenesPendientes.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{item.folio}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.vehiculo}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.tipo}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "font-semibold text-xs tracking-wider",
                      item.prioridad === 'CRÍTICA' ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-500"
                    )}>
                      {item.prioridad}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "font-semibold text-xs tracking-wider",
                      item.estado === 'PENDIENTE' ? "text-orange-600 dark:text-orange-400" : "text-slate-600 dark:text-slate-300"
                    )}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.fecha}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="inline-flex items-center justify-center px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repuestos con Stock Crítico */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <AlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Repuestos con Stock Crítico</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 font-medium">Repuesto</th>
                <th className="px-4 py-3 font-medium">Número Parte</th>
                <th className="px-4 py-3 font-medium">Calidad</th>
                <th className="px-4 py-3 font-medium text-right">Stock Actual</th>
                <th className="px-4 py-3 font-medium text-right">Stock Mínimo</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
              {repuestosCriticos.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{item.repuesto}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.numeroParte}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.calidad}</td>
                  <td className="px-4 py-3 font-semibold text-right text-red-600 dark:text-red-400">{item.stockActual}</td>
                  <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{item.stockMinimo}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="inline-flex items-center justify-center px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
