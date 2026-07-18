import * as dotenv from 'dotenv';
dotenv.config();
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
fetch(`${url}/rest/v1/?apikey=${key}`).then(r => r.json()).then(data => {
  if (data.paths) {
    const rpcs = Object.keys(data.paths).filter(p => p.startsWith('/rpc/'));
    console.log(rpcs.join('\n'));
  }
});
