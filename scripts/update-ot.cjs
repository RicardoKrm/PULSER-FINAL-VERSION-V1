const fs = require('fs');

const file = 'src/pages/flota/OrdenesTrabajo.tsx';
let text = fs.readFileSync(file, 'utf8');

text = text.replace(
  '<option value="CORRECTIVA">CORRECTIVA</option>',
  '<option value="CORRECTIVA">CORRECTIVA</option>\n                <option value="INSPECCION">INSPECCION</option>'
);

text = text.replace(
  "case 'CORRECTIVA': return 'bg-amber-100 text-amber-700 border-amber-200';",
  "case 'CORRECTIVA': return 'bg-amber-100 text-amber-700 border-amber-200';\n        case 'INSPECCION': return 'bg-purple-100 text-purple-700 border-purple-200';"
);

fs.writeFileSync(file, text);
console.log("Updated OrdenesTrabajo.tsx");
