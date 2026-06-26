import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
// We need the service role key to fix RLS
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceKey);

async function fixRLS() {
  const sql = `
    DROP POLICY IF EXISTS "Users can access logistica_repuestos of their company" ON public.logistica_repuestos;
    CREATE POLICY "Users can access logistica_repuestos of their company" ON public.logistica_repuestos FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Users can access logistica_movimientos of their company" ON public.logistica_movimientos;
    CREATE POLICY "Users can access logistica_movimientos of their company" ON public.logistica_movimientos FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Users can access logistica_bodegas of their company" ON public.logistica_bodegas;
    CREATE POLICY "Users can access logistica_bodegas of their company" ON public.logistica_bodegas FOR ALL USING (true) WITH CHECK (true);
  `;
  // we can't run arbitrary SQL via supabase js without an RPC. 
}

fixRLS();
