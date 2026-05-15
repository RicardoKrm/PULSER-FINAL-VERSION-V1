import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Plus, 
  Search, 
  FileText, 
  Settings, 
  ChevronRight, 
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Trash2,
  Pencil
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';

interface Pauta {
  id: number;
  nombre: string;
  modeloVehiculo: string;
  kmAplicacion: number;
  tipo: string;
  estado: string;
}

export default function GestionPautas() {
  const [pautas, setPautas] = useState<Pauta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  useEffect(() => {
    fetchPautas();
  }, []);

  const fetchPautas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/configuracion/pautas');
      const data = await res.json();
      setPautas(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pautasFiltradas = pautas.filter(p => 
    p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    p.modeloVehiculo.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );

  const handleSave = () => {
    Swal.fire({
      title: '¡Pauta Creada!',
      text: 'La pauta de mantenimiento ha sido registrada con éxito.',
      icon: 'success',
      confirmButtonColor: '#0891b2'
    });
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
             Pautas de <span className="text-cyan-600">Mantenimiento</span>
          </h1>
          <p className="text-slate-500 font-medium italic">Configuración de ciclos preventivos y servicios por kilometraje.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 h-12 px-6 rounded-2xl shadow-lg shadow-cyan-600/20 font-black">
           <Plus className="w-5 h-5 mr-2" /> AÑADIR NUEVA PAUTA
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600">
               <FileText className="w-6 h-6" />
            </div>
            <div>
               <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{pautas.length}</div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pautas Vigentes</span>
            </div>
         </div>
         <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
               <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
               <div className="text-2xl font-black text-slate-800 dark:text-slate-100">100%</div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cumplimiento Normativo</span>
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
           <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o modelo..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-cyan-500 transition-all font-bold text-sm outline-none" 
              />
           </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre de la Pauta</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Modelo Vehículo</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo / Categoría</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Aplicación</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic font-bold uppercase tracking-widest">Sincronizando pautas...</td></tr>
              ) : pautasFiltradas.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                       <span className="font-black text-slate-800 dark:text-slate-100 text-lg uppercase tracking-tight">{p.nombre}</span>
                       <span className="text-[10px] font-black text-cyan-600 flex items-center gap-1">
                          <Settings className="w-3 h-3" /> SISTEMA DE MTTO
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-bold text-slate-600 dark:text-slate-400">{p.modeloVehiculo}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
                       {p.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-black text-slate-800 dark:text-slate-100">
                    {p.kmAplicacion.toLocaleString()} KM
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                       <button className="p-2 text-slate-400 hover:text-cyan-600 transition-colors">
                          <Pencil className="w-5 h-5" />
                       </button>
                       <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-5 h-5" />
                       </button>
                       <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configurar Nueva Pauta">
        <div className="space-y-6 p-2">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre Descriptivo</label>
               <input type="text" placeholder="Ej: Preventiva Motor 15,000 KM" className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Modelo de Vehículo</label>
                  <select className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all appearance-none"><option>Volvo FH16</option><option>Scania R500</option></select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kilometraje Aplicación</label>
                  <input type="number" placeholder="10000" className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all" />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tareas a Realizar (Listado)</label>
               <textarea placeholder="1. Cambio de Aceite\n2. Cambio Filtros\n3. Revisión Niveles..." className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all min-h-[100px]" />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
               <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Adjuntar Documento Técnico (PDF)</div>
               <button className="flex items-center gap-2 mx-auto text-cyan-600 font-black text-sm"><Plus className="w-4 h-4" /> SUBIR ARCHIVO</button>
            </div>

            <div className="flex justify-end gap-3 pt-4">
               <Button variant="outline" className="px-8 rounded-xl font-black text-sm" onClick={() => setIsModalOpen(false)}>CANCELAR</Button>
               <Button className="bg-cyan-600 h-12 px-8 rounded-xl font-black text-sm shadow-xl shadow-cyan-600/20" onClick={handleSave}>GUARDAR PAUTA</Button>
            </div>
        </div>
      </Modal>
    </div>
  );
}
