import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
(async () => {
   const { data, error } = await supabase.from('produccion_mina_mensual').select('raw_data').limit(1);
   if (error) console.error(error);
   console.log(JSON.stringify(data?.[0], null, 2));
})();
