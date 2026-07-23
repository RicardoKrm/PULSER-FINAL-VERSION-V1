const fs = require('fs');

let content = fs.readFileSync('src/pages/logistica/GestionSuministros.tsx', 'utf-8');

const target1 = "const [terminalForm, setTerminalForm] = useState({";
const idx1 = content.indexOf(target1);
console.log("Found terminalForm:", idx1);

const target2 = "const handleTerminalSubmit = async () => {";
const idx2 = content.indexOf(target2);
console.log("Found handleTerminalSubmit:", idx2);

const target3 = "const handleExportSelected = () => {";
const idx3 = content.indexOf(target3);
console.log("Found handleExportSelected:", idx3);

