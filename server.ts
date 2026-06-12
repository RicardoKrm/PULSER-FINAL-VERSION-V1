import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const mockBodegas: any[] = [];

  const mockAuditorias: any[] = [];

  const mockOrdenesCompra = [
    { id: 'OC-2501', proveedor: 'REPUESTOS TOTAL', fecha: '2026-05-10', total: 1250000, estado: 'RECEPCIONADO', items: 12 },
    { id: 'OC-2502', proveedor: 'LUBRICANTES LIDER', fecha: '2026-05-12', total: 450000, estado: 'ENVIADO', items: 5 },
    { id: 'OC-2503', proveedor: 'NEUMATICOS S.A.', fecha: '2026-05-14', total: 3200000, estado: 'BORRADOR', items: 8 },
    { id: 'OC-2504', proveedor: 'PERNOS Y FILTROS', fecha: '2026-05-15', total: 120000, estado: 'PAGADO', items: 3 },
  ];

  const mockFacturas = [
    { id: 'FE-10293', emisor: 'REPUESTOS TOTAL', fecha: '2026-05-14', monto: 1250000, estado: 'PENDIENTE', oc: 'OC-2501' },
    { id: 'FE-9922', emisor: 'ENERGIA SUR', fecha: '2026-05-12', monto: 850000, estado: 'APROBADA', oc: 'Directa' },
  ];

  const mockUsers = [
    { id: 1, rut: '12.345.678-9', nombre: 'Juan', apellidoPaterno: 'Perez', apellidoMaterno: 'Gonzalez', sexo: 'HOMBRE', empresa: 'Transportes del Norte', cargo: 'Mecánico de Mantenimiento', rol: 'MECANICO', tipo: 'INTERNO', estado: 'ACTIVO', sueldo: 850000, email: 'j.perez@transnorte.cl' },
    { id: 2, rut: '15.223.445-2', nombre: 'Maria', apellidoPaterno: 'Soto', apellidoMaterno: 'Tapia', sexo: 'MUJER', empresa: 'Transportes del Norte', cargo: 'Jefe de Taller', rol: 'ADMINISTRADOR', tipo: 'INTERNO', estado: 'ACTIVO', sueldo: 1500000, email: 'm.soto@transnorte.cl' },
    { id: 3, rut: '18.445.667-0', nombre: 'Carlos', apellidoPaterno: 'Ruiz', apellidoMaterno: 'Vargas', sexo: 'HOMBRE', empresa: 'Transportes del Norte', cargo: 'Conductor', rol: 'CONDUCTOR', tipo: 'INTERNO', estado: 'ACTIVO', sueldo: 950000, email: 'c.ruiz@transnorte.cl' },
  ];

  const mockCargos = [
    { id: 1, nombre: 'Mecánico de Mantenimiento', departamento: 'Taller', sueldoBase: 650000, usuarios: 12 },
    { id: 2, nombre: 'Jefe de Taller', departamento: 'Taller', sueldoBase: 1200000, usuarios: 2 },
    { id: 3, nombre: 'Conductor', departamento: 'Operaciones', sueldoBase: 700000, usuarios: 45 },
    { id: 4, nombre: 'ENCARGADO DE BODEGA Y BODEGUERO', departamento: 'Logística', sueldoBase: 800000, usuarios: 5 },
  ];

  const mockFallas = [
    { id: 1, nombre: 'Falla Eléctrica - Cortocircuito', criticidad: 'ALTA', frecuencia: 'BAJA' },
    { id: 2, nombre: 'Desgaste Irregular Neumáticos', criticidad: 'MEDIA', frecuencia: 'ALTA' },
    { id: 3, nombre: 'Fuga Refrigerante', criticidad: 'ALTA', frecuencia: 'MEDIA' },
    { id: 4, nombre: 'Ruido en Frenos', criticidad: 'MEDIA', frecuencia: 'ALTA' },
    { id: 5, nombre: 'Problema Inyectores', criticidad: 'MUY ALTA', frecuencia: 'BAJA' },
  ];

  const mockPautas = [
    { id: 1, nombre: 'Mantenimiento Preventivo 10K', modeloVehiculo: 'Volvo FH16', kmAplicacion: 10000, tipo: 'PREVENTIVA', estado: 'ACTIVA' },
    { id: 2, nombre: 'Cambio de Aceite Premium', modeloVehiculo: 'Scania R500', kmAplicacion: 20000, tipo: 'LUBRICACION', estado: 'ACTIVA' },
    { id: 3, nombre: 'Revisión Sistemas de Frenos', modeloVehiculo: 'Mercedes Actros', kmAplicacion: 50000, tipo: 'SEGURIDAD', estado: 'ACTIVA' },
  ];

  // API Route for Users
  app.get("/api/configuracion/usuarios", (req, res) => {
    res.json(mockUsers);
  });

  // API Route for Cargos
  app.get("/api/configuracion/cargos", (req, res) => {
    res.json(mockCargos);
  });

  // API Route for Fallas
  app.get("/api/configuracion/fallas", (req, res) => {
    res.json(mockFallas);
  });

  // API Route for Pautas
  app.get("/api/configuracion/pautas", (req, res) => {
    res.json(mockPautas);
  });

  // Shared data for inventory
  let repuestosData: any[] = [];

  // API Route for repuestos search
  app.get("/api/repuestos/search", (req, res) => {
    const { q, bodega_id } = req.query;
    const query = String(q || '').toLowerCase();
    
    const results = repuestosData
      .filter(r => r.sku.toLowerCase().includes(query) || r.nombre.toLowerCase().includes(query))
      .map(r => ({
        id: r.id,
        sku: r.sku,
        text: `${r.nombre} | ${r.sku}`,
        stock_total: r.stock,
        stock_local: r.stock,
        otras_bodegas: '',
        precio: r.precio
      }));
    
    res.json(results);
  });

  // API Route to get all repuestos
  app.get("/api/repuestos", (req, res) => {
    res.json(repuestosData);
  });

  // API Route to add a repuesto
  app.post("/api/repuestos", (req, res) => {
    const newRepuesto = { id: repuestosData.length + 1, ...req.body };
    repuestosData.push(newRepuesto);
    res.json(newRepuesto);
  });

  // API Route for OC
  app.get("/api/compras/ordenes", (req, res) => {
    res.json(mockOrdenesCompra);
  });

  // API Route for Invoices
  app.get("/api/compras/facturas", (req, res) => {
    res.json(mockFacturas);
  });

  // API Route for bodegas
  app.get("/api/bodegas", (req, res) => {
    res.json(mockBodegas);
  });

  app.post("/api/bodegas", (req, res) => {
    const newBodega = { id: mockBodegas.length + 1, ...req.body };
    mockBodegas.push(newBodega);
    res.json(newBodega);
  });

  app.put("/api/bodegas/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockBodegas.findIndex(b => b.id === id);
    if (index !== -1) {
      mockBodegas[index] = { ...mockBodegas[index], ...req.body };
      res.json(mockBodegas[index]);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  });

  app.delete("/api/bodegas/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = mockBodegas.findIndex(b => b.id === id);
    if (index !== -1) {
      mockBodegas.splice(index, 1);
      res.json({ success: true });
    } else {
      res.status(404).json({ message: "Not found" });
    }
  });

  // API Route for active audits
  app.get("/api/auditorias/activas", (req, res) => {
    res.json(mockAuditorias.filter(a => a.estado === 'CAPTURANDO'));
  });

  // API Route for audit history
  app.get("/api/auditorias/historial", (req, res) => {
    res.json(mockAuditorias);
  });

  // API Route for audit detail
  app.get("/api/auditorias/:id", (req, res) => {
    const auditId = parseInt(req.params.id);
    const audit = mockAuditorias.find(a => a.id === auditId);
    
    if (!audit) return res.status(404).json({ message: "Audit not found" });

    const detalles = audit.detalles || [];
    const invisibles = audit.invisibles || [];

    res.json({ auditoria: audit, detalles, invisibles });
  });

  // API Route for starting audit
  app.post("/api/auditorias/iniciar", (req, res) => {
    const { bodega_id, notas } = req.body;
    const bodega = mockBodegas.find(b => b.id.toString() === bodega_id);
    
    const newAudit = {
      id: 100 + mockAuditorias.length + 1,
      bodega: bodega || { nombre: 'Bodega Desconocida' },
      responsable: 'administrador',
      fecha_inicio: new Date().toISOString(),
      fecha_termino: null,
      estado: 'CAPTURANDO',
      notas: notas || ''
    } as any;

    mockAuditorias.push(newAudit);
    res.json(newAudit);
  });

  // API Route for finalizing capture
  app.post("/api/auditorias/:id/finalizar-conteo", (req, res) => {
    const auditId = parseInt(req.params.id);
    const audit = mockAuditorias.find(a => a.id === auditId);
    if (audit) {
      audit.estado = 'ESPERANDO';
      audit.fecha_termino = new Date().toISOString();
      res.json({ status: "success" });
    } else {
      res.status(404).json({ message: "Audit not found" });
    }
  });

  // API Route for authorizing adjustment
  app.post("/api/auditorias/:id/autorizar-ajuste", (req, res) => {
    const auditId = parseInt(req.params.id);
    const audit = mockAuditorias.find(a => a.id === auditId);
    if (audit) {
      audit.estado = 'FINALIZADA';
      // Update actual inventory stock based on physical count
      if (audit.detalles) {
         audit.detalles.forEach((det: any) => {
            const repuesto = repuestosData.find(r => r.sku === det.repuesto.sku);
            if (repuesto) {
               repuesto.stock = det.stock_fisico;
               repuesto.valorTotal = repuesto.precio * repuesto.stock;
               repuesto.ultMov = new Date().toLocaleDateString();
            }
         });
      }
      res.json({ status: "success" });
    } else {
      res.status(404).json({ message: "Audit not found" });
    }
  });

  const mockPendientesAprobacion: any[] = [];

  // API Route for scanning
  app.post("/api/inventario/escanear", (req, res) => {
    const { items } = req.body;
    if (items && items.length > 0) {
      items.forEach((item: any) => {
        if (item.nombre === 'NUEVO PRODUCTO' || item.nombre === 'Escaneo Rápido...') {
           mockPendientesAprobacion.push({
             ...item,
             id: Math.random().toString(36).substring(7),
             fecha: new Date().toISOString()
           });
        }

        // If it belongs to an audit, push to audit details
        if (item.tipo_movimiento === 'AUDITORIA' && item.auditoria_id) {
          const audit = mockAuditorias.find(a => a.id.toString() === item.auditoria_id.toString());
          if (audit) {
             if (!audit.detalles) audit.detalles = [];
             // Find repuesto
             const rep = repuestosData.find(r => r.sku === item.sku) || { id: 999, nombre: item.nombre, sku: item.sku, precio: 0 };
             const existingDetail = audit.detalles.find((d: any) => d.repuesto.sku === item.sku);
             if (existingDetail) {
               existingDetail.stock_fisico += item.cantidad;
               existingDetail.diferencia = existingDetail.stock_fisico - existingDetail.stock_teorico;
               existingDetail.valor_diferencia = existingDetail.diferencia * rep.precio;
             } else {
               const stock_teorico = rep.stock || 0;
               audit.detalles.push({
                 id: audit.detalles.length + 1,
                 repuesto: { id: rep.id, nombre: rep.nombre, sku: rep.sku, precio: rep.precio },
                 stock_teorico,
                 stock_fisico: item.cantidad,
                 diferencia: item.cantidad - stock_teorico,
                 valor_diferencia: (item.cantidad - stock_teorico) * (rep.precio || 0),
                 ubicacion_conteo: item.ubicacion_conteo
               });
             }
          }
        }
      });
    }
    res.json({ status: "success", message: "Escaneo registrado correctamente" });
  });

  // API Route for pending approvals
  app.get("/api/inventario/aprobaciones", (req, res) => {
    res.json(mockPendientesAprobacion);
  });
  
  app.post("/api/inventario/aprobaciones/:id/aprobar", (req, res) => {
    const id = req.params.id;
    const index = mockPendientesAprobacion.findIndex(p => p.id === id);
    if (index !== -1) {
      // Add to inventory
      const pending = mockPendientesAprobacion[index];
      const newRepuesto = { 
        id: repuestosData.length + 1, 
        nombre: req.body.nombre || pending.nombre,
        sku: pending.sku,
        stock: parseInt(req.body.stock) || pending.cantidad || 0,
        precio: parseInt(req.body.precio) || 0,
        proveedor: '--',
        ubicacion: pending.bodega_nombre || 'Sin Ubicación',
        calidad: 'Nuevo',
        min: 0,
        ultMov: new Date().toLocaleDateString(),
        valorTotal: (parseInt(req.body.precio) || 0) * (parseInt(req.body.stock) || pending.cantidad || 0),
        isCritico: false
      };
      repuestosData.push(newRepuesto);
      mockPendientesAprobacion.splice(index, 1);
      res.json({ success: true, newRepuesto });
    } else {
       res.status(404).json({ message: "Not found" });
    }
  });

  // API Route for audit count
  app.post("/api/inventario/auditoria/conteo", (req, res) => {
    console.log("Conteo de auditoría recibido:", req.body);
    res.json({ status: "success", message: "Conteo registrado correctamente" });
  });

  // API Route for chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, context } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
         return res.status(500).json({ error: "GEMINI_API_KEY no está configurada en el servidor." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let systemPrompt = `Eres un asistente virtual experto de PULSER TMS, un software de gestión de flotas y mantenimiento. 
Tu objetivo es responder de manera amable, clara y profesional usando la información que se te proporciona.
Aquí tienes los datos de la flota actuales a los que puedes acceder: ${JSON.stringify(context)}

Si te preguntan algo que no se responde con los datos provistos, indícalo amablemente.
Responde de forma concisa.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Entendido, soy el asistente virtual de PULSER TMS." }] },
            ...messages.map((m: any) => ({
                role: m.role === 'ai' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }))
        ],
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: "Ocurrió un error al procesar tu solicitud." });
    }
  });

  // API Route for GPS1 (GPS Global)
  app.post("/api/gps/sync-gps1", async (req, res) => {
    try {
      const { patente, token } = req.body;
      if (!patente || !token) {
        return res.status(400).json({ error: "Missing patente or token" });
      }

      // We just fetch the last 1 day to get the most recent location
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const formatLocalStr = (d: Date) => d.toISOString().split('T')[0] + ' ' + d.toTimeString().split(' ')[0];
      const fechaInicio = formatLocalStr(yesterday);
      const fechaFin = formatLocalStr(today);

      const url = `https://backend.gpsglobal.cl/api/open/recorrido?patente=${patente}&api_token=${token}&fecha_inicio=${encodeURIComponent(fechaInicio)}&fecha_fin=${encodeURIComponent(fechaFin)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`GPS API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      console.error('Error fetching GPS1:', e);
      res.status(500).json({ error: "Failed to fetch GPS Global data" });
    }
  });

  // API Route for GPS2 (Fleetsatlatam - Custom API)
  app.post("/api/gps/sync-gps2", async (req, res) => {
    try {
      const { url, username, password } = req.body;
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
      res.json(gpsData);
    } catch (e: any) {
      console.error('Error fetching GPS2:', e);
      res.status(500).json({ error: "Failed to fetch GPS2 data" });
    }
  });

  // API Route for GPS Dominio Client
  app.post("/api/gps/dominio", async (req, res) => {
    try {
      const { patente, desde, hasta, token } = req.body;
      if (!patente || !desde || !hasta || !token) {
        return res.status(400).json({ error: "Missing required parameters (patente, desde, hasta, token)" });
      }

      const url = `https://api.dominio.cl/${patente}?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`;
      
      try {
          const response = await fetch(url, {
            headers: {
               'Authorization': `Bearer ${token}`
            },
            // fast timeout since it will fail
            signal: AbortSignal.timeout(3000)
          });
          
          if (!response.ok) {
            const responseWithoutBearer = await fetch(url, {
              headers: { 'Authorization': token },
              signal: AbortSignal.timeout(3000)
            });
            if (!responseWithoutBearer.ok) throw new Error();
            const data = await responseWithoutBearer.json();
            return res.json(calculateOdometer(data));
          }
          
          const data = await response.json();
          return res.json(calculateOdometer(data));
      } catch (e: any) {
          console.warn('Real API failed (likely missing actual URL). Using mock data.');
          
          let lat1 = -20.25;
          let lng1 = -69.80;
          
          if (patente.includes('BBWB')) {
              lat1 = -20.21;
              lng1 = -70.15;
          } else if (patente.includes('LDTP')) {
              lat1 = -20.28;
              lng1 = -70.12;
          }
          
          const mockData = {
              "from": 1,
              "to": 1,
              "count": 1,
              "page": 1,
              "pageSize": 100,
              "elements": [
                {
                  "id": 1,
                  "imei": "869066061815628",
                  "heading": 112,
                  "ignition": 1,
                  "speed": 0,
                  "lat": lat1,
                  "lng": lng1,
                  "timestamp": new Date(Date.now() - 3600000).toISOString()
                },
                {
                  "id": 2,
                  "imei": "869066061815628",
                  "heading": 112,
                  "ignition": 1,
                  "speed": 60,
                  "lat": lat1 + (Math.random() * 0.05),
                  "lng": lng1 + (Math.random() * 0.05),
                  "timestamp": new Date().toISOString()
                }
              ]
          };
          return res.json(calculateOdometer(mockData));
      }
      
    } catch (e: any) {
      console.error('Error fetching GPS Dominio:', e);
      res.status(500).json({ error: "Failed to fetch GPS Dominio data" });
    }
  });

  function calculateOdometer(data: any) {
      let kmRecorridos = 0;
      
      if (data && data.elements && Array.isArray(data.elements) && data.elements.length > 0) {
         const points = data.elements.slice().sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
         
         for (let i = 1; i < points.length; i++) {
            const p1 = points[i-1];
            const p2 = points[i];
            
            if (p1.lat && p1.lng && p2.lat && p2.lng) {
                const dist = getDistanceFromLatLonInKm(p1.lat, p1.lng, p2.lat, p2.lng);
                // Simple outlier check to avoid GPS jumps (e.g., > 150km in consecutive points without very long time gap)
                // Assuming points are not super spread, but we can just sum them
                if (dist < 100) { // arbitrary threshold for a single segment just in case of anomaly
                    kmRecorridos += dist;
                }
            }
         }
      }
      return { totalKm: kmRecorridos, rawData: data };
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI/180)
  }

  function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2-lat1);  
    const dLon = deg2rad(lon2-lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
