export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { patente, token } = req.body || {};
    if (!patente || !token) {
      return res.status(400).json({ error: "Missing patente or token" });
    }

    // We just fetch the last 1 day to get the most recent location
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const formatLocalStr = (d) => d.toISOString().split('T')[0] + ' ' + d.toTimeString().split(' ')[0];
    const fechaInicio = formatLocalStr(yesterday);
    const fechaFin = formatLocalStr(today);

    const url = `https://backend.gpsglobal.cl/api/open/recorrido?patente=${patente}&api_token=${token}&fecha_inicio=${encodeURIComponent(fechaInicio)}&fecha_fin=${encodeURIComponent(fechaFin)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`GPS API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return res.json(data);
  } catch (e) {
    console.error('Error fetching GPS1:', e);
    return res.status(500).json({ error: "Failed to fetch GPS Global data" });
  }
}
