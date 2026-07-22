import React, { useState, useEffect, useMemo } from 'react';
import { PenTool, Send, CheckCircle2, TrendingUp, X, Filter, Calendar as CalendarIcon, User as UserIcon } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GlobalStats } from '../../../contexts/ProduccionContext';
import { supabase } from '../../../lib/supabase';

interface Props {
  onReporteProduccion: (ext: number, mol: number, stock: number, fecha: string, hora: string) => void;
  onReporteTransporte: (camion: string, chofer: string, vuelta: number, ton: number, tipo: string, suceso: string, notas: string, fecha: string, hora: string) => void;
  stats: GlobalStats;
}

export default function ReporteYAnalitica({ onReporteProduccion, onReporteTransporte, stats }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vista, setVista] = useState<'chofer' | 'camion'>('chofer');
  const [selectedDataIndex, setSelectedDataIndex] = useState<number | null>(null);

  const [area, setArea] = useState('produccion');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [notas, setNotas] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Produccion 
  const [prodExt, setProdExt] = useState('');
  const [prodMol, setProdMol] = useState('');
  const [prodStock, setProdStock] = useState('');

  // Transporte
  const [transCamion, setTransCamion] = useState('');
  const [transVuelta, setTransVuelta] = useState('');
  const [transTon, setTransTon] = useState('');
  const [transChofer, setTransChofer] = useState('');
  const [transTipo, setTransTipo] = useState('Sal Gruesa');
  const [transSuceso, setTransSuceso] = useState('Normal');

  // Filtros
  const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });
  const [plazo, setPlazo] = useState<string>('todos');
  const [choferFiltro, setChoferFiltro] = useState<string>('todos');

  // Chart data
  const [rawData, setRawData] = useState<any[]>([]);
  const [chartDataChofer, setChartDataChofer] = useState<{name: string, vueltas: number, tonelaje: number, choferes?: Record<string, number>}[]>([]);
  const [chartDataCamion, setChartDataCamion] = useState<{name: string, vueltas: number, tonelaje: number, choferes?: Record<string, number>}[]>([]);
  const [choferesDisponibles, setChoferesDisponibles] = useState<string[]>([]);

  // KPIs
  const [kpiCamion, setKpiCamion] = useState<{ nombre: string; freq: number }>({ nombre: '-', freq: 0 });
  const [kpiTonDia, setKpiTonDia] = useState<number>(0);
  const [kpiVueltasDia, setKpiVueltasDia] = useState<number>(0);

  const currentData = vista === 'chofer' ? chartDataChofer : chartDataCamion;

  const handlePlazoChange = (nuevoPlazo: string) => {
    setPlazo(nuevoPlazo);
    
    const hoy = new Date();
    let start = '';
    let end = '';

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (nuevoPlazo === 'hoy') {
      start = formatDate(hoy);
      end = formatDate(hoy);
    } else if (nuevoPlazo === 'ayer') {
      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);
      start = formatDate(ayer);
      end = formatDate(ayer);
    } else if (nuevoPlazo === 'esta_semana') {
      const sieteDiasAtras = new Date(hoy);
      sieteDiasAtras.setDate(hoy.getDate() - 7);
      start = formatDate(sieteDiasAtras);
      end = formatDate(hoy);
    } else if (nuevoPlazo === 'este_mes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      start = formatDate(inicioMes);
      end = formatDate(hoy);
    } else if (nuevoPlazo === 'mes_pasado') {
      const inicioMesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const finMesPasado = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      start = formatDate(inicioMesPasado);
      end = formatDate(finMesPasado);
    } else if (nuevoPlazo === 'este_ano') {
      const inicioAno = new Date(hoy.getFullYear(), 0, 1);
      start = formatDate(inicioAno);
      end = formatDate(hoy);
    }

    setDateRange({ start, end });
  };

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('produccion_registro_diario')
        .select('*');
        
      if (error || !data) return;
      setRawData(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const today = new Date();
    setFecha(today.toISOString().substring(0, 10));
    setHora(`${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`);
  }, []);

  useEffect(() => {
    // Process data when rawData or filters change
    if (!rawData.length) return;

    let filteredData = [...rawData];

    // Filter by period
    if (dateRange.start || dateRange.end) {
      filteredData = filteredData.filter(row => {
        if (!row.fecha) return false;
        
        // Comparar directamente los strings (YYYY-MM-DD) es seguro y evita problemas de zona horaria
        if (dateRange.start && row.fecha < dateRange.start) return false;
        if (dateRange.end && row.fecha > dateRange.end) return false;
        
        return true;
      });
    }

    // Filter by chofer
    if (choferFiltro !== 'todos') {
      filteredData = filteredData.filter(row => row.chofer === choferFiltro);
    }

    const choferMap: Record<string, {vueltas: number, tonelaje: number}> = {};
    const camionMap: Record<string, {vueltas: number, tonelaje: number, choferes: Record<string, number>}> = {};
    const uniqueChoferes = new Set<string>();
    
    // Always build full unique chofer list from rawData
    rawData.forEach(row => {
      const chofer = row.chofer;
      if (chofer && chofer !== '-') uniqueChoferes.add(chofer);
    });
    setChoferesDisponibles(Array.from(uniqueChoferes).sort());

    filteredData.forEach(row => {
        const ton = row.tonelaje || 0;
        const vueltas = row.vueltas || 0;
        const chofer = row.chofer || 'Desconocido';
        const camion = row.camion || 'Desconocido';
        
        if (chofer && chofer !== '-') {
            if (!choferMap[chofer]) choferMap[chofer] = { vueltas: 0, tonelaje: 0 };
            choferMap[chofer].vueltas += vueltas;
            choferMap[chofer].tonelaje += ton;
        }
        
        if (camion && camion !== '-') {
            if (!camionMap[camion]) camionMap[camion] = { vueltas: 0, tonelaje: 0, choferes: {} };
            camionMap[camion].vueltas += vueltas;
            camionMap[camion].tonelaje += ton;
        if (chofer && chofer !== "-") {
            camionMap[camion].choferes[chofer] = (camionMap[camion].choferes[chofer] || 0) + ton;
        }
        }
    });

    // If chofer filter is applied, grouping by chofer will only have 1 bar.
    // In this specific view, we might want to group by Date instead if a single chofer is selected!
    // But the UI requires 'name' (which can be Date or Chofer).
    if (vista === 'chofer' && choferFiltro !== 'todos') {
      // Group by Date for that specific chofer
      const dateMap: Record<string, {vueltas: number, tonelaje: number}> = {};
      filteredData.forEach(row => {
        const dateStr = row.fecha || 'Sin fecha';
        const ton = row.tonelaje || 0;
        const vueltas = row.vueltas || 0;
        if (!dateMap[dateStr]) dateMap[dateStr] = { vueltas: 0, tonelaje: 0 };
        dateMap[dateStr].vueltas += vueltas;
        dateMap[dateStr].tonelaje += ton;
      });
      const dateArr = Object.entries(dateMap).map(([name, vals]) => ({name, ...vals}));
      dateArr.sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
      setChartDataChofer(dateArr);
    } else {
      const choferArr = Object.entries(choferMap).map(([name, vals]) => ({name, ...vals}));
      choferArr.sort((a, b) => b.tonelaje - a.tonelaje);
      setChartDataChofer(choferArr);
    }

    const camionArr = Object.entries(camionMap).map(([name, vals]) => ({name, ...vals}));
    camionArr.sort((a, b) => b.tonelaje - a.tonelaje);
    setChartDataCamion(camionArr);

    // Compute KPIs
    const freqCamion: Record<string, number> = {};
    const dateSet = new Set<string>();
    let sumTon = 0;
    let sumVueltas = 0;

    filteredData.forEach(row => {
      if (row.camion && row.camion !== '-') {
        freqCamion[row.camion] = (freqCamion[row.camion] || 0) + 1;
      }
      if (row.fecha) {
        dateSet.add(row.fecha);
      }
      sumTon += (row.tonelaje || 0);
      sumVueltas += (row.vueltas || 0);
    });

    let maxC = '-';
    let maxF = 0;
    Object.entries(freqCamion).forEach(([c, f]) => {
      if (f > maxF) {
        maxF = f;
        maxC = c;
      }
    });
    setKpiCamion({ nombre: maxC, freq: maxF });

    const totalDays = dateSet.size || 1;
    setKpiTonDia(sumTon / totalDays);
    setKpiVueltasDia(sumVueltas / totalDays);

    setSelectedDataIndex(null); // Reset selection on filter change

  }, [rawData, dateRange, choferFiltro, vista]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (area === 'produccion') {
        const ext = parseFloat(prodExt) || 0;
        const mol = parseFloat(prodMol) || 0;
        const stock = parseFloat(prodStock) || 0;
        onReporteProduccion(ext, mol, stock, fecha, hora);
        
        // Optionally store to a different table for production if needed, but for now we just update charts.
        // Or we can save to the same table but without camion.
        await supabase.from('produccion_registro_diario').insert({
           fecha: fecha,
           turno: parseInt(hora.split(':')[0]) >= 12 ? 'Noche' : 'Día',
           camion: '-',
           chofer: '-',
           tonelaje: 0,
           vueltas: 0,
           petroleo: null,
           novedades: `Producción - Ext: ${ext}, Mol: ${mol}, Stock: ${stock}. ${notas}`
        });

        setProdExt(''); setProdMol(''); setProdStock('');
      } else {
        const ton = parseFloat(transTon) || 0;
        const vuelta = parseInt(transVuelta) || 1;
        onReporteTransporte(transCamion || 'TR-X', transChofer || 'Operario', vuelta, ton, transTipo, transSuceso, notas, fecha, hora);
        
        await supabase.from('produccion_registro_diario').insert({
           fecha: fecha,
           turno: parseInt(hora.split(':')[0]) >= 12 ? 'Noche' : 'Día',
           camion: transCamion || 'TR-X',
           chofer: transChofer || 'Operario',
           tonelaje: ton,
           vueltas: vuelta,
           petroleo: null,
           novedades: `${transSuceso} - ${transTipo}. ${notas}`
        });

        setTransCamion(''); setTransVuelta(''); setTransTon(''); setTransChofer(''); setNotas('');
      }

      await fetchData(); // Refresh charts with new data
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setIsModalOpen(false);
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert("Error al guardar: " + err.message);
    }
  };

  return (
    <section className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl flex flex-col justify-between transition-colors">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase flex items-center gap-1.5 transition-colors">
                <TrendingUp className="w-4 h-4 text-amber-500" /> Análisis de Producción y Transporte
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Comparación de Toneladas Producidas vs. Despachadas. Haz clic en las barras para ver detalles.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors">
                <select
                  value={plazo}
                  onChange={(e) => handlePlazoChange(e.target.value)}
                  className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none py-1.5 px-3"
                >
                  <option value="hoy">Hoy</option>
                  <option value="ayer">Ayer</option>
                  <option value="esta_semana">Últimos 7 días</option>
                  <option value="este_mes">Este Mes</option>
                  <option value="mes_pasado">Mes Pasado</option>
                  <option value="este_ano">Este Año</option>
                  <option value="todos">Todos</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pr-2 overflow-hidden transition-colors">
                <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1.5 h-full flex items-center justify-center border-r border-slate-200 dark:border-slate-800">
                  <CalendarIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="flex items-center">
                  <input
                    type="date"
                    title="Fecha de inicio"
                    value={dateRange.start}
                    onChange={e => {
                      setDateRange({ ...dateRange, start: e.target.value });
                      setPlazo('personalizado');
                    }}
                    className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none py-1.5 w-24"
                  />
                  <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold px-1">-</span>
                  <input
                    type="date"
                    title="Fecha de fin"
                    value={dateRange.end}
                    onChange={e => {
                      setDateRange({ ...dateRange, end: e.target.value });
                      setPlazo('personalizado');
                    }}
                    className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none py-1.5 w-24"
                  />
                  {(dateRange.start || dateRange.end) && (
                    <button 
                      onClick={() => {
                        setDateRange({start: '', end: ''});
                        setPlazo('todos');
                      }} 
                      className="ml-1 p-0.5 text-slate-400 hover:text-red-500 rounded-full"
                      title="Limpiar fechas"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pr-2 overflow-hidden transition-colors">
                <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1.5 h-full flex items-center justify-center border-r border-slate-200 dark:border-slate-800">
                  <UserIcon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                </div>
                <select 
                  value={choferFiltro} 
                  onChange={e => setChoferFiltro(e.target.value)} 
                  className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none py-1.5"
                >
                  <option value="todos">Todos los Choferes</option>
                  {choferesDisponibles.map(chofer => (
                    <option key={chofer} value={chofer}>{chofer}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pr-2 overflow-hidden transition-colors">
                <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1.5 h-full flex items-center justify-center border-r border-slate-200 dark:border-slate-800">
                  <Filter className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                </div>
                <select 
                  value={vista} 
                  onChange={e => {
                    setVista(e.target.value as 'chofer' | 'camion');
                    setSelectedDataIndex(null);
                  }} 
                  className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none py-1.5"
                >
                  <option value="chofer">Por Chofer</option>
                  <option value="camion">Por Camión</option>
                </select>
              </div>
            </div>
          </div>

          <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 h-80 transition-colors">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={currentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} onClick={(data) => {
                if (data && data.activeTooltipIndex !== undefined) {
                  setSelectedDataIndex(data.activeTooltipIndex);
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" className="opacity-30" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-lg shadow-md text-xs">
                          <p className="font-bold mb-2 text-slate-800 dark:text-slate-100">{label}</p>
                          <div className="flex flex-col gap-1">
                            <p className="text-blue-600 dark:text-blue-400 font-semibold">Tonelaje: {data.tonelaje?.toFixed(2)} T</p>
                            <p className="text-amber-500 font-semibold">Vueltas: {data.vueltas}</p>
                            {data.choferes && Object.keys(data.choferes).length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <p className="font-semibold text-slate-600 dark:text-slate-300 mb-1">Choferes:</p>
                                {Object.entries(data.choferes).sort((a: any, b: any) => b[1] - a[1]).map(([chofer, ton]: any) => (
                                  <p key={chofer} className="text-slate-500 dark:text-slate-400 flex justify-between gap-4">
                                    <span>• {chofer}</span><span className="font-medium text-slate-700 dark:text-slate-200">{ton.toFixed(2)} T</span>
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar yAxisId="left" dataKey="tonelaje" name="Tonelaje (Ton)" fill="#3b82f6" radius={[4, 4, 0, 0]} className="cursor-pointer" />
                <Line yAxisId="right" type="monotone" dataKey="vueltas" name="Vueltas" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} className="cursor-pointer" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {selectedDataIndex !== null && currentData[selectedDataIndex] && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
              <div>
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider mb-1">
                  Detalle: {currentData[selectedDataIndex].name}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Desglose del rendimiento para el registro seleccionado.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">Tonelaje Transportado</span>
                  <span className="font-black text-blue-600 dark:text-blue-500">{currentData[selectedDataIndex].tonelaje.toLocaleString('es-CL')} T</span>
                </div>
                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">Vueltas Realizadas</span>
                  <span className="font-black text-amber-600 dark:text-amber-500">{currentData[selectedDataIndex].vueltas} Vueltas</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs transition-colors">
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg transition-colors cursor-pointer hover:border-emerald-500/50">
            <span className="block text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">Camión Frecuente</span>
            <span className="text-sm font-black text-slate-900 dark:text-white mt-1 transition-colors">{kpiCamion.nombre}</span>
            <p className="text-[8px] text-emerald-600 dark:text-emerald-400 mt-0.5">{kpiCamion.freq} registros asociados</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg transition-colors cursor-pointer hover:border-emerald-500/50">
            <span className="block text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">Promedio Toneladas / Día</span>
            <span className="text-sm font-black text-slate-900 dark:text-white mt-1 transition-colors">{Math.round(kpiTonDia).toLocaleString('es-CL')} T</span>
            <p className="text-[8px] text-emerald-600 dark:text-emerald-400 mt-0.5">En el periodo seleccionado</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg transition-colors cursor-pointer hover:border-emerald-500/50">
            <span className="block text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">Promedio Vueltas / Día</span>
            <span className="text-sm font-black text-slate-900 dark:text-white mt-1 transition-colors">{Math.round(kpiVueltasDia * 10) / 10}</span>
            <p className="text-[8px] text-emerald-600 dark:text-emerald-400 mt-0.5">En el periodo seleccionado</p>
          </div>
        </div>
      </div>

      {/* Modal Reporte */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase flex items-center gap-1.5 transition-colors">
                  <PenTool className="w-4 h-4 text-amber-500" /> Reporte Diario de Operaciones
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Ingreso integrado con fecha, hora, e incidencias.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">Área de Reportabilidad</label>
                  <select value={area} onChange={e => setArea(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors">
                    <option value="produccion">Producción (Extracción / Planta)</option>
                    <option value="transporte">Logística (Despacho Camión a Puerto)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Fecha Registro</label>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors" required />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Hora Registro</label>
                    <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors" required />
                  </div>
                </div>

                {area === 'produccion' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Toneladas Extraídas</label>
                        <input type="number" value={prodExt} onChange={e => setProdExt(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors" placeholder="Ej: 1200" required />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Toneladas Molidas</label>
                        <input type="number" value={prodMol} onChange={e => setProdMol(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors" placeholder="Ej: 850" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Nivel Stock (Acopio)</label>
                      <input type="number" value={prodStock} onChange={e => setProdStock(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors" placeholder="Ej: 15400" required />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">ID Camión</label>
                        <input type="text" value={transCamion} onChange={e => setTransCamion(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors" placeholder="TR-15" required />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Nº Vuelta</label>
                        <input type="number" min="1" max="10" value={transVuelta} onChange={e => setTransVuelta(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors" placeholder="1" required />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Toneladas</label>
                        <input type="number" value={transTon} onChange={e => setTransTon(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors" placeholder="32" required />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Chofer asignado</label>
                        <input type="text" value={transChofer} onChange={e => setTransChofer(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors" placeholder="Nombre" required />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Tipo de Sal</label>
                        <select value={transTipo} onChange={e => setTransTipo(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors">
                          <option value="Sal Gruesa">Sal Gruesa (Exportación)</option>
                          <option value="Sal Fina">Sal Fina Industrial</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Reporte de Suceso</label>
                      <select value={transSuceso} onChange={e => setTransSuceso(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors">
                        <option value="Normal">Normal (En Tránsito óptimo)</option>
                        <option value="Panne Mecánica">Panne Mecánica en Ruta</option>
                        <option value="Panne Eléctrica">Panne Eléctrica en Unidad</option>
                        <option value="Espera de Carguío">Demora / Espera de Carguío</option>
                        <option value="Condiciones Climáticas">Detención Climática</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Notas de Turno</label>
                  <textarea value={notas} onChange={e => setNotas(e.target.value)} className="w-full h-16 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-medium text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none transition-colors" placeholder="Indicar novedades..."></textarea>
                </div>

                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-500/20">
                  <Send className="w-4 h-4" /> Enviar Reporte Técnico a Gerencia
                </button>
                {showToast && (
                  <div className="mt-3 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs p-2.5 rounded-lg text-center font-bold animate-pulse flex items-center justify-center gap-2 transition-colors">
                    <CheckCircle2 className="w-4 h-4" /> ¡Reporte recibido e integrado!
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

