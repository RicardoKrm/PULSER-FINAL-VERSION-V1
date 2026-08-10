-- Para produccion_mina_mensual
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

-- Para produccion_cmc
CREATE TABLE IF NOT EXISTS produccion_cmc (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha date NOT NULL,
    turno text NOT NULL, 
    zona text NOT NULL,
    ctd_caex int,
    caex_nombres text,
    operadores text,
    vueltas_acopio int,
    vueltas_planta int,
    vueltas_totales int,
    pases_cf int,
    cf_equipo text,
    produccion_dia numeric,
    produccion_cmc numeric,
    traspasos numeric,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE produccion_cmc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON produccion_cmc FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON produccion_cmc FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON produccion_cmc FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON produccion_cmc FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS produccion_cmc_totales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha date NOT NULL,
    total_imperia numeric,
    total_cmc numeric,
    traspasos_totales numeric,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE produccion_cmc_totales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON produccion_cmc_totales FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON produccion_cmc_totales FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON produccion_cmc_totales FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON produccion_cmc_totales FOR DELETE USING (true);
