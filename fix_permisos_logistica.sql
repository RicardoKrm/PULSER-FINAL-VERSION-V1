-- Script para reparar los permisos (RLS) de logística
-- Por favor, ejecuta este script en el SQL Editor de Supabase.

-- 1. Eliminar políticas "FOR ALL" conflictivas
DROP POLICY IF EXISTS "Users can access logistica_repuestos of their company" ON public.logistica_repuestos;
DROP POLICY IF EXISTS "Users can access logistica_movimientos of their company" ON public.logistica_movimientos;

-- 2. Crear políticas separadas (SELECT, INSERT, UPDATE, DELETE) para repuestos
CREATE POLICY "logistica_repuestos_select" ON public.logistica_repuestos FOR SELECT USING (
    public.is_super_admin() OR empresa_id IN (SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid())
);

CREATE POLICY "logistica_repuestos_insert" ON public.logistica_repuestos FOR INSERT WITH CHECK (
    public.is_super_admin() OR empresa_id IN (SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid())
);

CREATE POLICY "logistica_repuestos_update" ON public.logistica_repuestos FOR UPDATE USING (
    public.is_super_admin() OR empresa_id IN (SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid())
);

CREATE POLICY "logistica_repuestos_delete" ON public.logistica_repuestos FOR DELETE USING (
    public.is_super_admin() OR empresa_id IN (SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid())
);

-- 3. Crear políticas separadas para movimientos
CREATE POLICY "logistica_movimientos_select" ON public.logistica_movimientos FOR SELECT USING (
    public.is_super_admin() OR empresa_id IN (SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid())
);

CREATE POLICY "logistica_movimientos_insert" ON public.logistica_movimientos FOR INSERT WITH CHECK (
    public.is_super_admin() OR empresa_id IN (SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid())
);

CREATE POLICY "logistica_movimientos_update" ON public.logistica_movimientos FOR UPDATE USING (
    public.is_super_admin() OR empresa_id IN (SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid())
);

CREATE POLICY "logistica_movimientos_delete" ON public.logistica_movimientos FOR DELETE USING (
    public.is_super_admin() OR empresa_id IN (SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid())
);
