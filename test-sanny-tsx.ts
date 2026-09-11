import { supabase } from './src/lib/supabase';
async function test() {
    console.log("Fetching...");
    const {data, error} = await supabase.from('produccion_sanny').select('*').limit(5);
    console.log("Result:", data, error);
}
test();
