# MakerPay — O'rnatish qo'llanmasi

## VPS ga o'rnatish

### 1. Server tayyorlash (Ubuntu 22.04)
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx docker.io docker-compose nodejs npm git

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE USER makerpay_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE makerpay OWNER makerpay_user;"
```

### 2. Loyihani yuklash
```bash
cd /var/www
git clone https://your-repo/makerpay.git
cd makerpay
```

### 3. Backend sozlash
```bash
cd backend
cp .env.example .env
nano .env   # O'zingizning qiymatlarni kiriting

npm install
npm run build
```

### 4. Frontend sozlash
```bash
cd ../frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=https://api.makerpay.uz/api/v1

npm install
npm run build
```

### 5. PM2 bilan ishga tushirish
```bash
npm install -g pm2

# Backend
cd /var/www/makerpay/backend
pm2 start dist/main.js --name makerpay-api

# Frontend
cd /var/www/makerpay/frontend
pm2 start npm --name makerpay-web -- start

pm2 save
pm2 startup
```

### 6. Nginx sozlash
```bash
sudo cp /var/www/makerpay/nginx.conf /etc/nginx/sites-available/makerpay
sudo ln -s /etc/nginx/sites-available/makerpay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL sertifikat
```bash
sudo certbot --nginx -d makerpay.uz -d www.makerpay.uz
sudo certbot --nginx -d api.makerpay.uz
```

### 8. Birinchi admin yaratish
```sql
-- PostgreSQL da:
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

## .env faylida to'ldirish kerak bo'lgan qiymatlar

| Kalit | Tavsif |
|-------|--------|
| DB_PASSWORD | PostgreSQL parol |
| JWT_SECRET | Kamida 64 ta belgidan iborat tasodifiy qator |
| ENCRYPTION_KEY | Aynan 32 ta belgi |
| FRONTEND_URL | https://makerpay.uz |

### JWT_SECRET yaratish:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### ENCRYPTION_KEY yaratish:
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```
