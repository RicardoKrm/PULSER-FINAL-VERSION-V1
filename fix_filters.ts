import fs from 'fs';

const path = 'src/pages/operaciones/produccion/ReporteYAnaliticaMina.tsx';
let code = fs.readFileSync(path, 'utf8');

// Update filteredData
code = code.replace(
  /const passTurno = filtroTurno === 'todos' \|\| row.turno === filtroTurno;/,
  `const passTurno = filtroTurno === 'todos' || row.turno === filtroTurno;
      const passEquipo = filtroEquipo === 'todos' || row.equipo === filtroEquipo;
      
      // Para supervisor, si row.equipo === SUPERVISOR_TURNO, el operador es el supervisor.
      // Pero si queremos filtrar *toda la producción* de ese supervisor, necesitamos mapearlo.
      // Simplificaremos permitiendo filtrar por operador si no tenemos la info completa.
      const passSupervisor = filtroSupervisor === 'todos' || row.operador === filtroSupervisor;`
);

code = code.replace(
  /return passAno && passMes && passTurno;/,
  `return passAno && passMes && passTurno && passEquipo && passSupervisor;`
);

code = code.replace(
  /\[rawData, filtroAno, filtroMes, filtroTurno\]/,
  `[rawData, filtroAno, filtroMes, filtroTurno, filtroEquipo, filtroSupervisor]`
);

// Add selects in UI
const selectHtml = `
          <select 
            value={filtroEquipo} 
            onChange={(e) => setFiltroEquipo(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="todos">Todos los equipos</option>
            {Array.from(new Set(rawData.filter(r => r.equipo && !['REPORTE_COMPAÑIA', 'SUPERVISOR_TURNO'].includes(r.equipo)).map(r => r.equipo))).sort().map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <select 
            value={filtroSupervisor} 
            onChange={(e) => setFiltroSupervisor(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="todos">Todos los operadores/sup</option>
            {Array.from(new Set(rawData.filter(r => r.operador).map(r => r.operador))).sort().map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
`;

code = code.replace(
  /<select \n            value=\{filtroTurno\}/,
  selectHtml + `\n          <select \n            value={filtroTurno}`
);

fs.writeFileSync(path, code);
