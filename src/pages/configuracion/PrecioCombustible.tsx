import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Plus, Calendar, TrendingUp, TrendingDown, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import Swal from 'sweetalert2';

interface HistorialPrecio {
  id: string;
  fecha: string;
  tipo: string;
  precio: number;
  usuario: string;
  variacion: number;
}

export default function PrecioCombustible() {
  const [precios, setPrecios] = useState<HistorialPrecio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [fechaVigencia, setFechaVigencia] = useState(new Date().toISOString().split('T')[0]);
  const [tipoCombustible, setTipoCombustible] = useState('Diésel');
  const [precioLitro, setPrecioLitro] = useState<number | ''>('');

  const { currentCompany, currentUser } = useCompany();

  useEffect(() => {
    fetchPrecios();
  }, [currentCompany]);

  const fetchPrecios = async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('log_actividad')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .eq('accion', 'PRECIO_COMBUSTIBLE')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const parsedPrecios = data.map(log => {
          try {
            const detalles = JSON.parse(log.detalles || '{}');
            return {
              id: log.id,
              fecha: detalles.vigencia || log.created_at.split('T')[0],
              tipo: detalles.tipo || 'Desconocido',
              precio: Number(detalles.precio) || 0,
              usuario: detalles.usuario || 'Sistema',
              variacion: Number(detalles.variacion) || 0
            };
          } catch (e) {
             return null;
          }
        }).filter(Boolean) as HistorialPrecio[];

        setPrecios(parsedPrecios.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()));
      }
    } catch (error) {
      console.error('Error fetching precios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrecios = precios.filter(p => 
    p.fecha.includes(searchTerm) ||
    p.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !fechaVigencia || !tipoCombustible || !precioLitro) return;

    try {
      // Calculate variation based on previous price of SAME type
      const lastPriceOfType = precios.find(p => p.tipo === tipoCombustible)?.precio || Number(precioLitro);
      const variacion = Number(precioLitro) - lastPriceOfType;

      const userName = currentUser?.email?.split('@')[0] || 'Administrador';

      const logData = {
        empresa_id: currentCompany.id,
        usuario_id: currentUser?.id, // Note: might be null if using full custom users, but fallback will ignore it if so
        accion: 'PRECIO_COMBUSTIBLE',
        modulo: 'configuracion',
        detalles: JSON.stringify({
          precio: Number(precioLitro),
          tipo: tipoCombustible,
          vigencia: fechaVigencia,
          variacion: variacion,
          usuario: userName
        })
      };

      const { error } = await supabase.from('log_actividad').insert([logData]);
      if (error) throw error;

      Swal.fire({
        title: '¡Guardado!', 
        text: 'El precio del combustible ha sido actualizado exitosamente.', 
        icon: 'success',
        confirmButtonColor: '#4f46e5'
      });
      
      setIsModalOpen(false);
      setFechaVigencia(new Date().toISOString().split('T')[0]);
      setPrecioLitro('');
      fetchPrecios();
    } catch (err: any) {
      Swal.fire('Error', err.message || 'No se pudo guardar el precio.', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-amber-500" />
            Precio de Combustible
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-sm">
            Gestión y seguimiento histórico de precios por litro para estimaciones y costeo operativo.
          </p>
        </div>
        
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 font-bold px-6 bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
        >
          <Plus className="w-5 h-5" /> Actualizar Precio
        </Button>
      </div>

      {/* Main KPI View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Top card showing current price */}
         <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
            <h3 className="text-sm font-black text-slate-400 tracking-widest uppercase mb-6">Precio Actual (Diésel)</h3>
            <div className="flex items-baseline gap-2 mb-2">
               <span className="text-5xl font-black text-slate-800 dark:text-slate-100">${precios[0]?.precio || 0}</span>
               <span className="text-lg font-bold text-slate-500">/ Litro</span>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-sm font-bold bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
               <Calendar className="w-4 h-4 text-slate-400" />
               <span className="text-slate-600 dark:text-slate-300">Vigente desde: {new Date(precios[0]?.fecha || new Date()).toLocaleDateString('es-ES')}</span>
            </div>
         </div>

         {/* Second Card with stats/trends */}
         <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
           <h3 className="text-sm font-black text-slate-400 tracking-widest uppercase mb-4">Métricas y Tendencias</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex flex-col justify-center">
                 <span className="text-xs font-bold text-slate-500 mb-1">Última Variación</span>
                 <div className={`flex items-center gap-2 font-black text-2xl ${(precios[0]?.variacion || 0) > 0 ? "text-rose-500" : (precios[0]?.variacion || 0) < 0 ? "text-emerald-500" : "text-slate-500"}`}>
                    {(precios[0]?.variacion || 0) > 0 ? <TrendingUp className="w-6 h-6" /> : (precios[0]?.variacion || 0) < 0 ? <TrendingDown className="w-6 h-6" /> : <ArrowRight className="w-6 h-6" />}
                    ${Math.abs(precios[0]?.variacion || 0)}
                 </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex flex-col justify-center">
                 <span className="text-xs font-bold text-slate-500 mb-1">Costo Promedio (Últimos 3 meses)</span>
                 <div className="flex items-center gap-2 font-black text-2xl text-slate-700 dark:text-slate-200">
                    <DollarSign className="w-6 h-6 text-slate-400" />
                    {Math.round(precios.reduce((acc, curr) => acc + curr.precio, 0) / (precios.length || 1))}
                 </div>
              </div>
           </div>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por fecha (YYYY-MM-DD) o tipo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500/50 outline-none transition-all dark:text-white"
            />
         </div>
      </div>

      {filteredPrecios.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
           <DollarSign className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
           <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-1">No hay registros</h3>
           <p className="text-slate-500 text-sm font-medium">Aún no se han registrado precios históricos.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 text-left">Fecha de Vigencia</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 text-left">Tipo Combustible</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 text-left">Precio/Litro ($)</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 text-left">Variación</th>
                <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-500 text-left">Registrado Por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPrecios.map((precio) => (
                <tr key={precio.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {new Date(precio.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                       {precio.tipo}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-black text-slate-800 dark:text-slate-100">${precio.precio}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1.5 text-sm font-bold">
                       {precio.variacion > 0 ? (
                         <span className="text-rose-500 flex items-center gap-1"><TrendingUp className="w-4 h-4"/> +${precio.variacion}</span>
                       ) : precio.variacion < 0 ? (
                         <span className="text-emerald-500 flex items-center gap-1"><TrendingDown className="w-4 h-4"/> -${Math.abs(precio.variacion)}</span>
                       ) : (
                         <span className="text-slate-400 flex items-center gap-1"><ArrowRight className="w-4 h-4"/> $0</span>
                       )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-medium text-slate-500">{precio.usuario}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal - Actualizar Precio */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Actualizar Precio Combustible"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Fecha de Vigencia *</label>
            <input 
              type="date" 
              required
              value={fechaVigencia}
              onChange={(e) => setFechaVigencia(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none dark:text-white transition-all" 
            />
            <p className="text-xs text-slate-400 font-medium">Este precio aplicará a todas las cargas a partir de esta fecha.</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Combustible *</label>
            <select 
              value={tipoCombustible}
              onChange={(e) => setTipoCombustible(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none dark:text-white transition-all"
            >
               <option>Diésel</option>
               <option>Gasolina 93</option>
               <option>Gasolina 95</option>
               <option>Gasolina 97</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Precio por Litro ($) *</label>
            <input 
              type="number" 
              required
              value={precioLitro || ''}
              onChange={(e) => setPrecioLitro(Number(e.target.value))}
              placeholder="Ej: 1050" 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none dark:text-white transition-all" 
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 shadow-sm shadow-amber-500/20">
              Guardar Precio
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
