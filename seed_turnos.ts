import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function seed() {
  const { data: empresa } = await supabase.from('empresa').select('id').limit(1).single();
  if (!empresa) return;

  const { data: existing } = await supabase.from('turnos_semanales').select('id').eq('empresa_id', empresa.id).order('fecha_inicio', { ascending: false });
  
  if (existing && existing.length > 0) {
    console.log("Turnos exist");
  } else {
    console.log("Creating default record");
    const initialData = {
      DÍA: [
        { id: 'dia-iqq', title: 'Transporte IQQ', supervisor: '', workers: [] },
        { id: 'dia-hospicio', title: 'Transporte Hospicio', supervisor: '', workers: [] },
        { id: 'dia-taller', title: 'Transporte Taller', supervisor: '', workers: [] },
        { id: 'dia-mina', title: 'Transporte Mina', supervisor: '', workers: [] }
      ],
      NOCHE: [
        { id: 'noche-iqq', title: 'Transporte IQQ', supervisor: '', workers: [] },
        { id: 'noche-hospicio', title: 'Transporte Hospicio', supervisor: '', workers: [] },
        { id: 'noche-mina', title: 'Transporte Mina', supervisor: '', workers: [] }
      ]
    };
    await supabase.from('turnos_semanales').insert({
      empresa_id: empresa.id,
      area: 'TODAS',
      fecha_inicio: '2024-07-22',
      fecha_fin: '2024-07-29',
      data: initialData
    });
  }
}
seed().then(() => console.log('Done'));
