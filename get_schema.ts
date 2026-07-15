import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

fetch(`${url}/rest/v1/`, { headers: { apikey: key } }).then(r => r.json()).then(data => {
  if (data.paths) {
    console.log(Object.keys(data.paths).filter(p => p.startsWith('/') && !p.includes('rpc')).join('\n'));
  }
});
