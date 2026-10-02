const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
let env = fs.readFileSync('.env', 'utf8');

const supabaseUrlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (supabaseUrlMatch && supabaseKeyMatch) {
    const supabase = createClient(supabaseUrlMatch[1], supabaseKeyMatch[1]);
    supabase.from('rol').select('*').then(({data, error}) => {
        if (error) console.log("ERROR", error);
        else console.log("ROLES", data.filter(r => r.nombre === 'Administrador' || r.nombre === 'Súper Administrador'));
    });
}
