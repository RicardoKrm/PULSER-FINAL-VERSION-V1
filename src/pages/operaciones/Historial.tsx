import React, { useState } from 'react';
import { 
  History, Search, Filter, Briefcase, ClipboardList, Calendar, 
  FileCheck, AlertCircle, Activity, ChevronLeft, ChevronRight, 
  User, Clock, ArrowUpRight, X
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

// Mock data para el historial
const MOCK_HISTORY = [
  {
    id: 1,
    date: '2026-05-15T14:30:00',
    module: 'Contratos',
    icon: Briefcase,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    user: 'Juan Pérez',
    action: 'Creación',
    description: 'Se ha creado el contrato #CTR-2026-001 para la empresa "Minera Norte".',
    reference: 'CTR-2026-001',
  },
  {
    id: 2,
    date: '2026-05-15T12:15:00',
    module: 'Alertas',
    icon: AlertCircle,
    color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    user: 'Sistema',
    action: 'Alerta Generada',
    description: 'Exceso de velocidad registrado en vehículo patente AB-CD-12 (> 95 km/h).',
    reference: 'ALT-1052',
  },
  {
    id: 3,
    date: '2026-05-14T16:45:00',
    module: 'Servicios',
    icon: ClipboardList,
    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    user: 'María Gómez',
    action: 'Actualización',
    description: 'Servicio #SRV-901 actualizado a estado "En Ruta".',
    reference: 'SRV-901',
  },
  {
    id: 4,
    date: '2026-05-14T09:20:00',
    module: 'Control Documental',
    icon: FileCheck,
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    user: 'Carlos Ruiz',
    action: 'Aprobación',
    description: 'Documentación aprobada: Licencia de conducir Juan Pérez, Vence 2028.',
    reference: 'DOC-5012',
  },
  {
    id: 5,
    date: '2026-05-13T15:00:00',
    module: 'Reservas',
    icon: Calendar,
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    user: 'Ana Silva',
    action: 'Reserva Confirmada',
    description: 'Reserva confirmada para Transporte de Personal el 2026-05-20.',
    reference: 'RES-088',
  },
  {
    id: 6,
    date: '2026-05-13T10:10:00',
    module: 'Contratos',
    icon: Briefcase,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    user: 'Juan Pérez',
    action: 'Renovación',
    description: 'Contrato #CTR-2025-099 renovado por 12 meses.',
    reference: 'CTR-2025-099',
  },
];

const MODULE_FILTERS = ['Todos', 'Contratos', 'Servicios', 'Reservas', 'Control Documental', 'Alertas'];

export default function Historial() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('Todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<typeof MOCK_HISTORY[0] | null>(null);

  const itemsPerPage = 8;

  const filteredHistory = MOCK_HISTORY.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'Todos' || item.module === selectedModule;
    
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(item.date) >= new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(item.date) <= end;
    }

    return matchesSearch && matchesModule && matchesDate;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDate = (dateStr: string) => {
    const dt = new Date(dateStr);
    return dt.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
           dt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) {
      if (hours === 0) return 'Hace menos de una hora';
      return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    const days = Math.floor(hours / 24);
    return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
  };

  const handleOpenDetails = (item: typeof MOCK_HISTORY[0]) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Historial de Operaciones
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Trazabilidad completa de modificaciones, ingresos y eventos del sistema.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por usuario, referencia o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all shadow-sm"
            />
          </div>
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-sm overflow-hidden shrink-0">
            <div className="px-4 py-2 border-r border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">Desde</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent font-semibold outline-none text-slate-700 dark:text-slate-300"
              />
            </div>
            <div className="px-4 py-2 flex items-center gap-2">
              <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">Hasta</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent font-semibold outline-none text-slate-700 dark:text-slate-300"
              />
            </div>
            {(startDate || endDate) && (
               <button 
                 onClick={() => { setStartDate(''); setEndDate(''); }}
                 className="px-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-l border-slate-200 dark:border-slate-800 flex items-center justify-center text-rose-500 transition-colors tooltip"
                 title="Limpiar fechas"
               >
                 <X className="w-4 h-4" />
               </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
          {MODULE_FILTERS.map(mod => (
            <button
              key={mod}
              onClick={() => { setSelectedModule(mod); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                selectedModule === mod 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 overflow-hidden">
        {paginatedHistory.length > 0 ? (
          <div className="relative border-l-2 border-slate-100 dark:border-slate-800 pl-6 ml-4 space-y-8">
            {paginatedHistory.map((item) => (
              <div key={item.id} className="relative group">
                {/* Timeline dot */}
                <div className={`absolute -left-[35px] top-1 w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 z-10 ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                
                {/* Content Card */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors shadow-sm relative overflow-hidden">
                   {/* Top Info */}
                   <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                               {item.module}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                               {item.action}
                            </span>
                         </div>
                         <h3 className="text-base font-medium text-slate-800 dark:text-slate-100 leading-snug">
                            {item.description}
                         </h3>
                      </div>
                      
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                         <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="font-medium whitespace-nowrap">{formatDate(item.date)}</span>
                         </div>
                         <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                            {getTimeAgo(item.date)}
                         </span>
                      </div>
                   </div>

                   {/* Footer Info */}
                   <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700/50 mt-2">
                       <div className="flex flex-wrap items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                             <User className="w-3.5 h-3.5" />
                             <span className="font-semibold">{item.user}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 font-bold">
                             Ref: {item.reference}
                          </div>
                       </div>
                       
                       <Button 
                          variant="ghost" 
                          onClick={() => handleOpenDetails(item)}
                          className="text-xs font-bold h-8 flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-900 shadow-none border-none"
                       >
                          Ver detalle <ArrowUpRight className="w-3.5 h-3.5" />
                       </Button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Sin resultados</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No se encontraron registros de historial para esta búsqueda.
            </p>
          </div>
        )}

        {/* Pagination Details */}
        {totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Mostrando página <span className="font-bold text-slate-800 dark:text-slate-100">{currentPage}</span> de <span className="font-bold text-slate-800 dark:text-slate-100">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="w-10 h-10 p-0 flex items-center justify-center rounded-xl"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button 
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)} 
                className="w-10 h-10 p-0 flex items-center justify-center rounded-xl"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalle de Operación"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${selectedItem.color}`}>
                <selectedItem.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate">{selectedItem.action}</h3>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">{selectedItem.module}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <span className="block font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-xs mb-1">Referencia</span>
                <span className="inline-flex px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-sm border border-slate-200 dark:border-slate-700">
                  {selectedItem.reference}
                </span>
              </div>
              <div>
                <span className="block font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-xs mb-1">Usuario / Responsable</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  {selectedItem.user}
                </span>
              </div>
               <div className="col-span-2">
                <span className="block font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-xs mb-1">Fecha y Hora</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {formatDate(selectedItem.date)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <span className="block font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] mb-2 pl-1">Descripción Detallada</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm bg-slate-50 border-l-4 border-l-indigo-500 dark:bg-slate-800/80 p-4 rounded-r-xl border-y border-r border-slate-200 dark:border-slate-700">
                {selectedItem.description}
                <br /><br />
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">
                  Información técnica adicional sobre el evento de trazabilidad y de auditoría se encuentra registrada en los logs de la base de datos de operaciones.
                </span>
              </p>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button onClick={() => setIsDetailModalOpen(false)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
