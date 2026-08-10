DROP TABLE IF EXISTS produccion_mina_mensual;
CREATE TABLE IF NOT EXISTS produccion_mina_mensual (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresa(id) ON DELETE CASCADE,
  mes int NOT NULL,
  anio int NOT NULL,
  dia int NOT NULL,
  supervisor text,
  dia_mes text,
  
  -- Turno Día
  cantidad_caex_dia numeric DEFAULT 0,
  caex_dia numeric DEFAULT 0,
  operadores_dia numeric DEFAULT 0,
  acopio_dia numeric DEFAULT 0,
  caex_acopio_dia numeric DEFAULT 0,
  planta_dia numeric DEFAULT 0,
  caex_planta_dia numeric DEFAULT 0,
  vueltas_dia numeric DEFAULT 0,
  pases_cf_dia numeric DEFAULT 0,
  pases_totales_dia numeric DEFAULT 0,
  toneladas_caex_dia numeric DEFAULT 0,
  equipo_cf_dia text,
  produccion_dia numeric DEFAULT 0,
  produccion_cmc_dia numeric DEFAULT 0,
  traspasos_dia numeric DEFAULT 0,

  -- Turno Noche
  cantidad_caex_noche numeric DEFAULT 0,
  caex_noche numeric DEFAULT 0,
  operadores_noche numeric DEFAULT 0,
  acopio_noche numeric DEFAULT 0,
  caex_acopio_noche numeric DEFAULT 0,
  planta_noche numeric DEFAULT 0,
  caex_planta_noche numeric DEFAULT 0,
  vueltas_noche numeric DEFAULT 0,
  pases_cf_noche numeric DEFAULT 0,
  pases_totales_noche numeric DEFAULT 0,
  toneladas_caex_noche numeric DEFAULT 0,
  equipo_cf_noche text,
  produccion_caex_noche numeric DEFAULT 0,
  produccion_noche numeric DEFAULT 0,
  traspasos_noche numeric DEFAULT 0,

  -- Totales
  total_imperia numeric DEFAULT 0,
  total_cmc numeric DEFAULT 0,
  diferencia numeric DEFAULT 0,

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE produccion_mina_mensual ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for all users" ON produccion_mina_mensual FOR ALL USING (true) WITH CHECK (true);
