import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('produccion_registro_diario').select('fecha, turno, novedades');
  if (error) console.error(error);
  else {
      const supMap = {};
      data.forEach(d => {
          let sup = '';
          if (d.novedades && d.novedades.includes('Supervisor:')) {
             sup = d.novedades.split('Supervisor:')[1].split('|')[0].trim();
          }
          if (sup) {
             if (!supMap[sup]) supMap[sup] = new Set();
             supMap[sup].add(`${d.fecha} - ${d.turno}`);
          }
      });
      for (const s in supMap) {
          console.log(s, Array.from(supMap[s]));
      }
  }
}
test();
