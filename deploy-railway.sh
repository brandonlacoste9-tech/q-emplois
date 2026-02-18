#!/bin/bash
# QWORKS Railway Deployment Script

set -e

echo "🚀 QWORKS Railway Deployment"
echo "=============================="

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔑 Please login to Railway:"
    railway login
fi

# Link to project or create new
echo "📦 Setting up Railway project..."
railway link || railway init --name qworks

# Add PostgreSQL
echo "🗄️  Adding PostgreSQL database..."
railway add --database postgres || echo "PostgreSQL already exists"

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Railway dashboard"
echo "2. Run database migrations: railway run npx prisma migrate deploy"
echo "3. Get your deployment URL: railway domain"
echo ""
