CREATE TABLE IF NOT EXISTS public.produccion_sanny (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
    equipo TEXT NOT NULL,
    numero_serie INTEGER NOT NULL,
    capacidad NUMERIC NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    turno TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (empresa_id, equipo, fecha, hora)
);

ALTER TABLE public.produccion_sanny ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access produccion_sanny of their company" ON public.produccion_sanny FOR ALL USING (
    public.is_super_admin() OR empresa_id IN (
        SELECT empresa_id FROM public.usuario_aplicacion WHERE auth_user_id = auth.uid()
    )
);
