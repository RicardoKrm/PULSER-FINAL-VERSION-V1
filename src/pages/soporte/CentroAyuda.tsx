import React from 'react';
import { Search, Plus, MessageSquare, Clock, CheckCircle2, AlertTriangle, PhoneCall, Filter, ChevronDown, BookOpen } from 'lucide-react';

const TICKETS = [
  {
    id: '#TKT-1024',
    title: 'Error al sincronizar GPS',
    description: 'El kilometraje del vehículo 101 no se actualiza desde ayer.',
    status: 'ABIERTO',
    priority: 'ALTA',
    category: 'GPS',
    user: 'Juan Perez',
    date: '2023-10-30 09:15',
  },
  {
    id: '#TKT-1022',
    title: 'Solicitud acceso nuevo mecánico',
    description: 'Crear usuario para Roberto Gomez.',
    status: 'EN PROCESO',
    priority: 'MEDIA',
    category: 'SOLICITUD ACCESO',
    user: 'Maria Vega',
    date: '2023-10-29 10:00',
  },
  {
    id: '#TKT-1015',
    title: 'App móvil se cierra sola',
    description: 'Al intentar subir fotos en la OT, la app crashea.',
    status: 'RESUELTO',
    priority: 'CRITICA',
    category: 'FALLA APP',
    user: 'Carlos Ruiz',
    date: '2023-10-26 16:45',
  },
];

const FAQS = [
  '¿Cómo restablecer mi contraseña?',
  '¿Por qué no veo la ubicación en tiempo real?',
  '¿Cómo cerrar una Orden de Trabajo?',
  '¿Cómo solicito un repuesto nuevo?',
];

export default function CentroAyuda() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ABIERTO': return 'bg-emerald-100 text-emerald-700';
      case 'EN PROCESO': return 'bg-blue-100 text-blue-700';
      case 'RESUELTO': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ALTA': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'MEDIA': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'CRITICA': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Centro de Ayuda</h1>
          <p className="text-slate-500 mt-1">Gestiona incidencias y revisa la base de conocimientos.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Nuevo Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-sm font-semibold text-slate-500">Tickets Abiertos</span>
            <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">1</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-sm font-semibold text-slate-500">En Proceso</span>
            <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">1</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-sm font-semibold text-slate-500">Resueltos (Mes)</span>
            <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">1</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
            {['TODOS', 'ABIERTO', 'EN PROCESO', 'RESUELTO'].map((tab) => (
              <button 
                key={tab} 
                className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${tab === 'TODOS' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {TICKETS.map((ticket) => (
              <div key={ticket.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">{ticket.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                  </div>
                  <span className="text-xs text-slate-500">{ticket.date}</span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{ticket.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{ticket.description}</p>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">{ticket.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                      <span className="text-[10px] font-bold text-slate-500">{ticket.user.charAt(0)}</span>
                    </div>
                    <span>{ticket.user}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Base de Conocimientos
            </h3>
            <div className="space-y-2">
              {FAQS.map((faq, index) => (
                <button key={index} className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50 flex justify-between items-center transition-colors group">
                  <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{faq}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
                </button>
              ))}
            </div>
            <button className="w-full text-center mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-700">
              Ver todas las preguntas frecuentes
            </button>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-5 text-white shadow-md">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              ¿Necesitas ayuda urgente?
            </h3>
            <p className="text-indigo-100 text-sm mb-6">Nuestro equipo de soporte está disponible 24/7 para incidencias críticas de operación.</p>
            <div className="bg-white/10 rounded-lg p-3 flex items-center gap-3 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">Línea Directa</div>
                <div className="font-mono font-bold text-lg">+56 2 2999 9999</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
