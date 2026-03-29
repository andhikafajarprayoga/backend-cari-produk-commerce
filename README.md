# Commerce Backend (Node.js + MySQL)

## Prerequisites
- Node.js (LTS)
- Laragon (MySQL)

## Setup (manual)
1) Create database in MySQL: `commerce`
2) Run SQL schema: `database/schema.sql`
3) Copy env: `.env.example` -> `.env` and fill values
4) Install deps: `npm install`
5) Run: `npm run dev`

## Available endpoints
- GET /health
- POST /auth/register
- POST /auth/login
- GET /auth/me
- POST /auth/become-seller
- GET /items
- POST /items (SELLER/ADMIN, multipart)
- GET /items/:id
- POST /items/:id/unlock
- PATCH /admin/users/:id/role (ADMIN)

## Roles
- `users.role`: BUYER (default), SELLER, ADMIN
- Only SELLER/ADMIN can create items

## Location
- User can upgrade to SELLER via `POST /auth/become-seller` (requires address + latitude + longitude)
- `POST /items` supports `use_default_location=true` to copy user default location, or send item latitude/longitude
