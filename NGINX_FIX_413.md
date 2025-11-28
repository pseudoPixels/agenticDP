# Fix 413 Request Entity Too Large Error

## Problem
When saving lessons with images, you get:
```
Failed to load resource: the server responded with a status of 413 (Request Entity Too Large)
```

## Root Cause
Nginx blocks large requests by default (usually 1MB limit). Base64-encoded images can be 2-3MB each.

## Solution

### Step 1: Edit Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/lesson-generator
```

### Step 2: Add `client_max_body_size`

Add this line inside the `server` block:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # IMPORTANT: Allow large image uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

### Step 3: Test Configuration

```bash
sudo nginx -t
```

You should see:
```
nginx: configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 4: Restart Nginx

```bash
sudo systemctl restart nginx
```

### Step 5: Verify Fix

Try saving a lesson with images again. It should work now!

---

## Alternative: Global Nginx Configuration

If you want to apply this to all sites, edit the main nginx config:

```bash
sudo nano /etc/nginx/nginx.conf
```

Add inside the `http` block:

```nginx
http {
    # ... other settings ...
    
    client_max_body_size 10M;
    
    # ... rest of config ...
}
```

Then restart:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## Recommended Settings

For production with Firebase Storage (images stored as URLs):
- **`client_max_body_size 10M`** - Allows lesson data with multiple images

For development without Firebase Storage (base64 images):
- **`client_max_body_size 20M`** - Allows larger base64-encoded images

---

## Verify It's Working

1. Open browser DevTools (F12) → Network tab
2. Save a lesson with images
3. Check the POST request to `/api/resources`
4. Should return **200 OK** instead of **413**

---

## Supervisor Configuration (Optional)

If using supervisor, ensure your gunicorn timeout is also sufficient:

```bash
sudo nano /etc/supervisor/conf.d/lesson-generator.conf
```

```ini
[program:lesson-generator]
command=/path/to/venv/bin/gunicorn app:app --bind 127.0.0.1:5000 --workers 2 --timeout 180
directory=/path/to/backend
user=your-user
autostart=true
autorestart=true
stderr_logfile=/var/log/lesson-generator.err.log
stdout_logfile=/var/log/lesson-generator.out.log
```

Restart supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart lesson-generator
```

---

**Done! Your 413 error should be fixed.** ✅
