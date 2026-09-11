const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrlMatch = envContent.match(/VITE_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (supabaseUrlMatch && supabaseKeyMatch) {
    const supabase = createClient(supabaseUrlMatch[1], supabaseKeyMatch[1]);
    supabase.from('empresa_cliente').select('*').limit(1).then(({data, error}) => {
        if (error) console.log(error);
        else console.log(data);
    });
}
