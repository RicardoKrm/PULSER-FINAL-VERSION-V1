import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

async function test() {
   const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
   const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY as string;
   if (!supabaseUrl || !supabaseKey) return console.log("Missing config");

   const supabase = createClient(supabaseUrl, supabaseKey);
   const { data, error } = await supabase.from('vehiculo').select('id, patente, kilometraje_actual, detalles');
   console.log("Error:", error);
   console.log("All patentes:");
   data?.forEach(v => console.log(v.patente));
}
test();
