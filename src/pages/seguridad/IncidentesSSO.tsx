import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, AlertCircle, FileSearch, ShieldAlert } from 'lucide-react';

const mockIncidentes: any[] = [];

const IncidentesSSO = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const getNivelBadge = (nivel: string) => {
    switch (nivel) {
      case 'Crítico': return <Badge variant="error">Crítico</Badge>;
      case 'Alto': return <Badge variant="error" className="bg-orange-100 text-orange-700">Alto</Badge>;
      case 'Medio': return <Badge variant="warning">Medio</Badge>;
      case 'Bajo': return <Badge variant="success">Bajo</Badge>;
      default: return <Badge variant="neutral">{nivel}</Badge>;
    }
  };

  const getEtapaBadge = (etapa: string) => {
    if (etapa === 'Cerrado') return <Badge variant="success">Cerrado</Badge>;
    return <Badge variant="neutral" className="bg-blue-50 text-blue-700 border-blue-200">{etapa}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Incidentes y Accidentes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Investigación de causas raíz, medidas correctivas y gestión integral de eventos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Accidentes CTP (Año)</p>
            <p className="text-2xl font-bold text-red-600 mt-1">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Accidentes STP (Año)</p>
            <p className="text-2xl font-bold text-orange-500 mt-1">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cuasi Accidentes (Año)</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Días Perdidos Totales</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</p>
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
                placeholder="Buscar por código de incidente o Reporte Flash..."
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
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Código Registro</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Ref. Flash</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Fecha Evento</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Tipo de Evento</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Nivel</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Etapa Investigación</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mockIncidentes.map((incidente) => (
                  <tr key={incidente.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-gray-500" />
                        {incidente.id}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">{incidente.flashRef}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{incidente.fecha}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-300 font-medium">{incidente.tipo}</td>
                    <td className="py-3 px-4 text-sm">
                      {getNivelBadge(incidente.nivel)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {getEtapaBadge(incidente.etapa)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <Button variant="ghost" size="sm" className="text-blue-600 flex items-center gap-2 ml-auto">
                        <FileSearch className="w-4 h-4" />
                        Investigar
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

export default IncidentesSSO;
