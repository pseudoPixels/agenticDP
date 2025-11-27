# 📋 Setup Checklist

Use this checklist to ensure everything is properly configured.

## Prerequisites

- [ ] Node.js 16+ installed (`node --version`)
- [ ] Python 3.8+ installed (`python --version`)
- [ ] Google account for Firebase
- [ ] Gemini API key (already in backend/.env)

## Firebase Setup

### Project Creation
- [ ] Created Firebase project at console.firebase.google.com
- [ ] Project name: _______________
- [ ] Project ID: _______________

### Authentication
- [ ] Enabled Google Sign-In in Authentication > Sign-in method
- [ ] Added localhost to authorized domains (should be default)

### Firestore Database
- [ ] Created Firestore database
- [ ] Selected region: _______________
- [ ] Set security rules (copy from SETUP_GUIDE.md)
- [ ] Published security rules

### Credentials
- [ ] Downloaded service account JSON for backend
- [ ] Saved to: `backend/serviceAccountKey.json`
- [ ] Added `serviceAccountKey.json` to `.gitignore`
- [ ] Copied web config for frontend

## Backend Configuration

### Dependencies
- [ ] Installed Python packages: `pip install -r requirements.txt`
- [ ] Verified firebase-admin installed

### Environment Variables
- [ ] Created `backend/.env` from `.env.example`
- [ ] Added GEMINI_API_KEY (should already exist)
- [ ] Added FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
- [ ] Verified .env is in .gitignore

### Testing
- [ ] Started backend: `python app.py`
- [ ] Saw "Firebase initialized successfully"
- [ ] Backend running on http://localhost:5000
- [ ] No errors in console

## Frontend Configuration

### Dependencies
- [ ] Installed npm packages: `npm install`
- [ ] Verified firebase package installed
- [ ] Verified react-router-dom installed

### Environment Variables
- [ ] Created `frontend/.env` from `.env.example`
- [ ] Added REACT_APP_FIREBASE_API_KEY
- [ ] Added REACT_APP_FIREBASE_AUTH_DOMAIN
- [ ] Added REACT_APP_FIREBASE_PROJECT_ID
- [ ] Added REACT_APP_FIREBASE_STORAGE_BUCKET
- [ ] Added REACT_APP_FIREBASE_MESSAGING_SENDER_ID
- [ ] Added REACT_APP_FIREBASE_APP_ID
- [ ] Verified .env is in .gitignore

### Testing
- [ ] Started frontend: `npm start`
- [ ] Browser opened at http://localhost:3000
- [ ] No errors in browser console
- [ ] Can see DoodlePad interface

## Functional Testing

### Authentication
- [ ] Clicked "Login / Sign Up" button
- [ ] Google Sign-In popup appeared
- [ ] Successfully signed in
- [ ] User name appears in header
- [ ] Can sign out

### Lesson Generation
- [ ] Generated a lesson on any topic
- [ ] Lesson appeared with content
- [ ] Images loaded successfully
- [ ] Can edit lesson with chat

### Save Functionality
- [ ] Clicked "Save Lesson" button
- [ ] Lesson saved successfully
- [ ] "Saved!" confirmation appeared
- [ ] Resource ID received

### Library
- [ ] Navigated to Library page
- [ ] Saved lesson appears in list
- [ ] Can filter by resource type
- [ ] Can click to open lesson
- [ ] Can delete lesson

### Student Management
- [ ] Navigated to Settings page
- [ ] Clicked "Add Student"
- [ ] Filled in student details
- [ ] Student saved successfully
- [ ] Student appears in list
- [ ] Can edit student
- [ ] Can delete student

### Assignment System
- [ ] Opened a saved lesson
- [ ] Clicked "Assign to Student"
- [ ] Modal appeared with student list
- [ ] Selected a student
- [ ] Assignment successful
- [ ] Student name shows on resource card

### Firebase Verification
- [ ] Opened Firebase Console
- [ ] Checked Firestore Database
- [ ] Saw `users` collection with your user
- [ ] Saw `resources` collection with saved lessons
- [ ] Saw `students` collection with added students
- [ ] Data structure looks correct

## Common Issues Resolution

### Firebase Not Initialized
- [ ] Checked FIREBASE_CREDENTIALS_PATH is correct
- [ ] Verified JSON file exists and is valid
- [ ] Restarted backend server

### Authentication Not Working
- [ ] Verified Google Sign-In is enabled in Firebase
- [ ] Checked browser allows popups
- [ ] Verified Firebase web config is correct
- [ ] Checked browser console for errors

### Permission Denied Errors
- [ ] Verified Firestore security rules are published
- [ ] Checked user is signed in
- [ ] Verified user_id matches in data

### CORS Errors
- [ ] Backend is running on port 5000
- [ ] Frontend is running on port 3000
- [ ] Checked proxy in package.json

### Images Not Loading
- [ ] Verified Gemini API key is valid
- [ ] Checked backend console for errors
- [ ] Waited for image generation (can take 30s)

## Production Readiness

### Security
- [ ] .env files not committed to git
- [ ] Service account JSON not committed
- [ ] Firestore rules tested and secure
- [ ] CORS configured for production domain

### Configuration
- [ ] Environment variables documented
- [ ] Firebase project set to production
- [ ] Authorized domains updated
- [ ] API keys secured

### Documentation
- [ ] Read SETUP_GUIDE.md
- [ ] Read API_REFERENCE.md
- [ ] Read QUICK_START.md
- [ ] Understand IMPLEMENTATION_SUMMARY.md

## Next Steps

After completing this checklist:

1. **Explore Features**
   - [ ] Try different lesson topics
   - [ ] Test chat-based editing
   - [ ] Create multiple students
   - [ ] Assign various resources

2. **Customize**
   - [ ] Change app colors in tailwind.config.js
   - [ ] Modify lesson templates
   - [ ] Add custom resource types

3. **Deploy** (when ready)
   - [ ] Choose hosting platforms
   - [ ] Set up production Firebase project
   - [ ] Configure environment variables
   - [ ] Test production deployment

## Support Resources

- **Setup Issues:** See SETUP_GUIDE.md
- **API Questions:** See API_REFERENCE.md
- **Quick Start:** See QUICK_START.md
- **Architecture:** See IMPLEMENTATION_SUMMARY.md
- **General Info:** See README.md

## Success Criteria

✅ You're ready when:
- Backend starts without errors
- Frontend loads without errors
- Can sign in with Google
- Can generate and save lessons
- Can add and manage students
- Can assign resources to students
- Data appears in Firebase Console

---

**Congratulations! You've successfully set up DoodlePad! 🎉**

Date Completed: _______________
Completed By: _______________
