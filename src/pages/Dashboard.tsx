import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useCompany } from '../contexts/CompanyContext';
import { supabase } from '../lib/supabase';
import { calcularDatosPizarra, mapearVehiculoDB } from '../lib/mantenimientoLogica';
import { 
  Search, 
  CheckCircle2, 
  ClipboardCheck, 
  DollarSign, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  FileText,
  FileCheck,
  ShieldAlert,
  AlertCircle,
  Calendar,
  Gauge
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';


// Calculated dynamic data


const COLORS = ['#3b82f6', '#ef4444'];

export default function Dashboard() {
  const [dbCount, setDbCount] = React.useState<number | null>(null);
  React.useEffect(() => { supabase.from('orden_de_trabajo').select('id', { count: 'exact' }).then(res => setDbCount(res.count)); }, []);
  const navigate = useNavigate();
  const { user, ordenesTrabajo, vehiculos, personal, repuestos, recargarOrdenesTrabajo } = useAppContext() as any;
  const { currentCompany } = useCompany();
  const [dbVehiculos, setDbVehiculos] = useState<any[]>([]);
  const [dbColaboradores, setDbColaboradores] = useState<any[]>([]);
  const gavalCalibratedRef = React.useRef<boolean>(false);
  const [saludTab, setSaludTab] = useState<'mantenimiento' | 'documentos'>('documentos');
  const [dispTab, setDispTab] = useState<'actual' | 'calendario' | 'operacional'>('actual');

  const nowInit = new Date();
  const initDesde = `${nowInit.getFullYear()}-${String(nowInit.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDayInit = new Date(nowInit.getFullYear(), nowInit.getMonth() + 1, 0).getDate();
  const initHasta = `${nowInit.getFullYear()}-${String(nowInit.getMonth() + 1).padStart(2, '0')}-${String(lastDayInit).padStart(2, '0')}`;

  const [fechaDesde, setFechaDesde] = useState(initDesde);
  const [fechaHasta, setFechaHasta] = useState(initHasta);
  const [activeFechaDesde, setActiveFechaDesde] = useState(initDesde);
  const [activeFechaHasta, setActiveFechaHasta] = useState(initHasta);

  React.useEffect(() => {
    if (!currentCompany?.id) return;
    const fetchData = async () => {
      const [vehRes, colRes] = await Promise.all([
        supabase.from('vehiculo').select('*').eq('empresa_id', currentCompany.id),
        supabase.from('colaborador').select('*').eq('empresa_id', currentCompany.id)
      ]);

      if (vehRes.data) {
        const { data: pautasData } = await supabase.from('mantenimiento_pauta').select('*, modelo:mantenimiento_modelo_vehiculo(nombre)').eq('empresa_id', currentCompany.id);
        const mapped = vehRes.data.map(v => mapearVehiculoDB(v, pautasData || [], ordenesTrabajo || []));
        setDbVehiculos(mapped);
      }

      if (colRes.data) {
        setDbColaboradores(colRes.data);
      }

      // Auto-calibración exclusiva para el Demo Gaval si el mes en curso quedó sin preventivas o sin OTs activas tras el sembrado aleatorio
      const compName = (currentCompany?.name || (currentCompany as any)?.nombre || '').toLowerCase();
      if (compName.includes('gaval') && !gavalCalibratedRef.current && vehRes.data && vehRes.data.length > 0 && Array.isArray(ordenesTrabajo) && ordenesTrabajo.length > 0) {
        const now = new Date();
        const curMonth = now.getMonth();
        const curYear = now.getFullYear();
        const otsGaval = ordenesTrabajo.filter((ot: any) => ot.empresa_id === currentCompany.id);
        const prevMesActual = otsGaval.filter((ot: any) => {
          const d = new Date(ot.fechaCreacion || ot.fecha_creacion || '');
          return d.getMonth() === curMonth && d.getFullYear() === curYear && String(ot.tipo || '').includes('PREVENTIVA');
        });
        const activasGaval = otsGaval.filter((ot: any) => ['ABIERTA', 'EN_PROCESO', 'PAUSADA', 'PROGRAMADA', 'POR_ASIGNAR'].includes(ot.estado));

        if (prevMesActual.length === 0 || activasGaval.length === 0) {
          gavalCalibratedRef.current = true;
          try {
            const genId = () => crypto.randomUUID();
            await supabase.from('orden_de_trabajo').delete().like('folio', 'OT-SIM-OCT-%').eq('empresa_id', currentCompany.id);

            const { data: tareasData } = await supabase.from('mantenimiento_tarea').select('id, descripcion, costo_mano_obra, tiempo_estandar_minutos').eq('empresa_id', currentCompany.id);
            const { data: repData } = await supabase.from('logistica_repuestos').select('id, nombre, precio').eq('empresa_id', currentCompany.id);
            const mecs = (colRes.data || []).filter((c: any) => (c.rol || '').toLowerCase().includes('mecanic') || (c.rol || '').toLowerCase().includes('taller'));

            let tareaId = tareasData?.[0]?.id || null;
            if (!tareaId) {
              const newTId = genId();
              await supabase.from('mantenimiento_tarea').insert({
                id: newTId,
                empresa_id: currentCompany.id,
                descripcion: 'Mantenimiento Preventivo Pauta General',
                costo_mano_obra: 95000,
                tiempo_estandar_minutos: 120
              });
              tareaId = newTId;
            }
            const repRef = repData?.[0] || null;
            if (repRef?.id) {
              try {
                await supabase.from('repuesto').upsert({
                  id: repRef.id,
                  sku: String(repRef.id).slice(0, 8),
                  nombre: repRef.nombre || 'Repuesto Taller Gaval',
                  stock_actual: 40,
                  costo_unitario: Number(repRef.precio || 45000)
                });
              } catch (_e) {}
            }
            const mecNombre = mecs[0]?.nombre || 'Taller Central Gaval';
            const ymPrefix = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;

            const octSpecs = [
              { idx: 1, day: '02', tipo: 'PREVENTIVA', estado: 'FINALIZADA', vehIdx: 2, hh: 95000, ins: 135000, mec: mecNombre, progDay: '02' },
              { idx: 2, day: '03', tipo: 'PREVENTIVA', estado: 'FINALIZADA', vehIdx: 3, hh: 110000, ins: 145000, mec: mecNombre, progDay: '03' },
              { idx: 3, day: '04', tipo: 'PREVENTIVA', estado: 'FINALIZADA', vehIdx: 4, hh: 85000, ins: 120000, mec: mecNombre, progDay: '04' },
              { idx: 4, day: '05', tipo: 'PREVENTIVA', estado: 'FINALIZADA', vehIdx: 5, hh: 105000, ins: 155000, mec: mecNombre, progDay: '05' },
              { idx: 5, day: '07', tipo: 'PREVENTIVA', estado: 'FINALIZADA', vehIdx: 6, hh: 90000, ins: 130000, mec: mecNombre, progDay: '07' },
              { idx: 6, day: '08', tipo: 'PREVENTIVA', estado: 'EN_PROCESO', vehIdx: 0, hh: 95000, ins: 115000, mec: mecNombre, progDay: '06' },
              { idx: 7, day: '06', tipo: 'CORRECTIVA', estado: 'PAUSADA', vehIdx: 1, hh: 125000, ins: 165000, mec: mecNombre, progDay: '04' },
              { idx: 8, day: '08', tipo: 'CORRECTIVA', estado: 'POR_ASIGNAR', vehIdx: 1, hh: 80000, ins: 90000, mec: null, progDay: '05' }
            ];

            const newOts: any[] = [];
            const newTareas: any[] = [];
            const newInsumos: any[] = [];
            const newHist: any[] = [];
            const newSol: any[] = [];

            for (const sp of octSpecs) {
              const otId = genId();
              const vObj = vehRes.data[sp.vehIdx % vehRes.data.length];
              const fechaIso = `${ymPrefix}-${sp.day}T15:00:00.000Z`;
              const fechaProg = `${ymPrefix}-${sp.progDay}`;

              newOts.push({
                id: otId,
                folio: `OT-SIM-OCT-0${sp.idx}`,
                vehiculo_id: vObj.id,
                empresa_id: currentCompany.id,
                tecnico_responsable: sp.mec,
                tipo: sp.tipo,
                estado: sp.estado,
                prioridad: sp.tipo === 'PREVENTIVA' ? 'Media' : 'Alta',
                kilometraje_apertura: Number(vObj.kilometraje_actual || 50000),
                kilometraje_cierre: sp.estado === 'FINALIZADA' ? Number(vObj.kilometraje_actual || 50000) + 15 : null,
                fecha_creacion: fechaIso,
                fecha_programada: fechaProg,
                hora_inicio_programada: '08:30:00',
                hora_termino_programada: '17:30:00',
                inicio_proceso: fechaIso,
                observacion_inicial: sp.tipo === 'PREVENTIVA' ? 'Mantenimiento preventivo programado según pauta' : 'Correctivo por alerta operativa en ruta',
                diagnostico_evaluacion: 'Intervención técnica documentada con repuestos y HH.',
                costo_insumos: sp.ins,
                costo_mano_obra_tareas: sp.hh,
                costo_mano_obra_hh: 0,
                tiempo_trabajado_segundos: 10800,
                tipo_falla: sp.tipo === 'CORRECTIVA' ? 'Sistema de Frenos y Neumáticos' : null
              });

              if (tareaId) {
                newTareas.push({
                  id: genId(),
                  orden_id: otId,
                  tarea_estandar_id: tareaId,
                  tiempo_real_minutos: 120,
                  costo_real: sp.hh
                });
              }

              if (repRef?.id) {
                newInsumos.push({
                  id: genId(),
                  orden_id: otId,
                  repuesto_id: repRef.id,
                  cantidad: 2,
                  costo_unitario_aplicado: Math.round(sp.ins / 2)
                });
              }

              if (sp.estado === 'PAUSADA') {
                newHist.push({
                  orden_id: otId,
                  usuario_nombre: mecNombre,
                  comentario: 'Pausa en OT: unidad en espera de repuesto crítico de bodega',
                  created_at: fechaIso
                });
                newSol.push({
                  id: genId(),
                  orden_id: otId,
                  repuesto_id: repRef?.id || null,
                  repuesto_nombre: repRef?.nombre || 'Kit Frenos Heavy Duty',
                  cantidad: 2,
                  estado: 'PENDIENTE',
                  usuario_nombre: mecNombre,
                  created_at: fechaIso
                });
              }
            }

            await supabase.from('orden_de_trabajo').insert(newOts);
            if (newTareas.length > 0) await supabase.from('ot_tareas_realizadas').insert(newTareas);
            if (newInsumos.length > 0) await supabase.from('detalle_insumo_ot').insert(newInsumos);
            if (newHist.length > 0) await supabase.from('historial_ot').insert(newHist);
            if (newSol.length > 0) await supabase.from('solicitud_repuesto_ot').insert(newSol);

            localStorage.removeItem(`pulser_ordenes_trabajo_${currentCompany.id}`);
            if (typeof recargarOrdenesTrabajo === 'function') {
              await recargarOrdenesTrabajo();
            }
          } catch (calErr) {
            console.warn('Aviso calibrando mes actual Demo Gaval:', calErr);
          }
        }
      }
    };
    fetchData();
  }, [currentCompany?.id, ordenesTrabajo]);

  const { 
    tendenciaData,
    estrategiaData,
    costosData,
    cuellosData,
    disponibilidad,
    disponibilidadCalendario,
    disponibilidadOperacional,
    vehiculosDisponibles,
    totalVehiculos,
    horasTotalesPeriodo,
    horasMantenimientoPeriodo,
    horasOperacionPeriodo,
    cumplimientoPrev,
    gastoMensual,
    alertasCriticas,
    saludFlota,
    saludDocs
  } = React.useMemo(() => {
    
    // 1. Preventivas vs Correctivas - strictly for this company
    const currentEmpresaId = currentCompany?.id;
    
    // Raw filter to get all OTs of the company (needed for historical charts)
    const otsEmpresaHistorico = (ordenesTrabajo || []).filter((ot: any) => !currentEmpresaId || ot.empresa_id === currentEmpresaId);
    
    const parseLocalDate = (dateStr: string, isEnd = false) => {
      if (!dateStr) return new Date();
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number);
        return isEnd ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      return new Date(dateStr);
    };

    const start = parseLocalDate(activeFechaDesde, false);
    const end = parseLocalDate(activeFechaHasta, true);

    // Filtered by date range (for KPIs and current metrics)
    const otsEmpresa = otsEmpresaHistorico.filter((ot: any) => {
      const otDate = ot.fechaCreacion || ot.fecha_creacion;
      if (!otDate) return false;
      const d = new Date(otDate);
      return d >= start && d <= end;
    });

    const preventivas = otsEmpresa.filter((ot: any) => ot.tipo === 'PREVENTIVA' || ot.tipo?.includes('PREVENTIVA'));
    const correctivas = otsEmpresa.filter((ot: any) => ot.tipo === 'CORRECTIVA' || ot.tipo?.includes('CORRECTIVA') || ot.tipo?.includes('FALLA'));
    const prevCount = preventivas.length;
    const corrCount = correctivas.length;

    const estrategia = [
      { name: 'Preventivo', value: prevCount },
      { name: 'Correctivo', value: corrCount }
    ];

    // 2. Salud Flota y Disponibilidad usando el motor algorítmico real (calcularDatosPizarra)
    const pizarraData = dbVehiculos.map(v => calcularDatosPizarra(v));
    const vencidosMantenimiento = pizarraData.filter(p => p.estatus === 'VENCIDO').length;
    const proximos = pizarraData.filter(p => p.estatus === 'PROXIMO').length;
    const alDia = pizarraData.filter(p => p.estatus === 'NORMAL').length;

    // 2.b. Control Documental de Flota (Vehicular y Choferes - PRT, SOAP, Permiso, Licencias)
    const nowTs = new Date().getTime();
    const aviso30DiasMs = 30 * 24 * 60 * 60 * 1000;

    const parseDocDate = (dateStr: any): number | null => {
      if (!dateStr || typeof dateStr !== 'string') return null;
      const clean = dateStr.trim();
      if (!clean) return null;
      const parts = clean.split('T')[0].split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return new Date(y, m, d, 23, 59, 59, 999).getTime();
        }
      }
      const dt = new Date(clean);
      return isNaN(dt.getTime()) ? null : dt.getTime();
    };

    let vehiculosDocVencidos = 0;
    let vehiculosDocProximos = 0;
    let vehiculosDocAlDia = 0;
    const detalleDocsVencidos = { rev: 0, seguro: 0, permiso: 0 };
    const detalleDocsProximos = { rev: 0, seguro: 0, permiso: 0 };

    const vehiculosAEvaluar = dbVehiculos.length > 0 ? dbVehiculos : (vehiculos || []);
    const colaboradoresAEvaluar = dbColaboradores.length > 0 ? dbColaboradores : (personal || []);

    vehiculosAEvaluar.forEach((v: any) => {
      const d = v.detalles || {};
      const revDate = v.vencimiento_revision_tecnica || d.vencimiento_revision_tecnica || d.vencimientoRevisionTecnica || d.vencimientoRev;
      const segDate = v.vencimiento_seguro || d.vencimiento_seguro || d.vencimientoSeguroSoap || d.vencimientoSoap || d.vencimientoSeguro;
      const perDate = v.vencimiento_permiso_circulacion || d.vencimiento_permiso_circulacion || d.vencimientoPermisoCirculacion;

      const docs = [
        { tipo: 'rev', date: revDate },
        { tipo: 'seguro', date: segDate },
        { tipo: 'permiso', date: perDate }
      ].filter(x => !!x.date);

      if (docs.length === 0) return;

      let tieneVencido = false;
      let tieneProximo = false;

      docs.forEach(doc => {
        const docTs = parseDocDate(doc.date);
        if (!docTs) return;
        if (docTs < nowTs) {
          tieneVencido = true;
          if (doc.tipo === 'rev') detalleDocsVencidos.rev++;
          else if (doc.tipo === 'seguro') detalleDocsVencidos.seguro++;
          else if (doc.tipo === 'permiso') detalleDocsVencidos.permiso++;
        } else if (docTs <= nowTs + aviso30DiasMs) {
          tieneProximo = true;
          if (doc.tipo === 'rev') detalleDocsProximos.rev++;
          else if (doc.tipo === 'seguro') detalleDocsProximos.seguro++;
          else if (doc.tipo === 'permiso') detalleDocsProximos.permiso++;
        }
      });

      if (tieneVencido) vehiculosDocVencidos++;
      else if (tieneProximo) vehiculosDocProximos++;
      else vehiculosDocAlDia++;
    });

    let conductoresDocVencidos = 0;
    let conductoresDocProximos = 0;

    colaboradoresAEvaluar.forEach((col: any) => {
      const d = col.detalles || {};
      const licDate = col.vencimientoLicencia || d.vencimientoLicencia;
      const exaDate = col.vencimientoExamenSalud || d.vencimientoExamenes || d.vencimientoSalud;

      const docs = [
        { tipo: 'lic', date: licDate },
        { tipo: 'exa', date: exaDate }
      ].filter(x => !!x.date);

      let tieneVencido = false;
      let tieneProximo = false;

      docs.forEach(doc => {
        const docTs = parseDocDate(doc.date);
        if (!docTs) return;
        if (docTs < nowTs) tieneVencido = true;
        else if (docTs <= nowTs + aviso30DiasMs) tieneProximo = true;
      });

      if (d.estadoExamen === 'NO APTO') tieneVencido = true;

      if (tieneVencido) conductoresDocVencidos++;
      else if (tieneProximo) conductoresDocProximos++;
    });

    const alertasVehiculares = vehiculosDocVencidos;
    const alertasColaboradores = conductoresDocVencidos;

    const alertasStock = (repuestos || []).filter((r: any) => {
      const stock = Number(r.stock_actual ?? r.stockActual ?? 0);
      const min = Number(r.stock_minimo ?? r.stockMinimo ?? r.minimo ?? 0);
      return min > 0 && stock <= min;
    }).length;

    const totalAlertasCriticas = vencidosMantenimiento + alertasColaboradores + alertasVehiculares + alertasStock;

    // 1. Disponibilidad en tiempo real (independiente del filtro de fecha histórico)
    const otsActivas = otsEmpresaHistorico.filter((ot: any) => 
      ['ABIERTA', 'EN_PROCESO', 'PAUSADA', 'PROGRAMADA', 'POR_ASIGNAR'].includes(ot.estado)
    );
    const indisponiblesIds = new Set(otsActivas.map((ot: any) => String(ot.vehiculoId || ot.vehiculo_id || '')));
    indisponiblesIds.delete('');
    const totalDb = dbVehiculos.length;
    const vehiculosDisponibles = totalDb > 0 ? Math.max(0, totalDb - indisponiblesIds.size) : 0;
    const disp = totalDb > 0 ? (vehiculosDisponibles / totalDb) * 100 : 100;

    // 2. Disponibilidad basada en Horas Totales (Calendario del Mes / Periodo 24/7)
    // Horas Totales = días del periodo * 24 horas * cantidad de vehículos
    const diasPeriodo = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const totalVehiculosFlota = Math.max(1, totalDb);
    const horasTotalesPeriodo = diasPeriodo * 24 * totalVehiculosFlota;

    // Horas que la flota estuvo en taller por mantenimiento (preventivo, correctivo o reparaciones)
    let horasMantenimientoPeriodo = 0;
    otsEmpresa.forEach((ot: any) => {
      let h = 0;
      if (ot.tiempoTrabajadoSegundos && Number(ot.tiempoTrabajadoSegundos) > 0) {
        h = Number(ot.tiempoTrabajadoSegundos) / 3600;
      } else if (ot.inicio_proceso && ot.termino_proceso) {
        h = Math.max(0, (new Date(ot.termino_proceso).getTime() - new Date(ot.inicio_proceso).getTime()) / (1000 * 3600));
      } else if (ot.tareasRealizadas && Array.isArray(ot.tareasRealizadas) && ot.tareasRealizadas.length > 0) {
        const mins = ot.tareasRealizadas.reduce((acc: number, t: any) => acc + (Number(t.tiempo_real_minutos) || Number(t.tarea_estandar?.tiempoEstandarMinutos) || 0), 0);
        if (mins > 0) h = mins / 60;
      }
      if (h === 0) {
        h = String(ot.tipo || '').includes('PREVENTIVA') ? 4.0 : 8.0;
      }
      horasMantenimientoPeriodo += h;
    });
    horasMantenimientoPeriodo = Math.round(horasMantenimientoPeriodo * 10) / 10;

    // Fórmula 1: Disponibilidad Calendario = ((Horas Totales Mes - Horas Mantenimiento) / Horas Totales Mes) * 100
    const dispCalendarioVal = horasTotalesPeriodo > 0
      ? Math.max(0, Math.min(100, ((horasTotalesPeriodo - horasMantenimientoPeriodo) / horasTotalesPeriodo) * 100))
      : 100;
    const disponibilidadCalendario = Number(dispCalendarioVal.toFixed(1));

    // 3. Disponibilidad basada en Horas de Operación (Operacional)
    // Horas demandadas en jornada estándar de ruta/faena (10 hrs diarias x días periodo x vehículos)
    const horasDemandaOperativa = diasPeriodo * 10 * totalVehiculosFlota;
    const horasOperacionPeriodo = Math.max(0, Math.round((horasDemandaOperativa - horasMantenimientoPeriodo) * 10) / 10);
    const sumaOpMant = horasOperacionPeriodo + horasMantenimientoPeriodo;
    // Fórmula 2: Disponibilidad Operacional = (Horas de Operación / (Horas de Operación + Horas de Mantenimiento)) * 100
    const dispOperacionalVal = sumaOpMant > 0
      ? Math.max(0, Math.min(100, (horasOperacionPeriodo / sumaOpMant) * 100))
      : 100;
    const disponibilidadOperacional = Number(dispOperacionalVal.toFixed(1));

    // Cumplimiento Preventivo real de la flota
    const cumpPrev = totalDb > 0 ? Math.max(0, Math.round(((totalDb - vencidosMantenimiento) / totalDb) * 100)) : 100;

    // 3. Costos y Tendencias Semestrales (Últimos 6 meses continuos vs Meta)
    const endRef = parseLocalDate(activeFechaHasta, true);
    const dynamicMonths: Array<{
      month: number;
      year: number;
      name: string;
      downtime: number;
      prev: number;
      corr: number;
      vehiculosConOt: Set<string>;
    }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(endRef.getFullYear(), endRef.getMonth() - i, 1);
      dynamicMonths.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        name: d.toLocaleString('es-ES', { month: 'short' }).substring(0, 3).toUpperCase() + ' ' + d.getFullYear().toString().slice(-2),
        downtime: 0,
        prev: 0,
        corr: 0,
        vehiculosConOt: new Set<string>()
      });
    }

    otsEmpresaHistorico.forEach((ot: any) => {
      const fecha = ot.fechaCreacion || ot.fecha_creacion;
      if (!fecha) return;
      const d = new Date(fecha);
      const m = dynamicMonths.find(dm => dm.month === d.getMonth() && dm.year === d.getFullYear());
      
      if (m) {
        let h = 0;
        if (ot.tiempoTrabajadoSegundos && Number(ot.tiempoTrabajadoSegundos) > 0) {
          h = Number(ot.tiempoTrabajadoSegundos) / 3600;
        } else if (ot.inicio_proceso && ot.termino_proceso) {
          h = Math.max(0, (new Date(ot.termino_proceso).getTime() - new Date(ot.inicio_proceso).getTime()) / (1000 * 3600));
        } else if (ot.tareasRealizadas && Array.isArray(ot.tareasRealizadas) && ot.tareasRealizadas.length > 0) {
          const mins = ot.tareasRealizadas.reduce((acc: number, t: any) => acc + (Number(t.tiempo_real_minutos) || Number(t.tarea_estandar?.tiempoEstandarMinutos) || 0), 0);
          if (mins > 0) h = mins / 60;
        }
        if (h === 0) {
          if (['ABIERTA', 'EN_PROCESO', 'PAUSADA', 'PROGRAMADA', 'POR_ASIGNAR'].includes(ot.estado)) {
            h = String(ot.tipo || '').includes('PREVENTIVA') ? 4.0 : 8.0;
          } else if (ot.estado === 'FINALIZADA') {
            h = String(ot.tipo || '').includes('PREVENTIVA') ? 3.0 : 6.0;
          }
        }
        m.downtime += h;

        const vId = String(ot.vehiculoId || ot.vehiculo_id || '');
        if (vId) m.vehiculosConOt.add(vId);

        const cost = (Number(ot.costoManoObraTareas) || 0) + (Number(ot.costoInsumos) || 0) + (Number(ot.costoManoObraHH) || 0);
        if (ot.tipo?.includes('PREVENTIVA')) {
           m.prev += cost;
        } else {
           m.corr += cost;
        }
      }
    });

    const tendencia = dynamicMonths.map((m, idx) => {
      let val = 100;
      const isCurrentMonth = (idx === dynamicMonths.length - 1);
      const daysInMonth = new Date(m.year, m.month + 1, 0).getDate();
      const hrsTotalesMes = daysInMonth * 24 * totalVehiculosFlota;
      const hrsDemandaMes = daysInMonth * 10 * totalVehiculosFlota;

      if (dispTab === 'actual') {
        if (isCurrentMonth) {
          val = disp;
        } else {
          // Histórico de operatividad: % de disponibilidad promedio no afectada por taller
          const hrsBase = 24 * 30;
          val = Math.max(0, Math.min(100, 100 * (1 - (m.downtime / hrsBase))));
        }
      } else if (dispTab === 'calendario') {
        if (isCurrentMonth) {
          val = disponibilidadCalendario;
        } else {
          val = hrsTotalesMes > 0 
            ? Math.max(0, Math.min(100, ((hrsTotalesMes - m.downtime) / hrsTotalesMes) * 100))
            : 100;
        }
      } else if (dispTab === 'operacional') {
        if (isCurrentMonth) {
          val = disponibilidadOperacional;
        } else {
          const hrsOp = Math.max(0, hrsDemandaMes - m.downtime);
          const sum = hrsOp + m.downtime;
          val = sum > 0 ? Math.max(0, Math.min(100, (hrsOp / sum) * 100)) : 100;
        }
      }

      return { 
        name: m.name, 
        value: Number(val.toFixed(1)),
        downtime: Number(m.downtime.toFixed(1)),
        prev: m.prev, 
        corr: m.corr 
      };
    });
    
    const costos = dynamicMonths.map(m => ({ name: m.name, prev: m.prev, corr: m.corr }));

    let gastoTotalPeriodo = 0;
    otsEmpresa.forEach((ot: any) => {
      gastoTotalPeriodo += (Number(ot.costoManoObraTareas) || 0) + (Number(ot.costoInsumos) || 0) + (Number(ot.costoManoObraHH) || 0);
    });
    const gastoTotalMesActual = gastoTotalPeriodo;

    // 4. Cuellos de botella operacionales reales
    const cuellosMap: Record<string, number> = {};
    
    otsEmpresa.forEach((ot: any) => {
      if (ot.historial && Array.isArray(ot.historial)) {
        ot.historial.forEach((h: any) => {
          if (h.comentario && h.comentario.toLowerCase().includes('pausa')) {
             cuellosMap['Pausa en Taller'] = (cuellosMap['Pausa en Taller'] || 0) + 1;
          }
        });
      }
    });

    const otsRetrasadas = otsEmpresa.filter((ot: any) => {
      if (!['ABIERTA', 'EN_PROCESO', 'POR_ASIGNAR', 'PAUSADA'].includes(ot.estado)) return false;
      const fProg = ot.fechaProgramada || ot.fecha_programada;
      return fProg && new Date(fProg).getTime() < nowTs;
    }).length;
    if (otsRetrasadas > 0) cuellosMap['OTs con Fecha Vencida'] = otsRetrasadas;

    const otsSinAsignar = otsEmpresa.filter((ot: any) => {
      return ['ABIERTA', 'POR_ASIGNAR'].includes(ot.estado) && !ot.tecnicoResponsable && !ot.personalOperativo && !ot.tecnico_responsable;
    }).length;
    if (otsSinAsignar > 0) cuellosMap['Sin Mecánico Asignado'] = otsSinAsignar;

    let solPendientes = 0;
    otsEmpresa.forEach((ot: any) => {
      if (ot.solicitudes && Array.isArray(ot.solicitudes)) {
        solPendientes += ot.solicitudes.filter((s: any) => s.estado === 'PENDIENTE').length;
      }
    });
    if (solPendientes > 0) cuellosMap['En Espera de Repuestos'] = solPendientes;

    if (alertasStock > 0) cuellosMap['Quiebres Stock Bodega'] = alertasStock;
    
    let cuellosArr = Object.entries(cuellosMap).map(([name, value]) => ({ name, value }));
    cuellosArr.sort((a, b) => b.value - a.value);

    return {
      tendenciaData: tendencia,
      estrategiaData: estrategia,
      costosData: costos,
      cuellosData: cuellosArr.slice(0, 5),
      disponibilidad: Number(disp.toFixed(1)),
      disponibilidadCalendario,
      disponibilidadOperacional,
      vehiculosDisponibles,
      totalVehiculos: totalDb,
      horasTotalesPeriodo,
      horasMantenimientoPeriodo,
      horasOperacionPeriodo,
      cumplimientoPrev: Number(cumpPrev.toFixed(1)),
      gastoMensual: gastoTotalMesActual,
      alertasCriticas: totalAlertasCriticas,
      saludFlota: { vencidos: vencidosMantenimiento, proximos: proximos, alDia: alDia },
      saludDocs: {
        vencidos: vehiculosDocVencidos,
        proximos: vehiculosDocProximos,
        alDia: vehiculosDocAlDia,
        conductoresVencidos: conductoresDocVencidos,
        conductoresProximos: conductoresDocProximos,
        detalleVencidos: detalleDocsVencidos,
        detalleProximos: detalleDocsProximos,
        totalAlertasDocs: vehiculosDocVencidos + conductoresDocVencidos
      }
    };
  }, [ordenesTrabajo, vehiculos, repuestos, personal, dbVehiculos, dbColaboradores, activeFechaDesde, activeFechaHasta, currentCompany?.id, dispTab]);


  const handleFilter = () => {
    setActiveFechaDesde(fechaDesde);
    setActiveFechaHasta(fechaHasta);
  };

  const currentHour = new Date().getHours();
  let greeting = 'Buenos días';
  if (currentHour >= 12 && currentHour < 19) {
    greeting = 'Buenas tardes';
  } else if (currentHour >= 19) {
    greeting = 'Buenas noches';
  }
  
  const userName = user?.name || user?.nombre || 'Usuario'; // Could be dynamic from context

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{greeting}, {userName}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Indicadores clave de rendimiento y salud operativa</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md overflow-hidden">
            <div className="px-3 py-2 flex items-center border-r border-slate-200 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Desde</span>
                <input 
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none p-0 border-none focus:ring-0 dark:[color-scheme:dark]"
                />
              </div>
            </div>
            <div className="px-3 py-2 flex items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Hasta</span>
                <input 
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none p-0 border-none focus:ring-0 dark:[color-scheme:dark]"
                />
              </div>
            </div>
          </div>
          <button 
            onClick={handleFilter}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-md transition-colors shadow-sm"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div 
          onClick={() => navigate('/flota/mantenimiento')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between min-h-[9.5rem] cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Disponibilidad Flota</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">
                    {dispTab === 'actual'
                      ? `${disponibilidad}%`
                      : dispTab === 'calendario'
                      ? `${disponibilidadCalendario}%`
                      : `${disponibilidadOperacional}%`}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                    {dispTab === 'actual' ? 'Actual' : dispTab === 'calendario' ? '24/7 Mes' : 'Operacional'}
                  </span>
                </div>
              </div>
              <div className={`p-2 rounded-lg transition-colors ${
                dispTab === 'actual' 
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' 
                  : dispTab === 'calendario' 
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400' 
                  : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400'
              }`}>
                {dispTab === 'actual' && <CheckCircle2 className="w-5 h-5" />}
                {dispTab === 'calendario' && <Calendar className="w-5 h-5" />}
                {dispTab === 'operacional' && <Gauge className="w-5 h-5" />}
              </div>
            </div>

            {/* Selector de modo de disponibilidad: estilo píldora como Salud de Flota */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-700/60 p-0.5 rounded-lg w-full mt-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDispTab('actual'); }}
                className={`py-1 text-[10px] font-bold rounded transition-all text-center ${
                  dispTab === 'actual'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Disponibilidad Actual: Porcentaje de unidades operativas en tiempo real (sin OT activa)"
              >
                Actual
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDispTab('calendario'); }}
                className={`py-1 text-[10px] font-bold rounded transition-all text-center ${
                  dispTab === 'calendario'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Disponibilidad Calendario 24/7: ((Horas Totales Mes - Horas Mantenimiento) / Horas Totales Mes) * 100"
              >
                24/7 Mes
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDispTab('operacional'); }}
                className={`py-1 text-[10px] font-bold rounded transition-all text-center ${
                  dispTab === 'operacional'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Disponibilidad Operacional: (Horas Operación / (Horas Operación + Horas Mantenimiento)) * 100"
              >
                Operacional
              </button>
            </div>
          </div>

          <div className="flex items-center text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 truncate">
            {dispTab === 'actual' && (
              <span className="font-normal truncate">
                {totalVehiculos > 0 ? `${vehiculosDisponibles} de ${totalVehiculos} unidades activas` : 'Sin datos de flota'}
              </span>
            )}
            {dispTab === 'calendario' && (
              <span className="font-normal truncate" title={`Total: ${horasTotalesPeriodo.toLocaleString('es-CL')}h | Taller: ${horasMantenimientoPeriodo.toLocaleString('es-CL')}h`}>
                Total: {horasTotalesPeriodo.toLocaleString('es-CL')}h · Taller: {horasMantenimientoPeriodo.toLocaleString('es-CL')}h
              </span>
            )}
            {dispTab === 'operacional' && (
              <span className="font-normal truncate" title={`Operación: ${horasOperacionPeriodo.toLocaleString('es-CL')}h | Taller: ${horasMantenimientoPeriodo.toLocaleString('es-CL')}h`}>
                Op: {horasOperacionPeriodo.toLocaleString('es-CL')}h · Taller: {horasMantenimientoPeriodo.toLocaleString('es-CL')}h
              </span>
            )}
          </div>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => navigate('/flota/mantenimiento')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between min-h-[9.5rem] cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Cumplimiento Prev.</span>
              <span className={`text-2xl font-bold mt-1 ${Number(cumplimientoPrev) >= 80 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{cumplimientoPrev}%</span>
            </div>
            <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 p-2 rounded-lg">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-slate-400 dark:text-slate-500">
            <span className="font-normal ml-1">Sin datos recientes</span>
          </div>
        </div>

        {/* Card 3 */}
        <div 
          onClick={() => navigate('/dashboard/tco')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between min-h-[9.5rem] cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Gasto del Período</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">$ {Math.round(Number(gastoMensual) || 0).toLocaleString('es-CL')}</span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 p-2 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center text-xs font-medium text-slate-400 dark:text-slate-500">
            <span className="font-normal ml-1">Esperando registros</span>
          </div>
        </div>

        {/* Card 4 */}
        <div 
          onClick={() => {
            if ((saludDocs?.totalAlertasDocs || 0) > 0) {
              navigate('/operaciones/control-documental');
            } else {
              navigate('/flota/alertas');
            }
          }}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between min-h-[9.5rem] cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Alertas Críticas</span>
              <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{alertasCriticas}</span>
            </div>
            <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className={`flex items-center text-xs font-medium ${alertasCriticas > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
            <span className="font-semibold ml-1 truncate">
              {alertasCriticas === 0 
                ? 'Todo en orden normal' 
                : `${saludDocs?.totalAlertasDocs || 0} docs + ${saludFlota.vencidos} mantención`}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div 
          onClick={() => navigate('/dashboard/kpi-flota')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 lg:col-span-2 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Tendencia de Disponibilidad
                </h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  dispTab === 'actual'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : dispTab === 'calendario'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                }`}>
                  {dispTab === 'actual' ? 'Instantánea' : dispTab === 'calendario' ? '24/7 Mes' : 'Operacional'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {dispTab === 'actual' && 'Evolución según disponibilidad instantánea de flota vs Meta'}
                {dispTab === 'calendario' && 'Evolución mensual Horas Totales Calendario 24/7 vs Meta'}
                {dispTab === 'operacional' && 'Evolución mensual Rendimiento Operacional en Faena vs Meta'}
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {/* Sincronizador de modo en la misma gráfica */}
              <div 
                className="inline-flex bg-slate-100 dark:bg-slate-700/60 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-600"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDispTab('actual'); }}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    dispTab === 'actual'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Actual
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDispTab('calendario'); }}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    dispTab === 'calendario'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  24/7 Mes
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDispTab('operacional'); }}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    dispTab === 'operacional'
                      ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Operacional
                </button>
              </div>

              <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                dispTab === 'actual'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : dispTab === 'calendario'
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
              }`}>
                Meta: {dispTab === 'operacional' ? '90%' : '95%'}
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tendenciaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={dispTab === 'actual' ? '#10b981' : dispTab === 'calendario' ? '#3b82f6' : '#8b5cf6'} 
                      stopOpacity={0.25}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={dispTab === 'actual' ? '#10b981' : dispTab === 'calendario' ? '#3b82f6' : '#8b5cf6'} 
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  domain={[dataMin => Math.max(50, Math.floor((Number(dataMin) - 3) / 5) * 5), 100]} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any, _name: any, item: any) => {
                    const dt = item?.payload?.downtime ?? 0;
                    const modeLabel = dispTab === 'actual' ? 'Instantánea' : dispTab === 'calendario' ? '24/7 Mes' : 'Operacional';
                    return [
                      `${val}% (${modeLabel} · ${dt}h taller)`,
                      'Disponibilidad'
                    ];
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#f8fafc', marginBottom: '4px' }}
                />
                <ReferenceLine 
                  y={dispTab === 'operacional' ? 90 : 95} 
                  stroke="#64748b" 
                  strokeDasharray="3 4" 
                  strokeWidth={2} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={dispTab === 'actual' ? '#10b981' : dispTab === 'calendario' ? '#3b82f6' : '#8b5cf6'} 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card Salud de Flota (Pestañas Mantenimiento / Control Documental) */}
        <div 
          onClick={() => navigate(saludTab === 'documentos' ? '/operaciones/control-documental' : '/flota/mantenimiento')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col gap-2.5 mb-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Salud de Flota
                  </h3>
                  {saludTab === 'documentos' && (saludDocs?.totalAlertasDocs || 0) > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse">
                      <ShieldAlert className="w-3 h-3" />
                      {saludDocs?.totalAlertasDocs} Alerta(s)
                    </span>
                  )}
                  {saludTab === 'mantenimiento' && (saludFlota?.vencidos || 0) > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 animate-pulse">
                      <ShieldAlert className="w-3 h-3" />
                      {saludFlota?.vencidos} Vencido(s)
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {saludTab === 'documentos'
                  ? 'Control legal y vencimiento de documentos'
                  : 'Estado actual de pautas de mantenimiento'}
              </p>

              {/* Selector de Pestaña Documental vs Mantenimiento (100% contenido en el cuadro) */}
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-lg w-full mt-1">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSaludTab('documentos'); }}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    saludTab === 'documentos'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                  title="Ver alertas de documentos de vehículos y choferes"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="truncate">Documental</span>
                  {(saludDocs?.totalAlertasDocs || 0) > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white leading-tight shrink-0">
                      {saludDocs?.totalAlertasDocs}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSaludTab('mantenimiento'); }}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    saludTab === 'mantenimiento'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                  title="Ver estado de pautas y kilometrajes de mantenimiento"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span className="truncate">Mantenimiento</span>
                  {(saludFlota?.vencidos || 0) > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white leading-tight shrink-0">
                      {saludFlota?.vencidos}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Contenido según pestaña activa */}
            {saludTab === 'documentos' ? (
              <div className="space-y-3 mt-4">
                {/* Vencidos */}
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-lg p-3.5 flex justify-between items-center transition-all hover:border-rose-300">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-rose-700 dark:text-rose-400">Documentos Vencidos</span>
                      </div>
                      <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                        {saludDocs?.vencidos || 0} Vehículo(s) • {saludDocs?.conductoresVencidos || 0} Chofer(es)
                      </p>
                      {(saludDocs?.detalleVencidos?.rev > 0 || saludDocs?.detalleVencidos?.seguro > 0 || saludDocs?.detalleVencidos?.permiso > 0) && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {saludDocs.detalleVencidos.rev > 0 && (
                            <span className="text-[10px] bg-rose-200/70 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 font-bold px-1.5 py-0.5 rounded">
                              PRT: {saludDocs.detalleVencidos.rev}
                            </span>
                          )}
                          {saludDocs.detalleVencidos.seguro > 0 && (
                            <span className="text-[10px] bg-rose-200/70 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 font-bold px-1.5 py-0.5 rounded">
                              SOAP: {saludDocs.detalleVencidos.seguro}
                            </span>
                          )}
                          {saludDocs.detalleVencidos.permiso > 0 && (
                            <span className="text-[10px] bg-rose-200/70 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 font-bold px-1.5 py-0.5 rounded">
                              Permiso: {saludDocs.detalleVencidos.permiso}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-rose-700 dark:text-rose-400 ml-2">
                    {(saludDocs?.vencidos || 0) + (saludDocs?.conductoresVencidos || 0)}
                  </span>
                </div>

                {/* Próximos */}
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg p-3.5 flex justify-between items-center transition-all hover:border-amber-300">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></div>
                    <div>
                      <span className="font-semibold text-sm text-amber-700 dark:text-amber-400">Por Vencer (&lt; 30 días)</span>
                      <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                        {saludDocs?.proximos || 0} Vehículo(s) • {saludDocs?.conductoresProximos || 0} Chofer(es)
                      </p>
                      {(saludDocs?.detalleProximos?.rev > 0 || saludDocs?.detalleProximos?.seguro > 0 || saludDocs?.detalleProximos?.permiso > 0) && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {saludDocs.detalleProximos.rev > 0 && (
                            <span className="text-[10px] bg-amber-200/70 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold px-1.5 py-0.5 rounded">
                              PRT: {saludDocs.detalleProximos.rev}
                            </span>
                          )}
                          {saludDocs.detalleProximos.seguro > 0 && (
                            <span className="text-[10px] bg-amber-200/70 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold px-1.5 py-0.5 rounded">
                              SOAP: {saludDocs.detalleProximos.seguro}
                            </span>
                          )}
                          {saludDocs.detalleProximos.permiso > 0 && (
                            <span className="text-[10px] bg-amber-200/70 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold px-1.5 py-0.5 rounded">
                              Permiso: {saludDocs.detalleProximos.permiso}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-700 dark:text-amber-400 ml-2">
                    {(saludDocs?.proximos || 0) + (saludDocs?.conductoresProximos || 0)}
                  </span>
                </div>

                {/* Al Día */}
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg p-3.5 flex justify-between items-center transition-all hover:border-emerald-300">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
                    <div>
                      <span className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">Documentación Vigente</span>
                      <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                        Vehículos con todos sus papeles al día
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 ml-2">
                    {saludDocs?.alDia || 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mt-8">
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400 dark:bg-rose-500"></div>
                    <span className="font-semibold text-rose-700 dark:text-rose-400">Vencidos</span>
                  </div>
                  <span className="text-xl font-bold text-rose-700 dark:text-rose-400">{saludFlota.vencidos}</span>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 dark:bg-amber-500"></div>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">Próximos</span>
                  </div>
                  <span className="text-xl font-bold text-amber-700 dark:text-amber-400">{saludFlota.proximos}</span>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 dark:bg-emerald-500"></div>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">Al Día</span>
                  </div>
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{saludFlota.alDia}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {saludTab === 'documentos' ? 'Ir a Control Documental' : 'Ir a Pizarra de Mantenimiento'}
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Ver Gestión <ArrowRight className="w-3 h-3 ml-1" />
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => navigate('/dashboard/kpi-flota')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 flex flex-col cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Estrategia</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Mix Preventivo vs Correctivo</p>
          </div>
          <div className="w-full h-[240px] mt-4 relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={estrategiaData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  stroke="none"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {estrategiaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {estrategiaData.length > 0 ? (
                <>
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">{Math.round((estrategiaData[0].value / (estrategiaData[0].value + estrategiaData[1].value)) * 100)}%</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{estrategiaData[0].name}</span>
                </>
              ) : (
                <span className="text-sm font-bold text-slate-400">Sin datos</span>
              )}
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-xs font-semibold text-rose-500 dark:text-rose-400">Correctivo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs font-semibold text-blue-500 dark:text-blue-400">Preventivo</span>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/dashboard/kpi-flota')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 flex flex-col cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Costos ($)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Evolución mensual por tipo</p>
          </div>
          <div className="w-full h-[240px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costosData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickFormatter={(val) => val >= 1000000 ? `$${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#f8fafc' }}
                  formatter={(value: any, name: string) => [`$ ${Math.round(Number(value) || 0).toLocaleString('es-CL')}`, name === 'prev' ? 'Preventivo' : name === 'corr' ? 'Correctivo' : name]}
                />
                <Bar dataKey="prev" stackId="a" fill="#3b82f6" />
                <Bar dataKey="corr" stackId="a" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-xs font-semibold text-rose-500 dark:text-rose-400">Corr.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs font-semibold text-blue-500 dark:text-blue-400">Prev.</span>
            </div>
          </div>
        </div>

        <div 
          onClick={() => navigate('/dashboard/fallas')}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 flex flex-col cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Cuellos de Botella</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Motivos de pausa (Top 5)</p>
            </div>
            <button className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/30 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 px-2 py-1 rounded flex items-center transition-colors">
              <ClipboardCheck className="w-3 h-3 mr-1" />
              Detalle
            </button>
          </div>
          <div className="w-full h-[240px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cuellosData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}












