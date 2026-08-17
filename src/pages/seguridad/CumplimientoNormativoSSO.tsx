import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, Book, CheckCircle2, AlertTriangle, FileText, Download } from 'lucide-react';

const mockNormativas: any[] = [];

const CumplimientoNormativoSSO = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Cumple': return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Cumple</Badge>;
      case 'Observación': return <Badge variant="warning" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Observación</Badge>;
      case 'No Cumple': return <Badge variant="error" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> No Cumple</Badge>;
      default: return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cumplimiento Normativo</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Matriz legal y seguimiento de obligaciones reglamentarias.</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar Matriz
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Obligaciones</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cumplimiento Legal</p>
            <p className="text-2xl font-bold text-green-600 mt-1">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Brechas Detectadas (No Cumple)</p>
            <p className="text-2xl font-bold text-red-600 mt-1">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En Observación</p>
            <p className="text-2xl font-bold text-orange-500 mt-1">0</p>
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
                placeholder="Buscar norma, artículo u obligación..."
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
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Norma</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Requisito</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 w-1/3">Obligación</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Evidencia</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Frecuencia</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Responsable</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                {mockNormativas.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      <div className="flex items-center gap-1">
                        <Book className="w-3.5 h-3.5" />
                        {item.norma}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">{item.requisito}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{item.obligacion}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        {item.evidencia}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.frecuencia}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.responsable}</td>
                    <td className="py-3 px-4 text-sm">{getEstadoBadge(item.estado)}</td>
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

export default CumplimientoNormativoSSO;
