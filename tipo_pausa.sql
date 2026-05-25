CREATE TABLE IF NOT EXISTS public.tipo_pausa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresa(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    impacto TEXT,
    estado TEXT DEFAULT 'Activo',
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tipo_pausa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tipo_pausa_isolation_policy" ON public.tipo_pausa;
CREATE POLICY "tipo_pausa_isolation_policy" ON public.tipo_pausa
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
