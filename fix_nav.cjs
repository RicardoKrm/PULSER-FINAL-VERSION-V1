const fs = require('fs');
let code = fs.readFileSync('src/config/navigation.ts', 'utf-8');

const oldSubmodules = `    submodules: [
      { title: 'Dashboard de Producción', icon: BarChart3, href: '/produccion/dashboard' },
      { title: 'Horas Máquina y Disponibilidad', icon: Clock, href: '/produccion/horas-maquina' },
      { title: 'Reportes Diarios Transporte', icon: Truck, href: '/produccion/reportes-transporte' },
      { title: 'Reportes Diarios Mina', icon: PenTool, href: '/produccion/reportes-mina' },
      { title: 'Planificador Transporte', icon: CalendarClock, href: '/produccion/planificador' },
      { title: 'Resumen Mensual Mina', icon: FileSpreadsheet, href: '/produccion/resumen-mensual-mina' },
      { title: 'Trazabilidad', icon: History, href: '/produccion/trazabilidad' },
    ],`;

const newSubmodules = `    submodules: [
      { title: 'Dashboard de Producción', icon: BarChart3, href: '/produccion/dashboard' },
      { title: 'Reportes Diarios Transporte', icon: Truck, href: '/produccion/reportes-transporte' },
      { title: 'Reportes Diarios Mina', icon: PenTool, href: '/produccion/reportes-mina' },
      { title: 'Resumen Mensual Mina', icon: FileSpreadsheet, href: '/produccion/resumen-mensual-mina' },
      { title: 'Horas Máquina y Disponibilidad', icon: Clock, href: '/produccion/horas-maquina' },
      { title: 'Planificador Transporte', icon: CalendarClock, href: '/produccion/planificador' },
      { title: 'Trazabilidad', icon: History, href: '/produccion/trazabilidad' },
    ],`;

code = code.replace(oldSubmodules, newSubmodules);
fs.writeFileSync('src/config/navigation.ts', code);
