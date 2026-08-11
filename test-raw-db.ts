import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

(async () => {
   const { data, error } = await supabase.from('produccion_mina_mensual').select('raw_data').limit(1);
   if (error) { console.error(error); return; }
   console.log("operadores_dia:", data?.[0]?.raw_data?.operadores_dia);
   console.log("acopio_dia:", data?.[0]?.raw_data?.acopio_dia);
   console.log("planta_dia:", data?.[0]?.raw_data?.planta_dia);
})();
