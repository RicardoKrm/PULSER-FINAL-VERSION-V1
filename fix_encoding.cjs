const fs = require('fs');
const path = 'src/pages/operaciones/ControlDocumental.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/A[ÃƒÃ‚]+Â±o/g, 'Anio');
content = content.replace(/T[ÃƒÃ‚]+Â©cnica/g, 'Tecnica');
content = content.replace(/TAccnica/g, 'Tecnica');
content = content.replace(/aA[ÃƒÃ‚]+os/g, 'anos');
content = content.replace(/aAos/g, 'anos');
content = content.replace(/automA[ÃƒÃ‚]+tico/g, 'automatico');
content = content.replace(/automAtico/g, 'automatico');
content = content.replace(/Ao/g, 'Anio');
content = 
content = content.replace(/dA-a/g, 'dia');

fs.writeFileSync(path, content, 'utf8');

