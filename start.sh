#!/bin/bash
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       Grove E-Commerce — Setup           ║"
echo "╚══════════════════════════════════════════╝"
echo ""

echo "▶ [1/3] Installing backend dependencies..."
cd backend
pip install -r requirements.txt -q --break-system-packages 2>/dev/null || pip install -r requirements.txt -q
python manage.py migrate --run-syncdb > /dev/null 2>&1
python manage.py seed_data
cd ..
echo "✓ Backend ready"

echo ""
echo "▶ [2/3] Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..
echo "✓ Frontend ready"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup complete!                                          ║"
echo "║                                                              ║"
echo "║  Terminal 1:  cd backend && python manage.py runserver       ║"
echo "║  Terminal 2:  cd frontend && npm start                       ║"
echo "║                                                              ║"
echo "║  Admin:        admin@example.com / admin123                  ║"
echo "║  Frontend:     http://localhost:3000                         ║"
echo "║  API Docs:     http://localhost:8000/api/docs/               ║"
echo "║  Django Admin: http://localhost:8000/admin/                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
