import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, Wrench, CheckSquare, Clock, ArrowRight } from 'lucide-react';

const mockAcciones: any[] = [];

const AccionesCorrectivasSSO = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Asignada': return <Badge variant="error" className="bg-orange-100 text-orange-700 border-orange-200">Asignada</Badge>;
      case 'En Ejecución': return <Badge variant="neutral" className="bg-blue-100 text-blue-700 border-blue-200">En Ejecución</Badge>;
      case 'En Revisión SSO': return <Badge variant="warning">En Revisión SSO</Badge>;
      case 'Completada': return <Badge variant="success">Completada</Badge>;
      default: return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acciones Correctivas</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Seguimiento de tareas derivadas de hallazgos para cerrar ciclos de mejora.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Abiertas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vencidas</p>
            <p className="text-2xl font-bold text-red-600 mt-1">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En Revisión SSO</p>
            <p className="text-2xl font-bold text-orange-500 mt-1">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Eficacia Cierre (Mes)</p>
            <p className="text-2xl font-bold text-green-600 mt-1">0</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por descripción, responsable o referencia..."
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
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">ID Acción</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Ref. Hallazgo</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Acción Requerida</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Responsable Ejecución</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Plazo Mínimo</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mockAcciones.map((accion) => (
                  <tr key={accion.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-gray-500" />
                        {accion.id}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline text-xs font-medium">{accion.hallazgoRef}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-300 max-w-sm truncate" title={accion.descripcion}>{accion.descripcion}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{accion.responsable}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {accion.plazo}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{getEstadoBadge(accion.estado)}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <Button variant="ghost" size="sm" className="text-blue-600 flex items-center gap-1 ml-auto">
                        <CheckSquare className="w-4 h-4" /> Validar
                      </Button>
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

export default AccionesCorrectivasSSO;
