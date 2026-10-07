import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, AlertTriangle, FileText, Users, Wrench, Package, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function OperacionesAlertas() {
  const { currentCompany } = useCompany();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState({
    mantenimientos: [] as any[],
    docsVehiculos: [] as any[],
    docsPersonal: [] as any[],
    ots: [] as any[],
    repuestos: [] as any[]
  });

  useEffect(() => {
    if (!currentCompany?.id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const todayMs = new Date().getTime();
        const alertsObj = {
          mantenimientos: [] as any[],
          docsVehiculos: [] as any[],
          docsPersonal: [] as any[],
          ots: [] as any[],
          repuestos: [] as any[]
        };

        // 1. VEHICULOS (Mantenimiento + Documentos)
        const { data: vehiculosData } = await supabase.from('vehiculo').select('*').eq('empresa_id', currentCompany.id);

        if (vehiculosData) {
          vehiculosData.forEach((v: any) => {
            const detalles = v.detalles || {};
            
            // DOCS VEHICULOS
            if (detalles.vencimientoRev && new Date(detalles.vencimientoRev).getTime() < todayMs) {
              alertsObj.docsVehiculos.push({ id: v.id + 'rev', vehiculo: v.numero_interno || v.patente, documento: 'Revisión Técnica', fechaVencimiento: detalles.vencimientoRev, estado: 'Vencido' });
            }
            if (detalles.vencimientoSeguro && new Date(detalles.vencimientoSeguro).getTime() < todayMs) {
              alertsObj.docsVehiculos.push({ id: v.id + 'seg', vehiculo: v.numero_interno || v.patente, documento: 'Seguro Obligatorio', fechaVencimiento: detalles.vencimientoSeguro, estado: 'Vencido' });
            }
            if (detalles.vencimientoPermisoCirculacion && new Date(detalles.vencimientoPermisoCirculacion).getTime() < todayMs) {
              alertsObj.docsVehiculos.push({ id: v.id + 'per', vehiculo: v.numero_interno || v.patente, documento: 'Permiso Circulación', fechaVencimiento: detalles.vencimientoPermisoCirculacion, estado: 'Vencido' });
            }

            // MANTENIMIENTO (Sincronizado con lógica exacta de Dashboard.tsx)
            const kmsActuales = typeof v.kilometraje_actual === 'number' ? v.kilometraje_actual : parseFloat(String(v.kilometraje_actual).replace(/[^0-9.-]+/g, '')) || 0;
            const rawKmUlt = v.km_ultima_mantencion !== undefined ? v.km_ultima_mantencion : (detalles.km_ultima_mantencion !== undefined ? detalles.km_ultima_mantencion : 0);
            const kmUltMant = typeof rawKmUlt === 'number' ? rawKmUlt : parseFloat(String(rawKmUlt).replace(/[^0-9.-]+/g, '')) || 0;
            const rawInterval = v.intervalo_km !== undefined ? v.intervalo_km : (detalles.intervalo_km !== undefined ? detalles.intervalo_km : 10000);
            const kmInterv = typeof rawInterval === 'number' ? rawInterval : parseFloat(String(rawInterval).replace(/[^0-9.-]+/g, '')) || 10000;
            
            if (kmsActuales >= (kmUltMant + kmInterv)) {
               const kmFaltantes = kmsActuales - (kmUltMant + kmInterv);
               alertsObj.mantenimientos.push({
                 id: v.id,
                 vehiculo: v.numero_interno || v.patente,
                 ultimaMantencion: v.fecha_ultima_mantencion || detalles.fecha_ultima_mantencion || '--',
                 kmActual: kmsActuales.toLocaleString(),
                 pauta: 'Mantenimiento General',
                 kmFaltantes: '-' + kmFaltantes.toLocaleString(),
                 estado: 'Vencido'
               });
            }
          });
        }

        // 2. PERSONAL OPERATIVO (Documentos)
        const { data: personalData } = await supabase.from('colaborador').select('*').eq('empresa_id', currentCompany.id);
        if (personalData) {
          personalData.forEach((d: any) => {
             const detalles = d.detalles || {};
             if (detalles.vencimientoLicencia && new Date(detalles.vencimientoLicencia).getTime() < todayMs) {
               alertsObj.docsPersonal.push({ id: d.id + 'lic', nombre: d.nombre, rol: d.rol || 'Personal', asunto: 'Licencia de Conducir', detalle: `Venció el ${detalles.vencimientoLicencia}` });
             }
             if (detalles.vencimientoExamenes && new Date(detalles.vencimientoExamenes).getTime() < todayMs) {
               alertsObj.docsPersonal.push({ id: d.id + 'exa', nombre: d.nombre, rol: d.rol || 'Personal', asunto: 'Exámenes Ocupacionales', detalle: `Venció el ${detalles.vencimientoExamenes}` });
             }
             if (detalles.estadoExamen === 'NO APTO') {
               alertsObj.docsPersonal.push({ id: d.id + 'apto', nombre: d.nombre, rol: d.rol || 'Personal', asunto: 'Estado de Salud', detalle: 'Declarado NO APTO' });
             }
             if (detalles.licenciasMedicas && detalles.licenciasMedicas.length > 0) {
               const hasActive = detalles.licenciasMedicas.some((lm:any) => {
                 const h = new Date(); h.setHours(0,0,0,0);
                 const de = new Date(lm.desde); de.setHours(0,0,0,0);
                 const t = new Date(lm.hasta); t.setHours(23,59,59,999);
                 return h >= de && h <= t;
               });
               if (hasActive) {
                 alertsObj.docsPersonal.push({ id: d.id + 'med', nombre: d.nombre, rol: d.rol || 'Personal', asunto: 'Licencia Médica Activa', detalle: 'Personal de baja temporal' });
               }
             }
          });
        }

        // 3. ORDENES PENDIENTES
        const { data: otsData } = await supabase.from('orden_de_trabajo').select('*, vehiculo(numero_interno, patente)').eq('empresa_id', currentCompany.id);
        if (otsData) {
          const now = new Date();
          const pends = otsData.filter(ot => {
            if (['FINALIZADA', 'CANCELADA', 'CERRADA_POR_MECANICO', 'CERRADA_MECANICO'].includes(ot.estado)) return false;
            let atrasada = false;
            if (ot.fecha_programada && ot.hora_termino_programada) {
              const dtProg = new Date(`${ot.fecha_programada}T${ot.hora_termino_programada}`);
              if (now > dtProg) atrasada = true;
            } else if (ot.fecha_creacion) {
              const dtCreacion = new Date(ot.fecha_creacion);
              const daysDiff = (now.getTime() - dtCreacion.getTime()) / (1000 * 3600 * 24);
              if (daysDiff > 3) atrasada = true;
            }
            return atrasada;
          }).map(ot => ({
            id: ot.id,
            folio: ot.folio,
            vehiculo: ot.vehiculo?.numero_interno || ot.vehiculo?.patente || 'N/A',
            tipo: ot.tipo,
            estado: ot.estado,
            fecha: new Date(ot.fecha_programada || ot.fecha_creacion).toLocaleDateString(),
            diasAtraso: Math.floor((now.getTime() - new Date(ot.fecha_programada || ot.fecha_creacion).getTime()) / (1000 * 3600 * 24))
          }));
          alertsObj.ots = pends.sort((a,b) => b.diasAtraso - a.diasAtraso);
        }

        // 4. REPUESTOS CRITICOS
        const { data: repData } = await supabase.from('logistica_repuestos').select('*').eq('empresa_id', currentCompany.id);
        if (repData) {
          alertsObj.repuestos = repData.filter((r:any) => {
            const min = r.stock_minimo || 0;
            const actual = r.stock_actual || 0;
            return min > 0 && actual <= min;
          }).map((r:any) => ({
            id: r.id,
            repuesto: r.nombre,
            numeroParte: r.codigo || r.numero_parte || '--',
            stockActual: r.stock_actual || 0,
            stockMinimo: r.stock_minimo || 0
          }));
        }

        setAlertas(alertsObj);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    fetchData();
  }, [currentCompany]);

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse font-medium">Escaneando base de datos en busca de alertas críticas...</div>;

  const AlertSection = ({ title, icon: Icon, count, emptyMessage, children, colorClass }: any) => {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm mb-6 transition-all hover:shadow-md">
        <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", colorClass.bg)}>
              <Icon className={cn("h-5 w-5", colorClass.text)} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          </div>
          <span className={cn("px-3 py-1 rounded-full text-sm font-bold", count > 0 ? `${colorClass.badgeBg} ${colorClass.text}` : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400")}>
            {count} {count === 1 ? 'Alerta' : 'Alertas'}
          </span>
        </div>
        <div className="overflow-x-auto">
          {count > 0 ? children : (
            <div className="p-8 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 opacity-50" />
              <p className="font-medium text-center">{emptyMessage}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const totalAlerts = alertas.mantenimientos.length + alertas.docsVehiculos.length + alertas.docsPersonal.length + alertas.ots.length + alertas.repuestos.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-rose-500" />
            Centro de Alertas Críticas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitoreo en tiempo real de cumplimientos, vencimientos y cuellos de botella.
          </p>
        </div>
        {totalAlerts === 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800/30">
            <CheckCircle2 className="w-5 h-5" />
            ¡Todo en orden normal!
          </div>
        )}
      </div>

      <div className="mt-8">
        <AlertSection 
          title="Documentos de Personal Operativo Vencidos" 
          icon={Users} 
          count={alertas.docsPersonal.length}
          emptyMessage="Todo tu personal está al día con sus licencias y exámenes."
          colorClass={{ bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', badgeBg: 'bg-orange-100 dark:bg-orange-900/50' }}
        >
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 uppercase rounded-lg">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-l-lg">Colaborador</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Asunto</th>
                <th className="px-4 py-3 font-semibold rounded-r-lg">Detalle Crítico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {alertas.docsPersonal.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-200">{item.nombre}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{item.rol}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-300">{item.asunto}</td>
                  <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {item.detalle}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AlertSection>

        <AlertSection 
          title="Mantenimientos Preventivos Vencidos" 
          icon={Wrench} 
          count={alertas.mantenimientos.length}
          emptyMessage="No hay vehículos con mantenimiento preventivo vencido."
          colorClass={{ bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', badgeBg: 'bg-rose-100 dark:bg-rose-900/50' }}
        >
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-l-lg">Vehículo</th>
                <th className="px-4 py-3 font-semibold">Pauta Vencida</th>
                <th className="px-4 py-3 font-semibold">Km Faltantes</th>
                <th className="px-4 py-3 font-semibold rounded-r-lg">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {alertas.mantenimientos.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-bold">{item.vehiculo}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.pauta}</td>
                  <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-bold">{item.kmFaltantes} km</td>
                  <td className="px-4 py-3">
                     <button onClick={() => navigate('/flota/mantenimiento')} className="text-indigo-600 font-medium hover:underline">Agendar OT</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AlertSection>

        <AlertSection 
          title="Documentos de Vehículos Vencidos" 
          icon={FileText} 
          count={alertas.docsVehiculos.length}
          emptyMessage="Toda la flota tiene sus permisos y seguros al día."
          colorClass={{ bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', badgeBg: 'bg-amber-100 dark:bg-amber-900/50' }}
        >
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-l-lg">Vehículo</th>
                <th className="px-4 py-3 font-semibold">Documento</th>
                <th className="px-4 py-3 font-semibold">Fecha Vencimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {alertas.docsVehiculos.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-bold">{item.vehiculo}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.documento}</td>
                  <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-bold">{item.fechaVencimiento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AlertSection>

        <AlertSection 
          title="Órdenes de Trabajo Atrasadas" 
          icon={Clock} 
          count={alertas.ots.length}
          emptyMessage="No tienes órdenes de trabajo atrasadas en este momento."
          colorClass={{ bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', badgeBg: 'bg-purple-100 dark:bg-purple-900/50' }}
        >
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-l-lg">Folio OT</th>
                <th className="px-4 py-3 font-semibold">Vehículo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Días Atraso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {alertas.ots.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-bold text-indigo-600"><button onClick={() => navigate('/flota/mantenimiento')}>{item.folio}</button></td>
                  <td className="px-4 py-3 font-medium">{item.vehiculo}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.estado}</td>
                  <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-bold">{item.diasAtraso > 0 ? `${item.diasAtraso} días` : 'Hoy'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AlertSection>

        <AlertSection 
          title="Inventario Crítico (Quiebre de Stock)" 
          icon={Package} 
          count={alertas.repuestos.length}
          emptyMessage="Tu bodega tiene niveles de stock saludables."
          colorClass={{ bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', badgeBg: 'bg-red-100 dark:bg-red-900/50' }}
        >
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-l-lg">Repuesto</th>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold text-right">Stock Actual</th>
                <th className="px-4 py-3 font-semibold text-right rounded-r-lg">Stock Mínimo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {alertas.repuestos.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-bold">{item.repuesto}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.numeroParte}</td>
                  <td className="px-4 py-3 font-bold text-right text-red-600 dark:text-red-400">{item.stockActual}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{item.stockMinimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AlertSection>

      </div>
    </div>
  );
}
