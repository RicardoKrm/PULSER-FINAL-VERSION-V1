import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function check() {
  const { data: v } = await supabase.from('vehiculo').select('id, numero_interno, modelo, tipo_aceite').limit(5);
  console.log("Vehiculos:", v);
  const { data: p } = await supabase.from('mantenimiento_pauta').select('id, nombre, tipo_aceite, modelo:mantenimiento_modelo_vehiculo(nombre)').limit(5);
  console.log("Pautas:", JSON.stringify(p, null, 2));
}

check();
