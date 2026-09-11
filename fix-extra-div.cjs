const fs = require('fs');
const file = 'src/pages/produccion/ControlSanny.tsx';
let content = fs.readFileSync(file, 'utf8');

// I will remove the extraneous string
const extraHTML = `
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            {/* Keep grid layout but added S8 */}
`;

content = content.replace(extraHTML, "");

content = content.replace(
  /grid-cols-1 md:grid-cols-2 gap-4/g,
  "grid-cols-1 md:grid-cols-3 gap-4"
);

content = content.replace(
  /\{\(data\.s6\.length > 0 \|\| data\.s7\.length > 0\) && \(/g,
  "{(data.s6.length > 0 || data.s7.length > 0 || data.s8.length > 0) && ("
);

fs.writeFileSync(file, content);
console.log("Fixing extra div completed.");
