CREATE TABLE IF NOT EXISTS public.log_actividad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresa(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES public.usuario_aplicacion(id) ON DELETE SET NULL,
    accion TEXT NOT NULL,
    modulo TEXT NOT NULL,
    detalles TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.log_actividad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "log_actividad_select_policy"
    ON public.log_actividad
    FOR SELECT
    TO authenticated
    USING (true); -- o restringir por empresa_id

CREATE POLICY "log_actividad_insert_policy"
    ON public.log_actividad
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
