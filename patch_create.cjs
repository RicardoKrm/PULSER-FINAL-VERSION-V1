const fs = require('fs');
let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

const targetState = `  // States for New Repuesto (Nuevo)
  const [isNewRepuestoModalOpen, setIsNewRepuestoModalOpen] = useState(false);`;

const replacementState = `  // States for New Repuesto (Nuevo)
  const [isNewRepuestoModalOpen, setIsNewRepuestoModalOpen] = useState(false);
  const [isCreatingRepuesto, setIsCreatingRepuesto] = useState(false);`;

content = content.replace(targetState, replacementState);

const targetButton = `            <Button 
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={!newRepuestoForm.nombre || !newRepuestoForm.numeroParte}
              onClick={async () => {
                const provName = proveedores.find(p => p.id === newRepuestoForm.proveedorId)?.nombre || newRepuestoForm.proveedorId || "--";`;

const replacementButton = `            <Button 
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              disabled={!newRepuestoForm.nombre || !newRepuestoForm.numeroParte || isCreatingRepuesto}
              onClick={async () => {
                setIsCreatingRepuesto(true);
                const provName = proveedores.find(p => p.id === newRepuestoForm.proveedorId)?.nombre || newRepuestoForm.proveedorId || "--";`;

content = content.replace(targetButton, replacementButton);

const targetFinally = `                  setNewRepuestoForm({
                    nombre: '', numeroParte: '', calidad: 'ORIGINAL', origen: 'OEM', 
                    nivelCriticidad: 'INSUMO', categoria: 'General', stockActual: 0, stockMinimo: 0, 
                    diasStockObjetivo: 30, ubicacion: '', precioUnitario: 0, bodegaId: '1', proveedorId: ''
                  });
                } catch (e) {
                  console.error(e);
                  Swal.fire("Error", "Error al intentar guardar el repuesto.", "error");
                }
              }}
            >
              Guardar Repuesto
            </Button>`;

const replacementFinally = `                  setNewRepuestoForm({
                    nombre: '', numeroParte: '', calidad: 'ORIGINAL', origen: 'OEM', 
                    nivelCriticidad: 'INSUMO', categoria: 'General', stockActual: 0, stockMinimo: 0, 
                    diasStockObjetivo: 30, ubicacion: '', precioUnitario: 0, bodegaId: '1', proveedorId: ''
                  });
                } catch (e) {
                  console.error(e);
                  Swal.fire("Error", "Error al intentar guardar el repuesto.", "error");
                } finally {
                  setIsCreatingRepuesto(false);
                }
              }}
            >
              {isCreatingRepuesto ? 'Guardando...' : 'Guardar Repuesto'}
            </Button>`;

content = content.replace(targetFinally, replacementFinally);

fs.writeFileSync('src/pages/logistica/GestionSuministros.tsx', content);
console.log("Patched Create Button");
