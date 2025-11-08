# AI-Powered Lesson Generator

An intelligent lesson generation system that creates professional, dynamic educational content with AI-generated images. Built with Flask, React, Google Gemini AI, and Imagen (Nano Banana).

## 🌟 Features

- **AI Lesson Generation**: Create comprehensive lessons on any topic using Gemini AI
- **Dynamic Image Generation**: Automatically generate contextual images using Imagen (Nano Banana)
- **Chat-Based Editing**: Modify lessons using natural language commands
- **Modern UI**: Beautiful, responsive interface built with React and TailwindCSS
- **Agentic Architecture**: Three specialized AI agents working together:
  - **Lesson Generator Agent**: Creates structured educational content
  - **Image Generator Agent**: Produces relevant educational images
  - **Lesson Editor Agent**: Processes natural language edit requests

## 🏗️ Architecture

### Backend (Flask)
- RESTful API with Flask
- Three AI agents powered by Google Gemini
- In-memory lesson storage (easily extendable to database)
- Image generation with Imagen API

### Frontend (React)
- Modern, responsive UI with TailwindCSS
- Real-time lesson preview
- Interactive chat interface for editing
- Dynamic image loading and display

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- Google Gemini API Key (provided in .env)

## 🚀 Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate virtual environment (already done):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies (already done):
```bash
pip install -r requirements.txt
```

4. The API key is already configured in `.env` file

5. Start the Flask server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## 🎯 Usage

### Generating a Lesson

1. Open `http://localhost:3000` in your browser
2. Enter a topic (e.g., "Photosynthesis", "Machine Learning", "Ancient Rome")
3. Click "Generate Lesson"
4. Wait for the AI to create the lesson structure and generate images
5. View your professional, image-rich lesson!

### Editing a Lesson

Use the chat interface on the right side to make edits:

**Text Modifications:**
- "Make the first paragraph shorter"
- "Add more examples to the key concepts"
- "Make the title more engaging"
- "Simplify the introduction"

**Image Modifications:**
- "Replace the activities image with a cartoon style"
- "Change the introduction image to be more realistic"
- "Make the key concept images minimalist"

**Content Changes:**
- "Add another key concept about [topic]"
- "Include more practice activities"
- "Expand the summary section"

## 🔧 API Endpoints

### `POST /api/generate-lesson`
Generate a new lesson on a given topic
```json
{
  "topic": "Photosynthesis"
}
```

### `POST /api/generate-images/<lesson_id>`
Generate images for a lesson

### `GET /api/lesson/<lesson_id>`
Retrieve a lesson by ID

### `POST /api/edit-lesson/<lesson_id>`
Edit a lesson using natural language
```json
{
  "request": "Make the first paragraph shorter"
}
```

### `GET /api/lessons`
List all generated lessons

## 🎨 Customization

### Adding New Image Styles

Edit `backend/agents/image_generator.py` and add new styles to the `style_prefixes` dictionary:

```python
style_prefixes = {
    "educational": "Professional educational illustration...",
    "cartoon": "Colorful cartoon style...",
    "your_style": "Your custom prompt prefix...",
}
```

### Modifying Lesson Structure

Edit `backend/agents/lesson_generator.py` to change the lesson template structure in the `generate_lesson` method.

### UI Customization

Modify `frontend/tailwind.config.js` to change colors, fonts, and styling:

```javascript
theme: {
  extend: {
    colors: {
      primary: { /* your colors */ }
    }
  }
}
```

## 🧠 How the Agentic System Works

### 1. Lesson Generation Flow
```
User Input (Topic)
    ↓
Lesson Generator Agent (Gemini)
    ↓
Structured Lesson JSON
    ↓
Image Generator Agent (Imagen)
    ↓
Complete Lesson with Images
```

### 2. Lesson Editing Flow
```
User Edit Request
    ↓
Lesson Editor Agent (Gemini)
    ↓
Analyzes Current Lesson + Request
    ↓
Generates Modification Instructions
    ↓
Applies Changes to Lesson
    ↓
Regenerates Images (if needed)
    ↓
Updated Lesson
```

## 🛠️ Technology Stack

**Backend:**
- Flask 3.0.0
- Google GenAI SDK (google-genai)
- Gemini 2.5 Flash Lite (lesson generation & editing)
- Gemini 2.5 Flash Image / Nano Banana (image generation)
- Python 3.10+

**Frontend:**
- React 18.2
- TailwindCSS 3.3
- Lucide React (icons)
- Axios (API calls)

## 📝 Example Lesson Topics

- **Science**: Photosynthesis, Quantum Physics, Climate Change
- **History**: Ancient Egypt, World War II, Renaissance
- **Technology**: Machine Learning, Blockchain, Web Development
- **Mathematics**: Calculus Basics, Statistics, Geometry
- **Languages**: Spanish Grammar, English Literature, Creative Writing

## 🔒 Security Notes

- The API key is currently in `.env` for development
- In production, use environment variables and secure key management
- Implement authentication for the API endpoints
- Add rate limiting to prevent abuse

## 🚧 Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User authentication and lesson saving
- [ ] Export lessons to PDF/HTML
- [ ] Multiple language support
- [ ] Collaborative editing
- [ ] Lesson templates library
- [ ] Advanced image editing options
- [ ] Voice narration for lessons
- [ ] Quiz generation from lesson content

## 📄 License

This project is for educational and demonstration purposes.

## 🤝 Contributing

Feel free to fork, modify, and enhance this project!

## 📧 Support

For issues or questions, please check the console logs in both backend and frontend for debugging information.
