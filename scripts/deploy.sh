#!/usr/bin/env bash

# ==============================================================================
# Smart Cemetery - Professional PM2 VPS Deployment Script
# Safe Bash Configuration (set -e: fail fast, -u: undefined var error, -o pipefail)
# ==============================================================================
set -euo pipefail

# Define Colors for Beautiful Terminal Logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1${NC}"
}

log_success() {
  echo -e "${GREEN}[SUCCESS] $(date '+%Y-%m-%d %H:%M:%S') - $1${NC}"


log_warn() {
  echo -e "${YELLOW}[WARN] $(date '+%Y-%m-%d %H:%M:%S') - $1${NC}"
}

log_error() {
  echo -e "${RED}[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1${NC}"
}

# Print Header
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}          Smart Cemetery VPS Deployer                 ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Check arguments
if [ $# -lt 1 ]; then
  log_error "Missing environment argument. Usage: ./deploy.sh [staging|production]"
  exit 1
fi

ENV=$1

# Determine configuration based on environment
case "$ENV" in
  "staging")
    BRANCH="dev"
    PM2_APP="smartcemetary-staging"
    ;;
  "production")
    BRANCH="main"
    PM2_APP="smartcemetary"
    ;;
  *)
    log_error "Invalid environment '$ENV'. Allowed values: staging, production"
    exit 1
    ;;
esac

log_info "Starting deployment workflow for [${ENV^^}] environment..."
log_info "Target Git Branch: $BRANCH"
log_info "Target PM2 App Name: $PM2_APP"

# Step 1: Pull Latest Code
log_info "Step 1: Pulling latest changes from remote branch '$BRANCH'..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"
log_success "Code pulled successfully!"

# Step 2: Install Node Dependencies
log_info "Step 2: Installing project dependencies..."
npm install
log_success "Dependencies installed successfully!"

# Step 3: Run Build
log_info "Step 3: Building Next.js application..."
npm run build
log_success "Next.js application built successfully!"

# Step 4: Quality Gate - Verify build directory exists
log_info "Step 4: Running quality gate checks..."
if [ -d ".next" ]; then
  log_success "Quality Gate Passed: '.next' build directory exists! ✅"
else
  log_error "Quality Gate Failed: '.next' build directory was not found! ❌"
  exit 1
fi

# Step 5: Restart App using PM2
log_info "Step 5: Restarting PM2 process '$PM2_APP'..."

# Check if app is already running in PM2, if not we start it
if pm2 list | grep -q "$PM2_APP"; then
  log_info "App '$PM2_APP' is currently running. Performing hot-reload/restart..."
  pm2 restart "$PM2_APP"
else
  log_warn "App '$PM2_APP' is not running in PM2. Starting a new process..."
  # Determine port based on environment
  if [ "$ENV" = "staging" ]; then
    PORT=3001
  else
    PORT=3000
  fi
  PORT=$PORT pm2 start npm --name "$PM2_APP" -- run start
fi

# Step 6: Save PM2 Process List
log_info "Step 6: Saving PM2 process list to persist across server reboots..."
pm2 save
log_success "PM2 process list saved! ✅"

log_success "Smart Cemetery deployment completed successfully for [${ENV^^}]! 🚀"
exit 0
