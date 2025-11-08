# Quick Start Guide

## 🚀 Run the Application

### Option 1: Using the Startup Script (Recommended)
```bash
./start.sh
```

This will start both the backend and frontend servers automatically.

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## 📱 Access the Application

Once both servers are running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🎯 First Steps

1. **Generate Your First Lesson:**
   - Open http://localhost:3000
   - Enter a topic (e.g., "Photosynthesis")
   - Click "Generate Lesson"
   - Wait 30-60 seconds for AI to create the lesson and images

2. **Edit the Lesson:**
   - Use the chat interface on the right
   - Try: "Make the introduction shorter"
   - Try: "Change the activities image to cartoon style"
   - Try: "Add more examples to key concepts"

## 🔧 Troubleshooting

### Backend Issues

**Port 5000 already in use:**
```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9
```

**Import errors:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend Issues

**Port 3000 already in use:**
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9
```

**Module not found:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### API Key Issues

If you see "API key not configured":
- Check `backend/.env` file exists
- Verify the GEMINI_API_KEY is set correctly

## 📊 Testing the System

### Test Backend API:
```bash
# Health check
curl http://localhost:5000/api/health

# Generate a lesson
curl -X POST http://localhost:5000/api/generate-lesson \
  -H "Content-Type: application/json" \
  -d '{"topic": "Photosynthesis"}'
```

## 🎨 Customization Tips

### Change Color Scheme:
Edit `frontend/tailwind.config.js` - modify the `primary` colors

### Modify Lesson Template:
Edit `backend/agents/lesson_generator.py` - update the prompt structure

### Add New Image Styles:
Edit `backend/agents/image_generator.py` - add to `style_prefixes`

## 📝 Example Commands for Chat Editor

**Text Edits:**
- "Make the first paragraph shorter"
- "Simplify the language in the introduction"
- "Add more details to the second key concept"
- "Make the title more engaging"

**Image Edits:**
- "Replace the activities image with a cartoon style"
- "Change all images to minimalist style"
- "Make the introduction image more realistic"

**Content Edits:**
- "Add another key concept about [topic]"
- "Include more practice activities"
- "Expand the summary section"

## 🎓 Sample Topics to Try

- **Science**: Photosynthesis, DNA Structure, Newton's Laws
- **History**: Ancient Rome, Industrial Revolution, Space Race
- **Technology**: Artificial Intelligence, Blockchain, Cloud Computing
- **Math**: Pythagorean Theorem, Calculus Basics, Probability
- **Arts**: Renaissance Art, Music Theory, Photography Basics

## 🔍 Monitoring

**Backend Logs:**
- Watch the terminal running Flask for API calls and errors
- All image generation attempts are logged

**Frontend Console:**
- Open browser DevTools (F12)
- Check Console tab for any errors
- Network tab shows API requests

## 💡 Pro Tips

1. **Image Generation**: Takes 10-30 seconds per image, be patient!
2. **Specific Edits**: The more specific your edit request, the better the results
3. **Incremental Changes**: Make one change at a time for best results
4. **Save Lessons**: Currently stored in memory - will be lost on server restart

## 🆘 Need Help?

Check the main README.md for detailed documentation and architecture information.
