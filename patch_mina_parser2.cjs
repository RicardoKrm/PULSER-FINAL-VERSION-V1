const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

const newFindCol = `        // Helper to find column index by partial match
        const findCol = (keywords: string[], defaultIdx: number) => {
          if (!headers || headers.length === 0) return defaultIdx;
          
          // Try exact match first for single keywords
          if (keywords.length === 1) {
             const exactIdx = headers.findIndex(h => h === keywords[0] || h === keywords[0].replace(/_/g, ' '));
             if (exactIdx !== -1) return exactIdx;
          }

          // Try exact combined match
          const combined = keywords.join('_');
          const exactCombIdx = headers.findIndex(h => h === combined || h === combined.replace(/_/g, ' '));
          if (exactCombIdx !== -1) return exactCombIdx;

          // Try substring match
          for (let i = 0; i < headers.length; i++) {
             const h = headers[i];
             if (keywords.every(kw => h.includes(kw))) {
               return i;
             }
          }
          return defaultIdx;
        };`;

code = code.replace(
  /\/\/ Helper to find column index by partial match[\s\S]*?return defaultIdx;\n        };/m,
  newFindCol
);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
