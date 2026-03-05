const fs = require('fs');

let qLines = fs.readFileSync('frontend/src/pages/QJobsPage.tsx', 'utf8').split('\n');

const qEmpireSplitStart = qLines.findIndex(l => l.includes('NOUVEAU: LE PORTAIL'));
const qHeroStart = qLines.findIndex(l => l.includes(' HERO '));

if (qEmpireSplitStart !== -1 && qHeroStart !== -1) {
    qLines.splice(qEmpireSplitStart - 1, qHeroStart - qEmpireSplitStart);
}

let code = qLines.join('\n');
const map = {
  '├⌐': 'é',
  '├¿': 'è',
  '├╣': 'ù',
  '├á': 'à',
  '├º': 'ç',
  '├¬': 'ê',
  '├ë': 'É',
  'ΓÇö': '—',
  '≡ƒÜÜ': '🚚',
  '≡ƒì╜∩╕Å': '🍽️',
  '≡ƒÆ╗': '💻',
  '≡ƒöº': '🔧',
  '≡ƒÄô': '🎓',
  '≡ƒÆ¬': '💪',
  '≡ƒô¥': '📝',
  '≡ƒöì': '🔍',
  '≡ƒôà': '📅',
  '≡ƒÆ░': '💰',
  '≡ƒôª': '📦',
  '≡ƒì»': '🍀',
  'Γ£à': '✅',
  '┬⌐': '©',
  'ΓÜ£': '⚜',
  '≡ƒñû': '🤖',
  'ΓùÅ': '●'
};
for (const [bad, good] of Object.entries(map)) {
  code = code.split(bad).join(good);
}
fs.writeFileSync('frontend/src/pages/QJobsPage.tsx', code, 'utf8');
