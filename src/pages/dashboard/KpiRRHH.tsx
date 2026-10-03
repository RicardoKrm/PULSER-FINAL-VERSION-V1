import React, { useState, useMemo } from 'react';
import { Users, Calendar, Info, X, Clock, CheckCircle, TrendingUp, UserCheck, Briefcase, BarChart3, AlertCircle, Lightbulb, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, LineChart, Line, Tooltip, Legend, ComposedChart
} from 'recharts';
import { useAppContext } from '../../context/AppContext';

export default function KpiRRHH() {
  const [activeDetail, setActiveDetail] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);

  const { ordenesTrabajo, auth } = useAppContext?.() || { ordenesTrabajo: [], auth: null }; // added fallback if useAppContext modifies.

  const {
    kpisObj,
    productividadTecnicosData,
    cargaTrabajoTecnicosData,
    horasEvolucionData,
    detailsData
  } = useMemo(() => {
    const ots = ordenesTrabajo || [];
    let horas_registradas = 0;
    let horas_estandar = 0;
    let ots_finalizadas = 0;
    let ots_atraso = 0;

    const techMap: Record<string, { reales: number; estandar: number; ots: number; ots_tiempo: number }> = {};
    const now = new Date();

    const last12Months = Array.from({length: 12}, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return {
        key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`,
        name: d.toLocaleString('es', { month: 'short' }).substring(0,3).toUpperCase(),
        reales: 0, estandar: 0, disponibles: 0
      };
    });

    ots.forEach(ot => {
       const techName = ot.tecnicoResponsable || ot.externo_nombre || 'Sin Asignar';
       if (!techMap[techName]) techMap[techName] = { reales: 0, estandar: 0, ots: 0, ots_tiempo: 0 };

       let tR = 0;
       if (ot.tiempoTrabajadoSegundos) tR = ot.tiempoTrabajadoSegundos / 3600;
       else if (ot.tfs_minutos) tR = ot.tfs_minutos / 60;
       
       techMap[techName].reales += tR;
       horas_registradas += tR;
       
       let tEst = 0;
       if (ot.tareasRealizadas && ot.tareasRealizadas.length > 0) {
          tEst = ot.tareasRealizadas.reduce((acc, t) => acc + ((t.tarea_estandar?.tiempoEstandarMinutos || t.tiempo_real_minutos || 0) / 60), 0);
       }
       if (tEst === 0 && tR > 0) tEst = tR * 1.05; // 5% better assumption buffer if missing standard table.
       techMap[techName].estandar += tEst;
       horas_estandar += tEst;

       if (['FINALIZADA', 'CERRADA_MECANICO', 'CERRADA_POR_MECANICO'].includes(ot.estado)) {
         ots_finalizadas++;
         techMap[techName].ots++;
         techMap[techName].ots_tiempo++; // mock
       }

       if (ot.estado === 'ABIERTA' || ot.estado === 'EN_PROCESO') {
          if (ot.fechaCreacion) {
            const daysOpen = (now.getTime() - new Date(ot.fechaCreacion).getTime()) / (1000 * 3600 * 24);
            if (daysOpen > 3) ots_atraso++;
          }
       }

       if (ot.fechaCreacion) {
          const d = new Date(ot.fechaCreacion);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
          const m = last12Months.find(x => x.key === monthKey);
          if (m) {
            m.reales += tR;
            m.estandar += tEst;
          }
       }
    });

    const numTech = Object.keys(techMap).filter(k => k !== 'Sin Asignar').length;
    const tecnicos_activos = numTech;

    const productividad = horas_registradas > 0 ? Math.min((horas_estandar / horas_registradas) * 100, 999) : 0;
    const cumplimiento = ots_finalizadas > 0 ? (ots_finalizadas / (ots_finalizadas + ots_atraso)) * 100 : 0;
    
    // DispTotal = total potential hour capacity for these techs
    const dispTotal = Math.max(1, tecnicos_activos * 180 * 2);
    const utilizacion = horas_registradas > 0 ? (horas_registradas / dispTotal) * 100 : 0;

    let prodTech: any[] = [];
    let cargaTech: any[] = [];
    Object.entries(techMap).filter(([k,v]) => k !== 'Sin Asignar').forEach(([k, v]) => {
      const p = v.reales > 0 ? Math.min((v.estandar / v.reales) * 100, 999) : (v.estandar > 0 ? 999 : 0);
      prodTech.push({ name: k, prod: Number(p.toFixed(0)), hrsReal: v.reales, hrsEst: v.estandar });
      cargaTech.push({ name: k, horas: Number(v.reales.toFixed(1)) });
    });

    if (prodTech.length === 0) {
       prodTech = [{ name: 'Sin Datos', prod: 0, hrsReal: 0, hrsEst: 0 }];
       cargaTech = [{ name: 'Sin Datos', horas: 0 }];
    } else {
      prodTech.sort((a,b) => b.prod - a.prod);
      cargaTech.sort((a,b) => b.horas - a.horas);
    }

    const horasEvolucionData = last12Months.slice(-6).map(m => {
      return {
        month: m.name,
        reales: Number(m.reales.toFixed(1)),
        estandar: Number(m.estandar.toFixed(1)),
        disponibles: tecnicos_activos > 0 ? 180 * numTech : 0
      };
    });

    return {
      kpisObj: {
        productividad: Math.round(productividad),
        cumplimiento: ots_finalizadas > 0 ? Math.round(cumplimiento) : 0,
        utilizacion: Math.min(100, Math.round(utilizacion)),
        tecnicos_activos,
        horas_registradas: Number(horas_registradas.toFixed(1)),
        horas_estandar: Number(horas_estandar.toFixed(1)),
        ots_finalizadas,
        ots_atraso
      },
      productividadTecnicosData: prodTech,
      cargaTrabajoTecnicosData: cargaTech,
      horasEvolucionData,
      detailsData: techMap
    };
  }, [ordenesTrabajo]);

  const handleDetailClick = (type: string) => {
    setActiveDetail(type);
  };

  const renderSidebarContent = () => {
    switch (activeDetail) {
      case 'productividad':
        return (
          <>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div className="pr-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Detalle: Productividad</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2">Horas Estándar vs Horas Reales</p>
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
                    Productividad = (Tiempo Estándar Total / Tiempo Real Trabajado) * 100
                  </p>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Técnico</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Estándar (Hrs)</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Reales (Hrs)</th>
                    <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider pb-3">Productividad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {productividadTecnicosData.length > 0 ? (
                    productividadTecnicosData.map((row, idx) => (
                      <tr key={idx} onClick={() => setSelectedWorker(row.name)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-2 font-bold text-slate-700 dark:text-slate-300">{row.name}</td>
                        <td className="py-3 px-2 text-right font-medium text-slate-600 dark:text-slate-400">{Number(row.hrsEst).toFixed(1)}h</td>
                        <td className="py-3 px-2 text-right font-medium text-slate-600 dark:text-slate-400">{Number(row.hrsReal).toFixed(1)}h</td>
                        <td className="py-3 px-2 text-right font-bold text-emerald-500">{row.prod === -1 ? '0%' : `${row.prod}%`}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500 text-xs font-medium">Sin datos registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );

      case 'cumplimiento':
        return (
          <>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div className="pr-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Detalle: Cumplimiento de Plazos</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2">OTs Finalizadas a Tiempo</p>
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
                    Cumplimiento = (OTs Finalizadas a Tiempo / Total OTs Programadas) * 100
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4 mt-4">
                  <div className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/50">
                    <span className="text-sm font-medium text-slate-500">Sin datos registrados en el periodo</span>
                  </div>
              </div>
            </div>
          </>
        );

      case 'utilizacion':
        return (
          <>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div className="pr-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Detalle: Utilización de Recursos</h2>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-2">Tiempo Registrado vs Disp. Total</p>
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
                    Utilización = (Tiempo Real Trabajado / Tiempo Disponible Total) * 100
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4 mt-4">
                  <div className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/50">
                    <span className="text-sm font-medium text-slate-500">Sin datos registrados en el periodo</span>
                  </div>
              </div>
            </div>
          </>
        );

      case 'horas_evolucion':
      case 'productividad_por_tecnico':
      case 'carga_trabajo': {
        const infoMap: Record<string, { title: string, formula: string, desc: string }> = {
          'horas_evolucion': { title: 'Evolución Mensual', formula: 'Hrs Reales vs Hrs Estándar', desc: 'Comportamiento histórico de las horas imputadas en el taller comparadas con las horas teóricas (según manual/histórico).' },
          'productividad_por_tecnico': { title: 'Productividad por Técnico', formula: 'Tiempo Estándar / Tiempo Real (%)', desc: 'Rendimiento individual de cada técnico respecto a los tiempos establecidos para las tareas.' },
          'carga_trabajo': { title: 'Carga de Trabajo por Técnico', formula: 'Total de horas reales imputadas', desc: 'Cantidad de horas reportadas por cada trabajador en el periodo, permite detectar sobrecarga o subutilización.' },
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
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
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
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 mt-6">Desglose de Datos</h4>
                <div className="p-4 text-center border border-slate-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/50">
                  <span className="text-xs font-medium text-slate-500">Sin datos reportados en este periodo</span>
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
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
              <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rendimiento de Técnicos (RRHH)</h1>
              <p className="text-xs font-semibold text-slate-400 tracking-wider mt-1 uppercase">Panel de Productividad y Horas de Taller</p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-green-700 dark:text-green-400 tracking-widest uppercase">Motor Actualizado</span>
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
            <span className="text-xs font-bold text-slate-400 uppercase">Taller:</span>
            <select className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium w-48 outline-none dark:text-white">
              <option>Todos los Talleres</option>
            </select>
          </div>
        </div>

        {/* Top summary cards section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">Técnicos Activos</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{kpisObj.tecnicos_activos}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <UserCheck className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">Horas Registradas</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{kpisObj.horas_registradas}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <Clock className="w-5 h-5 text-sky-500" />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">OTs Finalizadas</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{kpisObj.ots_finalizadas}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">OTs con Atraso</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">{kpisObj.ots_atraso}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <AlertCircle className="w-5 h-5 text-rose-500" />
              </div>
            </div>
        </div>

        {/* 3 Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => handleDetailClick('productividad')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
          >
            <h3 className="text-xs font-extrabold text-emerald-500 uppercase tracking-widest mb-3">Productividad</h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{kpisObj.productividad}%</span>
              <TrendingUp className="w-6 h-6 text-emerald-500 mb-1" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hrs Estándar / Hrs Reales</p>
          </div>

          <div 
            onClick={() => handleDetailClick('cumplimiento')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <h3 className="text-xs font-extrabold text-blue-500 uppercase tracking-widest mb-3">Cumplimiento Plazos</h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{kpisObj.cumplimiento}%</span>
              <CheckCircle className="w-6 h-6 text-blue-500 mb-1" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OTs Cerradas en Tiempo Máximo</p>
          </div>

          <div 
            onClick={() => handleDetailClick('utilizacion')}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
          >
            <h3 className="text-xs font-extrabold text-purple-500 uppercase tracking-widest mb-3">Utilización de Recursos</h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-black text-slate-800 dark:text-slate-100">{kpisObj.utilizacion}%</span>
              <Briefcase className="w-6 h-6 text-purple-500 mb-1" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hrs Reales Trabajadas / Capacidad Total</p>
          </div>
        </div>

        {/* Charts Row 1: Line Chart Evolucion */}
        <div className="grid grid-cols-1 gap-6">
          <div onClick={() => handleDetailClick('horas_evolucion')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <h3 className="text-[14px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tight mb-6 pb-1 border-b-2 border-dotted border-emerald-200 dark:border-emerald-900/50 text-center">Evolución Mensual: Horas Reales vs Estándar vs Disponibles</h3>
            <div className="h-72 w-full pb-8">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={horasEvolucionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '10px' }} iconType="circle" />
                  <Bar dataKey="reales" name="Hrs Reales" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line type="monotone" dataKey="estandar" name="Hrs Estándar" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} />
                  <Line type="stepAfter" dataKey="disponibles" name="Hrs Disponibles" stroke="#ef4444" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Bar Charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div onClick={() => handleDetailClick('productividad_por_tecnico')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
            <h3 className="text-[14px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tight mb-6 pb-1 border-b-2 border-dotted border-emerald-200 dark:border-emerald-900/50 text-center">Productividad por Técnico (%)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productividadTecnicosData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 120]} tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip cursor={{ fill: '#10b981', opacity: 0.1 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="prod" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {
                      productividadTecnicosData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.prod >= 100 ? '#10b981' : entry.prod >= 85 ? '#f59e0b' : '#ef4444'} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div onClick={() => handleDetailClick('carga_trabajo')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <h3 className="text-[14px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-tight mb-6 pb-1 border-b-2 border-dotted border-blue-200 dark:border-blue-900/50 text-center">Carga de Trabajo por Técnico (Hrs)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cargaTrabajoTecnicosData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip cursor={{ fill: '#3b82f6', opacity: 0.1 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="horas" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
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

      {/* Worker Detail Modal */}
      {selectedWorker && (
        (() => { 
          const workerStats = detailsData[selectedWorker];
          const score = workerStats && workerStats.reales > 0 ? Math.min(100, Math.round((workerStats.estandar / workerStats.reales) * 100)) : 0;
          const diagText = score > 100 ? "Sobresaliente. Evaluar promoción o bonificación." : (score > 85 ? "Rendimiento óptimo dentro del estándar esperado." : "Baja eficiencia. Evaluar falta de herramientas o capacitación.");
          const colorScore = score >= 100 ? 'bg-emerald-500' : (score >= 85 ? 'bg-amber-500' : 'bg-rose-500');
          const colorScoreText = score >= 100 ? 'text-emerald-500' : (score >= 85 ? 'text-amber-500' : 'text-rose-500');

          const workerOts = ordenesTrabajo.filter(ot => (ot.tecnicoResponsable || ot.externo_nombre || 'Sin Asignar') === selectedWorker);
          const valProducido = workerStats ? Math.round(workerStats.estandar * 15000) : 0; // mock $15,000 per hour
          const costoReal = workerStats ? Math.round(workerStats.reales * 15000) : 0;
          
          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="p-6 pb-4 flex justify-between items-start border-b border-slate-100 dark:border-slate-800/50">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-2xl font-black shadow-sm border border-blue-100 dark:border-blue-800/50">
                      {selectedWorker.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{selectedWorker}</h2>
                      <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase mt-1">Ficha de Desempeño Técnico</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedWorker(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 pt-5 space-y-6 overflow-y-auto">
                  
                  {/* Top Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/50 rounded-xl p-4 flex flex-col justify-center">
                      <h3 className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1">Total OTs</h3>
                      <span className="text-2xl font-black text-sky-600 dark:text-sky-400">{workerOts.length}</span>
                    </div>
                    <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 border border-fuchsia-100 dark:border-fuchsia-800/50 rounded-xl p-4 flex flex-col justify-center">
                      <h3 className="text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-widest mb-1">Hrs Registradas</h3>
                      <span className="text-2xl font-black text-fuchsia-600 dark:text-fuchsia-400">{workerStats?.reales.toFixed(1) || 0} h</span>
                    </div>
                  </div>

                  {/* Score Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Score Confiabilidad</h3>
                      <span className={`text-3xl font-black ${colorScoreText}`}>{score}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mb-4 relative z-10">
                      <div className={`h-full ${colorScore} rounded-full transition-all duration-1000`} style={{ width: `${Math.min(score, 100)}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center italic relative z-10">{diagText}</p>
                  </div>

                  {/* Análises */}
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Análisis del Periodo</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50 rounded-xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Valor Producido (Aprox HH)</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-500">$ {valProducido.toLocaleString('es-CL')}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 border border-slate-200 dark:border-slate-700/50 dark:bg-slate-800/50 rounded-xl bg-slate-50">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Costo Real Imputado</span>
                        <span className="text-sm font-black text-rose-600 dark:text-rose-500">$ {costoReal.toLocaleString('es-CL')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnóstico */}
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900 dark:text-amber-200 leading-snug">
                      <span className="font-bold">Nota Administrativa:</span> Los valores de costo son una estimación basada en $15,000 CLP / Hora.
                    </p>
                  </div>

                  {/* Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          <th className="text-left font-bold text-[10px] uppercase text-slate-400 tracking-wider py-3 px-4">OT</th>
                          <th className="text-left font-bold text-[10px] uppercase text-slate-400 tracking-wider py-3 px-4">Equipo</th>
                          <th className="text-right font-bold text-[10px] uppercase text-slate-400 tracking-wider py-3 px-4">Hrs/Est.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {workerOts.length > 0 ? (
                           workerOts.slice(0, 5).map(ot => {
                             let tR = 0;
                             if (ot.tiempoTrabajadoSegundos) tR = ot.tiempoTrabajadoSegundos / 3600;
                             else if (ot.tfs_minutos) tR = ot.tfs_minutos / 60;
                             const color = tR > 0 ? 'text-emerald-500' : 'text-slate-400';
                             return (
                               <tr key={ot.id}>
                                  <td className="py-2 px-4 font-medium text-slate-700 dark:text-slate-300">{ot.folio}</td>
                                  <td className="py-2 px-4 text-slate-600 dark:text-slate-400">{ot.vehiculoId?.substring(0, 8)}</td>
                                  <td className={`py-2 px-4 text-right ${color} font-bold`}>{tR > 0 ? tR.toFixed(1) : '-'}</td>
                               </tr>
                             );
                           })
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-6 px-4 text-center text-slate-500 text-xs font-medium">Sin registros recientes</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            </div>
          );
        })()
      )}

    </div>
  );
}
