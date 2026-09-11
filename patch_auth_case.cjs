const fs = require('fs');
const file = 'src/context/AuthContext.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "if (data.estado === 'Inactivo' || (data.empresa && data.empresa.estado === 'Inactivo')) {",
  "if (data.estado?.toLowerCase() === 'inactivo' || (data.empresa && data.empresa.estado?.toLowerCase() === 'inactivo')) {"
);

fs.writeFileSync(file, content);

const file2 = 'src/pages/Login.tsx';
let content2 = fs.readFileSync(file2, 'utf8');

content2 = content2.replace(
  "const isInactive = profile.estado === 'Inactivo' || (profile.empresa && profile.empresa.estado === 'Inactivo');",
  "const isInactive = profile.estado?.toLowerCase() === 'inactivo' || (profile.empresa && profile.empresa.estado?.toLowerCase() === 'inactivo');"
);

fs.writeFileSync(file2, content2);
console.log("Case sensitivity patched");
