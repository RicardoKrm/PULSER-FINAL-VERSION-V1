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
import SuperAdminLogActividad from './pages/super-admin/LogActividad';
import FlotaAlertas from './pages/flota/Alertas';
import Contratos from './pages/operaciones/Contratos';
import CrearServicio from './pages/operaciones/CrearServicio';
import Programacion from './pages/operaciones/Programacion';
import ConfiguracionAlertas from './pages/configuracion/ConfiguracionAlertas';
import MatrizEscalamiento from './pages/configuracion/MatrizEscalamiento';
import Mantenedores from './pages/operaciones/Mantenedores';
import Reservas from './pages/operaciones/Reservas';
import ProduccionLayout from './pages/produccion/ProduccionLayout';
import DashboardProduccion from './pages/produccion/DashboardProduccion';
import ReportesDiariosPage from './pages/produccion/ReportesDiariosPage';
import ReportesDiariosMinaPage from './pages/produccion/ReportesDiariosMinaPage';
import PlanificadorTransportePage from './pages/produccion/PlanificadorTransportePage';
import TrazabilidadPage from './pages/produccion/TrazabilidadPage';
import HorasMaquinaPage from './pages/produccion/HorasMaquinaPage';
import ResumenMensualMina from './pages/produccion/ResumenMensualMina';
import ControlSanny from './pages/produccion/ControlSanny';
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
import BibliotecaExplorador from './pages/biblioteca/BibliotecaExplorador';
import BibliotecaSubir from './pages/biblioteca/BibliotecaSubir';
import GestionPautas from './pages/configuracion/GestionPautas';
import GestionTareas from './pages/configuracion/GestionTareas';
import Vehiculos from './pages/configuracion/Vehiculos';
import ConfiguracionGPS from './pages/configuracion/ConfiguracionGPS';
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
import AuditoriaSalidas from './pages/logistica/AuditoriaSalidas';
import OrdenesCompra from './pages/compras/OrdenesCompra';
import SolicitudesCompra from './pages/compras/SolicitudesCompra';
import IngresoFacturas from './pages/compras/IngresoFacturas';
import Cotizaciones from './pages/compras/Cotizaciones';
import ContratosProveedores from './pages/compras/ContratosProveedores';
import PrecioCombustible from './pages/configuracion/PrecioCombustible';
import Personal from './pages/recursos-humanos/Personal';
import AsignacionPermisos from './pages/recursos-humanos/AsignacionPermisos';
import Turnos from './pages/recursos-humanos/Turnos';
import GestionFallas from './pages/configuracion/GestionFallas';
import ConfiguracionEmpresa from './pages/configuracion/ConfiguracionEmpresa';
import CargaMasiva from './pages/configuracion/CargaMasiva';
import GestionPausas from './pages/configuracion/GestionPausas';
import GestionRutas from './pages/configuracion/GestionRutas';
import Integraciones from './pages/soporte/Integraciones';
import CentroAyuda from './pages/soporte/CentroAyuda';
import ManualUso from './pages/soporte/ManualUso';
import EstadoPago from './pages/finanzas/EstadoPago';
import HistorialFacturacion from './pages/finanzas/HistorialFacturacion';
import Trazabilidad from './pages/finanzas/Trazabilidad';
import EvaluacionEmpresa from './pages/finanzas/EvaluacionEmpresa';
import RegistrosFinancieros from './pages/finanzas/RegistrosFinancieros';
import GestionOperativa from './pages/finanzas/GestionOperativa';
import CostosOperacionales from './pages/finanzas/CostosOperacionales';
import Presupuestos from './pages/finanzas/Presupuestos';
import ControlExtintores from './pages/seguridad/ControlExtintores';
import ControlVelocidades from './pages/seguridad/ControlVelocidades';
import ControlEventos from './pages/seguridad/ControlEventos';
import ControlDocumentalSeguridad from './pages/seguridad/ControlDocumental';
import DashboardSSO from './pages/seguridad/DashboardSSO';
import GavalSeeder from './pages/GavalSeeder';
import TrabajadoresSSO from './pages/seguridad/TrabajadoresSSO';
import EmpresasContratistasSSO from './pages/seguridad/EmpresasContratistasSSO';
import EppSSO from './pages/seguridad/EppSSO';
import CharlasSSO from './pages/seguridad/CharlasSSO';
import CapacitacionesSSO from './pages/seguridad/CapacitacionesSSO';
import GestionRiesgosSSO from './pages/seguridad/GestionRiesgosSSO';
import InspeccionesSSO from './pages/seguridad/InspeccionesSSO';
import EquiposEmergenciaSSO from './pages/seguridad/EquiposEmergenciaSSO';
import ReporteFlashSSO from './pages/seguridad/ReporteFlashSSO';
import IncidentesSSO from './pages/seguridad/IncidentesSSO';
import ObservacionesSSO from './pages/seguridad/ObservacionesSSO';
import HallazgosSSO from './pages/seguridad/HallazgosSSO';
import AccionesCorrectivasSSO from './pages/seguridad/AccionesCorrectivasSSO';
import EmergenciasSSO from './pages/seguridad/EmergenciasSSO';
import AuditoriasSSO from './pages/seguridad/AuditoriasSSO';
import CumplimientoNormativoSSO from './pages/seguridad/CumplimientoNormativoSSO';
import IndicadoresSSO from './pages/seguridad/IndicadoresSSO';
import ReportesSSO from './pages/seguridad/ReportesSSO';
import { ThemeProvider } from './components/ThemeProvider';
import { CompanyProvider } from './contexts/CompanyContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

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
      { path: "flota/alertas", element: <FlotaAlertas /> },
      { path: "operaciones/contratos", element: <Contratos /> },
      { path: "operaciones/servicios", element: <CrearServicio /> },
      
      { path: "produccion", element: <ProduccionLayout />, children: [
        { index: true, element: <Navigate to="/produccion/dashboard" replace /> },
        { path: "dashboard", element: <DashboardProduccion /> },
        { path: "control-sanny", element: <ControlSanny /> },
        { path: "horas-maquina", element: <HorasMaquinaPage /> },
        { path: "reportes-transporte", element: <ReportesDiariosPage /> },
        { path: "reportes-mina", element: <ReportesDiariosMinaPage /> },
        { path: "planificador", element: <PlanificadorTransportePage /> },
        { path: "resumen-mensual-mina", element: <ResumenMensualMina /> },
        { path: "trazabilidad", element: <TrazabilidadPage /> }
      ]},

      { path: "operaciones/reservas", element: <Reservas /> },
      { path: "operaciones/mantenedores", element: <Mantenedores /> },
      { path: "operaciones/programacion", element: <Programacion /> },
      { path: "operaciones/gps", element: <GPS /> },
      { path: "operaciones/portal-conductor", element: <PortalConductor /> },
      { path: "operaciones/control-documental", element: <ControlDocumental /> },
      { path: "operaciones/historial", element: <Historial /> },
      { path: "super-admin/empresas", element: <SuperAdminEmpresas /> },
      { path: "super-admin/perfiles", element: <SuperAdminPerfiles /> },
      { path: "super-admin/vision-evolucion", element: <SuperAdminVisionEvolucion /> },
      { path: "super-admin/actividad", element: <SuperAdminLogActividad /> },
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
      { path: "recursos-humanos/personal", element: <Personal /> },
      { path: "recursos-humanos/permisos", element: <AsignacionPermisos /> },
      { path: "recursos-humanos/turnos", element: <Turnos /> },
      { path: "configuracion/fallas", element: <GestionFallas /> },
      { path: "configuracion/empresa", element: <ConfiguracionEmpresa /> },
      { path: "configuracion/tareas", element: <GestionTareas /> },
      { path: "configuracion/vehiculos", element: <Vehiculos /> },
      { path: "configuracion/gps", element: <ConfiguracionGPS /> },
      { path: "configuracion/pausas", element: <GestionPausas /> },
      { path: "operaciones/rutas", element: <GestionRutas /> },
      { path: "configuracion/carga-masiva", element: <CargaMasiva /> },
      { path: "herramientas/kits", element: <GestionKits /> },
      { path: "compras/solicitudes", element: <SolicitudesCompra /> },
      { path: "compras/ordenes", element: <OrdenesCompra /> },
      { path: "compras/facturas", element: <IngresoFacturas /> },
      { path: "compras/proveedores", element: <GestionProveedores /> },
      { path: "compras/cotizaciones", element: <Cotizaciones /> },
      { path: "compras/contratos", element: <ContratosProveedores /> },
      { path: "finanzas/estado-pago", element: <EstadoPago /> },
      { path: "finanzas/registros-financieros", element: <RegistrosFinancieros /> },
      { path: "finanzas/gestion-operativa", element: <GestionOperativa /> },
      { path: "finanzas/historial-facturacion", element: <HistorialFacturacion /> },
      { path: "finanzas/costos", element: <CostosOperacionales /> },
      { path: "finanzas/presupuestos", element: <Presupuestos /> },
      { path: "finanzas/trazabilidad", element: <Trazabilidad /> },
      { path: "finanzas/evaluacion-empresa", element: <EvaluacionEmpresa /> },
      { path: "biblioteca/explorador", element: <BibliotecaExplorador /> },
      { path: "biblioteca/subir", element: <BibliotecaSubir /> },
      { path: "configuracion/precio-combustible", element: <PrecioCombustible /> },
      { path: "logistica/suministros", element: <GestionSuministros /> },
      { path: "logistica/bodegas", element: <GestionBodegas /> },
      { path: "logistica/escaneo", element: <PuertoEscaneo /> },
      { path: "logistica/auditoria-salidas", element: <AuditoriaSalidas /> },
      { path: "logistica/validaciones", element: <Aprobaciones /> },
      { path: "logistica/auditorias", element: <GestionAuditorias /> },
      { path: "logistica/auditorias/:id", element: <DetalleAuditoria /> },
      { path: "soporte/integraciones", element: <Integraciones /> },
      { path: "soporte/tickets", element: <CentroAyuda /> },
      { path: "soporte/manual", element: <ManualUso /> },
      { path: "seguridad/extintores", element: <ControlExtintores /> },
      { path: "seguridad/velocidades", element: <ControlVelocidades /> },
      { path: "seguridad/eventos", element: <ControlEventos /> },
      { path: "seguridad/documental", element: <ControlDocumentalSeguridad /> },
      { path: "seguridad/dashboard", element: <DashboardSSO /> },
      { path: "seguridad/trabajadores", element: <TrabajadoresSSO /> },
      { path: "seguridad/contratistas", element: <EmpresasContratistasSSO /> },
      { path: "seguridad/epp", element: <EppSSO /> },
        { path: "gaval-seeder", element: <GavalSeeder /> },
      { path: "seguridad/charlas", element: <CharlasSSO /> },
      { path: "seguridad/capacitaciones", element: <CapacitacionesSSO /> },
      { path: "seguridad/riesgos", element: <GestionRiesgosSSO /> },
      { path: "seguridad/inspecciones", element: <InspeccionesSSO /> },
      { path: "seguridad/equipos-emergencia", element: <EquiposEmergenciaSSO /> },
      { path: "seguridad/reporte-flash", element: <ReporteFlashSSO /> },
      { path: "seguridad/incidentes", element: <IncidentesSSO /> },
      { path: "seguridad/observaciones", element: <ObservacionesSSO /> },
      { path: "seguridad/hallazgos", element: <HallazgosSSO /> },
      { path: "seguridad/acciones-correctivas", element: <AccionesCorrectivasSSO /> },
      { path: "seguridad/emergencias", element: <EmergenciasSSO /> },
      { path: "seguridad/auditorias", element: <AuditoriasSSO /> },
      { path: "seguridad/normativo", element: <CumplimientoNormativoSSO /> },
      { path: "seguridad/indicadores", element: <IndicadoresSSO /> },
      { path: "seguridad/reportes", element: <ReportesSSO /> },
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
            <Toaster position="top-right" />
          </AppProvider>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}


