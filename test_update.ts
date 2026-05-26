import { supabase } from './src/lib/supabase';
(async () => {
    try {
        const { data, error } = await supabase.from('orden_de_trabajo').update({ inicio_proceso: new Date().toISOString() }).eq('id', '123').select();
        console.log("Error:", error);
    } catch (e) { console.error(e); }
})();
