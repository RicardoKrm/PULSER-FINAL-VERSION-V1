const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
let env = '';
try { env = fs.readFileSync('.env', 'utf8'); } catch(e) {}

const supabaseUrlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (supabaseUrlMatch && supabaseKeyMatch) {
    const supabase = createClient(supabaseUrlMatch[1], supabaseKeyMatch[1]);
    supabase.from('produccion_sanny').select('*').limit(5).then(({data, error}) => {
        if (error) console.log("ERROR", error);
        else console.log("DATA_TEST_1", data);
    });
} else {
    console.log("No env");
}
