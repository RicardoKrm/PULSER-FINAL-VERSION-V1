const fs = require('fs');
let code = fs.readFileSync('src/pages/produccion/PruebaMina.tsx', 'utf-8');

code = code.replace(
  `        setLoading(false);\n      } catch (err: any) {\n        setError(err.message || "Error procesando el archivo.");\n        setLoading(false);\n      }`,
  `        setLoading(false);\n      } catch (err: any) {\n        console.error(err);\n        setError(err.message || "Error procesando el archivo.");\n        alert("Error: " + (err.message || "Error procesando el archivo. Revisa la consola para más detalles."));\n        setLoading(false);\n      }`
);

fs.writeFileSync('src/pages/produccion/PruebaMina.tsx', code);
