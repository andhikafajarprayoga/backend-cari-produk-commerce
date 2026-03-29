# Commerce Backend – API Design (MVP)

## Auth

### POST /auth/register
Body:
- name (string)
- email (string)
- password (string)
- phone (string, optional)

Behavior:
- Creates user with credit=0 and free_unlock=DEFAULT_FREE_UNLOCK (default 3)

### POST /auth/login
Body:
- email
- password

Response:
- { token }

### GET /auth/me (Bearer)
Response:
- { id, name, email, phone, address, latitude, longitude, role, credit, free_unlock, created_at }

### POST /auth/become-seller (Bearer)
Behavior:
- If current role is BUYER, upgrade role to SELLER
- If already SELLER or ADMIN, returns unchanged

Body (required when upgrading from BUYER):
- address (string)
- latitude (number, -90..90)
- longitude (number, -180..180)

Response:
- { role: 'SELLER'|'ADMIN', changed: boolean }

## Items

### GET /items
Query:
- q (optional)

Response:
- list of items (contact fields are not returned here)

### GET /items/:id
Response:
- item detail (contact fields are not returned here)

### POST /items (Bearer, SELLER/ADMIN)
Content-Type: multipart/form-data

Fields:
- title (string, required)
- price (number, optional)
- category (string, optional)
- location (string, optional)
- description (string, optional)
- use_default_location (boolean, optional)
- latitude (number, required if use_default_location is false)
- longitude (number, required if use_default_location is false)
- images (file, optional, up to 8 images)

Behavior:
1) Upload images to local storage (`/uploads`)
2) Resolve item location:
	- If use_default_location=true: copy from user (users.address, users.latitude, users.longitude)
	- Else: use request latitude/longitude (and optional location string)
3) Insert item to DB (status ACTIVE)
4) Insert item_images rows for each uploaded image

Success response (201):
- { id, status: 'ACTIVE', images: ['/uploads/..', ...] }

Errors:
- 403 FORBIDDEN (if role not SELLER/ADMIN)
- 400 MAX_IMAGES_EXCEEDED (if more than 8 images)
- 400 DEFAULT_LOCATION_MISSING (if use_default_location=true but user default location is not set)

### PATCH /items/:id (Bearer, SELLER/ADMIN)
Content-Type: application/json

Notes:
- SELLER hanya bisa edit item miliknya sendiri
- ADMIN bisa edit item siapa pun
- Update bersifat partial (field yang tidak dikirim tidak berubah)

Body (semua optional):
- title (string)
- price (number | null)
- category (string | null)
- location (string | null)
- description (string | null)
- use_default_location (boolean)
- latitude (number)
- longitude (number)

Behavior:
- Jika use_default_location=true: location/latitude/longitude akan di-copy dari user (users.address, users.latitude, users.longitude)
- Jika tidak: hasil akhir latitude/longitude wajib valid

Success response (200):
- { id }

### DELETE /items/:id (Bearer, SELLER/ADMIN)
Behavior:
- Soft delete: set items.status = INACTIVE dan hapus rows item_images

Success response (200):
- { deleted: true, id }

## Unlock Contact

### POST /items/:id/unlock (Bearer)
Flow:
1) If already unlocked (CONTACT_UNLOCKS has (user_id,item_id)) => return contact
2) Else if free_unlock > 0 => decrement free_unlock, log unlock, return contact
3) Else if credit > 0 => decrement credit, log unlock, return contact
4) Else => error CREDIT_HABIS

Success response:
- unlocked: true
- alreadyUnlocked: boolean
- unlockType: FREE | CREDIT
- contact: { contact_phone, contact_whatsapp }

Error response:
- 400 { error: 'CREDIT_HABIS', message: 'Free unlock dan credit habis' }

## Notes (Idempotency)
- Database enforces unique unlock via UNIQUE(user_id,item_id)
- Unlock endpoint runs in a transaction and locks the user row to avoid double debit.

## Admin

### PATCH /admin/users/:id/role (Bearer, ADMIN)
Body:
- role: BUYER | SELLER | ADMIN

Example:
```json
{ "role": "SELLER" }
```

Response:
- { user: { id, name, email, phone, role, credit, free_unlock, created_at } }
