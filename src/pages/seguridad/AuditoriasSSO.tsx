import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, ClipboardList, Calendar, Target, CheckCircle2, AlertCircle, Plus } from 'lucide-react';

const mockAuditorias: any[] = [];

const AuditoriasSSO = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Cerrada': return <Badge variant="success">Cerrada</Badge>;
      case 'Programada': return <Badge variant="neutral" className="bg-blue-50 text-blue-700">Programada</Badge>;
      case 'Con Hallazgos Abiertos': return <Badge variant="warning">Hallazgos Abiertos</Badge>;
      default: return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auditorías SSO</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Registro de auditorías internas, externas y seguimiento de cumplimiento.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Programar Auditoría
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <ClipboardList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Auditorías Realizadas (Año)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Promedio Cumplimiento</p>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hallazgos de Auditoría (Abiertos)</p>
                <p className="text-2xl font-bold text-orange-500">0</p>
              </div>
            </div>
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
                placeholder="Buscar auditoría por nombre o código..."
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
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Auditoría</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Tipo</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Fecha</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Alcance</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Cumplimiento</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mockAuditorias.map((auditoria) => (
                  <tr key={auditoria.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm">
                      <div className="font-medium text-gray-900 dark:text-gray-300">{auditoria.nombre}</div>
                      <div className="text-xs text-gray-500">{auditoria.id}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <Badge variant={auditoria.tipo === 'Interna' ? 'neutral' : 'warning'} className={auditoria.tipo === 'Externa' ? 'bg-purple-100 text-purple-700' : ''}>
                        {auditoria.tipo}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {auditoria.fecha}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{auditoria.alcance}</td>
                    <td className="py-3 px-4 text-sm">
                      {auditoria.cumplimiento !== null ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${auditoria.cumplimiento >= 90 ? 'text-green-600' : auditoria.cumplimiento >= 80 ? 'text-orange-500' : 'text-red-500'}`}>
                            {auditoria.cumplimiento}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Por evaluar</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">{getEstadoBadge(auditoria.estado)}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <Button variant="ghost" size="sm" className="text-blue-600">Ver Detalles</Button>
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

export default AuditoriasSSO;
