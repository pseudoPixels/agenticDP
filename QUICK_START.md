# 🚀 Quick Start Guide

Get DoodlePad up and running in 10 minutes!

## Prerequisites Checklist

- [ ] Node.js 16+ installed
- [ ] Python 3.8+ installed
- [ ] Google account (for Firebase)
- [ ] Gemini API key (already in `.env`)

## Step 1: Install Dependencies (2 minutes)

### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## Step 2: Firebase Setup (5 minutes)

### Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "doodlepad" (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Enable Authentication

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Click **Google**
3. Toggle **Enable**
4. Click **Save**

### Create Firestore Database

1. In Firebase Console → **Firestore Database**
2. Click **Create database**
3. Select **Start in production mode**
4. Choose a location (closest to you)
5. Click **Enable**

### Set Security Rules

1. Go to **Firestore Database** → **Rules**
2. Paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /resources/{resourceId} {
      allow read, write: if request.auth != null && resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null;
    }
    match /students/{studentId} {
      allow read, write: if request.auth != null && resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

## Step 3: Get Firebase Credentials (2 minutes)

### For Frontend (Web Config)

1. **Project Settings** (gear icon) → **General**
2. Scroll to "Your apps"
3. Click Web icon (`</>`)
4. Register app as "DoodlePad Web"
5. Copy the config object

### For Backend (Service Account)

1. **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Save JSON file to `backend/` directory
4. **Important:** Add to `.gitignore`!

## Step 4: Configure Environment Variables (1 minute)

### Backend `.env`

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
GEMINI_API_KEY=your_existing_key

# Add this line with path to your service account JSON
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
```

### Frontend `.env`

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` with your Firebase web config:
```env
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=doodlepad-xxxxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=doodlepad-xxxxx
REACT_APP_FIREBASE_STORAGE_BUCKET=doodlepad-xxxxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

## Step 5: Start the Application

### Terminal 1 - Backend
```bash
cd backend
python app.py
```

Should see:
```
✓ Firebase initialized successfully
✓ Running on http://localhost:5000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

Should open browser at `http://localhost:3000`

## Step 6: Test It Out! 🎉

### Test 1: Generate a Lesson
1. Open http://localhost:3000
2. Enter topic: "Solar System"
3. Click "Generate Lesson"
4. Wait ~30 seconds
5. ✅ See your lesson with images!

### Test 2: Save & Authentication
1. Click "Save Lesson"
2. Sign in with Google
3. ✅ Lesson saved!
4. Click "Library" to see it

### Test 3: Add a Student
1. Go to "Settings"
2. Click "Add Student"
3. Enter name: "Test Student"
4. ✅ Student created!

### Test 4: Assign Lesson
1. Go back to your lesson
2. Click "Assign to Student"
3. Select "Test Student"
4. ✅ Lesson assigned!

## Troubleshooting

### "Firebase not initialized"
- Check `FIREBASE_CREDENTIALS_PATH` in backend `.env`
- Verify JSON file exists and is valid
- Restart backend server

### "Permission denied" in Firestore
- Check Firestore security rules
- Ensure you're signed in
- Verify rules were published

### CORS errors
- Backend should be on port 5000
- Frontend should be on port 3000
- Check `proxy` in `frontend/package.json`

### Authentication popup blocked
- Allow popups for localhost:3000
- Try a different browser

### Images not loading
- Check Gemini API key is valid
- Check backend console for errors
- Imagen API might be rate-limited

## Next Steps

✅ **You're all set!** Here's what you can do:

1. **Create More Resources**
   - Generate lessons on different topics
   - Try the chat editor to modify lessons

2. **Manage Students**
   - Add more students in Settings
   - Assign different resources to them

3. **Explore the Library**
   - Browse your saved resources
   - Filter by type
   - Edit existing lessons

4. **Customize**
   - Change colors in `tailwind.config.js`
   - Modify lesson templates
   - Add new resource types

## Important Files

```
agent_test/
├── backend/
│   ├── app.py                    # Main Flask app
│   ├── .env                      # Backend config (add Firebase path)
│   ├── routes/
│   │   ├── resources.py          # Resource API endpoints
│   │   └── students.py           # Student API endpoints
│   └── services/
│       └── firebase_service.py   # Firebase integration
│
├── frontend/
│   ├── .env                      # Frontend config (add Firebase web config)
│   ├── src/
│   │   ├── AppRouter.js          # Main router
│   │   ├── pages/
│   │   │   ├── Home.js           # Lesson generator page
│   │   │   ├── Library.js        # Resource library
│   │   │   ├── Settings.js       # Student management
│   │   │   └── LessonView.js     # View saved lessons
│   │   ├── components/
│   │   │   ├── Header.js         # Navigation header
│   │   │   ├── SaveButton.js     # Save lesson button
│   │   │   └── AssignButton.js   # Assign to student button
│   │   ├── contexts/
│   │   │   └── AuthContext.js    # Authentication state
│   │   └── services/
│   │       ├── authService.js    # Auth API calls
│   │       ├── resourceService.js # Resource API calls
│   │       └── studentService.js  # Student API calls
│
├── SETUP_GUIDE.md               # Detailed setup instructions
├── API_REFERENCE.md             # Complete API documentation
└── README.md                    # Project overview
```

## Getting Help

1. **Check the logs:**
   - Backend: Terminal running `python app.py`
   - Frontend: Browser console (F12)
   - Firebase: Firebase Console → Firestore → Usage

2. **Read the docs:**
   - [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup
   - [API_REFERENCE.md](./API_REFERENCE.md) - API docs
   - [README.md](./README.md) - Project overview

3. **Common issues:**
   - Most problems are Firebase config related
   - Check `.env` files are correct
   - Verify Firebase rules are published
   - Ensure both servers are running

## Success Indicators

You know it's working when:

✅ Backend shows "Firebase initialized successfully"
✅ You can sign in with Google
✅ Lessons appear in Library after saving
✅ Students can be added in Settings
✅ Resources can be assigned to students
✅ No errors in browser console

## Development Tips

- **Hot reload:** Both servers auto-reload on file changes
- **Debug:** Use browser DevTools and backend console
- **Test:** Try different topics and edit requests
- **Explore:** Check Firebase Console to see data

## Production Deployment

When ready to deploy:

1. Set environment variables on hosting platform
2. Update Firebase authorized domains
3. Configure CORS for production domain
4. Use production Firebase project
5. Enable Firebase App Check (optional)

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for production deployment details.

---

**That's it! You're ready to create amazing educational content with DoodlePad! 🎨📚**
