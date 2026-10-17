import React, { useState, useMemo } from 'react';
import { Layers, Calendar, Info, X, Shield, History, BarChart3, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, LineChart, Line, Tooltip, Legend
} from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { useCompany } from '../../contexts/CompanyContext';

// Mock Data
const motifsPausa = ['Falta Repuesto', 'Espera Autorización', 'Personal Ocupado', 'Turno Noche'];

export default function KpiFlota() {
  const { ordenesTrabajo, vehiculos } = useAppContext();
  const { currentCompany } = useCompany();
  const [activeDetail, setActiveDetail] = useState<string | null>(null);

  // Períodos de tiempo recomendados para control y análisis de confiabilidad
  const [periodoTipo, setPeriodoTipo] = useState<'mensual' | 'trimestral' | 'anual' | 'personalizado'>('trimestral');

  const getInitialDates = (tipo: 'mensual' | 'trimestral' | 'anual') => {
    const hasta = new Date();
    const desde = new Date();
    if (tipo === 'mensual') {
      desde.setDate(desde.getDate() - 30);
    } else if (tipo === 'trimestral') {
      desde.setDate(desde.getDate() - 90);
    } else {
      desde.setDate(desde.getDate() - 365);
    }
    return {
      desdeStr: desde.toISOString().split('T')[0],
      hastaStr: hasta.toISOString().split('T')[0]
    };
  };

  const initial = getInitialDates('trimestral');
  const [fechaDesde, setFechaDesde] = useState<string>(initial.desdeStr);
  const [fechaHasta, setFechaHasta] = useState<string>(initial.hastaStr);
  const [filtroMarca, setFiltroMarca] = useState<string>('TODAS');
  const [filtroModelo, setFiltroModelo] = useState<string>('TODOS');

  const handlePeriodoSelect = (tipo: 'mensual' | 'trimestral' | 'anual') => {
    setPeriodoTipo(tipo);
    const { desdeStr, hastaStr } = getInitialDates(tipo);
    setFechaDesde(desdeStr);
    setFechaHasta(hastaStr);
  };

  // Real data calculations
  const { 
    totales, 
    dispMensualData, 
    confMensualData, 
    dispVsConfData,
    distribucionOTs,
    avancePreventivas,
    avanceCorrectivas,
    badActors,
    rankingData,
    detailsData,
    motivosPausaData,
    globalDisp,
    globalMtbf,
    globalConf,
    horasOperacionGlobal,
    horasTotalesGlobal,
    numeroFallasGlobal,
    diasPeriodoGlobal,
    marcasDisponibles,
    modelosDisponibles
  } = useMemo(() => {
    const currentEmpresaId = currentCompany?.id;
    // 1. Filtrar vehículos de la empresa activa
    const vehiculosEmpresa = (vehiculos || []).filter((v: any) => !currentEmpresaId || v.empresa_id === currentEmpresaId);

    // Opciones para filtros de Marca y Modelo
    const marcasDisponibles = Array.from(new Set(vehiculosEmpresa.map((v: any) => v.marca).filter(Boolean))) as string[];
    const modelosDisponibles = Array.from(new Set(
      vehiculosEmpresa
        .filter((v: any) => filtroMarca === 'TODAS' || v.marca === filtroMarca)
        .map((v: any) => v.modelo)
        .filter(Boolean)
    )) as string[];

    // 2. Filtrar vehículos según Marca y Modelo seleccionados
    const vehiculosFiltrados = vehiculosEmpresa.filter((v: any) => {
      if (filtroMarca !== 'TODAS' && v.marca !== filtroMarca) return false;
      if (filtroModelo !== 'TODOS' && v.modelo !== filtroModelo) return false;
      return true;
    });
    const vehiculosIdsSet = new Set(vehiculosFiltrados.map((v: any) => String(v.id)));

    // 3. Rango de fechas
    const parseLocalDate = (dateStr: string, isEnd = false) => {
      if (!dateStr) return new Date();
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts.map(Number);
        return isEnd ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      return new Date(dateStr);
    };

    const start = parseLocalDate(fechaDesde, false);
    const end = parseLocalDate(fechaHasta, true);

    // 4. Filtrar OTs en el período y vehículos correspondientes
    const otsFiltradas = (ordenesTrabajo || []).filter((ot: any) => {
      if (currentEmpresaId && ot.empresa_id && ot.empresa_id !== currentEmpresaId) return false;
      const vId = String(ot.vehiculoId || ot.vehiculo_id || '');
      if (vehiculosIdsSet.size > 0 && !vehiculosIdsSet.has(vId)) return false;
      const fStr = ot.fechaCreacion || ot.fecha_creacion;
      if (!fStr) return false;
      const d = new Date(fStr);
      return d >= start && d <= end;
    });

    const totalOTs = otsFiltradas.length;
    const preventivas = otsFiltradas.filter((ot: any) => ot.tipo?.includes('PREVENTIVA'));
    const correctivas = otsFiltradas.filter((ot: any) => ot.tipo?.includes('CORRECTIVA') || ot.tipo?.includes('FALLA'));
    const evaluativas = otsFiltradas.filter((ot: any) => !ot.tipo?.includes('PREVENTIVA') && !ot.tipo?.includes('CORRECTIVA') && !ot.tipo?.includes('FALLA'));
    
    const prevCount = preventivas.length;
    const corrCount = correctivas.length;

    const distribucionOTs = [
      { name: 'Preventivas', value: prevCount },
      { name: 'Correctivas', value: corrCount }
    ];

    // Avance Preventivas
    const prevCompletadas = preventivas.filter((ot: any) => ot.estado === 'FINALIZADA' || ot.estado === 'CERRADA_MECANICO' || ot.estado === 'CERRADA_POR_MECANICO').length;
    const prevPendientes = Math.max(0, prevCount - prevCompletadas);
    const avancePreventivas = [
      { name: 'Completadas', value: prevCompletadas },
      { name: 'Pendientes', value: prevPendientes }
    ];

    // Avance Correctivas
    const corrCompletadas = correctivas.filter((ot: any) => ot.estado === 'FINALIZADA' || ot.estado === 'CERRADA_MECANICO' || ot.estado === 'CERRADA_POR_MECANICO').length;
    const corrPendientes = Math.max(0, corrCount - corrCompletadas);
    const avanceCorrectivas = [
      { name: 'Completadas', value: corrCompletadas },
      { name: 'Pendientes', value: corrPendientes }
    ];

    // 5. Cálculo estricto de MTBF y Disponibilidad según estándar de confiabilidad:
    // Días del período
    const diasPeriodo = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const vCount = Math.max(1, vehiculosFiltrados.length);
    const horasTotalesPeriodo = diasPeriodo * 24 * vCount;

    const vStatsMap: Record<string, { prev: number, corr: number, eva: number, cost: number, downTime: number }> = {};
    vehiculosFiltrados.forEach((v: any) => {
      vStatsMap[String(v.id)] = { prev: 0, corr: 0, eva: 0, cost: 0, downTime: 0 };
    });

    let totalCosto = 0;
    let horasTallerPeriodo = 0;
    otsFiltradas.forEach((ot: any) => {
      const costo = (Number(ot.costoManoObraTareas) || 0) + (Number(ot.costoInsumos) || 0) + (Number(ot.costoManoObraHH) || 0);
      totalCosto += costo;

      let dT = 0;
      if (ot.tiempoTrabajadoSegundos && Number(ot.tiempoTrabajadoSegundos) > 0) {
        dT = Number(ot.tiempoTrabajadoSegundos) / 3600;
      } else if (ot.tfs_minutos) {
        dT = Number(ot.tfs_minutos) / 60;
      }
      if (dT === 0) {
        dT = ot.tipo?.includes('PREVENTIVA') ? 4.0 : 8.0;
      }
      horasTallerPeriodo += dT;

      const v = String(ot.vehiculoId || ot.vehiculo_id || '');
      if (v && vStatsMap[v]) {
        vStatsMap[v].cost += costo;
        vStatsMap[v].downTime += dT;
        if (ot.tipo?.includes('PREVENTIVA')) vStatsMap[v].prev++;
        else if (ot.tipo?.includes('CORRECTIVA') || ot.tipo?.includes('FALLA')) vStatsMap[v].corr++;
        else vStatsMap[v].eva++;
      }
    });

    // Horas Totales de Operación = Horas Calendario - Horas en Taller (Preventivo + Correctivo)
    const horasOperacion = Math.max(0, horasTotalesPeriodo - horasTallerPeriodo);
    // Número de Fallas = OTs Correctivas (fallas imprevistas que requirieron detención y reparación)
    const numeroFallas = corrCount;

    // Fórmula del MTBF = Horas Totales de Operación / Número de Fallas
    const mtbfGlobalVal = numeroFallas > 0 ? (horasOperacion / numeroFallas) : horasOperacion;
    const globalDispVal = horasTotalesPeriodo > 0 ? ((horasOperacion / horasTotalesPeriodo) * 100).toFixed(1) : "100";
    const globalConfVal = (Math.exp(-24 / Math.max(1, mtbfGlobalVal)) * 100).toFixed(1);

    // 6. Ranking individual por vehículo
    const horasCalPorVehiculo = diasPeriodo * 24;
    const rankingDataObj = vehiculosFiltrados.map((v: any) => {
      const st = vStatsMap[String(v.id)] || { prev: 0, corr: 0, eva: 0, cost: 0, downTime: 0 };
      const horasOpVeh = Math.max(0, horasCalPorVehiculo - st.downTime);
      const fallasVeh = st.corr;
      const mtbfVeh = fallasVeh > 0 ? (horasOpVeh / fallasVeh) : horasOpVeh;
      const confVeh = Math.exp(-24 / Math.max(1, mtbfVeh));
      const dispVeh = horasCalPorVehiculo > 0 ? (horasOpVeh / horasCalPorVehiculo) * 100 : 100;

      return {
        id: v.id,
        v: v.patente || `Vehículo ${v.id}`,
        name: `${v.marca || 'Marca'} ${v.modelo || ''}`,
        prev: st.prev,
        corr: st.corr,
        eva: st.eva,
        costVal: st.cost,
        cost: `$${Math.round(st.cost).toLocaleString('es-CL')}`,
        mtbf: `${Math.round(mtbfVeh)}h`,
        mtbfNum: mtbfVeh,
        c: `${(confVeh * 100).toFixed(1)}%`,
        confNum: confVeh,
        dispNum: dispVeh,
        horasOp: Math.round(horasOpVeh),
        horasTaller: Math.round(st.downTime)
      };
    }).sort((a, b) => b.costVal - a.costVal);

    // Bad Actors: Equipos con mayor cantidad de fallas imprevistas / menor MTBF
    const badActors = [...rankingDataObj]
      .filter((r) => r.corr > 0)
      .sort((a, b) => a.mtbfNum - b.mtbfNum)
      .slice(0, 5);

    const rankingData = rankingDataObj;
    const detailsData = rankingDataObj.map((r) => ({
      ...r,
      conf: r.c
    }));

    // 7. Generar evolución mensual de Disponibilidad y MTBF (Últimos 12 meses)
    const otsHistoricoEmpresa = (ordenesTrabajo || []).filter((ot: any) => {
      if (currentEmpresaId && ot.empresa_id && ot.empresa_id !== currentEmpresaId) return false;
      const vId = String(ot.vehiculoId || ot.vehiculo_id || '');
      if (vehiculosIdsSet.size > 0 && !vehiculosIdsSet.has(vId)) return false;
      return true;
    });

    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const year = d.getFullYear();
      const month = d.getMonth();
      const daysInM = new Date(year, month + 1, 0).getDate();
      return { 
        month, 
        year, 
        name: d.toLocaleString('es-ES', { month: 'short' }).substring(0, 3).toUpperCase(),
        days: daysInM,
        ots: 0,
        fallas: 0,
        downtime: 0
      };
    });

    otsHistoricoEmpresa.forEach((ot: any) => {
      const fStr = ot.fechaCreacion || ot.fecha_creacion;
      if (!fStr) return;
      const d = new Date(fStr);
      const m = last12Months.find((x) => x.month === d.getMonth() && x.year === d.getFullYear());
      if (m) {
        m.ots++;
        if (ot.tipo?.includes('CORRECTIVA') || ot.tipo?.includes('FALLA')) {
          m.fallas++;
        }
        if (ot.tiempoTrabajadoSegundos && Number(ot.tiempoTrabajadoSegundos) > 0) {
          m.downtime += Number(ot.tiempoTrabajadoSegundos) / 3600;
        } else if (ot.tfs_minutos) {
          m.downtime += Number(ot.tfs_minutos) / 60;
        } else {
          m.downtime += ot.tipo?.includes('PREVENTIVA') ? 4.0 : 8.0;
        }
      }
    });

    const dispMensualData = last12Months.map((m) => {
      const hrsTotalesMes = m.days * 24 * vCount;
      const hrsOpMes = Math.max(0, hrsTotalesMes - m.downtime);
      const d = hrsTotalesMes > 0 ? (hrsOpMes / hrsTotalesMes) * 100 : 100;
      return { name: m.name, disp: Number(d.toFixed(1)) };
    });

    const confMensualData = last12Months.map((m) => {
      const hrsTotalesMes = m.days * 24 * vCount;
      const hrsOpMes = Math.max(0, hrsTotalesMes - m.downtime);
      const mtbfMes = m.fallas > 0 ? (hrsOpMes / m.fallas) : hrsOpMes;
      const conf = Math.exp(-24 / Math.max(1, mtbfMes)) * 100;
      return { name: m.name, conf: Number(conf.toFixed(1)), mtbf: Math.round(mtbfMes) };
    });

    const dispVsConfData = dispMensualData.map((d, i) => ({
      name: d.name,
      disp: d.disp,
      conf: confMensualData[i].conf
    }));

    const motivoCount: Record<string, number> = {};
    otsFiltradas.forEach((ot: any) => {
      if (ot.historial && Array.isArray(ot.historial)) {
        ot.historial.forEach((h: any) => {
          if (h.estado_nuevo === 'PAUSADA') {
            const motivo = h.comentario ? h.comentario.trim() : 'Sin Especificar';
            motivoCount[motivo] = (motivoCount[motivo] || 0) + 1;
          }
        });
      }
    });

    let motivosPausaData = Object.entries(motivoCount).map(([name, count]) => ({ name, count }));
    if (motivosPausaData.length === 0) {
      motivosPausaData = [{ name: 'Sin Pausas Editadas', count: 0 }];
    }

    return {
      totales: { totalOTs, prevCount, corrCount, totalCosto },
      distribucionOTs,
      avancePreventivas,
      avanceCorrectivas,
      badActors,
      rankingData,
      detailsData,
      dispMensualData,
      confMensualData,
      dispVsConfData,
      motivosPausaData,
      globalDisp: globalDispVal,
      globalMtbf: Math.round(mtbfGlobalVal).toLocaleString('es-CL'),
      globalConf: globalConfVal,
      horasOperacionGlobal: Math.round(horasOperacion),
      horasTotalesGlobal: horasTotalesPeriodo,
      numeroFallasGlobal: numeroFallas,
      diasPeriodoGlobal: diasPeriodo,
      marcasDisponibles,
      modelosDisponibles
    };
  }, [ordenesTrabajo, vehiculos, currentCompany?.id, fechaDesde, fechaHasta, filtroMarca, filtroModelo]);

  // Overall calculations
  const globalPrevPct = totales.totalOTs > 0 ? (totales.prevCount / totales.totalOTs) * 100 : 0;
  const globalCorrPct = totales.totalOTs > 0 ? (totales.corrCount / totales.totalOTs) * 100 : 0;

  const handleDetailClick = (type: string) => {
    setActiveDetail(type);
  };

  const renderSidebarContent = () => {
    switch (activeDetail) {
      case 'disponibilidad':
        return (
          <>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div className="pr-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Detalle: Disponibilidad Física</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2">Cálculo de Disponibilidad</p>
              </div>
              <button onClick={() => setActiveDetail(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Fórmula de Disponibilidad:</h4>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 leading-snug">
                    Disponibilidad = (Horas Totales de Operación / Horas Calendario del Período) × 100
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Operación: {horasOperacionGlobal.toLocaleString('es-CL')}h / Capacidad Total: {horasTotalesGlobal.toLocaleString('es-CL')}h ({diasPeriodoGlobal} días)
                  </p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Vehículo</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Hrs Op</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Disponibilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detailsData.length > 0 ? (
                    detailsData.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 font-bold text-slate-700 dark:text-slate-300">{row.v}</td>
                        <td className="py-3 text-right font-medium text-slate-600 dark:text-slate-400">{row.horasOp}h</td>
                        <td className="py-3 text-right font-bold text-emerald-500">{row.dispNum.toFixed(1)}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-500 text-xs font-medium">Sin datos registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
      
      case 'mtbf':
        return (
          <>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div className="pr-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Detalle: MTBF y Confiabilidad</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2">Cálculo de Ingeniería</p>
              </div>
              <button 
                onClick={() => setActiveDetail(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-purple-50/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wider mb-1">Fórmula MTBF:</h4>
                  <p className="text-sm font-bold text-purple-900 dark:text-purple-200 leading-snug">
                    MTBF = Horas Totales de Operación / Número de Fallas Correctivas
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    Horas Operación: {horasOperacionGlobal.toLocaleString('es-CL')}h | Fallas: {numeroFallasGlobal} ({periodoTipo.toUpperCase()} - {diasPeriodoGlobal} días)
                  </p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Vehículo</th>
                    <th className="text-center font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Fallas</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Hrs Op</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">MTBF Ind.</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Conf. (24h)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detailsData.length > 0 ? (
                    detailsData.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 px-2 font-bold text-slate-700 dark:text-slate-300">{row.v}</td>
                        <td className="py-3 px-2 text-center font-bold text-rose-500">{row.corr}</td>
                        <td className="py-3 px-2 text-right font-medium text-slate-600 dark:text-slate-400">{row.horasOp}h</td>
                        <td className="py-3 px-2 text-right font-bold text-purple-600 dark:text-purple-400">{row.mtbf}</td>
                        <td className="py-3 px-2 text-right font-bold text-emerald-500">{row.conf}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 text-xs font-medium">Sin datos registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );

      case 'mix_gasto':
        return (
          <>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div className="pr-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Detalle: Mix Gasto (70/30)</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2">Preventivo vs Correctivo</p>
              </div>
              <button 
                onClick={() => setActiveDetail(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Objetivo:</h4>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 leading-snug">
                    Mantener al menos un 70% de la carga de mantenimiento como proactiva (preventivos), y reducir emergencias.
                  </p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Vehículo</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">% Prev</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">% Corr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detailsData.length > 0 ? (
                    detailsData.map((row) => {
                      const totalOts = row.prev + row.corr + row.eva;
                      const prevPct = totalOts > 0 ? (row.prev / totalOts) * 100 : 0;
                      const corrPct = totalOts > 0 ? (row.corr / totalOts) * 100 : 0;
                      return (
                        <tr key={row.id}>
                          <td className="py-3 px-2 font-bold text-slate-700 dark:text-slate-300">{row.v}</td>
                          <td className="py-3 px-2 text-right font-bold text-blue-500 dark:text-blue-400">{Math.round(prevPct)}%</td>
                          <td className="py-3 px-2 text-right font-bold text-rose-500 dark:text-rose-400">{Math.round(corrPct)}%</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-500 text-xs font-medium">Sin datos registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );

      case 'confiabilidad_mision':
        return (
          <>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div className="pr-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Detalle: Confiabilidad Misión</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2">Probabilidad de Éxito por Vehículo</p>
              </div>
              <button 
                onClick={() => setActiveDetail(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Cálculo de Probabilidad:</h4>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 leading-snug">
                    R(t) = e^(-t / MTBF)<br/>
                    Donde <b className="dark:text-blue-200">t</b> = 24 horas (tiempo estándar de misión operativa).
                  </p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Vehículo</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">MTBF (Hrs)</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">R(24h)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detailsData.length > 0 ? (
                    detailsData.map((row) => {
                      // Simular cálculo real
                      const mtbfParsed = parseFloat(row.mtbf.replace('h','')) || 1000;
                      const c = Math.exp(-24 / mtbfParsed);
                      const formattedConf = (c * 100).toFixed(1) + '%';
                      
                      return (
                        <tr key={row.id}>
                          <td className="py-3 px-2 font-bold text-slate-700 dark:text-slate-300">{row.v}</td>
                          <td className="py-3 px-2 text-right font-bold text-purple-500 dark:text-purple-400">{mtbfParsed}h</td>
                          <td className="py-3 px-2 text-right font-bold text-emerald-500">{formattedConf}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-500 text-xs font-medium">Sin datos registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );

      case 'ranking_gasto':
        return (
          <>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div className="pr-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Ranking Completo de Gasto</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2">Información Real Pulser</p>
              </div>
              <button 
                onClick={() => setActiveDetail(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-4 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Información Técnica:</h4>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 leading-snug">
                    Listado de todos los equipos ordenado por presupuesto de mantenimiento consumido. Las intervenciones indican el número de ingresos por tipo: Preventivo, Correctivo o Evaluación.
                  </p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Equipo</th>
                    <th className="text-center font-bold text-[10px] uppercase text-sky-500 tracking-wider pb-3" title="Preventivas">Prev</th>
                    <th className="text-center font-bold text-[10px] uppercase text-rose-500 tracking-wider pb-3" title="Correctivas">Corr</th>
                    <th className="text-center font-bold text-[10px] uppercase text-amber-500 tracking-wider pb-3" title="Evaluaciones">Eval</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Gasto Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rankingData.length > 0 ? (
                    rankingData.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 px-2 font-bold text-slate-700 dark:text-slate-300">{row.v}</td>
                        <td className="py-3 px-2 text-center font-bold text-slate-600 dark:text-slate-400">{row.prev}</td>
                        <td className="py-3 px-2 text-center font-bold text-slate-600 dark:text-slate-400">{row.corr}</td>
                        <td className="py-3 px-2 text-center font-bold text-slate-600 dark:text-slate-400">{row.eva}</td>
                        <td className="py-3 px-2 text-right font-bold text-rose-600 dark:text-rose-400">{row.cost}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 text-xs font-medium">Sin datos registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );

      case 'distribucion_ots':
      case 'avance_preventivas':
      case 'avance_correctivas':
      case 'disp_mensual':
      case 'tendencia_conf':
      case 'motivos_pausa':
      case 'disp_vs_conf': {
        const infoMap: Record<string, { title: string, formula: string, desc: string }> = {
          'distribucion_ots': { title: 'Distribución OTs', formula: 'OTs por Tipo / Total OTs', desc: 'Muestra la cantidad de órdenes de trabajo clasificadas según su naturaleza preventiva o correctiva.' },
          'avance_preventivas': { title: 'Avance Preventivas', formula: 'OTs Prev. Completadas / OTs Prev. Programadas', desc: 'Indica el grado de cumplimiento del plan de mantenimiento preventivo.' },
          'avance_correctivas': { title: 'Avance Correctivas', formula: 'OTs Corr. Atendidas / OTs Corr. Generadas', desc: 'Indica la rapidez y capacidad de respuesta frente a fallas imprevistas.' },
          'disp_mensual': { title: 'Disponibilidad Mensual', formula: 'Promedio de disponibilidad diaria del mes', desc: 'Tendencia histórica del indicador principal de disponibilidad física general de la flota.' },
          'tendencia_conf': { title: 'Tendencia Confiabilidad Mensual', formula: 'Evolución del MTBF mensual', desc: 'Muestra si la frecuencia de fallas está incrementando o disminuyendo a lo largo del tiempo.' },
          'motivos_pausa': { title: 'Motivos de Pausa', formula: 'Suma de incidencias por categoría', desc: 'Principales motivos externos que detienen la disponibilidad de un equipo (falta de chofer, repuestos, etc).' },
          'disp_vs_conf': { title: 'Disponibilidad vs Confiabilidad', formula: 'Disp (%) vs MTBF Normalizado', desc: 'Correlación entre el tiempo que el equipo está listo para operar versus la frecuencia real con la que se avería.' }
        };
        const ctx = infoMap[activeDetail];

        return (
          <>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div className="pr-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Detalles: {ctx.title}</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2">Métricas e Indicadores</p>
              </div>
              <button 
                onClick={() => setActiveDetail(null)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-6 rounded-xl flex flex-col justify-center">
                <BarChart3 className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">{ctx.desc}</h3>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 dark:text-slate-400">Cómputo / Origen</h4>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{ctx.formula}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-6">Desglose de Datos Recientes</h4>
                <div className="p-4 text-center border border-slate-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/50">
                  <span className="text-xs font-medium text-slate-500">Sin datos registrados</span>
                </div>
              </div>
            </div>
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0b1120] animate-in fade-in duration-500">
      
      {/* Main Content */}
      <div className={cn("flex-1 p-6 space-y-6 transition-all duration-300", activeDetail ? "mr-80 lg:mr-[400px]" : "mr-0")}>
        
        {/* Header Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
              <Layers className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión Estratégica de Flota</h1>
              <p className="text-xs font-semibold text-slate-400 tracking-wider mt-1 uppercase">Panel de Disponibilidad y Confiabilidad (MTBF)</p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-green-700 dark:text-green-400 tracking-widest uppercase">Estado: En Línea</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Quick Period Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handlePeriodoSelect('mensual')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  periodoTipo === 'mensual'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Control Operativo (30 días): desviaciones rápidas y corto plazo"
              >
                Mensual (30d)
              </button>
              <button
                type="button"
                onClick={() => handlePeriodoSelect('trimestral')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  periodoTipo === 'trimestral'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Análisis de Confiabilidad estándar (90 días): estadísticamente recomendado"
              >
                Trimestral (90d)
              </button>
              <button
                type="button"
                onClick={() => handlePeriodoSelect('anual')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  periodoTipo === 'anual'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Tendencias Anuales (365 días): ciclo completo consolidado"
              >
                Anual (365d)
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            {/* Date Pickers */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Desde:</span>
              <input 
                type="date" 
                value={fechaDesde} 
                onChange={(e) => { setPeriodoTipo('personalizado'); setFechaDesde(e.target.value); }}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium outline-none dark:text-white" 
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Hasta:</span>
              <input 
                type="date" 
                value={fechaHasta} 
                onChange={(e) => { setPeriodoTipo('personalizado'); setFechaHasta(e.target.value); }}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium outline-none dark:text-white" 
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Brand */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Marca:</span>
              <select 
                value={filtroMarca}
                onChange={(e) => { setFiltroMarca(e.target.value); setFiltroModelo('TODOS'); }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium outline-none dark:text-white"
              >
                <option value="TODAS">Todas las Marcas</option>
                {marcasDisponibles.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Filter by Model */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Modelo:</span>
              <select 
                value={filtroModelo}
                onChange={(e) => setFiltroModelo(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium outline-none dark:text-white"
              >
                <option value="TODOS">Todos los Modelos</option>
                {modelosDisponibles.map(mod => (
                  <option key={mod} value={mod}>{mod}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            onClick={() => handleDetailClick('disponibilidad')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
          >
            <h3 className="text-xs font-extrabold text-blue-500 uppercase tracking-widest mb-3">Disponibilidad Física</h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-black text-emerald-500 dark:text-emerald-400">{globalDisp}%</span>
              <BarChart3 className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {horasOperacionGlobal.toLocaleString('es-CL')}h operadas / {horasTotalesGlobal.toLocaleString('es-CL')}h
            </p>
          </div>

          <div 
            onClick={() => handleDetailClick('mtbf')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm cursor-pointer hover:border-purple-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold text-purple-500 uppercase tracking-widest">MTBF (Confiabilidad)</h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                {periodoTipo === 'mensual' ? 'Mensual (30d)' : periodoTipo === 'trimestral' ? 'Trimestral (90d)' : periodoTipo === 'anual' ? 'Anual (365d)' : 'Personalizado'}
              </span>
            </div>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{globalMtbf} hrs</span>
              <History className="w-5 h-5 text-slate-300 dark:text-slate-600 mb-1" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
              {numeroFallasGlobal} {numeroFallasGlobal === 1 ? 'falla' : 'fallas'} · {horasOperacionGlobal.toLocaleString('es-CL')}h operadas
            </p>
          </div>

          <div 
            onClick={() => handleDetailClick('mix_gasto')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-orange-300 transition-colors"
          >
            <h3 className="text-xs font-extrabold text-orange-500 uppercase tracking-widest mb-1">Mix Gasto (70/30)</h3>
            <div className="flex items-center justify-between relative mt-2 mb-2">
              <div className="space-y-1">
                <div className="text-sm font-black text-blue-500">PREV: {globalPrevPct.toFixed(1)}%</div>
                <div className="text-sm font-black text-rose-500">CORR: {globalCorrPct.toFixed(1)}%</div>
              </div>
              <div className="w-12 h-12 relative flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribucionOTs} innerRadius="60%" outerRadius="100%" dataKey="value" stroke="none">
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f43f5e" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ideal: 70% Preventivo</p>
          </div>

          <div 
            onClick={() => handleDetailClick('confiabilidad_mision')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm cursor-pointer hover:border-emerald-300 transition-colors"
          >
            <h3 className="text-xs font-extrabold text-emerald-500 uppercase tracking-widest mb-3">Confiabilidad de Misión</h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-black text-emerald-500 dark:text-emerald-400">{globalConf}%</span>
              <Shield className="w-5 h-5 text-slate-300 dark:text-slate-600 mb-1" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Probabilidad éxito 24h</p>
          </div>
        </div>

        {/* 3 Donut Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div onClick={() => handleDetailClick('distribucion_ots')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col items-center cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <h3 className="text-[14px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-tight mb-4 border-b-2 border-dotted border-blue-200 dark:border-blue-900/50 pb-1">Distribución OTs</h3>
            <div className="h-40 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribucionOTs} innerRadius="60%" outerRadius="90%" dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                    <Cell fill="#38bdf8" />
                    <Cell fill="#fb7185" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-sky-400" /> Prev.</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-rose-400" /> Corr.</div>
            </div>
          </div>

          <div onClick={() => handleDetailClick('avance_preventivas')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col items-center cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <h3 className="text-[14px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-tight mb-4 border-b-2 border-dotted border-blue-200 dark:border-blue-900/50 pb-1">Avance Preventivas</h3>
            <div className="h-40 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={avancePreventivas} innerRadius="60%" outerRadius="90%" dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500" /> OK</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500" /> Pend</div>
            </div>
          </div>

          <div onClick={() => handleDetailClick('avance_correctivas')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col items-center cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <h3 className="text-[14px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-tight mb-4 border-b-2 border-dotted border-blue-200 dark:border-blue-900/50 pb-1">Avance Correctivas</h3>
            <div className="h-40 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={avanceCorrectivas} innerRadius="60%" outerRadius="90%" dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                    <Cell fill="#fb7185" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-rose-400" /> OK</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500" /> Pend</div>
            </div>
          </div>

        </div>

        {/* Bad Actors */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 transition-colors" onClick={() => handleDetailClick('ranking_gasto')}>
          <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-dotted border-blue-200 dark:border-blue-900/50">
            <h2 className="text-[15px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-tight">Top 5 Equipos Más Caros (Bad Actors)</h2>
            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Últimos 30 días
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {badActors.map(actor => (
              <div key={actor.id} className="bg-rose-50/30 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl p-4 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{actor.v}</span>
                <span className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none mt-1">{actor.name}</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-500 my-4">{actor.cost}</span>
                <div className="w-full border-t border-rose-200/50 dark:border-rose-800/30 mb-3" />
                <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 tracking-wider">
                  <span>MTBF: {actor.mtbf}</span>
                  <span>C: {actor.c}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bar/Line Charts Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div onClick={() => handleDetailClick('disp_mensual')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <h3 className="text-[14px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-tight mb-6 pb-1 border-b-2 border-dotted border-blue-200 dark:border-blue-900/50 text-center">Disponibilidad Mensual (%)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dispMensualData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="disp" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div onClick={() => handleDetailClick('tendencia_conf')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <h3 className="text-[14px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-tight mb-6 pb-1 border-b-2 border-dotted border-blue-200 dark:border-blue-900/50 text-center">Tendencia Confiabilidad Mensual (%)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confMensualData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#8b5cf6', opacity: 0.1 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="conf" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bar/Line Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div onClick={() => handleDetailClick('motivos_pausa')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <h3 className="text-[14px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-tight mb-6 pb-1 border-b-2 border-dotted border-blue-200 dark:border-blue-900/50 text-center">Motivos de Pausa (Frecuencia)</h3>
            <div className="h-64 w-full pb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={motivosPausaData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, angle: -15, textAnchor: 'end' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[0, 2]} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div onClick={() => handleDetailClick('disp_vs_conf')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <h3 className="text-[14px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-tight mb-6 pb-1 border-b-2 border-dotted border-blue-200 dark:border-blue-900/50 text-center">Disp. vs Confiabilidad</h3>
            <div className="h-64 w-full pb-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dispVsConfData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '10px' }} iconType="rect" />
                  <Line type="monotone" dataKey="disp" name="Disp" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="conf" name="Conf" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* Sidebar Overlay */}
      {activeDetail && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setActiveDetail(null)}
        />
      )}

      {/* Detail Sidebar */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-[400px] bg-white dark:bg-[#0b1120] border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-300 z-50 flex flex-col",
        activeDetail ? "translate-x-0" : "translate-x-full"
      )}>
        {renderSidebarContent()}
      </div>

    </div>
  );
}
