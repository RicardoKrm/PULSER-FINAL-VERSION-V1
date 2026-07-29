import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, CheckCircle, XCircle, Printer, ShoppingCart, 
  Paperclip, History, Download, AlertCircle, Send, Save, Plus, Trash2,
  Eye, AlertTriangle, Edit3, ExternalLink, Image as ImageIcon, UserCheck,
  Building2, Calendar, DollarSign, CheckCircle2, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';

interface Props {
  solicitud: any;
  onBack: () => void;
  onSave?: (solicitud: any) => void;
  isNew?: boolean;
  nextId?: string;
}

export default function SolicitudCompraDetalle({ solicitud: initialData, onBack, onSave, isNew = false, nextId = 'SC-000001' }: Props) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [solicitud, setSolicitud] = useState(() => initialData || {
    id: nextId,
    estado: 'BORRADOR',
    fecha: new Date().toISOString().split('T')[0],
    solicitante: '',
    departamento: 'Operaciones',
    centroCosto: '',
    faena: '',
    prioridad: 'MEDIA',
    motivo: '',
    observaciones: '',
    montoAprox: 0,
    items: [],
    adjuntos: [],
    notaAjuste: '',
    aprobadoPor: null,
    historial: [
      { fecha: new Date().toISOString(), usuario: 'Usuario', accion: 'Creó la solicitud en borrador' }
    ]
  });

  const [editMode, setEditMode] = useState(isNew || solicitud.estado === 'BORRADOR' || solicitud.estado === 'REQUIERE AJUSTE');
  
  // Modals state
  const [showAprobarModal, setShowAprobarModal] = useState(false);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showGenerarOCModal, setShowGenerarOCModal] = useState(false);

  // Generar OC state
  const [ocFolio, setOcFolio] = useState('');
  const [ocProveedor, setOcProveedor] = useState('Finning Chile S.A.');
  const [ocRutProveedor, setOcRutProveedor] = useState('91.516.000-K');
  const [ocCondicionPago, setOcCondicionPago] = useState('30 Días');
  const [ocFechaEntrega, setOcFechaEntrega] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [ocNotas, setOcNotas] = useState('');
  const [ocItemsPrices, setOcItemsPrices] = useState<{ [key: number]: number }>({});
  const [ocIncludeIva, setOcIncludeIva] = useState(true);

  const DEFAULT_PROVEEDORES = [
    { nombre: 'Finning Chile S.A.', rut: '91.516.000-K' },
    { nombre: 'Komatsu Cummins Chile', rut: '96.882.000-2' },
    { nombre: 'Sodimac Constructor', rut: '96.792.000-8' },
    { nombre: 'Ferretería Industrial Berschand', rut: '76.123.456-7' },
    { nombre: 'Indura S.A.', rut: '90.230.000-1' },
    { nombre: 'Distribuidora Shell Chile', rut: '85.400.300-4' },
    { nombre: 'Servicios Logísticos del Norte SpA', rut: '77.890.123-5' }
  ];
  
  // File preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  // Form states for approval & adjustment
  const [aprobadorNombre, setAprobadorNombre] = useState('Carlos Méndez');
  const [aprobadorCargo, setAprobadorCargo] = useState('Gerente de Operaciones');
  const [aprobadorComentario, setAprobadorComentario] = useState('');

  const [notaAjusteInput, setNotaAjusteInput] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const [newItem, setNewItem] = useState({
    descripcion: '',
    cantidad: 1,
    unidad: 'Un',
    categoria: 'General',
    marca: '',
    modelo: '',
    codigo: '',
    montoEstimado: 0
  });

  // State for item approval
  const [itemsAprobacion, setItemsAprobacion] = useState<any[]>(
    solicitud.items ? solicitud.items.map((i: any) => ({ ...i, cantidadAprobada: i.cantidadAprobada ?? i.cantidad })) : []
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BORRADOR': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      case 'PENDIENTE': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'REQUIERE AJUSTE': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300';
      case 'EN REVISIÓN': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'APROBADA': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'APROBADA PARCIALMENTE': return 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400';
      case 'RECHAZADA': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'CONVERTIDA EN OC': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'ANULADA': return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setSolicitud((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper formatting size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAdjunto = {
          id: 'adj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          nombre: file.name,
          tipo: file.type || 'application/octet-stream',
          tamano: formatBytes(file.size),
          url: dataUrl,
          fecha: new Date().toLocaleDateString('es-CL')
        };
        setSolicitud((prev: any) => {
          const updatedAdjuntos = [...(prev.adjuntos || []), newAdjunto];
          const updated = { ...prev, adjuntos: updatedAdjuntos };
          if (onSave) onSave(updated);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Archivo(s) adjuntado(s) exitosamente',
      showConfirmButton: false,
      timer: 2000
    });
  };

  const handleRemoveAdjunto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Swal.fire({
      title: '¿Eliminar adjunto?',
      text: 'Se quitará este archivo de la solicitud.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        setSolicitud((prev: any) => {
          const updatedAdjuntos = (prev.adjuntos || []).filter((a: any) => a.id !== id);
          const updated = { ...prev, adjuntos: updatedAdjuntos };
          if (onSave) onSave(updated);
          return updated;
        });
      }
    });
  };

  const handlePreviewAdjunto = (file: any) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  const handleAddItem = () => {
    if (!newItem.descripcion.trim()) {
      Swal.fire('Atención', 'Por favor ingrese la descripción del ítem.', 'warning');
      return;
    }
    const itemToAdd = {
      id: Date.now(),
      ...newItem,
      cantidadAprobada: newItem.cantidad
    };
    const updatedItems = [...solicitud.items, itemToAdd];
    const calcMonto = updatedItems.reduce((acc, i) => acc + (Number(i.montoEstimado || 0) * Number(i.cantidad || 1)), 0);

    setSolicitud((prev: any) => ({
      ...prev,
      items: updatedItems,
      montoAprox: calcMonto > 0 ? calcMonto : prev.montoAprox
    }));

    setItemsAprobacion(updatedItems.map(i => ({ ...i, cantidadAprobada: i.cantidad })));

    setNewItem({
      descripcion: '',
      cantidad: 1,
      unidad: 'Un',
      categoria: 'General',
      marca: '',
      modelo: '',
      codigo: '',
      montoEstimado: 0
    });
    setShowAddItem(false);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = solicitud.items.filter((_: any, idx: number) => idx !== index);
    const calcMonto = updatedItems.reduce((acc: number, i: any) => acc + (Number(i.montoEstimado || 0) * Number(i.cantidad || 1)), 0);
    setSolicitud((prev: any) => ({
      ...prev,
      items: updatedItems,
      montoAprox: calcMonto
    }));
    setItemsAprobacion(updatedItems.map((i: any) => ({ ...i, cantidadAprobada: i.cantidad })));
  };

  const handleGuardarBorrador = () => {
    if (onSave) {
      onSave(solicitud);
    }
    Swal.fire('Guardado', 'La solicitud ha sido guardada en borrador.', 'success');
  };

  const handleEnviar = () => {
    if (!solicitud.solicitante.trim()) {
      Swal.fire('Atención', 'Por favor indique el nombre del solicitante.', 'warning');
      return;
    }
    if (!solicitud.motivo.trim()) {
      Swal.fire('Atención', 'Por favor indique el motivo de la compra.', 'warning');
      return;
    }
    
    const esReenvio = solicitud.estado === 'REQUIERE AJUSTE';

    Swal.fire({
      title: esReenvio ? '¿Desea re-enviar la solicitud con ajustes?' : '¿Desea enviar la solicitud?',
      text: esReenvio ? 'Se notificará al equipo de aprobaciones para revisión.' : 'Una vez enviada quedará pendiente de aprobación.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: esReenvio ? 'Sí, re-enviar' : 'Sí, enviar'
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = { 
          ...solicitud, 
          estado: 'PENDIENTE',
          historial: [
            { 
              fecha: new Date().toISOString(), 
              usuario: solicitud.solicitante || 'Usuario', 
              accion: esReenvio ? 'Re-envió la solicitud con ajustes realizados' : 'Envió la solicitud' 
            }, 
            ...(solicitud.historial || [])
          ]
        };
        setSolicitud(updated);
        if (onSave) {
          onSave(updated);
        }
        setEditMode(false);
        Swal.fire('Enviada', esReenvio ? 'La solicitud fue re-enviada con los ajustes incorporados.' : 'La solicitud ha sido enviada exitosamente.', 'success');
      }
    });
  };

  // Submit solicitar ajuste
  const handleAjusteSubmit = () => {
    if (!notaAjusteInput.trim()) {
      Swal.fire('Atención', 'Debe especificar qué ajustes o cambios son requeridos.', 'warning');
      return;
    }

    const updated = {
      ...solicitud,
      estado: 'REQUIERE AJUSTE',
      notaAjuste: notaAjusteInput,
      historial: [
        {
          fecha: new Date().toISOString(),
          usuario: aprobadorNombre || 'Evaluador',
          accion: `Solicitó ajuste: "${notaAjusteInput}"`
        },
        ...(solicitud.historial || [])
      ]
    };

    setSolicitud(updated);
    if (onSave) {
      onSave(updated);
    }
    setShowAjusteModal(false);
    setEditMode(true);
    Swal.fire('Ajuste Solicitado', 'La solicitud ha cambiado a estado "REQUIERE AJUSTE".', 'info');
  };

  // Submit Approval with Approver Name & Role
  const handleAprobarSubmit = () => {
    if (!aprobadorNombre.trim()) {
      Swal.fire('Atención', 'Por favor especifique el nombre de la persona que aprueba.', 'warning');
      return;
    }

    const currentItems = itemsAprobacion.length > 0 ? itemsAprobacion : solicitud.items;
    const isPartial = currentItems.some(i => Number(i.cantidadAprobada) < Number(i.cantidad));
    const newState = isPartial ? 'APROBADA PARCIALMENTE' : 'APROBADA';
    
    const datosAprobacion = {
      nombre: aprobadorNombre,
      cargo: aprobadorCargo || 'Aprobador',
      fecha: new Date().toLocaleDateString('es-CL'),
      comentario: aprobadorComentario
    };

    const updated = {
      ...solicitud,
      estado: newState,
      items: currentItems,
      aprobadoPor: datosAprobacion,
      historial: [
        { 
          fecha: new Date().toISOString(), 
          usuario: aprobadorNombre, 
          accion: `${isPartial ? 'Aprobó parcialmente' : 'Aprobó'} la solicitud. Cargo: ${aprobadorCargo}. ${aprobadorComentario ? 'Nota: ' + aprobadorComentario : ''}`
        }, 
        ...(solicitud.historial || [])
      ]
    };

    setSolicitud(updated);
    if (onSave) {
      onSave(updated);
    }
    setShowAprobarModal(false);
    setEditMode(false);
    Swal.fire('Aprobada', `La solicitud ha sido registrada como ${newState.toLowerCase()} por ${aprobadorNombre}.`, 'success');
  };

  const handleRechazarSubmit = () => {
    if (!motivoRechazo.trim()) {
      Swal.fire('Error', 'Debe indicar un motivo de rechazo.', 'error');
      return;
    }
    const updated = {
      ...solicitud,
      estado: 'RECHAZADA',
      historial: [
        { fecha: new Date().toISOString(), usuario: aprobadorNombre || 'Aprobador', accion: `Rechazó la solicitud. Motivo: ${motivoRechazo}` }, 
        ...(solicitud.historial || [])
      ]
    };
    setSolicitud(updated);
    if (onSave) {
      onSave(updated);
    }
    setShowRechazarModal(false);
    setEditMode(false);
    Swal.fire('Rechazada', 'La solicitud ha sido rechazada.', 'success');
  };

  const handleOpenGenerarOC = () => {
    const newFolio = `OC-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    setOcFolio(newFolio);
    
    // Initialize prices mapping with item estimated amounts
    const initialPrices: { [key: number]: number } = {};
    if (solicitud.items) {
      solicitud.items.forEach((item: any, idx: number) => {
        initialPrices[idx] = Number(item.montoEstimado || 0);
      });
    }
    setOcItemsPrices(initialPrices);
    setOcNotas(`Despachar ítems aprobados correspondientes a Solicitud ${solicitud.id} a Bodega Central Faena Mina El Peñón.`);
    setShowGenerarOCModal(true);
  };

  const handleConfirmarGenerarOC = () => {
    if (!ocProveedor.trim()) {
      Swal.fire('Atención', 'Por favor indique el nombre del proveedor.', 'warning');
      return;
    }

    const approvedItems = solicitud.items ? solicitud.items.filter((i: any) => Number(i.cantidadAprobada ?? i.cantidad) > 0) : [];
    if (approvedItems.length === 0) {
      Swal.fire('Atención', 'No hay ítems aprobados para incluir en la Orden de Compra.', 'warning');
      return;
    }

    const lineas = approvedItems.map((item: any, idx: number) => {
      const qty = Number(item.cantidadAprobada ?? item.cantidad);
      const price = Number(ocItemsPrices[idx] ?? item.montoEstimado ?? 0);
      return {
        id: idx + 1,
        repuesto_nombre: item.descripcion,
        descripcion: `Marca: ${item.marca || 'N/A'} | Modelo: ${item.modelo || 'N/A'} | Cód: ${item.codigo || 'N/A'}`,
        centro_costo: solicitud.centroCosto || 'Operaciones',
        cantidad: qty,
        precio_unitario: price,
        subtotal: qty * price
      };
    });

    const subtotalNeto = lineas.reduce((acc: number, l: any) => acc + l.subtotal, 0);
    const montoIva = ocIncludeIva ? subtotalNeto * 0.19 : 0;
    const totalOC = subtotalNeto + montoIva;

    const nuevaOC = {
      id: 'oc-' + Date.now(),
      folio: ocFolio,
      fecha: new Date().toLocaleDateString('es-CL'),
      fecha_emision: new Date().toISOString(),
      proveedor: ocProveedor,
      proveedor_nombre: ocProveedor,
      rutProveedor: ocRutProveedor,
      solicitudOrigenId: solicitud.id,
      monto: totalOC,
      monto_estimado: totalOC,
      estado: 'PENDIENTE',
      condicionPago: ocCondicionPago,
      fechaEntrega: ocFechaEntrega,
      resumen: ocNotas || `Orden de compra generada desde Solicitud ${solicitud.id}`,
      notas: ocNotas,
      lineas: lineas
    };

    // Save to localStorage
    const existingOCs = JSON.parse(localStorage.getItem('ordenes_compra') || '[]');
    localStorage.setItem('ordenes_compra', JSON.stringify([nuevaOC, ...existingOCs]));

    // Update current solicitud state
    const updatedSolicitud = {
      ...solicitud,
      estado: 'CONVERTIDA EN OC',
      ordenCompraFolio: ocFolio,
      historial: [
        {
          fecha: new Date().toISOString(),
          usuario: aprobadorNombre || 'Gestión de Compras',
          accion: `Generó la Orden de Compra ${ocFolio} asignada a ${ocProveedor} por un total de $${Math.round(totalOC).toLocaleString('es-CL')} CLP.`
        },
        ...(solicitud.historial || [])
      ]
    };

    setSolicitud(updatedSolicitud);
    if (onSave) {
      onSave(updatedSolicitud);
    }
    setShowGenerarOCModal(false);

    Swal.fire({
      title: '¡Orden de Compra Generada!',
      html: `<div class="text-left space-y-2 text-sm text-slate-700">
        <p>Se ha creado exitosamente la <b>${ocFolio}</b> para el proveedor <b>${ocProveedor}</b>.</p>
        <div class="bg-slate-100 p-3 rounded-lg font-mono text-xs space-y-1">
          <div>• Total Neto: $${Math.round(subtotalNeto).toLocaleString('es-CL')} CLP</div>
          ${ocIncludeIva ? `<div>• IVA (19%): $${Math.round(montoIva).toLocaleString('es-CL')} CLP</div>` : ''}
          <div class="font-bold text-emerald-600 mt-1">• TOTAL FINAL: $${Math.round(totalOC).toLocaleString('es-CL')} CLP</div>
        </div>
      </div>`,
      icon: 'success',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ir a Órdenes de Compra',
      cancelButtonText: 'Permanecer en Solicitud'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/compras/ordenes-compra');
      }
    });
  };

  const isEditable = solicitud.estado === 'BORRADOR' || solicitud.estado === 'REQUIERE AJUSTE' || editMode;

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileUpload} 
        className="hidden" 
        multiple
      />

      {/* Cabecera */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-black text-slate-800 dark:text-white flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-500" /> Solicitud de Compra {solicitud.id}
            </h1>
            <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-wider uppercase inline-flex ${getStatusColor(solicitud.estado)}`}>
              {solicitud.estado}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1">
            Solicitante: {solicitud.solicitante || 'Por especificar'} • Fecha: {solicitud.fecha}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={onBack} variant="outline" className="font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> VOLVER
          </Button>
          
          <Button onClick={() => setShowPrintModal(true)} variant="outline" className="font-bold border-slate-300 dark:border-slate-700">
            <Printer className="w-4 h-4 mr-2" /> IMPRIMIR SOLICITUD
          </Button>

          {solicitud.estado === 'BORRADOR' && (
            <>
              <Button onClick={handleGuardarBorrador} variant="outline" className="font-bold border-blue-500 text-blue-600 hover:bg-blue-50">
                <Save className="w-4 h-4 mr-2" /> GUARDAR BORRADOR
              </Button>
              <Button onClick={handleEnviar} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                <Send className="w-4 h-4 mr-2" /> ENVIAR SOLICITUD
              </Button>
            </>
          )}

          {solicitud.estado === 'REQUIERE AJUSTE' && (
            <Button onClick={handleEnviar} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              <Send className="w-4 h-4 mr-2" /> RE-ENVIAR CON AJUSTES
            </Button>
          )}

          {solicitud.estado === 'PENDIENTE' && (
            <>
              <Button 
                onClick={() => {
                  setItemsAprobacion(solicitud.items ? solicitud.items.map((i: any) => ({ ...i, cantidadAprobada: i.cantidadAprobada ?? i.cantidad })) : []);
                  setShowAprobarModal(true);
                }} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> APROBAR
              </Button>

              <Button 
                onClick={() => {
                  setNotaAjusteInput(solicitud.notaAjuste || '');
                  setShowAjusteModal(true);
                }} 
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
              >
                <Edit3 className="w-4 h-4 mr-2" /> SOLICITAR AJUSTE
              </Button>

              <Button onClick={() => setShowRechazarModal(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                <XCircle className="w-4 h-4 mr-2" /> RECHAZAR
              </Button>
            </>
          )}

          {(solicitud.estado === 'APROBADA' || solicitud.estado === 'APROBADA PARCIALMENTE') && (
            <Button onClick={handleOpenGenerarOC} className="bg-[#1e293b] hover:bg-slate-800 text-white font-bold shadow-md">
              <ShoppingCart className="w-4 h-4 mr-2 text-emerald-400" /> GENERAR ORDEN DE COMPRA
            </Button>
          )}
        </div>
      </div>

      {/* Banner si ya está convertida en OC */}
      {solicitud.estado === 'CONVERTIDA EN OC' && (
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 text-indigo-900 dark:text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black flex-shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-wide">Solicitud Convertida en Orden de Compra</h4>
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">
                Se ha generado exitosamente la Orden de Compra <strong>{solicitud.ordenCompraFolio || 'OC-OFICIAL'}</strong> para esta solicitud.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/compras/ordenes-compra')} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 px-4 rounded-xl text-xs flex-shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> VER ÓRDENES DE COMPRA
          </Button>
        </div>
      )}

      {/* Banner de Ajuste Requerido */}
      {solicitud.estado === 'REQUIERE AJUSTE' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700/50 rounded-2xl p-5 text-amber-900 dark:text-amber-200 flex items-start gap-4 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-black text-sm uppercase tracking-wide">Se ha solicitado un ajuste en esta solicitud</h4>
            <p className="text-sm font-bold bg-white/60 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50">
              "{solicitud.notaAjuste || 'Por favor modifique los ítems o agregue los antecedentes requeridos.'}"
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 pt-1">
              Realice las modificaciones pertinentes abajo y presione <strong>"RE-ENVIAR CON AJUSTES"</strong> para volver a enviar a revisión.
            </p>
          </div>
        </div>
      )}

      {/* Banner de Aprobación Registrada */}
      {solicitud.aprobadoPor && (solicitud.estado === 'APROBADA' || solicitud.estado === 'APROBADA PARCIALMENTE') && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Aprobación Oficial</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                Aprobado por: <span className="text-emerald-700 dark:text-emerald-300">{solicitud.aprobadoPor.nombre}</span> ({solicitud.aprobadoPor.cargo})
              </p>
              {solicitud.aprobadoPor.comentario && (
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 italic mt-0.5">
                  "{solicitud.aprobadoPor.comentario}"
                </p>
              )}
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-white/80 dark:bg-emerald-950/50 px-3 py-1 rounded-lg border border-emerald-200">
            {solicitud.aprobadoPor.fecha}
          </span>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Contenido Central (Left) */}
        <div className="flex-1 space-y-6">
          {/* Información General */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 py-4 px-6">
              <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Información General</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre Solicitante *</label>
                  {isEditable ? (
                    <input 
                      type="text"
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 font-bold" 
                      placeholder="Ej: Juan Pérez"
                      value={solicitud.solicitante}
                      onChange={(e) => handleFieldChange('solicitante', e.target.value)}
                    />
                  ) : (
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{solicitud.solicitante || '-'}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Departamento</label>
                  {isEditable ? (
                    <select 
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 dark:bg-slate-900 dark:border-slate-700 dark:text-white font-medium" 
                      value={solicitud.departamento}
                      onChange={(e) => handleFieldChange('departamento', e.target.value)}
                    >
                      <option value="Operaciones">Operaciones</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Administración">Administración</option>
                      <option value="Prevención de Riesgos">Prevención de Riesgos</option>
                      <option value="Logística">Logística</option>
                    </select>
                  ) : (
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{solicitud.departamento || '-'}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Centro de Costo</label>
                  {isEditable ? (
                    <input 
                      type="text" 
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" 
                      placeholder="Ej: CC-102"
                      value={solicitud.centroCosto} 
                      onChange={(e) => handleFieldChange('centroCosto', e.target.value)}
                    />
                  ) : (
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{solicitud.centroCosto || '-'}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Faena / Proyecto</label>
                  {isEditable ? (
                    <input 
                      type="text" 
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" 
                      placeholder="Ej: Mina Central"
                      value={solicitud.faena} 
                      onChange={(e) => handleFieldChange('faena', e.target.value)}
                    />
                  ) : (
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{solicitud.faena || '-'}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prioridad</label>
                  {isEditable ? (
                    <select 
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 dark:bg-slate-900 dark:border-slate-700 dark:text-white font-medium" 
                      value={solicitud.prioridad}
                      onChange={(e) => handleFieldChange('prioridad', e.target.value)}
                    >
                      <option value="BAJA">BAJA</option>
                      <option value="MEDIA">MEDIA</option>
                      <option value="ALTA">ALTA</option>
                      <option value="CRÍTICA">CRÍTICA</option>
                    </select>
                  ) : (
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{solicitud.prioridad}</span>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto Estimado ($ CLP)</label>
                  {isEditable ? (
                    <input 
                      type="number" 
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 font-bold" 
                      placeholder="0"
                      value={solicitud.montoAprox || ''} 
                      onChange={(e) => handleFieldChange('montoAprox', Number(e.target.value))}
                    />
                  ) : (
                    <span className="font-black text-slate-800 dark:text-slate-200 text-sm">${(solicitud.montoAprox || 0).toLocaleString('es-CL')}</span>
                  )}
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Motivo / Requerimiento *</label>
                  {isEditable ? (
                    <textarea 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm h-20 resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 font-medium" 
                      value={solicitud.motivo} 
                      onChange={(e) => handleFieldChange('motivo', e.target.value)}
                      placeholder="Justifique la necesidad de la compra de forma detallada..."
                    ></textarea>
                  ) : (
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{solicitud.motivo || '-'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ítems */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Detalle de Ítems Solicitados</CardTitle>
              {isEditable && (
                <Button onClick={() => setShowAddItem(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8">
                  + AGREGAR ÍTEM
                </Button>
              )}
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cant.</th>
                    {(solicitud.estado.includes('APROBADA') || solicitud.estado === 'PENDIENTE' || solicitud.estado === 'CONVERTIDA EN OC') && (
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Aprobado</th>
                    )}
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Unidad</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Descripción</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Categoría</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Marca / Modelo</th>
                    {isEditable && <th className="px-4 py-3 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {solicitud.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm font-medium text-slate-500">
                        No hay ítems registrados en esta solicitud. Haz clic en <strong>+ AGREGAR ÍTEM</strong> para añadir requerimientos.
                      </td>
                    </tr>
                  ) : (
                    solicitud.items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-black text-slate-800 dark:text-white text-sm">{item.cantidad}</td>
                        {(solicitud.estado.includes('APROBADA') || solicitud.estado === 'PENDIENTE' || solicitud.estado === 'CONVERTIDA EN OC') && (
                          <td className="px-4 py-3 text-center">
                            {solicitud.estado === 'PENDIENTE' ? (
                              <span className="text-slate-400 text-xs">-</span>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs font-black ${item.cantidadAprobada < item.cantidad ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {item.cantidadAprobada ?? item.cantidad}
                              </span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 font-bold text-slate-600 dark:text-slate-400 text-xs">{item.unidad}</td>
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {item.descripcion}
                          {item.codigo && <span className="block text-[10px] text-slate-400 font-normal">Cód: {item.codigo}</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 text-xs">{item.categoria || 'General'}</td>
                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 text-xs">
                          {item.marca || '-'} {item.modelo && `/ ${item.modelo}`}
                        </td>
                        {isEditable && (
                          <td className="px-4 py-3 text-center">
                            <button 
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-red-500 p-1"
                              title="Eliminar ítem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Panel Lateral Derecho */}
        <div className="w-full xl:w-96 space-y-6 flex-shrink-0">
          
          {/* Adjuntos */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 py-4 px-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">
                  Adjuntos ({(solicitud.adjuntos || []).length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {(solicitud.adjuntos || []).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No hay documentos adjuntos en esta solicitud.</p>
              ) : (
                solicitud.adjuntos.map((adj: any) => {
                  const isImage = (adj.tipo || '').startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(adj.nombre);
                  return (
                    <div 
                      key={adj.id || adj.nombre} 
                      className="flex items-center justify-between p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden flex-1 cursor-pointer" onClick={() => handlePreviewAdjunto(adj)}>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          {isImage ? (
                            <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="overflow-hidden pr-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors" title={adj.nombre}>
                            {adj.nombre}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400">
                            {adj.tamano || 'Archivo'} • {adj.fecha || 'Reciente'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handlePreviewAdjunto(adj)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                          title="Visualizar adjunto"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {adj.url && (
                          <a 
                            href={adj.url} 
                            download={adj.nombre}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                            title="Descargar archivo"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        {isEditable && (
                          <button 
                            onClick={(e) => handleRemoveAdjunto(adj.id, e)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                            title="Eliminar adjunto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Botón de Cargar Archivo */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                type="button"
                className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2 group"
              >
                <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" /> AGREGAR / ADJUNTAR ARCHIVO
              </button>
            </CardContent>
          </Card>

          {/* Historial y Auditoría */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 py-4 px-6">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-wider uppercase">Historial de Trazabilidad</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
                {(solicitud.historial || []).map((ev: any, idx: number) => {
                  const d = new Date(ev.fecha);
                  return (
                    <div key={idx} className="p-4 flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-slate-600 dark:text-slate-400">{(ev.usuario || 'U').charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{ev.usuario || 'Usuario'}</p>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">{ev.accion}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{isNaN(d.getTime()) ? ev.fecha : d.toLocaleString('es-CL')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Modal Visualizar / Abrir Adjunto */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title={`Vista Previa: ${previewFile?.nombre || 'Adjunto'}`} size="3xl">
        {previewFile && (
          <div className="space-y-4 pt-2">
            <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between text-white">
              <div>
                <p className="font-bold text-sm truncate max-w-md">{previewFile.nombre}</p>
                <p className="text-xs text-slate-400">{previewFile.tamano} • {previewFile.tipo || 'Documento'}</p>
              </div>
              <div className="flex items-center gap-2">
                {previewFile.url && (
                  <Button 
                    onClick={() => window.open(previewFile.url, '_blank')}
                    variant="outline"
                    className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 text-xs h-8"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Abrir en Pestaña Nueva
                  </Button>
                )}
                {previewFile.url && (
                  <a 
                    href={previewFile.url} 
                    download={previewFile.nombre} 
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Descargar
                  </a>
                )}
              </div>
            </div>

            <div className="min-h-[400px] max-h-[65vh] flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden p-2 border border-slate-200 dark:border-slate-800">
              {previewFile.tipo?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(previewFile.nombre) ? (
                <img 
                  src={previewFile.url} 
                  alt={previewFile.nombre} 
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md"
                />
              ) : previewFile.tipo?.includes('pdf') || /\.pdf$/i.test(previewFile.nombre) ? (
                <iframe 
                  src={previewFile.url} 
                  title={previewFile.nombre}
                  className="w-full h-[60vh] rounded-lg border-0"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Este tipo de archivo ({previewFile.tipo || 'desconocido'}) no tiene vista previa interactiva directa.
                  </p>
                  <Button onClick={() => window.open(previewFile.url, '_blank')} className="bg-blue-600 text-white font-bold text-xs">
                    Abrir o Descargar Archivo
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Agregar Ítem */}
      <Modal isOpen={showAddItem} onClose={() => setShowAddItem(false)} title="Agregar Ítem a la Solicitud" size="lg">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Descripción del Ítem / Repuesto *</label>
            <input 
              type="text" 
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:border-blue-500 dark:text-white"
              placeholder="Ej: Casco de Seguridad Blanco V-Gard"
              value={newItem.descripcion}
              onChange={(e) => setNewItem({ ...newItem, descripcion: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Cantidad *</label>
              <input 
                type="number" 
                min="1"
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:border-blue-500 dark:text-white"
                value={newItem.cantidad}
                onChange={(e) => setNewItem({ ...newItem, cantidad: Math.max(1, parseInt(e.target.value) || 1) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Unidad</label>
              <select 
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-blue-500 dark:text-white"
                value={newItem.unidad}
                onChange={(e) => setNewItem({ ...newItem, unidad: e.target.value })}
              >
                <option value="Un">Un (Unidades)</option>
                <option value="Set">Set / Juego</option>
                <option value="Kg">Kg (Kilogramos)</option>
                <option value="Lts">Lts (Litros)</option>
                <option value="Mt">Mt (Metros)</option>
                <option value="Caja">Caja</option>
                <option value="Global">Global</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Categoría</label>
              <input 
                type="text" 
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-blue-500 dark:text-white"
                placeholder="Ej: EPP, Herramientas, Repuestos"
                value={newItem.categoria}
                onChange={(e) => setNewItem({ ...newItem, categoria: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Precio Unitario Est. ($ CLP)</label>
              <input 
                type="number" 
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:border-blue-500 dark:text-white"
                placeholder="0"
                value={newItem.montoEstimado || ''}
                onChange={(e) => setNewItem({ ...newItem, montoEstimado: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Marca</label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none dark:text-white"
                placeholder="Ej: MSA, 3M"
                value={newItem.marca}
                onChange={(e) => setNewItem({ ...newItem, marca: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Modelo</label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none dark:text-white"
                placeholder="Ej: V-Gard"
                value={newItem.modelo}
                onChange={(e) => setNewItem({ ...newItem, modelo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Código / Ref</label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium outline-none dark:text-white"
                placeholder="Ej: EPP-001"
                value={newItem.codigo}
                onChange={(e) => setNewItem({ ...newItem, codigo: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="outline" onClick={() => setShowAddItem(false)}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleAddItem}>
              Agregar Ítem
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Solicitar Ajuste */}
      <Modal isOpen={showAjusteModal} onClose={() => setShowAjusteModal(false)} title="Solicitar Ajuste o Corrección">
        <div className="space-y-4 pt-1">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3.5 rounded-xl text-amber-800 dark:text-amber-200 text-xs font-medium flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Indique detalladamente qué observaciones o correcciones debe realizar el solicitante antes de poder aprobar la compra.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nota / Observaciones de Ajuste Requerido *
            </label>
            <textarea 
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none h-28 resize-none focus:border-amber-500 font-medium dark:text-white"
              placeholder="Ej: Favor adjuntar cotización comparativa y ajustar la cantidad de cascos según el reporte de personal de terreno..."
              value={notaAjusteInput}
              onChange={(e) => setNotaAjusteInput(e.target.value)}
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <Button variant="outline" onClick={() => setShowAjusteModal(false)}>Cancelar</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold" onClick={handleAjusteSubmit}>
              Enviar Solicitud de Ajuste
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Aprobar Solicitud con "¿Quién aprueba esto?" */}
      <Modal isOpen={showAprobarModal} onClose={() => setShowAprobarModal(false)} title="Aprobar Solicitud de Compra" size="3xl">
        <div className="space-y-5 pt-1">
          {/* Formulario Quién Aprueba */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" /> Datos de la Autorización de Aprobación
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  ¿Quién aprueba esta solicitud? *
                </label>
                <input 
                  type="text" 
                  className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:border-emerald-500 dark:text-white"
                  placeholder="Ej: Carlos Méndez"
                  value={aprobadorNombre}
                  onChange={(e) => setAprobadorNombre(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Cargo / Rol del Aprobador
                </label>
                <input 
                  type="text" 
                  className="w-full h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-emerald-500 dark:text-white"
                  placeholder="Ej: Gerente de Operaciones"
                  value={aprobadorCargo}
                  onChange={(e) => setAprobadorCargo(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Comentarios / Observación de Aprobación
              </label>
              <input 
                type="text" 
                className="w-full h-9 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-emerald-500 dark:text-white"
                placeholder="Ej: Aprobado según presupuesto del mes de Operaciones Mina."
                value={aprobadorComentario}
                onChange={(e) => setAprobadorComentario(e.target.value)}
              />
            </div>
          </div>

          {/* Tabla de Cantidades Aprobadas */}
          <div>
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Validación de Cantidades por Ítem
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase">Descripción</th>
                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase text-center">Solicitado</th>
                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-500 uppercase text-center">Aprobado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {itemsAprobacion.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 font-bold text-xs">{item.descripcion}</td>
                      <td className="px-4 py-3 text-center font-bold text-xs">{item.cantidad} {item.unidad}</td>
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="number" 
                          min="0"
                          max={item.cantidad}
                          className="w-20 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-sm font-bold mx-auto outline-none focus:border-emerald-500 dark:text-white" 
                          value={item.cantidadAprobada ?? item.cantidad}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const newItems = [...itemsAprobacion];
                            newItems[idx].cantidadAprobada = val;
                            setItemsAprobacion(newItems);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-100 dark:border-slate-700">
            <Button variant="outline" onClick={() => setShowAprobarModal(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handleAprobarSubmit}>
              Confirmar Aprobación
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Rechazar Solicitud */}
      <Modal isOpen={showRechazarModal} onClose={() => setShowRechazarModal(false)} title="Rechazar Solicitud">
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Está a punto de rechazar la solicitud <strong>{solicitud.id}</strong>. Esta acción no se puede deshacer y la solicitud no podrá ser convertida en Orden de Compra.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Motivo del Rechazo *</label>
            <textarea 
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none h-24 resize-none focus:border-red-500 font-medium dark:text-white"
              placeholder="Indique la razón por la cual rechaza esta solicitud..."
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowRechazarModal(false)}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold" onClick={handleRechazarSubmit}>
              Rechazar Definitivamente
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Impresión / Vista Previa Oficial */}
      <Modal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} title="Documento Oficial - Vista Previa para Impresión">
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-3 rounded-xl no-print">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Vista previa del documento oficial listo para impresión o exportación a PDF.
            </span>
            <div className="flex items-center gap-2">
              <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs">
                <Printer className="w-4 h-4 mr-1.5" /> IMPRIMIR / DESCARGAR PDF
              </Button>
              <Button variant="outline" onClick={() => setShowPrintModal(false)} className="h-9 text-xs font-bold">
                CERRAR
              </Button>
            </div>
          </div>

          {/* Document Content to Print */}
          <div className="print-area bg-white text-slate-900 p-8 rounded-2xl border border-slate-200 font-sans space-y-6 max-w-4xl mx-auto shadow-lg">
            {/* Header Documento */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">TRANSTRANS S.A.</h2>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-0.5">Operaciones Mineras • Mina El Peñón</p>
                <p className="text-[11px] text-slate-500 mt-1">RUT: 76.543.210-9 • Tel: +56 55 244 5000</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-900 rounded font-black text-xs uppercase tracking-wider mb-2">
                  DOCUMENTO OFICIAL
                </span>
                <h3 className="text-xl font-black text-slate-900">{solicitud.id}</h3>
                <p className="text-xs text-slate-600 font-bold">Fecha: {solicitud.fecha}</p>
                <p className="text-xs font-bold mt-1 uppercase text-blue-600">Estado: {solicitud.estado}</p>
              </div>
            </div>

            {/* Título Principal */}
            <div className="text-center py-2 bg-slate-100 rounded-lg">
              <h1 className="text-lg font-black tracking-wider text-slate-800 uppercase">SOLICITUD DE COMPRA Y REQUERIMIENTO INTERNO</h1>
            </div>

            {/* Datos del Requerimiento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-500 block uppercase text-[10px]">Solicitante</span>
                <span className="font-black text-slate-800">{solicitud.solicitante || 'No especificado'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block uppercase text-[10px]">Departamento</span>
                <span className="font-black text-slate-800">{solicitud.departamento || 'Operaciones'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block uppercase text-[10px]">Centro de Costo</span>
                <span className="font-black text-slate-800">{solicitud.centroCosto || 'General'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block uppercase text-[10px]">Prioridad</span>
                <span className="font-black text-slate-800 uppercase">{solicitud.prioridad || 'MEDIA'}</span>
              </div>
            </div>

            {/* Justificación */}
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Justificación / Motivo del Requerimiento:</h4>
              <p className="text-xs p-3 bg-white border border-slate-200 rounded-lg font-medium text-slate-800">
                {solicitud.motivo || 'Sin detalle de motivo registrado.'}
              </p>
            </div>

            {/* Tabla de Ítems */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Detalle de Ítems Solicitados:</h4>
              <table className="w-full text-left text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-2 border border-slate-700 text-[10px] font-black uppercase text-center w-10">#</th>
                    <th className="p-2 border border-slate-700 text-[10px] font-black uppercase">Descripción / Repuesto</th>
                    <th className="p-2 border border-slate-700 text-[10px] font-black uppercase">Marca/Modelo</th>
                    <th className="p-2 border border-slate-700 text-[10px] font-black uppercase text-center">Cant. Sol.</th>
                    <th className="p-2 border border-slate-700 text-[10px] font-black uppercase text-center">Cant. Aprob.</th>
                    <th className="p-2 border border-slate-700 text-[10px] font-black uppercase text-right">Monto Estimado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(!solicitud.items || solicitud.items.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center italic text-slate-500">Sin ítems agregados.</td>
                    </tr>
                  ) : solicitud.items.map((item: any, idx: number) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-2 border border-slate-200 text-center font-bold">{idx + 1}</td>
                      <td className="p-2 border border-slate-200 font-bold">{item.descripcion}</td>
                      <td className="p-2 border border-slate-200">{item.marca || '-'} / {item.modelo || '-'}</td>
                      <td className="p-2 border border-slate-200 text-center font-bold">{item.cantidad} {item.unidad}</td>
                      <td className="p-2 border border-slate-200 text-center font-black text-emerald-700">{item.cantidadAprobada ?? item.cantidad} {item.unidad}</td>
                      <td className="p-2 border border-slate-200 text-right font-black">${Number(item.montoEstimado || 0).toLocaleString('es-CL')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black">
                    <td colSpan={5} className="p-2 text-right uppercase border border-slate-200">Total Estimado Requerimiento:</td>
                    <td className="p-2 text-right text-sm text-slate-900 border border-slate-200">
                      ${Number(solicitud.montoAprox || 0).toLocaleString('es-CL')} CLP
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Cuadro de Aprobaciones y Firmas */}
            <div className="pt-8 border-t border-slate-300">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-4">Firmas y Validaciones de Control:</h4>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="p-4 border border-slate-300 rounded-xl bg-slate-50">
                  <div className="h-12 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center">
                    <span className="text-[10px] text-slate-400 italic">Firma Digital Registrada</span>
                  </div>
                  <span className="block font-black text-xs text-slate-800">{solicitud.solicitante || 'Solicitante'}</span>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Solicitado por</span>
                </div>

                <div className="p-4 border border-slate-300 rounded-xl bg-slate-50">
                  <div className="h-12 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center">
                    {solicitud.aprobadoPor && <span className="text-[10px] font-bold text-emerald-600">✓ Aprobado</span>}
                  </div>
                  <span className="block font-black text-xs text-slate-800">{solicitud.aprobadoPor?.nombre || aprobadorNombre || 'Jefatura Área'}</span>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">{solicitud.aprobadoPor?.cargo || 'Aprobado por'}</span>
                </div>

                <div className="p-4 border border-slate-300 rounded-xl bg-slate-50">
                  <div className="h-12 border-b border-dashed border-slate-400 mb-2 flex items-end justify-center">
                    {solicitud.ordenCompraFolio && <span className="text-[10px] font-bold text-indigo-600">OC: {solicitud.ordenCompraFolio}</span>}
                  </div>
                  <span className="block font-black text-xs text-slate-800">Control de Compras</span>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">V°B° Adquisiciones</span>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-200">
              Documento emitido electrónicamente por Sistema Maestro ERP. Válido sin firma manuscrita.
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Generar Orden de Compra */}
      <Modal isOpen={showGenerarOCModal} onClose={() => setShowGenerarOCModal(false)} title={`Generar Orden de Compra desde Solicitud ${solicitud.id}`}>
        <div className="space-y-6 pt-2">
          <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-start gap-3">
            <ShoppingCart className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
              <p className="font-black uppercase tracking-wider">Generación Directa de Orden de Compra</p>
              <p className="font-medium">
                Complete los datos comerciales y de proveedor para convertir la Solicitud <strong>{solicitud.id}</strong> en una Orden de Compra oficial enviada a los proveedores.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase mb-1">
                Folio Orden de Compra *
              </label>
              <input 
                type="text" 
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                value={ocFolio}
                onChange={(e) => setOcFolio(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase mb-1">
                Seleccionar Proveedor *
              </label>
              <select 
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                value={ocProveedor}
                onChange={(e) => {
                  setOcProveedor(e.target.value);
                  const found = DEFAULT_PROVEEDORES.find(p => p.nombre === e.target.value);
                  if (found) setOcRutProveedor(found.rut);
                }}
              >
                {DEFAULT_PROVEEDORES.map((p, idx) => (
                  <option key={idx} value={p.nombre}>{p.nombre} ({p.rut})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase mb-1">
                RUT Proveedor
              </label>
              <input 
                type="text" 
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                value={ocRutProveedor}
                onChange={(e) => setOcRutProveedor(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase mb-1">
                Condición de Pago
              </label>
              <select 
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                value={ocCondicionPago}
                onChange={(e) => setOcCondicionPago(e.target.value)}
              >
                <option value="Contado">Contado</option>
                <option value="15 Días">15 Días</option>
                <option value="30 Días">30 Días</option>
                <option value="60 Días">60 Días</option>
                <option value="90 Días">90 Días</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase mb-1">
                Fecha Prometida Entrega
              </label>
              <input 
                type="date" 
                className="w-full h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                value={ocFechaEntrega}
                onChange={(e) => setOcFechaEntrega(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase mb-1">
                Incluir IVA (19%)
              </label>
              <div className="flex items-center h-10 px-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                <input 
                  type="checkbox" 
                  id="chkIva"
                  checked={ocIncludeIva} 
                  onChange={(e) => setOcIncludeIva(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                <label htmlFor="chkIva" className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Añadir 19% IVA al total final
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase mb-1">
              Observaciones / Instrucciones de Despacho
            </label>
            <textarea 
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:border-indigo-500 h-20 resize-none"
              value={ocNotas}
              onChange={(e) => setOcNotas(e.target.value)}
            ></textarea>
          </div>

          {/* Item prices table */}
          <div>
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
              Detalle de Ítems Aprobados y Cotización
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 font-black text-slate-500 uppercase">Ítem / Descripción</th>
                    <th className="p-3 font-black text-slate-500 uppercase text-center">Cant. Aprobada</th>
                    <th className="p-3 font-black text-slate-500 uppercase text-right">Precio Unit. ($)</th>
                    <th className="p-3 font-black text-slate-500 uppercase text-right">Subtotal ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {(!solicitud.items || solicitud.items.length === 0) ? (
                    <tr><td colSpan={4} className="p-4 text-center italic text-slate-400">Sin ítems.</td></tr>
                  ) : solicitud.items.map((item: any, idx: number) => {
                    const qty = Number(item.cantidadAprobada ?? item.cantidad);
                    const price = Number(ocItemsPrices[idx] ?? item.montoEstimado ?? 0);
                    const subtotal = qty * price;
                    return (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                          {item.descripcion}
                          <span className="block text-[10px] text-slate-400">Categoría: {item.categoria || 'General'}</span>
                        </td>
                        <td className="p-3 text-center font-black text-slate-800 dark:text-white">
                          {qty} {item.unidad}
                        </td>
                        <td className="p-3 text-right">
                          <input 
                            type="number" 
                            className="w-28 text-right p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-black bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                            value={ocItemsPrices[idx] ?? ''}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setOcItemsPrices(prev => ({ ...prev, [idx]: val }));
                            }}
                          />
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                          ${Math.round(subtotal).toLocaleString('es-CL')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => setShowGenerarOCModal(false)}>
              CANCELAR
            </Button>
            <Button onClick={handleConfirmarGenerarOC} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
              <ShoppingCart className="w-4 h-4 mr-2" /> GENERAR ORDEN DE COMPRA
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

