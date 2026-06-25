import React, { useState } from 'react';
import { 
  Package, History, Smartphone, Boxes, Plus, Download, 
  Search, Pencil, Trash2, AlertTriangle, AlertCircle, ArrowLeft, ArrowRightLeft, CheckCircle,
  FileText as Edit
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAppContext } from '../../context/AppContext';
import { useCompany } from '../../contexts/CompanyContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Interfaces to maintain TypeScript types
interface Insumo {
  id: number;
  nombre: string;
  sku: string;
  proveedor: string;
  ubicacion: string;
  calidad: string;
  stock: number;
  min: number;
  ultMov: string;
  precio: number;
  valorTotal: number;
  isCritico: boolean;
  categoria?: string;
}

interface HistorialMovimiento {
  id: number;
  fechaHora: string;
  tipo: string;
  cant: number;
  responsable: string;
  referencia: string;
  notas: string;
}

const mockHistorialMovimientos: HistorialMovimiento[] = [];

interface AuditoriaData {
  id: number;
  fecha: string;
  hora: string;
  repuestoNombre: string;
  sku: string;
  proveedor: string;
  ubicacion: string;
  tipo: string;
  cant: number;
  notas: string;
  usuario: string;
  esEnlace?: boolean;
}

const mockAuditoriaData: AuditoriaData[] = [];

interface ValidacionData {
  id: number;
  fecha: string;
  hora: string;
  repuestoNombre: string;
  sku: string;
  cant: number;
  notas: string;
  usuario: string;
}

const mockValidacionesData: ValidacionData[] = [];

export default function GestionSuministros() {
  const { proveedores, ordenesTrabajo, actualizarOrdenTrabajo } = useAppContext();
  const { currentCompany } = useCompany();
  const navigate = useNavigate();
  const [sumInsumosData, setSumInsumosData] = React.useState<Insumo[]>([]);
  
  const [bodegasList, setBodegasList] = React.useState<any[]>([]);

  const loadData = React.useCallback(async () => {
      // Intentar cargar desde supabase
      if (!currentCompany?.id) return;
      
      const fetchAllRows = async (queryBuilder: any) => {
        let allData: any[] = [];
        let start = 0;
        const pageSize = 1000;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await queryBuilder.range(start, start + pageSize - 1);
          if (error) {
            console.error(error);
            break;
          }
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            start += pageSize;
          }
          if (!data || data.length < pageSize) {
            hasMore = false;
          }
        }
        return allData;
      };

      const bData = await fetchAllRows(supabase.from('logistica_bodegas').select('*').eq('empresa_id', currentCompany.id));
      if (bData && bData.length > 0) {
        setBodegasList(bData);
      } else {
        // Fallback or empty
        setBodegasList([]);
      }

      const rData = await fetchAllRows(supabase.from('logistica_repuestos').select(`
        *,
        logistica_bodegas (
          nombre
        )
      `).eq('empresa_id', currentCompany.id));
      
      if (rData && rData.length > 0) {
        setSumInsumosData(rData.map((r: any) => {
          const parsedPrecio = parseFloat(r.precio) || 0;
          const parsedStock = parseInt(r.stock) || 0;
          return {
            ...r,
            precio: parsedPrecio,
            stock: parsedStock,
            min: r.min_stock || 0,
            valorTotal: parsedPrecio * parsedStock,
            ultMov: r.ult_mov ? new Date(r.ult_mov).toLocaleDateString() : '--',
            bodegaNombre: r.logistica_bodegas?.nombre || null,
            categoria: r.categoria || 'General'
          };
        }));
      } else {
         setSumInsumosData([]);
      }

      const mvData = await fetchAllRows(supabase.from('logistica_movimientos').select(`
        *,
        logistica_repuestos (nombre, sku, proveedor, ubicacion, logistica_bodegas(nombre))
      `).eq('empresa_id', currentCompany.id).order('created_at', { ascending: false }));
      
      if (mvData && mvData.length > 0) {
         setAuditoriaData(mvData);
         
         const pendientes = mvData.filter((m: any) => m.tipo === 'PENDIENTE_VALIDACION' && m.estado === 'PENDIENTE');
         setValidacionesList(pendientes.map((p: any) => ({
             id: p.id,
             fecha: new Date(p.created_at).toLocaleDateString(),
             hora: new Date(p.created_at).toLocaleTimeString(),
             repuestoNombre: p.referencia || p.logistica_repuestos?.nombre || 'Producto Desconocido',
             sku: p.notas || p.logistica_repuestos?.sku || '--',
             cant: p.cantidad,
             notas: `Solicitado por ${p.usuario_nombre || 'Desconocido'}`,
             usuario: p.usuario_nombre || 'Sistema'
         })));
      }
    }, [currentCompany]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTerminalSubmit = async () => {
    if (!currentCompany?.id) {
       return;
    }
    
    try {
       // Find SKU in all bodegas
       let query = supabase.from('logistica_repuestos')
         .select('*, logistica_bodegas(nombre)')
         .eq('empresa_id', currentCompany.id);
       
       if (terminalForm.repuestoId) {
           query = query.eq('id', terminalForm.repuestoId);
       } else {
           query = query.eq('sku', terminalForm.sku);
       }

       const { data: reps, error: rErr } = await query;

       let rep = null;
       let isNewProduct = false;

       if (reps && reps.length > 0) {
           if (terminalForm.tipoMovimiento === 'ENTRADA') {
               // Prefer the one in the selected bodega, or just the first one we find
               rep = reps.find(r => r.bodega_id === terminalForm.bodegaId) || reps[0];
               
               // Alert about coincidence if it was scanned
               await Swal.fire("Coincidencia Encontrada", `El SKU ${rep.sku} ya existe como "${rep.nombre}" en ${rep.logistica_bodegas?.nombre || 'la bodega'}. Se sumará al stock existente.`, "info");
           } else {
               rep = reps.find(r => r.bodega_id === terminalForm.bodegaId);
               if (!rep) {
                   rep = reps.find(r => r.stock >= terminalForm.cantidad) || reps[0];
               }
           }
       } else {
          if (terminalForm.tipoMovimiento === 'ENTRADA') {
             if (!terminalForm.bodegaId) {
                Swal.fire("Error", "Seleccione una bodega destino para este nuevo SKU", "error");
                return;
             }
             isNewProduct = true;
          } else {
             Swal.fire("Error", "SKU no encontrado en ninguna bodega, no puede extraer stock", "error");
             return;
          }
       }

       if (isNewProduct) {
           // Create new product
           const { data: newRep, error: createErr } = await supabase.from('logistica_repuestos').insert({
               empresa_id: currentCompany.id,
               sku: terminalForm.sku,
               nombre: terminalForm.nombre || `Repuesto ${terminalForm.sku}`,
               bodega_id: terminalForm.bodegaId,
               stock: terminalForm.cantidad,
               precio: 0,
               valor_total: 0,
               calidad: 'ORIGINAL',
               estado: 'ACTIVO',
               ult_mov: new Date().toISOString()
           }).select().single();

           if (createErr || !newRep) {
               Swal.fire("Error", "No se pudo crear el nuevo repuesto.", "error");
               return;
           }

           await supabase.from('logistica_movimientos').insert({
               empresa_id: currentCompany.id,
               repuesto_id: newRep.id,
               tipo: 'ENTRADA',
               cantidad: terminalForm.cantidad,
               notas: `Ingreso Inicial - Solicitante: ${terminalForm.solicitante}, Destino: ${terminalForm.destino}`,
               estado: 'COMPLETADO'
           });

           Swal.fire("Éxito", `Nuevo producto creado y stock ingresado correctamente.`, "success");
           await loadData();
           setIsTerminalModalOpen(false);
           setTerminalForm({
             repuestoId: '', sku: '', nombre: '', bodegaId: '', tipoMovimiento: 'SALIDA', 
             cantidad: 1, solicitante: '', autorizador: '', destino: ''
           });
           return;
       }

       let repId = rep?.id;
       
       if (terminalForm.tipoMovimiento === 'SALIDA') {
          if (rep && rep.stock < terminalForm.cantidad) {
             Swal.fire("Error", `Stock insuficiente. Stock actual en ${rep.logistica_bodegas?.nombre || 'la bodega'}: ${rep.stock} unidades.`, "error");
             return;
          }
       }

       if (repId && rep) {
          // Normal movement
          const newStock = terminalForm.tipoMovimiento === 'ENTRADA' ? rep.stock + terminalForm.cantidad : rep.stock - terminalForm.cantidad;
          
          await supabase.from('logistica_repuestos').update({ 
             stock: newStock,
             ult_mov: new Date().toISOString()
          }).eq('id', repId);
          
          await supabase.from('logistica_movimientos').insert({
             empresa_id: currentCompany.id,
             repuesto_id: repId,
             tipo: terminalForm.tipoMovimiento,
             cantidad: terminalForm.cantidad,
             notas: `Solicitante: ${terminalForm.solicitante}, Autorizador: ${terminalForm.autorizador}, Destino: ${terminalForm.destino}`,
             estado: 'COMPLETADO'
          });
          
          Swal.fire("Éxito", `Movimiento procesado correctamente.`, "success");
          
          // Refetch
          await loadData();
       }
       
       setIsTerminalModalOpen(false);
       setTerminalForm({
         repuestoId: '', sku: '', nombre: '', bodegaId: '', tipoMovimiento: 'SALIDA', 
         cantidad: 1, solicitante: '', autorizador: '', destino: ''
       });
    } catch (e) {
       console.error(e);
       Swal.fire("Error", "Error al procesar", "error");
    }
  };

  const [activeView, setActiveView] = useState<'inventario' | 'auditoria' | 'validaciones' | 'solicitudesOT'>('inventario');
  const [entriesPerPage, setEntriesPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [auditoriaData, setAuditoriaData] = React.useState<any[]>([]);
  const [auditoriaSearchTerm, setAuditoriaSearchTerm] = useState('');
  const [auditoriaDesde, setAuditoriaDesde] = useState('');
  const [auditoriaHasta, setAuditoriaHasta] = useState('');
  const [auditoriaMovimiento, setAuditoriaMovimiento] = useState('Cualquier Movimiento');
  const [auditoriaUsuario, setAuditoriaUsuario] = useState('Cualquier Usuario');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBodega, setSelectedBodega] = useState('Todas las bodegas');
  const [selectedUbicacion, setSelectedUbicacion] = useState('Todas las ubicaciones');
  const [selectedCalidad, setSelectedCalidad] = useState('Todas las calidades');
  const [selectedCategoria, setSelectedCategoria] = useState('Todas las categorías');
  const [selectedProveedor, setSelectedProveedor] = useState('Todos los proveedores');
  const [filterBajoStock, setFilterBajoStock] = useState(false);
  const [filterSinMov, setFilterSinMov] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedRepuestoDetalle, setSelectedRepuestoDetalle] = useState<Insumo | null>(null);
  const [repuestoMovimientos, setRepuestoMovimientos] = useState<any[]>([]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBodega, selectedUbicacion, selectedCalidad, selectedCategoria, selectedProveedor, filterBajoStock, filterSinMov]);

  React.useEffect(() => {
     if (selectedRepuestoDetalle) {
        supabase.from('logistica_movimientos').select('*').eq('repuesto_id', selectedRepuestoDetalle.id).order('created_at', { ascending: false }).then(({ data, error }) => {
           if (!error && data) setRepuestoMovimientos(data);
        });
     } else {
        setRepuestoMovimientos([]);
     }
  }, [selectedRepuestoDetalle]);
  
  // States for Movimiento Masivo
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [destinationBodega, setDestinationBodega] = useState('');

  // States for Validaciones
  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
  const [itemToValidate, setItemToValidate] = useState<typeof mockValidacionesData[0] | null>(null);
  const [validateType, setValidateType] = useState<'OT' | 'GASTO'>('OT');
  const [validateOtId, setValidateOtId] = useState('');
  const [validateGastoCat, setValidateGastoCat] = useState('');
  const [validacionesList, setValidacionesList] = useState(mockValidacionesData);

  const [validacionesSearchTerm, setValidacionesSearchTerm] = useState('');

  // States for Terminal (Entrada / Salida)
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [showTerminalAutocomplete, setShowTerminalAutocomplete] = useState(false);
  const [terminalForm, setTerminalForm] = useState({
    repuestoId: '',
    sku: '',
    nombre: '',
    bodegaId: '',
    tipoMovimiento: 'SALIDA',
    cantidad: 1,
    solicitante: '',
    autorizador: '',
    destino: ''
  });

  const [isEditRepuestoModalOpen, setIsEditRepuestoModalOpen] = useState(false);
  const [editRepuestoObj, setEditRepuestoObj] = useState<Insumo | null>(null);

  // States for New Repuesto (Nuevo)
  const [isNewRepuestoModalOpen, setIsNewRepuestoModalOpen] = useState(false);
  const [newRepuestoForm, setNewRepuestoForm] = useState({
    nombre: '',
    numeroParte: '',
    calidad: 'ORIGINAL',
    origen: 'OEM',
    nivelCriticidad: 'INSUMO',
    stockActual: 0,
    stockMinimo: 0,
    diasStockObjetivo: 30,
    ubicacion: '',
    precioUnitario: 0,
    bodegaId: '1', // Default bodega
    proveedorId: ''
  });

  const filteredValidaciones = validacionesList.filter(v => 
    v.repuestoNombre.toLowerCase().includes(validacionesSearchTerm.toLowerCase()) ||
    v.sku.toLowerCase().includes(validacionesSearchTerm.toLowerCase()) ||
    v.notas.toLowerCase().includes(validacionesSearchTerm.toLowerCase()) ||
    v.usuario.toLowerCase().includes(validacionesSearchTerm.toLowerCase())
  );

  const filteredAuditoria = auditoriaData.filter(v => {
    let match = true;
    if (auditoriaSearchTerm) {
      const st = auditoriaSearchTerm.toLowerCase();
      const n = (v.logistica_repuestos?.nombre || '').toLowerCase();
      const sku = (v.logistica_repuestos?.sku || '').toLowerCase();
      const ref = (v.referencia || '').toLowerCase();
      const notas = (v.notas || '').toLowerCase();
      if (!n.includes(st) && !sku.includes(st) && !ref.includes(st) && !notas.includes(st)) {
        match = false;
      }
    }
    if (auditoriaDesde) {
      if (new Date(v.created_at) < new Date(auditoriaDesde + 'T00:00:00')) match = false;
    }
    if (auditoriaHasta) {
      if (new Date(v.created_at) > new Date(auditoriaHasta + 'T23:59:59')) match = false;
    }
    if (auditoriaMovimiento && auditoriaMovimiento !== 'Cualquier Movimiento') {
      if (v.tipo !== auditoriaMovimiento) match = false;
    }
    if (auditoriaUsuario && auditoriaUsuario !== 'Cualquier Usuario') {
      if (v.usuario_nombre !== auditoriaUsuario) match = false;
    }
    return match;
  });

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const paginatedIds = paginatedData.map(item => item.id);
      const newSelected = [...selectedItems];
      paginatedIds.forEach(id => {
         if (!newSelected.includes(id)) newSelected.push(id);
      });
      setSelectedItems(newSelected);
    } else {
      const paginatedIds = paginatedData.map(item => item.id);
      setSelectedItems(selectedItems.filter(id => !paginatedIds.includes(id)));
    }
  };

  const handleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Helper to check if a date string 'DD/MM/YYYY' is older than 6 months
  const isOlderThan6Months = (dateStr: string) => {
    if (dateStr === '--') return true; // Assuming never moved implies no movement in 6 months
    const [day, month, year] = dateStr.split('/');
    if (!day || !month || !year) return false;
    const itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return itemDate < sixMonthsAgo;
  };

  // Unique lists for selects
  const uniqueCalidades = Array.from(new Set(sumInsumosData.map(item => item.calidad?.toUpperCase()).filter(Boolean)));
  const uniqueProveedores = Array.from(new Set(sumInsumosData.map(item => item.proveedor?.toUpperCase()).filter(Boolean)));
  const uniqueUbicaciones = Array.from(new Set(sumInsumosData.map(item => item.ubicacion).filter(Boolean)));
  // Collect actual bodegas loaded
  const allBodegasOptions = Array.from(new Set(bodegasList.map(b => b.nombre).filter(Boolean)));

  // Filtering logic
  const filteredData = sumInsumosData.filter((item) => {
    // 1. Text Search (SKU / Nombre)
    const matchesSearch = 
      searchTerm === '' || 
      item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Bodega Filter
    const matchesBodega = 
      selectedBodega === 'Todas las bodegas' || 
      item.bodegaNombre === selectedBodega;

    // 3. Ubicacion Filter
    const matchesUbicacion = 
      selectedUbicacion === 'Todas las ubicaciones' ||
      item.ubicacion === selectedUbicacion;

    // 4. Calidad Filter (Case Insensitive)
    const matchesCalidad = 
      selectedCalidad === 'Todas las calidades' || 
      (!item.calidad && selectedCalidad === 'Todas las calidades') ||
      (item.calidad && item.calidad.toUpperCase() === selectedCalidad.toUpperCase());

    // 4. Proveedor Filter (Case Insensitive)
    const matchesProveedor = 
      selectedProveedor === 'Todos los proveedores' || 
      (!item.proveedor && selectedProveedor === 'Todos los proveedores') ||
      (item.proveedor && item.proveedor.toUpperCase() === selectedProveedor.toUpperCase());

    // 5. Bajo Stock Filter
    const matchesBajoStock = filterBajoStock ? (item.stock < item.min) : true;

    // 6. Sin Movimiento (6 meses)
    const matchesSinMov = filterSinMov ? isOlderThan6Months(item.ultMov) : true;

    return matchesSearch && matchesBodega && matchesUbicacion && matchesCalidad && matchesProveedor && matchesBajoStock && matchesSinMov;
  });

  const exportInventario = () => {
    const headers = ['Nombre', 'SKU', 'Ubicación', 'Posición', 'Calidad', 'Proveedor', 'Precio Un.', 'Stock Actual', 'Mínimo', 'Último Mov.', 'Valor Total'];
    
    const rows = filteredData.map(item => [
      `"${item.nombre}"`,
      `"${item.sku}"`,
      `"${item.ubicacion}"`,
      `""`,
      `"${item.calidad}"`,
      `"${item.proveedor}"`,
      item.precio,
      item.stock,
      item.min,
      `"${item.ultMov}"`,
      item.valorTotal
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const [auditoriaPage, setAuditoriaPage] = useState(1);
  const [auditoriaPerPage, setAuditoriaPerPage] = useState(50);
  const paginatedAuditoria = filteredAuditoria.slice((auditoriaPage - 1) * auditoriaPerPage, auditoriaPage * auditoriaPerPage);

  const exportAuditoria = () => {
    const headers = ['Fecha/Hora', 'Repuesto', 'SKU', 'Proveedor', 'Ubicación', 'Tipo', 'Cantidad', 'Notas/Referencia', 'Usuario'];
    const rows = filteredAuditoria.map(item => {
      const cant = (item.tipo === 'ENTRADA' || (item.cantidad > 0 && item.tipo !== 'ENTRADA' && item.tipo !== 'SALIDA' && item.tipo !== 'TRASLADO') ? '+' : item.tipo === 'SALIDA' ? '-' : '') + Math.abs(item.cantidad);
      return [
        `"${new Date(item.created_at).toLocaleString()}"`,
        `"${item.logistica_repuestos?.nombre || 'Eliminado'}"`,
        `"${item.logistica_repuestos?.sku || '--'}"`,
        `"${item.logistica_repuestos?.proveedor || '--'}"`,
        `"${item.logistica_repuestos?.logistica_bodegas?.nombre || '--'} - ${item.logistica_repuestos?.ubicacion || '--'}"`,
        `"${item.tipo}"`,
        cant,
        `"${item.notas || item.referencia || ''}"`,
        `"${item.usuario_nombre || 'Sistema'}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const valorizacionFiltrada = filteredData.reduce((acc, item) => acc + item.valorTotal, 0);

  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const handleDeleteRepuesto = async (id: number) => {
    const res = await Swal.fire({
      title: '¿Eliminar repuesto?',
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar'
    });
    if (res.isConfirmed) {
      const { error } = await supabase.from('logistica_repuestos').delete().eq('id', id);
      if (!error) {
        Swal.fire("Eliminado", "Repuesto eliminado", "success");
        loadData();
      } else {
        Swal.fire("Error", "No se pudo eliminar", "error");
      }
    }
  };

  const handleBulkDelete = async () => {
    const res = await Swal.fire({
      title: '¿Eliminar repuestos seleccionados?',
      text: `Se eliminarán ${selectedItems.length} repuesto(s). Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar masivamente',
      cancelButtonText: 'Cancelar'
    });
    if (res.isConfirmed) {
      // Supabase URI limit avoidance: 20 is safe for UUID lists
      const CHUNK_SIZE = 20;
      let hasError = false;
      let lastErrorMessage = '';
      
      for (let i = 0; i < selectedItems.length; i += CHUNK_SIZE) {
        const chunk = selectedItems.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from('logistica_repuestos').delete().in('id', chunk);
        if (error) {
          hasError = true;
          // If the error message is empty or missing, provide a generic fallback
          lastErrorMessage = error.message || 'Error desconocido (posibles limitantes de URI o RLS).';
          console.error("Bulk Delete Error:", error);
          break;
        }
      }

      if (!hasError) {
        Swal.fire("Eliminados", "Repuestos eliminados correctamente", "success");
        setSelectedItems([]);
        loadData();
      } else {
        Swal.fire("Error", "No se pudieron eliminar los repuestos\n" + lastErrorMessage, "error");
        loadData(); // reload anyway to show what was deleted
      }
    }
  };

  if (activeView === 'auditoria') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <History className="w-8 h-8 text-slate-800 dark:text-slate-200" />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Auditoría de Bodega</h1>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 uppercase font-medium">
              CONTROL E HISTORIAL DE MOVIMIENTOS
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" className="bg-slate-500 hover:bg-slate-600 text-white border-0" onClick={() => setActiveView('inventario')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              VOLVER
            </Button>
            
            <Button className="bg-[#10b981] hover:bg-[#059669] text-white" onClick={exportAuditoria}>
              <Download className="w-4 h-4 mr-2" />
              EXPORTAR EXCEL
            </Button>
          </div>
        </div>

        {/* Filters section */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder="Buscar Repuesto, SKU o Notas..."
              value={auditoriaSearchTerm}
              onChange={(e) => setAuditoriaSearchTerm(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">DESDE:</span>
            <input 
              type="date" 
              value={auditoriaDesde}
              onChange={(e) => setAuditoriaDesde(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 bg-transparent text-sm dark:bg-slate-800" 
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">HASTA:</span>
            <input 
              type="date" 
              value={auditoriaHasta}
              onChange={(e) => setAuditoriaHasta(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 bg-transparent text-sm dark:bg-slate-800" 
            />
          </div>

          <select 
             className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800"
             value={auditoriaMovimiento}
             onChange={(e) => setAuditoriaMovimiento(e.target.value)}
          >
            <option>Cualquier Movimiento</option>
            <option>ENTRADA</option>
            <option>SALIDA</option>
            <option>TRASLADO</option>
            <option>CORRECCIÓN_MANUAL</option>
          </select>

          <select 
             className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800"
             value={auditoriaUsuario}
             onChange={(e) => setAuditoriaUsuario(e.target.value)}
          >
            <option>Cualquier Usuario</option>
            {Array.from(new Set(auditoriaData.map(v => v.usuario_nombre).filter(Boolean))).map(u => (
               <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Table section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              Show 
              <select 
                className="border border-slate-300 dark:border-slate-700 rounded px-2 py-1 mx-1 bg-transparent text-sm"
                value={auditoriaPerPage}
                onChange={(e) => {
                   setAuditoriaPerPage(Number(e.target.value));
                   setAuditoriaPage(1);
                }}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
              </select> 
              entries
              <span className="ml-4 font-medium text-slate-700 dark:text-slate-300">
                Mostrando {Math.min((auditoriaPage - 1) * auditoriaPerPage + 1, filteredAuditoria.length)} - {Math.min(auditoriaPage * auditoriaPerPage, filteredAuditoria.length)} de {filteredAuditoria.length} registros
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800 font-bold bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3">FECHA / HORA <span className="font-light">▼</span></th>
                  <th className="px-4 py-3">REPUESTO / SKU <span className="font-light">▼</span></th>
                  <th className="px-4 py-3">PROVEEDOR <span className="font-light">▼</span></th>
                  <th className="px-4 py-3">UBIC. <span className="font-light">▼</span></th>
                  <th className="px-4 py-3 text-center">TIPO <span className="font-light">▼</span></th>
                  <th className="px-4 py-3 text-center">CANT. <span className="font-light">▼</span></th>
                  <th className="px-4 py-3 w-1/3">REFERENCIA / NOTAS</th>
                  <th className="px-4 py-3">USUARIO <span className="font-light">▼</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedAuditoria.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs"><span>{new Date(item.created_at).toLocaleDateString()}</span></div>
                      <div className="text-[10px] text-slate-500"><span>{new Date(item.created_at).toLocaleTimeString()}</span></div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-bold text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer">
                        <span>{item.logistica_repuestos?.nombre || 'Repuesto Eliminado'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        <span>SKU: {item.logistica_repuestos?.sku || '--'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-600 dark:text-slate-400"><span>{item.logistica_repuestos?.proveedor || '--'}</span></td>
                    <td className="px-4 py-3 align-top text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>
                      {item.logistica_repuestos?.logistica_bodegas?.nombre ? `${item.logistica_repuestos?.logistica_bodegas?.nombre} - ` : ''}
                      {item.logistica_repuestos?.ubicacion || '--'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                        ${item.tipo === 'SALIDA' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 
                          item.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          item.tipo === 'CORRECCIÓN_MANUAL' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                          'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        {item.tipo}
                      </span>
                    </td>
                    <td className={`px-4 py-3 align-top text-center font-bold text-sm ${item.tipo === 'SALIDA' ? 'text-orange-500' : item.tipo === 'ENTRADA' ? 'text-emerald-500' : item.tipo === 'CORRECCIÓN_MANUAL' ? 'text-purple-500' : 'text-blue-500'}`}>
                      <span>{item.cantidad > 0 ? '+' : ''}{item.cantidad}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium leading-tight">
                        <span>{item.notas || item.referencia}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span>{item.usuario_nombre || 'Sistema'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 gap-4">
            <div className="text-sm text-slate-500 font-medium">
              Página {auditoriaPage} de {Math.ceil(filteredAuditoria.length / auditoriaPerPage) || 1}
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                className="px-3 py-1.5 h-auto text-xs font-semibold"
                disabled={auditoriaPage === 1}
                onClick={() => setAuditoriaPage(prev => Math.max(1, prev - 1))}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(filteredAuditoria.length / auditoriaPerPage)) }, (_, i) => {
                  const total = Math.ceil(filteredAuditoria.length / auditoriaPerPage);
                  let pageNum = auditoriaPage - 2 + i;
                  if (auditoriaPage <= 3) pageNum = i + 1;
                  else if (auditoriaPage >= total - 2) pageNum = total - 4 + i;
                  
                  if (pageNum > 0 && pageNum <= total) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setAuditoriaPage(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold transition-colors
                          ${auditoriaPage === pageNum 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>
              <Button 
                variant="secondary" 
                className="px-3 py-1.5 h-auto text-xs font-semibold"
                disabled={auditoriaPage >= Math.ceil(filteredAuditoria.length / auditoriaPerPage)}
                onClick={() => setAuditoriaPage(prev => Math.min(Math.ceil(filteredAuditoria.length / auditoriaPerPage), prev + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'validaciones') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <AlertCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Validación de Salidas de Bodega</h1>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 uppercase font-medium">
              Repositorio temporal para movimientos pendientes (24 Horas)
            </div>
          </div>

          <Button variant="secondary" className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm" onClick={() => setActiveView('inventario')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            VOLVER AL INVENTARIO
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">Pendientes de Validación</h3>
            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                placeholder="Buscar repuesto, nota o usuario..."
                value={validacionesSearchTerm}
                onChange={(e) => setValidacionesSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800 font-bold bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">DETALLE DEL REPUESTO</th>
                  <th className="px-6 py-4 text-center">CANT.</th>
                  <th className="px-6 py-4">NOTAS / ORIGEN</th>
                  <th className="px-6 py-4">USUARIO / FECHA</th>
                  <th className="px-6 py-4 text-right">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredValidaciones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <AlertCircle className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-base font-medium text-slate-600 dark:text-slate-400">No hay salidas pendientes de validación</p>
                        <p className="text-sm mt-1">Todas las salidas de bodega están asignadas correctamente.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredValidaciones.map((item) => (
                    <tr key={item.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group">
                      <td className="px-6 py-4 align-top">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {item.repuestoNombre}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                          SKU: {item.sku}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm border border-red-100 dark:border-red-800/30">
                          {item.cant}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="max-w-xs xl:max-w-md">
                          <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-medium leading-relaxed bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                            {item.notas}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                          {item.usuario}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 group-hover:text-indigo-500 transition-colors">
                          <History className="w-3 h-3" />
                          {item.fecha} {item.hora}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-right">
                        <Button 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                          onClick={() => {
                            setItemToValidate(item);
                            setIsValidateModalOpen(true);
                          }}
                        >
                          VALIDAR
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Validate Modal */}
        <Modal
          isOpen={isValidateModalOpen}
          onClose={() => setIsValidateModalOpen(false)}
          title="Validar Consumo / Salida"
        >
          {itemToValidate && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-2">Detalles del Movimiento</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-xs text-slate-500">Repuesto</span>
                    <span className="font-medium dark:text-slate-300">{itemToValidate.repuestoNombre}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Cantidad</span>
                    <span className="font-bold text-red-500">{itemToValidate.cant}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs text-slate-500">Notas</span>
                    <span className="text-slate-600 dark:text-slate-400 italic text-xs">{itemToValidate.notas}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">¿Cómo quieres validar este movimiento?</h4>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${validateType === 'OT' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <input type="radio" name="validateType" value="OT" className="hidden" checked={validateType === 'OT'} onChange={() => setValidateType('OT')} />
                    Cargar a O.T.
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${validateType === 'GASTO' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <input type="radio" name="validateType" value="GASTO" className="hidden" checked={validateType === 'GASTO'} onChange={() => setValidateType('GASTO')} />
                    Gasto Interno
                  </label>
                </div>

                {validateType === 'OT' ? (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Seleccionar O.T. Abierta</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200"
                      value={validateOtId}
                      onChange={(e) => setValidateOtId(e.target.value)}
                    >
                      <option value="">Seleccione una OT...</option>
                      <option value="OT-1001">OT-1001 - Camión Volvo FH16 (En Proceso)</option>
                      <option value="OT-1002">OT-1002 - Bus Scania K400 (Pendiente)</option>
                      <option value="OT-1005">OT-1005 - Camioneta Hilux (En Proceso)</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Categoría de Gasto</label>
                    <select 
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200"
                      value={validateGastoCat}
                      onChange={(e) => setValidateGastoCat(e.target.value)}
                    >
                      <option value="">Seleccione una categoría...</option>
                      <option value="Taller">Taller / Reparación Interna</option>
                      <option value="Administracion">Administración</option>
                      <option value="Consumo de Chofer">Consumo de Chofer</option>
                      <option value="Merma">Merma / Pérdida</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setIsValidateModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={validateType === 'OT' ? !validateOtId : !validateGastoCat}
              onClick={async () => {
                if (itemToValidate) {
                  await supabase.from('logistica_movimientos').update({
                     estado: 'COMPLETADO',
                     referencia: validateType === 'OT' ? validateOtId : validateGastoCat
                  }).eq('id', itemToValidate.id);
                  loadData();
                  
                  setIsValidateModalOpen(false);
                  setItemToValidate(null);
                  setValidateOtId('');
                  setValidateGastoCat('');
                  Swal.fire("Validado", "El movimiento ha sido validado correctamente", "success");
                }
              }}
            >
              Confirmar Validación
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  const entregarSolicitudOt = (otId: string, solicitudId: string) => {
    const ot = ordenesTrabajo.find(o => o.id === otId);
    if (!ot || !ot.solicitudes) return;
    
    const nuevasSolicitudes = ot.solicitudes.map(s => {
       if (s.id === solicitudId) {
          return { ...s, estado: 'ENTREGADA' };
       }
       return s;
    });

    actualizarOrdenTrabajo({
      ...ot,
      solicitudes: nuevasSolicitudes,
      historial: [
        ...ot.historial,
        {
          id: Math.random().toString(36).substr(2, 9),
          orden_id: ot.id,
          comentario: `Bodega: Repuesto entregado (${ot.solicitudes.find(s => s.id === solicitudId)?.repuesto_nombre})`,
          created_at: new Date().toISOString(),
          usuario_nombre: 'Logística / Bodega'
        }
      ]
    });
    
    Swal.fire("Entregado", "El repuesto ha sido marcado como entregado a Taller.", "success");
  };

  if (activeView === 'solicitudesOT') {
    // Get all OT solicitudes
    const solicitudesOt = ordenesTrabajo.flatMap(ot => 
      (ot.solicitudes || []).map(s => ({
        ...s,
        ot_id: ot.id,
        ot_folio: ot.folio,
        vehiculo: ot.vehiculo?.patente || 'Desconocido',
        tecnico: ot.tecnico?.nombre || 'Sin Técnico'
      }))
    ).filter(s => s.estado === 'PENDIENTE' || s.estado === 'APROBADA' || s.estado === 'RECHAZADA' || s.estado === 'ENTREGADA');
    
    // Sort logic
    solicitudesOt.sort((a, b) => new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime());

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                <Boxes className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Solicitudes de Taller (O.T.)</h1>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 uppercase font-medium">
              Repuestos solicitados directamente desde las Órdenes de Trabajo por los mecánicos
            </div>
          </div>

          <Button variant="secondary" className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm" onClick={() => setActiveView('inventario')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            VOLVER AL INVENTARIO
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800 font-bold bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4">FECHA</th>
                  <th className="px-6 py-4">O.T. / VEHÍCULO</th>
                  <th className="px-6 py-4">TÉCNICO</th>
                  <th className="px-6 py-4">REPUESTO SOLICITADO</th>
                  <th className="px-6 py-4 text-center">CANTIDAD</th>
                  <th className="px-6 py-4 text-center">ESTADO</th>
                  <th className="px-6 py-4 text-right">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {solicitudesOt.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Package className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-base font-medium text-slate-600 dark:text-slate-400">No hay solicitudes de taller registradas.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  solicitudesOt.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{new Date(s.fecha_solicitud).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{s.ot_folio}</div>
                        <div className="text-xs text-slate-500">{s.vehiculo}</div>
                      </td>
                      <td className="px-6 py-4">{s.tecnico}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{s.repuesto_nombre}</td>
                      <td className="px-6 py-4 text-center font-bold text-lg">{s.cantidad}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                          ${s.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700' :
                            s.estado === 'APROBADA' ? 'bg-indigo-100 text-indigo-700' :
                            s.estado === 'RECHAZADA' ? 'bg-red-100 text-red-700' :
                            s.estado === 'ENTREGADA' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-700'}`}>
                          {s.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {s.estado === 'APROBADA' && (
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                            onClick={() => entregarSolicitudOt(s.ot_id, s.id)}
                          >
                            MARCAR ENTREGADO
                          </Button>
                        )}
                        {s.estado === 'PENDIENTE' && (
                          <span className="text-xs text-slate-400 italic">Esperando aprobación de supervisor</span>
                        )}
                        {s.estado === 'RECHAZADA' && (
                          <span className="text-xs text-red-500 italic">Rechazado ({s.motivo_rechazo})</span>
                        )}
                        {s.estado === 'ENTREGADA' && (
                          <span className="text-xs text-emerald-600 italic font-medium">Entregada a Taller</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section with metrics and actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Boxes className="w-8 h-8 text-slate-800 dark:text-slate-200" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestión de Suministros</h1>
          </div>
          <div className="mt-2 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm">
              <span>💰 Valorización Filtrada:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(valorizacionFiltrada)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>📦 Total de artículos en stock:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {filteredData.reduce((acc, item) => acc + item.stock, 0)} unidades
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>🏷️ Tipos de repuestos (SKUs):</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {filteredData.length}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm" onClick={() => setActiveView('solicitudesOT')}>
            <Boxes className="w-4 h-4 mr-2" />
            Solicitudes de Taller
          </Button>
          <Button className="bg-[#4285f4] hover:bg-[#3367d6] text-white" onClick={() => setActiveView('auditoria')}>
            <History className="w-4 h-4 mr-2" />
            Historial Bodega
          </Button>
          
          {selectedItems.length > 0 && (
            <>
              <Button 
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
                onClick={() => setIsMoveModalOpen(true)}
              >
                <Boxes className="w-4 h-4 mr-2" />
                Movimiento Masivo ( {selectedItems.length} )
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Masivo ( {selectedItems.length} )
              </Button>
            </>
          )}
          
          <Button className="bg-[#6366f1] hover:bg-[#4f46e5] text-white" onClick={() => navigate('/logistica/validaciones')}>
            <AlertCircle className="w-4 h-4 mr-2" />
            Validaciones
          </Button>
          
          <Button className="bg-[#f59e0b] hover:bg-[#d97706] text-white" onClick={() => setIsTerminalModalOpen(true)}>
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Entrada / Salida
          </Button>
          
          <Button className="bg-[#06b6d4] hover:bg-[#0891b2] text-white" onClick={() => setIsNewRepuestoModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo
          </Button>
          
          <Button className="bg-[#10b981] hover:bg-[#059669] text-white" onClick={exportInventario}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters section */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center">
        <select 
          className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800"
          value={selectedBodega}
          onChange={(e) => setSelectedBodega(e.target.value)}
        >
          <option>Todas las bodegas</option>
          {allBodegasOptions.map(bNombre => (
            <option key={bNombre} value={bNombre}>{bNombre}</option>
          ))}
        </select>

        <select 
          className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800"
          value={selectedUbicacion}
          onChange={(e) => setSelectedUbicacion(e.target.value)}
        >
          <option>Todas las ubicaciones</option>
          {uniqueUbicaciones.map(ub => (
            <option key={ub} value={ub}>{ub}</option>
          ))}
          <option>INMOVILIZADO</option>
          <option>Sin Ubicación</option>
        </select>

        <select 
          className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800"
          value={selectedCalidad}
          onChange={(e) => setSelectedCalidad(e.target.value)}
        >
          <option>Todas las calidades</option>
          {uniqueCalidades.map(cal => (
            <option key={cal} value={cal}>{cal}</option>
          ))}
        </select>

        <select 
          className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800"
          value={selectedProveedor}
          onChange={(e) => setSelectedProveedor(e.target.value)}
        >
          <option>Todos los proveedores</option>
          {uniqueProveedores.map(prov => (
            <option key={prov} value={prov}>{prov}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">DESDE:</span>
          <input type="date" className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 bg-transparent text-sm dark:bg-slate-800" />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">HASTA:</span>
          <input type="date" className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 bg-transparent text-sm dark:bg-slate-800" />
        </div>

        <button 
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm ml-auto
            ${filterBajoStock ? 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-600 dark:text-red-400' : 'border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20'}
          `}
          onClick={() => setFilterBajoStock(!filterBajoStock)}
        >
          <div className="w-3 h-3 border border-current rounded-sm"></div>
          <AlertTriangle className="w-4 h-4" />
          Bajo stock
        </button>

        <button 
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm
            ${filterSinMov ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-indigo-200 text-indigo-500 hover:bg-indigo-50 dark:border-indigo-900/50 dark:hover:bg-indigo-900/20'}
          `}
          onClick={() => setFilterSinMov(!filterSinMov)}
        >
          <div className="w-3 h-3 border border-current rounded-sm"></div>
          Sin mov. (6 meses)
        </button>
      </div>

      {/* Table section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex justify-end items-center p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Buscador SKU / Nombre / Equivalente:</span>
            <div className="relative">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 pr-8 py-1 border border-slate-300 dark:border-slate-700 rounded-md bg-transparent focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <Search className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 font-medium whitespace-nowrap">
              <tr>
                <th className="px-4 py-3 text-center w-10">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.includes(item.id))}
                    className="rounded border-slate-300" 
                  />
                </th>
                <th className="px-4 py-3">NOMBRE REPUESTO <span className="font-light text-[10px]">▼</span></th>
                <th className="px-4 py-3">SKU / N° PARTE <span className="font-light text-[10px]">▼</span></th>
                <th className="px-4 py-3">PROVEEDOR <span className="font-light text-[10px]">▼</span></th>
                <th className="px-4 py-3">UBICACIÓN / BODEGA <span className="font-light text-[10px]">▼</span></th>
                <th className="px-4 py-3">CALIDAD <span className="font-light text-[10px]">▼</span></th>
                <th className="px-4 py-3 text-center">STOCK <span className="font-light text-[10px]">▼</span></th>
                <th className="px-4 py-3 text-center">MÍN. <span className="font-light text-[10px]">▼</span></th>
                <th className="px-4 py-3">ÚLT. MOV <span className="font-light text-[10px]">▼</span></th>
                <th className="px-4 py-3 text-right">PRECIO UNIT. <span className="font-light text-[10px]">▼</span></th>
                <th className="px-4 py-3 text-right">VALOR TOTAL <span className="font-light text-[10px]">▼</span></th>
                <th className="px-4 py-3 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr 
                  key={item.id} 
                  className={`border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors
                    ${item.isCritico ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                  `}
                >
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="rounded border-slate-300" 
                    />
                  </td>
                  <td 
                    className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    onClick={() => setSelectedRepuestoDetalle(item)}
                  >
                    <span>{item.nombre}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs"><span>{item.sku}</span></td>
                  <td className="px-4 py-3"><span>{item.proveedor}</span></td>
                  <td className="px-4 py-3"><span>{item.bodegaNombre ? `${item.bodegaNombre} - ${item.ubicacion}` : item.ubicacion}</span></td>
                  <td className="px-4 py-3"><span>{item.calidad?.toUpperCase() || '-'}</span></td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${item.isCritico ? 'bg-red-500 text-white px-2 py-0.5 rounded-md' : ''}`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500"><span>{item.min}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span>{item.ultMov}</span></td>
                  <td className="px-4 py-3 text-right"><span>{formatCurrency(item.precio)}</span></td>
                  <td className="px-4 py-3 text-right font-medium"><span>{formatCurrency(item.valorTotal)}</span></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        className="p-1.5 text-slate-400 hover:text-blue-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm transition-colors" 
                        title="Editar"
                        onClick={() => { setEditRepuestoObj(item); setIsEditRepuestoModalOpen(true); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                         className="p-1.5 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm transition-colors" 
                         onClick={() => handleDeleteRepuesto(item.id)} 
                         title="Eliminar Registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex flex-col xl:flex-row items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            Show 
            <select 
              className="border border-slate-300 dark:border-slate-700 rounded px-2 py-1 mx-1 bg-transparent"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
              <option value={5000}>5000</option>
            </select> 
            entries
          </div>

          <div className="text-sm text-slate-500 font-medium">
            Mostrando {filteredData.length === 0 ? 0 : Math.min((currentPage - 1) * entriesPerPage + 1, filteredData.length)} - {Math.min(currentPage * entriesPerPage, filteredData.length)} de {filteredData.length} tipos de repuestos
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              className="px-3 py-1.5 h-auto text-xs font-semibold"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1 hidden sm:flex">
              {Array.from({ length: Math.min(5, Math.ceil(filteredData.length / entriesPerPage) || 1) }, (_, i) => {
                const total = Math.ceil(filteredData.length / entriesPerPage) || 1;
                let pageNum = currentPage - 2 + i;
                if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= total - 2) pageNum = total - 4 + i;
                
                if (pageNum > 0 && pageNum <= total) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold transition-colors
                        ${currentPage === pageNum 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
            </div>
            <Button 
              variant="secondary" 
              className="px-3 py-1.5 h-auto text-xs font-semibold"
              disabled={currentPage >= (Math.ceil(filteredData.length / entriesPerPage) || 1)}
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredData.length / entriesPerPage) || 1, prev + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      {/* Detalle Repuesto Modal */}
      <Modal 
        isOpen={!!selectedRepuestoDetalle} 
        onClose={() => setSelectedRepuestoDetalle(null)} 
        title="Detalle de Repuesto"
        size="5xl"
      >
        {selectedRepuestoDetalle && (
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase">{selectedRepuestoDetalle.nombre} <span className="text-slate-400 font-normal">| SKU: {selectedRepuestoDetalle.sku}</span></h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Info & Control */}
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                    <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white">i</span>
                    INFORMACIÓN GENERAL
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">NOMBRE OFICIAL</p>
                      <p className="font-bold text-slate-900 dark:text-white">{selectedRepuestoDetalle.nombre}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">CALIDAD / ORIGEN</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedRepuestoDetalle.calidad}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">UBICACIÓN ACTUAL</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedRepuestoDetalle.ubicacion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">PROVEEDOR HABITUAL</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedRepuestoDetalle.proveedor}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">PRECIO UNITARIO</p>
                      <p className="font-bold text-xl text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedRepuestoDetalle.precio)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-orange-500" />
                    CONTROL DE EXISTENCIAS
                  </h3>
                  
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl text-center mb-6 border-dashed">
                    <div className={`text-5xl font-black mb-2 ${selectedRepuestoDetalle.isCritico ? 'text-red-600' : 'text-emerald-700'}`}>
                      {selectedRepuestoDetalle.stock}
                    </div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      UNIDADES DISPONIBLES
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm mb-6">
                    <div>
                      <p className="text-slate-500 font-medium">STOCK MÍNIMO</p>
                      <p className="font-bold">{selectedRepuestoDetalle.min} unidades</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 font-medium">VALORIZACIÓN</p>
                      <p className="font-bold">{formatCurrency(selectedRepuestoDetalle.valorTotal)}</p>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-[#4285f4] hover:bg-[#3367d6] text-white"
                    onClick={() => {
                        setSelectedRepuestoDetalle(null);
                        setTerminalForm(prev => ({
                           ...prev, 
                           sku: selectedRepuestoDetalle.sku, 
                           nombre: selectedRepuestoDetalle.nombre
                        }));
                        setIsTerminalModalOpen(true);
                    }}
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    REGISTRAR MOVIMIENTO MANUAL
                  </Button>
                </div>
              </div>

              {/* Right Column: History */}
              <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-500" />
                    HISTORIAL DE MOVIMIENTOS
                  </h3>
                  <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full font-medium text-slate-600 dark:text-slate-300">
                    {repuestoMovimientos.length} REGISTROS
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-slate-500 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2 pr-2 font-bold uppercase whitespace-nowrap">FECHA / HORA</th>
                        <th className="py-2 px-2 font-bold uppercase">TIPO DE MOVIMIENTO</th>
                        <th className="py-2 px-2 font-bold uppercase text-center">CANT.</th>
                        <th className="py-2 px-2 font-bold uppercase">RESPONSABLE</th>
                        <th className="py-2 px-2 font-bold uppercase">REFERENCIA</th>
                        <th className="py-2 pl-2 font-bold uppercase w-1/3">NOTAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                      {repuestoMovimientos.map((mov) => (
                        <tr key={mov.id}>
                          <td className="py-4 pr-2 font-medium whitespace-nowrap">
                            <div className="text-slate-800 dark:text-slate-200">{new Date(mov.created_at).toLocaleDateString()}</div>
                            <div className="text-slate-500 text-[10px]">{new Date(mov.created_at).toLocaleTimeString()}</div>
                          </td>
                          <td className="py-4 px-2">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-medium leading-tight inline-block
                              ${mov.tipo === 'SALIDA' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 
                                mov.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                                mov.tipo === 'CORRECCIÓN_MANUAL' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' :
                                'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                              {mov.tipo}
                            </span>
                          </td>
                          <td className={`py-4 px-2 text-center font-bold ${mov.tipo === 'SALIDA' ? 'text-orange-500' : mov.tipo === 'ENTRADA' ? 'text-emerald-500' : mov.tipo === 'CORRECCIÓN_MANUAL' ? 'text-purple-500' : 'text-blue-500'}`}>
                             {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                          </td>
                          <td className="py-4 px-2 font-medium">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                                👤
                              </span>
                              {mov.usuario_nombre || 'Sistema'}
                            </div>
                          </td>
                          <td className="py-4 px-2 text-slate-400">{mov.referencia}</td>
                          <td className="py-4 pl-2 text-[10px] font-medium italic text-slate-600 dark:text-slate-400 leading-relaxed">
                            {mov.notas}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Movimiento Masivo Modal */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        title="Movimiento Masivo"
      >
        <div className="flex flex-col items-center justify-center space-y-6 py-4">
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            Vas a trasladar {selectedItems.length} artículos. ¿A qué bodega van?
          </p>
          <select 
            className="w-full max-w-sm border border-slate-300 dark:border-slate-700 rounded-md px-4 py-3 bg-transparent dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            value={destinationBodega}
            onChange={(e) => setDestinationBodega(e.target.value)}
          >
            <option value="" disabled>Selecciona bodega de destino</option>
            {bodegasList.map(b => (
               <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
          <div className="flex gap-4 pt-4">
            <Button 
              className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-8 py-2"
              onClick={async () => {
                if (destinationBodega) {
                  try {
                    const destBodega = bodegasList.find(b => b.id === destinationBodega);
                    const CHUNK_SIZE = 20;
                    let hasError = false;

                    for (let i = 0; i < selectedItems.length; i += CHUNK_SIZE) {
                      const chunk = selectedItems.slice(i, i + CHUNK_SIZE);
                      const { error } = await supabase.from('logistica_repuestos')
                        .update({ bodega_id: destinationBodega })
                        .in('id', chunk);

                      if (error) {
                        hasError = true;
                        console.error('Update chunk error:', error);
                        break;
                      }

                      const movs = chunk.map(itemId => {
                        const repItem = sumInsumosData.find(r => r.id === itemId);
                        return {
                          empresa_id: currentCompany.id,
                          repuesto_id: itemId,
                          tipo: 'TRASLADO',
                          cantidad: repItem?.stock || 0,
                          notas: `Traslado masivo de ${repItem?.bodegaNombre || 'Sin Asignar'} a ${destBodega?.nombre}`,
                          estado: 'COMPLETADO'
                        };
                      });
                      
                      const { error: errorIns } = await supabase.from('logistica_movimientos').insert(movs);
                      if (errorIns) {
                        hasError = true;
                        console.error('Insert chunk error:', errorIns);
                        break;
                      }
                    }
                      
                    if (!hasError) {
                      setIsMoveModalOpen(false);
                      setIsSuccessModalOpen(true);
                      await loadData();
                    } else {
                      Swal.fire("Error", "No se pudo realizar el movimiento completo", "error");
                    }
                  } catch (e) {
                     console.error(e);
                     Swal.fire("Error", "No se pudo realizar el movimiento", "error");
                  }
                }
              }}
              disabled={!destinationBodega}
            >
              Confirmar Traslado
            </Button>
            <Button 
              variant="secondary" 
              className="bg-slate-500 hover:bg-slate-600 text-white px-8 py-2 border-0"
              onClick={() => setIsMoveModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          setSelectedItems([]);
          setDestinationBodega('');
        }}
        title=""
      >
        <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center">
          <div className="w-24 h-24 rounded-full border-4 border-emerald-100 flex items-center justify-center mb-2">
            <CheckCircle className="w-16 h-16 text-emerald-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-medium text-slate-800 dark:text-slate-100">¡Éxito!</h2>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            ¡Éxito! Se trasladaron {selectedItems.length} artículos a {bodegasList.find(b => b.id === destinationBodega)?.nombre || destinationBodega}.
          </p>
          <Button 
            className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-12 py-2 mt-4"
            onClick={() => {
              setIsSuccessModalOpen(false);
              setSelectedItems([]);
              setDestinationBodega('');
            }}
          >
            OK
          </Button>
        </div>
      </Modal>

      {/* Terminal / Entrada Salida Modal */}
      <Modal
        isOpen={isTerminalModalOpen}
        onClose={() => setIsTerminalModalOpen(false)}
        title="Entrada / Salida (Control Móvil)"
      >
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">TIPO DE MOVIMIENTO</label>
              <select 
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                value={terminalForm.tipoMovimiento}
                onChange={(e) => setTerminalForm({...terminalForm, tipoMovimiento: e.target.value})}
              >
                <option value="ENTRADA">Entrada (Ingreso de Stock)</option>
                <option value="SALIDA">Salida (Consumo / Descuento)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CANTIDAD</label>
              <input 
                type="number"
                min="1"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                value={terminalForm.cantidad}
                onChange={(e) => setTerminalForm({...terminalForm, cantidad: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">BODEGA</label>
            <select 
              className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              value={terminalForm.bodegaId}
              onChange={(e) => setTerminalForm({...terminalForm, bodegaId: e.target.value})}
            >
              <option value="">{terminalForm.tipoMovimiento === 'SALIDA' ? 'Auto-detectar bodega...' : 'Seleccione una bodega...'}</option>
              {bodegasList.map((b) => (
                <option key={b.id} value={b.id}>{b.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SKU / CÓDIGO BARRAS / NOMBRE</label>
              <input 
                type="text" 
                placeholder="Escanee o escriba..."
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                value={terminalForm.sku}
                onChange={(e) => {
                  setTerminalForm({...terminalForm, sku: e.target.value, repuestoId: ''});
                  setShowTerminalAutocomplete(true);
                }}
                onFocus={() => setShowTerminalAutocomplete(true)}
              />
              {showTerminalAutocomplete && terminalForm.sku.length > 1 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {sumInsumosData.filter(i => 
                    i.sku?.toLowerCase().includes(terminalForm.sku.toLowerCase()) || 
                    i.nombre?.toLowerCase().includes(terminalForm.sku.toLowerCase())
                  ).slice(0, 50).map(item => (
                    <div 
                      key={item.id} 
                      className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm"
                      onClick={() => {
                        setTerminalForm({
                           ...terminalForm, 
                           repuestoId: item.id || '',
                           sku: item.sku || '', 
                           nombre: item.nombre || '', 
                           bodegaId: item.bodega_id || terminalForm.bodegaId
                        });
                        setShowTerminalAutocomplete(false);
                      }}
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">{item.sku}</div>
                      <div className="text-xs text-slate-500">{item.nombre} - Stock: {item.stock} ({item.bodegaNombre})</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NOMBRE (SI ES NUEVO)</label>
              <input 
                type="text"
                placeholder="Nombre del repuesto..."
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                value={terminalForm.nombre}
                onChange={(e) => setTerminalForm({...terminalForm, nombre: e.target.value})}
              />
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/50 space-y-4">
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-500">Datos de Trazabilidad</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-amber-700/70 dark:text-amber-500/70 uppercase mb-1">SOLICITANTE</label>
                <input 
                  type="text" 
                  className="w-full border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={terminalForm.solicitante}
                  onChange={(e) => setTerminalForm({...terminalForm, solicitante: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-700/70 dark:text-amber-500/70 uppercase mb-1">AUTORIZADOR</label>
                <input 
                  type="text" 
                  className="w-full border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={terminalForm.autorizador}
                  onChange={(e) => setTerminalForm({...terminalForm, autorizador: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-amber-700/70 dark:text-amber-500/70 uppercase mb-1">DESTINO / USO</label>
                <input 
                  type="text" 
                  className="w-full border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={terminalForm.destino}
                  onChange={(e) => setTerminalForm({...terminalForm, destino: e.target.value})}
                  placeholder="Ej: Camión Volvo FH16, Gasto General, etc."
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsTerminalModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={handleTerminalSubmit}
            >
              Procesar Movimiento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Repuesto Modal */}
      <Modal
         isOpen={isEditRepuestoModalOpen}
         onClose={() => setIsEditRepuestoModalOpen(false)}
         title="Editar Repuesto"
      >
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={editRepuestoObj?.nombre || ''}
                  onChange={e => setEditRepuestoObj(prev => prev ? {...prev, nombre: e.target.value} : prev)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SKU</label>
                <input 
                  type="text" 
                  value={editRepuestoObj?.sku || ''}
                  onChange={e => setEditRepuestoObj(prev => prev ? {...prev, sku: e.target.value} : prev)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800"
                />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Actual</label>
                <input 
                  type="number" 
                  value={editRepuestoObj?.stock || ''}
                  onChange={e => setEditRepuestoObj(prev => prev ? {...prev, stock: parseInt(e.target.value) || 0} : prev)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Unitario ($)</label>
                <input 
                  type="number" 
                  value={editRepuestoObj?.precio || ''}
                  onChange={e => setEditRepuestoObj(prev => prev ? {...prev, precio: parseFloat(e.target.value) || 0} : prev)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Mínimo</label>
                <input 
                  type="number" 
                  value={editRepuestoObj?.min || ''}
                  onChange={e => setEditRepuestoObj(prev => prev ? {...prev, min: parseInt(e.target.value) || 0} : prev)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800"
                />
             </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
             <Button variant="secondary" onClick={() => setIsEditRepuestoModalOpen(false)}>Cancelar</Button>
             <Button 
               className="bg-[#10b981] hover:bg-[#059669] text-white"
               onClick={async () => {
                 if (editRepuestoObj) {
                    const originalObj = sumInsumosData.find(r => r.id === editRepuestoObj.id);
                    
                    const { error } = await supabase.from('logistica_repuestos').update({
                       nombre: editRepuestoObj.nombre,
                       sku: editRepuestoObj.sku,
                       precio: editRepuestoObj.precio,
                       min_stock: editRepuestoObj.min,
                       stock: editRepuestoObj.stock
                    }).eq('id', editRepuestoObj.id);
                    if (!error) {
                       if (originalObj && originalObj.stock !== editRepuestoObj.stock) {
                           // Hubo cambio manual de stock
                           const stockDiff = editRepuestoObj.stock - originalObj.stock;
                           await supabase.from('logistica_movimientos').insert({
                               empresa_id: currentCompany?.id,
                               repuesto_id: editRepuestoObj.id,
                               tipo: 'CORRECCIÓN_MANUAL',
                               cantidad: stockDiff,
                               referencia: 'Edición Manual (Lápiz)',
                               notas: 'Corrección administrativa de stock',
                               estado: 'COMPLETADO'
                           });
                       }
                       Swal.fire("Éxito", "Repuesto actualizado", "success");
                       setIsEditRepuestoModalOpen(false);
                       loadData();
                    } else {
                       Swal.fire("Error", "No se pudo actualizar", "error");
                    }
                 }
               }}
             >
               Guardar Cambios
             </Button>
          </div>
        </div>
      </Modal>

      {/* New Repuesto Modal */}
      <Modal
        isOpen={isNewRepuestoModalOpen}
        onClose={() => setIsNewRepuestoModalOpen(false)}
        title="Ingresar Nuevo Repuesto al Maestro"
      >
        <div className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto px-1 -mx-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Descriptivo *</label>
              <input 
                type="text" 
                placeholder="Ej: Filtro de Aceite Motor OM906"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={newRepuestoForm.nombre}
                onChange={(e) => setNewRepuestoForm({...newRepuestoForm, nombre: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SKU / N° de Parte *</label>
              <input 
                type="text" 
                placeholder="Ej: A 651 180 01 09"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={newRepuestoForm.numeroParte}
                onChange={(e) => setNewRepuestoForm({...newRepuestoForm, numeroParte: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Calidad</label>
              <select 
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={newRepuestoForm.calidad}
                onChange={(e) => setNewRepuestoForm({...newRepuestoForm, calidad: e.target.value})}
              >
                <option value="ORIGINAL">Original</option>
                <option value="OEM">Alternativo OEM</option>
                <option value="GENERICO">Alternativo Genérico</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Origen</label>
              <select 
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={newRepuestoForm.origen}
                onChange={(e) => setNewRepuestoForm({...newRepuestoForm, origen: e.target.value})}
              >
                <option value="OEM">Original / Marca (Alta Durabilidad)</option>
                <option value="CHINO">Alternativo Chino (Baja)</option>
                <option value="RECAUCHE">Recauche / Recuperado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Criticidad</label>
              <select 
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={newRepuestoForm.nivelCriticidad}
                onChange={(e) => setNewRepuestoForm({...newRepuestoForm, nivelCriticidad: e.target.value})}
              >
                <option value="INSUMO">Insumo General</option>
                <option value="MINA">Consumo 'Mina'</option>
                <option value="PANA">Crítico 'Pana'</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Inicial *</label>
              <input 
                type="number" 
                min="0"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={newRepuestoForm.stockActual}
                onChange={(e) => setNewRepuestoForm({...newRepuestoForm, stockActual: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Mínimo</label>
              <input 
                type="number" 
                min="0"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={newRepuestoForm.stockMinimo}
                onChange={(e) => setNewRepuestoForm({...newRepuestoForm, stockMinimo: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Un. ($)</label>
              <input 
                type="number" 
                min="0"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={newRepuestoForm.precioUnitario}
                onChange={(e) => setNewRepuestoForm({...newRepuestoForm, precioUnitario: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bodega de Destino</label>
              <select 
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={newRepuestoForm.bodegaId}
                onChange={(e) => setNewRepuestoForm({...newRepuestoForm, bodegaId: e.target.value})}
              >
                <option value="">Seleccione bodega</option>
                {bodegasList.map(b => (
                  <option key={b.id} value={b.id}>{b.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación (Pasillo/Estante)</label>
              <input 
                type="text" 
                placeholder="Ej: Estante B-4"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={newRepuestoForm.ubicacion}
                onChange={(e) => setNewRepuestoForm({...newRepuestoForm, ubicacion: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Proveedor Habitual</label>
              <select 
                className="w-full border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 bg-transparent text-sm dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={newRepuestoForm.proveedorId}
                onChange={(e) => setNewRepuestoForm({...newRepuestoForm, proveedorId: e.target.value})}
              >
                <option value="">Seleccione proveedor...</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="secondary" onClick={() => setIsNewRepuestoModalOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={!newRepuestoForm.nombre || !newRepuestoForm.numeroParte}
              onClick={async () => {
                const provName = proveedores.find(p => p.id === newRepuestoForm.proveedorId)?.nombre || newRepuestoForm.proveedorId || "--";
                const bodegaName = bodegasList.find(b => b.id === newRepuestoForm.bodegaId)?.nombre || "bodega no especificada";

                const nuevo = {
                  empresa_id: currentCompany?.id,
                  nombre: newRepuestoForm.nombre,
                  sku: newRepuestoForm.numeroParte,
                  proveedor: provName,
                  ubicacion: newRepuestoForm.ubicacion || "Sin Ubicación",
                  calidad: newRepuestoForm.calidad,
                  stock: newRepuestoForm.stockActual,
                  min_stock: newRepuestoForm.stockMinimo,
                  ult_mov: new Date().toISOString(),
                  precio: newRepuestoForm.precioUnitario,
                  valor_total: newRepuestoForm.precioUnitario * newRepuestoForm.stockActual,
                  is_critico: newRepuestoForm.nivelCriticidad === "CRÍTICO",
                  bodega_id: newRepuestoForm.bodegaId || null,
                  estado: 'ACTIVO'
                };

                try {
                  if (!currentCompany?.id) {
                    Swal.fire("Error", "No hay empresa seleccionada.", "error");
                    return;
                  }
                  
                  const { error } = await supabase.from('logistica_repuestos').insert([nuevo]);
                  
                  if (error) {
                    console.error("Error al guardar:", error);
                    Swal.fire("Error", "Hubo un error al guardar: " + error.message, "error");
                    return;
                  }
                  
                  // Refetch
                  await loadData();
                  
                  setIsNewRepuestoModalOpen(false);
                  Swal.fire("Éxito", `Se agregó ${newRepuestoForm.nombre} con ${newRepuestoForm.stockActual} cantidad a la ${bodegaName}.`, "success");
                  
                  setNewRepuestoForm({
                    nombre: '', numeroParte: '', calidad: 'ORIGINAL', origen: 'OEM', 
                    nivelCriticidad: 'INSUMO', categoria: 'General', stockActual: 0, stockMinimo: 0, 
                    diasStockObjetivo: 30, ubicacion: '', precioUnitario: 0, bodegaId: '1', proveedorId: ''
                  });
                } catch (e) {
                  console.error(e);
                  Swal.fire("Error", "Error al intentar guardar el repuesto.", "error");
                }
              }}
            >
              Guardar Repuesto
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
