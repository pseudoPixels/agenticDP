# DoodlePad Setup Guide

This guide will help you set up Firebase authentication and database for the DoodlePad application.

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- A Google account for Firebase

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "doodlepad")
4. Follow the setup wizard

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Google** sign-in provider
3. Add your authorized domains (localhost is already authorized by default)

### 3. Create Firestore Database

1. Go to **Firestore Database** in Firebase Console
2. Click "Create database"
3. Choose "Start in production mode" (we'll set up rules next)
4. Select a location close to your users
5. Click "Enable"

### 4. Set Up Firestore Security Rules

Go to **Firestore Database** > **Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Resources collection
    match /resources/{resourceId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null;
    }
    
    // Students collection
    match /students/{studentId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

Click **Publish** to save the rules.

### 5. Get Firebase Configuration

#### For Frontend (Web App):

1. Go to **Project Settings** (gear icon) > **General**
2. Scroll to "Your apps" section
3. Click the **Web** icon (`</>`)
4. Register your app (name: "DoodlePad Web")
5. Copy the `firebaseConfig` object

#### For Backend (Service Account):

1. Go to **Project Settings** > **Service accounts**
2. Click "Generate new private key"
3. Save the JSON file securely
4. **IMPORTANT**: Never commit this file to git!

## Backend Configuration

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and add:

```env
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Firebase - Option 1: Use service account JSON file
FIREBASE_CREDENTIALS_PATH=/path/to/your/serviceAccountKey.json

# Firebase - Option 2: Use environment variables (for deployment)
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_PRIVATE_KEY_ID=your-private-key-id
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
# FIREBASE_CLIENT_ID=your-client-id
```

**Recommended**: Use Option 1 (JSON file) for local development.

### 3. Start Backend Server

```bash
cd backend
python app.py
```

The backend will run on `http://localhost:5000`

## Frontend Configuration

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase web config:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 3. Start Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000`

## Testing the Setup

### 1. Test Authentication

1. Open `http://localhost:3000`
2. Click "Login / Sign Up"
3. Sign in with your Google account
4. You should be redirected back to the app

### 2. Test Resource Saving

1. Generate a lesson
2. Click "Save Lesson"
3. Go to "Library" to see your saved lesson

### 3. Test Student Management

1. Go to "Settings"
2. Add a student
3. Go back to a lesson
4. Click "Assign to Student"
5. Select the student

### 4. Verify in Firebase Console

1. Go to **Firestore Database**
2. You should see collections: `users`, `resources`, `students`
3. Check that data is being saved correctly

## Database Schema

### Users Collection (`users/{userId}`)
```json
{
  "uid": "string",
  "email": "string",
  "name": "string",
  "picture": "string (URL)",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Resources Collection (`resources/{resourceId}`)
```json
{
  "id": "string",
  "user_id": "string",
  "resource_type": "lesson | worksheet | presentation | curriculum",
  "title": "string",
  "content": "object (lesson data)",
  "images": "object (image URLs)",
  "topic": "string",
  "version": "number",
  "assigned_students": ["studentId1", "studentId2"],
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Students Collection (`students/{studentId}`)
```json
{
  "id": "string",
  "user_id": "string",
  "name": "string",
  "grade": "string (optional)",
  "age": "string (optional)",
  "notes": "string (optional)",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## Troubleshooting

### "Firebase not initialized" Error

- Check that your `.env` files are correctly configured
- Verify Firebase credentials are valid
- Restart both frontend and backend servers

### "Permission denied" in Firestore

- Check Firestore security rules
- Ensure user is authenticated
- Verify `user_id` matches authenticated user

### CORS Errors

- Backend should have CORS enabled (already configured in `app.py`)
- Check that frontend proxy is set to `http://localhost:5000` in `package.json`

### Authentication Popup Blocked

- Allow popups for `localhost:3000`
- Try using a different browser

## Production Deployment

### Backend

1. Set environment variables on your hosting platform
2. Use Option 2 (individual env vars) for Firebase config
3. Ensure CORS is configured for your production domain

### Frontend

1. Build the production bundle: `npm run build`
2. Set `REACT_APP_*` environment variables
3. Deploy the `build` folder to your hosting service

### Security Checklist

- [ ] Never commit `.env` files or service account JSON
- [ ] Update Firestore security rules for production
- [ ] Configure authorized domains in Firebase Console
- [ ] Use environment variables for all secrets
- [ ] Enable Firebase App Check (optional, for additional security)

## Support

For issues or questions:
1. Check Firebase Console for errors
2. Review browser console for frontend errors
3. Check backend logs for API errors
4. Verify all environment variables are set correctly

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Home    │  │ Library  │  │ Settings │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│         │              │              │                 │
│         └──────────────┴──────────────┘                 │
│                        │                                 │
│              ┌─────────▼─────────┐                      │
│              │  Auth Context     │                      │
│              │  (Firebase Auth)  │                      │
│              └─────────┬─────────┘                      │
└────────────────────────┼──────────────────────────────┘
                         │
                         │ HTTP/REST API
                         │
┌────────────────────────▼──────────────────────────────┐
│                  Backend (Flask)                       │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │   Routes     │  │   Services   │                  │
│  │ - Resources  │  │ - Firebase   │                  │
│  │ - Students   │  │ - Gemini AI  │                  │
│  └──────────────┘  └──────────────┘                  │
└────────────────────────┬──────────────────────────────┘
                         │
                         │ Firebase Admin SDK
                         │
┌────────────────────────▼──────────────────────────────┐
│                Firebase (Google Cloud)                 │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │ Authentication│  │  Firestore   │                  │
│  │  (Google)     │  │  (Database)  │                  │
│  └──────────────┘  └──────────────┘                  │
└───────────────────────────────────────────────────────┘
```

## Features Implemented

✅ **Authentication**
- Google Sign-In
- Session management
- Protected routes

✅ **Resource Management**
- Save lessons, worksheets, etc.
- View saved resources
- Edit and update resources
- Delete resources
- Categorized library view

✅ **Student Management**
- Add/edit/delete students
- Student profiles (name, grade, age, notes)
- Settings page for management

✅ **Assignment System**
- Assign resources to students
- Unassign resources
- View assigned students per resource
- View resources per student

✅ **Modular Architecture**
- Easy to add new resource types
- Reusable components
- Service layer for API calls
- Context for state management

## Next Steps

To add a new resource type (e.g., "Quiz"):

1. Add to `RESOURCE_TYPES` in `Library.js`
2. Create a generator component (like `LessonGenerator.js`)
3. Create a viewer component (like `LessonViewer.js`)
4. Add route in `AppRouter.js`
5. No backend changes needed! 🎉
