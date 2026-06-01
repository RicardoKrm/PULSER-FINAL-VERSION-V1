import fs from 'fs';
import path from 'path';

const file = path.resolve('src/pages/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const COLORS')) {
  // Add COLORS back somewhere near the top imports
  content = content.replace("export default function Dashboard() {", "const COLORS = ['#3b82f6', '#ef4444'];\n\nexport default function Dashboard() {");
  fs.writeFileSync(file, content);
  console.log("Added COLORS");
} else {
  console.log("COLORS already exists");
}
