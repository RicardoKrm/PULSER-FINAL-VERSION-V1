CREATE TABLE IF NOT EXISTS public.produccion_mina_mensual (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id),
    mes TEXT NOT NULL,
    dia INTEGER,
    supervisor TEXT,
    dia_mes TEXT,
    produccion_dia NUMERIC,
    produccion_noche NUMERIC,
    total_imperia NUMERIC,
    total_cmc NUMERIC,
    diferencia NUMERIC,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.produccion_mina_mensual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver produccion de su empresa"
    ON public.produccion_mina_mensual
    FOR SELECT
    USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "Usuarios pueden insertar produccion de su empresa"
    ON public.produccion_mina_mensual
    FOR INSERT
    WITH CHECK (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "Usuarios pueden actualizar produccion de su empresa"
    ON public.produccion_mina_mensual
    FOR UPDATE
    USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));

CREATE POLICY "Usuarios pueden eliminar produccion de su empresa"
    ON public.produccion_mina_mensual
    FOR DELETE
    USING (empresa_id IN (
        SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    ));
