import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_ANON_KEY as string);

async function run() {
  const sql = `
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

NOTIFY pgrst, 'reload schema';
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  console.log("Result:", JSON.stringify({ data, error }, null, 2));
}

run();
