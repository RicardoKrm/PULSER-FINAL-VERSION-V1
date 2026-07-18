CREATE TABLE IF NOT EXISTS produccion_registro_diario (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha date NOT NULL,
  turno text NOT NULL,
  camion text,
  chofer text,
  tonelaje numeric,
  vueltas int,
  petroleo numeric,
  novedades text,
  transfer text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE produccion_registro_diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON produccion_registro_diario FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON produccion_registro_diario FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON produccion_registro_diario FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON produccion_registro_diario FOR DELETE USING (true);
