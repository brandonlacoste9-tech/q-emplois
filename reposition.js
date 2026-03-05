const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/LandingPage.tsx', 'utf8');

const sIdx = code.indexOf('{/* ─── NOUVEAU: LE PORTAIL DE L\\'EMPIRE ─── */}');
const eIdx = code.indexOf('{/* ─── HERO ─── */}');

if (sIdx !== -1 && eIdx !== -1) {
    const portalHTML = code.substring(sIdx, eIdx);
    code = code.replace(portalHTML, '');
    
    // find 'WHATSAPP / MAX' insert point
    const insertIdx = code.indexOf('{/* ─── WHATSAPP / MAX ─── */}');
    if (insertIdx !== -1) {
        code = code.substring(0, insertIdx) + portalHTML + '\n\n      ' + code.substring(insertIdx);
    }
    fs.writeFileSync('frontend/src/pages/LandingPage.tsx', code, 'utf8');
}
