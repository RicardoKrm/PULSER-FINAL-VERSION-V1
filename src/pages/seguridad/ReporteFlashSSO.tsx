import React, { useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Plus, Search, Filter, Zap, FileText, Download, Printer, Paperclip, Eye, AlertTriangle } from 'lucide-react';

const mockReportes: any[] = [];

const ReporteFlashSSO = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const getPotencialBadge = (potencial: string) => {
    switch (potencial) {
      case 'Alto': return <Badge variant="error">Alto</Badge>;
      case 'Medio': return <Badge variant="warning">Medio</Badge>;
      case 'Bajo': return <Badge variant="success">Bajo</Badge>;
      default: return <Badge variant="neutral">{potencial}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reporte Flash</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Generación rápida de reportes de incidentes y accidentes en terreno.</p>
        </div>
        <Button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30">
          <Zap className="w-4 h-4 fill-current" />
          NUEVO REPORTE FLASH
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por ID, área o tipo de evento..."
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
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">ID Reporte</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Fecha y Hora</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Tipo Evento</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Área</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Potencial Gravedad</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Documentos</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mockReportes.map((reporte) => (
                  <tr key={reporte.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${reporte.potencial === 'Alto' ? 'text-red-500' : reporte.potencial === 'Medio' ? 'text-orange-500' : 'text-blue-500'}`} />
                        {reporte.id}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{reporte.fecha}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-300 font-medium">{reporte.tipo}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{reporte.area}</td>
                    <td className="py-3 px-4 text-sm">
                      {getPotencialBadge(reporte.potencial)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs">PDF + 2 Evid.</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600 p-1.5" title="Ver PDF">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600 p-1.5" title="Descargar PDF">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600 p-1.5" title="Imprimir">
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600 p-1.5" title="Adjuntar Documentos">
                          <Paperclip className="w-4 h-4" />
                        </Button>
                      </div>
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

export default ReporteFlashSSO;
