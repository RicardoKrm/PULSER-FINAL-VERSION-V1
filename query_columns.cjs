require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
supabase.from('produccion_registro_diario').select('*').limit(1).then(r => console.log(Object.keys(r.data[0] || {})));
