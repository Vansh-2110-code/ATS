# 🚀 Production Deployment Guide

## Your Production URLs
- **Frontend**: https://ats.weinnovatee.com/
- **Backend API**: http://backendats.weinnovate.com/

---

## **📋 Configuration Setup (DONE ✅)**

### Backend `.env` Updated
```
CORS_ORIGIN=https://ats.weinnovatee.com,http://backendats.weinnovate.com
```
✅ Frontend URL added to CORS whitelist
✅ Backend will accept requests from production frontend

### Frontend Environment Files Created
- `.env.development` → Uses `http://localhost:5000` (local dev)
- `.env.production` → Uses `http://backendats.weinnovate.com` (production)

---

## **🔨 Build Steps**

### Step 1: Build Frontend for Production
```bash
cd "d:\project\Applicant Tracking System"
npm run build
```
- Outputs optimized build to `/dist` folder
- Bundles all assets, code-splits, minifies
- Reads from `.env.production` automatically

### Step 2: Verify Build
```bash
npm run preview  # Test the production build locally
```

---

## **🖥️ Deploy to Traditional VPS**

### Option A: Using Node.js (Recommended)

**1. Copy files to server:**
```bash
# On your VPS
scp -r ./dist your-user@ats.weinnovatee.com:/var/www/ats/frontend/

# Backend stays on backendats.weinnovate.com server
scp -r ./backend your-user@backendats.weinnovate.com:/var/www/ats/backend/
```

**2. On Frontend VPS (ats.weinnovatee.com):**
```bash
cd /var/www/ats/frontend
npm install -g serve  # Install static file server
serve -s dist -l 80   # Serve on port 80
```

**3. On Backend VPS (backendats.weinnovate.com):**
```bash
cd /var/www/ats/backend
npm install
node src/server.js  # Runs on PORT=5000 from .env
```

---

### Option B: Using Nginx + Node.js (Production-Grade ⭐)

**On Frontend VPS:**
```nginx
# /etc/nginx/sites-available/ats
server {
    listen 80;
    server_name ats.weinnovatee.com;

    root /var/www/ats/frontend/dist;

    # Serve static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - send all non-file requests to index.html
    location / {
        try_files $uri /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;
}
```

**On Backend VPS (with Nginx reverse proxy):**
```nginx
# /etc/nginx/sites-available/api
server {
    listen 80;
    server_name backendats.weinnovate.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### Option C: Using Docker (Containerized) 🐳

**Frontend Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]
```

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/src ./src
EXPOSE 5000
CMD ["node", "src/server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://backendats.weinnovate.com
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=https://ats.weinnovatee.com
      - NODE_ENV=production
    volumes:
      - ./backend/uploads:/app/uploads
```

---

## **🔐 SSL/HTTPS Setup**

### Using Let's Encrypt (Free) with Certbot:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d ats.weinnovatee.com
sudo certbot --nginx -d backendats.weinnovate.com

# Auto-renews every 90 days
sudo systemctl enable certbot.timer
```

Nginx will automatically update to:
```nginx
server {
    listen 443 ssl http2;
    server_name ats.weinnovatee.com;
    ssl_certificate /etc/letsencrypt/live/ats.weinnovatee.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ats.weinnovatee.com/privkey.pem;
    # ... rest of config
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name ats.weinnovatee.com;
    return 301 https://$server_name$request_uri;
}
```

---

## **✅ Verification Checklist**

- [ ] Backend `.env` updated with production CORS origin
- [ ] Frontend `.env.production` created with backend URL
- [ ] Run `npm run build` successfully (check `/dist` folder exists)
- [ ] Frontend deployed to `ats.weinnovatee.com`
- [ ] Backend deployed to `backendats.weinnovate.com:5000`
- [ ] Test login at `https://ats.weinnovatee.com/login`
- [ ] Monitor backend logs for CORS issues
- [ ] Check browser DevTools → Network tab (API calls should go to backendats.weinnovate.com)

---

## **🐛 Troubleshooting**

### "CORS error" in browser console
```
→ Check backend CORS_ORIGIN includes frontend URL
→ Verify frontend is calling correct backend API URL
→ Restart backend after .env changes
```

### "Cannot GET /" on frontend
```
→ Verify Nginx is serving /dist folder correctly
→ Check "try_files $uri /index.html" is in Nginx config
→ Ensure SPA routing fallback exists
```

### API calls return 404
```
→ Verify backend is running on correct port
→ Check API routes are registered (in backend/src/routes/)
→ Test directly: curl http://backendats.weinnovate.com/api/health
```

### Images and assets not loading
```
→ Ensure static file paths in Nginx are correct
→ Verify gzip compression settings
→ Check browser cache (Ctrl+Shift+Delete)
```

---

## **📊 Environment Variables Summary**

| Variable | Dev | Production |
|----------|-----|-----------|
| `VITE_API_URL` | http://localhost:5000 | http://backendats.weinnovate.com |
| `CORS_ORIGIN` (backend) | http://localhost:7899 | https://ats.weinnovatee.com |
| `NODE_ENV` (backend) | development | production |
| Frontend Port | 7899 (dev server) | 80/443 (Nginx) |
| Backend Port | 5000 | 5000 |

---

## **🚀 Quick Deployment Summary**

```bash
# Local build & test
npm run build
npm run preview

# Copy to servers (scp/rsync)
scp -r dist user@ats.weinnovatee.com:/var/www/ats/frontend/
scp -r backend user@backendats.weinnovate.com:/var/www/ats/backend/

# On frontend server
cd /var/www/ats/frontend
serve -s dist -l 80

# On backend server
cd /var/www/ats/backend
npm install
node src/server.js
```

---

**Questions?** Check the CORS origin, environment variables, and network tab for API endpoint mismatches!
