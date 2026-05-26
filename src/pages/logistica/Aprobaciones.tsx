import React, { useState, useEffect } from 'react';
import { PenTool, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

export default function Aprobaciones() {
  const navigate = useNavigate();
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Edit state
  const [editNombre, setEditNombre] = useState('');
  const [editPrecio, setEditPrecio] = useState(0);
  const [editCantidad, setEditCantidad] = useState(0);

  useEffect(() => {
    fetchPendientes();
  }, []);

  const fetchPendientes = async () => {
    try {
      const res = await fetch('/api/inventario/aprobaciones');
      const data = await res.json();
      setPendientes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const openApproveModal = (item: any) => {
    setSelectedItem(item);
    setEditNombre(item.nombre === 'NUEVO PRODUCTO' ? '' : item.nombre);
    setEditPrecio(0);
    setEditCantidad(item.cantidad || 1);
    setIsModalOpen(true);
  };

  const handleApprove = async () => {
    if (!editNombre) return;
    try {
      const res = await fetch(`/api/inventario/aprobaciones/${selectedItem.id}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editNombre, precio: editPrecio, stock: editCantidad })
      });
      if (res.ok) {
        Swal.fire('Éxito', 'Producto aprobado e ingresado a bodega', 'success');
        setIsModalOpen(false);
        fetchPendientes();
      }
    } catch (e) {
      Swal.fire('Error', 'No se pudo aprobar', 'error');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PenTool className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <h1 className="text-xl font-bold uppercase text-slate-800 dark:text-white">
              Productos por Aprobar
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Confirma los nombres y precios de los productos escaneados
          </p>
        </div>

        <div className="bg-amber-400 text-amber-950 px-4 py-2 rounded-md font-bold text-sm shadow-sm">
          {pendientes.length} Pendientes
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase">
              <tr>
                <th className="px-6 py-4">SKU / Nro. Parte</th>
                <th className="px-6 py-4">Nombre Identificado en Bodega</th>
                <th className="px-6 py-4 text-center">Stock Actual</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                        ¡Todo al día!
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400">
                        No hay productos pendientes de clasificación.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendientes.map((item, idx) => (
                  <tr key={item.id || idx} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-6 py-4 font-medium">{item.sku}</td>
                    <td className="px-6 py-4">{item.nombre}</td>
                    <td className="px-6 py-4 text-center">{item.cantidad}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => openApproveModal(item)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg"
                      >
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <button
          onClick={() => navigate('/logistica/escaneo')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-full hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Terminal
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Aprobar Producto">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            SKU: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedItem?.sku}</span>
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Final / Clasificación</label>
            <input 
              type="text" 
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-white"
              placeholder="Ej: Filtro Aire Volvo X1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Precio Unitario ($)</label>
              <input 
                type="number" 
                value={editPrecio}
                onChange={(e) => setEditPrecio(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cantidad a Ingresar</label>
              <input 
                type="number" 
                value={editCantidad}
                onChange={(e) => setEditCantidad(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-transparent text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!editNombre}>
              Aprobar y Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
