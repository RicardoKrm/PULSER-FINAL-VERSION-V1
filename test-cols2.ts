import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
async function run() {
  const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/empresa?limit=1`, {
    headers: {
      'apikey': process.env.VITE_SUPABASE_ANON_KEY as string,
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
    }
  });
  console.log(await res.json());
}
run();
