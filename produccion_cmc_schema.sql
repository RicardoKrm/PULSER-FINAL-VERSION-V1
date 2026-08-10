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
