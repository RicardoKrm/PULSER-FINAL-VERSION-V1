import React from 'react';
import { Outlet } from 'react-router-dom';
import HeaderProduccion from '../operaciones/produccion/HeaderProduccion';
import { ProduccionProvider } from '../../contexts/ProduccionContext';

export default function ProduccionLayout() {
  return (
    <ProduccionProvider>
      <div className="flex flex-col space-y-6">
        <HeaderProduccion />
        
        <main className="w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </ProduccionProvider>
  );
}
