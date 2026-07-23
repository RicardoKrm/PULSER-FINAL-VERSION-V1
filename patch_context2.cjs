const fs = require('fs');

let content = fs.readFileSync('src/contexts/ProduccionContext.tsx', 'utf8');

content = content.replace(
  /export interface GlobalStats \{[\s\S]*?\}/g,
  `export interface GlobalStats {
  rajoTotal: number;
  millingTotal: number;
  stockpile: number;
  transported: number;
  transporteTotal: number;
  dispatchesCount: number;
  arrivedCount: number;
  inTransitCount: number;
  alertsCount: number;
}`
);

fs.writeFileSync('src/contexts/ProduccionContext.tsx', content);

