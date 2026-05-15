import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock data for inventory
  const mockRepuestos = [
    { id: 1, sku: 'SKU001', nombre: 'Filtro de Aceite Volvo', stock_total: 50, stock_local: 10, otras_bodegas: 'SCL: 25, ANF: 15' },
    { id: 2, sku: 'SKU002', nombre: 'Pastillas de Freno Meritor', stock_total: 20, stock_local: 5, otras_bodegas: 'SCL: 10, CCP: 5' },
    { id: 3, sku: 'SKU003', nombre: 'Ampolleta H4 24V', stock_total: 100, stock_local: 30, otras_bodegas: 'SCL: 70' },
    { id: 4, sku: 'SKU004', nombre: 'Correa Ventilador', stock_total: 15, stock_local: 2, otras_bodegas: 'SCL: 13' },
  ];

  const mockBodegas = [
    { id: 1, nombre: 'Bodega Central' },
    { id: 2, nombre: 'Taller Mecánico' },
    { id: 3, nombre: 'Bodega de Tránsito' },
  ];

  const mockAuditorias = [
    { id: 101, bodega: { nombre: 'Bodega Central' }, responsable: 'administrador', fecha_inicio: '2026-05-13T14:32:00', fecha_termino: null, estado: 'CAPTURANDO', notas: 'Inventario mensual' },
    { id: 102, bodega: { nombre: 'Taller Mecánico' }, responsable: 'demo demo', fecha_inicio: '2026-04-18T11:13:00', fecha_termino: '2026-04-19T13:18:00', estado: 'FINALIZADA', notas: 'Cierre de trimestre' },
  ];

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

  // API Route for repuestos search
  app.get("/api/repuestos/search", (req, res) => {
    const { q, bodega_id } = req.query;
    const query = String(q || '').toLowerCase();
    
    const results = mockRepuestos
      .filter(r => r.sku.toLowerCase().includes(query) || r.nombre.toLowerCase().includes(query))
      .map(r => ({
        id: r.id,
        sku: r.sku,
        text: `${r.nombre} | ${r.sku}`,
        stock_total: r.stock_total,
        stock_local: r.stock_local,
        otras_bodegas: r.otras_bodegas,
        precio: 15000 // Added price
      }));
    
    res.json(results);
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

    // Mock details
    const detalles = [
      { id: 1, repuesto: { id: 1, nombre: 'Filtro de Aceite Volvo', sku: 'SKU001', precio: 12000 }, stock_teorico: 10, stock_fisico: 8, diferencia: -2, valor_diferencia: -24000, ubicacion_conteo: 'A-1' },
      { id: 2, repuesto: { id: 3, nombre: 'Ampolleta H4 24V', sku: 'SKU003', precio: 2500 }, stock_teorico: 30, stock_fisico: 35, diferencia: 5, valor_diferencia: 12500, ubicacion_conteo: 'B-2' }
    ];

    const invisibles = [
      { id: 3, repuesto: { id: 2, nombre: 'Pastillas de Freno Meritor', sku: 'SKU002', precio: 45000 }, stock_teorico: 5, stock_fisico: 0, diferencia: -5, valor_diferencia: -225000, ubicacion_conteo: 'Rack C-1', ultima_rotacion: '12/04/2026', rotacion_hace: 'HACE 1 MES' },
      { id: 4, repuesto: { id: 4, nombre: 'Correa Ventilador', sku: 'SKU004', precio: 18000 }, stock_teorico: 2, stock_fisico: 0, diferencia: -2, valor_diferencia: -36000, ubicacion_conteo: 'Rack D-3', ultima_rotacion: '01/12/2025', rotacion_hace: 'HACE 5 MESES' }
    ];

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
      res.json({ status: "success" });
    } else {
      res.status(404).json({ message: "Audit not found" });
    }
  });

  // API Route for scanning
  app.post("/api/inventario/escanear", (req, res) => {
    console.log("Escaneo recibido:", req.body);
    res.json({ status: "success", message: "Escaneo registrado correctamente" });
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
