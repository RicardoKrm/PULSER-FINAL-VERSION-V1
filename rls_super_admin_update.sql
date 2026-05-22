-- Habilitar RLS en múltiples tablas y permitir acceso a Súper Administradores

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

-- Ajustes a políticas de tablas de operaciones
DROP POLICY IF EXISTS "Users can access colaborador of their company" ON public.colaborador;
CREATE POLICY "Users can access colaborador of their company" ON public.colaborador FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can access vehiculo of their company" ON public.vehiculo;
CREATE POLICY "Users can access vehiculo of their company" ON public.vehiculo FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can access operacion_contrato of their company" ON public.operacion_contrato;
CREATE POLICY "Users can access operacion_contrato of their company" ON public.operacion_contrato FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can access operacion_contrato_vehiculo of their company" ON public.operacion_contrato_vehiculo;
CREATE POLICY "Users can access operacion_contrato_vehiculo of their company" ON public.operacion_contrato_vehiculo FOR ALL USING (
    public.is_super_admin() OR EXISTS (
        SELECT 1 FROM public.operacion_contrato c
        WHERE c.id = contrato_id AND c.empresa_id IN (
            SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "Users can access operacion_servicio of their company" ON public.operacion_servicio;
CREATE POLICY "Users can access operacion_servicio of their company" ON public.operacion_servicio FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can access operacion_reserva of their company" ON public.operacion_reserva;
CREATE POLICY "Users can access operacion_reserva of their company" ON public.operacion_reserva FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can access operacion_documento of their company" ON public.operacion_documento;
CREATE POLICY "Users can access operacion_documento of their company" ON public.operacion_documento FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can access operacion_programacion of their company" ON public.operacion_programacion;
CREATE POLICY "Users can access operacion_programacion of their company" ON public.operacion_programacion FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can access operacion_ruta of their company" ON public.operacion_ruta;
CREATE POLICY "Users can access operacion_ruta of their company" ON public.operacion_ruta FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

-- Asegurar también log_actividad y biblioteca_documento
DROP POLICY IF EXISTS "biblioteca_select_policy" ON public.biblioteca_documento;
DROP POLICY IF EXISTS "biblioteca_insert_policy" ON public.biblioteca_documento;
DROP POLICY IF EXISTS "biblioteca_update_policy" ON public.biblioteca_documento;
CREATE POLICY "Users can access biblioteca_documento of their company" ON public.biblioteca_documento FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);

