const fs = require('fs');
const path = 'src/pages/operaciones/ControlDocumental.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace any corrupted "Gestión de Ciclo de Vida" variants
content = content.replace(/Gesti[^n]+n de Ciclo de Vida/g, 'Gestión de Ciclo de Vida');

fs.writeFileSync(path, content, 'utf8');
