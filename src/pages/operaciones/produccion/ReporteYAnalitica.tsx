import React, { useState, useEffect } from 'react';
import { PenTool, Send, CheckCircle2, TrendingUp, X, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GlobalStats } from '../../../contexts/ProduccionContext';

interface Props {
  onReporteProduccion: (ext: number, mol: number, stock: number, fecha: string, hora: string) => void;
  onReporteTransporte: (camion: string, chofer: string, vuelta: number, ton: number, tipo: string, suceso: string, notas: string, fecha: string, hora: string) => void;
  stats: GlobalStats;
}

export default function ReporteYAnalitica({ onReporteProduccion, onReporteTransporte, stats }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [periodo, setPeriodo] = useState('Semanal');
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

  // Chart data
  const [chartDataSemanal, setChartDataSemanal] = useState([
    { name: 'Lunes', ext: 4200, mol: 3100, desp: 2500 },
    { name: 'Martes', ext: 4500, mol: 3200, desp: 2600 },
    { name: 'Miércoles', ext: 4100, mol: 2900, desp: 2400 },
    { name: 'Jueves', ext: 4800, mol: 3400, desp: 2800 },
    { name: 'Viernes', ext: 4600, mol: 3300, desp: 2700 },
    { name: 'Sábado', ext: 4300, mol: 3000, desp: 2300 },
    { name: 'Domingo', ext: 4850, mol: 3200, desp: 2650 },
  ]);

  const [chartDataMensual] = useState([
    { name: 'Semana 1', ext: 28000, mol: 22000, desp: 18000 },
    { name: 'Semana 2', ext: 31000, mol: 24000, desp: 19000 },
    { name: 'Semana 3', ext: 30000, mol: 23500, desp: 18500 },
    { name: 'Semana 4', ext: 32000, mol: 25000, desp: 20000 },
  ]);

  const [chartDataDiario] = useState([
    { name: 'Turno 1 (00-08)', ext: 1500, mol: 1000, desp: 800 },
    { name: 'Turno 2 (08-16)', ext: 1800, mol: 1200, desp: 900 },
    { name: 'Turno 3 (16-24)', ext: 1550, mol: 1000, desp: 950 },
  ]);

  const currentData = periodo === 'Diario' ? chartDataDiario : periodo === 'Semanal' ? chartDataSemanal : chartDataMensual;

  useEffect(() => {
    const today = new Date();
    setFecha(today.toISOString().substring(0, 10));
    setHora(`${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (area === 'produccion') {
      const ext = parseFloat(prodExt) || 0;
      const mol = parseFloat(prodMol) || 0;
      const stock = parseFloat(prodStock) || 0;
      onReporteProduccion(ext, mol, stock, fecha, hora);
      
      setChartDataSemanal(prev => {
        const newData = [...prev];
        const last = newData[newData.length - 1];
        newData[newData.length - 1] = { ...last, ext: last.ext + ext, mol: last.mol + mol };
        return newData;
      });
      setProdExt(''); setProdMol(''); setProdStock('');
    } else {
      const ton = parseFloat(transTon) || 0;
      const vuelta = parseInt(transVuelta) || 1;
      onReporteTransporte(transCamion || 'TR-X', transChofer || 'Operario', vuelta, ton, transTipo, transSuceso, notas, fecha, hora);
      
      setChartDataSemanal(prev => {
        const newData = [...prev];
        const last = newData[newData.length - 1];
        newData[newData.length - 1] = { ...last, desp: last.desp + ton };
        return newData;
      });
      setTransCamion(''); setTransVuelta(''); setTransTon(''); setTransChofer(''); setNotas('');
    }

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setIsModalOpen(false);
    }, 2000);
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
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pr-2 overflow-hidden transition-colors">
                <div className="bg-slate-100 dark:bg-slate-800 px-2 py-1.5 h-full flex items-center justify-center border-r border-slate-200 dark:border-slate-800">
                  <Filter className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                </div>
                <select 
                  value={periodo} 
                  onChange={e => {
                    setPeriodo(e.target.value);
                    setSelectedDataIndex(null);
                  }} 
                  className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none py-1.5"
                >
                  <option value="Diario">Vista Diaria</option>
                  <option value="Semanal">Vista Semanal</option>
                  <option value="Mensual">Vista Mensual</option>
                </select>
              </div>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <PenTool className="w-3 h-3" /> Nuevo Reporte Diario
              </button>
            </div>
          </div>

          <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 h-80 transition-colors">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} onClick={(data) => {
                if (data && data.activeTooltipIndex !== undefined) {
                  setSelectedDataIndex(data.activeTooltipIndex);
                }
              }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" className="opacity-30" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--tw-colors-slate-900)', borderColor: 'var(--tw-colors-slate-800)', color: 'white', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="ext" name="Extraído Rajo (Ton)" fill="#f59e0b" radius={[4, 4, 0, 0]} className="cursor-pointer" />
                <Bar dataKey="mol" name="Molido Planta (Ton)" fill="#10b981" radius={[4, 4, 0, 0]} className="cursor-pointer" />
                <Bar dataKey="desp" name="Despachado Puerto (Ton)" fill="#3b82f6" radius={[4, 4, 0, 0]} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {selectedDataIndex !== null && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
              <div>
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">
                  Detalle: {currentData[selectedDataIndex].name}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Desglose numérico del periodo seleccionado en el gráfico.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">Extracción Rajo</span>
                  <span className="font-black text-amber-600 dark:text-amber-500">{currentData[selectedDataIndex].ext.toLocaleString()} T</span>
                </div>
                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">Molienda Planta</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-500">{currentData[selectedDataIndex].mol.toLocaleString()} T</span>
                </div>
                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold mb-0.5">Despacho Puerto</span>
                  <span className="font-black text-blue-600 dark:text-blue-500">{currentData[selectedDataIndex].desp.toLocaleString()} T</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs transition-colors">
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg transition-colors cursor-pointer hover:border-emerald-500/50">
            <span className="block text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">Mantenimiento</span>
            <span className="text-sm font-black text-slate-900 dark:text-white mt-1 transition-colors">92.5%</span>
            <p className="text-[8px] text-emerald-600 dark:text-emerald-400 mt-0.5">Disp. Mecánica</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg transition-colors cursor-pointer hover:border-emerald-500/50">
            <span className="block text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">Humedad Sal</span>
            <span className="text-sm font-black text-slate-900 dark:text-white mt-1 transition-colors">0.12%</span>
            <p className="text-[8px] text-emerald-600 dark:text-emerald-400 mt-0.5">Bajo el límite (0.2%)</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg transition-colors cursor-pointer hover:border-emerald-500/50">
            <span className="block text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">Pureza Química</span>
            <span className="text-sm font-black text-slate-900 dark:text-white mt-1 transition-colors">99.4%</span>
            <p className="text-[8px] text-emerald-600 dark:text-emerald-400 mt-0.5">Grado Industrial</p>
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

