# System Architecture - AI Lesson Generator

## 🏗️ Overview

This is an **agentic AI system** that uses multiple specialized agents to generate, enhance, and edit educational lessons. The system combines Google's Gemini AI for content generation and Imagen (Nano Banana) for image creation.

## 🤖 Agentic Architecture

### What Makes This "Agentic"?

An agentic system uses multiple AI agents, each with specific responsibilities, working together to accomplish complex tasks. This system implements three specialized agents:

### 1. **Lesson Generator Agent** (`backend/agents/lesson_generator.py`)

**Responsibility**: Create structured, comprehensive educational content

**Capabilities**:
- Analyzes the topic and generates appropriate content
- Creates a structured lesson with multiple sections
- Generates image prompts for each section
- Handles fallback scenarios if generation fails

**Key Methods**:
- `generate_lesson(topic)`: Main generation method
- `_create_fallback_lesson(topic)`: Backup structure

**Output Structure**:
```json
{
  "title": "Lesson Title",
  "subtitle": "Engaging subtitle",
  "introduction": {
    "text": "Introduction content",
    "image_prompt": "Description for image"
  },
  "key_concepts": [...],
  "detailed_content": [...],
  "activities": {...},
  "summary": {...}
}
```

### 2. **Image Generator Agent** (`backend/agents/image_generator.py`)

**Responsibility**: Generate contextual, educational images

**Capabilities**:
- Uses Imagen API (Nano Banana) for image generation
- Supports multiple visual styles (educational, cartoon, realistic, etc.)
- Enhances prompts based on desired style
- Returns base64-encoded images for easy embedding

**Key Methods**:
- `generate_image(prompt, style)`: Generate image from prompt
- `_enhance_prompt(prompt, style)`: Optimize prompts for better results

**Supported Styles**:
- `educational`: Professional, clean illustrations
- `cartoon`: Friendly, colorful cartoons
- `realistic`: Photorealistic images
- `minimalist`: Simple, modern designs
- `diagram`: Clear, labeled diagrams

### 3. **Lesson Editor Agent** (`backend/agents/lesson_editor.py`)

**Responsibility**: Process natural language edit requests

**Capabilities**:
- Understands natural language instructions
- Analyzes current lesson structure
- Determines what needs to be changed
- Applies modifications intelligently
- Identifies when images need regeneration

**Key Methods**:
- `process_edit_request(lesson_data, user_request)`: Main editing method
- `_apply_modifications(lesson_data, instructions)`: Apply changes
- `_set_nested_value(data, path, value)`: Update nested JSON

**Edit Types Supported**:
- `modify_text`: Change text content
- `modify_image`: Update image prompts/styles
- `modify_structure`: Restructure sections
- `add_content`: Add new elements
- `remove_content`: Remove elements

## 🔄 System Flow

### Lesson Generation Flow

```
User enters topic
    ↓
Frontend → POST /api/generate-lesson
    ↓
Lesson Generator Agent
    ├─ Analyzes topic
    ├─ Creates structured content
    └─ Generates image prompts
    ↓
Lesson structure returned
    ↓
Frontend → POST /api/generate-images/{id}
    ↓
Image Generator Agent (for each section)
    ├─ Takes image prompt
    ├─ Enhances with style prefix
    ├─ Calls Imagen API
    └─ Returns base64 image
    ↓
Complete lesson with images displayed
```

### Lesson Editing Flow

```
User types edit request in chat
    ↓
Frontend → POST /api/edit-lesson/{id}
    ↓
Lesson Editor Agent
    ├─ Receives current lesson + request
    ├─ Analyzes what needs to change
    ├─ Generates modification plan
    │   ├─ Text changes
    │   ├─ Structure changes
    │   └─ Image changes
    ├─ Applies modifications
    └─ Returns updated lesson
    ↓
If images need regeneration:
    ↓
Image Generator Agent
    └─ Generates new images
    ↓
Updated lesson displayed
```

## 🗄️ Data Flow

### Backend State Management

```python
lessons_store = {
    "lesson_id_123": {
        "data": {
            # Lesson structure
            "title": "...",
            "introduction": {...},
            # ... other sections
        },
        "images": {
            "introduction": "data:image/png;base64,...",
            "key_concept_0": "data:image/png;base64,...",
            # ... other images
        },
        "image_generation_status": {}
    }
}
```

### Frontend State Management

```javascript
// App.js
const [currentLesson, setCurrentLesson] = useState(null);
const [lessonImages, setLessonImages] = useState({});

// LessonViewer.js - Displays lesson content
// ChatEditor.js - Handles edit requests
```

## 🌐 API Architecture

### RESTful Endpoints

| Endpoint | Method | Purpose | Agent Used |
|----------|--------|---------|------------|
| `/api/health` | GET | Health check | None |
| `/api/generate-lesson` | POST | Generate lesson | Lesson Generator |
| `/api/generate-images/{id}` | POST | Generate images | Image Generator |
| `/api/lesson/{id}` | GET | Retrieve lesson | None |
| `/api/edit-lesson/{id}` | POST | Edit lesson | Lesson Editor + Image Generator |
| `/api/lessons` | GET | List lessons | None |

## 🎨 Frontend Architecture

### Component Hierarchy

```
App.js (Root)
├── LessonGenerator.js
│   └── Form for topic input
│   └── Status display
│
└── (After generation)
    ├── LessonViewer.js (2/3 width)
    │   ├── Title section
    │   ├── Introduction
    │   ├── Key Concepts
    │   ├── Detailed Content
    │   ├── Activities
    │   ├── Summary
    │   └── Resources
    │
    └── ChatEditor.js (1/3 width)
        ├── Message history
        ├── Quick actions
        └── Input field
```

### Styling Architecture

**TailwindCSS Utility Classes** + **Custom Components**

```css
/* Custom component classes in index.css */
.lesson-card        → White card with shadow
.lesson-heading     → Section headings with icons
.concept-card       → Blue gradient cards
.activity-card      → Green gradient cards
.chat-message       → Chat bubbles
.btn-primary        → Primary action buttons
```

## 🔌 Integration Points

### Google Gemini Integration

```python
from google import genai

client = genai.Client(api_key=api_key)

response = client.models.generate_content(
    model='gemini-2.5-flash-lite',
    contents=[prompt]
)

# Extract text from response
for part in response.parts:
    if part.text is not None:
        text = part.text
```

### Imagen (Nano Banana) Integration

```python
from google import genai

client = genai.Client(api_key=api_key)

response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents=[prompt]
)

# Extract image from response
for part in response.parts:
    if part.inline_data is not None:
        image = part.as_image()
        image.save("output.png")
```

## 🔐 Security Considerations

### Current Implementation (Development)
- API key in `.env` file
- No authentication on endpoints
- In-memory storage (data lost on restart)

### Production Recommendations
1. **Authentication**: Add JWT or OAuth
2. **Rate Limiting**: Prevent API abuse
3. **Database**: PostgreSQL/MongoDB for persistence
4. **API Key Management**: Use secrets manager (AWS Secrets, Azure Key Vault)
5. **Input Validation**: Sanitize all user inputs
6. **CORS**: Restrict to specific domains
7. **HTTPS**: Use SSL certificates

## 📊 Performance Considerations

### Bottlenecks
1. **Image Generation**: 10-30 seconds per image
2. **Lesson Generation**: 5-10 seconds
3. **Multiple Images**: Sequential generation (can be parallelized)

### Optimization Strategies
1. **Parallel Image Generation**: Use threading/async
2. **Caching**: Cache generated lessons
3. **Progressive Loading**: Show text first, images as they load
4. **Image Compression**: Optimize image sizes
5. **CDN**: Store images in CDN for faster delivery

## 🧪 Testing Strategy

### Backend Testing
```python
# Unit tests for each agent
def test_lesson_generator():
    agent = LessonGeneratorAgent(api_key)
    lesson = agent.generate_lesson("Test Topic")
    assert "title" in lesson
    assert "introduction" in lesson

# Integration tests for API
def test_generate_lesson_endpoint():
    response = client.post('/api/generate-lesson', 
                          json={'topic': 'Test'})
    assert response.status_code == 200
```

### Frontend Testing
```javascript
// Component tests with React Testing Library
test('renders lesson generator', () => {
  render(<LessonGenerator />);
  expect(screen.getByText('Generate Your Lesson')).toBeInTheDocument();
});
```

## 🚀 Deployment Architecture

### Recommended Setup

```
┌─────────────────┐
│   Load Balancer │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ React │ │ Flask │
│ (CDN) │ │ (EC2) │
└───────┘ └───┬───┘
              │
         ┌────▼─────┐
         │ Database │
         │(RDS/Mongo)│
         └──────────┘
```

## 📈 Scalability

### Horizontal Scaling
- Multiple Flask instances behind load balancer
- Shared database for lesson storage
- Redis for session management

### Vertical Scaling
- Increase server resources for AI processing
- GPU instances for faster image generation

## 🔄 Future Enhancements

### Agent Improvements
1. **Quiz Generator Agent**: Create assessments from lessons
2. **Translation Agent**: Multi-language support
3. **Accessibility Agent**: Add alt text, ARIA labels
4. **Quality Checker Agent**: Verify content accuracy

### System Improvements
1. **Real-time Collaboration**: Multiple users editing
2. **Version Control**: Track lesson changes
3. **Export Options**: PDF, SCORM, HTML
4. **Analytics**: Track usage and engagement

## 📚 Key Design Decisions

### Why Agentic Architecture?
- **Separation of Concerns**: Each agent has one job
- **Maintainability**: Easy to update individual agents
- **Testability**: Test agents independently
- **Scalability**: Scale agents separately based on load
- **Flexibility**: Easy to add new agents

### Why In-Memory Storage?
- **Simplicity**: Quick development and testing
- **Stateless**: Easy to restart and test
- **Trade-off**: Data persistence for production requires database

### Why Base64 Images?
- **Simplicity**: No file storage needed
- **Portability**: Images embedded in JSON
- **Trade-off**: Larger payload size (consider CDN for production)

## 🎓 Learning Resources

To understand this architecture better:
- **Agentic AI**: Research papers on multi-agent systems
- **Flask REST APIs**: Flask documentation
- **React State Management**: React hooks documentation
- **Gemini API**: Google AI documentation
- **TailwindCSS**: Tailwind documentation
