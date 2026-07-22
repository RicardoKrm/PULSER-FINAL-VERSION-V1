const fs = require('fs');

let content = fs.readFileSync('src/pages/operaciones/produccion/ReporteYAnalitica.tsx', 'utf8');

// Add select options for date period
const selectTemplate = `              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors">
                <select
                  value={plazo}
                  onChange={(e) => handlePlazoChange(e.target.value)}
                  className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none py-1.5 px-3"
                >
                  <option value="hoy">Hoy</option>
                  <option value="ayer">Ayer</option>
                  <option value="esta_semana">Últimos 7 días</option>
                  <option value="este_mes">Este Mes</option>
                  <option value="mes_pasado">Mes Pasado</option>
                  <option value="este_ano">Este Año</option>
                  <option value="todos">Todos</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>`;

content = content.replace(
  /const \[dateRange, setDateRange\] = useState<\s*\{ start: string, end: string \}\s*>\(\{ start: '', end: '' \}\);/,
  `const [dateRange, setDateRange] = useState<{ start: string, end: string }>({ start: '', end: '' });\n  const [plazo, setPlazo] = useState<string>('todos');`
);

content = content.replace(
  /const fetchData = async \(\) => \{/,
  `const handlePlazoChange = (nuevoPlazo: string) => {
    setPlazo(nuevoPlazo);
    
    const hoy = new Date();
    let start = '';
    let end = '';

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return \`\${year}-\${month}-\${day}\`;
    };

    if (nuevoPlazo === 'hoy') {
      start = formatDate(hoy);
      end = formatDate(hoy);
    } else if (nuevoPlazo === 'ayer') {
      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);
      start = formatDate(ayer);
      end = formatDate(ayer);
    } else if (nuevoPlazo === 'esta_semana') {
      const sieteDiasAtras = new Date(hoy);
      sieteDiasAtras.setDate(hoy.getDate() - 7);
      start = formatDate(sieteDiasAtras);
      end = formatDate(hoy);
    } else if (nuevoPlazo === 'este_mes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      start = formatDate(inicioMes);
      end = formatDate(hoy);
    } else if (nuevoPlazo === 'mes_pasado') {
      const inicioMesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const finMesPasado = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      start = formatDate(inicioMesPasado);
      end = formatDate(finMesPasado);
    } else if (nuevoPlazo === 'este_ano') {
      const inicioAno = new Date(hoy.getFullYear(), 0, 1);
      start = formatDate(inicioAno);
      end = formatDate(hoy);
    }

    setDateRange({ start, end });
  };

  const fetchData = async () => {`
);

content = content.replace(
  /onChange=\{e => setDateRange\(\{ \.\.\.dateRange, start: e\.target\.value \}\)\}/,
  `onChange={e => {\n                      setDateRange({ ...dateRange, start: e.target.value });\n                      setPlazo('personalizado');\n                    }}`
);

content = content.replace(
  /onChange=\{e => setDateRange\(\{ \.\.\.dateRange, end: e\.target\.value \}\)\}/,
  `onChange={e => {\n                      setDateRange({ ...dateRange, end: e.target.value });\n                      setPlazo('personalizado');\n                    }}`
);

content = content.replace(
  /onClick=\{\(\) => setDateRange\(\{start: '', end: ''\}\)\}/,
  `onClick={() => {\n                        setDateRange({start: '', end: ''});\n                        setPlazo('todos');\n                      }}`
);

content = content.replace(
  /<div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pr-2 overflow-hidden transition-colors">/,
  `${selectTemplate}\n\n              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pr-2 overflow-hidden transition-colors">`
);

fs.writeFileSync('src/pages/operaciones/produccion/ReporteYAnalitica.tsx', content);

