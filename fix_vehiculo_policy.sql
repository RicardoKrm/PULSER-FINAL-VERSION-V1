DROP POLICY IF EXISTS "Users can access vehiculo of their company" ON public.vehiculo;
CREATE POLICY "Users can access vehiculo of their company" ON public.vehiculo FOR ALL USING (
    public.is_super_admin() OR 
    empresa_id IN (
        SELECT empresa_id 
        FROM public.usuario_aplicacion 
        WHERE auth_user_id = auth.uid()
    )
);
