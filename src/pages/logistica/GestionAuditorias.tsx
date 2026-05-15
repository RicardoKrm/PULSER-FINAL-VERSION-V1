import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  ClipboardList,
  ChevronRight,
  MapPin,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

interface Auditoria {
  id: number;
  bodega: { nombre: string };
  responsable: string;
  fecha_inicio: string;
  fecha_termino: string | null;
  estado: 'CAPTURANDO' | 'FINALIZADA' | 'ESPERANDO';
}

interface Bodega {
  id: number;
  nombre: string;
}

export default function GestionAuditorias() {
  const navigate = useNavigate();
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAudit, setNewAudit] = useState({ bodega_id: '', notas: '' });

  useEffect(() => {
    fetchAuditorias();
    fetchBodegas();
  }, []);

  const fetchAuditorias = async () => {
    try {
      const res = await fetch('/api/auditorias/historial');
      const data = await res.json();
      setAuditorias(data);
    } catch (e) {
      console.error("Error fetching audits", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBodegas = async () => {
    try {
      const res = await fetch('/api/bodegas');
      const data = await res.json();
      setBodegas(data);
      if (data.length > 0) setNewAudit(prev => ({ ...prev, bodega_id: data[0].id.toString() }));
    } catch (e) {
      console.error("Error fetching bodegas", e);
    }
  };

  const handleStartAudit = async () => {
    try {
      const res = await fetch('/api/auditorias/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAudit)
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        navigate(`/logistica/auditorias/${data.id}`);
      } else {
        Swal.fire('Error', data.message || 'No se pudo iniciar la auditoría', 'error');
      }
    } catch (e) {
      Swal.fire('Error', 'Error de conexión', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CAPTURANDO':
        return <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-wider">Capturando</span>;
      case 'ESPERANDO':
        return <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-wider">Esperando Ajuste</span>;
      case 'FINALIZADA':
        return <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-wider">Finalizada</span>;
      default:
        return <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            Inventarios <span className="text-cyan-600">Físicos</span>
          </h1>
          <p className="text-slate-500 font-medium">Historial y control de auditorías de bodega.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> NUEVA AUDITORÍA
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / BODEGA</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">RESPONSABLE</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">FECHA INICIO</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">FECHA TÉRMINO</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">ESTADO</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Cargando auditorías...</td>
                </tr>
              ) : auditorias.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No hay auditorías registradas</td>
                </tr>
              ) : (
                auditorias.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 dark:text-slate-200 text-lg">#{a.id}</span>
                        <span className="text-[10px] font-black text-cyan-600 uppercase tracking-tight">{a.bodega.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{a.responsable}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(a.fecha_inicio).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {a.fecha_termino ? (
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(a.fecha_termino).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span className="text-slate-300 italic font-medium">---</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(a.estado)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/logistica/auditorias/${a.id}`)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-cyan-600 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Audit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Iniciar Inventario Físico</h2>
            <p className="text-slate-500 font-medium mb-8">Selecciona la bodega y agrega notas para los auditores.</p>

            <div className="space-y-6 mb-8">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Bodega a Auditar</label>
                <select 
                  value={newAudit.bodega_id}
                  onChange={(e) => setNewAudit({ ...newAudit, bodega_id: e.target.value })}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 focus:border-cyan-500 outline-none transition-all text-slate-800 dark:text-slate-100"
                >
                  {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Notas / Instrucciones</label>
                <textarea 
                  rows={3}
                  placeholder="Ej: Inventario general de cierre de mes..."
                  value={newAudit.notas}
                  onChange={(e) => setNewAudit({ ...newAudit, notas: e.target.value })}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 focus:border-cyan-500 outline-none transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-300"
                ></textarea>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleStartAudit}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white p-5 rounded-3xl font-black text-lg shadow-xl shadow-cyan-600/20 transition-all active:scale-95"
              >
                INICIAR SESIÓN DE INVENTARIO
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
