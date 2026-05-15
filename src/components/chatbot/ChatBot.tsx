import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: '¡Hola! Soy tu asistente asistente virtual de PULSER TMS. ¿En qué te puedo ayudar hoy con el sistema?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputMessage('');
    setIsTyping(true);

    const contextData = {
      flota: [
        { id: 1, numeroInterno: '1', patente: 'SXDR14', marca: 'M. BENZ', modelo: 'SPRINTER VS30.2', estado: 'VENCIDO', kmActual: 153304 },
        { id: 2, numeroInterno: '2', patente: 'JPHK19', marca: 'HYUNDAI', modelo: 'NEW H1', estado: 'NORMAL', kmActual: 212361 },
        { id: 3, numeroInterno: '3', patente: 'RCKY25', marca: 'M. BENZ', modelo: 'SPRINTER VS30.2', estado: 'NORMAL', kmActual: 156752 },
        { id: 4, numeroInterno: '4', patente: 'SVJC32', marca: 'M. BENZ', modelo: 'SPRINTER VS30.1', estado: 'NORMAL', kmActual: 125088 },
        { id: 5, numeroInterno: '5', patente: 'KHLW39', marca: 'M. BENZ', modelo: 'SPRINTER NCV3', estado: 'NORMAL', kmActual: 434431 },
        { id: 6, numeroInterno: '6', patente: 'TDJD43', marca: 'M. BENZ', modelo: 'SPRINTER VS30.1', estado: 'NORMAL', kmActual: 162776 },
        { id: 7, numeroInterno: '7', patente: 'SBWF44', marca: 'M. BENZ', modelo: 'SPRINTER VS30.1', estado: 'VENCIDO', kmActual: 265131 },
        { id: 8, numeroInterno: '8', patente: 'TCLR44', marca: 'M. BENZ', modelo: 'SPRINTER VS30.1', estado: 'NORMAL', kmActual: 132338 },
        { id: 9, numeroInterno: '9', patente: 'PRYL49', marca: 'HYUNDAI', modelo: 'NEW H1', estado: 'NORMAL', kmActual: 153639 },
        { id: 10, numeroInterno: '10', patente: 'CKHB56', marca: 'HYUNDAI', modelo: 'NEW H1', estado: 'NORMAL', kmActual: 454911 },
        { id: 11, numeroInterno: '11', patente: 'LYRK58', marca: 'M. BENZ', modelo: 'SPRINTER VS30.1', estado: 'NORMAL', kmActual: 401177 },
        { id: 12, numeroInterno: '12', patente: 'TLRV62', marca: 'TOYOTA', modelo: 'HILUX', estado: 'NORMAL', kmActual: 32397 },
        { id: 13, numeroInterno: '13', patente: 'JHRF63', marca: 'M. BENZ', modelo: 'SPRINTER NCV3', estado: 'VENCIDO', kmActual: 495150 },
        { id: 14, numeroInterno: '14', patente: 'TTJJ65', marca: 'M. BENZ', modelo: 'SPRINTER VS30.1', estado: 'NORMAL', kmActual: 97135 },
        { id: 15, numeroInterno: '15', patente: 'RWVS65', marca: 'MAXUS', modelo: 'T60', estado: 'NORMAL', kmActual: 75522 },
        { id: 16, numeroInterno: '16', patente: 'VBWH79', marca: 'DODGE', modelo: 'RAM 700', estado: 'NORMAL', kmActual: 5522 },
        { id: 17, numeroInterno: '17', patente: 'JBHF86', marca: 'HYUNDAI', modelo: 'NEW H1', estado: 'NORMAL', kmActual: 298305 },
        { id: 18, numeroInterno: '18', patente: 'KRTC90', marca: 'HYUNDAI', modelo: 'H 350 SOLATI', estado: 'NORMAL', kmActual: 428454 },
        { id: 19, numeroInterno: '19', patente: 'SZLB99', marca: 'HYUNDAI', modelo: 'NEW H1', estado: 'NORMAL', kmActual: 55109 },
        { id: 20, numeroInterno: '20', patente: 'VPWC18', marca: 'M. BENZ', modelo: 'SPRINTER VS30.2', estado: 'NORMAL', kmActual: 0 },
        { id: 21, numeroInterno: '21', patente: 'VSBL78', marca: 'M. BENZ', modelo: 'SPRINTER VS30.2', estado: 'NORMAL', kmActual: 0 },
        { id: 22, numeroInterno: '22', patente: 'VVGT88', marca: 'Genérica', modelo: 'Modelo 22', estado: 'NORMAL', kmActual: 11033 }
      ],
      ots: [
        { folio: 'OT-0245', tipo: 'Preventiva', prioridad: 'Media', estado: 'Finalizada', costo: 401503.37 },
        { folio: 'OT-0232', tipo: 'Correctiva', prioridad: 'Media', estado: 'Finalizada', costo: 751253.0 },
        { folio: 'OT-0205', tipo: 'Preventiva', prioridad: 'Media', estado: 'Finalizada', costo: 586121.52 },
        { folio: 'OT-0186', tipo: 'Correctiva', prioridad: 'Media', estado: 'Finalizada', costo: 241000.0 },
        { folio: 'OT-0183', tipo: 'Correctiva', prioridad: 'Alta', estado: 'Finalizada', costo: 332771.0 },
        { folio: 'OT-0165', tipo: 'Preventiva', prioridad: 'Media', estado: 'Finalizada', costo: 717895.32 },
        { folio: 'OT-0158', tipo: 'Preventiva', prioridad: 'Media', estado: 'Finalizada', costo: 220000.0 },
        { folio: 'OT-0156', tipo: 'Evaluativa', prioridad: 'Media', estado: 'Finalizada', costo: 220000.0 },
        { folio: 'OT-0155', tipo: 'Correctiva', prioridad: 'Media', estado: 'Finalizada', costo: 154000.0 }
      ],
      kpis: {
        nivelCumplimiento: 86.36,
        costoTotal: 12500000,
        vehiculosVencidos: 3
      }
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          context: contextData
        }),
      });

      if (!response.ok) {
        throw new Error('Error en el servidor');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'Ocurrió un error al contactar al servidor. Intenta de nuevo más tarde.' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 transition-all duration-300 z-50 flex items-center justify-center",
          isOpen ? "opacity-0 pointer-events-none translate-y-4" : "opacity-100 translate-y-0"
        )}
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
        style={{ height: '500px', maxHeight: 'calc(100vh - 48px)' }}
      >
        {/* Header */}
        <div className="bg-blue-600 p-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">PULSER IA</h3>
              <p className="text-blue-100 text-[10px]">Asistente Virtual</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={cn(
                "flex w-full",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div 
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                  message.role === 'user' 
                    ? "bg-blue-600 text-white rounded-br-sm" 
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm rounded-bl-sm"
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex w-full justify-start">
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Pregunta sobre la flota..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="absolute right-1 p-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 rounded-full text-white transition-colors flex flex-center items-center justify-center"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
