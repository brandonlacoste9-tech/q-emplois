# QWORKS

Launch a localized gig platform (like TaskRabbit) tailored for Québec's French-speaking majority, ensuring full compliance with Bill 96 (language) and Law 25 (privacy) while capitalizing on the lack of such offerings in the market.

## 🇨🇦 French-First, Québec-Compliant Marketplace

### Why QWORKS?

- **77% of Québec residents** list French as their mother-tongue and **90% speak it at home** – a huge, under-served French-only market
- **Bill 96 Compliance**: The Charter of the French language obliges any business offering products or services in Québec to provide a French version of its website that is at least equal in quality to any other language
- **Law 25 Compliance**: Québec's privacy law requires clear consent, a public privacy policy, and a data-protection officer for any service handling Québec residents' personal data
- Existing gig-platforms (TaskRabbit, Uber Works) are either English-first or have no Québec-specific localization

## 🚀 Features

### Language Support (Bill 96)
- ✅ **French as primary language** - defaults to French for all users
- ✅ **Equal quality bilingual content** - French and English versions of all content
- ✅ **Automatic language detection** - respects browser preferences with French as default
- ✅ **Language switcher** - easy toggle between French and English
- ✅ **Persistent language preference** - saves user's choice via cookies

### Privacy Compliance (Law 25)
- ✅ **Clear consent mechanism** - cookie consent banner on first visit
- ✅ **Public privacy policy** - comprehensive policy in both languages
- ✅ **Data protection officer** - designated contact (dpo@qworks.quebec)
- ✅ **User rights** - access, correction, deletion, portability, withdrawal
- ✅ **Transparent data usage** - clear explanation of data collection and use

## 📦 Installation

### Prerequisites
- Node.js 14 or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/brandonlacoste9-tech/QWORKS.git
cd QWORKS
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## 🏗️ Project Structure

```
QWORKS/
├── server.js           # Express server with language detection
├── package.json        # Project dependencies
├── locales/
│   ├── fr.json        # French translations (primary)
│   └── en.json        # English translations
├── public/
│   └── css/
│       └── styles.css # Application styles
└── README.md          # This file
```

## 🌐 Language System

### How It Works

1. **Default to French**: All users see French content by default (Bill 96 compliance)
2. **Language Detection Priority**:
   - Query parameter (`?lang=en` or `?lang=fr`)
   - Cookie preference
   - Browser `Accept-Language` header
   - Default: French
3. **Persistent Choice**: Language preference saved in cookie for 1 year

### Translation Files

- `locales/fr.json` - Primary French content (full quality)
- `locales/en.json` - English content (equal quality)

## 🔒 Privacy & Compliance

### Law 25 Implementation

1. **Consent Banner**: Appears on first visit, requires explicit user action
2. **Privacy Policy**: Comprehensive policy covering:
   - Data collection practices
   - Usage of personal information
   - User rights under Law 25
   - Security measures
   - Contact information for Data Protection Officer

3. **Data Protection Officer**:
   - Email: dpo@qworks.quebec
   - Responsible for handling privacy requests

### User Rights

Users can:
- Access their personal information
- Request data correction
- Request data deletion
- Receive data in structured format
- Withdraw consent at any time

## 🎨 Design Principles

- **Québec Colors**: Blue (#0e4c92) and Green (#00a650)
- **Mobile-First**: Responsive design for all devices
- **Accessibility**: Clear contrast, readable fonts
- **User-Friendly**: Simple navigation, clear CTAs

## 📝 Legal Compliance

### Bill 96 (Charter of the French Language)
- French is the primary language of the website
- English version is available but secondary
- All content available in French with equal or superior quality

### Law 25 (Privacy Protection)
- Clear consent mechanisms implemented
- Public privacy policy available
- Data Protection Officer designated
- User rights clearly communicated
- Security measures in place

## 🚀 Deployment

### Environment Variables
```
PORT=3000  # Optional, defaults to 3000
```

### Production Deployment
```bash
npm start
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- French content maintains primary status
- All privacy features remain intact
- Bill 96 and Law 25 compliance is preserved

## 📞 Contact

**Data Protection Officer**: dpo@qworks.quebec

---

**Note**: This platform is specifically designed for the Québec market and prioritizes compliance with Québec laws (Bill 96 and Law 25).
# Q-emplois
Launch a localized gig platform (like TaskRabbit) tailored for Québec’s French-speaking majority, ensuring full compliance with Bill 96 (language) and Law 25 (privacy) while capitalizing on the lack of such offerings in the market.
