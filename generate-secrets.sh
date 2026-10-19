#!/bin/bash
# Bash script to generate secrets for .env files
# Run this script: chmod +x generate-secrets.sh && ./generate-secrets.sh

echo "=== Generating Secrets for E-Commerce Platform ==="
echo ""

# Generate JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# Generate NextAuth Secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo ""

echo "=== Instructions ==="
echo "1. Copy JWT_SECRET to server/.env"
echo "2. Copy NEXTAUTH_SECRET to:"
echo "   - app/.env.local"
echo "   - server/.env (optional)"
echo ""
echo "Values generated successfully!"

