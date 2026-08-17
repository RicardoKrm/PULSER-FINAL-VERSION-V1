import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Filter, Shield, AlertTriangle, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

const mockTrabajadores: any[] = [];

const TrabajadoresSSO = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Habilitado':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Habilitado</Badge>;
      case 'Pendiente':
        return <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Pendiente</Badge>;
      case 'No Habilitado':
        return <Badge variant="error" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> No Habilitado</Badge>;
      default:
        return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trabajadores</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de fichas, habilitaciones y estado SSO del personal.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Trabajador
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre, RUT o cargo..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">RUT</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Nombre</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Cargo</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Empresa</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Área / Turno</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Estado SSO</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mockTrabajadores.map((trabajador) => (
                  <tr key={trabajador.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-300 font-medium">{trabajador.rut}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-300">{trabajador.nombre}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{trabajador.cargo}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{trabajador.empresa}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex flex-col">
                        <span>{trabajador.area}</span>
                        <span className="text-xs text-gray-400">{trabajador.turno}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {getStatusBadge(trabajador.estado)}
                      {trabajador.estado === 'No Habilitado' && (
                        <p className="text-xs text-red-500 mt-1">Certificación vencida</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        Ver Ficha
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

export default TrabajadoresSSO;
