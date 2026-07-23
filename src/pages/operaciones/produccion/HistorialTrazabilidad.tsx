import React, { useState } from 'react';
import { History, FilterX, TriangleAlert } from 'lucide-react';

interface Props {
  history: any[];
}

export default function HistorialTrazabilidad({ history }: Props) {
  const [fFecha, setFFecha] = useState('');
  const [fMes, setFMes] = useState('Todos');
  const [fUnidad, setFUnidad] = useState('');
  const [fArea, setFArea] = useState('Todos');

  const filteredHistory = history.filter(row => {
    if (fFecha && row.fecha !== fFecha) return false;
    if (fMes !== 'Todos') {
      const monthStr = row.fecha?.split('-')[1];
      if (monthStr !== fMes) return false;
    }
    if (fUnidad && !row.unidad?.toLowerCase().includes(fUnidad.toLowerCase())) return false;
    if (fArea !== 'Todos' && row.area !== fArea) return false;
    return true;
  });

  const resetFilters = () => {
    setFFecha('');
    setFMes('Todos');
    setFUnidad('');
    setFArea('Todos');
  };

  const getBadgeClass = (suceso: string) => {
    if (!suceso) return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (suceso.includes("Panne")) return "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse";
    if (suceso.includes("Espera") || suceso.includes("Demora")) return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl transition-colors">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
              <History className="w-5 h-5 text-amber-500" /> Historial de Trazabilidad y Reportes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Verifica quién y qué se está reportando desde Mina y Transporte.</p>
          </div>
          <button onClick={resetFilters} className="text-xs font-semibold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
            <FilterX className="w-4 h-4" /> Reestablecer Filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Filtrar por Fecha</label>
          <input type="date" value={fFecha} onChange={e => setFFecha(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Filtrar por Mes</label>
          <select value={fMes} onChange={e => setFMes(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors">
            <option value="Todos">Todos los meses</option>
            <option value="05">Mayo</option>
            <option value="06">Junio</option>
            <option value="07">Julio</option>
            <option value="08">Agosto</option>
            <option value="09">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Área (Mina/Transporte)</label>
          <select value={fArea} onChange={e => setFArea(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors">
            <option value="Todos">Todas las Áreas</option>
            <option value="Mina">Mina</option>
            <option value="Transporte">Transporte</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Búsqueda por Unidad</label>
          <input type="text" value={fUnidad} onChange={e => setFUnidad(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors" placeholder="Ej: TR-05" />
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl transition-colors">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 transition-colors">
            <tr>
              <th className="py-3 px-4 w-32">Fecha / Hora</th>
              <th className="py-3 px-4">Área</th>
              <th className="py-3 px-4">Supervisor</th>
              <th className="py-3 px-4">Unidad</th>
              <th className="py-3 px-4">Chofer/Operador</th>
              <th className="py-3 px-4">Tonelaje</th>
              <th className="py-3 px-4">Suceso/Turno</th>
              <th className="py-3 px-4 hidden lg:table-cell">Notas</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((row, i) => (
              <tr key={i} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                  {row.fecha} <span className="text-slate-500 text-[10px] font-medium ml-1">{row.hora}</span>
                </td>
                <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{row.area}</td>
                <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-500 whitespace-nowrap">{row.supervisor}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.unidad}</td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.chofer}</td>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">{row.toneladas} T</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getBadgeClass(row.suceso)}`}>
                    {row.suceso}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate hidden lg:table-cell" title={row.notas}>
                  {row.notas}
                </td>
              </tr>
            ))}
            {filteredHistory.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-500">No se encontraron reportes con estos filtros.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-3 flex justify-between items-center text-[11px] text-slate-500 font-bold">
        <span>Mostrando {filteredHistory.length} de {history.length} reportes</span>
        <span className="text-amber-500 flex items-center gap-1.5"><TriangleAlert className="w-3 h-3" /> Trazabilidad en tiempo real</span>
      </div>
    </section>
  );
}
