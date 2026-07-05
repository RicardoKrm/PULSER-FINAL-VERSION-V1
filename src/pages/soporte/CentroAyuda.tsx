import React, { useState, useEffect } from 'react';
import { Search, Plus, MessageSquare, Clock, CheckCircle2, Ticket, Filter, Building2, User, Send, X, AlertTriangle, Key } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import Swal from 'sweetalert2';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../context/AuthContext';

export default function CentroAyuda() {
  const { currentCompany } = useCompany();
  const { profile } = useAuth();
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('TODOS');
  const [selectedEmpresa, setSelectedEmpresa] = useState('Todas');
  const [empresasList, setEmpresasList] = useState<string[]>(['Todas']);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'MEDIA', category: 'FALLA TÉCNICA' });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets_ayuda')
        .select('*')
        .order('fecha_creacion', { ascending: false });
        
      if (error) throw error;
      
      setTickets(data || []);
      
      // Extraer empresas unicas para el filtro
      const uniqueEmpresas = Array.from(new Set((data || []).map(t => t.empresa).filter(Boolean)));
      setEmpresasList(['Todas', ...uniqueEmpresas]);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ABIERTO': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
      case 'EN PROCESO': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'RESUELTO': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ALTA': 
      case 'CRITICA': 
        return 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400';
      case 'MEDIA': return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400';
      default: return 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400';
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchSearch = (t.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) || (t.ticket_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = selectedStatus === 'TODOS' || t.estado === selectedStatus;
    const matchEmpresa = selectedEmpresa === 'Todas' || t.empresa === selectedEmpresa;
    return matchSearch && matchStatus && matchEmpresa;
  });

  const handleOpenTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    
    const newMessages = [
      ...(selectedTicket.mensajes || []),
      { sender: profile?.nombre || 'Soporte Admin', type: 'agent', text: replyMessage, date: new Date().toISOString() }
    ];
    
    const newStatus = selectedTicket.estado === 'ABIERTO' ? 'EN PROCESO' : selectedTicket.estado;

    try {
      const { error } = await supabase.from('tickets_ayuda').update({
        mensajes: newMessages,
        estado: newStatus
      }).eq('id', selectedTicket.id);

      if (error) throw error;

      const updatedTicket = {
        ...selectedTicket,
        mensajes: newMessages,
        estado: newStatus
      };

      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      setReplyMessage('');
      
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success', title: 'Respuesta enviada', showConfirmButton: false, timer: 1500
      });
    } catch (e: any) {
      console.error(e);
      Swal.fire('Error', 'No se pudo enviar la respuesta', 'error');
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    
    const confirm = await Swal.fire({
      title: '¿Resolver ticket?',
      text: '¿Estás seguro de que deseas marcar este ticket como resuelto? Esta acción cerrará el caso.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, resolver',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      const { error } = await supabase.from('tickets_ayuda').update({
        estado: 'RESUELTO'
      }).eq('id', selectedTicket.id);

      if (error) throw error;

      const updatedTicket = { ...selectedTicket, estado: 'RESUELTO' };
      setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      setSelectedTicket(updatedTicket);
      Swal.fire('Ticket Resuelto', 'El ticket ha sido marcado como resuelto.', 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo resolver el ticket', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedTicket || !selectedTicket.email_contacto) {
      Swal.fire('Error', 'Este ticket no tiene un email de contacto asociado.', 'error');
      return;
    }

    const { value: newPassword } = await Swal.fire({
      title: 'Restablecer Contraseña',
      text: `¿Estás seguro de cambiar la clave del usuario ${selectedTicket.email_contacto}? Ingresa la nueva clave temporal:`,
      icon: 'warning',
      input: 'text',
      inputPlaceholder: 'Ej: Temporal2026',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value || value.length < 6) {
          return 'La contraseña debe tener al menos 6 caracteres';
        }
      }
    });

    if (newPassword) {
      try {
        // 1. Find user by email in usuario_aplicacion
        const { data: userData, error: userError } = await supabase
          .from('usuario_aplicacion')
          .select('auth_user_id')
          .eq('email', selectedTicket.email_contacto)
          .single();

        if (userError || !userData?.auth_user_id) {
           throw new Error('No se encontró el usuario en la base de datos (verifique que el email coincida).');
        }

        // 2. Call the backend to reset the password securely using service_role
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userData.auth_user_id, newPassword })
        });

        const result = await response.json();
        
        if (!response.ok) {
           throw new Error(result.error || 'Error al actualizar la contraseña');
        }

        Swal.fire('Contraseña Actualizada', 'La contraseña temporal ha sido configurada correctamente.', 'success');
        
        // Auto-reply ticket with the new password
        setReplyMessage(`Hola, hemos restablecido tu contraseña.\n\nTu nueva clave temporal es: ${newPassword}\n\nTe recomendamos cambiarla en cuanto inicies sesión nuevamente.`);
      } catch (err: any) {
        console.error(err);
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.title || !newTicket.description) {
      Swal.fire('Error', 'Debe completar el título y la descripción.', 'error');
      return;
    }

    const { data: empresaData } = await supabase.from('empresa').select('nombre').eq('id', currentCompany?.id).single();
    const empresaNombre = currentCompany?.id ? (empresaData?.nombre || 'Mi Empresa') : (selectedEmpresa !== 'Todas' ? selectedEmpresa : 'Soporte Interno');

    const created = {
      ticket_id: `#TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      titulo: newTicket.title,
      descripcion: newTicket.description,
      estado: 'ABIERTO',
      prioridad: newTicket.priority,
      categoria: newTicket.category,
      usuario: profile?.nombre || 'Usuario Interno',
      email_contacto: profile?.email || '',
      empresa: empresaNombre,
      mensajes: [
        { sender: profile?.nombre || 'Usuario', type: 'client', text: newTicket.description, date: new Date().toISOString() }
      ]
    };

    try {
      const { data, error } = await supabase.from('tickets_ayuda').insert([created]).select().single();
      if (error) throw error;

      setTickets([data, ...tickets]);
      // Update filters just in case we created a new distinct company
      if (!empresasList.includes(empresaNombre)) {
         setEmpresasList([...empresasList, empresaNombre]);
      }

      setIsNewTicketModalOpen(false);
      setNewTicket({ title: '', description: '', priority: 'MEDIA', category: 'FALLA TÉCNICA' });
      Swal.fire('Creado', 'El ticket ha sido ingresado al sistema.', 'success');
    } catch (e) {
       console.error(e);
       Swal.fire('Error', 'No se pudo crear el ticket', 'error');
    }
  };

  const openTicketsCount = tickets.filter(t => t.estado === 'ABIERTO').length;
  const inProgressCount = tickets.filter(t => t.estado === 'EN PROCESO').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Mesa de Ayuda (Help Desk)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gestión de solicitudes y soporte a clientes. Entorno aislado por empresa.
          </p>
        </div>
        <Button onClick={() => setIsNewTicketModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6 rounded-xl flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Crear Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-black tracking-widest uppercase text-slate-500 dark:text-slate-400">Total Tickets</span>
            <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{tickets.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
            <Ticket className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-black tracking-widest uppercase text-rose-500">Pendientes (Abiertos)</span>
            <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{openTicketsCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-black tracking-widest uppercase text-amber-500">En Atención</span>
            <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{inProgressCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-black tracking-widest uppercase text-emerald-500">Resueltos</span>
            <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{tickets.length - openTicketsCount - inProgressCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por #ticket o asunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all shadow-sm"
          />
        </div>
        <div className="flex flex-col md:flex-row bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-sm overflow-hidden shrink-0">
          <div className="px-3 py-2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
               value={selectedStatus} 
               onChange={(e) => setSelectedStatus(e.target.value)} 
               className="bg-transparent font-bold outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ABIERTO">Abiertos</option>
              <option value="EN PROCESO">En Proceso</option>
              <option value="RESUELTO">Resueltos</option>
            </select>
          </div>
          <div className="px-3 py-2 flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <select 
               value={selectedEmpresa} 
               onChange={(e) => setSelectedEmpresa(e.target.value)} 
               className="bg-transparent font-bold outline-none text-indigo-700 dark:text-indigo-400 max-w-[200px] truncate block"
            >
              {empresasList.map(emp => <option key={emp} value={emp}>{emp === 'Todas' ? 'Todas las Empresas (Vista Admin)' : emp}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {filteredTickets.map((ticket) => (
            <li key={ticket.id} onClick={() => handleOpenTicket(ticket)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors p-4 sm:p-5 cursor-pointer group">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1.5">
                    <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{ticket.ticket_id}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${getStatusColor(ticket.estado)}`}>{ticket.estado}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${getPriorityColor(ticket.prioridad)}`}>{ticket.prioridad}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {ticket.titulo}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold">{ticket.empresa}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{ticket.usuario}</span>
                    </div>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4" />
                    {new Date(ticket.fecha_creacion).toLocaleDateString('es-CL')}
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2 sm:mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Ver detalle &rarr;</span>
                </div>
              </div>
            </li>
          ))}
          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
               <Ticket className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No hay tickets</h3>
               <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">No se encontraron solicitudes con los filtros aplicados.</p>
            </div>
          )}
        </ul>
      </div>

      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Detalle: ${selectedTicket?.ticket_id}`} size="lg">
        {selectedTicket && (
          <div className="flex flex-col h-[70vh] max-h-[700px]">
            <div className="shrink-0 bg-slate-50 dark:bg-slate-800/80 rounded-xl p-5 mb-4 border border-slate-200 dark:border-slate-700">
               <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {selectedTicket.titulo}
                  </h3>
               </div>
               <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="font-bold">{selectedTicket.empresa}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium">{selectedTicket.usuario}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${getStatusColor(selectedTicket.estado)}`}>{selectedTicket.estado}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${getPriorityColor(selectedTicket.prioridad)}`}>{selectedTicket.prioridad}</span>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 custom-scrollbar">
               {selectedTicket.mensajes?.map((msg: any, i: number) => (
                  <div key={i} className={`flex ${msg.type === 'agent' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] rounded-2xl p-4 ${
                         msg.type === 'agent' 
                         ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' 
                         : 'bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                       }`}
                     >
                        <div className="flex items-center justify-between gap-4 mb-2">
                           <span className={`text-xs font-bold ${msg.type === 'agent' ? 'text-indigo-100' : 'text-slate-500'}`}>{msg.sender}</span>
                           <span className={`text-[10px] font-medium ${msg.type === 'agent' ? 'text-indigo-200' : 'text-slate-400'}`}>
                             {new Date(msg.date).toLocaleDateString('es-CL')} {new Date(msg.date).toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}
                           </span>
                        </div>
                        <p className={`text-sm whitespace-pre-wrap leading-relaxed ${msg.type === 'agent' ? 'text-indigo-50' : 'text-slate-600 dark:text-slate-400'}`}>{msg.text}</p>
                     </div>
                  </div>
               ))}
            </div>

            {selectedTicket.estado !== 'RESUELTO' ? (
              <div className="shrink-0 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex gap-3">
                  <textarea 
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Escriba su respuesta aquí..."
                    className="flex-1 min-h-[80px] p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-y dark:text-white"
                  />
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button onClick={handleSendReply} disabled={!replyMessage.trim()} className="h-full flex items-center justify-center gap-2 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                      <Send className="w-5 h-5 text-white" />
                      <span className="font-bold text-white">Enviar</span>
                    </Button>
                  </div>
                </div>
                <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 pt-3">
                  <Button variant="outline" onClick={handleResetPassword} className="border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-500 dark:hover:bg-amber-900/30 flex items-center gap-2 shadow-sm font-bold">
                    <Key className="w-4 h-4" />
                    Resetear Contraseña
                  </Button>
                  <Button onClick={handleResolveTicket} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Marcar como Resuelto
                  </Button>
                </div>
              </div>
            ) : (
              <div className="shrink-0 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                 <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-5 h-5" /> Este ticket ha sido resuelto y cerrado.
                 </span>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={isNewTicketModalOpen} onClose={() => setIsNewTicketModalOpen(false)} title="Crear Nuevo Ticket">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Título / Asunto</label>
            <input 
              type="text" 
              value={newTicket.title}
              onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
              className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-slate-100" 
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
             <div className="flex-1">
               <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Categoría</label>
               <select 
                 value={newTicket.category}
                 onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                 className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-slate-100"
               >
                 <option value="FALLA TÉCNICA">Falla Técnica</option>
                 <option value="INTEGRACIÓN">Integración / API</option>
                 <option value="ADMINISTRATIVO">Administrativo</option>
                 <option value="CONSULTA">Consulta General</option>
               </select>
             </div>
             <div className="flex-1">
               <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Prioridad</label>
               <select 
                 value={newTicket.priority}
                 onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                 className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-slate-100"
               >
                 <option value="BAJA">Baja</option>
                 <option value="MEDIA">Media</option>
                 <option value="ALTA">Alta</option>
                 <option value="CRITICA">Crítica</option>
               </select>
             </div>
          </div>
          <div className="pt-2">
            <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Descripción detallada</label>
            <textarea 
              value={newTicket.description}
              onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
              placeholder="Explique el problema de la manera más detallada posible..."
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-slate-100 min-h-[120px]" 
            />
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
             <Button onClick={handleCreateTicket} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6 rounded-xl flex items-center gap-2">
               Enviar Ticket
             </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
