# Guide: Adding New Content Types

This guide shows how to add new content generators (Worksheet, Curriculum, Flashcards, Quiz, etc.) following the modular architecture.

## Quick Reference

### Steps to Add a New Content Type

1. **Create Backend Agent** (`backend/agents/your_generator.py`)
2. **Update Agent Exports** (`backend/agents/__init__.py`)
3. **Add API Endpoints** (`backend/app.py`)
4. **Create Frontend Viewer** (`frontend/src/components/YourViewer.js`)
5. **Add API Helpers** (`frontend/src/api.js`)
6. **Update App Routing** (`frontend/src/App.js`)
7. **Test End-to-End**

---

## Example: Adding Worksheet Generator

### 1. Create Backend Agent

**File**: `backend/agents/worksheet_generator.py`

```python
from google import genai
import json
import re
from typing import Dict, Any
from .image_generator import ImageGeneratorAgent


class WorksheetGeneratorAgent:
    """Agent responsible for generating educational worksheets"""
    
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.0-flash-exp'
        self.image_generator = ImageGeneratorAgent(api_key)
        
    def generate_worksheet(self, topic: str) -> Dict[str, Any]:
        """Generate a comprehensive worksheet on the given topic"""
        
        prompt = f"""You are an expert educational content creator. Generate a worksheet on: "{topic}"

Structure the worksheet with the following sections (return as valid JSON):
{{
    "title": "Worksheet title",
    "subtitle": "Grade level or description",
    "instructions": "General instructions for students",
    "sections": [
        {{
            "type": "multiple_choice",
            "title": "Section title",
            "questions": [
                {{
                    "question": "Question text",
                    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
                    "answer": "B"
                }}
            ],
            "image_prompt": "Description for section image"
        }},
        {{
            "type": "fill_in_blank",
            "title": "Fill in the Blanks",
            "questions": [
                {{
                    "question": "The ____ is the largest planet.",
                    "answer": "Jupiter"
                }}
            ]
        }},
        {{
            "type": "short_answer",
            "title": "Short Answer Questions",
            "questions": [
                {{
                    "question": "Explain why...",
                    "points": 5
                }}
            ]
        }}
    ]
}}

Return ONLY the JSON, no markdown formatting."""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[prompt]
            )
            
            worksheet_text = response.text.strip()
            worksheet_text = re.sub(r'^```json\s*', '', worksheet_text)
            worksheet_text = re.sub(r'\s*```$', '', worksheet_text)
            
            worksheet_data = json.loads(worksheet_text)
            worksheet_data['topic'] = topic
            worksheet_data['version'] = 1
            
            return worksheet_data
            
        except Exception as e:
            print(f"Error generating worksheet: {e}")
            return self._create_fallback_worksheet(topic)
    
    def _create_fallback_worksheet(self, topic: str) -> Dict[str, Any]:
        """Create a basic worksheet if generation fails"""
        return {
            "title": f"Worksheet: {topic}",
            "subtitle": "Educational worksheet",
            "topic": topic,
            "version": 1,
            "instructions": "Complete all questions to the best of your ability.",
            "sections": [
                {
                    "type": "short_answer",
                    "title": "Questions",
                    "questions": [
                        {
                            "question": f"What do you know about {topic}?",
                            "points": 10
                        }
                    ]
                }
            ]
        }
```

### 2. Update Agent Exports

**File**: `backend/agents/__init__.py`

```python
from .lesson_generator import LessonGeneratorAgent
from .image_generator import ImageGeneratorAgent
from .lesson_editor import LessonEditorAgent
from .presentation_generator import PresentationGeneratorAgent
from .worksheet_generator import WorksheetGeneratorAgent  # ADD THIS

__all__ = [
    'LessonGeneratorAgent', 
    'ImageGeneratorAgent', 
    'LessonEditorAgent', 
    'PresentationGeneratorAgent',
    'WorksheetGeneratorAgent'  # ADD THIS
]
```

### 3. Add API Endpoints

**File**: `backend/app.py`

```python
# At top - import the agent
from agents import (
    LessonGeneratorAgent, 
    ImageGeneratorAgent, 
    LessonEditorAgent, 
    PresentationGeneratorAgent,
    WorksheetGeneratorAgent  # ADD THIS
)

# Initialize the agent
worksheet_generator = WorksheetGeneratorAgent(GEMINI_API_KEY)

# Add storage
worksheets_store: Dict[str, Dict[str, Any]] = {}

# Add endpoints
@app.route('/api/generate-worksheet-stream', methods=['POST'])
def generate_worksheet_stream():
    """Generate a worksheet with streaming updates"""
    def generate():
        try:
            request_data = request.get_json()
            topic = request_data.get('topic')
            
            if not topic:
                yield f"data: {json.dumps({'error': 'Topic is required'})}\n\n"
                return
            
            worksheet_id = str(uuid.uuid4())
            
            # Send init
            yield f"data: {json.dumps({'type': 'init', 'worksheet_id': worksheet_id, 'topic': topic})}\n\n"
            
            # Generate worksheet
            print(f"Generating worksheet for topic: {topic}", flush=True)
            worksheet_data = worksheet_generator.generate_worksheet(topic)
            worksheet_data['id'] = worksheet_id
            
            # Store
            worksheets_store[worksheet_id] = {
                'data': worksheet_data,
                'images': {},
                'image_generation_status': {}
            }
            
            # Send worksheet
            yield f"data: {json.dumps({'type': 'worksheet', 'worksheet': worksheet_data})}\n\n"
            
            # Generate images for sections with image_prompt
            worksheet_store = worksheets_store[worksheet_id]
            sections = worksheet_data.get('sections', [])
            
            for idx, section in enumerate(sections):
                if 'image_prompt' in section and section['image_prompt']:
                    prompt = section['image_prompt']
                    print(f"Generating image for section {idx+1}: {prompt[:50]}...", flush=True)
                    image_data = image_generator.generate_image(prompt, "educational")
                    if image_data:
                        key = f'section_{idx}'
                        worksheet_store['images'][key] = image_data
                        yield f"data: {json.dumps({'type': 'image', 'key': key, 'image': image_data})}\n\n"
            
            # Complete
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
            
        except Exception as e:
            print(f"Error in generate_worksheet_stream: {e}", flush=True)
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/worksheet/<worksheet_id>', methods=['GET'])
def get_worksheet(worksheet_id):
    """Get a worksheet by ID"""
    try:
        if worksheet_id in worksheets_store:
            worksheet_store = worksheets_store[worksheet_id]
            return jsonify({
                "success": True,
                "worksheet": worksheet_store['data'],
                "images": worksheet_store['images']
            })
        
        # Try Firebase
        resource = firebase_service.get_resource(worksheet_id)
        if resource:
            worksheets_store[worksheet_id] = {
                'data': resource.get('content', {}),
                'images': resource.get('images', {}),
                'image_generation_status': {}
            }
            return jsonify({
                "success": True,
                "worksheet": resource.get('content', {}),
                "images": resource.get('images', {})
            })
        
        return jsonify({"error": "Worksheet not found"}), 404
        
    except Exception as e:
        print(f"Error in get_worksheet: {e}")
        return jsonify({"error": str(e)}), 500
```

### 4. Create Frontend Viewer

**File**: `frontend/src/components/WorksheetViewer.js`

```javascript
import React from 'react';
import { FileText, Image as ImageIcon } from 'lucide-react';

function WorksheetViewer({ worksheet, images, isProcessing = false }) {
  if (!worksheet) return null;

  const sections = worksheet.sections || [];

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-8 h-8 text-emerald-500" />
          <h1 className="text-3xl font-bold text-gray-900">{worksheet.title}</h1>
        </div>
        {worksheet.subtitle && (
          <p className="text-lg text-gray-600 mb-3">{worksheet.subtitle}</p>
        )}
        {worksheet.instructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-blue-900 font-medium">Instructions:</p>
            <p className="text-blue-800">{worksheet.instructions}</p>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section, sectionIdx) => {
          const imageKey = `section_${sectionIdx}`;
          const image = images[imageKey];

          return (
            <div key={sectionIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
              
              {image && (
                <img 
                  key={image}
                  src={image} 
                  alt={section.title} 
                  className="w-full rounded-lg mb-4" 
                />
              )}

              {/* Render questions based on type */}
              {section.type === 'multiple_choice' && (
                <div className="space-y-4">
                  {section.questions.map((q, qIdx) => (
                    <div key={qIdx} className="border-l-4 border-emerald-500 pl-4">
                      <p className="font-semibold text-gray-900 mb-2">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="space-y-1 ml-4">
                        {q.options.map((opt, optIdx) => (
                          <p key={optIdx} className="text-gray-700">{opt}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {section.type === 'fill_in_blank' && (
                <div className="space-y-3">
                  {section.questions.map((q, qIdx) => (
                    <div key={qIdx} className="border-l-4 border-blue-500 pl-4">
                      <p className="text-gray-900">
                        {qIdx + 1}. {q.question}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {section.type === 'short_answer' && (
                <div className="space-y-4">
                  {section.questions.map((q, qIdx) => (
                    <div key={qIdx} className="border-l-4 border-purple-500 pl-4">
                      <p className="font-semibold text-gray-900 mb-2">
                        {qIdx + 1}. {q.question}
                        {q.points && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({q.points} points)
                          </span>
                        )}
                      </p>
                      <div className="border-t-2 border-gray-300 mt-2 pt-2">
                        <p className="text-gray-400 text-sm">Answer:</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WorksheetViewer;
```

### 5. Add API Helpers

**File**: `frontend/src/api.js`

```javascript
export const generateWorksheetStream = async (topic, onUpdate) => {
  const response = await fetch(`${API_BASE_URL}/generate-worksheet-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate worksheet');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const messages = buffer.split('\n\n');
      buffer = messages.pop() || '';
      
      for (const message of messages) {
        const lines = message.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              onUpdate(data);
            } catch (e) {
              console.error('Failed to parse SSE message:', e);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

export const getWorksheet = async (worksheetId) => {
  const response = await api.get(`/worksheet/${worksheetId}`);
  return response.data;
};
```

### 6. Update App Routing

**File**: `frontend/src/App.js`

```javascript
// Import the viewer
import WorksheetViewer from './components/WorksheetViewer';

// In the content rendering section
const contentType = currentLesson?.contentType;

{/* Content viewer */}
<div className="lg:col-span-2">
  {contentType === 'presentation' ? (
    <PresentationViewer presentation={currentLesson} images={lessonImages} />
  ) : contentType === 'worksheet' ? (
    <WorksheetViewer worksheet={currentLesson} images={lessonImages} />
  ) : (
    <LessonViewer lesson={currentLesson} images={lessonImages} />
  )}
</div>
```

**File**: `frontend/src/components/LessonGenerator.js`

```javascript
// Import the API
import { generateWorksheetStream } from '../api';

// In handleGenerate function
if (selectedType === 'Worksheet') {
  await generateWorksheetStream(topic, (data) => {
    if (data.type === 'worksheet') {
      currentContent = { ...data.worksheet, contentType: 'worksheet' };
      onLessonGenerated(currentContent, {});
    }
    // ... handle images and complete
  });
}
```

### 7. Test End-to-End

```bash
# Start backend
cd backend
python app.py

# Start frontend (in another terminal)
cd frontend
npm start

# Test in browser
1. Select "Worksheet" from dropdown
2. Enter topic: "Photosynthesis"
3. Click "Create"
4. Verify worksheet appears with questions
5. Verify images load
```

---

## Checklist for New Content Types

- [ ] Create agent class in `backend/agents/`
- [ ] Add to `__init__.py` exports
- [ ] Initialize agent in `app.py`
- [ ] Add storage dict in `app.py`
- [ ] Create streaming endpoint
- [ ] Create get endpoint
- [ ] Create viewer component
- [ ] Add API helpers
- [ ] Update App.js routing
- [ ] Update LessonGenerator routing
- [ ] Test generation
- [ ] Test viewing
- [ ] Test with images
- [ ] Test error handling

---

## Tips

1. **Follow Naming Conventions**
   - Agent: `{Type}GeneratorAgent`
   - Viewer: `{Type}Viewer`
   - API: `generate{Type}Stream`, `get{Type}`

2. **Reuse Components**
   - Use `ImageGeneratorAgent` for all images
   - Use same streaming pattern
   - Follow same JSON structure conventions

3. **Error Handling**
   - Always include fallback generation
   - Handle missing data gracefully
   - Log errors for debugging

4. **Testing**
   - Test with various topics
   - Test image generation
   - Test error cases
   - Test on mobile and desktop

5. **Documentation**
   - Document JSON structure
   - Add comments for complex logic
   - Update this guide with learnings
