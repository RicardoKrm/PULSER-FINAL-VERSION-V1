import React, { useState, useEffect } from 'react';
import { 
  FileText, ArrowLeft, FileDown, Info, PackageCheck, List, 
  MessageSquare, Paperclip, FileImage, Download, Printer,
  Maximize2, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Trash2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Props {
  orden: any;
  onBack: () => void;
  onRefresh: () => void;
  onAnular?: (folio: string) => void;
}

export default function OrdenCompraDetalle({ orden, onBack, onRefresh, onAnular }: Props) {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'ITEMS' | 'ADJUNTOS' | 'RECEPCIONES' | 'FACTURAS' | 'HISTORIAL'>('GENERAL');
  const [showRecepcionModal, setShowRecepcionModal] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  const { currentCompany, activeCompanyId } = useCompany();
  const [companyDetails, setCompanyDetails] = useState<{
    nombre?: string;
    rut?: string;
    direccion?: string;
    comuna?: string;
    ciudad?: string;
    telefono?: string;
    email?: string;
    website?: string;
    logo_url?: string;
  }>({});

  useEffect(() => {
    async function loadCompanyInfo() {
      if (!activeCompanyId) return;
      try {
        let { data, error } = await supabase
          .from('empresa')
          .select('nombre, rut, detalles')
          .eq('id', activeCompanyId)
          .single();
          
        if (error) {
          const fallback = await supabase
            .from('empresa')
            .select('nombre, rut')
            .eq('id', activeCompanyId)
            .single();
          if (fallback.data) {
            data = { ...fallback.data, detalles: {} };
          }
        }
        
        if (data) {
          const det = data.detalles || {};
          setCompanyDetails({
            nombre: data.nombre,
            rut: data.rut,
            direccion: det.direccion,
            comuna: det.comuna,
            ciudad: det.ciudad,
            telefono: det.telefono,
            email: det.email,
            website: det.website,
            logo_url: det.logo_url
          });
        }
      } catch (err) {
        console.warn('Error loading company details for OC view', err);
      }
    }
    loadCompanyInfo();
  }, [activeCompanyId]);

  const displayCompanyName = companyDetails.nombre || currentCompany?.name || currentCompany?.razonSocial || 'MI EMPRESA';
  const displayCompanyRut = companyDetails.rut ? `RUT: ${companyDetails.rut}` : 'RUT: No registrado';
  const displayCompanyAddress = [companyDetails.direccion, companyDetails.comuna, companyDetails.ciudad].filter(Boolean).join(', ');
  const displayCompanyContact = [
    companyDetails.telefono ? `Tel: ${companyDetails.telefono}` : '',
    companyDetails.email ? `Email: ${companyDetails.email}` : ''
  ].filter(Boolean).join(' • ');

  const handleDescargarOCPDF = () => {
    try {
      const doc = new jsPDF();

      // Header Company
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(displayCompanyName.toUpperCase(), 14, 20);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      let currentY = 26;
      if (displayCompanyAddress) {
        doc.text(displayCompanyAddress, 14, currentY);
        currentY += 5;
      }
      doc.text(`${displayCompanyRut} ${displayCompanyContact ? ' | ' + displayCompanyContact : ''}`, 14, currentY);
      currentY += 6;

      // Divider Line
      doc.setLineWidth(0.5);
      doc.line(14, currentY, 196, currentY);
      currentY += 8;

      // Title & Document Info
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`ORDEN DE COMPRA: ${orden?.folio || 'OC-000'}`, 14, currentY);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha Emisión: ${orden?.fecha || new Date().toLocaleDateString('es-CL')}`, 14, currentY + 6);
      doc.text(`Estado: ${(orden?.estado || 'PENDIENTE').toUpperCase()}`, 130, currentY + 6);
      currentY += 14;

      // Proveedor Box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, 182, 22, 'F');
      
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Proveedor:`, 18, currentY + 7);
      doc.setFont('helvetica', 'normal');
      doc.text(orden?.proveedor || orden?.proveedor_nombre || 'No especificado', 38, currentY + 7);

      doc.setFont('helvetica', 'bold');
      doc.text(`RUT Proveedor:`, 18, currentY + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(orden?.rutProveedor || 'No registrado', 45, currentY + 15);

      doc.setFont('helvetica', 'bold');
      doc.text(`Condición Pago:`, 110, currentY + 7);
      doc.setFont('helvetica', 'normal');
      doc.text(orden?.condicionPago || '30 Días', 138, currentY + 7);

      doc.setFont('helvetica', 'bold');
      doc.text(`Fecha Entrega:`, 110, currentY + 15);
      doc.setFont('helvetica', 'normal');
      doc.text(orden?.fechaEntrega || 'Inmediata', 138, currentY + 15);

      currentY += 28;

      // Observaciones / Notas
      if (orden?.resumen || orden?.notas) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Notas / Observaciones:`, 14, currentY);
        currentY += 5;

        doc.setFont('helvetica', 'normal');
        const splitNotas = doc.splitTextToSize(orden?.resumen || orden?.notas || '', 180);
        doc.text(splitNotas, 14, currentY);
        currentY += (splitNotas.length * 4.5) + 6;
      }

      // Table of Items
      const tableData = (renderItems || []).map((item: any, index: number) => [
        index + 1,
        item.repuesto || 'Ítem de compra',
        `${item.cantidad || 0} UND`,
        `$${Number(item.precioU || 0).toLocaleString('es-CL')}`,
        `$${Number(item.total || 0).toLocaleString('es-CL')}`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Descripción / Repuesto', 'Cantidad', 'Precio Unitario', 'Total Línea']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { cellWidth: 85 },
          2: { halign: 'center', cellWidth: 25 },
          3: { halign: 'right', cellWidth: 30 },
          4: { halign: 'right', cellWidth: 30 }
        }
      });

      const finalTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : currentY + 40;

      // Total
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Monto Total Orden de Compra: $${Number(totalMonto || orden?.monto || 0).toLocaleString('es-CL')} CLP`, 196, finalTableY, { align: 'right' });

      // Signatures
      const sigY = finalTableY + 25;
      if (sigY < 270) {
        doc.setLineWidth(0.2);
        doc.line(25, sigY, 85, sigY);
        doc.line(115, sigY, 175, sigY);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Aprobado / Adquisiciones', 55, sigY + 5, { align: 'center' });
        doc.text(displayCompanyName, 55, sigY + 9, { align: 'center' });

        doc.text('Aceptado / Proveedor', 145, sigY + 5, { align: 'center' });
        doc.text(orden?.proveedor || 'Firma y Timbre', 145, sigY + 9, { align: 'center' });
      }

      doc.save(`Orden_Compra_${orden?.folio || 'OC'}.pdf`);
      Swal.fire({
        title: '¡Orden de Compra PDF Generada!',
        text: `Se ha descargado el archivo Orden_Compra_${orden?.folio || 'OC'}.pdf`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error generando PDF de OC:', err);
      window.print();
    }
  };

  // Fake states to simulate the new flows
  const [recepciones, setRecepciones] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  
  const isReceived = orden?.estado === 'RECIBIDA' || orden?.estado === 'CERRADA';

  const renderItems = orden?.lineas?.map((l: any) => ({
    repuesto: l.repuesto_nombre || l.descripcion,
    cantidad: l.cantidad,
    recibido: 0,
    precioU: l.precio_unitario || 0,
    total: (l.cantidad * (l.precio_unitario || 0)) || 0
  })) || [];
  
  const totalMonto = renderItems.reduce((acc: any, curr: any) => acc + curr.total, 0);

  const tabs = ['GENERAL', 'ITEMS', 'ADJUNTOS', 'RECEPCIONES', 'FACTURAS', 'HISTORIAL'];

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      {/* Header Detalle */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-black text-slate-800 dark:text-white flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-500" /> Detalle de Orden de Compra {orden?.folio}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-wider uppercase inline-flex text-white ${
              orden?.estado === 'ANULADA' ? 'bg-red-600' :
              orden?.estado === 'PENDIENTE' ? 'bg-blue-500' : 'bg-emerald-500'
            }`}>
              {orden?.estado === 'ANULADA' ? '🚫 ANULADA' : (orden?.estado || "PENDIENTE")}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-bold text-sm">Proveedor: {orden?.proveedor}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={onBack}
            className="bg-[#64748b] hover:bg-slate-600 text-white font-bold h-10 px-5 rounded-lg text-sm tracking-wide"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> VOLVER
          </Button>
          <Button 
            onClick={handleDescargarOCPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 rounded-lg text-sm tracking-wide"
          >
            <Download className="w-4 h-4 mr-2" /> DESCARGAR PDF
          </Button>
          <Button 
            onClick={() => window.print()}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white font-bold h-10 px-5 rounded-lg text-sm tracking-wide"
          >
            <Printer className="w-4 h-4 mr-2" /> IMPRIMIR OC
          </Button>
          {!isReceived && orden?.estado !== 'ANULADA' && (
            <Button 
              onClick={() => setShowRecepcionModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-10 px-5 rounded-lg text-sm tracking-wide"
            >
              <PackageCheck className="w-4 h-4 mr-2" /> RECEPCIONAR COMPRA
            </Button>
          )}
          {orden?.estado !== 'ANULADA' && (
            <Button 
              onClick={() => onAnular && orden?.folio && onAnular(orden.folio)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-5 rounded-lg text-sm tracking-wide shadow-sm"
              title="Anular esta Orden de Compra requiriendo motivo de anulación"
            >
              <Trash2 className="w-4 h-4 mr-2" /> ANULAR ORDEN
            </Button>
          )}
        </div>
      </div>

      {/* Cancellation Audit Banner if ANULADA */}
      {orden?.estado === 'ANULADA' && (
        <div className="bg-red-50 border-2 border-red-300 dark:bg-red-950/40 dark:border-red-800 rounded-2xl p-5 flex items-start gap-4 text-red-900 dark:text-red-200 shadow-sm">
          <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-black text-sm uppercase tracking-wider text-red-700 dark:text-red-300 flex items-center gap-2">
              🚫 ORDEN DE COMPRA ANULADA — REGISTRO AUDITABLE DE CORRELATIVO
            </h3>
            <p className="text-xs font-semibold text-red-800 dark:text-red-200">
              <span className="font-black uppercase tracking-wider text-[11px] bg-red-200/80 dark:bg-red-900/60 text-red-900 dark:text-red-100 px-2 py-0.5 rounded mr-2">
                Motivo de Anulación:
              </span> 
              {orden?.motivo_anulacion || orden?.notas || 'Sin motivo ingresado'}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-red-600 dark:text-red-400 pt-1 font-bold">
              <span>📅 Fecha de Anulación: {orden?.fecha_anulacion || 'Registrada'}</span>
              <span>👤 Usuario: {orden?.usuario_anulacion || 'Administrador Compras'}</span>
              <span>🔢 Folio Preservado: {orden?.folio}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-2 flex flex-wrap gap-2 border border-slate-200 dark:border-slate-700">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2.5 rounded-lg text-xs font-black tracking-widest transition-all ${
              activeTab === tab 
                ? 'bg-blue-500 text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'GENERAL' && (
          <div className="space-y-6">
            <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
              <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 py-4 px-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Información General</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  <div className="p-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Proveedor</span>
                    <span className="font-black text-blue-600 dark:text-blue-400 text-lg">{orden?.proveedor || "KAUFMANN"}</span>
                  </div>
                  <div className="p-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fecha Emisión</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-lg">{orden?.fecha || "20/04/2026 15:56"}</span>
                  </div>
                  <div className="p-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estado Actual</span>
                    <span className={`${isReceived ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400'} px-3 py-1 rounded-md text-[10px] font-black tracking-wider inline-flex`}>
                      {orden?.estado || "PENDIENTE"}
                    </span>
                  </div>
                  <div className="p-6">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Inversión Total</span>
                    <span className="font-black text-slate-900 dark:text-white text-xl">${totalMonto.toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
              <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 py-4 px-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-500" />
                  <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Observaciones y Notas</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 dark:text-slate-400 italic font-medium">
                  {orden?.resumen || orden?.notas || 'Sin notas ni observaciones adjuntas a esta orden de compra.'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'ITEMS' && (
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Descripción / Repuesto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Solicitado</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Recibido</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Precio Unitario</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Total Línea</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                  {renderItems.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 text-xs">{item.repuesto}</td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded text-xs font-black">{item.cantidad} UND</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-xs font-black">{item.recibido} UND</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300 text-xs text-right">${item.precioU.toLocaleString('es-CL')}</td>
                      <td className="px-6 py-4 font-black text-slate-800 dark:text-white text-sm text-right">${item.total.toLocaleString('es-CL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'RECEPCIONES' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button 
                onClick={() => setShowRecepcionModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold h-9 px-4 rounded-lg text-xs tracking-wider"
              >
                <PackageCheck className="w-3.5 h-3.5 mr-2" /> NUEVA RECEPCIÓN
              </Button>
            </div>
            {recepciones.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <PackageCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400">Aún no hay recepciones registradas</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* Simulated Data Render */}
              </div>
            )}
          </div>
        )}

        {activeTab === 'FACTURAS' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button 
                onClick={() => setShowFacturaModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold h-9 px-4 rounded-lg text-xs tracking-wider"
              >
                <FileText className="w-3.5 h-3.5 mr-2" /> REGISTRAR FACTURA
              </Button>
            </div>
            {facturas.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400">Aún no hay facturas registradas</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* Simulated Data Render */}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ADJUNTOS' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div 
              onClick={() => setShowDocumentViewer(true)}
              className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full">OC_PDF.pdf</span>
              <span className="text-[10px] text-slate-500 mt-1">Generado por sistema</span>
            </div>
          </div>
        )}

        {activeTab === 'HISTORIAL' && (
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm p-6 bg-white dark:bg-slate-800">
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-800 bg-blue-500 text-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-slate-800 dark:text-white text-sm">Sistema creó OC</div>
                    <time className="font-medium text-blue-500 text-xs">20/04/2026 15:56</time>
                  </div>
                  <div className="text-slate-500 text-xs font-medium">Orden de compra generada automáticamente.</div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={showRecepcionModal} onClose={() => setShowRecepcionModal(false)} title="Recepcionar Compra">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Fecha Recepción</label>
              <input type="date" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Responsable</label>
              <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-900 dark:text-white outline-none" placeholder="Nombre..." />
            </div>
          </div>
          
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase">Producto</th>
                    <th className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase text-center">Solicitado</th>
                    <th className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase text-center">Recibido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {renderItems.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 font-bold text-xs">{item.repuesto}</td>
                      <td className="px-4 py-3 text-center font-bold text-xs">{item.cantidad}</td>
                      <td className="px-4 py-3 text-center">
                        <input type="number" className="w-20 text-center bg-slate-50 border border-slate-200 rounded p-1 text-sm font-bold mx-auto" defaultValue={item.cantidad} />
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Evidencias (Guía Despacho, Foto)</label>
             <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50">
               <Paperclip className="w-6 h-6 text-slate-400 mb-2" />
               <span className="text-xs font-bold text-slate-500">Arrastra archivos o haz clic para subir</span>
             </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={() => setShowRecepcionModal(false)} variant="outline">Cancelar</Button>
            <Button onClick={() => {
              Swal.fire('¡Recepcionada!', 'La mercadería se ha registrado.', 'success');
              setShowRecepcionModal(false);
              onRefresh();
            }} className="bg-emerald-500 hover:bg-emerald-600 text-white">Confirmar Recepción</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showCierreModal} onClose={() => setShowCierreModal(false)} title="Cerrar Orden de Compra">
        <div className="space-y-4">
          <div className="bg-amber-50 text-amber-600 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="text-sm font-medium">
              <strong>Atención:</strong> Existen productos pendientes por recepcionar. ¿Desea cerrar la orden igualmente?
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Motivo del Cierre *</label>
            <textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white outline-none min-h-[100px]" placeholder="Indique el motivo por el cual cierra la OC..."></textarea>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={() => setShowCierreModal(false)} variant="outline">Cancelar</Button>
            <Button onClick={() => {
              Swal.fire('¡Cerrada!', 'La orden de compra ha sido cerrada.', 'success');
              setShowCierreModal(false);
              onRefresh();
            }} className="bg-slate-800 text-white">Cerrar Orden</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showFacturaModal} onClose={() => setShowFacturaModal(false)} title="Registrar Factura">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Número Factura</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Fecha Emisión</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Monto Neto</label>
              <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Monto Total</label>
              <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none" />
            </div>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Documento PDF</label>
             <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50">
               <span className="text-xs font-bold text-slate-500">Subir XML / PDF</span>
             </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button onClick={() => setShowFacturaModal(false)} variant="outline">Cancelar</Button>
            <Button onClick={() => {
              Swal.fire('¡Guardado!', 'Factura registrada.', 'success');
              setShowFacturaModal(false);
            }} className="bg-blue-500 hover:bg-blue-600 text-white">Registrar</Button>
          </div>
        </div>
      </Modal>

      {/* Visor de Documentos */}
      <Modal isOpen={showDocumentViewer} onClose={() => setShowDocumentViewer(false)} title="Visor de Documentos" size="5xl">
        <div className="flex flex-col h-[70vh]">
          <div className="flex items-center justify-between mb-4 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">OC_PDF.pdf</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-8 px-3 rounded text-xs font-bold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <RefreshCw className="w-3.5 h-3.5 mr-2" /> ROTAR
              </Button>
              <Button variant="outline" className="h-8 px-3 rounded text-xs font-bold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <Download className="w-3.5 h-3.5 mr-2" /> DESCARGAR
              </Button>
              <Button variant="outline" className="h-8 px-3 rounded text-xs font-bold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <Printer className="w-3.5 h-3.5 mr-2" /> IMPRIMIR
              </Button>
              <Button variant="outline" className="h-8 px-3 rounded text-xs font-bold bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-slate-200 dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
            {/* Fake PDF Viewer Area */}
            <div className="bg-white text-slate-900 w-3/4 h-[95%] shadow-lg p-10 flex flex-col items-center justify-center">
               <FileText className="w-16 h-16 text-slate-300 mb-4" />
               <h3 className="text-xl font-bold text-slate-500">Documento de Ejemplo PDF</h3>
               <p className="text-sm text-slate-400 mt-2">Visor integrado de documentos</p>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}
