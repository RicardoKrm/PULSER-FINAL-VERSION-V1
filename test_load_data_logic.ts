import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function run() {
  await supabase.auth.signInWithPassword({
    email: 'admin@pulser.cl',
    password: 'admin123'
  });

  const { data: rData, error } = await supabase
    .from('logistica_repuestos')
    .select(`
      *,
      logistica_bodegas (
        nombre
      )
    `)
    .eq('empresa_id', '57fa41da-645d-48ba-a671-65a35312d0e9');

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Successfully fetched ${rData?.length} rows. Testing transformation mapping...`);

  try {
    const transformed = rData.map((r: any, idx: number) => {
      try {
        const parsedPrecio = parseFloat(r.precio) || 0;
        const parsedStock = parseInt(r.stock) || 0;
        
        // Test date transformation
        const ultMov = r.ult_mov ? new Date(r.ult_mov).toLocaleDateString() : '--';
        
        const bodegaNombre = r.logistica_bodegas?.nombre || null;
        const categoria = r.categoria || 'General';

        // Test upper casing of quality/proveedor/ubicacion for uniqueness sets
        const calidadUpper = r.calidad?.toUpperCase();
        const proveedorUpper = r.proveedor?.toUpperCase();
        const ubicacion = r.ubicacion;

        return {
          ...r,
          precio: parsedPrecio,
          stock: parsedStock,
          min: r.min_stock || 0,
          valorTotal: parsedPrecio * parsedStock,
          ultMov,
          bodegaNombre,
          categoria
        };
      } catch (innerErr: any) {
        throw new Error(`Failed on row index ${idx} with ID ${r.id}: ${innerErr.message}`);
      }
    });

    console.log('Transformation mapping succeeded! No rows failed.');
    
    // Check some stats
    const uniqueCalidades = Array.from(new Set(transformed.map(item => item.calidad?.toUpperCase()).filter(Boolean)));
    const uniqueProveedores = Array.from(new Set(transformed.map(item => item.proveedor?.toUpperCase()).filter(Boolean)));
    const uniqueUbicaciones = Array.from(new Set(transformed.map(item => item.ubicacion).filter(Boolean)));
    
    console.log('Unique calidades:', uniqueCalidades);
    console.log('Unique proveedores:', uniqueProveedores.slice(0, 10), 'total:', uniqueProveedores.length);
    console.log('Unique ubicaciones:', uniqueUbicaciones.slice(0, 10), 'total:', uniqueUbicaciones.length);
  } catch (err: any) {
    console.error('TRANSFORMATION CRASHED:', err.message);
  }
}

run();
