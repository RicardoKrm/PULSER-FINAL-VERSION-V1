const fs = require('fs');

const path = 'src/pages/logistica/GestionSuministros.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /let bData: any\[\] = \[\];[\s\S]*?setSumInsumosData\(\[\]\);\s*\}/;

const replacement = `let bQuery = supabase.from('logistica_bodegas').select('*');
      if (currentCompany.id !== 'emp-001') bQuery = bQuery.eq('empresa_id', currentCompany.id);
      let bData = await fetchAllRows(bQuery);
      setBodegasList(bData || []);

      let rQuery = supabase.from('logistica_repuestos').select(\`
          *,
          logistica_bodegas (
            nombre
          )
        \`);
      if (currentCompany.id !== 'emp-001') rQuery = rQuery.eq('empresa_id', currentCompany.id);
      let rData = await fetchAllRows(rQuery);

      if (rData && rData.length > 0) {
        setSumInsumosData(rData.map((r: any) => {
          const parsedPrecio = parseFloat(r.precio) || 0;
          const parsedStock = parseInt(r.stock) || 0;
          return {
            ...r,
            precio: parsedPrecio,
            stock: parsedStock,
            min: r.min_stock || 0,
            valorTotal: parsedPrecio * parsedStock,
            ultMov: r.ult_mov ? new Date(r.ult_mov).toLocaleDateString() : '--',
            bodegaNombre: r.logistica_bodegas?.nombre || null,
            categoria: r.categoria || 'General'
          };
        }));
      } else {
        setSumInsumosData([]);
      }`;

if (content.match(regex)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log("GestionSuministros fixed");
} else {
  console.log("No match found in GestionSuministros");
}
