You do not need Kubernetes to deploy like a grown-up. A $10 VPS, Nginx, and PM2 can give you atomic releases, health-checked restarts, and ten-second rollbacks — the properties that actually matter — with an architecture you can hold in your head.

## The release layout

The whole trick is one symlink:

```
/srv/app/
├── releases/
│   ├── 20260214T0912/
│   ├── 20260218T1544/
│   └── 20260221T1030/   ← newest
├── shared/
│   ├── .env
│   └── uploads/
└── current → releases/20260221T1030
```

Nginx and PM2 only ever know about `/srv/app/current`. A deploy builds a new release directory *next to* the live one, and activation is a single atomic `ln -sfn`. If anything goes wrong before that point, production never noticed.

## The deploy script

Everything below fits in one file in your repo. CI runs it over SSH:

```bash
#!/usr/bin/env bash
set -euo pipefail

APP=/srv/app
RELEASE=$APP/releases/$(date +%Y%m%dT%H%M%S)

# 1. Upload the pre-built artifact (build in CI, not on the box)
mkdir -p "$RELEASE"
tar -xzf /tmp/build.tar.gz -C "$RELEASE"

# 2. Link shared state into the release
ln -s $APP/shared/.env      $RELEASE/.env
ln -s $APP/shared/uploads   $RELEASE/public/uploads

# 3. Install production deps against the lockfile
cd "$RELEASE" && npm ci --omit=dev

# 4. Migrations — expand-only (more on this below)
npx prisma migrate deploy

# 5. Boot a health-check instance on a spare port
PORT=3105 node server.js & CANARY=$!
sleep 2
curl -fsS http://127.0.0.1:3105/api/health || { kill $CANARY; exit 1; }
kill $CANARY

# 6. Atomic activation + graceful reload
ln -sfn "$RELEASE" $APP/current
pm2 reload app --update-env

# 7. Keep the last five releases for rollback
ls -dt $APP/releases/* | tail -n +6 | xargs -r rm -rf
```

Step 5 is the one most home-grown scripts skip: boot the *new* code once before it takes traffic. A missing environment variable or a bad import fails the canary, not production.

## PM2: reload, not restart

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'app',
    cwd: '/srv/app/current',
    script: 'server.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '512M',
    kill_timeout: 8000,
  }],
};
```

`pm2 reload` in cluster mode restarts workers one at a time: the old worker finishes in-flight requests (up to `kill_timeout`) while the new one starts accepting. Two instances is the minimum for this to be truly zero-downtime — with one, there is a brief gap.

Your app must cooperate by shutting down gracefully:

```js
process.on('SIGINT', async () => {
  server.close();          // stop accepting, finish in-flight
  await prisma.$disconnect();
  process.exit(0);
});
```

## Nginx in front

```nginx
upstream app { server 127.0.0.1:3000; keepalive 32; }

server {
  listen 443 ssl http2;
  server_name example.com;

  location /_next/static/ {
    alias /srv/app/current/.next/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location / {
    proxy_pass http://app;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Serving `_next/static` directly from disk means a PM2 reload can never 404 a hashed asset: the files for the old release remain until cleanup, and the new release's files exist before activation.

## Migrations without downtime

The deploy above runs migrations *before* switching traffic, which means old code briefly runs against the new schema. That's fine **if migrations are expand-only**: add columns (nullable or defaulted), add tables, add indexes `CONCURRENTLY`. Destructive changes — drops, renames, tightened constraints — ship in a *later* release, after no running code references the old shape. This "expand → migrate code → contract" rhythm is what actually makes deployments boring.

## Rollback

```bash
ln -sfn $APP/releases/20260218T1544 $APP/current
pm2 reload app
```

Ten seconds, no rebuild, no panic. That symlink is doing more for your uptime than most orchestration platforms will — and when a project genuinely outgrows one box, everything here maps cleanly onto whatever you graduate to.
