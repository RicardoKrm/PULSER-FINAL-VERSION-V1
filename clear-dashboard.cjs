const fs = require('fs');
const path = require('path');

const filePath = 'src/pages/seguridad/DashboardSSO.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Reset KPI numbers
content = content.replace(/SSO Score: 94%/g, 'SSO Score: 0%');
content = content.replace(/<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">342<\/p>/g, '<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">0</p>');
content = content.replace(/<span className="text-green-600 font-medium">320 habilitados<\/span>/g, '<span className="text-green-600 font-medium">0 habilitados</span>');
content = content.replace(/<span className="text-red-500 font-medium">22 bloqueados<\/span>/g, '<span className="text-red-500 font-medium">0 bloqueados</span>');

content = content.replace(/<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">88%<\/p>/g, '<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">0%</p>');
content = content.replace(/<span className="text-green-600 font-medium">\+2%<\/span>/g, '<span className="text-green-600 font-medium">0%</span>');

content = content.replace(/<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">92%<\/p>/g, '<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">0%</p>');
content = content.replace(/<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">45<\/p>/g, '<p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">0</p>');

// Reset Alerts
content = content.replace(/12 Documentos vencidos/g, '0 Documentos vencidos');
content = content.replace(/3 Riesgos críticos sin control/g, '0 Riesgos críticos sin control');
content = content.replace(/5 Hallazgos vencidos/g, '0 Hallazgos vencidos');
content = content.replace(/24 Documentos por vencer/g, '0 Documentos por vencer');
content = content.replace(/8 Capacitaciones por expirar/g, '0 Capacitaciones por expirar');
content = content.replace(/4 Inspecciones pendientes/g, '0 Inspecciones pendientes');

// Reset Secondary Metrics
content = content.replace(/"font-bold text-gray-900 dark:text-white">1</g, '"font-bold text-gray-900 dark:text-white">0<');
content = content.replace(/"font-bold text-gray-900 dark:text-white">3</g, '"font-bold text-gray-900 dark:text-white">0<');
content = content.replace(/"font-bold text-gray-900 dark:text-white">2</g, '"font-bold text-gray-900 dark:text-white">0<');
content = content.replace(/"font-bold text-gray-900 dark:text-white">18</g, '"font-bold text-gray-900 dark:text-white">0<');
content = content.replace(/"font-bold text-gray-900 dark:text-white">24</g, '"font-bold text-gray-900 dark:text-white">0<');
content = content.replace(/"font-bold text-gray-900 dark:text-white">56</g, '"font-bold text-gray-900 dark:text-white">0<');

content = content.replace(/"font-bold text-green-600">96%/g, '"font-bold text-gray-500">0%');
content = content.replace(/"font-bold text-green-600">100%/g, '"font-bold text-gray-500">0%');
content = content.replace(/"font-bold text-orange-500">82%/g, '"font-bold text-gray-500">0%');
content = content.replace(/"font-bold text-green-600">94%/g, '"font-bold text-gray-500">0%');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Dashboard cleared successfully.");
