# UpgradeCafe ☕

> Production-Quality Multi-Tenant Café SaaS Platform (Phase 1 — Super Admin & Modular Foundation)

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue)](https://react.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.2-green)](https://orm.drizzle.team/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.7.3-orange)](https://better-auth.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8)](https://tailwindcss.com/)

---

## 🎯 Phase 1 Goals & Deliverables

This repository contains the completed **Phase 1** foundation of UpgradeCafe:
1. **Multi-Tenant SaaS Foundation**: Strict tenant boundary isolation, server-side IDOR defense, and future multi-branch architecture readiness.
2. **Domain-Driven Modular Structure**: Clean separation of Super Admin (`features/super-admin`), future Café application (`features/cafe`), and future public menu (`features/public-menu`).
3. **Database Architecture**: Supabase PostgreSQL with Drizzle ORM, database indexes, and transactional tenant provisioning.
4. **Identity & Session Security**: Better Auth session-based authentication with secure HTTP-only cookies (zero `localStorage` usage).
5. **Administrative Offline Billing Ledger**: Platform owner manually records payments (Cash, UPI, Bank Transfer, Card) and controls plans, start dates, expiry dates, grace periods, suspensions, and reactivations. No automated payment gateway dependency.
6. **Authoritative Access State Engine (`getCafeAccessState`)**: Server-side expiry calculation, 7-day grace period countdown, automatic suspension, and manual administrative overrides.
7. **Infrastructure Abstractions**: Cloudflare R2 presigned upload URL generator, Upstash Redis distributed rate limiting, and immutable audit logging.
8. **Custom Design System (Zero shadcn/ui)**: Neutral graphite (`#242321`) + warm cream (`#F7F6F2`) + muted terracotta (`#B85C3A`) palette, Plus Jakarta Sans typography, and custom UI components (`Button`, `Input`, `Select`, `Modal`, `Dialog`, `Badge`, `Table`, `Card`, `Toast`, `Pagination`, `Tooltip`, etc.).

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- npm

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Set the database, Better Auth, storage, and rate limit variables listed in `ENVIRONMENT.md`.

### 4. Apply Database Migrations
```bash
npm run db:migrate
```

### 5. Database Seed
Create the initial Super Admin account. The seed creates no sample cafés, plans, payments, or demo menu records:
```bash
npm run db:seed
```

Set `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` in your local environment before running the seed. Choose a unique password of at least 12 characters. Existing Super Admin passwords are not overwritten by `db:seed`.

After signing in, create your real subscription plans under **Subscription Plans**, then provision cafés under **All Cafés → Add Café**. New owners receive a one-time temporary password and must replace it at first sign-in.

### 6. Run Automated Tests
```bash
npm run test
```

### 7. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000/admin](http://localhost:3000/admin) to access the Super Admin Portal.

---

## 🧭 Super Admin Routes

| Route | Purpose |
| :--- | :--- |
| `/admin/login` | Secure sign-in for Super Admins and café owners |
| `/admin` | Main KPI dashboard (Cafés, Active, Grace, Suspended, Revenue) |
| `/admin/cafes` | Paginated, searchable, status-filtered café directory |
| `/admin/cafes/new` | Atomic transactional café + owner + subscription provisioning |
| `/admin/cafes/[id]` | Café overview, access state inspector, and payment history |
| `/admin/cafes/[id]/edit` | Edit café metadata and settings |
| `/admin/plans` | SaaS pricing plans management |
| `/admin/payments` | Administrative offline payment ledger and totals |
| `/admin/subscriptions` | Subscription oversight and expiry adjustments |
| `/admin/activity` | Security audit trail with metadata inspector |
| `/admin/settings` | Infrastructure health and rate limiting configurations |

---

## 📚 Technical Documentation

- 📐 **[ARCHITECTURE.md](file:///d:/ClientsWebsites/upgradecafe/ARCHITECTURE.md)**: Architectural diagrams, domain partitioning, and tenant model.
- 🗄️ **[DATABASE.md](file:///d:/ClientsWebsites/upgradecafe/DATABASE.md)**: Drizzle schema reference, relational models, and lifecycle state transitions.
- 🛡️ **[SECURITY.md](file:///d:/ClientsWebsites/upgradecafe/SECURITY.md)**: IDOR defense, session security, distributed rate limiting, and input validation.
- 🔌 **[API.md](file:///d:/ClientsWebsites/upgradecafe/API.md)**: Super Admin REST endpoints, schemas, and standardized error codes.
- ⚙️ **[ENVIRONMENT.md](file:///d:/ClientsWebsites/upgradecafe/ENVIRONMENT.md)**: Environment variable reference for Supabase, Better Auth, Upstash, and Cloudflare R2.
