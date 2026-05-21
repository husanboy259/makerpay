# MakerPay — To'liq ishga tushurish qo'llanmasi

---

## LOCAL (Development)

### Backend
```bash
cd makerpay/backend
npm install
npm run start:dev
```
> Ishlamasa: `npx ts-node -r tsconfig-paths/register src/main.ts`

### Frontend
```bash
cd makerpay/frontend
npm install
npm run dev
```

**Brauzerda:**
- Frontend: `http://localhost:3000`
- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/api/docs`

---

## SERVER (Production)

### 1. Serverga kirish
```bash
ssh username@server_ip
```

### 2. Loyihani yuklab olish
```bash
cd /var/www
git clone https://github.com/your-repo/makerpay.git
cd makerpay/makerpay/backend
npm install
```

### 3. .env sozlash
```bash
nano .env
```
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://makerpay.uz

DB_HOST=your-supabase-host
DB_PORT=5432
DB_USER=postgres.your_project
DB_PASSWORD=your_password
DB_NAME=postgres
DB_SSL=true

JWT_SECRET=your_32char_secret
ENCRYPTION_KEY=your_32char_key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://api.makerpay.uz/api/v1/auth/google/callback
```

### 4. Build qilish
```bash
# nest-cli.json yangilash
cat > nest-cli.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "outDir": "dist",
    "tsConfigPath": "tsconfig.json"
  }
}
EOF

# tsconfig.build.json yaratish
cat > tsconfig.build.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
EOF

# Build
npm run build

# Tekshirish
ls dist/
```

### 5. PM2 bilan ishga tushurish (Backend)
```bash
pm2 delete makerpay-api 2>/dev/null; true
pm2 start dist/main.js --name makerpay-api
pm2 save
pm2 startup
```

### 6. Frontend build va ishga tushurish
```bash
cd /var/www/makerpay/makerpay/frontend
npm install

# .env.local
echo "NEXT_PUBLIC_API_URL=https://api.makerpay.uz/api/v1" > .env.local

npm run build
pm2 start npm --name makerpay-frontend -- start
pm2 save
```

### 7. PM2 status tekshirish
```bash
pm2 status
pm2 logs makerpay-api --lines 50
```

---

## NGINX sozlash

```bash
sudo nano /etc/nginx/sites-available/makerpay
```

```nginx
# Backend API
server {
    listen 80;
    server_name api.makerpay.uz;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Frontend
server {
    listen 80;
    server_name makerpay.uz www.makerpay.uz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/makerpay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL (HTTPS)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d makerpay.uz -d www.makerpay.uz -d api.makerpay.uz
```

---

## Yangilash (Update)

```bash
cd /var/www/makerpay
git pull

# Backend
cd makerpay/backend
npm install
npm run build
pm2 restart makerpay-api --update-env

# Frontend
cd ../frontend
npm install
npm run build
pm2 restart makerpay-frontend
```

---

## Muammolar

| Muammo | Yechim |
|--------|--------|
| `dist` yaratilmaydi | `cat > tsconfig.build.json` (yuqorida) |
| DB ulanmaydi | `.env` da `DB_PASSWORD` to'g'ri yozing |
| Port band | `pm2 delete all` → qayta ishga tushuring |
| PM2 restart bo'lmaydi | `pm2 restart app --update-env` |
| Google OAuth ishlamaydi | Google Console da redirect URI qo'shing |

---

## Admin yaratish

Supabase SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```
