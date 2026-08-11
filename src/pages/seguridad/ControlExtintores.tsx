import React from 'react';
import { Shield } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';

const ControlExtintores = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Control Extintores</h1>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-24 text-center">
          <Shield className="w-16 h-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Módulo en Proceso</h2>
          <p className="text-gray-500 max-w-md">
            Estamos trabajando en el desarrollo de este módulo. Pronto estará disponible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ControlExtintores;
