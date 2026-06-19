export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, username, password } = req.body || {};
    if (!url || !username || !password) {
      return res.status(400).json({ error: "Missing gps2 url, username or password" });
    }

    // Step 1: Login
    const loginRes = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!loginRes.ok) {
      throw new Error(`GPS2 Login Error: ${loginRes.statusText}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.accessToken;
    
    if (!token) {
      throw new Error("No accessToken returned from GPS2");
    }

    // Step 2: Fetch GPS data
    const gpsRes = await fetch(`${url}/api/gps`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!gpsRes.ok) {
      throw new Error(`GPS2 Data Error: ${gpsRes.statusText}`);
    }
    
    const gpsData = await gpsRes.json();
    return res.json(gpsData);
  } catch (e) {
    console.error('Error fetching GPS2:', e);
    return res.status(500).json({ error: "Failed to fetch GPS2 data" });
  }
}
