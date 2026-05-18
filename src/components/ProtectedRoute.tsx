import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    // Redirigir al login si no hay sesión
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
