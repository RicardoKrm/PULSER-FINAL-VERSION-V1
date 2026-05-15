import React, { useState } from 'react';
import { BookOpen, MonitorPlay, FileText, ChevronRight, Search, PlayCircle, Menu, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const MODULES = [
  {
    id: 'dashboard',
    title: 'Dashboard & Analítica',
    description: 'Aprende a interpretar los KPIs, evolución y el análisis de fallas en tiempo real.',
    duration: '08:45',
    videoUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    content: [
      { subtitle: 'Panel de Control', text: 'Visualiza en tiempo real el estado general de la flota, alertas críticas y métricas clave.' },
      { subtitle: 'Reporte de Evolución', text: 'Analiza el rendimiento histórico y proyectado mediante gráficas de tendencia y comparativas interanuales.' },
      { subtitle: 'Exportación de Datos', text: 'Descarga reportes gerenciales en formato CSV y PDF directamente desde el panel principal en la esquina superior.' },
    ]
  },
  {
    id: 'operaciones',
    title: 'Operaciones y Servicios',
    description: 'Gestión de contratos, reservas, programación de servicios y control documental.',
    duration: '12:20',
    videoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8ed7c1590a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    content: [
      { subtitle: 'Gestión de Contratos', text: 'Administra acuerdos con clientes, vigencias y condiciones comerciales aplicables a los servicios de transporte.' },
      { subtitle: 'Reservas y Programación', text: 'Crea solicitudes de reserva de vehículos e ingresa directamente al calendario de programación para asignar conductores y equipos según disponibilidad.' },
      { subtitle: 'Control Documental', text: 'Verifica la validez y el estado de la documentación exigida tanto a conductores (Licencias) como a vehículos (Revisiones técnicas, permisos), evitando infracciones.' },
      { subtitle: 'Historial', text: 'Revisa la trazabilidad y auditoría de eventos de todas las acciones operativas mediante el uso de un buscador detallado por fechas y referencias.' }
    ]
  },
  {
    id: 'gestión_flota',
    title: 'Gestión de Flota',
    description: 'Control de la pizarra de mantenimiento, programación de recursos y órdenes de trabajo.',
    duration: '15:10',
    videoUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    content: [
      { subtitle: 'Pizarra de Mantenimiento', text: 'Controla los estados de los vehículos (En taller, operativo, en ruta) mediante un panel tipo Kanban de fácil acceso visual.' },
      { subtitle: 'Programación de Recursos', text: 'Asigna a través del calendario los recursos mecánicos, la disponibilidad de los fosos de taller y tiempos de reparación.' },
      { subtitle: 'Órdenes de Trabajo (OT)', text: 'Crea y administra OTs, registrando actividades, calculando tiempos de respuesta, ingresando costos de repuestos y validando garantías de los proveedores.' },
    ]
  },
  {
    id: 'integracion_monitoreo',
    title: 'Monitoreo GPS y Alertas',
    description: 'Control de telemetría, monitoreo en tiempo real y gestión de alarmas automáticas.',
    duration: '10:05',
    videoUrl: 'https://images.unsplash.com/photo-1508215885820-4585e5610928?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    content: [
      { subtitle: 'Monitoreo en Mapa', text: 'Visualiza la posición real de cada vehículo de la flota. El panel muestra indicadores de velocidad, el rumbo y si se encuentra con la ignición encendida.' },
      { subtitle: 'Malla de Alertas', text: 'Recibe notificaciones críticas en tiempo real sobre excesos de velocidad, eventos de fatiga y somnolencia, desvíos de ruta o aperturas de puertas.' },
    ]
  },
  {
    id: 'soporte_integraciones',
    title: 'Soporte e Integraciones',
    description: 'Mesa de ayuda (Tickets) y conectores con sistemas de terceros.',
    duration: '06:30',
    videoUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    content: [
      { subtitle: 'Mesa de Ayuda', text: 'El sistema permite crear tickets de soporte técnico aislados de manera segura por empresa. Mantenga comunicación continua con el agente de soporte técnico a través del flujo de chat.' },
      { subtitle: 'Integradores API', text: 'En el menú Integraciones, agregue conectores externos ingresando un nombre y tipo (ej. FLEETSAT GPS, SAP, CRM). Una vez creado el registro, utilice el panel de configuración para ingresar la URL del API y la clave de acceso.' },
    ]
  }
];

export default function ManualUso() {
  const [activeModule, setActiveModule] = useState(MODULES[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModules = MODULES.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMod = MODULES.find(m => m.id === activeModule) || MODULES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-600 dark:bg-indigo-700 rounded-3xl p-8 sm:p-10 text-white shadow-lg relative overflow-hidden gap-6">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-black mb-3 text-white tracking-tight">Manual de Usuario</h1>
          <p className="text-indigo-100/90 text-lg sm:text-xl font-medium leading-relaxed">
            Domina todas las funcionalidades de la plataforma. Explora nuestras videoguías y la documentación paso a paso de cada módulo.
          </p>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 flex items-center justify-center opacity-20 pointer-events-none">
          <BookOpen className="w-64 h-64 text-white transform -rotate-12 translate-x-12" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar tema..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-slate-100 placeholder:font-medium shadow-sm text-slate-700"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm uppercase tracking-widest">
                <Menu className="w-4 h-4" />
                Índice
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredModules.map((mod) => (
                <button 
                  key={mod.id}
                  onClick={() => setActiveModule(mod.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center ${activeModule === mod.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                >
                  <div className="flex-1 pr-4">
                    <span className={`block font-bold text-sm mb-0.5 transition-colors ${activeModule === mod.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{mod.title}</span>
                    <span className="block text-[11px] font-medium text-slate-400 dark:text-slate-500 line-clamp-1">{mod.description}</span>
                  </div>
                  <ChevronRight className={`w-5 h-5 shrink-0 transition-colors ${activeModule === mod.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`} />
                </button>
              ))}
              {filteredModules.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-sm font-medium">
                  No se encontraron resultados.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50">
                <MonitorPlay className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
                  {currentMod.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                  {currentMod.description}
                </p>
              </div>
            </div>

            {/* Video Player Mock */}
            <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden group mb-10 shadow-lg border border-slate-200 dark:border-slate-800">
              <img 
                src={currentMod.videoUrl} 
                alt={`Video de ${currentMod.title}`} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
              
              <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-20 h-20 bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md rounded-full flex items-center justify-center transition-all transform group-hover:scale-110 shadow-xl border-4 border-white/20">
                <PlayCircle className="w-10 h-10 text-white ml-1" />
              </button>
              
              <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                <div>
                   <span className="bg-indigo-600 text-white text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded mb-2 inline-block">Videotutorial</span>
                   <h3 className="text-white font-bold text-lg drop-shadow-md">Vista General del Panel</h3>
                </div>
                <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold font-mono tracking-wider shadow-sm border border-white/10">
                  {currentMod.duration}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
                <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                Guía Paso a Paso
              </h3>
              
              <div className="space-y-4">
                {currentMod.content.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="mt-0.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">{item.subtitle}</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600 dark:border-indigo-500 p-5 rounded-r-xl mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <h5 className="font-black text-indigo-900 dark:text-indigo-100 mb-1">¿Necesitas más ayuda?</h5>
                  <p className="text-sm text-indigo-800/80 dark:text-indigo-300 font-medium leading-relaxed">
                    Si te encuentras con problemas o tienes consultas adicionales, el equipo de soporte está disponible.
                  </p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold whitespace-nowrap shadow-sm">
                  Abrir Ticket de Soporte
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

