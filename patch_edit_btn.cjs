const fs = require('fs');
let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

const targetState = `  const [isEditRepuestoModalOpen, setIsEditRepuestoModalOpen] = useState(false);`;
const replacementState = `  const [isEditRepuestoModalOpen, setIsEditRepuestoModalOpen] = useState(false);
  const [isUpdatingRepuesto, setIsUpdatingRepuesto] = useState(false);`;

content = content.replace(targetState, replacementState);

const targetBtn = `             <Button 
               className="bg-[#10b981] hover:bg-[#059669] text-white"
               onClick={async () => {
                 if (editRepuestoObj) {
                    const originalObj = sumInsumosData.find(r => r.id === editRepuestoObj.id);`;

const replacementBtn = `             <Button 
               className="bg-[#10b981] hover:bg-[#059669] text-white"
               disabled={isUpdatingRepuesto}
               onClick={async () => {
                 if (editRepuestoObj) {
                    setIsUpdatingRepuesto(true);
                    try {
                    const originalObj = sumInsumosData.find(r => r.id === editRepuestoObj.id);`;

content = content.replace(targetBtn, replacementBtn);

const targetEnd = `                    setIsEditRepuestoModalOpen(false);
                    Swal.fire("Éxito", "Repuesto actualizado", "success");
                 }
               }}
             >
                Guardar Cambios
             </Button>`;

const replacementEnd = `                    setIsEditRepuestoModalOpen(false);
                    Swal.fire("Éxito", "Repuesto actualizado", "success");
                    } catch (e) {
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

content = content.replace(targetEnd, replacementEnd);

fs.writeFileSync('src/pages/logistica/GestionSuministros.tsx', content);
console.log("Patched Edit Button");
