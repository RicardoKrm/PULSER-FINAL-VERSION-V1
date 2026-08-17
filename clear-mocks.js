const fs = require('fs');
const path = require('path');

const dir = 'src/pages/seguridad';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace mock arrays
  content = content.replace(/const (mock\w+)\s*=\s*\[[\s\S]*?\];/g, 'const $1: any[] = [];');
  
  // Replace data arrays (like in Indicadores)
  content = content.replace(/const (data\w+)\s*=\s*\[[\s\S]*?\];/g, 'const $1: any[] = [];');

  // Zero out standard 2xl KPI numbers
  content = content.replace(/(<p className="text-2xl font-bold[^>]*>)[^<]+(<\/p>)/g, '$10$2');
  
  // Zero out standard 3xl KPI numbers (in Indicadores)
  content = content.replace(/(<h3 className="text-3xl font-bold[^>]*>)[^<]+(<\/h3>)/g, '$10$2');

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log("Mocks cleared.");
