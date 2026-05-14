import React, { useState } from 'react';
import { Archive, Undo2, Info } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export default function VehiculosArchivados() {
  // In a real app we would load 'archivados' from the backend.
  // For now we use a mockup state:
  const [archivados, setArchivados] = useState<any[]>([]);

  const handleReactivar = (id: number) => {
    setArchivados(archivados.filter(v => v.id !== id));
    // Here we'd call an API to reactivate
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Vehículos Archivados</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Aquí puedes ver y reactivar vehículos que han sido archivados.</p>
      </div>

      {archivados.length === 0 ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 border-l-4 border-blue-500 flex gap-3 text-sm">
          <div>
            <strong className="block mb-1">¡Excelente!</strong>
            No hay vehículos archivados en este momento.
          </div>
        </div>
      ) : (
        <Card className="shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-5 py-4">Vehículo</th>
                  <th className="px-5 py-4">KM al Archivar</th>
                  <th className="px-5 py-4">Fecha Archivo</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {archivados.map((vehiculo) => (
                  <tr key={vehiculo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{vehiculo.numeroInterno}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{vehiculo.marca} {vehiculo.modelo}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded inline-block text-slate-700 dark:text-slate-300">
                        {vehiculo.km.toLocaleString('es-CL')} km
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {vehiculo.fechaArchivo}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/30"
                        onClick={() => handleReactivar(vehiculo.id)}
                      >
                        <Undo2 className="w-4 h-4 mr-2" /> Reactivar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
