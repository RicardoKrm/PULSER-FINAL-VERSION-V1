import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, AlertTriangle, ChevronRight, Calculator } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { calcularDatosPizarra, HitoSecuencia, VehiculoDB, generarSecuenciaParaPauta, obtenerPautasSecuenciaParaVehiculo } from '../../lib/mantenimientoLogica';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function OperacionesAlertas() {
  const { currentCompany } = useCompany();
  const navigate = useNavigate();
  const [mantenimientosPendientes, setMantenimientosPendientes] = useState<any[]>([]);
  const [ordenesPendientes, setOrdenesPendientes] = useState<any[]>([]);
  const [repuestosCriticos, setRepuestosCriticos] = useState<any[]>([]);

  useEffect(() => {
    if (!currentCompany?.id) return;

    const fetchData = async () => {
      // 1. Fetch Vehiculos para mantenimientos pendientes
      const { data: vehiculosData } = await supabase.from('vehiculo').select('*').eq('empresa_id', currentCompany.id);
      const { data: pautasData } = await supabase.from('mantenimiento_pauta').select('*, modelo:mantenimiento_modelo_vehiculo(nombre)').eq('empresa_id', currentCompany.id);

      if (vehiculosData) {
        const alertasVehiculos: any[] = [];
        vehiculosData.forEach((v: any) => {
          const detalles = v.detalles || {};
          
          const kmsActuales = typeof v.kilometraje_actual === 'number' ? v.kilometraje_actual : parseFloat(String(v.kilometraje_actual).replace(/[^0-9.-]+/g, '')) || 0;
          
          const rawKmUlt = v.km_ultima_mantencion !== undefined ? v.km_ultima_mantencion : (detalles.km_ultima_mantencion !== undefined ? detalles.km_ultima_mantencion : 0);
          const kmUltMant = typeof rawKmUlt === 'number' ? rawKmUlt : parseFloat(String(rawKmUlt).replace(/[^0-9.-]+/g, '')) || 0;
          
          const rawInterval = v.intervalo_km !== undefined ? v.intervalo_km : (detalles.intervalo_km !== undefined ? detalles.intervalo_km : 10000);
          const kmInterv = typeof rawInterval === 'number' ? rawInterval : parseFloat(String(rawInterval).replace(/[^0-9.-]+/g, '')) || 10000;
          
          const vehOil = v.tipo_aceite || detalles.tipo_aceite || '';
          const pautasSecuencia: HitoSecuencia[] = pautasData
            ? obtenerPautasSecuenciaParaVehiculo(v.modelo || detalles.modelo, vehOil, kmsActuales, pautasData)
            : [];

          const vehDB: VehiculoDB = {
            id: v.id,
            numeroInterno: v.numero_interno?.toString() || '',
            patente: v.patente || '',
            kilometrajeActual: kmsActuales,
            fechaActualizacionKm: v.updated_at ? new Date(v.updated_at) : new Date(),
            intervaloMantencionKm: kmInterv,
            kmPromedioDia: v.km_promedio_dia || detalles.kmPromedioDia || 0,
            kmUltimaMantencion: kmUltMant,
            fechaUltimaMantencion: (v.fecha_ultima_mantencion || v.fecha_ult_mantencion || detalles.fecha_ultima_mantencion) ? new Date(v.fecha_ultima_mantencion || v.fecha_ult_mantencion || detalles.fecha_ultima_mantencion) : null,
            tipoUltimaPauta: v.tipo_ultimo_mant || v.tipo_ult_pauta || detalles.tipo_ultimo_mant || detalles.tipo_ult_pauta || '',
            pautasSecuencia,
            marca: v.marca || detalles.marca || '',
            modelo: v.modelo || detalles.modelo || '',
            ano: v.anio || v.ano || detalles.ano || detalles.anio || '',
            chasis: v.chasis || detalles.chasis || '',
            motor: v.motor || detalles.motor || '',
            norma: v.norma_euro || v.norma || detalles.norma_euro || detalles.norma || '',
            aplicacion: v.aplicacion || detalles.aplicacion || '',
            tipoAceite: v.tipo_aceite || v.tipoAceite || detalles.tipo_aceite || detalles.tipoAceite || '',
            fecha_matriculacion: v.fecha_matriculacion || detalles.fecha_matriculacion || '',
            detalles,
            intervaloMantenimiento: kmInterv,
            tipoIntervalo: v.tipo_intervalo || 'KM',
            factorConversionHoras: v.factor_conversion_horas || null
          };
          
          try {
            const calculo = calcularDatosPizarra(vehDB);
            if (calculo.estatus === 'VENCIDO') {
              alertasVehiculos.push({
                id: v.id,
                vehiculo: calculo.numeroInterno || calculo.ppu,
                ultimaMantencion: calculo.fechaUltimoMantencion,
                kmActual: calculo.kmActual.toLocaleString(),
                pauta: calculo.pautaVencida || calculo.tipoProximoMantencion || '--',
                kmPauta: calculo.kmProximoMantencion?.toLocaleString() || '--',
                kmFaltantes: '-' + String(calculo.kmVencido?.toLocaleString() || 0),
                estado: 'Vencido',
                numeroInterno: calculo.numeroInterno // store for sorting
              });
            }
          } catch(e) {
            console.error(e);
          }
        });
        
        alertasVehiculos.sort((a,b) => String(a.numeroInterno).localeCompare(String(b.numeroInterno), undefined, {numeric: true}));
        setMantenimientosPendientes(alertasVehiculos);
      }

      // 2. Fetch Ordenes Pendientes / Atrasadas
      const { data: otsData } = await supabase.from('orden_trabajo').select('*, vehiculo(numero_interno, patente)').eq('empresa_id', currentCompany.id);
      if (otsData) {
        const now = new Date();
        const pendientes = otsData.filter(ot => {
          // It started but not finished (EN PROCESO, ABIERTA, PAUSADA, PROGRAMADA)
          if (['FINALIZADA', 'CANCELADA', 'CERRADA_POR_MECANICO', 'CERRADA_MECANICO'].includes(ot.estado)) {
             return false;
          }
          
          let atrasada = false;
          
          // Check if it started and passed TFS time
          if (ot.inicio_proceso && ot.tfs_minutos) {
              const inicio = new Date(ot.inicio_proceso);
              const finEstimado = new Date(inicio.getTime() + (ot.tfs_minutos * 60000));
              if (now > finEstimado) atrasada = true;
          }
          // Check if passed scheduled time
          else if (ot.fecha_programada || ot.fechaProgramada) {
             const fp = new Date(ot.fecha_programada || ot.fechaProgramada);
             if (ot.hora_termino_programada || ot.horaTerminoProgramada) {
               const [h, m] = (ot.hora_termino_programada || ot.horaTerminoProgramada).split(':');
               fp.setHours(parseInt(h || '23'), parseInt(m || '59'));
             } else {
               fp.setHours(23, 59, 59);
             }
             if (now > fp) atrasada = true;
          } else {
             // Fallback: If no date programmed, but it's older than 24h
             const fechaCreacion = new Date(ot.created_at || new Date());
             const diff = now.getTime() - fechaCreacion.getTime();
             if (diff > 24 * 60 * 60 * 1000) atrasada = true; // more than 24h
          }
          
          return atrasada;
        });

        // Sort by priority and date
        setOrdenesPendientes(pendientes.map(ot => ({
          id: ot.id,
          folio: 'OT-' + String(ot.numero_ot || ot.id).padStart(4, '0'),
          vehiculo: ot.vehiculo?.numero_interno || ot.vehiculo?.patente || 'ST',
          tipo: ot.tipo_ot || ot.tipo || 'General',
          prioridad: String(ot.prioridad || 'ALTA').toUpperCase(), 
          estado: ot.estado,
          fecha: new Date(ot.created_at).toLocaleDateString()
        })));
      }

      // 3. Fetch Repuestos Críticos
      const { data: repsData } = await supabase.from('logistica_repuestos').select('*').eq('empresa_id', currentCompany.id);
      if (repsData) {
        const reps = repsData
          .map(r => ({
            id: r.id,
            repuesto: r.nombre,
            numeroParte: r.sku || r.referencia || '--',
            calidad: typeof r.calidad === 'string' ? r.calidad : 'Estándar',
            stockActual: Number(r.stock) || 0,
            stockMinimo: Number(r.min_stock) || 0
          }))
          .filter(r => r.stockActual <= r.stockMinimo);
        setRepuestosCriticos(reps);
      }
    };

    fetchData();
  }, [currentCompany?.id]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Vehículos con Mantenciones Pendientes */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Vehículos con Mantenciones Pendientes</h2>
          </div>
          <button onClick={() => navigate('/flota/mantenimiento')} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-md transition-colors">
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
              {mantenimientosPendientes.length > 0 ? (
                mantenimientosPendientes.map((item) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-medium">Sin alertas de mantenimiento</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Órdenes de Trabajo Pendientes */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Órdenes de Trabajo Atrasadas/Pendientes</h2>
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
              {ordenesPendientes.length > 0 ? (
                ordenesPendientes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{item.folio}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.vehiculo}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.tipo}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "font-semibold text-xs tracking-wider",
                        (item.prioridad === 'CRÍTICA' || item.prioridad === 'CRITICA') ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-500"
                      )}>
                        {item.prioridad}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "font-semibold text-xs tracking-wider",
                        item.estado === 'PENDIENTE' || item.estado === 'CREADA' ? "text-orange-600 dark:text-orange-400" : "text-slate-600 dark:text-slate-300"
                      )}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.fecha}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => navigate('/operaciones/ordenes')} className="inline-flex items-center justify-center px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Ver OT
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-medium">Sin órdenes críticas pendientes</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repuestos con Stock Crítico */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
             <AlertTriangle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
             <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Repuestos con Stock Crítico (&#60;= Mínimo)</h2>
          </div>
          <button onClick={() => navigate('/logistica/suministros')} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-md transition-colors">
            Ir a Inventario
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 font-medium">Repuesto</th>
                <th className="px-4 py-3 font-medium">Número Parte (SKU)</th>
                <th className="px-4 py-3 font-medium text-right">Stock Actual</th>
                <th className="px-4 py-3 font-medium text-right">Stock Mínimo</th>
                <th className="px-4 py-3 font-medium text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
              {repuestosCriticos.length > 0 ? (
                repuestosCriticos.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{item.repuesto}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.numeroParte}</td>
                    <td className="px-4 py-3 font-semibold text-right text-red-600 dark:text-red-400">{item.stockActual}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{item.stockMinimo}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{item.stockActual - item.stockMinimo}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-medium">Sin alertas de repuestos críticos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
