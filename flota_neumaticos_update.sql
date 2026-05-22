ALTER TABLE public.neumatico ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE;
ALTER TABLE public.neumatico ADD COLUMN IF NOT EXISTS costo NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.neumatico ADD COLUMN IF NOT EXISTS profundidad_actual NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.neumatico ADD COLUMN IF NOT EXISTS profundidad_nueva NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.neumatico ADD COLUMN IF NOT EXISTS km_acumulados NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.neumatico ADD COLUMN IF NOT EXISTS ubicacion TEXT DEFAULT 'BODEGA'; -- 'MONTADO', 'BODEGA', 'DESECHO'
ALTER TABLE public.neumatico ADD COLUMN IF NOT EXISTS fecha_instalacion DATE;

ALTER TABLE public.neumatico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access neumatico of their company" ON public.neumatico;
CREATE POLICY "Users can access neumatico of their company" ON public.neumatico FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);
