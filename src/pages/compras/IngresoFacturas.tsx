import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Camera,
  ArrowRight,
  Database,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  ScanBarcode,
  UploadCloud,
  FileCheck,
  Paperclip,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';

interface Invoice {
  id: string;
  uuid?: string;
  emisor: string;
  rut: string;
  fecha: string;
  monto: number;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  oc: string;
}

export default function IngresoFacturas() {
  const { currentCompany } = useCompany();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [comprasOrdenes, setComprasOrdenes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'lista' | 'nuevo'>('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form State
  const [rut, setRut] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [nDoc, setNDoc] = useState('');
  const [nOc, setNOc] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [montoTotal, setMontoTotal] = useState<number>(0);

  useEffect(() => {
     if(currentCompany) {
        fetchFacturas();
        fetchOrdenes();
     }
  }, [currentCompany]);

  const fetchFacturas = async () => {
      if (!currentCompany) return;
      const { data, error } = await supabase.from('compras_facturas')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .order('created_at', { ascending: false });
      
      if (data) {
          const parsed = data.map(f => ({
             id: f.folio_factura,
             uuid: f.id,
             emisor: f.proveedor_nombre || 'Desconocido',
             rut: f.proveedor_rut || '',
             fecha: new Date(f.fecha_emision).toISOString().split('T')[0],
             monto: Number(f.monto_total),
             estado: f.estado || 'PENDIENTE',
             oc: f.orden_folio || ''
          }));
          setInvoices(parsed);
      }
  };

  const fetchOrdenes = async () => {
      if (!currentCompany) return;
      const { data } = await supabase.from('compras_ordenes')
        .select('id, folio')
        .eq('empresa_id', currentCompany.id)
        .eq('estado', 'PENDIENTE'); // Facturas para OC pendientes
      if (data) {
          setComprasOrdenes(data);
      }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.emisor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.rut.includes(searchTerm)
  );

  const handleConsultarSII = () => {
    if (!rut) {
       Swal.fire('Error', 'Ingrese un RUT válido', 'error');
       return;
    }
    // Mockup SII fetch
    Swal.fire({
      title: 'Consultando a SII...',
      text: 'Obteniendo información del contribuyente',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setTimeout(() => {
      Swal.close();
      setRazonSocial('EMPRESA DE PRUEBA S.A.');
      Swal.fire({
        title: '¡RUT Encontrado!',
        text: 'Los datos del emisor han sido cargados.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany || !rut || !nDoc || montoTotal <= 0) {
      Swal.fire('Campos requeridos', 'Por favor complete RUT, N° Documento y Monto', 'warning');
      return;
    }

    const ocObj = comprasOrdenes.find(o => o.folio === nOc);

    try {
        const payload = {
           empresa_id: currentCompany.id,
           proveedor_rut: rut,
           proveedor_nombre: razonSocial || 'Proveedor sin nombre',
           folio_factura: `FE-${nDoc}`,
           orden_id: ocObj ? ocObj.id : null,
           orden_folio: nOc || 'Directa',
           fecha_emision: fechaEmision,
           monto_total: montoTotal,
           estado: 'PENDIENTE'
        };

        const { error } = await supabase.from('compras_facturas').insert(payload);
        if (error) throw error;

        Swal.fire({
          title: '¡Factura Registrada!',
          text: 'El documento ha sido ingresado al sistema.',
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        });
        
        // Reset form
        setRut(''); setRazonSocial(''); setNDoc(''); setNOc(''); setMontoTotal(0); setFechaEmision(new Date().toISOString().split('T')[0]);
        setActiveTab('lista');
        fetchFacturas();
    } catch(err: any) {
        Swal.fire('Error', err.message, 'error');
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'APROBADA':
        return <span className="px-3 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex w-fit items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Aprobada</span>;
      case 'RECHAZADA':
        return <span className="px-3 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 flex w-fit items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Rechazada</span>;
      default:
        return <span className="px-3 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 flex w-fit items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Pendiente</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" /> {activeTab === 'lista' ? 'Ingreso de Facturas' : 'Digitalizar Factura'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {activeTab === 'lista' ? 'Historial y gestión de documentos tributarios de proveedores.' : 'Ingrese los datos o cargue un documento para su digitación.'}
          </p>
        </div>
        
        {activeTab === 'lista' ? (
          <Button 
            onClick={() => setActiveTab('nuevo')}
            className="flex items-center gap-2 font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" /> Digitalizar Nueva
          </Button>
        ) : (
          <Button 
            onClick={() => setActiveTab('lista')}
            variant="outline"
            className="flex items-center gap-2 font-bold px-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al Historial
          </Button>
        )}
      </div>

      {activeTab === 'nuevo' ? (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-6">
             <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 mb-6">
                   <Building2 className="w-4 h-4 text-indigo-500" /> Datos del Emisor
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">RUT Emisor *</label>
                      <input 
                        type="text" 
                        value={rut}
                        onChange={(e) => setRut(e.target.value)}
                        placeholder="Ej. 76.123.456-K" 
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all" 
                      />
                   </div>
                   <div className="flex items-end">
                      <Button type="button" onClick={handleConsultarSII} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 rounded-xl shadow-sm">
                         <Search className="w-4 h-4 mr-2" /> Consultar SII
                      </Button>
                   </div>
                </div>
                <div className="mt-4">
                   <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Razón Social</label>
                   <input 
                     type="text" 
                     value={razonSocial}
                     onChange={(e) => setRazonSocial(e.target.value)}
                     placeholder="NOMBRE DE LA EMPRESA" 
                     className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all" 
                   />
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2 mb-6">
                   <FileText className="w-4 h-4 text-emerald-500" /> Detalle del Documento
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">N° Documento *</label>
                      <input 
                        type="text" 
                        value={nDoc}
                        onChange={(e) => setNDoc(e.target.value)}
                        placeholder="Ej. 10293" 
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all" 
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Orden de Compra (OC)</label>
                      <select 
                        value={nOc}
                        onChange={(e) => setNOc(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all cursor-pointer" 
                      >
                         <option value="">(Sin Orden - Compra Directa)</option>
                         {comprasOrdenes.map(oc => (
                           <option key={oc.id} value={oc.folio}>{oc.folio}</option>
                         ))}
                      </select>
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                   <div>
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Fecha Emisión *</label>
                      <input 
                        type="date" 
                        value={fechaEmision}
                        onChange={(e) => setFechaEmision(e.target.value)}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all" 
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Monto Total ($) *</label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                         <input 
                           type="number" 
                           value={montoTotal || ''}
                           onChange={(e) => setMontoTotal(Number(e.target.value))}
                           placeholder="0" 
                           required
                           className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none dark:text-white transition-all" 
                         />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center min-h-[300px] group transition-all hover:border-indigo-500/50">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform">
                   <UploadCloud className="w-8 h-8 text-indigo-500" />
                </div>
                <h4 className="text-xl font-black text-slate-700 dark:text-slate-300 mb-2 text-center">Ajuntar PDF o Imagen</h4>
                <p className="text-slate-500 font-medium text-center text-sm mb-6 max-w-sm">Si ajustas una factura, intentaremos extraer los datos automáticamente (Simulado).</p>
                <div className="flex gap-4">
                   <Button type="button" className="rounded-xl h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20">
                      Explorar Archivos
                   </Button>
                </div>
             </div>

             <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                 </div>
                 <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Carga Segura</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Los documentos quedarán asignados a la orden de compra y se derivarán para pago.</p>
                 </div>
             </div>

             <Button type="submit" className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shrink-0 gap-2 flex items-center justify-center px-4">
                <CheckCircle2 className="w-5 h-5" /> Registrar Factura en Sistema
             </Button>
          </div>
        </form>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-4 justify-between items-center">
             <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                   type="text"
                   placeholder="Buscar factura por RUT, emisor o N°..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
             </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead>
                   <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs">Documento</th>
                      <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs">Emisor</th>
                      <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs text-center">Asociación</th>
                      <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs">Monto Total</th>
                      <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs text-right">Estado</th>
                      <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-xs text-right">Acciones</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {filteredInvoices.map(invoice => (
                     <tr 
                        key={invoice.id} 
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedInvoice(invoice)}
                     >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-slate-400" /> {invoice.id}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" /> {new Date(invoice.fecha).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                             <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.emisor}</span>
                             <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-0.5">{invoice.rut}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1 ${invoice.oc === 'Directa' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                              <Database className="w-3.5 h-3.5" /> {invoice.oc}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                          ${invoice.monto.toLocaleString('es-CL')}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end">
                             {getStatusBadge(invoice.estado)}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <Button 
                             variant="outline" 
                             className="h-9 px-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 pointer-events-none"
                           >
                             <Paperclip className="w-4 h-4 mr-1.5" /> Ver PDF
                           </Button>
                        </td>
                     </tr>
                   ))}
                   {filteredInvoices.length === 0 && (
                     <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                           No se encontraron facturas registradas.
                        </td>
                     </tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title="Detalle de Factura"
          size="lg"
        >
          <div className="space-y-6">
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     <FileText className="w-6 h-6 text-indigo-500" /> Factura {selectedInvoice.id}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Recibida el {new Date(selectedInvoice.fecha).toLocaleDateString()}</p>
               </div>
               {getStatusBadge(selectedInvoice.estado)}
            </div>

            <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Emisor</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedInvoice.emisor}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">RUT</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedInvoice.rut}</p>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Orden de Compra</p>
                  <div className="flex items-center gap-1.5">
                     <Database className="w-4 h-4 text-slate-400" />
                     <span className="font-bold text-slate-800 dark:text-slate-200">{selectedInvoice.oc}</span>
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Monto Total</p>
                  <p className="font-bold font-mono text-xl text-slate-800 dark:text-slate-200">${selectedInvoice.monto.toLocaleString('es-CL')}</p>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
               <Button onClick={() => setSelectedInvoice(null)} variant="outline">
                  Cerrar
               </Button>
               {selectedInvoice.estado === 'PENDIENTE' && (
                  <>
                     <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => {
                        setInvoices(invoices.map(inv => inv.id === selectedInvoice.id ? {...inv, estado: 'RECHAZADA'} : inv));
                        setSelectedInvoice(null);
                        Swal.fire('Factura Rechazada', '', 'success');
                     }}>
                        Rechazar
                     </Button>
                     <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
                        setInvoices(invoices.map(inv => inv.id === selectedInvoice.id ? {...inv, estado: 'APROBADA'} : inv));
                        setSelectedInvoice(null);
                        Swal.fire('Factura Aprobada', '', 'success');
                     }}>
                        Aprobar para Pago
                     </Button>
                  </>
               )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
