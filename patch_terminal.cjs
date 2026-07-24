const fs = require('fs');
let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

const targetState = `  const [terminalItems, setTerminalItems] = useState<any[]>([]);`;
const replacementState = `  const [terminalItems, setTerminalItems] = useState<any[]>([]);
  const [isProcessingTerminal, setIsProcessingTerminal] = useState(false);`;

content = content.replace(targetState, replacementState);

const targetStart = `  const handleTerminalSubmit = async () => {
    if (!currentCompany?.id) return;
    if (terminalItems.length === 0) {
      Swal.fire("Error", "La lista de artículos está vacía", "error");
      return;
    }

    try {`;

const replacementStart = `  const handleTerminalSubmit = async () => {
    if (!currentCompany?.id) return;
    if (terminalItems.length === 0) {
      Swal.fire("Error", "La lista de artículos está vacía", "error");
      return;
    }

    setIsProcessingTerminal(true);
    try {`;

content = content.replace(targetStart, replacementStart);

const targetEnd = `      await loadData();
      setIsTerminalModalOpen(false);
      setTerminalItems([]);
      setTerminalForm({
        repuestoId: '', sku: '', nombre: '', bodegaId: '', tipoMovimiento: 'SALIDA', 
        cantidad: 1, solicitante: '', autorizador: '', destino: '', ubicacion: '', proveedorId: '', precioUnitario: 0
      });

    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Error al procesar", "error");
    }
  };`;

const replacementEnd = `      await loadData();
      setIsTerminalModalOpen(false);
      setTerminalItems([]);
      setTerminalForm({
        repuestoId: '', sku: '', nombre: '', bodegaId: '', tipoMovimiento: 'SALIDA', 
        cantidad: 1, solicitante: '', autorizador: '', destino: '', ubicacion: '', proveedorId: '', precioUnitario: 0
      });

    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Error al procesar", "error");
    } finally {
      setIsProcessingTerminal(false);
    }
  };`;

content = content.replace(targetEnd, replacementEnd);

const targetBtn = `<Button className="bg-[#10b981] hover:bg-[#059669] text-white" onClick={handleTerminalSubmit}>
                       Procesar Todo
                     </Button>`;
const replacementBtn = `<Button className="bg-[#10b981] hover:bg-[#059669] text-white" onClick={handleTerminalSubmit} disabled={isProcessingTerminal}>
                       {isProcessingTerminal ? 'Procesando...' : 'Procesar Todo'}
                     </Button>`;

content = content.replace(targetBtn, replacementBtn);

fs.writeFileSync('src/pages/logistica/GestionSuministros.tsx', content);
console.log("Patched Terminal");
