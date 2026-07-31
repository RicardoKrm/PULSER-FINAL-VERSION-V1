import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

async function run() {
  try {
    const res = await fetch(`${url}/rest/v1/`, { headers: { apikey: key || '' } });
    const data = await res.json();
    if (data.paths) {
      console.log("ALL PATHS:");
      console.log(Object.keys(data.paths).filter(p => p.includes('rpc')).join('\n'));
    } else {
      console.log("No paths in response. Error message:", data);
    }
  } catch (e) {
    console.error("Error in fetch:", e);
  }
}

run();
