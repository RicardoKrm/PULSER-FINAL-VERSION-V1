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

          // Try exact combined match (e.g. TURNO_NOCHE_PRODUCCION_IMPERIA)
          const combined = keywords.join('_');
          const exactCombIdx = headers.findIndex(h => h === combined || h === combined.replace(/_/g, ' '));
          if (exactCombIdx !== -1) return exactCombIdx;

          // Try substring match (must contain all keywords)
          const subIdx = headers.findIndex(h => keywords.every(kw => h.includes(kw)));
          if (subIdx !== -1) return subIdx;
          
          // Fallback: If keywords has 2 items like ['TURNO_NOCHE', 'PRODUCCION_IMPERIA'], 
          // and we couldn't find 'TURNO_NOCHE', maybe the headers are just 'PRODUCCION_IMPERIA'.
          // We can find the 1st or 2nd occurrence depending on if it's Dia or Noche.
          if (keywords.length === 2 && (keywords[0].includes('DIA') || keywords[0].includes('NOCHE'))) {
              const baseKw = keywords[1];
              const matches = headers.map((h, i) => h.includes(baseKw) ? i : -1).filter(i => i !== -1);
              if (matches.length > 0) {
                 if (keywords[0].includes('NOCHE') && matches.length > 1) {
                    return matches[1]; // second occurrence is usually Noche
                 }
                 return matches[0]; // first occurrence is Dia
              }
          }

          return defaultIdx;
        };`;

code = code.replace(
  /\/\/ Helper to find column index by partial match[\s\S]*?return defaultIdx;\n        };/m,
  newFindCol
);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
