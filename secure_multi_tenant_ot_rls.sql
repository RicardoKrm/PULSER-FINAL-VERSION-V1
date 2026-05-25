-- =========================================================================
-- SCRIPT DE SEGURIDAD MULTI-TENANCY ESTRICTO PARA ÓRDENES DE TRABAJO (OTs)
-- Ejecuta este script en el editor SQL de tu panel de Supabase
-- =========================================================================

-- 1. Añadimos de forma segura la columna 'empresa_id' a la tabla de Órdenes de Trabajo si no existe.
ALTER TABLE public.orden_de_trabajo 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE;

-- 2. (Opcional pero muy recomendado si ya tienes OTs guardadas)
-- Actualizar las OTs existentes para que tomen el empresa_id de su vehículo
UPDATE public.orden_de_trabajo ot
SET empresa_id = v.empresa_id
FROM public.vehiculo v
WHERE ot.vehiculo_id = v.id;

-- 3. Aseguramos que Row Level Security (RLS) esté habilitado.
ALTER TABLE public.orden_de_trabajo ENABLE ROW LEVEL SECURITY;

-- 4. Limpiamos políticas antiguas y creamos la política definitiva de alto rendimiento.
DROP POLICY IF EXISTS "Users can access orden_de_trabajo of their company" ON public.orden_de_trabajo;

CREATE POLICY "Users can access orden_de_trabajo of their company" ON public.orden_de_trabajo 
FOR ALL USING (
    public.is_super_admin() OR 
    empresa_id = (SELECT ua.empresa_id FROM public.usuario_aplicacion ua WHERE ua.auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    public.is_super_admin() OR 
    empresa_id = (SELECT ua.empresa_id FROM public.usuario_aplicacion ua WHERE ua.auth_user_id = auth.uid() LIMIT 1)
);

-- =========================================================================
-- SEGURIDAD PARA ASIGNACIONES DE MECÁNICOS A OTs
-- =========================================================================

-- Aseguramos que la tabla de asignaciones tenga empresa_id Directo
ALTER TABLE public.asignacion_ot_mecanico 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE;

-- (Opcional) Migración para sincronizar asignaciones viejas
UPDATE public.asignacion_ot_mecanico a
SET empresa_id = ot.empresa_id
FROM public.orden_de_trabajo ot
WHERE a.orden_id = ot.id;

ALTER TABLE public.asignacion_ot_mecanico ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can access asignacion_ot_mecanico of their company" ON public.asignacion_ot_mecanico;

CREATE POLICY "Users can access asignacion_ot_mecanico of their company" ON public.asignacion_ot_mecanico 
FOR ALL USING (
    public.is_super_admin() OR 
    empresa_id = (SELECT ua.empresa_id FROM public.usuario_aplicacion ua WHERE ua.auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    public.is_super_admin() OR 
    empresa_id = (SELECT ua.empresa_id FROM public.usuario_aplicacion ua WHERE ua.auth_user_id = auth.uid() LIMIT 1)
);
