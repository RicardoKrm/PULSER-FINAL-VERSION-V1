import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function cleanUp() {
  const { data: progs } = await supabase.from('operacion_programacion').select('id, notas');
  const { data: servs } = await supabase.from('operacion_servicio').select('id');
  
  const servsIds = new Set(servs?.map(s => s.id) || []);
  let deletedCount = 0;
  
  for (const prog of (progs || [])) {
    if (prog.notas && prog.notas.includes('-') && prog.notas.length > 20) {
      if (!servsIds.has(prog.notas)) {
        await supabase.from('operacion_programacion').delete().eq('id', prog.id);
        deletedCount++;
      }
    } else {
        // if notas is null or empty, maybe it's not a service, but if it has no notas, it's not linked.
        // The user said they deleted all services and "programacion" still shows. We can just delete ALL programacion.
        // They want to clear it.
    }
  }
  
  console.log(`Cleaned up ${deletedCount} orphaned programacion entries.`);
  
  // Actually, to be safe, if we just want to wipe them because they are residues:
  // await supabase.from('operacion_programacion').delete().neq('id', '0'); 
  // Wait, let's only delete orphaned ones.
}

cleanUp();
