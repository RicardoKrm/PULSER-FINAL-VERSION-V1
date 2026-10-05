import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function usePermissions() {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPermissions = async () => {
      if (!profile) {
        if (isMounted) {
          setPermissions([]);
          setLoading(false);
        }
        return;
      }

      // Base permissions from Role
      const rawPerms = profile.rol?.permisos;
      const basePerms: string[] = Array.isArray(rawPerms) ? rawPerms : [];
      
      // Fetch Cargo permissions
      if (profile.cargo) {
        try {
          const { data } = await supabase
            .from('cargo')
            .select('permisos')
            .eq('nombre', profile.cargo)
            .single();
            
          if (isMounted) {
            const cargoPerms: string[] = Array.isArray(data?.permisos) ? data.permisos : [];
            setPermissions([...new Set([...basePerms, ...cargoPerms])]);
          }
        } catch (error) {
          console.error('Error fetching cargo permissions:', error);
          if (isMounted) setPermissions(basePerms);
        }
      } else {
        if (isMounted) setPermissions(basePerms);
      }
      
      if (isMounted) setLoading(false);
    };

    fetchPermissions();

    return () => {
      isMounted = false;
    };
  }, [profile]);

  const hasPermission = (action: string) => {
    // Súper Administrador / owner overrides configurable permissions
    if (
      profile?.rol?.nombre === 'Súper Administrador' || 
      profile?.rol?.nombre === 'Super Administrador' ||
      (profile?.rol?.permisos && typeof profile.rol.permisos === 'object' && (profile.rol.permisos as any).all)
    ) {
      return true;
    }
    return Array.isArray(permissions) && permissions.includes(action);
  };

  return { permissions, hasPermission, loading };
}
