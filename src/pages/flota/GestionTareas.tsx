import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export default function GestionTareas() {
  const { tareasEstandar } = useAppContext();
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const tareasFiltradas = tareasEstandar.filter(t => 
    t.descripcion.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Tareas</h1>
        <Button className="bg-cyan-600" onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2"/> Crear Nueva Tarea</Button>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Crear Nueva Tarea">
          <div className="space-y-4">
              <input type="text" placeholder="Ej: Cambio de aceite..." className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" />
              <input type="number" placeholder="Tiempo estándar (minutos)" className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" />
              <input type="number" placeholder="Costo Mano Obra ($)" className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" />
              <Button className="w-full bg-cyan-600">Crear Tarea</Button>
          </div>
      </Modal>
      
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-800 flex items-center gap-2">
          <Search className="text-slate-400 dark:text-slate-500 dark:text-slate-400 w-5 h-5"/>
          <input type="text" placeholder="Buscar por descripción..." className="flex-1 outline-none dark:text-slate-100" value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)} />
      </div>

      <Card className="p-0 overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase">
                    <tr>
                        <th className="px-6 py-4">Descripción</th>
                        <th className="px-6 py-4">Tiempo Estándar (Min)</th>
                        <th className="px-6 py-4">Costo Mano Obra ($)</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tareasFiltradas.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">{t.descripcion}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{t.tiempoEstandarMinutos}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">${t.costoManoObra.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">
                                <Button size="sm" variant="outline" className="text-slate-600 dark:text-slate-400 mr-2">Editar</Button>
                                <Button size="sm" variant="outline" className="text-red-500">Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </Card>
    </div>
  );
}
