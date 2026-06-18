import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

async function test() {
   const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
   const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY as string;
   if (!supabaseUrl || !supabaseKey) return console.log("Missing config");

   const supabase = createClient(supabaseUrl, supabaseKey);
   const now = new Date();
   
   // fetch test
   const { data: v } = await supabase.from('vehiculo').select('*').limit(1).single();
   console.log("Got vehicle.");
   
   if (v) {
       const updatePayload = {
           kilometraje_actual: Math.round((v.kilometraje_actual || 0) + 1), 
           updated_at: now.toISOString(),
           km_promedio_dia: v.km_promedio_dia,
           detalles: v.detalles
       };
       const { error } = await supabase.from('vehiculo').update(updatePayload).eq('id', v.id);
       console.log("Update error:", error);
   }
}
test();
