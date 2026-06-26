import React, { useState, useEffect } from 'react';
import { ClipboardCheck, CheckCheck, CheckCircle2, XCircle, Truck, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAppContext } from '../../context/AppContext';
import Swal from 'sweetalert2';
import { Modal } from '../../components/ui/Modal';

interface MovimientoPendiente {
  id: number;
  repuesto_id: number;
  cantidad: number;
  notas: string;
  referencia: string;
  created_at: string;
  repuesto: {
    nombre: string;
    sku: string;
    stock: number;
  };
}

export default function AuditoriaSalidas() {
  const { currentCompany } = useCompany();
  const { ordenesTrabajo, vehiculos } = useAppContext();
  const [pendientes, setPendientes] = useState<MovimientoPendiente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMov, setSelectedMov] = useState<MovimientoPendiente | null>(null);
  const [modo, setModo] = useState<'OT' | 'GASTO'>('OT');
  const [selectedOtId, setSelectedOtId] = useState('');
  const [selectedGasto, setSelectedGasto] = useState('TALLER');

  useEffect(() => {
    fetchPendientes();
  }, [currentCompany]);

  const fetchPendientes = async () => {
    if (!currentCompany?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('logistica_movimientos')
        .select(`
          *,
          repuesto:repuesto_id (nombre, sku, stock)
        `)
        .eq('empresa_id', currentCompany.id)
        .eq('tipo', 'SALIDA_PENDIENTE')
        .eq('estado', 'PENDIENTE')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPendientes(data as any);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirModal = (mov: MovimientoPendiente) => {
    setSelectedMov(mov);
    setModo('OT');
    setSelectedOtId('');
    setSelectedGasto('TALLER');
    setIsModalOpen(true);
  };

  const handleValidarConfirmar = async () => {
    if (!selectedMov || !currentCompany) return;

    if (modo === 'OT' && !selectedOtId) {
      Swal.fire('Atención', 'Debe seleccionar una Orden de Trabajo', 'warning');
      return;
    }

    try {
      // 1. Deduct stock (it was not deducted during the scan)
      const { error: stockErr } = await supabase
        .from('logistica_repuestos')
        .update({ stock: Math.max(0, selectedMov.repuesto.stock - selectedMov.cantidad) })
        .eq('id', selectedMov.repuesto_id);

      if (stockErr) throw stockErr;

      // Determine notes based on selection
      let newNotas = selectedMov.notas;
      if (modo === 'OT') {
        const ot = ordenesTrabajo.find(o => o.id === selectedOtId);
        newNotas = `Cargado a OT-${ot?.folio || selectedOtId} | ${newNotas}`;
        
        // Also insert into detalle_insumo_ot
        await supabase.from('detalle_insumo_ot').insert({
          orden_id: selectedOtId,
          repuesto_id: selectedMov.repuesto_id,
          cantidad: selectedMov.cantidad,
          empresa_id: currentCompany.id
        });
      } else {
        newNotas = `Gasto General (${selectedGasto}) | ${newNotas}`;
      }

      // 2. Mark movement as COMPLETED and change type to regular SALIDA
      const { error: movErr } = await supabase
        .from('logistica_movimientos')
        .update({ 
          estado: 'COMPLETADO',
          tipo: 'SALIDA',
          notas: newNotas
        })
        .eq('id', selectedMov.id);

      if (movErr) throw movErr;

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Salida validada y descontada',
        showConfirmButton: false,
        timer: 2000
      });
      setIsModalOpen(false);
      fetchPendientes();
    } catch (error: any) {
      Swal.fire('Error', 'No se pudo validar la salida', 'error');
    }
  };

  const handleRechazar = async (mov: MovimientoPendiente) => {
    const result = await Swal.fire({
      title: '¿Rechazar esta salida?',
      text: "El registro pasará a estado RECHAZADO. No se aplicará descuento de stock.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, rechazar'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('logistica_movimientos')
          .update({ estado: 'RECHAZADO' })
          .eq('id', mov.id);

        if (error) throw error;
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Salida rechazada',
          showConfirmButton: false,
          timer: 2000
        });
        fetchPendientes();
      } catch (e) {
        Swal.fire('Error', 'No se pudo rechazar', 'error');
      }
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-md">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
              Auditoría de Salidas
            </h1>
            <p className="text-sm text-slate-500 mt-1 dark:text-slate-400 font-medium">
              Gestión de repuestos retirados por terminal (24 Horas)
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[120px] shadow-sm">
          <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
            {pendientes.length}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            PENDIENTES
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-12 shadow-sm min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : pendientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-full my-12">
            <div className="text-slate-300 dark:text-slate-700 mb-6">
              <CheckCheck className="w-24 h-24 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
              Todo el inventario está al día
            </h3>
            <p className="text-slate-400 dark:text-slate-500 font-medium max-w-sm">
              No hay movimientos pendientes de validar en este momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendientes.map((mov) => (
              <div key={mov.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row justify-between gap-6 border border-slate-100 dark:border-slate-800 transition-all hover:-translate-y-1 hover:shadow-md hover:border-indigo-500/30">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      {mov.notas.toLowerCase().includes('noche') ? '🌙 NOCHE' : '☀️ DÍA'}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      {new Date(mov.created_at).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
                    {mov.repuesto?.nombre}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-1">SKU: {mov.repuesto?.sku}</p>
                  
                  <div className="mt-4 flex flex-col gap-1 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-400 w-28 text-[10px] uppercase tracking-widest mt-0.5">Registro de Terminal:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold italic text-xs">{mov.notas}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end justify-between md:border-l md:border-slate-200 md:dark:border-slate-700 md:pl-6 min-w-[200px]">
                  <div className="text-center md:text-right mb-4">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">CANTIDAD RETIRADA</span>
                    <span className="text-4xl font-black text-slate-800 dark:text-slate-100 leading-none">
                      {mov.cantidad}
                    </span>
                  </div>
                  
                  <div className="flex w-full gap-2">
                    <button 
                      onClick={() => handleRechazar(mov)}
                      className="flex-1 p-3 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 rounded-xl transition-colors flex items-center justify-center"
                      title="Rechazar (Ignorar)"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => handleAbrirModal(mov)}
                      className="flex-[3] px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                    >
                      GESTIONAR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Gestión */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Validar Movimiento"
      >
        {selectedMov && (
          <div className="space-y-6">
            <div>
              <p className="text-indigo-500 text-xs font-black uppercase mb-4">
                {selectedMov.repuesto?.nombre}
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-6 border border-slate-100 dark:border-slate-700">
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">
                  Información capturada por Scanner:
                </label>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 italic mb-0">
                  {selectedMov.notas}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-black text-slate-500 mb-3 uppercase tracking-widest">
                  Seleccione Destino del Insumo
                </label>

                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setModo('OT')}
                    className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                      modo === 'OT' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Truck className="w-4 h-4" /> ORDEN TRABAJO
                  </button>
                  <button
                    type="button"
                    onClick={() => setModo('GASTO')}
                    className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${
                      modo === 'GASTO' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> GASTO GENERAL
                  </button>
                </div>

                {modo === 'OT' ? (
                  <div>
                    <select
                      value={selectedOtId}
                      onChange={(e) => setSelectedOtId(e.target.value)}
                      className="w-full p-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    >
                      <option value="">Seleccione Vehículo / OT...</option>
                      {ordenesTrabajo.filter(ot => ot.estado !== 'Cerrada').map(ot => {
                        const v = vehiculos.find(v => v.id === ot.vehiculoId);
                        return (
                          <option key={ot.id} value={ot.id}>
                            OT-{ot.folio} | {v?.numero_interno || 'S/N'} ({v?.patente || 'S/P'})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ) : (
                  <div>
                    <select
                      value={selectedGasto}
                      onChange={(e) => setSelectedGasto(e.target.value)}
                      className="w-full p-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    >
                      <option value="TALLER">Insumos Taller (Grasas, Pernos, etc)</option>
                      <option value="EPP">Seguridad / EPP</option>
                      <option value="ASEO">Aseo / Oficina</option>
                      <option value="OTROS">Otros Gastos</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleValidarConfirmar}
                  className="w-full bg-indigo-600 text-white p-4 rounded-xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none transition-all uppercase tracking-wider"
                >
                  VALIDAR Y APLICAR DESCUENTO
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    handleRechazar(selectedMov);
                  }}
                  className="w-full bg-white dark:bg-slate-800 text-rose-500 border-2 border-rose-100 dark:border-rose-900/30 p-3 rounded-xl font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all uppercase"
                >
                  RECHAZAR (Eliminar registro sin descontar)
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
