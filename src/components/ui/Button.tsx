import React from 'react';

export function Button({ className, variant = 'default', size = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'danger', size?: 'default' | 'sm' | 'icon' }) {
  const baseStyled = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-transparent';
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm dark:bg-blue-600 dark:hover:bg-blue-700',
    outline: 'border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
  };
  const sizes = {
    default: 'h-10 py-2 px-4 text-sm',
    sm: 'h-9 px-3 rounded-md text-xs',
    icon: 'h-10 w-10 shrink-0',
  };
  
  return (
    <button className={`${baseStyled} ${variants[variant]} ${sizes[size]} ${className || ''}`} {...props} />
  );
}
