import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

const getString = (val: any) => {
    if (val === null || val === undefined || val === '') return '';
    if (typeof val === 'object' && val !== null && val.v !== undefined) return String(val.v).trim();
    return String(val).trim();
};

(async () => {
   const { data, error } = await supabase.from('produccion_mina_mensual').select('id, raw_data');
   if (error) { console.error(error); return; }
   
   let updated = 0;
   for (const row of data) {
      if (row.raw_data && row.raw_data.raw) {
          const r = row.raw_data.raw;
          const new_raw_data = { ...row.raw_data };
          new_raw_data.caex_dia = getString(r[4]);
          new_raw_data.caex_acopio_dia = getString(r[7]);
          new_raw_data.caex_planta_dia = getString(r[9]);
          
          new_raw_data.caex_noche = getString(r[19]);
          new_raw_data.caex_acopio_noche = getString(r[22]);
          new_raw_data.caex_planta_noche = getString(r[24]);
          
          const { error: updErr } = await supabase.from('produccion_mina_mensual').update({ raw_data: new_raw_data }).eq('id', row.id);
          if (updErr) console.error(updErr);
          else updated++;
      }
   }
   console.log(`Updated ${updated} rows for caex string fields.`);
})();
