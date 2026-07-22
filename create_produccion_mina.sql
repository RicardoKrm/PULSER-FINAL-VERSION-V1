CREATE TABLE IF NOT EXISTS produccion_registro_diario_mina (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha date NOT NULL,
  turno text NOT NULL,
  equipo text,
  operador text,
  tonelaje numeric,
  vueltas int,
  petroleo numeric,
  novedades text,
  transfer text,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE produccion_registro_diario_mina ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON produccion_registro_diario_mina FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON produccion_registro_diario_mina FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON produccion_registro_diario_mina FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON produccion_registro_diario_mina FOR DELETE USING (true);
