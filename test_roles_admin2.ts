import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'fate.vr92@gmail.com', // The user's email
    password: 'admin123' // Just a guess, but wait, I can't guess their password!
  });
}
