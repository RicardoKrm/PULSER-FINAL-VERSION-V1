/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StrictMode } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import GenericPage from './pages/GenericPage';
import Dashboard from './pages/Dashboard';
import SuperAdminEmpresas from './pages/super-admin/Empresas';
import SuperAdminPerfiles from './pages/super-admin/Perfiles';
import SuperAdminVisionEvolucion from './pages/super-admin/VisionEvolucion';
import OperacionesAlertas from './pages/operaciones/Alertas';
import Contratos from './pages/operaciones/Contratos';
import CrearServicio from './pages/operaciones/CrearServicio';
import Programacion from './pages/operaciones/Programacion';
import Reservas from './pages/operaciones/Reservas';
import GPS from './pages/operaciones/GPS';
import PortalConductor from './pages/operaciones/PortalConductor';
import ControlDocumental from './pages/operaciones/ControlDocumental';
import Historial from './pages/operaciones/Historial';
import KpiFlota from './pages/dashboard/KpiFlota';
import KpiRRHH from './pages/dashboard/KpiRRHH';
import AnalisisFallas from './pages/dashboard/AnalisisFallas';
import PanelTco from './pages/dashboard/PanelTco';
import ReporteMaestro from './pages/dashboard/ReporteMaestro';
import PizarraMantenimiento from './pages/flota/Mantenimiento';
import PizarraProgramacion from './pages/flota/PizarraProgramacion';
import GestionOrdenesTrabajo from './pages/flota/OrdenesTrabajo';
import OrdenesTrabajoDetail from './pages/flota/OrdenesTrabajoDetail';
import GestionPautas from './pages/configuracion/GestionPautas';
import GestionTareas from './pages/configuracion/GestionTareas';
import VehiculosArchivados from './pages/configuracion/VehiculosArchivados';
import GestionKits from './pages/herramientas/GestionKits';
import GestionNeumaticos from './pages/flota/GestionNeumaticos';
import GestionCombustible from './pages/flota/GestionCombustible';
import GestionSuministros from './pages/logistica/GestionSuministros';
import GestionBodegas from './pages/logistica/GestionBodegas';
import GestionProveedores from './pages/herramientas/GestionProveedores';
import PuertoEscaneo from './pages/logistica/PuertoEscaneo';
import Aprobaciones from './pages/logistica/Aprobaciones';
import GestionAuditorias from './pages/logistica/GestionAuditorias';
import DetalleAuditoria from './pages/logistica/DetalleAuditoria';
import OrdenesCompra from './pages/compras/OrdenesCompra';
import IngresoFacturas from './pages/compras/IngresoFacturas';
import Cotizaciones from './pages/compras/Cotizaciones';
import ContratosProveedores from './pages/compras/ContratosProveedores';
import PrecioCombustible from './pages/configuracion/PrecioCombustible';
import Personal from './pages/configuracion/Personal';
import AsignacionPermisos from './pages/configuracion/AsignacionPermisos';
import GestionFallas from './pages/configuracion/GestionFallas';
import ConfiguracionEmpresa from './pages/configuracion/ConfiguracionEmpresa';
import CargaMasiva from './pages/configuracion/CargaMasiva';
import GestionPausas from './pages/configuracion/GestionPausas';
import Integraciones from './pages/soporte/Integraciones';
import CentroAyuda from './pages/soporte/CentroAyuda';
import ManualUso from './pages/soporte/ManualUso';
import EstadoPago from './pages/finanzas/EstadoPago';
import HistorialFacturacion from './pages/finanzas/HistorialFacturacion';
import Trazabilidad from './pages/finanzas/Trazabilidad';
import EvaluacionEmpresa from './pages/finanzas/EvaluacionEmpresa';
import CostosOperacionales from './pages/finanzas/CostosOperacionales';
import Presupuestos from './pages/finanzas/Presupuestos';
import { ThemeProvider } from './components/ThemeProvider';
import { CompanyProvider } from './contexts/CompanyContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';

import Login from './pages/Login';

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <Dashboard /> },
      { path: "operaciones/alertas", element: <OperacionesAlertas /> },
      { path: "operaciones/contratos", element: <Contratos /> },
      { path: "operaciones/servicios", element: <CrearServicio /> },
      { path: "operaciones/reservas", element: <Reservas /> },
      { path: "operaciones/programacion", element: <Programacion /> },
      { path: "operaciones/gps", element: <GPS /> },
      { path: "operaciones/portal-conductor", element: <PortalConductor /> },
      { path: "operaciones/control-documental", element: <ControlDocumental /> },
      { path: "operaciones/historial", element: <Historial /> },
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
      { path: "configuracion/personal", element: <Personal /> },
      { path: "configuracion/permisos", element: <AsignacionPermisos /> },
      { path: "configuracion/fallas", element: <GestionFallas /> },
      { path: "configuracion/empresa", element: <ConfiguracionEmpresa /> },
      { path: "configuracion/tareas", element: <GestionTareas /> },
      { path: "configuracion/vehiculos-archivados", element: <VehiculosArchivados /> },
      { path: "configuracion/pausas", element: <GestionPausas /> },
      { path: "configuracion/carga-masiva", element: <CargaMasiva /> },
      { path: "herramientas/kits", element: <GestionKits /> },
      { path: "compras/ordenes", element: <OrdenesCompra /> },
      { path: "compras/facturas", element: <IngresoFacturas /> },
      { path: "compras/proveedores", element: <GestionProveedores /> },
      { path: "compras/cotizaciones", element: <Cotizaciones /> },
      { path: "compras/contratos", element: <ContratosProveedores /> },
      { path: "finanzas/estado-pago", element: <EstadoPago /> },
      { path: "finanzas/historial-facturacion", element: <HistorialFacturacion /> },
      { path: "finanzas/costos", element: <CostosOperacionales /> },
      { path: "finanzas/presupuestos", element: <Presupuestos /> },
      { path: "finanzas/trazabilidad", element: <Trazabilidad /> },
      { path: "finanzas/evaluacion-empresa", element: <EvaluacionEmpresa /> },
      { path: "configuracion/precio-combustible", element: <PrecioCombustible /> },
      { path: "logistica/suministros", element: <GestionSuministros /> },
      { path: "logistica/bodegas", element: <GestionBodegas /> },
      { path: "logistica/escaneo", element: <PuertoEscaneo /> },
      { path: "logistica/validaciones", element: <Aprobaciones /> },
      { path: "logistica/auditorias", element: <GestionAuditorias /> },
      { path: "logistica/auditorias/:id", element: <DetalleAuditoria /> },
      { path: "soporte/integraciones", element: <Integraciones /> },
      { path: "soporte/tickets", element: <CentroAyuda /> },
      { path: "soporte/manual", element: <ManualUso /> },
          { path: "*", element: <GenericPage /> },
        ]
      }
    ]
  }
]);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CompanyProvider>
          <AppProvider>
            <RouterProvider router={router} />
          </AppProvider>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

