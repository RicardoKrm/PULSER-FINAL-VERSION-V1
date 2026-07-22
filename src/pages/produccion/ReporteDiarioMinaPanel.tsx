import React from 'react';
import { FileText } from 'lucide-react';

export default function ReporteDiarioMinaPanel() {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
      <FileText className="w-12 h-12 text-slate-300 mb-4" />
      <h3 className="text-lg font-bold text-slate-700">Panel de Reporte Diario Mina</h3>
      <p className="text-sm text-slate-500 mt-2">Este panel será configurado próximamente.</p>
    </div>
  );
}
