const fs = require('fs');
let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

const targetStr = `                    } else {
                       Swal.fire("Error", "No se pudo actualizar", "error");
                    }
                 }
               }}
             >
               Guardar Cambios
             </Button>`;

const repStr = `                    } else {
                       Swal.fire("Error", "No se pudo actualizar", "error");
                    }
                    } catch(e) {
                      console.error(e);
                      Swal.fire("Error", "Error al actualizar", "error");
                    } finally {
                      setIsUpdatingRepuesto(false);
                    }
                 }
               }}
             >
               {isUpdatingRepuesto ? 'Guardando...' : 'Guardar Cambios'}
             </Button>`;

content = content.replace(targetStr, repStr);
fs.writeFileSync('src/pages/logistica/GestionSuministros.tsx', content);
console.log("Patched fixed Edit");
