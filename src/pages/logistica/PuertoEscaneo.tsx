import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Swal from 'sweetalert2';
import { 
  Search, 
  Camera, 
  XCircle, 
  Trash2, 
  CloudUpload, 
  MapPin, 
  Loader2, 
  Minus, 
  Plus,
  ArrowRight,
  ScanBarcode
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';

interface ScanItem {
  sku: string;
  nombre: string;
  cantidad: number;
  tipo_movimiento: string;
  bodega_id: string;
  bodega_nombre: string;
  auditoria_id?: string;
  ubicacion_conteo: string;
  turno: string;
  solicitante?: string;
  autorizador?: string;
  destino?: string;
}

interface Bodega {
  id: number;
  nombre: string;
}

interface Auditoria {
  id: number;
  bodega: { nombre: string };
}

export default function PuertoEscaneo() {
  const navigate = useNavigate();
  const { currentCompany } = useCompany();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [auditoriasActivas, setAuditoriasActivas] = useState<Auditoria[]>([]);
  
  // Form State
  const [bodegaId, setBodegaId] = useState('');
  const [tipoMov, setTipoMov] = useState('INGRESO');
  const [ubicacionConteo, setUbicacionConteo] = useState('');
  const [modoRafaga, setModoRafaga] = useState(false);
  const [auditoriaId, setAuditoriaId] = useState('');
  const [manualSearch, setManualSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Scanning State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedList, setScannedList] = useState<ScanItem[]>([]);
  const [currentItem, setCurrentItem] = useState<ScanItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const beepRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize beep sound
    beepRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2632/2632-preview.mp3');
    
    // Load data
    fetchData();
    
    // Clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Local storage
    const saved = localStorage.getItem('pulser_scan_list');
    if (saved) {
      try {
        setScannedList(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved list", e);
      }
    }

    return () => {
      clearInterval(timer);
      if (scannerRef.current && isCameraActive) {
        scannerRef.current.stop().catch(err => console.error("Error stopping scanner", err));
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('pulser_scan_list', JSON.stringify(scannedList));
  }, [scannedList]);

  const fetchData = async () => {
    if (!currentCompany?.id) return;
    try {
      const { data: bodegasData, error: bErr } = await supabase.from('logistica_bodegas').select('*').eq('empresa_id', currentCompany.id);
      
      const auditoriasRes = await fetch('/api/auditorias/activas');
      const auditoriasData = await auditoriasRes.json();
      
      if (!bErr && bodegasData) {
         setBodegas(bodegasData);
         if (bodegasData.length > 0) setBodegaId(bodegasData[0].id.toString());
      }
      setAuditoriasActivas(auditoriasData);
    } catch (e) {
      console.error("Error fetching initial data", e);
    }
  };

  useEffect(() => {
     fetchData();
  }, [currentCompany]);

  const getTurno = () => {
    const hours = currentTime.getHours();
    return (hours >= 20 || hours < 7) ? 'NOCHE' : 'DIA';
  };

  const handleSearch = async (query: string) => {
    setManualSearch(query);
    if (query.length < 2 || !currentCompany?.id) {
      setSearchResults([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('logistica_repuestos')
        .select('*')
        .eq('empresa_id', currentCompany.id)
        .or(`sku.ilike.%${query}%,nombre.ilike.%${query}%`);
        
      if (!error && data) {
         setSearchResults(data.map((r: any) => ({
           id: r.id,
           sku: r.sku,
           text: `${r.nombre} | ${r.sku}`,
           stock_total: r.stock,
           stock_local: r.stock,
           precio: r.precio
         })));
      }
    } catch (e) {
      console.error("Error searching products", e);
    }
  };

  const startScanner = async () => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader");
    }
    
    setIsCameraActive(true);
    
    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 20, qrbox: 250 },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        undefined
      );
    } catch (err) {
      console.error("Unable to start scanning", err);
      setIsCameraActive(false);
      Swal.fire('Error', 'No se pudo acceder a la cámara.', 'error');
    }
  };

  const handleScanSuccess = async (sku: string) => {
    beepRef.current?.play();
    
    if (modoRafaga && tipoMov === 'AUDITORIA') {
      if (!auditoriaId) {
        Swal.fire('Atención', 'Seleccione una Auditoría Activa.', 'warning');
        return;
      }
      
      const bodegaNombre = bodegas.find(b => b.id.toString() === bodegaId)?.nombre || 'Bodega';
      
      const fastItem: ScanItem = {
        sku,
        nombre: "Escaneo Rápido...",
        cantidad: 1,
        tipo_movimiento: 'AUDITORIA',
        bodega_id: bodegaId,
        bodega_nombre: bodegaNombre,
        auditoria_id: auditoriaId,
        ubicacion_conteo: ubicacionConteo || 'General',
        turno: getTurno()
      };
      
      setScannedList(prev => [fastItem, ...prev]);
      return;
    }

    // Normal mode: Search and open modal
    let nombre = "NUEVO PRODUCTO";
    if (currentCompany?.id) {
       try {
         const { data, error } = await supabase
           .from('logistica_repuestos')
           .select('nombre')
           .eq('empresa_id', currentCompany.id)
           .eq('sku', sku)
           .limit(1);
           
         if (!error && data && data.length > 0) {
            nombre = data[0].nombre;
         }
       } catch (e) {}
    }
    openConfirmationModal(sku, nombre);
  };

  const openConfirmationModal = (sku: string, nombre: string) => {
    if (tipoMov === 'AUDITORIA' && !auditoriaId) {
      Swal.fire('Atención', 'Debe seleccionar una Auditoría Activa.', 'warning');
      return;
    }

    if (scannerRef.current && isCameraActive) {
      scannerRef.current.pause();
    }

    const bodegaNombre = bodegas.find(b => b.id.toString() === bodegaId)?.nombre || 'Bodega';

    const newItem: ScanItem = {
      sku,
      nombre,
      cantidad: 1,
      tipo_movimiento: tipoMov,
      bodega_id: bodegaId,
      bodega_nombre: bodegaNombre,
      auditoria_id: auditoriaId,
      ubicacion_conteo: ubicacionConteo || 'Sin Especificar',
      turno: getTurno()
    };

    setCurrentItem(newItem);
    setIsModalOpen(true);
  };

  const addItemToList = () => {
    if (currentItem) {
      setScannedList(prev => [currentItem, ...prev]);
      closeModal();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
    if (scannerRef.current && isCameraActive) {
      scannerRef.current.resume();
    }
  };

  const removeItem = (index: number) => {
    setScannedList(prev => prev.filter((_, i) => i !== index));
  };

  const clearList = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Se borrará toda la lista por cargar.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, limpiar todo'
    });

    if (result.isConfirmed) {
      setScannedList([]);
      localStorage.removeItem('pulser_scan_list');
    }
  };

  const submitBatch = async () => {
    setIsSubmitting(true);
    let ok = 0;
    const errors: string[] = [];

    for (const item of scannedList) {
      try {
        const isAudit = item.tipo_movimiento === 'AUDITORIA';
        let success = false;
        
        if (currentCompany?.id) {
          if (isAudit) {
            const { error: err } = await supabase.from('logistica_movimientos').insert({
               empresa_id: currentCompany.id,
               tipo: 'AUDITORIA',
               cantidad: item.cantidad,
               notas: item.sku,
               referencia: item.nombre,
               usuario_nombre: 'Escaneo Rápido',
               estado: 'COMPLETADO'
            });
            if (!err) success = true;
          } else {
            if (item.nombre === "NUEVO PRODUCTO" || item.nombre.includes("Escaneo")) {
               const { error: err } = await supabase.from('logistica_movimientos').insert({
                 empresa_id: currentCompany.id,
                 tipo: 'PENDIENTE_VALIDACION',
                 cantidad: item.cantidad,
                 notas: item.sku,
                 referencia: item.nombre,
                 usuario_nombre: 'Escaneo Rápido',
                 estado: 'PENDIENTE'
               });
               if (!err) success = true;
            } else {
               const { error: err } = await supabase.from('logistica_movimientos').insert({
                 empresa_id: currentCompany.id,
                 tipo: item.tipo_movimiento,
                 cantidad: item.cantidad,
                 notas: item.sku,
                 referencia: item.nombre,
                 usuario_nombre: 'Escaneo Rápido',
                 estado: 'COMPLETADO'
               });
               if (!err) success = true;
            }
          }
        }
        
        if (success) {
          ok++;
        } else {
          errors.push(item.nombre);
        }
      } catch (e) {
        errors.push(item.nombre);
      }
    }

    setIsSubmitting(false);

    if (errors.length > 0) {
      Swal.fire('Atención', `Se procesaron ${ok} productos. Fallaron: ${errors.join(', ')}`, 'warning');
    } else {
      await Swal.fire('¡Éxito!', `Se registraron ${ok} movimientos correctamente.`, 'success');
      setScannedList([]);
      localStorage.removeItem('pulser_scan_list');
      // Refresh state if needed or stay on page
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'SALIDA': return 'orange';
      case 'AUDITORIA': return 'purple';
      default: return 'cyan';
    }
  };

  const color = getModeColor(tipoMov);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="max-w-md mx-auto p-4 space-y-4">
        
        {/* Clock Card */}
        <div className={`p-5 rounded-3xl flex justify-between items-center border shadow-sm ${
          getTurno() === 'NOCHE' 
            ? 'bg-indigo-50 border-indigo-100 text-indigo-900' 
            : 'bg-amber-50 border-amber-100 text-amber-900'
        }`}>
          <div>
            <div className="text-3xl font-black tracking-tighter">
              {currentTime.toLocaleTimeString('es-ES', { hour12: false })}
            </div>
            <div className="text-[10px] font-bold uppercase opacity-70">
              {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
            getTurno() === 'NOCHE' ? 'bg-indigo-900 text-white' : 'bg-amber-400 text-amber-950'
          }`}>
            {getTurno() === 'NOCHE' ? '🌙 Turno Noche' : '☀️ Turno Día'}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-2 shadow-sm">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por SKU o Nombre..."
              value={manualSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full border-none outline-none font-bold text-sm bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 z-50 max-h-64 overflow-y-auto rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
              {searchResults.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => {
                    setSearchResults([]);
                    setManualSearch('');
                    openConfirmationModal(item.sku, item.text.split('|')[0].trim());
                  }}
                  className="p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.text}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">STOCK GLOBAL: {item.stock_total}</div>
                      <div className="text-[9px] text-indigo-500 font-bold uppercase mt-1 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> OTROS LADOS: {item.otras_bodegas || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-black text-indigo-600 uppercase">En Bodega</div>
                      <div className={`text-lg font-black ${item.stock_local > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {item.stock_local || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selects Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block mb-1">Bodega</label>
            <select 
              value={bodegaId}
              onChange={(e) => setBodegaId(e.target.value)}
              className="w-full text-sm font-bold bg-transparent outline-none text-slate-800 dark:text-slate-200"
            >
              {bodegas.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block mb-1">Operación</label>
            <select 
              value={tipoMov}
              onChange={(e) => setTipoMov(e.target.value)}
              className="w-full text-sm font-bold bg-transparent outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="INGRESO">📥 INGRESO</option>
              <option value="SALIDA">📤 SALIDA</option>
              <option value="AUDITORIA">🔍 AUDITORÍA</option>
            </select>
          </div>
        </div>

        {/* Location and Toggle */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase block mb-1">Ubicación (Rack)</label>
            <input 
              type="text" 
              placeholder="Ej: A-1"
              value={ubicacionConteo}
              onChange={(e) => setUbicacionConteo(e.target.value)}
              className="w-full text-sm font-bold bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-300"
            />
          </div>
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <label className="text-[9px] font-black text-purple-600 uppercase block">Modo Ráfaga</label>
              <span className="text-[9px] font-bold text-slate-400 lowercase italic">(Auditoría +1)</span>
            </div>
            <button 
              onClick={() => setModoRafaga(!modoRafaga)}
              className={`w-12 h-6 rounded-full transition-colors relative ${modoRafaga ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${modoRafaga ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
        </div>

        {/* Audit Select */}
        {tipoMov === 'AUDITORIA' && (
          <div className="mt-2 bg-purple-50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-200 dark:border-purple-900 animate-in fade-in zoom-in-95">
            <label className="text-[9px] font-black text-purple-600 uppercase block mb-1">ID Auditoría Activa</label>
            <select 
              value={auditoriaId}
              onChange={(e) => setAuditoriaId(e.target.value)}
              className="w-full text-sm font-bold bg-transparent outline-none text-purple-900 dark:text-purple-300"
            >
              <option value="">Seleccione auditoría...</option>
              {auditoriasActivas.map(a => (
                <option key={a.id} value={a.id}>AUD #{a.id} - {a.bodega.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Reader Container */}
        <div id="reader" className={`w-full rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-900 bg-slate-900 shadow-2xl transition-all duration-500 ${isCameraActive ? 'h-64' : 'h-0 opacity-0'}`}></div>

        {/* Camera Toggle Button */}
        {!isCameraActive && (
          <button 
            onClick={startScanner}
            className={`w-full p-5 rounded-3xl font-black text-white shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95 ${
              tipoMov === 'SALIDA' ? 'bg-orange-600' : (tipoMov === 'AUDITORIA' ? 'bg-purple-600' : 'bg-cyan-600')
            }`}
          >
            <Camera className="w-6 h-6" /> ACTIVAR CÁMARA
          </button>
        )}

        {/* Scanned List */}
        {scannedList.length > 0 && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-3 px-1">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lista por cargar</h3>
              <button 
                onClick={clearList}
                className="text-[10px] text-rose-500 font-bold hover:underline"
              >
                LIMPIAR TODO
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md divide-y divide-slate-100 dark:divide-slate-800">
              {scannedList.map((item, index) => (
                <div key={index} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className={`text-[10px] font-bold ${
                      item.tipo_movimiento === 'SALIDA' ? 'text-orange-500' : (item.tipo_movimiento === 'AUDITORIA' ? 'text-purple-600' : 'text-emerald-500')
                    }`}>
                      {item.tipo_movimiento} | {item.turno}
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{item.nombre}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="text-[10px] text-slate-500 font-bold">Rack: {item.ubicacion_conteo}</div>
                      <div className="text-[9px] text-indigo-500 font-black uppercase">{item.bodega_nombre}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className="font-black text-slate-700 dark:text-slate-300 text-lg">x{item.cantidad}</span>
                    <button 
                      onClick={() => removeItem(index)}
                      className="text-slate-300 hover:text-rose-400 p-2 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && currentItem && (
        <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                  tipoMov === 'SALIDA' ? 'bg-orange-100 text-orange-600' : (tipoMov === 'AUDITORIA' ? 'bg-purple-100 text-purple-600' : 'bg-cyan-100 text-cyan-600')
                }`}>
                  {tipoMov}
                </span>
                <h3 className="text-slate-400 font-mono text-xs mt-2 uppercase tracking-wide">
                  SKU: {currentItem.sku} <br />
                  <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black">RACK: {currentItem.ubicacion_conteo}</span>
                </h3>
              </div>
              <button 
                onClick={closeModal}
                className="text-slate-300 hover:text-slate-500 transition-colors"
              >
                <XCircle className="w-8 h-8" />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 block mb-1 uppercase">Producto</label>
                <input 
                  type="text" 
                  value={currentItem.nombre}
                  onChange={(e) => setCurrentItem({...currentItem, nombre: e.target.value})}
                  className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-slate-800 dark:text-slate-100 outline-none border border-transparent focus:border-indigo-500"
                />
              </div>

              {tipoMov === 'SALIDA' && (
                <div className="space-y-3 animate-in fade-in blur-in-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">¿Quién retira?</label>
                      <input 
                        type="text" 
                        placeholder="Nombre"
                        value={currentItem.solicitante || ''}
                        onChange={(e) => setCurrentItem({...currentItem, solicitante: e.target.value})}
                        className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Autoriza</label>
                      <input 
                        type="text" 
                        placeholder="Nombre"
                        value={currentItem.autorizador || ''}
                        onChange={(e) => setCurrentItem({...currentItem, autorizador: e.target.value})}
                        className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Destino (Vehículo o Gasto)</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Camión 25 / Aseo Taller"
                      value={currentItem.destino || ''}
                      onChange={(e) => setCurrentItem({...currentItem, destino: e.target.value})}
                      className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between py-4">
                <span className="font-black text-slate-400 text-sm uppercase">Cantidad</span>
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setCurrentItem({...currentItem, cantidad: Math.max(1, currentItem.cantidad - 1)})}
                    className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Minus className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </button>
                  <span className="text-3xl font-black text-slate-800 dark:text-slate-100 min-w-[3ch] text-center">
                    {currentItem.cantidad}
                  </span>
                  <button 
                    onClick={() => setCurrentItem({...currentItem, cantidad: currentItem.cantidad + 1})}
                    className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={addItemToList}
              className={`w-full p-5 rounded-3xl font-black text-lg text-white shadow-xl transition-all active:scale-95 ${
                tipoMov === 'SALIDA' ? 'bg-orange-600' : (tipoMov === 'AUDITORIA' ? 'bg-purple-600' : 'bg-cyan-600')
              }`}
            >
              AGREGAR A LA LISTA
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button for Finish */}
      {scannedList.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-6 z-40 animate-in slide-in-from-bottom-10 duration-500">
          <button 
            disabled={isSubmitting}
            onClick={submitBatch}
            className="w-full max-w-md mx-auto bg-emerald-600 text-white p-5 rounded-[2rem] font-black text-lg shadow-2xl flex items-center justify-center gap-3 transition-all hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" /> PROCESANDO...
              </>
            ) : (
              <>
                <CloudUpload className="w-6 h-6 group-hover:bounce" /> 
                CARGAR AL SISTEMA ({scannedList.length})
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
