import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');
// Wait, VITE_SUPABASE_ANON_KEY doesn't have privileges for DDL if we use RPC exec_sql.
