import React, { useState, useMemo } from 'react';
import { Layers, Calendar, Info, X, Shield, History, BarChart3, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, LineChart, Line, Tooltip, Legend
} from 'recharts';
import { useAppContext } from '../../context/AppContext';

// Mock Data
const motifsPausa = ['Falta Repuesto', 'Espera Autorización', 'Personal Ocupado', 'Turno Noche'];

export default function KpiFlota() {
  const { ordenesTrabajo, vehiculos } = useAppContext();
  const [activeDetail, setActiveDetail] = useState<string | null>(null);

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
    motivosPausaData
  } = useMemo(() => {
    const totalOTs = ordenesTrabajo.length;
    
    // Distribución
    const preventivas = ordenesTrabajo.filter(ot => ot.tipo.includes('PREVENTIVA'));
    const correctivas = ordenesTrabajo.filter(ot => ot.tipo.includes('CORRECTIVA') || ot.tipo.includes('INSPECCION'));
    const evaluativas = ordenesTrabajo.filter(ot => !ot.tipo.includes('PREVENTIVA') && !ot.tipo.includes('CORRECTIVA') && !ot.tipo.includes('INSPECCION'));
    
    const prevCount = preventivas.length;
    const corrCount = correctivas.length;
    
    const distribucionOTs = [
      { name: 'Preventivas', value: prevCount },
      { name: 'Correctivas', value: corrCount }
    ];

    // Avance Preventivas
    const prevCompletadas = preventivas.filter(ot => ot.estado === 'FINALIZADA' || ot.estado === 'CERRADA_MECANICO' || ot.estado === 'CERRADA_POR_MECANICO').length;
    const prevPendientes = Math.max(0, prevCount - prevCompletadas);
    const avancePreventivas = [
      { name: 'Completadas', value: prevCompletadas },
      { name: 'Pendientes', value: prevPendientes }
    ];

    // Avance Correctivas
    const corrCompletadas = correctivas.filter(ot => ot.estado === 'FINALIZADA' || ot.estado === 'CERRADA_MECANICO' || ot.estado === 'CERRADA_POR_MECANICO').length;
    const corrPendientes = Math.max(0, corrCount - corrCompletadas);
    const avanceCorrectivas = [
      { name: 'Completadas', value: corrCompletadas },
      { name: 'Pendientes', value: corrPendientes }
    ];

    // Vehículos Cost Map
    const vMap: Record<string, { prev: number, corr: number, eva: number, cost: number, downTime: number }> = {};
    vehiculos.forEach(v => {
      vMap[v.id] = { prev: 0, corr: 0, eva: 0, cost: 0, downTime: 0 };
    });

    let totalCosto = 0;
    ordenesTrabajo.forEach(ot => {
      const costo = (ot.costoManoObraTareas || 0) + (ot.costoInsumos || 0) + (ot.costoManoObraHH || 0);
      totalCosto += costo;
      
      let dT = 0;
      if (ot.tiempoTrabajadoSegundos) dT += ot.tiempoTrabajadoSegundos / 3600;
      if (ot.tfs_minutos) dT += ot.tfs_minutos / 60;
      if (dT === 0) dT = 10; // estimate 10h if no data
      
      const v = ot.vehiculoId || ot.vehiculo_id;
      if (v && vMap[v]) {
        vMap[v].cost += costo;
        vMap[v].downTime += dT;
        if (ot.tipo.includes('PREVENTIVA')) vMap[v].prev++;
        else if (ot.tipo.includes('CORRECTIVA')) vMap[v].corr++;
        else vMap[v].eva++;
      }
    });

    const rankingDataObj = vehiculos.map(v => {
      const stats = vMap[v.id];
      const totalOtsV = stats.prev + stats.corr + stats.eva;
      // MTBF = Theoretical Hours (720 per month) / Events
      const mtbf = totalOtsV > 0 ? (720 / totalOtsV) : 720; 
      // conf: R(24) = e^(-24/MTBF)
      const conf = Math.exp(-24 / mtbf);

      let disp = 100 * (1 - (stats.downTime / 720));
      if (disp < 0) disp = 0;

      return {
        id: v.id,
        v: v.patente || `Vehículo ${v.id}`,
        name: `${v.marca || 'Marca'} ${v.modelo || ''}`,
        prev: stats.prev,
        corr: stats.corr,
        eva: stats.eva,
        costVal: stats.cost,
        cost: `$${stats.cost.toLocaleString()}`,
        mtbf: `${Math.round(mtbf)}h`,
        c: `${(conf * 100).toFixed(1)}%`,
        confNum: conf,
        dispNum: disp
      };
    }).sort((a, b) => b.costVal - a.costVal);

    const badActors = rankingDataObj.slice(0, 5);
    const rankingData = rankingDataObj;

    const detailsData = rankingDataObj.map(r => ({
      ...r,
      conf: r.c
    }));

    // Generate monthly data from real OTs
    const last12Months = Array.from({length: 12}, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return { 
        month: d.getMonth(), 
        year: d.getFullYear(), 
        name: d.toLocaleString('es', { month: 'short', timeZone: 'UTC' }).substring(0,3).toUpperCase(),
        ots: 0,
        downtime: 0
      };
    });

    ordenesTrabajo.forEach(ot => {
      if (!ot.fechaCreacion) return;
      const d = new Date(ot.fechaCreacion);
      const m = last12Months.find(x => x.month === d.getMonth() && x.year === d.getFullYear());
      if (m) {
        m.ots++;
        if (ot.tiempoTrabajadoSegundos) m.downtime += ot.tiempoTrabajadoSegundos / 3600;
        else if (ot.tfs_minutos) m.downtime += ot.tfs_minutos / 60;
        else m.downtime += 10; // guess 10h if no data
      }
    });

    const vCount = vehiculos.length || 1;
    const hrsMes = vCount * 720;
    
    const dispMensualData = last12Months.map(m => {
       const d = Math.max(0, 100 * (1 - (m.downtime / hrsMes)));
       return { name: m.name, disp: Number(d.toFixed(1)) };
    });

    const confMensualData = last12Months.map(m => {
       const mtbf = m.ots > 0 ? (hrsMes / m.ots) : hrsMes;
       const conf = Math.exp(-24 / mtbf) * 100;
       return { name: m.name, conf: Number(conf.toFixed(1)) };
    });

    const dispVsConfData = dispMensualData.map((d, i) => ({
      name: d.name,
      disp: d.disp,
      conf: confMensualData[i].conf
    }));

    const motivoCount: Record<string, number> = {};
    ordenesTrabajo.forEach(ot => {
      if (ot.historial) {
        ot.historial.forEach(h => {
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
      motivosPausaData
    };
  }, [ordenesTrabajo, vehiculos]);

  // Overall calculations
  const globalPrevPct = totales.totalOTs > 0 ? (totales.prevCount / totales.totalOTs) * 100 : 0;
  const globalCorrPct = totales.totalOTs > 0 ? (totales.corrCount / totales.totalOTs) * 100 : 0;
  
  // Real global MTBF / Disp calculation
  const totalDowntimeGlobal = dispMensualData.reduce((acc, m) => acc + ((100 - m.disp) / 100) * (vehiculos.length || 1) * 720, 0);
  const totalTheoretical = 12 * (vehiculos.length || 1) * 720;
  const globalDisp = totalTheoretical > 0 ? (100 * (1 - totalDowntimeGlobal / totalTheoretical)).toFixed(1) : "100"; 
  const mtbfGlobal = totales.totalOTs > 0 ? totalTheoretical / totales.totalOTs : totalTheoretical;
  const globalMtbf = Math.round(mtbfGlobal).toString(); 
  const globalConf = (Math.exp(-24 / mtbfGlobal) * 100).toFixed(1);

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
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-1">Fórmula:</h4>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 leading-snug">
                    Disponibilidad = (Horas Teóricas - Horas de Mantenimiento) / Horas Teóricas
                  </p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Vehículo</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Hrs Teóricas</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Disponibilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detailsData.length > 0 ? (
                    detailsData.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 font-bold text-slate-700 dark:text-slate-300">{row.v}</td>
                        <td className="py-3 text-right font-medium text-slate-600 dark:text-slate-400">720h</td>
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
                    MTBF = Capacidad Total / Total OTs. C = Probabilidad de no fallar en 24h.
                  </p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Vehículo</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">MTBF Ind.</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Conf. (C)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {detailsData.length > 0 ? (
                    detailsData.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 px-2 font-bold text-slate-700 dark:text-slate-300">{row.v}</td>
                        <td className="py-3 px-2 text-right font-bold text-purple-600 dark:text-purple-400">{row.mtbf}</td>
                        <td className="py-3 px-2 text-right font-bold text-emerald-500">{row.conf}</td>
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Desde:</span>
            <div className="relative">
              <input type="text" defaultValue="12 / 01 / 2026" className="pl-3 pr-10 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium w-36 outline-none dark:text-white" />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Hasta:</span>
            <div className="relative">
              <input type="text" defaultValue="05 / 11 / 2026" className="pl-3 pr-10 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium w-36 outline-none dark:text-white" />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Marca:</span>
            <select className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium w-32 outline-none dark:text-white">
              <option></option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Modelo:</span>
            <select className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium w-48 outline-none dark:text-white">
              <option>Todos los Modelos</option>
            </select>
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meta Global {'>'} 90%</p>
          </div>

          <div 
            onClick={() => handleDetailClick('mtbf')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
          >
            <h3 className="text-xs font-extrabold text-purple-500 uppercase tracking-widest mb-3">MTBF (Confiabilidad)</h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{globalMtbf} hrs</span>
              <History className="w-5 h-5 text-slate-300 dark:text-slate-600 mb-1" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiempo medio entre eventos</p>
          </div>

          <div 
            onClick={() => handleDetailClick('mix_gasto')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-300 transition-colors"
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
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
          >
            <h3 className="text-xs font-extrabold text-teal-500 uppercase tracking-widest mb-3">Confiabilidad de Misión</h3>
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
