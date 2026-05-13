import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export default function GestionPautas() {
  const { pautas } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestionar Pautas de Mantenimiento</h1>
        <Button className="bg-cyan-600" onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Añadir Nueva Pauta</Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nueva Pauta de Mantenimiento">
        <div className="space-y-4">
            <input type="text" placeholder="Nombre" className="w-full p-2 border rounded" />
            <select className="w-full p-2 border rounded"><option>---------</option></select>
            <input type="number" placeholder="Kilometraje Inicial" className="w-full p-2 border rounded" />
            <input type="number" placeholder="Intervalo 1 (KM)" className="w-full p-2 border rounded" />
            <input type="number" placeholder="Intervalo 2 (KM) - Opcional" className="w-full p-2 border rounded" />
            <textarea placeholder="Tareas (una por línea)" className="w-full p-2 border rounded" rows={4} />
            <input type="file" className="w-full p-2 border rounded" />
            <input type="text" placeholder="Tipo aplicación" className="w-full p-2 border rounded" />
            <input type="text" placeholder="Tipo aceite" className="w-full p-2 border rounded" />
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button className="bg-blue-600">Guardar Pauta</Button>
            </div>
        </div>
      </Modal>

      <Card className="overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b text-xs text-slate-500 uppercase">
                  <tr>
                      <th className="px-6 py-4">Nombre Pauta</th>
                      <th className="px-6 py-4">Modelo Vehículo</th>
                      <th className="px-6 py-4">KM Aplicación</th>
                      <th className="px-6 py-4">Archivo</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {pautas.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-semibold text-slate-900">{p.nombre}</td>
                          <td className="px-6 py-4 text-slate-600">{p.modeloVehiculo}</td>
                          <td className="px-6 py-4 text-slate-600">{p.kmAplicacion.toLocaleString()} KM</td>
                          <td className="px-6 py-4 text-cyan-600 font-medium cursor-pointer hover:underline">Ver Archivo</td>
                          <td className="px-6 py-4 text-right">
                              <Button size="sm" variant="outline" className="text-slate-600">Editar</Button>
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
