import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileText, Download, Printer, PieChart, Search, Calendar } from 'lucide-react';

const mockReportes: any[] = [];

const ReportesSSO = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Centro de Reportes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Generación y descarga de informes de gestión consolidada.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-500" />
                Generar Nuevo Reporte
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Reporte</label>
                  <select className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Reporte Mensual de Gestión SSO</option>
                    <option>Indicadores de Accidentabilidad</option>
                    <option>Cumplimiento de Contratistas</option>
                    <option>Estado de Hallazgos y Acciones</option>
                    <option>Historial de Capacitaciones</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desde</label>
                    <input type="date" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hasta</label>
                    <input type="date" className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formato</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="radio" name="format" className="text-blue-600" defaultChecked /> PDF
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input type="radio" name="format" className="text-blue-600" /> Excel
                    </label>
                  </div>
                </div>

                <Button className="w-full flex items-center justify-center gap-2 mt-2">
                  <FileText className="w-4 h-4" />
                  Generar Informe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-900 dark:text-white">Informes Generados Recientemente</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar reporte..."
                    className="pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {mockReportes.map((reporte) => (
                  <div key={reporte.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{reporte.nombre}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {reporte.fecha}</span>
                          <span>•</span>
                          <span>{reporte.tipo}</span>
                          <span>•</span>
                          <span>{reporte.formato} ({reporte.tamaño})</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600 p-2" title="Imprimir">
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600 p-2" title="Descargar">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportesSSO;
