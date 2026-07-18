import * as dotenv from 'dotenv';
dotenv.config();
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
fetch(`${url}/rest/v1/?apikey=${key}`).then(r => r.json()).then(data => {
  if (data.definitions) {
    console.log(Object.keys(data.definitions).join('\n'));
  }
});
