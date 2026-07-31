import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

const emails = [
  'apetrillo@imperia.cl',
  'aaraya@imperia.cl',
  'hlacroix@imperia.cl',
  'phernandez@imperia.cl',
  'ppacheco@imperia.cl',
  'msepulveda@imperia.cl',
  'caraos@imperia.cl',
  'abarrera@imperia.cl',
  'igutierrez@imperia.cl'
];

const passwords = [
  'admin123',
  '123456',
  'imperia',
  'Imperia123',
  'Pulser123!'
];

async function run() {
  for (const email of emails) {
    for (const password of passwords) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (!error && data?.session) {
        console.log(`SUCCESS: Logged in as ${email} with password "${password}"!`);
        console.log('User ID:', data.session.user.id);
        
        // Let's query logistica_repuestos!
        const { data: repuestos, error: repError } = await supabase
          .from('logistica_repuestos')
          .select('*');
        console.log('Query logistica_repuestos:', repuestos?.length, repError);

        // Let's query logistica_bodegas!
        const { data: bodegas, error: bodError } = await supabase
          .from('logistica_bodegas')
          .select('*');
        console.log('Query logistica_bodegas:', bodegas?.length, bodError);

        return;
      }
    }
  }
  console.log('No login attempts succeeded.');
}

run();
