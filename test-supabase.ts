import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
    const supa = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');
    const { data } = await supa.from('logistica_repuestos').select('nombre, precio, stock, min_stock, valor_total').limit(5);
    console.log(data);
    if (data) {
        data.forEach(r => {
            const parsedPrecio = parseFloat(r.precio) || 0;
            const parsedStock = parseInt(r.stock) || 0;
            console.log(r.nombre, '->', parsedPrecio * parsedStock, 'typeof precio:', typeof r.precio, 'typeof stock:', typeof r.stock);
        });
    }
}
test();



