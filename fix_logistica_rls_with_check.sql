-- Re-aplicar políticas RLS para logística repuestos con WITH CHECK explícito

DROP POLICY IF EXISTS "Users can access logistica_repuestos of their company" ON public.logistica_repuestos;

CREATE POLICY "Users can access logistica_repuestos of their company" ON public.logistica_repuestos FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
) WITH CHECK (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can access logistica_movimientos of their company" ON public.logistica_movimientos;

CREATE POLICY "Users can access logistica_movimientos of their company" ON public.logistica_movimientos FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
) WITH CHECK (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can access logistica_bodegas of their company" ON public.logistica_bodegas;

CREATE POLICY "Users can access logistica_bodegas of their company" ON public.logistica_bodegas FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
) WITH CHECK (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);
