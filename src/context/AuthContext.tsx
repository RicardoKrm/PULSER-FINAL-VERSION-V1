import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, logActividad } from '../lib/supabase';

interface AuthProfile {
  id: string;
  auth_user_id: string;
  empresa_id: string;
  rol_id: string;
  nombre: string;
  rut: string;
  email: string;
  estado: string;
  cargo?: string;
  cambio_clave_pendiente?: boolean;
  rol?: {
    nombre: string;
    tipo: string;
    permisos: any;
  };
  empresa?: {
    nombre: string;
    rut: string;
  };
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  signOut: async () => {},
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string, email?: string) => {
    try {
      let query = supabase
        .from('usuario_aplicacion')
        .select(`
          *,
          rol:rol_id(nombre, tipo, permisos),
          empresa:empresa_id(nombre, rut)
        `);

      if (email) {
        query = query.or(`auth_user_id.eq.${userId},email.eq.${email}`);
      } else {
        query = query.eq('auth_user_id', userId);
      }

      const { data, error } = await query.limit(1).single();
        
      if (error && error.code !== 'PGRST116') throw error;
      if (data) setProfile(data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

  useEffect(() => {
    // Obtener sesión activa al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user?.id) {
        loadProfile(session.user.id, session.user.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user?.id) {
        // Do not set loading to true to prevent unmounting entire application on token refreshes/window focus.
        loadProfile(session.user.id, session.user.email).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (profile) {
      try {
        await logActividad(
          'Acceso', 
          'Cerró Sesión', 
          `Usuario ${profile.nombre || 'Desconocido'} cerró su sesión de manera voluntaria.`, 
          profile.empresa_id, 
          profile.id
        );
      } catch (le) {
        console.warn(le);
      }
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
