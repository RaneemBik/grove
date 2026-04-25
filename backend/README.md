# E-Commerce Backend API

A full-featured e-commerce REST API built with Django + Django REST Framework.

## Tech Stack
- **Django 4.2** + **Django REST Framework**
- **JWT Authentication** via `djangorestframework-simplejwt`
- **API Documentation** via `drf-spectacular` (Swagger + ReDoc)
- **SQLite** (dev) / **PostgreSQL** (prod)
- **Pillow** for image handling

---

## Quick Start

### 1. Clone & Install

```bash
cd ecommerce_backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Run Migrations

```bash
python manage.py migrate
```

### 4. Seed Sample Data (optional)

```bash
python manage.py seed_data
# Creates admin@example.com / admin123 + sample products
```

### 5. Start Server

```bash
python manage.py runserver
```

---

## API Endpoints

### Base URL: `http://localhost:8000/api/`

### Authentication
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/auth/register/` | Register new user |
| POST | `/auth/login/` | Login (get JWT tokens) |
| POST | `/auth/token/refresh/` | Refresh access token |
| POST | `/auth/logout/` | Logout (blacklist token) |
| GET/PUT | `/auth/profile/` | Get/update profile |
| POST | `/auth/profile/change-password/` | Change password |

### Addresses
| Method | URL | Description |
|--------|-----|-------------|
| GET/POST | `/auth/addresses/` | List / create addresses |
| GET/PUT/DELETE | `/auth/addresses/<id>/` | Address detail |
| POST | `/auth/addresses/<id>/set-default/` | Set default address |

### Products
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/products/` | List all products (filter, search, sort) |
| GET | `/products/featured/` | Featured products |
| GET | `/products/<slug>/` | Product detail |
| GET | `/products/categories/` | All categories |
| GET | `/products/<slug>/reviews/` | Product reviews |
| POST | `/products/<slug>/reviews/` | Add review (auth) |

### Cart
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/cart/` | Get current cart |
| DELETE | `/cart/` | Clear cart |
| POST | `/cart/add/` | Add item to cart |
| PATCH | `/cart/items/<id>/` | Update item quantity |
| DELETE | `/cart/items/<id>/` | Remove item |

### Orders
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/orders/checkout/` | Place order |
| GET | `/orders/` | My orders |
| GET | `/orders/<order_number>/` | Order detail |
| POST | `/orders/<order_number>/cancel/` | Cancel order |

### Contact
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/contact/` | Submit contact message |

### Admin APIs
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/products/admin/products/` | All products |
| GET | `/products/admin/inventory/` | Inventory (stock levels) |
| GET | `/orders/admin/orders/` | All orders |
| PATCH | `/orders/admin/orders/<num>/status/` | Update order status |
| GET | `/orders/admin/analytics/` | Sales analytics |
| GET | `/auth/admin/users/` | All users |

### API Docs
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`

---

## Product Filtering

```
GET /api/products/?category=electronics&min_price=10&max_price=200&in_stock=true&search=headphones&ordering=-price
```

**Query Parameters:**
- `category` – category slug
- `min_price`, `max_price` – price range
- `in_stock` – true/false
- `is_featured` – true/false
- `search` – full-text search
- `ordering` – `price`, `-price`, `created_at`, `-created_at`, `name`
- `page` – pagination (12 per page)

---

## Authentication

All protected routes require:
```
Authorization: Bearer <access_token>
```

---

## Data Models

```
User → Address (many)
Category → Product (many)
Product → ProductImage (many)
Product → Review (many)
User → Cart (one-to-one)
Cart → CartItem (many) → Product
User → Order (many)
Order → OrderItem (many) → Product (snapshot)
ContactMessage
```

---

## Admin Dashboard

Access at: `http://localhost:8000/admin/`

Features:
- Product management with image upload
- Order management with status updates
- User management with roles
- Inventory with low-stock indicators
- Review moderation
- Contact message management
- Banner/promotion management

---

## Key Business Rules

- Each user has exactly **one active cart**
- **Stock is validated** before adding to cart AND at checkout
- Order items are **price-snapshotted** (never recalculated from live prices)
- Cancelling an order **restores stock**
- Free shipping on orders over **$100**
- **8% tax** applied at checkout
- JWT tokens auto-blacklisted on logout

---

## Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Set strong `SECRET_KEY`
- [ ] Configure PostgreSQL database
- [ ] Set `ALLOWED_HOSTS`
- [ ] Configure email (SMTP)
- [ ] Set `CORS_ALLOWED_ORIGINS` to your frontend URL
- [ ] Run `python manage.py collectstatic`
- [ ] Use `gunicorn` as WSGI server
