const fs = require('fs');
const path = require('path');

const dir = 'src/pages/seguridad';
const files = ['CapacitacionesSSO.tsx', 'CharlasSSO.tsx'];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/(<p className="text-3xl font-bold[^>]*>)[^<]+(<\/p>)/g, '$10$2');
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log("3xl KPI numbers cleared.");
