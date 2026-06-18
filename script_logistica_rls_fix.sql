-- Aplicación de RLS estándar multi-tenant para el módulo de logística
-- Este script permite que los super administradores vean todo y que
-- los usuarios estándar solo vean los registros de su respectiva empresa.

-- 1. Asegurar la función de Súper Administrador
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_aplicacion ua
    JOIN public.rol r ON ua.rol_id = r.id
    WHERE ua.auth_user_id = auth.uid() AND (r.nombre = 'Súper Administrador' OR r.nombre = 'Super Administrador')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Habilitar RLS explícito en todas las tablas de logística
ALTER TABLE public.logistica_bodegas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistica_repuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistica_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistica_auditorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistica_auditoria_detalles ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas antiguas (las que tenían USING(true))
DROP POLICY IF EXISTS "logistica_bodegas_select" ON public.logistica_bodegas;
DROP POLICY IF EXISTS "logistica_bodegas_insert" ON public.logistica_bodegas;
DROP POLICY IF EXISTS "logistica_bodegas_update" ON public.logistica_bodegas;
DROP POLICY IF EXISTS "logistica_bodegas_delete" ON public.logistica_bodegas;

DROP POLICY IF EXISTS "logistica_repuestos_select" ON public.logistica_repuestos;
DROP POLICY IF EXISTS "logistica_repuestos_insert" ON public.logistica_repuestos;
DROP POLICY IF EXISTS "logistica_repuestos_update" ON public.logistica_repuestos;
DROP POLICY IF EXISTS "logistica_repuestos_delete" ON public.logistica_repuestos;

DROP POLICY IF EXISTS "logistica_movimientos_select" ON public.logistica_movimientos;
DROP POLICY IF EXISTS "logistica_movimientos_insert" ON public.logistica_movimientos;
DROP POLICY IF EXISTS "logistica_movimientos_update" ON public.logistica_movimientos;
DROP POLICY IF EXISTS "logistica_movimientos_delete" ON public.logistica_movimientos;

DROP POLICY IF EXISTS "logistica_auditorias_select" ON public.logistica_auditorias;
DROP POLICY IF EXISTS "logistica_auditorias_insert" ON public.logistica_auditorias;
DROP POLICY IF EXISTS "logistica_auditorias_update" ON public.logistica_auditorias;
DROP POLICY IF EXISTS "logistica_auditorias_delete" ON public.logistica_auditorias;

DROP POLICY IF EXISTS "logistica_auditoria_detalles_select" ON public.logistica_auditoria_detalles;
DROP POLICY IF EXISTS "logistica_auditoria_detalles_insert" ON public.logistica_auditoria_detalles;
DROP POLICY IF EXISTS "logistica_auditoria_detalles_update" ON public.logistica_auditoria_detalles;
DROP POLICY IF EXISTS "logistica_auditoria_detalles_delete" ON public.logistica_auditoria_detalles;

-- 4. Crear nuevas políticas cohesivas "FOR ALL" basadas en empresa_id

DROP POLICY IF EXISTS "Users can access logistica_bodegas of their company" ON public.logistica_bodegas;
CREATE POLICY "Users can access logistica_bodegas of their company" ON public.logistica_bodegas FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can access logistica_repuestos of their company" ON public.logistica_repuestos;
CREATE POLICY "Users can access logistica_repuestos of their company" ON public.logistica_repuestos FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can access logistica_movimientos of their company" ON public.logistica_movimientos;
CREATE POLICY "Users can access logistica_movimientos of their company" ON public.logistica_movimientos FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can access logistica_auditorias of their company" ON public.logistica_auditorias;
CREATE POLICY "Users can access logistica_auditorias of their company" ON public.logistica_auditorias FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can access logistica_auditoria_detalles via auditoria" ON public.logistica_auditoria_detalles;
CREATE POLICY "Users can access logistica_auditoria_detalles via auditoria" ON public.logistica_auditoria_detalles FOR ALL USING (
    public.is_super_admin() OR EXISTS (
        SELECT 1 FROM public.logistica_auditorias a
        WHERE a.id = auditoria_id AND a.empresa_id IN (
            SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
        )
    )
);
