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
  FileText,
  Warehouse
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
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
  const [searchTerm, setSearchTerm] = useState('');
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
        return <span className="px-3 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">Capturando</span>;
      case 'ESPERANDO':
        return <span className="px-3 py-1 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">Esperando Ajuste</span>;
      case 'FINALIZADA':
        return <span className="px-3 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">Finalizada</span>;
      default:
        return <span className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider">{status}</span>;
    }
  };

  const filteredAuditorias = auditorias.filter(a => 
    a.bodega.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toString().includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-cyan-600 dark:text-cyan-500" />
            Inventarios Físicos
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-sm">Historial y control de auditorías de bodega.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button 
            className="flex items-center gap-2 font-bold px-6 bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-500/20"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-5 h-5" /> Nueva Auditoría
          </Button>
        </div>
      </div>

      {/* Toolbox */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por ID, bodega o responsable..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all dark:text-white"
            />
         </div>
         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <div className="px-4 py-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">Total: <span className="text-cyan-600 dark:text-cyan-400">{filteredAuditorias.length}</span></div>
         </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
         <div className="flex items-center justify-center p-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
         </div>
      ) : filteredAuditorias.length === 0 ? (
         <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-1">No hay auditorías</h3>
            <p className="text-slate-500 text-sm font-medium">No se encontraron resultados para tu búsqueda.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAuditorias.map((a) => (
            <div key={a.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              {/* Card Header: ID & Status */}
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <span className="text-xs font-black text-cyan-600 dark:text-cyan-500 uppercase tracking-widest block mb-1">
                      AUD-{a.id.toString().padStart(3, '0')}
                    </span>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
                      {a.bodega.nombre}
                    </h3>
                 </div>
                 <div>
                    {getStatusBadge(a.estado)}
                 </div>
              </div>

              {/* Card Body: Info */}
              <div className="space-y-3 mb-6 flex-1 mt-2">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{a.responsable}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Inicio</span>
                    <span>{new Date(a.fecha_inicio).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Término</span>
                    <span>
                      {a.fecha_termino 
                        ? new Date(a.fecha_termino).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : <span className="text-slate-400 italic">En proceso...</span>
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Action Button */}
              <div className="pt-4 mt-auto">
                 <button 
                   onClick={() => navigate(`/logistica/auditorias/${a.id}`)}
                   className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                 >
                   <span>Ver Detalle de Auditoría</span>
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Audit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-xl text-cyan-600 dark:text-cyan-500">
                  <FileText className="w-6 h-6" />
               </div>
               <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Iniciar Inventario Físico</h2>
            </div>
            <p className="text-slate-500 font-medium mb-8 text-sm">Selecciona la bodega y agrega notas para los auditores. Se generará una nueva sesión de inventario.</p>

            <div className="space-y-6 mb-8">
              <div>
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Bodega a Auditar</label>
                <select 
                  value={newAudit.bodega_id}
                  onChange={(e) => setNewAudit({ ...newAudit, bodega_id: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-slate-800 dark:text-slate-100"
                >
                  {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1.5">Notas / Instrucciones (Opcional)</label>
                <textarea 
                  rows={3}
                  placeholder="Ej: Inventario general de cierre de mes..."
                  value={newAudit.notas}
                  onChange={(e) => setNewAudit({ ...newAudit, notas: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button 
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleStartAudit}
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-8 shadow-sm shadow-cyan-600/20"
              >
                Inciar Sesión
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

