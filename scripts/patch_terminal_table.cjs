const fs = require('fs');

let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

const tableHeadersStr = `<th className="px-4 py-2">Bodega</th>
                       <th className="px-4 py-2">Ubicación</th>
                       <th className="px-4 py-2 text-right">Acción</th>`;
const tableHeadersRep = `<th className="px-4 py-2">Bodega</th>
                       <th className="px-4 py-2">Ubicación</th>
                       <th className="px-4 py-2 text-right">Datos</th>
                       <th className="px-4 py-2 text-right">Acción</th>`;

content = content.replace(tableHeadersStr, tableHeadersRep);

const tableBodyStr = `<td className="px-4 py-2 text-slate-600 dark:text-slate-300">{item.ubicacion || '-'}</td>
                           <td className="px-4 py-2 text-right">`;
const tableBodyRep = `<td className="px-4 py-2 text-slate-600 dark:text-slate-300">{item.ubicacion || '-'}</td>
                           <td className="px-4 py-2 text-right text-xs text-slate-500">
                             {item.proveedorId ? (proveedores.find(p => p.id === item.proveedorId)?.nombre || 'Prov') : ''}
                             {item.precioUnitario ? \` $\${item.precioUnitario}\` : ''}
                           </td>
                           <td className="px-4 py-2 text-right">`;

content = content.replace(tableBodyStr, tableBodyRep);

fs.writeFileSync('src/pages/logistica/GestionSuministros.tsx', content);

console.log("Table patched");
