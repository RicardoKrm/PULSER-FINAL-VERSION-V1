import React, { useState } from 'react';
import { Briefcase, Plus, Search, Calendar, Tag, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, FileText, Paperclip, UploadCloud, Users, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';

interface Contrato {
  id: string;
  folio: string;
  proveedor: string;
  fechaInicio: string;
  fechaTermino: string;
  tipo: string;
  estado: 'Activo' | 'Por Vencer' | 'Vencido' | 'Inactivo';
  montoTotal?: number;
  responsable?: string;
  condicionPago?: string;
}

const INITIAL_DATA: Contrato[] = [
  { id: '1', folio: 'CTR-001', proveedor: 'Lubricantes y Filtros S.A.', fechaInicio: '2025-01-01', fechaTermino: '2026-12-31', tipo: 'Suministro Insumos', estado: 'Activo', montoTotal: 15000000, responsable: 'Juan Pérez', condicionPago: '30 días' },
  { id: '2', folio: 'CTR-002', proveedor: 'Neumáticos del Norte', fechaInicio: '2024-05-01', fechaTermino: '2026-05-30', tipo: 'Mantención Neumáticos', estado: 'Por Vencer', montoTotal: 45000000, responsable: 'María González', condicionPago: '30 días' },
  { id: '3', folio: 'CTR-003', proveedor: 'Limpieza Industrial SPA', fechaInicio: '2023-01-01', fechaTermino: '2024-01-01', tipo: 'Servicios Generales', estado: 'Vencido', montoTotal: 5000000, responsable: 'Carlos Rojas', condicionPago: '15 días' },
];

export default function ContratosProveedores() {
  const [contratos, setContratos] = useState<Contrato[]>(INITIAL_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [proveedor, setProveedor] = useState('');
  const [tipo, setTipo] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaTermino, setFechaTermino] = useState('');
  const [montoTotal, setMontoTotal] = useState<number>(0);
  const [responsable, setResponsable] = useState('');
  const [condicionPago, setCondicionPago] = useState('30 días');
  const [alertasActivadas, setAlertasActivadas] = useState(true);
  const [observaciones, setObservaciones] = useState('');

  const filteredContratos = contratos.filter(c => 
    c.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedor || !tipo || !fechaInicio || !fechaTermino) return;

    const newContrato: Contrato = {
      id: Date.now().toString(),
      folio: `CTR-${(contratos.length + 1).toString().padStart(3, '0')}`,
      proveedor,
      tipo,
      fechaInicio,
      fechaTermino,
      estado: 'Activo',
      montoTotal,
      responsable,
      condicionPago
    };

    setContratos([newContrato, ...contratos]);
    
    Swal.fire({
      title: '¡Guardado!', 
      text: 'El contrato ha sido registrado exitosamente.', 
      icon: 'success',
      confirmButtonColor: '#4f46e5'
    });
    
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setProveedor('');
    setTipo('');
    setFechaInicio('');
    setFechaTermino('');
    setMontoTotal(0);
    setResponsable('');
    setCondicionPago('30 días');
    setAlertasActivadas(true);
    setObservaciones('');
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Activo': return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" /> {estado}</span>;
      case 'Por Vencer': return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-wider"><AlertTriangle className="w-3.5 h-3.5" /> {estado}</span>;
      case 'Vencido': return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-black uppercase tracking-wider"><ShieldAlert className="w-3.5 h-3.5" /> {estado}</span>;
      case 'Inactivo': return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 text-xs font-black uppercase tracking-wider"><AlertCircle className="w-3.5 h-3.5" /> {estado}</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
            Contrato Proveedores
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-sm">
            Gestión y seguimiento de contratos con proveedores y servicios.
          </p>
        </div>
        
        <Button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" /> Nuevo Contrato
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por folio, proveedor o tipo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white"
            />
         </div>
         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <div className="px-4 py-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">Total: <span className="text-indigo-600 dark:text-indigo-400">{filteredContratos.length}</span></div>
         </div>
      </div>

      {filteredContratos.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
           <Briefcase className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
           <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-1">No hay contratos</h3>
           <p className="text-slate-500 text-sm font-medium">Aún no se han registrado contratos de proveedores en el sistema.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredContratos.map((contrato) => (
            <div key={contrato.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-500 uppercase tracking-widest block mb-1">
                      {contrato.folio}
                    </span>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
                      {contrato.proveedor}
                    </h3>
                 </div>
                 <div>
                    {getStatusBadge(contrato.estado)}
                 </div>
              </div>

              <div className="space-y-3 mb-6 flex-1 mt-2">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{contrato.tipo}</span>
                </div>

                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex flex-col">
                     <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Vigencia</span>
                     <span>{new Date(contrato.fechaInicio).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} <span className="text-slate-400 mx-1">-</span> {new Date(contrato.fechaTermino).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800/50 flex gap-2">
                 <button className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 text-sm">
                   Ver Detalles
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Nuevo Contrato */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Contrato"
      >
        <div className="max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
             {/* Info de Proveedor y Tipo */}
             <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-500" /> Información Principal
                </h4>
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Proveedor *</label>
                  <input 
                    type="text" 
                    required
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all" 
                    placeholder="Nombre de la empresa proveedora" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Contrato *</label>
                    <select
                      required
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all" 
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Suministro Insumos">Suministro Insumos</option>
                      <option value="Mantención Neumáticos">Mantención Neumáticos</option>
                      <option value="Servicios Generales">Servicios Generales</option>
                      <option value="Soporte y Telecom">Soporte y Telecom</option>
                      <option value="Arriendo de Equipos">Arriendo de Equipos</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Responsable Interno</label>
                    <input 
                      type="text" 
                      value={responsable}
                      onChange={(e) => setResponsable(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all" 
                      placeholder="Ej. Juan Pérez" 
                    />
                  </div>
                </div>
             </div>

             {/* Vigencia */}
             <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 mt-6">
                  <Calendar className="w-4 h-4 text-emerald-500" /> Vigencia y Duración
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Fecha Inicio *</label>
                    <input 
                      type="date"
                      required
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Fecha Término *</label>
                    <input 
                      type="date"
                      required
                      value={fechaTermino}
                      onChange={(e) => setFechaTermino(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                   <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="toggle-alertas" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:border-indigo-600 checked:right-0 right-5" checked={alertasActivadas} onChange={(e) => setAlertasActivadas(e.target.checked)}/>
                      <label htmlFor="toggle-alertas" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer"></label>
                      <style>{`
                        .toggle-checkbox:checked { right: 0; border-color: #4f46e5; }
                        .toggle-checkbox:checked + .toggle-label { background-color: #4f46e5; }
                      `}</style>
                   </div>
                   <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Alertas de Vencimiento Automáticas</p>
                      <p className="text-xs text-slate-500 font-medium">Notificar 30, 60 y 90 días antes del término.</p>
                   </div>
                </div>
             </div>

             {/* Datos Económicos */}
             <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 mt-6">
                  <DollarSign className="w-4 h-4 text-amber-500" /> Condiciones Comerciales
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Presupuesto/Monto Total (Opcional)</label>
                     <input 
                       type="number"
                       value={montoTotal || ''}
                       onChange={(e) => setMontoTotal(Number(e.target.value))}
                       className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                       placeholder="Ej. 10000000"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Condiciones de Pago</label>
                     <select
                       value={condicionPago}
                       onChange={(e) => setCondicionPago(e.target.value)}
                       className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                     >
                        <option value="30 días">30 días</option>
                        <option value="45 días">45 días</option>
                        <option value="60 días">60 días</option>
                        <option value="Pre-pago">Pre-pago</option>
                        <option value="Hitos de avance">Hitos de avance</option>
                     </select>
                   </div>
                </div>
             </div>

             {/* Documentación & Notas */}
             <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 mt-6">
                  <Paperclip className="w-4 h-4 text-slate-500" /> Documentos Respaldo
                </h4>
                
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Adjuntar Contrato (PDF, DOCX)</label>
                  <div className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                     <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Arrastra tu archivo o haz clic para explorar</p>
                     <p className="text-xs text-slate-500 mt-1">Límite de tamaño: 25MB</p>
                  </div>
                </div>
                
                <div>
                   <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Notas Internas</label>
                   <textarea
                     rows={3}
                     value={observaciones}
                     onChange={(e) => setObservaciones(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all resize-none"
                     placeholder="Cláusulas clave, multas o comentarios..."
                   ></textarea>
                </div>
             </div>

             <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 mt-6 pb-2">
               <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
               <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-sm shadow-indigo-600/20">
                 Registrar Contrato
               </Button>
             </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

