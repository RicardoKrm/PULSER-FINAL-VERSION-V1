const fs = require('fs');

let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

const regex = /const reader = new FileReader\(\);\s*reader\.onload = \(evt\) => \{[\s\S]*?reader\.readAsBinaryString\(file\);\n    if \(fileInputRef\.current\) fileInputRef\.current\.value = '';\n  \};/;

const newHandler = `const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellFormula: true, cellDates: true, cellStyles: true });
        
        let targetSheetData: any[][] | null = null;
        let headerRowIdx = -1;
        let headers: string[] = [];
        
        for (const sName of wb.SheetNames) {
            const ws = wb.Sheets[sName];
            if (!ws) continue;
            
            if (ws['!merges']) {
              ws['!merges'].forEach(merge => {
                const startCol = merge.s.c;
                const endCol = merge.e.c;
                const startRow = merge.s.r;
                const endRow = merge.e.r;
                const refCell = XLSX.utils.encode_cell({ r: startRow, c: startCol });
                const val = ws[refCell] ? ws[refCell].v : undefined;
                for (let R = startRow; R <= endRow; ++R) {
                  for (let C = startCol; C <= endCol; ++C) {
                    const cell = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cell]) {
                      ws[cell] = { t: 's', v: val };
                    } else if (ws[cell].v === undefined) {
                      ws[cell].v = val;
                    }
                  }
                }
              });
            }

            const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as any[][];
            
            for (let i = 0; i < Math.min(20, jsonData.length); i++) {
                const rowStr = jsonData[i].map(c => String(c||'')).join(' ').toUpperCase();
                if (rowStr.includes('PRODUCCION_IMPERIA') || rowStr.includes('SUPERVISOR')) {
                    headerRowIdx = i;
                    headers = jsonData[i].map(h => String(h || '').toUpperCase().trim());
                    targetSheetData = jsonData;
                    break;
                }
            }
            if (targetSheetData) break;
        }

        if (!targetSheetData) {
            throw new Error("No se encontró una hoja válida con las columnas 'PRODUCCION_IMPERIA' o 'SUPERVISOR'. Hojas: " + wb.SheetNames.join(', '));
        }

        const findCol = (keywords: string[], defaultIdx: number) => {
          if (!headers || headers.length === 0) return defaultIdx;
          if (keywords.length === 1) {
             const exactIdx = headers.findIndex(h => h === keywords[0] || h === keywords[0].replace(/_/g, ' '));
             if (exactIdx !== -1) return exactIdx;
          }
          const combined = keywords.join('_');
          const exactCombIdx = headers.findIndex(h => h === combined || h === combined.replace(/_/g, ' '));
          if (exactCombIdx !== -1) return exactCombIdx;
          
          const subIdx = headers.findIndex(h => keywords.every(kw => h.includes(kw)));
          if (subIdx !== -1) return subIdx;
          
          if (keywords.length === 2 && (keywords[0].includes('DIA') || keywords[0].includes('NOCHE'))) {
              const baseKw = keywords[1];
              const matches = headers.map((h, i) => h.includes(baseKw) ? i : -1).filter(i => i !== -1);
              if (matches.length > 0) {
                 if (keywords[0].includes('NOCHE') && matches.length > 1) {
                    return matches[1]; 
                 }
                 return matches[0]; 
              }
          }
          return defaultIdx;
        };

        const colDia = findCol(['DIA'], 0);
        const colSup = findCol(['SUPERVISOR', 'DIA'], 1);
        const colDiaMes = findCol(['SUPERVISOR', 'NOCHE'], 2);

        const d_cant_caex = findCol(['TURNO_DIA', 'CANTIDAD_CAEX'], 3);
        const d_caex = findCol(['TURNO_DIA', 'CAEX'], 4);
        const d_operadores = findCol(['TURNO_DIA', 'OPERADORES'], 5);
        const d_acopio = findCol(['TURNO_DIA', 'ACOPIO'], 6);
        const d_caex_acopio = findCol(['TURNO_DIA', 'CAEX_ACOPIO'], 7);
        const d_planta = findCol(['TURNO_DIA', 'PLANTA'], 8);
        const d_caex_planta = findCol(['TURNO_DIA', 'CAEX_PLANTA'], 9);
        const d_vueltas = findCol(['TURNO_DIA', 'VUELTAS'], 10);
        const d_pases_cf = findCol(['TURNO_DIA', 'PASES_CF'], 11);
        const d_pases_totales = findCol(['TURNO_DIA', 'PASES_TOTALES'], 12);
        const d_toneladas = findCol(['TURNO_DIA', 'TONELADAS'], 13);
        const d_equipo_cf = findCol(['TURNO_DIA', 'EQUIPO_CF'], 14);
        const d_prod_imperia = findCol(['TURNO_DIA', 'PRODUCCION_IMPERIA'], 15);
        const d_prod_ajustada = findCol(['TURNO_DIA', 'PRODUCCION_AJUSTADA'], 16);
        const d_prod_cmc = findCol(['TURNO_DIA', 'PRODUCCION_CMC'], 17);
        const d_traspasos = findCol(['TURNO_DIA', 'TRASPASOS'], 18);

        const n_cant_caex = findCol(['TURNO_NOCHE', 'CANTIDAD_CAEX'], 19);
        const n_caex = findCol(['TURNO_NOCHE', 'CAEX'], 20);
        const n_operadores = findCol(['TURNO_NOCHE', 'OPERADORES'], 21);
        const n_acopio = findCol(['TURNO_NOCHE', 'ACOPIO'], 22);
        const n_caex_acopio = findCol(['TURNO_NOCHE', 'CAEX_ACOPIO'], 23);
        const n_planta = findCol(['TURNO_NOCHE', 'PLANTA'], 24);
        const n_caex_planta = findCol(['TURNO_NOCHE', 'CAEX_PLANTA'], 25);
        const n_vueltas = findCol(['TURNO_NOCHE', 'VUELTAS'], 26);
        const n_pases_cf = findCol(['TURNO_NOCHE', 'PASES_CF'], 26); // fallback
        const n_pases_totales = findCol(['TURNO_NOCHE', 'PASES_TOTALES'], 27);
        const n_toneladas = findCol(['TURNO_NOCHE', 'TONELADAS'], 28);
        const n_equipo_cf = findCol(['TURNO_NOCHE', 'EQUIPO_CF'], 28); // fallback
        const n_prod_ajustada = findCol(['TURNO_NOCHE', 'PRODUCCION_AJUSTADA'], 29);
        const n_prod_cmc = findCol(['TURNO_NOCHE', 'PRODUCCION_CMC'], 30);
        const n_traspasos = findCol(['TURNO_NOCHE', 'TRASPASOS'], 31);
        const n_prod_imperia = findCol(['TURNO_NOCHE', 'PRODUCCION_IMPERIA'], 27);

        const t_imperia = findCol(['TOTAL_PRODUCCION_IMPERIA'], 32);
        const t_cmc = findCol(['TOTAL_PRODUCCION_CMC'], 33);
        const t_dif = findCol(['DIFERENCIA_CMC_IMPERIA'], 34);

        let dataStartRow = headerRowIdx + 1;
        for (let i = headerRowIdx + 1; i < Math.min(headerRowIdx + 15, targetSheetData.length); i++) {
           if (targetSheetData[i][colDia] == 1 || String(targetSheetData[i][colDia]).trim() === '1' || targetSheetData[i][colDia] === 1) {
             dataStartRow = i;
             break;
           }
        }
        
        const targetRows = targetSheetData.slice(dataStartRow, dataStartRow + 31);
        
        if (targetRows.length === 0) {
          throw new Error("La hoja no contiene datos en las filas esperadas (Día 1 al 31).");
        }

        let lastPozo = '';
        let lastSubPozo = '';

        const processed: ProcessedRow[] = targetRows.map((row, index) => {
          let supervisor = row[colSup] !== null && row[colSup] !== undefined ? String(row[colSup]).trim() : lastPozo;
          let dia_mes = row[colDiaMes] !== null && row[colDiaMes] !== undefined ? String(row[colDiaMes]).trim() : lastSubPozo;
          
          if (row[colSup] !== null && row[colSup] !== undefined && String(row[colSup]).trim() !== '') lastPozo = supervisor;
          if (row[colDiaMes] !== null && row[colDiaMes] !== undefined && String(row[colDiaMes]).trim() !== '') lastSubPozo = dia_mes;

          const getNum = (val: any) => {
            if (val === null || val === undefined || val === '') return 0;
            if (typeof val === 'number') return isNaN(val) ? 0 : val;
            if (typeof val === 'string') {
               let cleanStr = val.trim();
               if (cleanStr.includes(',') && cleanStr.includes('.')) {
                  if (cleanStr.lastIndexOf(',') > cleanStr.lastIndexOf('.')) {
                     cleanStr = cleanStr.replace(/\\./g, '').replace(/,/g, '.');
                  } else {
                     cleanStr = cleanStr.replace(/,/g, '');
                  }
               } else if (cleanStr.includes(',')) {
                  cleanStr = cleanStr.replace(/,/g, '.');
               }
               const parsed = Number(cleanStr);
               return isNaN(parsed) ? 0 : parsed;
            }
            if (typeof val === 'object' && val !== null) {
                if (val.v !== undefined) {
                    const parsed = Number(val.v);
                    return isNaN(parsed) ? 0 : parsed;
                }
            }
            return 0;
          };

          return {
            dia: index + 1,
            supervisor,
            dia_mes,
            cantidad_caex_dia: getNum(row[d_cant_caex]),
            caex_dia: getNum(row[d_caex]),
            operadores_dia: getNum(row[d_operadores]),
            acopio_dia: getNum(row[d_acopio]),
            caex_acopio_dia: getNum(row[d_caex_acopio]),
            planta_dia: getNum(row[d_planta]),
            caex_planta_dia: getNum(row[d_caex_planta]),
            vueltas_dia: getNum(row[d_vueltas]),
            pases_cf_dia: getNum(row[d_pases_cf]),
            pases_totales_dia: getNum(row[d_pases_totales]),
            toneladas_caex_dia: getNum(row[d_toneladas]),
            equipo_cf_dia: row[d_equipo_cf] ? String(row[d_equipo_cf]) : '',
            produccion_dia: getNum(row[d_prod_imperia]),
            produccion_cmc_dia: getNum(row[d_prod_cmc]),
            traspasos_dia: getNum(row[d_traspasos]),
            cantidad_caex_noche: getNum(row[n_cant_caex]),
            caex_noche: getNum(row[n_caex]),
            operadores_noche: getNum(row[n_operadores]),
            acopio_noche: getNum(row[n_acopio]),
            caex_acopio_noche: getNum(row[n_caex_acopio]),
            planta_noche: getNum(row[n_planta]),
            caex_planta_noche: getNum(row[n_caex_planta]),
            vueltas_noche: getNum(row[n_vueltas]),
            pases_cf_noche: getNum(row[n_pases_cf]),
            pases_totales_noche: getNum(row[n_pases_totales]),
            toneladas_caex_noche: getNum(row[n_toneladas]),
            equipo_cf_noche: row[n_equipo_cf] ? String(row[n_equipo_cf]) : '',
            produccion_caex_noche: getNum(row[n_prod_ajustada]),
            produccion_noche: getNum(row[n_prod_imperia]),
            traspasos_noche: getNum(row[n_traspasos]),
            total_imperia: getNum(row[t_imperia]),
            total_cmc: getNum(row[t_cmc]),
            diferencia: getNum(row[t_dif]),
            raw: row
          };
        });

        setData(processed);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error procesando el archivo.");
        alert("Error: " + (err.message || "Error procesando el archivo."));
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Error leyendo el archivo.");
      setLoading(false);
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };`

code = code.replace(regex, newHandler);
fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
