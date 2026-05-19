import React from 'react';
import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const phoneNumber = '56982938737';
  const message = 'Hola, tengo dudas sobre el sistema. ¿Me pueden ayudar?';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white px-5 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:shadow-[#25D366]/40 hover:-translate-y-1 transition-all duration-300 group"
    >
      <div className="flex flex-col items-end hidden md:flex">
        <span className="text-sm font-bold leading-tight">¿Tienes dudas?</span>
        <span className="text-xs font-medium opacity-90 leading-tight">Hablemos</span>
      </div>
      <div className="relative">
        <MessageCircle fill="currentColor" strokeWidth={0} className="w-6 h-6 animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
      </div>
    </a>
  );
}
