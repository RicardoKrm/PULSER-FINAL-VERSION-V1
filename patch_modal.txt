import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
}

export function Modal({ isOpen, onClose, title, children, fullWidth, size = '3xl' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClass = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full m-4',
  }[size] || 'max-w-3xl';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <Card className={`w-full ${sizeClass} max-h-[90vh] overflow-y-auto shadow-2xl m-4 border-0 dark:border dark:border-slate-800`}>
        <CardHeader className="flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10 border-b dark:border-slate-800">
            <CardTitle className="text-gray-900 dark:text-white">{title}</CardTitle>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
               <X className="w-5 h-5" />
            </button>
        </CardHeader>
        <CardContent className="text-gray-800 dark:text-slate-200">{children}</CardContent>
      </Card>
    </div>
  );
}
