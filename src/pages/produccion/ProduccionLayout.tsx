import React from 'react';
import { Outlet } from 'react-router-dom';
import { ProduccionProvider } from '../../contexts/ProduccionContext';

export default function ProduccionLayout() {
  return (
    <ProduccionProvider>
      <div className="flex flex-col space-y-6">
        <main className="w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </ProduccionProvider>
  );
}
