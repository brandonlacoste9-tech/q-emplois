// Manual testing guide for QWORKS

## Test Cases

### 1. French-First (Bill 96 Compliance)
- [ ] Default language is French when no preference is set
- [ ] French content appears on home page
- [ ] French navigation items (Accueil, Politique de confidentialité)
- [ ] Language switcher shows "English" option

### 2. Language Switching
- [ ] Clicking language switcher changes to English
- [ ] English content appears correctly
- [ ] Language preference persists across page reloads
- [ ] URL parameter ?lang=fr or ?lang=en works

### 3. Privacy Policy (Law 25 Compliance)
- [ ] Privacy policy accessible from navigation
- [ ] Policy includes all required sections:
  - Overview
  - Data collection
  - Data usage
  - User rights
  - Security measures
  - DPO contact information
  - Law 25 compliance statement
- [ ] Both French and English versions available

### 4. Consent Banner (Law 25 Compliance)
- [ ] Banner appears on first visit
- [ ] Banner shows in current language
- [ ] "Accept" button works
- [ ] "Reject" button works
- [ ] Banner disappears after selection
- [ ] Choice persists across page reloads

### 5. Content Quality
- [ ] French content is natural and well-written
- [ ] English content is equal quality to French
- [ ] No untranslated text visible
- [ ] All UI elements are translated

### 6. Responsive Design
- [ ] Mobile view works correctly
- [ ] Desktop view works correctly
- [ ] Navigation adapts to screen size
- [ ] Consent banner is readable on mobile

## Manual Testing Steps

1. Start the server:
   ```
   npm start
   ```

2. Test in browser:
   - Open http://localhost:3000
   - Verify French is default
   - Check consent banner
   - Navigate to privacy policy
   - Switch to English
   - Verify all translations work
   - Test on mobile size

3. Test with curl:
   ```bash
   # Default (should be French)
   curl http://localhost:3000/ | grep "Bienvenue"
   
   # English version
   curl "http://localhost:3000/?lang=en" | grep "Welcome"
   
   # Privacy policy French
   curl http://localhost:3000/privacy-policy | grep "Politique de confidentialité"
   
   # Privacy policy English
   curl "http://localhost:3000/privacy-policy?lang=en" | grep "Privacy Policy"
   ```

## Expected Results

✅ All content defaults to French
✅ Language switching works seamlessly
✅ Privacy policy is comprehensive and bilingual
✅ Consent banner appears and functions correctly
✅ All Bill 96 and Law 25 requirements are met
