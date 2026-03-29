# Xendit Integration Flow (Planned)

This project uses a credit package model (e.g., 10 credits per purchase). The unlock API does NOT auto-create payments; it returns CREDIT_HABIS when balance is empty.

## Suggested endpoints (to implement next)

### GET /credits/packages
Return a static list for MVP:
- { id: 'CREDIT_10', credits: 10, price: 10000 }

### POST /payments
Body:
- packageId

Behavior:
- Create a row in `payments` with status=PENDING
- Create invoice/charge in Xendit and store `gateway_reference`
- Return payment URL (from Xendit)

### POST /payments/webhook
Headers:
- verify with `XENDIT_WEBHOOK_TOKEN`

Behavior:
- Validate webhook signature/token
- If PAID and payment not yet processed:
  - mark payment_status=PAID
  - add credits to user
  - insert credit_transactions (CREDIT_ADD)

## Idempotency
- `payments.gateway_reference` must be UNIQUE to prevent double-processing
- Webhook handler must be safe to retry
