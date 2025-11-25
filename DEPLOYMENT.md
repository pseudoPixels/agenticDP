# Deployment Guide - AI Lesson Generator

## 📋 Prerequisites

- Python 3.10 or higher
- Node.js 16 or higher
- Google Gemini API Key
- Server with at least 1GB RAM

---

## 🚀 Backend Deployment

### Option 1: Deploy to Heroku

1. **Install Heroku CLI**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

2. **Login to Heroku**
```bash
heroku login
```

3. **Create Heroku App**
```bash
cd backend
heroku create your-lesson-generator-api
```

4. **Set Environment Variables**
```bash
heroku config:set GEMINI_API_KEY=your_api_key_here
```

5. **Deploy**
```bash
git subtree push --prefix backend heroku main
```

### Option 2: Deploy to Railway

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login and Initialize**
```bash
railway login
railway init
```

3. **Set Environment Variables**
```bash
railway variables set GEMINI_API_KEY=your_api_key_here
```

4. **Deploy**
```bash
cd backend
railway up
```

### Option 3: Deploy to DigitalOcean/AWS/GCP

1. **SSH into your server**
```bash
ssh user@your-server-ip
```

2. **Install Python and dependencies**
```bash
sudo apt update
sudo apt install python3.10 python3-pip python3-venv nginx
```

3. **Clone your repository**
```bash
git clone your-repo-url
cd agent_test/backend
```

4. **Set up virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

5. **Create .env file**
```bash
nano .env
```
Add:
```
GEMINI_API_KEY=your_api_key_here
```

6. **Run with Gunicorn**
```bash
gunicorn app:app --bind 0.0.0.0:5000 --workers 2 --timeout 120
```

7. **Set up Nginx reverse proxy**
```bash
sudo nano /etc/nginx/sites-available/lesson-generator
```
Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
    }
}
```

8. **Enable and restart Nginx**
```bash
sudo ln -s /etc/nginx/sites-available/lesson-generator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

9. **Set up systemd service**
```bash
sudo nano /etc/systemd/system/lesson-generator.service
```
Add:
```ini
[Unit]
Description=Lesson Generator API
After=network.target

[Service]
User=your-user
WorkingDirectory=/path/to/agent_test/backend
Environment="PATH=/path/to/agent_test/backend/venv/bin"
ExecStart=/path/to/agent_test/backend/venv/bin/gunicorn app:app --bind 0.0.0.0:5000 --workers 2 --timeout 120
Restart=always

[Install]
WantedBy=multi-user.target
```

10. **Start the service**
```bash
sudo systemctl daemon-reload
sudo systemctl start lesson-generator
sudo systemctl enable lesson-generator
```

---

## 🌐 Frontend Deployment

### Option 1: Deploy to Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Deploy**
```bash
cd frontend
vercel
```

4. **Set Environment Variables**
In Vercel dashboard, add:
```
REACT_APP_API_URL=https://your-backend-url.com
```

### Option 2: Deploy to Netlify

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login**
```bash
netlify login
```

3. **Build**
```bash
cd frontend
npm run build
```

4. **Deploy**
```bash
netlify deploy --prod --dir=build
```

5. **Set Environment Variables**
In Netlify dashboard, add:
```
REACT_APP_API_URL=https://your-backend-url.com
```

### Option 3: Static Hosting (Nginx)

1. **Build the frontend**
```bash
cd frontend
npm install
npm run build
```

2. **Copy build to server**
```bash
scp -r build/* user@your-server:/var/www/lesson-generator/
```

3. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/lesson-generator-frontend
```
Add:
```nginx
server {
    listen 80;
    server_name your-frontend-domain.com;
    root /var/www/lesson-generator;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://your-backend-url.com;
    }
}
```

---

## 🔐 Environment Variables

### Backend (.env)
```bash
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
FLASK_ENV=production
```

### Frontend (.env.production)
```bash
REACT_APP_API_URL=https://your-backend-api-url.com
```

---

## 📦 Docker Deployment (Optional)

### Backend Dockerfile
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120"]
```

### Frontend Dockerfile
```dockerfile
FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always
```

---

## 🔍 Health Checks

### Backend Health Check
```bash
curl https://your-backend-url.com/api/health
```

Expected response:
```json
{
  "message": "Lesson Generator API is running",
  "status": "healthy"
}
```

---

## 📊 Monitoring

### Backend Logs
```bash
# Systemd
sudo journalctl -u lesson-generator -f

# Heroku
heroku logs --tail

# Docker
docker logs -f container_name
```

---

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Update `CORS(app, origins=['your-frontend-url'])` in `app.py`

2. **API Key Not Working**
   - Verify environment variable is set correctly
   - Check API key is valid in Google AI Studio

3. **Timeout Errors**
   - Increase gunicorn timeout: `--timeout 180`
   - Image generation can take 20-30 seconds

4. **Memory Issues**
   - Increase server RAM to at least 1GB
   - Reduce number of workers if needed

---

## 🚀 Performance Optimization

1. **Enable Caching**
   - Cache generated lessons in Redis
   - Cache images in CDN

2. **Load Balancing**
   - Use multiple workers
   - Deploy multiple instances

3. **CDN for Frontend**
   - Use Cloudflare or AWS CloudFront
   - Serve static assets from CDN

---

## 📝 Post-Deployment Checklist

- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] Can generate a lesson
- [ ] Images appear in lessons
- [ ] Chat editing works
- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables secured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Error logging enabled

---

## 🔒 Security Best Practices

1. **API Key Security**
   - Never commit `.env` files
   - Use environment variables
   - Rotate keys regularly

2. **HTTPS**
   - Use Let's Encrypt for free SSL
   - Force HTTPS redirects

3. **Rate Limiting**
   - Implement rate limiting on API endpoints
   - Prevent abuse

4. **Input Validation**
   - Already implemented in backend
   - Monitor for malicious inputs

---

## 📞 Support

For deployment issues, check:
- Backend logs
- Frontend console errors
- Network requests in browser DevTools
- Server resource usage (CPU, RAM)

---

**Deployment Complete! 🎉**

Your AI Lesson Generator is now live and ready to create amazing educational content!
