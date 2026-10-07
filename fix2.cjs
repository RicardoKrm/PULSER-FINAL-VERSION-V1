const fs = require('fs');

const path = 'src/pages/operaciones/ControlDocumental.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the specific malformed strings using exact matches
content = content.replace(
  'reasons.push(Licencia próxima a vencer (<+alertConfig.diasAvisoLicencia+ días));',
  'reasons.push(`Licencia próxima a vencer (<${alertConfig.diasAvisoLicencia} días)`);'
);

content = content.replace(
  'reasons.push(Salud próxima a vencer (<+alertConfig.diasAvisoSalud+ días));',
  'reasons.push(`Salud próxima a vencer (<${alertConfig.diasAvisoSalud} días)`);'
);

content = content.replace(
  'reasons.push(Bloqueo automático: Unidad cumple 15+ años);',
  'reasons.push(`Bloqueo automático: Unidad cumple 15+ años`);'
);

content = content.replace(
  'reasons.push(Revisión próxima a vencer (<+alertConfig.diasAvisoRevision+ días));',
  'reasons.push(`Revisión próxima a vencer (<${alertConfig.diasAvisoRevision} días)`);'
);

content = content.replace(
  'reasons.push(Seguro próximo a vencer (<+alertConfig.diasAvisoSeguro+ días));',
  'reasons.push(`Seguro próximo a vencer (<${alertConfig.diasAvisoSeguro} días)`);'
);

fs.writeFileSync(path, content, 'utf8');
