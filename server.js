const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load translations with error handling
let translations;
try {
  translations = {
    fr: JSON.parse(fs.readFileSync('./locales/fr.json', 'utf8')),
    en: JSON.parse(fs.readFileSync('./locales/en.json', 'utf8'))
  };
} catch (error) {
  console.error('Error loading translation files:', error.message);
  console.error('Please ensure locales/fr.json and locales/en.json exist');
  process.exit(1);
}

// Language detection middleware
app.use((req, res, next) => {
  // Priority: 1. Query param, 2. Cookie, 3. Accept-Language header, 4. Default to French (Bill 96)
  let lang = req.query.lang || req.cookies.lang;
  
  if (!lang) {
    const acceptLang = req.headers['accept-language'];
    if (acceptLang && acceptLang.includes('en') && !acceptLang.startsWith('fr')) {
      lang = 'en';
    } else {
      lang = 'fr'; // Default to French per Bill 96
    }
  }
  
  // Validate language
  lang = (lang === 'en' || lang === 'fr') ? lang : 'fr';
  
  // Set cookie for 1 year
  res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
  
  // Make language and translations available to all routes
  req.lang = lang;
  req.t = translations[lang];
  
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send(renderPage(req, 'home'));
});

app.get('/privacy-policy', (req, res) => {
  res.send(renderPage(req, 'privacy'));
});

app.post('/consent', (req, res) => {
  const { consent } = req.body;
  res.cookie('consent', consent, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: true });
  res.json({ success: true });
});

// Helper function to render pages
function renderPage(req, pageName) {
  const t = req.t;
  const lang = req.lang;
  const otherLang = lang === 'fr' ? 'en' : 'fr';
  const hasConsent = req.cookies.consent;
  
  let content = '';
  
  if (pageName === 'home') {
    content = `
      <div class="hero">
        <h1>${t.hero.title}</h1>
        <p class="hero-subtitle">${t.hero.subtitle}</p>
        <div class="hero-buttons">
          <button class="btn btn-primary">${t.hero.findWork}</button>
          <button class="btn btn-secondary">${t.hero.hireWorker}</button>
        </div>
      </div>
      
      <section class="features">
        <h2>${t.features.title}</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <h3>${t.features.localFirst}</h3>
            <p>${t.features.localFirstDesc}</p>
          </div>
          <div class="feature-card">
            <h3>${t.features.compliant}</h3>
            <p>${t.features.compliantDesc}</p>
          </div>
          <div class="feature-card">
            <h3>${t.features.secure}</h3>
            <p>${t.features.secureDesc}</p>
          </div>
        </div>
      </section>
      
      <section class="compliance">
        <h2>${t.compliance.title}</h2>
        <p>${t.compliance.description}</p>
        <ul>
          <li>${t.compliance.bill96}</li>
          <li>${t.compliance.law25}</li>
        </ul>
      </section>
    `;
  } else if (pageName === 'privacy') {
    content = `
      <div class="privacy-policy">
        <h1>${t.privacy.title}</h1>
        <p class="effective-date">${t.privacy.effectiveDate}</p>
        
        <section>
          <h2>${t.privacy.overview.title}</h2>
          <p>${t.privacy.overview.content}</p>
        </section>
        
        <section>
          <h2>${t.privacy.collection.title}</h2>
          <p>${t.privacy.collection.intro}</p>
          <ul>
            <li>${t.privacy.collection.items.name}</li>
            <li>${t.privacy.collection.items.email}</li>
            <li>${t.privacy.collection.items.phone}</li>
            <li>${t.privacy.collection.items.location}</li>
            <li>${t.privacy.collection.items.services}</li>
          </ul>
        </section>
        
        <section>
          <h2>${t.privacy.usage.title}</h2>
          <p>${t.privacy.usage.intro}</p>
          <ul>
            <li>${t.privacy.usage.items.matching}</li>
            <li>${t.privacy.usage.items.communication}</li>
            <li>${t.privacy.usage.items.payment}</li>
            <li>${t.privacy.usage.items.improvement}</li>
            <li>${t.privacy.usage.items.legal}</li>
          </ul>
        </section>
        
        <section>
          <h2>${t.privacy.rights.title}</h2>
          <p>${t.privacy.rights.intro}</p>
          <ul>
            <li>${t.privacy.rights.items.access}</li>
            <li>${t.privacy.rights.items.correction}</li>
            <li>${t.privacy.rights.items.deletion}</li>
            <li>${t.privacy.rights.items.portability}</li>
            <li>${t.privacy.rights.items.withdraw}</li>
          </ul>
        </section>
        
        <section>
          <h2>${t.privacy.security.title}</h2>
          <p>${t.privacy.security.content}</p>
        </section>
        
        <section>
          <h2>${t.privacy.contact.title}</h2>
          <p>${t.privacy.contact.dpo}</p>
          <p>${t.privacy.contact.email}</p>
          <p>${t.privacy.contact.address}</p>
        </section>
        
        <section>
          <h2>${t.privacy.law25.title}</h2>
          <p>${t.privacy.law25.content}</p>
        </section>
      </div>
    `;
  }
  
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.site.title}</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <nav class="navbar">
    <div class="nav-container">
      <a href="/" class="logo">QWORKS</a>
      <div class="nav-links">
        <a href="/">${t.nav.home}</a>
        <a href="/privacy-policy">${t.nav.privacy}</a>
        <a href="?lang=${otherLang}" class="lang-switch">${otherLang === 'fr' ? 'Français' : 'English'}</a>
      </div>
    </div>
  </nav>
  
  <main class="container">
    ${content}
  </main>
  
  <footer>
    <div class="footer-container">
      <p>&copy; 2026 QWORKS. ${t.footer.rights}</p>
      <p>${t.footer.compliance}</p>
      <div class="footer-links">
        <a href="/privacy-policy">${t.nav.privacy}</a>
      </div>
    </div>
  </footer>
  
  ${!hasConsent ? `
  <div id="consent-banner" class="consent-banner">
    <div class="consent-content">
      <p>${t.consent.message}</p>
      <div class="consent-buttons">
        <button onclick="setConsent('accepted')" class="btn btn-primary">${t.consent.accept}</button>
        <button onclick="setConsent('rejected')" class="btn btn-secondary">${t.consent.reject}</button>
      </div>
    </div>
  </div>
  <script>
    function setConsent(value) {
      fetch('/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: value })
      }).then(() => {
        document.getElementById('consent-banner').style.display = 'none';
      });
    }
  </script>
  ` : ''}
</body>
</html>
  `;
}

// Start server
app.listen(PORT, () => {
  console.log(`QWORKS server running on port ${PORT}`);
  console.log(`French-first, Québec-compliant marketplace`);
});
