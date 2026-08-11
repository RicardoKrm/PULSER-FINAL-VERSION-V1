import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
dotenv.config();

(async () => {
    // Just read the local excel file to find headers
    const bstr = require('fs').readFileSync('Revisión Final Produccion Caex Mina Julio 2026.xlsx', 'binary');
    const wb = XLSX.read(bstr, { type: 'binary' });
    const sheetName = wb.SheetNames[0]; // Or find one with data
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(data.slice(0, 5));
})();
