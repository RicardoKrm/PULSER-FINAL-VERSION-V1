/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StrictMode } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import GenericPage from './pages/GenericPage';
import SuperAdminEmpresas from './pages/super-admin/Empresas';
import SuperAdminPerfiles from './pages/super-admin/Perfiles';
import SuperAdminVisionEvolucion from './pages/super-admin/VisionEvolucion';
import OperacionesAlertas from './pages/operaciones/Alertas';
import KpiFlota from './pages/dashboard/KpiFlota';
import KpiRRHH from './pages/dashboard/KpiRRHH';
import AnalisisFallas from './pages/dashboard/AnalisisFallas';
import PanelTco from './pages/dashboard/PanelTco';
import ReporteMaestro from './pages/dashboard/ReporteMaestro';
import { ThemeProvider } from './components/ThemeProvider';
import { CompanyProvider } from './contexts/CompanyContext';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/operaciones/alertas" replace /> },
      { path: "operaciones/alertas", element: <OperacionesAlertas /> },
      { path: "super-admin/empresas", element: <SuperAdminEmpresas /> },
      { path: "super-admin/perfiles", element: <SuperAdminPerfiles /> },
      { path: "super-admin/vision-evolucion", element: <SuperAdminVisionEvolucion /> },
      { path: "dashboard/kpi-flota", element: <KpiFlota /> },
      { path: "dashboard/kpi-rrhh", element: <KpiRRHH /> },
      { path: "dashboard/fallas", element: <AnalisisFallas /> },
      { path: "dashboard/tco", element: <PanelTco /> },
      { path: "dashboard/reporte-maestro", element: <ReporteMaestro /> },
      { path: "*", element: <GenericPage /> },
    ]
  }
]);

export default function App() {
  return (
    <ThemeProvider>
      <CompanyProvider>
        <RouterProvider router={router} />
      </CompanyProvider>
    </ThemeProvider>
  );
}
