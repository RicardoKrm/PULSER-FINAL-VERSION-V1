import { supabase } from './src/lib/supabase';
(async () => {
    try {
        const { data, error } = await supabase.from('orden_de_trabajo').select('*').limit(1);
        if (data && data.length > 0) {
            console.log(Object.keys(data[0]));
        } else {
            console.log("No data or error:", error);
        }
    } catch (e) { console.error(e); }
})();
