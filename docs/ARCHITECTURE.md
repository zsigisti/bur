# BUR — Blueberry User Repository

BUR is the community recipe repository for Blueberry Linux — the AUR analogue.
Anyone can write a `bpm.toml` recipe, build the `.bpm` locally, submit it for
review, and (once approved) publish it to a community mirror so other Blueberry
users can install it with the `bur` client.

```
Blueberry (distro) → bpm (manager) → .bpm (package) → bpm.toml (recipe)
                                                        └── BUR = community recipes + bur client
```

## Pieces

| Component | Tech | Where it runs |
|---|---|---|
| **Web app** (`web/`) | Next.js (App Router) + TypeScript + React | `192.168.0.79:82`, public at `bur.mmzsigmond.me` |
| **Database** | Azure SQL (SQL Server), Prisma ORM | Azure free tier |
| **CLI** (`cli/`) | Rust, single static binary `bur` | user machines; installed via `bpm install bur` |
| **Email/2FA** | Resend | — |
| **Official mirror** | existing | `repo.mmzsigmond.me` (curated, official packages) |
| **Community mirror** | new | `repo1.mmzsigmond.me` (approved BUR packages) |

The two mirrors are **separate**: `repo.mmzsigmond.me` is the official, curated
Blueberry repo; `repo1.mmzsigmond.me` is where approved community (BUR) `.bpm`
files land. `bur` installs from `repo1`; `bpm` installs from `repo`.

## Networking (.79)

- nginx already serves the `blueberry-repo` mirror on `:80` — **left intact**.
- nginx serves BUR on **`:82`, plain HTTP** and proxies to the Next.js app on
  `127.0.0.1:3000`. No TLS on the box. Public TLS terminates at the Cloudflare
  edge for `bur.mmzsigmond.me`, same pattern as the existing mirror.
- Because the public origin is HTTPS (Cloudflare), session cookies are still set
  `Secure`.

## Roles & permissions

### Global roles
- **Author** — the top rank. Can do anything: approve/reject any recipe, manage
  any package, grant contributor access to any package, promote users, publish
  to either mirror.
- **Maintainer** — general reviewer. Can approve/reject *recipe submissions*
  from any user (the general review gate). Cannot override package ownership.
- **Contributor** — the default for every registered user. Can create packages,
  submit recipes, and apply to contribute to others' packages.

### Per-package roles
- **Package Author (owner)** — the user who created the package. Edits their own
  package's recipes freely (no review needed for their own package), and
  approves/denies contribution requests to *their* package.
- **Package Contributor** — a user granted access to a specific package (by that
  package's author **or** by a global Author). Can edit that package's recipes.

### Trust (the "20-package" rule)
- Every user has an `approvedCount` (recipes of theirs that reached APPROVED).
- Once `approvedCount >= 20`, the user becomes **trusted**: their new recipe
  submissions are **auto-approved** (skip the Maintainer/Author review gate).
- A global Author can also grant `trusted` manually.

## Submission → publish flow

```
1. Write recipe        user authors packages/<name>/bpm.toml
2. Build locally       bur build .   (or bpm) → produces <name>-<ver>-x86_64.bpm
                       *every package must be built by its submitter locally*
3. Submit              bur submit .  → uploads recipe + build metadata to BUR
                       status = PENDING  (or APPROVED immediately if trusted /
                       own package / Author)
4. Review              a Maintainer or Author approves → status = APPROVED
                       (rejected → REJECTED with a reason)
5. Publish             the author / package-contributor / package-author manually
                       uploads the built .bpm to repo1.mmzsigmond.me
                       (bur publish) → status = PUBLISHED, mirror re-indexed
```

Approval gates the **recipe**; publishing the built `.bpm` to the mirror is a
separate, manual, human action by an authorized user.

## Security posture ("secure a lot")

- **Passwords**: argon2id, per-user salt, never logged.
- **2FA**: email one-time codes via Resend, required at login (and for email
  verification). Codes are short-lived, single-use, hashed at rest.
- **Sessions**: opaque random tokens, hashed at rest, `HttpOnly` + `Secure` +
  `SameSite=Lax` cookies, server-side revocable.
- **RBAC**: every mutation is authorized server-side in `lib/permissions.ts`;
  the UI never decides access.
- **Input validation**: zod schemas at every API boundary; recipe TOML is parsed
  and validated (name/version/sha256 present) before storage.
- **Injection**: Prisma parameterized queries only; no string SQL.
- **Rate limiting**: on login, 2FA, registration, and submit endpoints.
- **Audit log**: every login and every create/approve/publish is recorded
  (who did what, when, from where).
- **Secrets**: only via env (`.env`, never committed); Azure/Resend keys server-side.
- **Headers**: strict CSP, HSTS (at edge), `X-Content-Type-Options`, frame-deny.

## Data model

See `web/prisma/schema.prisma`. Core tables: `User`, `Session`,
`TwoFactorToken`, `Package`, `Recipe`, `PackageRole`, `ContributionRequest`,
`LoginEvent`, `AuditLog`. (SQL Server has no native enums, so status/role fields
are validated strings — see the TS unions in `web/src/lib/types.ts`.)

## Repo layout

```
bur/
  docs/ARCHITECTURE.md      this file
  web/                      Next.js app (site + API)
    prisma/schema.prisma    data model
    src/lib/                db, auth, email, permissions, validation
    src/app/                pages + route handlers
  cli/                      Rust `bur` client (installed via bpm)
  deploy/                   nginx :82 vhost, systemd unit, deploy runbook
```
