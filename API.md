# UpgradeCafe Super Admin REST API Specification

All Super Admin endpoints require an active session with `role === "SUPER_ADMIN"`.
Non-admin requests receive `403 Forbidden`.

## Base URLs
- Admin APIs: `/api/admin/*`
- Auth APIs: `/api/auth/*`

---

## Standard Response Envelopes

### Success Response (200 / 201)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response (4xx / 5xx)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable error description",
    "details": { ... }
  }
}
```

Standard Error Codes:
- `UNAUTHORIZED` (401)
- `PASSWORD_CHANGE_REQUIRED` (403)
- `INVALID_OWNER_ACCOUNT` (409)
- `FORBIDDEN` (403)
- `CAFE_NOT_FOUND` (404)
- `PLAN_NOT_FOUND` (404)
- `DUPLICATE_SLUG` (409)
- `VALIDATION_ERROR` (422)
- `RATE_LIMITED` (429)
- `INTERNAL_ERROR` (500)

---

## 1. Café Management Endpoints

### `GET /api/admin/cafes`
Query Parameters:
- `page` (integer, default: 1)
- `limit` (integer, default: 10, max: 100)
- `search` (string, searches name, slug, contact email)
- `status` (`ALL` | `ACTIVE` | `GRACE` | `SUSPENDED` | `ARCHIVED`)

### `POST /api/admin/cafes`
Provision a new café, owner account, membership, and initial subscription atomically.
```json
{
  "name": "Your café name",
  "slug": "your-cafe-name",
  "description": "Café description",
  "contactEmail": "contact@example.com",
  "phone": "Business phone number",
  "address": "Business address",
  "currency": "INR",
  "timezone": "Asia/Kolkata",
  "ownerName": "Owner name",
  "ownerEmail": "owner@example.com",
  "planId": "uuid-of-plan",
  "billingCycle": "MONTHLY"
}
```
The success response includes a random temporary password only when a password account was created. It is shown once and must be replaced at first sign-in. If the email already has a password account, that password remains unchanged.

### `GET /api/admin/dashboard`
Returns current platform totals, the five most recently added cafés, cafés nearest to expiry, recent activity, and recorded revenue. Totals are calculated across all cafés.

### `GET /api/admin/cafes/{id}`
Returns café profile, owner details, active subscription, calculated access state, and recent offline payments.

### `PATCH /api/admin/cafes/{id}`
Update café metadata (name, slug, description, address, contact, currency, timezone).

### `POST /api/admin/cafes/{id}/status`
Administrative manual status override.
```json
{
  "action": "SUSPEND" | "REACTIVATE" | "ARCHIVE" | "RESET_OVERRIDE",
  "reason": "Administrative suspension note"
}
```

---

## 2. Offline Payments Ledger

### `GET /api/admin/payments`
Query Parameters:
- `page` (integer)
- `limit` (integer)
- `cafeId` (uuid)
- `paymentMethod` (`CASH` | `UPI` | `BANK_TRANSFER` | `CARD` | `OTHER`)

Returns payments list and `totals: { totalRevenue, totalTransactions }`.

### `POST /api/admin/payments`
Record an offline payment collected from café owner.
```json
{
  "cafeId": "uuid-of-cafe",
  "subscriptionId": "uuid-of-subscription",
  "amount": 2499,
  "currency": "INR",
  "paymentMethod": "UPI",
  "paymentDate": "2026-09-07",
  "referenceNumber": "UPI-19283746",
  "notes": "Verified via UPI bank statement",
  "extendSubscriptionDays": 30
}
```

---

## 3. SaaS Plans Management

### `GET /api/admin/plans`
Returns all SaaS plans. Add `?activeOnly=true` to return only plans available for new café provisioning.

### `POST /api/admin/plans`
Create a new pricing tier.
```json
{
  "name": "Growth Tier",
  "slug": "growth-tier",
  "description": "For mid-size multi-counter cafes",
  "monthlyPrice": 2499,
  "yearlyPrice": 24990,
  "lifetimePrice": 0,
  "maxBranches": 3,
  "maxMenuItems": 200,
  "features": ["3 Branches", "Table QR Ordering"]
}
```

### `PATCH /api/admin/plans/{id}`
Update plan pricing, limits, or active status.

---

## 4. Subscriptions Oversight

### `GET /api/admin/subscriptions`
Returns all tenant subscriptions, expiry dates, and grace period settings.

### `PATCH /api/admin/subscriptions/{id}`
Manually adjust plan, expiry date, or grace period.
```json
{
  "planId": "new-plan-uuid",
  "expiresAt": "2026-12-31",
  "gracePeriodDays": 7
}
```

---

## 5. Audit Log Explorer

### `GET /api/admin/activity`
Returns paginated security audit logs with sanitized JSON metadata.

---

## 6. Storage Uploads

### `POST /api/admin/upload/presigned`
Creates a presigned Cloudflare R2 upload URL for browser-to-bucket transfers.
```json
{
  "cafeId": "uuid-of-cafe",
  "category": "logo",
  "contentType": "image/webp",
  "extension": "webp"
}
```

## 7. Account Provisioning

### `GET /api/account/continue`
Resolves the signed-in user's next page: Super Admin dashboard, first-login password change, one assigned café, or café selection.

### `POST /api/account/change-password`
Verifies the current password, stores the new password hash, clears the first-login requirement, and revokes the user's other sessions.
Response:
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://[account].r2.cloudflarestorage.com/...",
    "key": "cafes/uuid/logo/uuid.webp",
    "publicUrl": "https://assets.upgradecafe.com/cafes/uuid/logo/uuid.webp"
  }
}
```
