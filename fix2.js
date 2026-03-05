const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/LandingPage.tsx', 'utf8').split('\n');
const start = code.findIndex(l => l.includes(' WHATSAPP ICON '));
if (start !== -1) code.splice(start, 7);
code[0] = 'import { useState } from \"react\";';
fs.writeFileSync('frontend/src/pages/LandingPage.tsx', code.join('\n'));
