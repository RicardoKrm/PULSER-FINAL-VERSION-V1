export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function calculateOdometer(data) {
    let kmRecorridos = 0;

    if (data && data.elements && Array.isArray(data.elements) && data.elements.length > 0) {
      const points = data.elements.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];

        if (p1.lat && p1.lng && p2.lat && p2.lng) {
          const dist = getDistanceFromLatLonInKm(p1.lat, p1.lng, p2.lat, p2.lng);
          if (dist < 100) {
            kmRecorridos += dist;
          }
        }
      }
    }
    return { totalKm: kmRecorridos, rawData: data };
  }

  try {
    const { patente, desde, hasta, token } = req.body || {};
    if (!patente || !desde || !hasta || !token) {
      return res.status(400).json({ error: "Missing required parameters (patente, desde, hasta, token)" });
    }

    const cleanPatente = patente.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const fetchPage = async (page) => {
      const url = `https://wiatool-back.kuvesoft.com/api/v1/vehiculos/datos/${cleanPatente}?desde=${desde}&hasta=${hasta}&pageSize=1000&page=${page}`;
      let response = await fetch(url, {
        headers: { 'Authorization': token },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok && response.status === 401) {
         response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: AbortSignal.timeout(10000)
         });
      }
      
      if (!response.ok) {
         const errText = await response.text();
         if (response.status === 403) {
             return { __is403: true, message: "403 Forbidden - No tiene acceso a esta patente" };
         }
         console.error(`GPS Dominio API Error: ${response.status} ${response.statusText}`, errText);
         throw new Error(`GPS Dominio API Error: ${response.statusText} ${errText}`);
      }
      
      return await response.json();
    };

    let data = await fetchPage(1);

    if (data.__is403) {
       console.log(`[GPS API] Skipping vehicle ${patente} due to 403 Forbidden`);
       return res.status(403).json({ error: "Forbidden", details: data.message });
    }

    let allElements = data.elements || [];
    
    if (data.count && data.count > allElements.length) {
        const totalPages = Math.ceil(data.count / (data.pageSize || 100)); // provider might cap pageSize randomly
        const maxPages = Math.min(totalPages, 500); // allow up to 500 pages = ~50k points (~17 days)
        for (let p = 2; p <= maxPages; p++) {
            try {
                const pageData = await fetchPage(p);
                if (pageData.elements) {
                    allElements = allElements.concat(pageData.elements);
                }
            } catch (err) {
                console.error(`Pagination failed at page ${p}:`, err);
                break;
            }
        }
        data.elements = allElements;
    }
    
    const resultData: any = calculateOdometer(data);
    
    // attach the last timestamp so client knows exactly up to when data was synced
    if (data.elements && data.elements.length > 0) {
       const sorted = data.elements.slice().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
       resultData.lastTimestamp = sorted[sorted.length - 1].timestamp;
    }
    
    return res.json(resultData);
  } catch (e) {
    console.error("fetch gps failed:", e);
    return res.status(500).json({ error: "Failed to fetch GPS data from real API", details: e.message || e.toString() });
  }
}
