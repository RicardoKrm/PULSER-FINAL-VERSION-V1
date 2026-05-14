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
import Contratos from './pages/operaciones/Contratos';
import CrearServicio from './pages/operaciones/CrearServicio';
import Programacion from './pages/operaciones/Programacion';
import Reservas from './pages/operaciones/Reservas';
import GPS from './pages/operaciones/GPS';
import ControlDocumental from './pages/operaciones/ControlDocumental';
import KpiFlota from './pages/dashboard/KpiFlota';
import KpiRRHH from './pages/dashboard/KpiRRHH';
import AnalisisFallas from './pages/dashboard/AnalisisFallas';
import PanelTco from './pages/dashboard/PanelTco';
import ReporteMaestro from './pages/dashboard/ReporteMaestro';
import PizarraMantenimiento from './pages/flota/Mantenimiento';
import PizarraProgramacion from './pages/flota/PizarraProgramacion';
import GestionOrdenesTrabajo from './pages/flota/OrdenesTrabajo';
import OrdenesTrabajoDetail from './pages/flota/OrdenesTrabajoDetail';
import ConfiguracionEmpresa from './pages/configuracion/Empresa';
import GestionPautas from './pages/flota/GestionPautas';
import GestionTareas from './pages/flota/GestionTareas';
import VehiculosArchivados from './pages/configuracion/VehiculosArchivados';
import GestionKits from './pages/herramientas/GestionKits';
import GestionNeumaticos from './pages/flota/GestionNeumaticos';
import GestionCombustible from './pages/flota/GestionCombustible';
import { ThemeProvider } from './components/ThemeProvider';
import { CompanyProvider } from './contexts/CompanyContext';
import { AppProvider } from './context/AppContext';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/operaciones/alertas" replace /> },
      { path: "operaciones/alertas", element: <OperacionesAlertas /> },
      { path: "operaciones/contratos", element: <Contratos /> },
      { path: "operaciones/servicios", element: <CrearServicio /> },
      { path: "operaciones/reservas", element: <Reservas /> },
      { path: "operaciones/programacion", element: <Programacion /> },
      { path: "operaciones/gps", element: <GPS /> },
      { path: "operaciones/control-documental", element: <ControlDocumental /> },
      { path: "super-admin/empresas", element: <SuperAdminEmpresas /> },
      { path: "super-admin/perfiles", element: <SuperAdminPerfiles /> },
      { path: "super-admin/vision-evolucion", element: <SuperAdminVisionEvolucion /> },
      { path: "dashboard/kpi-flota", element: <KpiFlota /> },
      { path: "dashboard/kpi-rrhh", element: <KpiRRHH /> },
      { path: "dashboard/fallas", element: <AnalisisFallas /> },
      { path: "dashboard/tco", element: <PanelTco /> },
      { path: "dashboard/reporte-maestro", element: <ReporteMaestro /> },
      { path: "flota/mantenimiento", element: <PizarraMantenimiento /> },
      { path: "flota/programacion", element: <PizarraProgramacion /> },
      { path: "flota/ordenes-trabajo", element: <GestionOrdenesTrabajo /> },
      { path: "flota/ordenes-trabajo/:id", element: <OrdenesTrabajoDetail /> },
      { path: "flota/neumaticos", element: <GestionNeumaticos /> },
      { path: "flota/combustible", element: <GestionCombustible /> },
      { path: "configuracion/pautas", element: <GestionPautas /> },
      { path: "configuracion/tareas", element: <GestionTareas /> },
      { path: "configuracion/vehiculos-archivados", element: <VehiculosArchivados /> },
      { path: "herramientas/kits", element: <GestionKits /> },
      { path: "*", element: <GenericPage /> },
    ]
  }
]);

export default function App() {
  return (
    <ThemeProvider>
      <CompanyProvider>
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
      </CompanyProvider>
    </ThemeProvider>
  );
}

