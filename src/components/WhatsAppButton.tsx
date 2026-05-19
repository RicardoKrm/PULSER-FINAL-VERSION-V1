import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

export function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const phoneNumber = '56982938737';
  const message = 'Hola, tengo dudas sobre el sistema. ¿Me pueden ayudar?';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  useEffect(() => {
    const dismissed = localStorage.getItem('hideWhatsAppButton');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    const checkModals = () => {
      let isModalOverlayActive = false;
      
      const bodyLocked = document.body.hasAttribute('data-scroll-locked') || document.body.style.overflow === 'hidden';
      
      const overlays = document.querySelectorAll('.fixed.inset-0, .fixed.inset-y-0');
      overlays.forEach((el) => {
        const classStr = el.className || '';
        if (typeof classStr === 'string' && classStr.includes('z-')) {
          const zMatch = classStr.match(/z-([0-9]+|\[[0-9]+\])/);
          if (zMatch) {
            const zDec = parseInt(zMatch[1].replace(/[\[\]]/g, ''), 10);
            if (zDec >= 50) isModalOverlayActive = true;
          }
        }
      });

      setIsModalOpen(bodyLocked || isModalOverlayActive);
    };

    const observer = new MutationObserver(checkModals);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['class', 'style', 'data-scroll-locked'] 
    });
    
    checkModals();

    return () => observer.disconnect();
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    localStorage.setItem('hideWhatsAppButton', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 transition-opacity duration-300 ${isModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white px-5 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:shadow-[#25D366]/40 hover:-translate-y-1 transition-all duration-300 group"
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
      <button 
        onClick={handleDismiss}
        className="bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-all"
        title="Ocultar botón de WhatsApp"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
