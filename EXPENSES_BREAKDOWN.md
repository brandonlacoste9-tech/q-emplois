# Q-EMPLOIS - Complete Expense Breakdown

**Last Updated**: February 28, 2026

---

## 💸 MONTHLY EXPENSES

### Fixed Platform Costs

| Item | Cost/Month | Provider | Notes |
|------|------------|----------|-------|
| **Server Hosting** | $200 | DigitalOcean/AWS | Kubernetes cluster |
| **Database (PostgreSQL)** | $100 | Managed service | With pgvector support |
| **Redis Cache** | $50 | Redis Cloud | Session & caching |
| **Monitoring** | $50 | Prometheus/Grafana | Uptime & alerts |
| **Domain & SSL** | $20 | Namecheap/Cloudflare | qemplois.ca + SSL cert |
| **Email Service** | $30 | SendGrid/Mailgun | Transactional emails |
| **CDN** | $25 | Cloudflare | Static assets |
| **Backup Storage** | $25 | AWS S3 | Database backups |
| **TOTAL FIXED** | **$500/month** | | **$6,000/year** |

### Per-Tasker Variable Costs

| Item | Cost | Frequency | Notes |
|------|------|-----------|-------|
| **Tier 1 Verification** | $1.50 | One-time (signup) | Certn ID check |
| **Database Storage** | $0.30 | Per month | Profile + task history |
| **Bandwidth** | $0.20 | Per month | API calls |
| **Support** | $1.00 | Per month | Customer service |
| **TOTAL PER TASKER** | **~$3/month** | | After initial $1.50 signup |

---

## 📊 COST BY SCALE

### Scenario 1: Small Scale (100 taskers)
**Monthly Costs:**
- Fixed: $500
- Variable: 100 × $3 = $300
- **Total: $800/month** ($9,600/year)

**Monthly Revenue (estimated):**
- 100 taskers × $30 avg = $3,000/month

**Monthly Profit:**
- $3,000 - $800 = **$2,200/month** ($26,400/year)

---

### Scenario 2: Medium Scale (500 taskers)
**Monthly Costs:**
- Fixed: $500
- Variable: 500 × $3 = $1,500
- **Total: $2,000/month** ($24,000/year)

**Monthly Revenue (estimated):**
- 500 taskers × $30 avg = $15,000/month

**Monthly Profit:**
- $15,000 - $2,000 = **$13,000/month** ($156,000/year)

---

### Scenario 3: Large Scale (2,000 taskers)
**Monthly Costs:**
- Fixed: $500 (may increase to $800 with more servers)
- Variable: 2,000 × $3 = $6,000
- **Total: $6,500/month** ($78,000/year)

**Monthly Revenue (estimated):**
- 2,000 taskers × $30 avg = $60,000/month

**Monthly Profit:**
- $60,000 - $6,500 = **$53,500/month** ($642,000/year)

---

## 💰 REVENUE BREAKDOWN

### Credit Pack Sales (Primary Revenue)

**Stripe Fees:**
- 2.9% + $0.30 per transaction

| Pack | Price | Stripe Fee | Net Revenue |
|------|-------|------------|-------------|
| 12 credits | $17.99 | $0.54 | $17.45 |
| 24 credits | $34.99 | $1.05 | $33.94 |
| 60 credits | $84.99 | $2.55 | $82.44 |

**Average Tasker Spending:**
- Claims ~20 tasks/month
- Buys credits 1-2 times/month
- **Average: $30/month per tasker**

---

## 📈 BREAK-EVEN ANALYSIS

### Monthly Break-Even Point

**Fixed costs:** $500/month

**Revenue per tasker:** $30/month
**Cost per tasker:** $3/month
**Net profit per tasker:** $27/month

**Break-even calculation:**
- $500 ÷ $27 = **19 taskers**

**You need just 19 active taskers to break even on operating costs!**

---

## 🎯 YEAR 1 FINANCIAL PROJECTION

### Revenue

| Quarter | Taskers | Monthly Revenue | Quarterly Revenue |
|---------|---------|-----------------|-------------------|
| Q1 | 100 | $3,000 | $9,000 |
| Q2 | 500 | $15,000 | $45,000 |
| Q3 | 1,500 | $45,000 | $135,000 |
| Q4 | 3,000 | $90,000 | $270,000 |
| **TOTAL** | | | **$459,000** |

### Year 1 Profit

**Total Revenue:** $459,000
**Total Expenses:** $201,900
**Net Profit:** **$257,100**

---

## 💡 COST OPTIMIZATION TIPS

### Ways to Reduce Costs

1. **Start with Smaller Infrastructure**
   - Use DigitalOcean instead of AWS (cheaper)
   - Start with $100/month server instead of $200
   - **Savings: $1,200/year**

2. **Negotiate Certn Pricing**
   - Volume discounts after 100 verifications
   - Could get Tier 1 down to $1.00
   - **Savings: $0.50 × taskers**

3. **Use Free Alternatives**
   - Cloudflare free tier (CDN + SSL)
   - GitHub Actions (free CI/CD)
   - PostgreSQL on same server as API
   - **Savings: $1,200/year**

---

## 📊 SUMMARY

### Minimum to Launch
- **$6,950** (bootstrap mode)
- **$169,350** (full Quebec launch)

### Monthly Operating Costs
- **$500** (fixed platform costs)
- **$3 per tasker** (variable costs)

### Break-Even
- **19 taskers** (operating costs only)
- **8 months** (including marketing investment)

### Profit Margins
- **90% gross margin** (revenue - variable costs)
- **70-80% net margin** (after all costs)

### Year 1 Projection
- **Revenue:** $459,000
- **Expenses:** $201,900
- **Profit:** $257,100

---

**Q-EMPLOIS** - Built to Scale 📈  
Built with ❤️ in Quebec, Canada 🇨🇦
