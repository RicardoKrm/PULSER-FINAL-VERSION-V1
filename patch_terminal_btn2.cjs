const fs = require('fs');
let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

const targetStr = `            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white px-8"
              onClick={handleTerminalSubmit}
              disabled={terminalItems.length === 0}
            >
              Procesar Movimientos ({terminalItems.length})
            </Button>`;

const repStr = `            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white px-8"
              onClick={handleTerminalSubmit}
              disabled={terminalItems.length === 0 || isProcessingTerminal}
            >
              {isProcessingTerminal ? 'Procesando...' : \`Procesar Movimientos (\${terminalItems.length})\`}
            </Button>`;

content = content.replace(targetStr, repStr);
fs.writeFileSync('src/pages/logistica/GestionSuministros.tsx', content);
console.log("Patched Terminal Button");
