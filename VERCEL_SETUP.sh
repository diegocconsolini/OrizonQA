#!/bin/bash
# Vercel Database Setup Script
# This script guides you through setting up Postgres and KV for OrizonQA

set -e

echo "🚀 OrizonQA - Vercel Database Setup"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get project info
PROJECT_NAME=$(cat .vercel/project.json | grep projectName | cut -d'"' -f4)
ORG_ID=$(cat .vercel/project.json | grep orgId | cut -d'"' -f4)

echo -e "${GREEN}✓${NC} Project: ${BLUE}${PROJECT_NAME}${NC}"
echo ""

# Step 1: Open Vercel Dashboard
echo -e "${YELLOW}Step 1: Create Vercel Postgres Database${NC}"
echo "---------------------------------------"
echo ""
echo "Opening Vercel dashboard in your browser..."
echo ""
echo "In the browser:"
echo "  1. Go to Storage tab"
echo "  2. Click 'Create Database'"
echo "  3. Select 'Postgres'"
echo "  4. Name: orizonqa-db"
echo "  5. Region: Choose closest to you"
echo "  6. Click 'Create'"
echo "  7. Click 'Connect Project' → Select 'orizon-qa'"
echo ""

# Open browser
if command -v xdg-open > /dev/null; then
    xdg-open "https://vercel.com/diegocconsolinis-projects/orizon-qa/settings/storage" 2>/dev/null &
elif command -v open > /dev/null; then
    open "https://vercel.com/diegocconsolinis-projects/orizon-qa/settings/storage"
fi

read -p "Press ENTER when Postgres database is created and connected..."
echo ""

# Step 2: Create KV Store
echo -e "${YELLOW}Step 2: Create Vercel KV Store${NC}"
echo "-------------------------------"
echo ""
echo "In the same Storage tab:"
echo "  1. Click 'Create Database' again"
echo "  2. Select 'KV'"
echo "  3. Name: orizonqa-cache"
echo "  4. Region: Same as Postgres"
echo "  5. Click 'Create'"
echo "  6. Click 'Connect Project' → Select 'orizon-qa'"
echo ""

read -p "Press ENTER when KV store is created and connected..."
echo ""

# Step 3: Pull environment variables
echo -e "${YELLOW}Step 3: Sync Environment Variables${NC}"
echo "-----------------------------------"
echo ""
echo "Pulling environment variables from Vercel..."
echo ""

vercel env pull .env.production

echo ""
echo -e "${GREEN}✓${NC} Environment variables saved to .env.production"
echo ""

# Step 4: Check environment variables
echo -e "${YELLOW}Step 4: Verify Environment Variables${NC}"
echo "-------------------------------------"
echo ""

if grep -q "POSTGRES_URL" .env.production; then
    echo -e "${GREEN}✓${NC} POSTGRES_URL found"
else
    echo -e "${YELLOW}⚠${NC}  POSTGRES_URL not found - make sure Postgres is connected"
fi

if grep -q "KV_REST_API_URL" .env.production; then
    echo -e "${GREEN}✓${NC} KV_REST_API_URL found"
else
    echo -e "${YELLOW}⚠${NC}  KV_REST_API_URL not found - make sure KV is connected"
fi

if grep -q "KV_REST_API_TOKEN" .env.production; then
    echo -e "${GREEN}✓${NC} KV_REST_API_TOKEN found"
else
    echo -e "${YELLOW}⚠${NC}  KV_REST_API_TOKEN not found - make sure KV is connected"
fi

echo ""

# Step 5: Trigger redeploy
echo -e "${YELLOW}Step 5: Trigger Redeployment${NC}"
echo "-----------------------------"
echo ""
echo "Redeploying to apply new environment variables..."
echo ""

vercel --prod

echo ""
echo -e "${GREEN}✓${NC} Deployment triggered!"
echo ""

# Step 6: Initialize database
echo -e "${YELLOW}Step 6: Initialize Production Database${NC}"
echo "---------------------------------------"
echo ""
echo "Waiting for deployment to complete (30 seconds)..."
sleep 30

PROD_URL="https://orizon-qa.vercel.app"
echo ""
echo "Initializing database schema..."
INIT_RESPONSE=$(curl -s "${PROD_URL}/api/db/init")

if echo "$INIT_RESPONSE" | grep -q "success.*true"; then
    echo -e "${GREEN}✓${NC} Database initialized successfully!"
    echo ""
    echo "Response: $INIT_RESPONSE"
else
    echo -e "${YELLOW}⚠${NC}  Initialization may have failed"
    echo "Response: $INIT_RESPONSE"
    echo ""
    echo "Try visiting manually: ${PROD_URL}/api/db/init"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Your OrizonQA deployment is ready:"
echo "  🌐 URL: ${PROD_URL}"
echo "  📊 Database: Postgres (connected)"
echo "  🗄️  Cache: Redis/KV (connected)"
echo ""
echo "Next steps:"
echo "  1. Test the app at: ${PROD_URL}"
echo "  2. Try analyzing some code"
echo "  3. Check Vercel dashboard for usage stats"
echo ""
echo "Documentation:"
echo "  📖 DEPLOYMENT.md - Deployment guide"
echo "  📖 DATABASE.md - Database technical docs"
echo ""
