# Grove — React E-Commerce Frontend

A professional, modern React frontend for the Grove e-commerce platform.

## Design System

- **Font**: Syne (headings, 800 weight) + Inter (body) + Space Mono (prices, codes)
- **Colors**: Deep Forest Green `#1a2e1a` · Lime Accent `#c5e84a` · Warm Cream `#faf8f3`
- **Style**: Bold organic, smooth animations, hover overlays, floating cards

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| React Router v6 | Client-side routing |
| Zustand | Auth + Cart global state |
| Axios | API client with JWT auto-refresh |
| React Hook Form + Zod | Form validation |
| react-hot-toast | Notifications |
| lucide-react | Icons |

## Quick Start

```bash
npm install
cp .env.example .env     # already pre-configured for localhost
npm run dev              # → http://localhost:5173
```

> Make sure the Django backend is running on port 8000 first.

## Pages

| Route | Page |
|---|---|
| `/` | Home (hero, marquee, categories, featured products, trust strip) |
| `/products` | Product listing with sidebar filters, search, sort, pagination |
| `/products/:slug` | Product detail with image gallery, reviews, add-to-cart |
| `/cart` | Cart with quantity controls and live order summary |
| `/checkout` | 3-step checkout (Shipping → Payment → Review) |
| `/auth/login` | Login |
| `/auth/register` | Registration with password strength |
| `/account` | Profile management |
| `/account/orders` | Order history |
| `/account/orders/:num` | Order detail with progress tracker |
| `/account/addresses` | Address book management |
| `/contact` | Contact form |

## Environment Variables

```bash
VITE_API_URL=http://localhost:8000/api
VITE_MEDIA_URL=http://localhost:8000
```
