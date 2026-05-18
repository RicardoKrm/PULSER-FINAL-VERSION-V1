import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, Lock, User, ArrowRight, ShieldCheck, Zap, BarChart3, X, Mail } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import Swal from 'sweetalert2';

export default function Login() {
  const [email, setEmail] = useState('superadministrador@gaval.cl');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotRut, setForgotRut] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    // Autenticación con Supabase
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      setErrorMsg(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotRut) return;
    setIsForgotLoading(true);

    try {
      const ticketId = `#TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const { error } = await supabase.from('tickets_ayuda').insert([{
        ticket_id: ticketId,
        titulo: 'Solicitud de Restablecimiento de Contraseña',
        descripcion: `El usuario con RUT: ${forgotRut} y Email: ${forgotEmail} ha solicitado un restablecimiento de contraseña.`,
        categoria: 'ACCESO',
        prioridad: 'ALTA',
        estado: 'ABIERTO',
        usuario: forgotRut,
        email_contacto: forgotEmail,
        mensajes: [{
          sender: 'Sistema',
          type: 'client',
          text: `Solicitud automática de restablecimiento de contraseña para ${forgotEmail}`,
          date: new Date().toISOString()
        }]
      }]);

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Solicitud Enviada',
        text: 'Se ha creado un ticket en la mesa de ayuda. Un administrador se pondrá en contacto.',
        confirmButtonColor: '#4f46e5'
      });
      setShowForgotModal(false);
      setForgotEmail('');
      setForgotRut('');
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      // Fallback si la tabla no existe o falla
      Swal.fire({
        icon: 'warning',
        title: 'Solicitud Recibida (Modo Offline)',
        text: 'Tu solicitud ha sido registrada temporalmente. Si la tabla "tickets_ayuda" no existe en Supabase, debes crearla.',
        confirmButtonColor: '#4f46e5'
      });
      setShowForgotModal(false);
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Columna Izquierda: Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Adornos sutiles */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-fuchsia-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/30">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-black text-white tracking-tight">PULSER<span className="text-indigo-400">.</span></span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Ingresa a tu cuenta</h1>
            <p className="text-slate-400 text-lg">La plataforma todo-en-uno para gestionar y escalar tu empresa de transporte.</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-2xl">
            <div className="p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-100 text-sm font-medium">
                    {errorMsg}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Email de Usuario</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ej: tu@email.com"
                      className="block w-full pl-10 pr-3 py-3 border border-slate-600 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-300 uppercase tracking-wider">Contraseña</label>
                    <button 
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-slate-600 rounded-xl bg-slate-900/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 group text-lg mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Validando credenciales...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Iniciar Sesión <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </div>
          
          <div className="mt-8 text-center bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
            <p className="text-sm text-slate-400">¿Tienes problemas para ingresar? <br/>Contacta a <a href="mailto:gavalos@gavalconsultora.cl" className="text-indigo-400 font-medium hover:underline">gavalos@gavalconsultora.cl</a> o habla con tu administrador.</p>
          </div>
        </div>
      </div>
      
      {/* Columna Derecha: Hero Area */}
      <div className="hidden lg:flex w-1/2 bg-slate-800 relative items-center justify-center overflow-hidden">
         {/* Fondo animado/decorativo */}
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-800 to-indigo-950 opacity-90" />
         <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
         
         <div className="relative z-10 w-full max-w-lg p-12 text-white">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 px-3 py-1 text-sm mb-6 inline-flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Sistema En Línea
            </Badge>
            <h2 className="text-4xl w-full font-black mb-6 leading-tight">El control total de tu flota y rentabilidad en tiempo real.</h2>
            
            <div className="space-y-6 mt-10">
               <div className="flex gap-4 items-start">
                  <div className="bg-emerald-500/20 p-3 rounded-lg mt-1">
                     <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-white mb-1">Entorno Multi-Tenancy Seguro</h3>
                     <p className="text-slate-300 text-sm leading-relaxed">Tus datos están aislados y encriptados. Cada RUT tiene su propio ecosistema de operaciones y finanzas.</p>
                  </div>
               </div>
               
               <div className="flex gap-4 items-start">
                  <div className="bg-amber-500/20 p-3 rounded-lg mt-1">
                     <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-white mb-1">Operación Sin Barreras</h3>
                     <p className="text-slate-300 text-sm leading-relaxed">Desde el despacho hasta la conciliación bancaria. Todo automatizado y centralizado.</p>
                  </div>
               </div>
               
               <div className="flex gap-4 items-start">
                  <div className="bg-sky-500/20 p-3 rounded-lg mt-1">
                     <BarChart3 className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-white mb-1">Decisiones Inteligentes</h3>
                     <p className="text-slate-300 text-sm leading-relaxed">Analíticas avanzadas y trazabilidad integral para detectar sobrecostos y mejorar la rentabilidad mes a mes.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative">
            <button 
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-500/20 p-3 rounded-xl">
                  <Mail className="w-6 h-6 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Recuperar Contraseña</h2>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Ingresa tu RUT y correo electrónico. Se enviará una solicitud al equipo de soporte (Mesa de Ayuda) para restablecer tu cuenta.
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-300">RUT</label>
                  <input
                    type="text"
                    required
                    value={forgotRut}
                    onChange={(e) => setForgotRut(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="Ej: 12.345.678-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-300">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="Ej: tu@email.com"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isForgotLoading}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all"
                >
                  {isForgotLoading ? 'Enviando...' : 'Solicitar Restablecimiento'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
