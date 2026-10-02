# UpgradeCafe Security Architecture & Policies

## 1. Authentication & Session Security

- **Better Auth Integration**: Sessions are cryptographically verified using server-side session stores.
- **Secure Cookie Mechanism**:
  - `HttpOnly`: Session cookies cannot be accessed or exfiltrated via JavaScript `document.cookie`.
  - `SameSite=Lax`: Defends against Cross-Site Request Forgery (CSRF).
  - `Secure`: Transmitted strictly over HTTPS in production.
- **Zero LocalStorage Policy**:
  - User identity, tokens, role, tenant memberships, and subscription states are **NEVER** stored in `localStorage`.
  - All access decisions are verified server-side.

---

## 2. Authorization & Tenant Isolation (IDOR Defense)

Hiding a button in the frontend is not security. All endpoints and domain actions enforce server-side guards:

```typescript
// Platform-wide administrative guard
await requireSuperAdmin();

// Tenant boundary guard with role constraints
await requireCafeMember(cafeId, ["OWNER", "MANAGER"]);

// Strict Owner guard
await requireCafeOwner(cafeId);
```

### Insecure Direct Object Reference (IDOR) Protection Flow:
1. Extract user identity from verified HTTP-only session cookie.
2. Query `cafe_memberships` in PostgreSQL for `(userId, requestedCafeId, isActive = true)`.
3. If no membership exists, reject immediately with `403 Forbidden`.
4. If membership exists, check `getCafeAccessState()`: if café is `SUSPENDED` or `ARCHIVED`, reject tenant access with `403 Forbidden`.
5. Super Admin accounts retain cross-tenant access to inspect and service any café.

---

## 3. Distributed Rate Limiting (Upstash Redis)

Configured sliding-window rate limiters prevent brute-force attacks and abuse:
- **Admin Login**: 5 requests / 15 minutes per IP (`ADMIN_LOGIN`)
- **Password Reset**: 3 requests / 1 hour per IP (`PASSWORD_RESET`)
- **Café Tenant Creation**: 20 requests / 1 hour per IP (`CAFE_CREATION`)
- **Administrative Mutations**: 60 requests / 1 minute (`ADMIN_MUTATION`)
- **Public Endpoints**: 100 requests / 1 minute (`PUBLIC_API`)

Returns standard `429 Too Many Requests` with retry headers when exceeded.

---

## 4. Storage Security & File Upload Isolation (Cloudflare R2)

- Direct browser-to-R2 presigned PUT uploads prevent malicious file traversal through the application server.
- Keys are strictly scoped by tenant:
  `cafes/{cafeId}/{category}/{uuid}.webp`
- Original client filenames are never used as storage paths.
- Content-type validation is enforced when issuing presigned URLs.

---

## 5. Input Validation & SQL Injection Defense

- **Drizzle ORM Parameterization**: All SQL queries use prepared, parameterized statements. No raw string concatenation.
- **Zod Validation**: Every request payload is strictly parsed and sanitized through Zod schemas before reaching domain services.
- **Standardized AppError Handling**:
  - Error messages returned to clients never leak stack traces, SQL syntax, or internal infrastructure details.

## 6. Café Owner Provisioning

- A cryptographically random temporary password is generated server-side and hashed with Better Auth before storage.
- The password is returned once to the Super Admin after café creation and is never stored in readable form or written to audit logs.
- New owners are marked `must_change_password`; tenant pages and APIs reject access until the owner changes it.
- Password replacement verifies the current credential, updates the password hash and clears the requirement in one transaction, and revokes the owner's other sessions.
