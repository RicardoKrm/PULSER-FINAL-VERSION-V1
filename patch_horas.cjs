const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/HorasMaquinaPage.tsx', 'utf-8');

code = code.replace(
  `const [dateFilterType, setDateFilterType] = useState<'todos' | 'dia' | 'semana' | 'mes' | 'rango'>('todos');`,
  `const [dateFilterType, setDateFilterType] = useState<'todos' | 'dia' | 'semana' | 'mes' | 'rango'>('mes');`
);

code = code.replace(
  `const [selectedYear, setSelectedYear] = useState<number>(2026);`,
  `const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());`
);

code = code.replace(
  `const [dispoYear, setDispoYear] = useState<number>(2026);`,
  `const [dispoYear, setDispoYear] = useState<number>(new Date().getFullYear());`
);

code = code.replace(
  `const [dispoMonth, setDispoMonth] = useState<string>('todos');`,
  `const [dispoMonth, setDispoMonth] = useState<string>(String(new Date().getMonth() + 1));`
);

fs.writeFileSync('src/pages/produccion/HorasMaquinaPage.tsx', code);
