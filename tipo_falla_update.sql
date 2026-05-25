ALTER TABLE public.tipo_falla 
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS modelo_afectado TEXT,
ADD COLUMN IF NOT EXISTS criticidad TEXT,
ADD COLUMN IF NOT EXISTS causa TEXT,
ADD COLUMN IF NOT EXISTS tfs_predeterminado_horas NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE;

-- RLS
ALTER TABLE public.tipo_falla ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tipos_falla_isolation_policy" ON public.tipo_falla;
CREATE POLICY "tipos_falla_isolation_policy" ON public.tipo_falla
    FOR ALL
    USING (
        public.is_super_admin() OR empresa_id IN (
            SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_super_admin() OR empresa_id IN (
            SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
        )
    );
