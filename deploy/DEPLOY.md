# Deploying BUR on 192.168.0.79

Ubuntu 22.04, nginx already on `:80` (the `blueberry-repo` mirror site — **do
not touch**). nginx serves BUR on `:82` (plain HTTP) and proxies to the app on
`127.0.0.1:3000`. Public TLS is at the Cloudflare edge (to `192.168.0.79:82`).

## 1. Node.js (not yet installed on the box)

```sh
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
useradd -r -s /usr/sbin/nologin -d /opt/bur bur
```

## 2. App

```sh
mkdir -p /opt/bur && rsync -a web/ /opt/bur/web/     # from this repo
cd /opt/bur/web
cp /path/to/filled.env .env        # DATABASE_URL, RESEND_API_KEY, ...
npm ci
npm run build                      # prisma generate + next build
npx prisma db push                 # create tables in Azure SQL (first time)
chown -R bur:bur /opt/bur
```

## 3. Service

```sh
cp deploy/bur-web.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now bur-web
curl -sS http://127.0.0.1:82/ | head   # smoke test
```

## 4. Cloudflare

Point `bur.mmzsigmond.me` at `192.168.0.79:82` via the same tunnel mechanism the
existing mirror uses. Nothing on the box terminates TLS.

## Community mirror (repo1.mmzsigmond.me)

Approved `.bpm` files are published to `repo1.mmzsigmond.me` (separate from the
official `repo.mmzsigmond.me`). Set up its docroot + `bpmrepo.sh` indexing the
same way as the official mirror; `COMMUNITY_REPO_HOST` in `.env` points the app
at it.
