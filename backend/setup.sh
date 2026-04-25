#!/bin/bash
# Quick setup script for the E-Commerce Backend

echo "========================================="
echo "  E-Commerce Backend - Setup Script"
echo "========================================="

# Install dependencies
echo "[1/4] Installing Python dependencies..."
pip install -r requirements.txt --break-system-packages -q 2>/dev/null || pip install -r requirements.txt -q

# Copy env if not exists
if [ ! -f .env ]; then
    echo "[2/4] Creating .env from template..."
    cp .env.example .env
    echo "      ⚠  Please edit .env with your settings before proceeding."
else
    echo "[2/4] .env already exists, skipping."
fi

# Migrate
echo "[3/4] Running database migrations..."
python manage.py migrate

# Seed
echo "[4/4] Seeding sample data..."
python manage.py seed_data

echo ""
echo "========================================="
echo "  Setup complete!"
echo "  Admin login: admin@example.com / admin123"
echo "  Run: python manage.py runserver"
echo "  API Docs: http://localhost:8000/api/docs/"
echo "  Admin: http://localhost:8000/admin/"
echo "========================================="
