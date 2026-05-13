import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus } from 'lucide-react';

export default function GestionTareas() {
  const { tareasEstandar } = useAppContext();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Tareas</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-0 overflow-hidden lg:col-span-2">
            <div className="overflow-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b text-xs text-slate-500 uppercase">
                      <tr>
                          <th className="px-6 py-4">Descripción</th>
                          <th className="px-6 py-4">Tiempo Estándar (Min)</th>
                          <th className="px-6 py-4">Costo Mano Obra ($)</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {tareasEstandar.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 text-slate-900 font-medium">{t.descripcion}</td>
                              <td className="px-6 py-4 text-slate-600">{t.tiempoEstandarMinutos}</td>
                              <td className="px-6 py-4 text-slate-600">${t.costoManoObra.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right">
                                  <Button size="sm" variant="outline" className="text-slate-600 mr-2">Editar</Button>
                                  <Button size="sm" variant="outline" className="text-red-500">Eliminar</Button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
        </Card>
        
        <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Crear Nueva Tarea</h2>
            <div className="space-y-4">
                <input type="text" placeholder="Ej: Cambio de aceite..." className="w-full p-2 border rounded" />
                <input type="number" placeholder="Tiempo estándar (minutos)" className="w-full p-2 border rounded" />
                <input type="number" placeholder="Costo Mano Obra ($)" className="w-full p-2 border rounded" />
                <Button className="w-full bg-cyan-600"><Plus className="w-4 h-4 mr-2"/> Crear Tarea</Button>
            </div>
        </Card>
      </div>
    </div>
  );
}
