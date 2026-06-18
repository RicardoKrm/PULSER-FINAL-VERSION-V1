import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

async function test() {
   const supabase = createClient(process.env.VITE_SUPABASE_URL as string, process.env.VITE_SUPABASE_ANON_KEY as string);
   const { data } = await supabase.from('vehiculo').select('id, patente, kilometraje_actual');
   console.log(data);
}
test();
