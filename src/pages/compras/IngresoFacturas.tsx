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
  ScanBarcode
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface Invoice {
  id: string;
  emisor: string;
  fecha: string;
  monto: number;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  oc: string;
}

export default function IngresoFacturas() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lista' | 'nuevo'>('lista');

  useEffect(() => {
    fetch('/api/compras/facturas')
      .then(res => res.json())
      .then(data => {
        setInvoices(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            Ingreso de <span className="text-cyan-600">Facturas</span>
          </h1>
          <p className="text-slate-500 font-medium">Digitalización, validación y carga de documentos tributarios.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('lista')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'lista' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500'}`}
          >
            HISTORIAL
          </button>
          <button 
            onClick={() => setActiveTab('nuevo')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'nuevo' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500'}`}
          >
             DIGITALIZAR
          </button>
        </div>
      </div>

      {activeTab === 'nuevo' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-6">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                   <ScanBarcode className="w-6 h-6 text-cyan-600" /> Datos del Emisor
                </h3>
                <div className="space-y-5">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 ml-1">RUT Emisor</label>
                         <input type="text" placeholder="76.123.456-K" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all text-sm" />
                      </div>
                      <div className="flex items-end">
                         <Button className="w-full h-14 rounded-2xl bg-slate-800 text-white font-black">
                            <Search className="w-4 h-4 mr-2" /> CONSULTAR SII
                         </Button>
                      </div>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 ml-1">Razón Social</label>
                      <input type="text" placeholder="NOMBRE DE LA EMPRESA" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all text-sm" />
                   </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                   <FileText className="w-6 h-6 text-cyan-600" /> Detalle del Documento
                </h3>
                <div className="space-y-5">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 ml-1">N° Documento</label>
                         <input type="text" placeholder="FE-10293" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all text-sm" />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 ml-1">N° Órden de Compra</label>
                         <input type="text" placeholder="OC-2501 (Opcional)" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all text-sm" />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 ml-1">Fecha Emisión</label>
                         <input type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all text-sm" />
                      </div>
                      <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 ml-1">Monto Total</label>
                         <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                            <input type="number" placeholder="0" className="w-full pl-8 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border border-transparent focus:border-cyan-500 outline-none transition-all text-sm" />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="bg-slate-100 dark:bg-slate-800/50 p-8 rounded-[3rem] border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center min-h-[400px] group transition-all hover:border-cyan-500/50">
                <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-xl mb-6 group-hover:scale-110 transition-transform">
                   <Upload className="w-10 h-10 text-cyan-600" />
                </div>
                <h4 className="text-xl font-black text-slate-700 dark:text-slate-300 mb-2 text-center">SOLTAR PDF O IMAGEN</h4>
                <p className="text-slate-400 font-medium text-center text-sm mb-8">El sistema procesará automáticamente mediante OCR para extraer los datos.</p>
                <div className="flex gap-4">
                   <Button className="rounded-2xl h-14 px-8 bg-cyan-600 font-black shadow-lg shadow-cyan-600/20">
                      SELECCIONAR ARCHIVO
                   </Button>
                   <Button variant="outline" className="rounded-2xl h-14 px-6 border-slate-300 bg-white dark:bg-slate-900 font-black">
                      <Camera className="w-5 h-5" />
                   </Button>
                </div>
             </div>

             <div className="p-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex gap-4 items-start">
                   <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm text-emerald-600">
                      <CheckCircle2 className="w-6 h-6" />
                   </div>
                   <div>
                      <h4 className="text-emerald-900 dark:text-emerald-400 font-black mb-1">Pulser AI Ready</h4>
                      <p className="text-emerald-700 dark:text-emerald-600 font-medium text-sm">Carga el documento y extraeremos proveedores, productos y valores en segundos.</p>
                   </div>
                </div>
             </div>

             <Button className="w-full h-16 rounded-3xl bg-slate-900 text-white font-black text-lg shadow-2xl">
                REGISTRAR FACTURA EN SISTEMA
             </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                   type="text"
                   placeholder="Buscar factura por RUT o N°..."
                   className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-transparent focus:border-cyan-500 outline-none transition-all font-bold text-sm"
                />
             </div>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">N° FACTURA</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Emisor</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">OC Relacionada</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estado</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {invoices.map(invoice => (
                     <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-black">{invoice.id}</td>
                        <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">{invoice.emisor}</td>
                        <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-1 rounded text-[10px] font-black ${invoice.oc === 'Directa' ? 'bg-slate-100 text-slate-500' : 'bg-cyan-50 text-cyan-600'}`}>
                              {invoice.oc}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm font-bold">{invoice.fecha}</td>
                        <td className="px-6 py-4 font-black">${invoice.monto.toLocaleString('es-CL')}</td>
                        <td className="px-6 py-4 text-right">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${
                              invoice.estado === 'APROBADA' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                           }`}>
                              {invoice.estado}
                           </span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
}
