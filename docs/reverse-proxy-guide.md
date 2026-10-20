# ATS Tech Single-Domain Reverse Proxy & Hosting Guide

This guide documents the production deployment topology for hosting the entire ATS Tech platform under a single unified domain (`https://atstech.com`).

---

## 1. Unified Route Mapping

| Target URL | Destination / Application | Technology |
| :--- | :--- | :--- |
| `https://atstech.com/` | Public Marketing Website | Next.js 14 App Router |
| `https://atstech.com/dashboard` | Unified Authenticated Dashboard | Next.js 14 App Router |
| `https://atstech.com/easybook/` | ATS EasyBook Publishing Portal | Next.js 14 App Router |
| `https://atstech.com/preflight/` | ATS Preflight & Repair Workspace | Next.js 14 App Router |
| `https://atstech.com/Impose/` | ATS Impose / MyDraw Workspace | Vite 5 SPA Submodule |

---

## 2. Nginx Reverse Proxy Configuration

```nginx
# /etc/nginx/sites-available/atstech.com.conf

upstream nextjs_upstream {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name atstech.com www.atstech.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name atstech.com www.atstech.com;

    ssl_certificate /etc/letsencrypt/live/atstech.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/atstech.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 1. ATS Impose Submodule (Direct Static Serving or Next.js Internal Route)
    location /Impose/ {
        proxy_pass http://nextjs_upstream/Impose/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Case-insensitive alias for /impose/
    location /impose/ {
        rewrite ^/impose/(.*)$ /Impose/$1 permanent;
    }

    # 2. ATS Platform & EasyBook / Preflight (Next.js Application)
    location / {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 3. Caddyfile Configuration (Alternative)

```caddy
atstech.com {
    encode gzip zstd

    # All routes including /Impose/ served by integrated ATS Tech host
    handle {
        reverse_proxy 127.0.0.1:3000
    }
}
```

---

## 4. Local Development Environment Configuration

In `.env.local`:
```env
# Port configuration
PORT=3008

# ATS Impose URL (integrated same-origin mounting)
NEXT_PUBLIC_IMPOSITION_URL=/Impose/
```
