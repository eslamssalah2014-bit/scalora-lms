# Production Database Protection Policy

**CRITICAL MANDATE**: The production database is the single source of truth and is strictly immutable. Under NO circumstances may any feature development, bug fix, migration, refactor, deployment, testing, or maintenance task delete, reset, overwrite, reseed, replace, truncate, or recreate existing production data.

---

## 1. Forbidden Operations
The following operations are permanently prohibited against any connected database environment:
- `deleteMany({})`
- `truncate` / `DROP TABLE`
- `prisma migrate reset` / `prisma db reset`
- `npm run db:seed` / `prisma db seed`
- Any script that clears tables before inserting data or wipes populated records.

---

## 2. Feature Development Rule (Additive Only)
All new features must be **additive only**:
- ✓ `CREATE TABLE IF NOT EXISTS`
- ✓ `ALTER TABLE ADD COLUMN`
- ✓ Add new indexes & relations
- ✓ Safe additive inserts/upserts
- ✗ NEVER delete existing rows
- ✗ NEVER replace or reseed production content
- ✗ NEVER recreate populated tables

---

## 3. Community & Modules Policy
- All modules (Community, Courses, Payments, CRM, etc.) must integrate with existing data.
- They must NEVER recreate or replace existing courses, users, lessons, modules, enrollments, payments, or categories.

---

## 4. Pre-Deployment & Self-Protection Check
Before executing any database task or deployment:
1. Verify that all existing courses, users, enrollments, payments, lessons, modules, and categories remain untouched.
2. If any task carries the risk of modifying or removing existing production records: **STOP IMMEDIATELY**.
3. Redesign the implementation to guarantee complete data preservation.
