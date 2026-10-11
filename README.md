# Mike admin dashboard (Next.js + Tailwind + shadcn)

Internal shop-management UI for the [mike e-commerce API](../mike).
**Not a storefront** — no browsing, cart, or checkout here. Every page requires an admin account.

## Quickstart

```bash
bun install
cp .env.example .env   # optional; defaults to the deployed Worker
bun run dev            # http://localhost:3001
```

| Route | Purpose |
|---|---|
| `/login` | Admin login (non-admins rejected) |
| `/overview` | Product/order counts, revenue, low-stock list |
| `/products` | CRUD, Cloudinary image upload, cover/reorder, variant manager |
| `/categories` | CRUD (delete blocked while used) |
| `/orders` | All orders, status filter, status updates, item breakdown |
| `/coupons` | CRUD |
| `/shipping` | Delivery zones CRUD + enable/disable |

## Deploy

Vercel (or any Next host). Afterwards add the dashboard domain to the backend's
`ALLOWED_ORIGINS` in `wrangler.jsonc` and redeploy the Worker — otherwise the
browser blocks API calls.
