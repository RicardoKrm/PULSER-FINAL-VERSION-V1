-- ====================================================================
-- CONFIGURACIÓN DE SEGURIDAD A NIVEL DE FILA (RLS) PARA SOLICITUDES DE COMPRA
-- ====================================================================
-- Este script habilita RLS en la tabla 'compras_solicitudes' y crea una 
-- política unificada para que todos los usuarios pertenecientes a la misma 
-- empresa puedan ver, crear, actualizar y eliminar las solicitudes de compra.
--
-- INSTRUCCIONES:
-- Copia y ejecuta este script en el editor SQL de tu panel de Supabase.
-- ====================================================================

-- 1. Asegurar que RLS esté activo en la tabla de solicitudes
ALTER TABLE public.compras_solicitudes ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar cualquier política restrictiva o genérica anterior
DROP POLICY IF EXISTS "Users can access compras_solicitudes of their company" ON public.compras_solicitudes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.compras_solicitudes;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.compras_solicitudes;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.compras_solicitudes;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.compras_solicitudes;

-- 3. Crear política unificada para permitir acceso completo (lectura/escritura)
-- a los usuarios pertenecientes a la misma empresa (empresa_id) o con rol Super Admin,
-- incluyendo soporte para la empresa Demo ('emp-001').
CREATE POLICY "Users can access compras_solicitudes of their company" ON public.compras_solicitudes
FOR ALL
USING (
    public.is_super_admin() OR 
    empresa_id = 'emp-001' OR -- Soporte para cuentas Demo/fallback
    empresa_id::text IN (
        SELECT empresa_id::text 
        FROM public.usuario_aplicacion 
        WHERE auth_user_id = auth.uid()
    )
)
WITH CHECK (
    public.is_super_admin() OR 
    empresa_id = 'emp-001' OR -- Soporte para cuentas Demo/fallback
    empresa_id::text IN (
        SELECT empresa_id::text 
        FROM public.usuario_aplicacion 
        WHERE auth_user_id = auth.uid()
    )
);

-- 4. Recargar el caché de PostgREST para asegurar que los cambios se apliquen de inmediato
NOTIFY pgrst, 'reload schema';
