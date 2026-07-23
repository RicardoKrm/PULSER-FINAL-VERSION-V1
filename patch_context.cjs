const fs = require('fs');

let content = fs.readFileSync('src/contexts/ProduccionContext.tsx', 'utf8');

content = content.replace(
  /export interface MetasObjetivos \{\s*daily: number;\s*weekly: number;\s*monthly: number;\s*\}/g,
  `export interface MetasObjetivos {
  daily: number;
  weekly: number;
  monthly: number;
  minaDaily: number;
  minaMonthly: number;
  transporteDaily: number;
  transporteMonthly: number;
}`
);

content = content.replace(
  /const \[metas, setMetas\] = useState<MetasObjetivos>\(\{[\s\S]*?\}\);/g,
  `const [metas, setMetas] = useState<MetasObjetivos>({
    daily: 5000,
    weekly: 18000,
    monthly: 75000,
    minaDaily: 5000,
    minaMonthly: 75000,
    transporteDaily: 5000,
    transporteMonthly: 75000
  });`
);

fs.writeFileSync('src/contexts/ProduccionContext.tsx', content);

