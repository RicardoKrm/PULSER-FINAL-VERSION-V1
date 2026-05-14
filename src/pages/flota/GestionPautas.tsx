import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export default function GestionPautas() {
  const { pautas } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  const pautasFiltradas = pautas.filter(p => 
    p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    p.modeloVehiculo.toLowerCase().includes(filtroBusqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestionar Pautas de Mantenimiento</h1>
        <Button className="bg-cyan-600" onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Añadir Nueva Pauta</Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nueva Pauta de Mantenimiento">
        <div className="space-y-4">
            <input type="text" placeholder="Nombre" className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" />
            <select className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100"><option>---------</option></select>
            <input type="number" placeholder="Kilometraje Inicial" className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" />
            <input type="number" placeholder="Intervalo 1 (KM)" className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" />
            <input type="number" placeholder="Intervalo 2 (KM) - Opcional" className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" />
            <textarea placeholder="Tareas (una por línea)" className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" rows={4} />
            <input type="file" className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" />
            <input type="text" placeholder="Tipo aplicación" className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" />
            <input type="text" placeholder="Tipo aceite" className="w-full p-2 border rounded dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100" />
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button className="bg-blue-600">Guardar Pauta</Button>
            </div>
        </div>
      </Modal>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-800 flex items-center gap-2">
          <Search className="text-slate-400 dark:text-slate-500 dark:text-slate-400 w-5 h-5"/>
          <input type="text" placeholder="Buscar por nombre o modelo..." className="flex-1 outline-none dark:text-slate-100" value={filtroBusqueda} onChange={(e) => setFiltroBusqueda(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase">
                  <tr>
                      <th className="px-6 py-4">Nombre Pauta</th>
                      <th className="px-6 py-4">Modelo Vehículo</th>
                      <th className="px-6 py-4">KM Aplicación</th>
                      <th className="px-6 py-4">Archivo</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pautasFiltradas.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-800/50">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{p.nombre}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.modeloVehiculo}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{p.kmAplicacion.toLocaleString()} KM</td>
                          <td className="px-6 py-4 text-cyan-600 font-medium cursor-pointer hover:underline">Ver Archivo</td>
                          <td className="px-6 py-4 text-right">
                              <Button size="sm" variant="outline" className="text-slate-600 dark:text-slate-400">Editar</Button>
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
