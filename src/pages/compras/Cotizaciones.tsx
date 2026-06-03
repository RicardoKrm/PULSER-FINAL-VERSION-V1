import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, CheckCircle2, XCircle, Clock, Calendar, Hash, DollarSign, Building2, Paperclip, UploadCloud } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';

interface Cotizacion {
  id: string;
  uuid?: string;
  folio: string;
  proveedor: string;
  rut?: string;
  fecha: string;
  fechaVencimiento: string;
  monto: number;
  moneda: string;
  estado: 'EVALUACION' | 'APROBADA' | 'RECHAZADA';
  articulos: number;
  condicionPago: string;
  observaciones?: string;
}

export default function Cotizaciones() {
  const { currentCompany } = useCompany();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proveedoresDist, setProveedoresDist] = useState<any[]>([]);
  
  // Form State
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
  const [rut, setRut] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [moneda, setMoneda] = useState('CLP');
  const [monto, setMonto] = useState<number>(0);
  const [articulos, setArticulos] = useState<number>(1);
  const [condicionPago, setCondicionPago] = useState('30 días');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
     if(currentCompany) {
         fetchCotizaciones();
         fetchProveedores();
     }
  }, [currentCompany]);

  const fetchCotizaciones = async () => {
      if (!currentCompany) return;
      const { data, error } = await supabase.from('compras_cotizaciones')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .order('created_at', { ascending: false });
        
      if (data) {
          const parsed = data.map(c => ({
             id: c.folio,
             uuid: c.id,
             folio: c.folio,
             proveedor: c.proveedor_nombre,
             rut: c.proveedor_rut,
             fecha: new Date(c.fecha_emision).toISOString().split('T')[0],
             fechaVencimiento: c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toISOString().split('T')[0] : '',
             monto: Number(c.monto_total),
             moneda: c.moneda,
             estado: c.estado,
             articulos: c.articulos,
             condicionPago: c.condicion_pago,
             observaciones: c.observaciones
          }));
          setCotizaciones(parsed as any);
      }
  };

  const fetchProveedores = async () => {
      if (!currentCompany) return;
      const { data } = await supabase.from('proveedores_directorio').select('*').eq('empresa_id', currentCompany.id);
      if (data) {
          setProveedoresDist(data);
      }
  };

  const filteredCotizaciones = cotizaciones.filter(c => 
    c.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.proveedor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || (!rut && !proveedorSeleccionado)) {
      Swal.fire('Campos requeridos', 'Por favor indique un proveedor o RUT.', 'warning');
      return;
    }

    const folioStr = `COT-${Date.now().toString().slice(-4)}`;

    try {
        const payload = {
           empresa_id: currentCompany.id,
           folio: folioStr,
           proveedor_rut: rut,
           proveedor_nombre: proveedorSeleccionado || 'Desconocido',
           fecha_emision: fechaEmision,
           fecha_vencimiento: fechaVencimiento || null,
           moneda,
           monto_total: monto,
           articulos,
           condicion_pago: condicionPago,
           observaciones,
           estado: 'EVALUACION'
        };

        const { error } = await supabase.from('compras_cotizaciones').insert(payload);
        if (error) throw error;
        
        Swal.fire({
          title: '¡Guardada!', 
          text: 'La cotización ha sido registrada exitosamente.', 
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
        
        setIsModalOpen(false);
        resetForm();
        fetchCotizaciones();
    } catch(err: any) {
        Swal.fire('Error', err.message, 'error');
    }
  };

  const resetForm = () => {
     setProveedorSeleccionado('');
     setRut('');
     setFechaEmision(new Date().toISOString().split('T')[0]);
     setFechaVencimiento('');
     setMoneda('CLP');
     setMonto(0);
     setArticulos(1);
     setCondicionPago('30 días');
     setObservaciones('');
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'APROBADA': return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" /> Aprobada</span>;
      case 'EVALUACION': return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-wider"><Clock className="w-3.5 h-3.5" /> En Evaluación</span>;
      case 'RECHAZADA': return <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-black uppercase tracking-wider"><XCircle className="w-3.5 h-3.5" /> Rechazada</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-500" />
            Cotizaciones
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase tracking-wider text-sm">
            Gestión y seguimiento de cotizaciones para compras y proveedores.
          </p>
        </div>
        
        <Button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" /> Nueva Cotización
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por folio o proveedor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all dark:text-white"
            />
         </div>
         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <div className="px-4 py-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">Total: <span className="text-indigo-600 dark:text-indigo-400">{filteredCotizaciones.length}</span></div>
         </div>
      </div>

      {filteredCotizaciones.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
           <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
           <h3 className="text-lg font-black text-slate-700 dark:text-slate-200 mb-1">No hay cotizaciones</h3>
           <p className="text-slate-500 text-sm font-medium">Aún no se han registrado cotizaciones en el sistema.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCotizaciones.map((cotizacion) => (
            <div key={cotizacion.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-500 uppercase tracking-widest block mb-1">
                      {cotizacion.folio}
                    </span>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
                      {cotizacion.proveedor}
                    </h3>
                 </div>
                 <div>
                    {getStatusBadge(cotizacion.estado)}
                 </div>
              </div>

              <div className="space-y-3 mb-6 flex-1 mt-2">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex flex-col">
                     <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Emisión / Vencimiento</span>
                     <span>{new Date(cotizacion.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(cotizacion.fechaVencimiento).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{cotizacion.articulos} artículos cotizados</span>
                </div>

                <div className="flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-black text-slate-800 dark:text-slate-200">{cotizacion.moneda === 'USD' ? 'USD $' : '$'}{cotizacion.monto.toLocaleString()} Total</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">{cotizacion.condicionPago}</span>
                </div>
              </div>

              <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800/50 flex gap-2">
                 <button className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 text-sm">
                   Ver Detalle
                 </button>
                 <button className="w-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 text-sm">
                   <Paperclip className="w-4 h-4 text-slate-500" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Nueva Cotización */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Crear Nueva Cotización"
      >
        <div className="max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
             {/* Información General */}
             <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" /> Información del Proveedor
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Nombre del Proveedor *</label>
                    <select 
                      required
                      value={proveedorSeleccionado}
                      onChange={(e) => setProveedorSeleccionado(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all cursor-pointer" 
                    >
                       <option value="">Seleccione un Proveedor...</option>
                       {proveedoresDist.map(p => (
                         <option key={p.id} value={p.nombre}>{p.nombre}</option>
                       ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">RUT Emisor *</label>
                    <input 
                      type="text" 
                      required
                      value={rut}
                      onChange={(e) => setRut(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all" 
                      placeholder="Ej. 76.888.999-5" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Fecha Emisión *</label>
                    <input 
                      type="date"
                      required
                      value={fechaEmision}
                      onChange={(e) => setFechaEmision(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Fecha Vencimiento</label>
                    <input 
                      type="date"
                      value={fechaVencimiento}
                      onChange={(e) => setFechaVencimiento(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                    />
                  </div>
                </div>
             </div>

             {/* Detalles Comerciales */}
             <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 mt-6">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> Detalles Comerciales
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Moneda</label>
                    <select
                      value={moneda}
                      onChange={(e) => setMoneda(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                    >
                      <option value="CLP">CLP ($)</option>
                      <option value="USD">USD ($)</option>
                      <option value="UF">UF</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Monto Total *</label>
                    <input 
                      type="number"
                      required
                      value={monto || ''}
                      onChange={(e) => setMonto(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                      placeholder="Ej: 1500000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Cant. de Artículos</label>
                    <input 
                      type="number"
                      value={articulos || ''}
                      onChange={(e) => setArticulos(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Condiciones de Pago</label>
                    <select
                      value={condicionPago}
                      onChange={(e) => setCondicionPago(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all"
                    >
                       <option value="Al contado">Al contado</option>
                       <option value="15 días">15 días</option>
                       <option value="30 días">30 días</option>
                       <option value="45 días">45 días</option>
                       <option value="60 días">60 días</option>
                       <option value="Anticipo y saldo al entregar">Anticipo y saldo</option>
                    </select>
                  </div>
                </div>
             </div>

             {/* Documentación & Notas */}
             <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 mt-6">
                  <Paperclip className="w-4 h-4 text-slate-500" /> Documentación
                </h4>
                
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Documento Adjunto (PDF/Imagen)</label>
                  <div className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                     <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                     <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Arrastra tu archivo o haz clic para explorar</p>
                     <p className="text-xs text-slate-500 mt-1">Soporta PDF, JPG, PNG (Max 10MB)</p>
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Observaciones</label>
                   <textarea
                     rows={3}
                     value={observaciones}
                     onChange={(e) => setObservaciones(e.target.value)}
                     className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all resize-none"
                     placeholder="Notas adicionales, especificaciones técnicas, referenciales..."
                   ></textarea>
                </div>
             </div>

             <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 mt-6 pb-2">
               <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
               <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-sm shadow-indigo-600/20">
                 Procesar Cotización
               </Button>
             </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

