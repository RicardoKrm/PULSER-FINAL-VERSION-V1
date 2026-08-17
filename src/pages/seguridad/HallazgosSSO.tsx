import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Search, Filter, Target, AlertTriangle } from 'lucide-react';

const mockHallazgos: any[] = [];

const HallazgosSSO = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const getSeveridadBadge = (severidad: string) => {
    switch (severidad) {
      case 'Alta': return <Badge variant="error" className="bg-red-100 text-red-700 border-red-200">Alta</Badge>;
      case 'Media': return <Badge variant="warning">Media</Badge>;
      case 'Baja': return <Badge variant="success" className="bg-green-100 text-green-700 border-green-200">Baja</Badge>;
      default: return <Badge variant="neutral">{severidad}</Badge>;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Abierto': return <Badge variant="error" className="bg-orange-100 text-orange-700 border-orange-200">Abierto</Badge>;
      case 'En Tratamiento': return <Badge variant="neutral" className="bg-blue-100 text-blue-700 border-blue-200">En Tratamiento</Badge>;
      case 'Pendiente Validación': return <Badge variant="warning">Pendiente Validación</Badge>;
      case 'Cerrado': return <Badge variant="success">Cerrado</Badge>;
      default: return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hallazgos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Centralización de desviaciones generadas desde auditorías, inspecciones e incidentes.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Registrar Hallazgo
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por ID, descripción o responsable..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">ID Hallazgo</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Origen</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Descripción</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Severidad</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Área / Resp.</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Vencimiento</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mockHallazgos.map((hallazgo) => (
                  <tr key={hallazgo.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-500" />
                        {hallazgo.id}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400 text-xs font-medium">{hallazgo.origen}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-300 max-w-xs truncate" title={hallazgo.descripcion}>{hallazgo.descripcion}</td>
                    <td className="py-3 px-4 text-sm">{getSeveridadBadge(hallazgo.severidad)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{hallazgo.responsable}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(hallazgo.vencimiento) < new Date('2026-08-16') && hallazgo.estado !== 'Cerrado' ? (
                        <span className="text-red-500 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {hallazgo.vencimiento}</span>
                      ) : (
                        hallazgo.vencimiento
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">{getEstadoBadge(hallazgo.estado)}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <Button variant="ghost" size="sm" className="text-blue-600">Gestionar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HallazgosSSO;
