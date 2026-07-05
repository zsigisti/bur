# BUR — Blueberry User Repository

The community package repository for [Blueberry Linux](https://github.com/zsigisti/blueberry)
— its AUR. Anyone can write a `bpm.toml` recipe, build the `.bpm` on their own
machine, get it reviewed, and publish it so others can install it with the `bur`
client.

- **Website:** <https://bur.blueberrylinux.org> — browse packages, submit, review, publish, admin
- **Community repo:** <https://repo1.blueberrylinux.org> — the signed index community packages are served from
- **Official repo:** `repo.mmzsigmond.me` — the curated base repo (`bpm`); the `bur` client itself ships here
- **Client:** `bur` — a standalone Rust binary, installed on demand with `bpm install bur` (not part of the base system)

## Install the client

```sh
bpm update
bpm install bur
```

## Use it

```sh
bur search <name>        # search community packages
bur info <name>          # show a package's versions
bur install <name>       # download from repo1 and install via bpm

bur login                # Username -> Password -> Email code
bur submit .             # submit the bpm.toml in the current directory
bur recipes              # list your recipes and their status
bur publish <id> .       # upload the built .bpm for an approved recipe
```

`search`, `info` and `install` are public; `submit` and `publish` require
`bur login` (the session token is stored in `~/.config/bur/token`).

## How it works

1. **Write** a `bpm.toml` recipe — the same format the official repo uses.
2. **Build** the `.bpm` on your own machine (every submission is built by its author).
3. **Submit** it — for review, unless you're a trusted contributor or it's your own package (then it's auto-approved).
4. **Review** — a maintainer approves or rejects it.
5. **Publish** — the built `.bpm` is uploaded to `repo1.blueberrylinux.org`, signed into the index, and installable by anyone.

After **20 approved recipes** you become a trusted contributor and your
submissions publish without review.

### Roles

| Role | Scope | Can |
|---|---|---|
| **Author** | global | anything — approve/reject any recipe, manage users & packages, publish |
| **Maintainer** | global | review and approve/reject recipe submissions |
| **Contributor** | global (default) | create packages, submit recipes, request access to others' packages |
| **Package owner** | per package | edit their own package freely, approve contribution requests to it |
| **Package contributor** | per package | edit a package they were granted access to |

## Architecture

| Component | Tech |
|---|---|
| **Web app + API** (`web/`) | Next.js (App Router) + TypeScript, Prisma -> **PostgreSQL** |
| **Client** (`cli/`) | Rust (`reqwest` + `rustls`), single static binary |
| **Auth** | argon2id passwords, email 2FA via **Resend**, opaque hashed sessions |
| **Security** | server-side RBAC (`web/src/lib/permissions.ts`), zod validation, rate limiting, audit log |

Self-hosted on a single box (`192.168.0.79`, Ubuntu):

- **nginx** — `:82` serves the site (proxying the Next.js app on `127.0.0.1:3000`); `:81` serves the community `.bpm` files + signed index.
- **PostgreSQL** — local, with a daily `pg_dump` backup timer.
- **cloudflared** — a Cloudflare tunnel routes `bur.blueberrylinux.org -> :82` and `repo1.blueberrylinux.org -> :81` (public TLS at the edge; the box speaks plain HTTP).
- Everything runs as persistent `systemd` services, enabled at boot.

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the data model, submission
flow and security details, and **[deploy/DEPLOY.md](deploy/DEPLOY.md)** for the
runbook.

## Layout

```
bur/
  web/     Next.js site & API (prisma/schema.prisma, src/app, src/lib)
  cli/     the Rust `bur` client
  deploy/  systemd unit, nginx vhost, deploy runbook
  docs/    architecture
```

Secrets (`.env`, signing keys), database dumps and the runtime package store are
gitignored and never committed.
