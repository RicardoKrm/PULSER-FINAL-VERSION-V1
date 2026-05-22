ALTER TABLE public.registro_combustible ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE;
ALTER TABLE public.registro_combustible ADD COLUMN IF NOT EXISTS vehiculo_id UUID REFERENCES public.vehiculo(id) ON DELETE SET NULL;
ALTER TABLE public.registro_combustible ADD COLUMN IF NOT EXISTS ruta TEXT;

ALTER TABLE public.registro_combustible ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access registro_combustible of their company" ON public.registro_combustible;
CREATE POLICY "Users can access registro_combustible of their company" ON public.registro_combustible FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);
