# BUR — Blueberry User Repository

The community recipe repository for [Blueberry Linux](https://github.com/zsigisti/blueberry)
— its AUR. Anyone can write a `bpm.toml` recipe, build the `.bpm` locally, get it
reviewed, and publish it so other users can install it with the `bur` client.

- **Website:** `bur.mmzsigmond.me` — create/browse packages, review, publish
- **Community mirror:** `repo1.mmzsigmond.me` (separate from the official `repo.mmzsigmond.me`)
- **Client:** `bur` — installed on demand via `bpm install bur` (not in the base)

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the full design: roles,
trust model, submission flow, and security posture.

```
bur/
  web/    Next.js + TypeScript site & API, Prisma → Azure SQL
  cli/    Rust `bur` client
  deploy/ runbook for 192.168.0.76:82
  docs/   architecture
```

## Status

Scaffold in place: data model (`web/prisma/schema.prisma`), RBAC
(`web/src/lib/permissions.ts`), auth/2FA/email libs, landing page, deploy
configs, and the CLI skeleton. Next: auth pages + API routes, package/submit/
review UI, and wiring the CLI to the API.
