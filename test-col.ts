import { supabase } from './src/lib/supabase';

async function test() {
    const { data, error } = await supabase.from('empresa_cliente').select('empresa_id').limit(1);
    console.log(error ? "NO_COLUMN" : "HAS_COLUMN");
}
test();
