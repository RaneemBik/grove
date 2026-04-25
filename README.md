# Grove — Premium E-Commerce Platform

A full-stack e-commerce web application built with **Django REST Framework** (backend) and **React + TypeScript + Vite** (frontend). Grove features a curated product catalog, shopping cart, user authentication, Stripe payments, loyalty subscriptions, and a polished storefront UI.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [1. Clone / Unzip](#1-clone--unzip)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Seed the Database](#3-seed-the-database)
  - [4. Frontend Setup](#4-frontend-setup)
  - [5. Run Both Servers](#5-run-both-servers)
- [Environment Variables](#environment-variables)
  - [Backend `.env`](#backend-env)
  - [Frontend `.env`](#frontend-env)
- [Stripe Integration](#stripe-integration)
  - [How It Works](#how-it-works)
  - [Setting Up Stripe](#setting-up-stripe)
  - [Webhook Setup](#webhook-setup)
  - [Test Cards](#test-cards)
- [Demo Accounts](#demo-accounts)
- [Key Features](#key-features)
- [API Overview](#api-overview)
- [Production Deployment Notes](#production-deployment-notes)

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | Python 3.11+, Django 5, Django REST Framework   |
| Auth      | JWT (SimpleJWT), bcrypt                         |
| Payments  | Stripe Checkout (hosted), Stripe Webhooks       |
| Database  | SQLite (dev) / PostgreSQL (prod)                |
| Frontend  | React 18, TypeScript, Vite                      |
| Styling   | Custom CSS variables (no framework dependency)  |
| State     | Zustand (cart + auth stores)                    |
| Forms     | React Hook Form + Zod validation                |

---

## Project Structure

```
grove_ecommerce/
├── backend/
│   ├── apps/
│   │   ├── cart/          # Cart & CartItem models + API
│   │   ├── contact/       # Contact form API
│   │   ├── orders/        # Orders, checkout, Stripe webhook
│   │   ├── products/      # Products, categories, variants, reviews
│   │   └── users/         # Custom User, addresses, subscriptions
│   ├── ecommerce/         # Django project settings & root URLs
│   ├── media/             # Uploaded product & category images
│   ├── .env               # Your local environment variables
│   ├── .env.example       # Template — copy this to .env
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/           # Axios API client
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Route-level page components
    │   ├── store/         # Zustand stores (auth, cart)
    │   ├── types/         # TypeScript interfaces
    │   └── utils/         # Helpers (formatters, image URLs)
    ├── .env               # Your local frontend env
    ├── .env.example       # Template
    └── package.json
```

---

## Quick Start

### 1. Clone / Unzip

```bash
unzip grove_ecommerce.zip
cd grove_ecommerce
```

### 2. Backend Setup

```bash
cd backend

# Create & activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env template and fill in your values
cp .env.example .env
# (Edit .env — at minimum SECRET_KEY is auto-generated, defaults work for dev)

# Run database migrations
python manage.py migrate
```

### 3. Seed the Database

This command creates realistic demo products, categories, product variants, and two user accounts — no real database required.

```bash
python manage.py seed_data
```

Output:
```
Seeding Grove demo data...
  Created superuser: admin@grove.com / admin123
  Created demo user: demo@grove.com / demo1234
  Created category: Skin Care
  ...
  Created product: Cartier Santos Luxury Watch
Seeding complete!
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install Node dependencies
npm install

# Copy env template
cp .env.example .env
# VITE_API_URL and VITE_MEDIA_URL default to localhost — no changes needed for dev
```

### 5. Run Both Servers

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
python manage.py runserver
# Runs at http://localhost:8000
# Admin panel: http://localhost:8000/admin  (admin@grove.com / admin123)
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

### Backend `.env`

Copy `backend/.env.example` → `backend/.env` and fill in:

| Variable                    | Default / Example              | Description                                      |
|-----------------------------|--------------------------------|--------------------------------------------------|
| `SECRET_KEY`                | *(auto-generated)*             | Django secret key — generate a unique value      |
| `DEBUG`                     | `True`                         | Set to `False` in production                     |
| `ALLOWED_HOSTS`             | `localhost,127.0.0.1`          | Comma-separated allowed hostnames                |
| `DB_ENGINE`                 | `django.db.backends.sqlite3`   | Use `postgresql` in production                   |
| `DB_NAME`                   | `db.sqlite3`                   | Database name / path                             |
| `CORS_ALLOWED_ORIGINS`      | `http://localhost:5173`        | Frontend origin(s)                               |
| `FRONTEND_URL`              | `http://localhost:5173`        | Used in Stripe redirect URLs                     |
| `EMAIL_BACKEND`             | `console.EmailBackend`         | Change to SMTP for real emails                   |
| `STRIPE_SECRET_KEY`         | `sk_test_...`                  | From Stripe Dashboard → API keys                 |
| `STRIPE_PUBLISHABLE_KEY`    | `pk_test_...`                  | From Stripe Dashboard → API keys                 |
| `STRIPE_WEBHOOK_SECRET`     | `whsec_...`                    | From Stripe Dashboard → Webhooks                 |
| `SUBSCRIBER_DISCOUNT_RATE`  | `0.15`                         | 15% discount for subscriber members              |
| `SUBSCRIPTION_PRICE_MONTHLY`| `9.99`                         | Monthly subscription price in USD                |
| `SUBSCRIPTION_PRICE_YEARLY` | `99.99`                        | Yearly subscription price in USD                 |

### Frontend `.env`

Copy `frontend/.env.example` → `frontend/.env`:

| Variable                      | Default                        | Description                           |
|-------------------------------|--------------------------------|---------------------------------------|
| `VITE_API_URL`                | `http://localhost:8000/api`    | Backend API base URL                  |
| `VITE_MEDIA_URL`              | `http://localhost:8000`        | Backend media files base URL          |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...`                  | Stripe publishable key (safe to expose)|

---

## Stripe Integration

### How It Works

Grove uses **Stripe Checkout** (Stripe's hosted payment page) for card payments:

1. Customer selects **"Card Payment (Stripe)"** on the checkout payment step.
2. On order submission, the backend creates a Stripe Checkout Session and returns a `checkout_url`.
3. The frontend redirects the customer to Stripe's hosted page.
4. After payment, Stripe redirects back to `/account/orders/{order_number}?payment=success&session_id=...`.
5. The frontend calls `/api/orders/{order_number}/confirm-payment/` to verify and mark the order as paid.
6. Simultaneously, Stripe fires a `checkout.session.completed` webhook to `/api/orders/stripe/webhook/` as a reliable fallback.

### Setting Up Stripe

1. Create a free account at [https://stripe.com](https://stripe.com).
2. Go to **Developers → API keys**.
3. Copy your **Secret key** (`sk_test_...`) and **Publishable key** (`pk_test_...`).
4. Add them to `backend/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
   STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
   ```

### Webhook Setup

Webhooks ensure orders are marked paid even if the browser closes before redirect.

**For local development** (using Stripe CLI):
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:8000/api/orders/stripe/webhook/
# Copy the webhook signing secret (whsec_...) to STRIPE_WEBHOOK_SECRET in .env
```

**For production:**
1. Go to **Stripe Dashboard → Developers → Webhooks → Add endpoint**.
2. Set endpoint URL: `https://yourdomain.com/api/orders/stripe/webhook/`
3. Select events: `checkout.session.completed`, `checkout.session.expired`
4. Copy the **Signing secret** → add to `STRIPE_WEBHOOK_SECRET` in `.env`.

### Test Cards

Use these card numbers on the Stripe Checkout page (any future expiry, any CVC):

| Card Number           | Result                        |
|-----------------------|-------------------------------|
| `4242 4242 4242 4242` | ✅ Payment succeeds            |
| `4000 0025 0000 3155` | 🔐 Requires 3D Secure auth     |
| `4000 0000 0000 9995` | ❌ Payment declined            |

---

## Demo Accounts

After running `python manage.py seed_data`:

| Role       | Email              | Password   |
|------------|--------------------|------------|
| Admin      | admin@grove.com    | admin123   |
| Customer   | demo@grove.com     | demo1234   |

- **Admin panel**: http://localhost:8000/admin
- The demo customer can log in, add to cart, and go through checkout.

---

## Key Features

- **Product catalog** with categories, filtering, search, and sorting
- **Product variants** — color/size SKUs with individual stock, price overrides, and images
- **Shopping cart** — persistent per-user, supports variant selection
- **Multi-step checkout** — shipping address, payment method, order review
- **Stripe Checkout** — real card payment with hosted Stripe page + webhook confirmation
- **Demo/Mock payment** — instant order without Stripe keys (for testing)
- **Cash on Delivery** — COD payment method
- **User authentication** — register, login, JWT refresh, password reset
- **Saved addresses** — manage multiple shipping addresses with a default
- **Order history** — full order detail, cancellation support
- **Wishlist** — save products for later
- **Reviews & ratings** — per-product, per-user reviews
- **Subscriber membership** — monthly/yearly plan with 15% discount and loyalty points
- **New Arrivals section** — auto-populated homepage section for latest products
- **Featured Products** — curated homepage grid
- **Category hero slider** — auto-rotating hero with product imagery
- **Admin panel** — full Django admin + custom API endpoints for inventory, orders, analytics
- **Email notifications** — order confirmation emails (configurable SMTP)
- **Responsive design** — mobile-first layout

---

## API Overview

Base URL: `http://localhost:8000/api`

| Method | Endpoint                              | Description                        |
|--------|---------------------------------------|------------------------------------|
| GET    | `/products/`                          | List/search/filter products        |
| GET    | `/products/featured/`                 | Featured products                  |
| GET    | `/products/new-arrivals/`             | New arrival products               |
| GET    | `/products/{slug}/`                   | Product detail with variants       |
| GET    | `/products/categories/`              | All categories                     |
| POST   | `/auth/register/`                     | Register new user                  |
| POST   | `/auth/login/`                        | Login (returns JWT tokens)         |
| GET    | `/auth/profile/`                      | Current user profile               |
| GET    | `/cart/`                              | Get user's cart                    |
| POST   | `/cart/add/`                          | Add item to cart                   |
| POST   | `/orders/checkout/`                   | Create order + Stripe session      |
| POST   | `/orders/stripe/webhook/`             | Stripe webhook receiver            |
| GET    | `/orders/`                            | User's order list                  |
| GET    | `/orders/{order_number}/`             | Order detail                       |
| POST   | `/orders/{order_number}/confirm-payment/` | Confirm Stripe payment         |

Full API documentation is available via Django REST Framework's browsable API at `http://localhost:8000/api/`.

---

## Production Deployment Notes

1. Set `DEBUG=False` in `.env`
2. Use PostgreSQL — set `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`
3. Set `ALLOWED_HOSTS` to your domain
4. Set `CORS_ALLOWED_ORIGINS` to your frontend domain
5. Set `FRONTEND_URL` to your frontend domain (used in Stripe redirect URLs)
6. Run `python manage.py collectstatic` and serve `/static/` and `/media/` via nginx/CDN
7. Set live Stripe keys (`sk_live_...`, `pk_live_...`, `whsec_...`)
8. Configure real SMTP email settings
9. Generate a strong `SECRET_KEY`: `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`

---

*Built with ❤ — Grove E-Commerce*
