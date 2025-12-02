# Presentation Generator Implementation

## Overview
A complete, modular presentation generator system that creates professional PowerPoint presentations with AI-generated content and images. Built following the same architecture as the lesson generator for consistency and maintainability.

## Architecture

### Backend Components

#### 1. **PresentationGeneratorAgent** (`backend/agents/presentation_generator.py`)
- **Purpose**: Generates presentation structure and creates PPTX files
- **Key Features**:
  - Uses Gemini 2.0 Flash for content generation
  - Randomly selects from available PPTX templates
  - Generates 8-12 slides with images
  - Creates professional slide layouts (title, section, content, chart, closing)
  - Integrates with ImageGeneratorAgent for visuals

- **Main Methods**:
  - `generate_presentation(topic)` - Creates presentation structure as JSON
  - `create_pptx(presentation_data, images)` - Builds actual PPTX file
  - Slide builders: `_create_title_slide_with_image()`, `_create_content_slide_with_image()`, etc.

#### 2. **API Endpoints** (`backend/app.py`)

**Generate Presentation (Streaming)**
```
POST /api/generate-presentation-stream
Body: { "topic": "Your topic here" }
Returns: Server-Sent Events stream with presentation data and images
```

**Get Presentation**
```
GET /api/presentation/<presentation_id>
Returns: { "success": true, "presentation": {...}, "images": {...} }
```

**Download PPTX**
```
GET /api/presentation/<presentation_id>/download
Returns: PPTX file download
```

### Frontend Components

#### 1. **PresentationViewer** (`frontend/src/components/PresentationViewer.js`)
- **Purpose**: Displays presentation slides in a beautiful, scrollable format
- **Features**:
  - Different layouts for each slide type (title, section, content, chart, closing)
  - Image loading with placeholders and error handling
  - Slide numbering badges
  - Responsive design
  - Processing overlay during edits

#### 2. **Updated LessonGenerator** (`frontend/src/components/LessonGenerator.js`)
- **Purpose**: Routes to appropriate generator based on content type
- **Changes**:
  - Added `generatePresentationStream` import
  - Content type routing logic in `handleGenerate()`
  - Sets `contentType` field to distinguish presentations from lessons
  - Dynamic status messages based on selected type

#### 3. **Updated App.js** (`frontend/src/App.js`)
- **Purpose**: Main app component with routing logic
- **Changes**:
  - Imported `PresentationViewer` and `downloadPresentation`
  - Added `handleDownloadPresentation()` function
  - Conditional rendering based on `contentType`
  - Download PPTX button for presentations

#### 4. **API Helpers** (`frontend/src/api.js`)
- **New Functions**:
  - `generatePresentationStream(topic, onUpdate)` - Streaming generation
  - `getPresentation(presentationId)` - Fetch presentation data
  - `downloadPresentation(presentationId)` - Download PPTX file

## Data Flow

### 1. **Generation Flow**
```
User selects "Presentation Deck" → Enters topic → Clicks "Create"
    ↓
LessonGenerator routes to generatePresentationStream()
    ↓
Backend: PresentationGeneratorAgent.generate_presentation()
    ↓
Streams back: presentation structure (JSON)
    ↓
Backend: Generates images for each slide
    ↓
Streams back: images one by one
    ↓
Frontend: PresentationViewer displays slides as images arrive
```

### 2. **Download Flow**
```
User clicks "Download PPTX" button
    ↓
Frontend: downloadPresentation(presentationId)
    ↓
Backend: Retrieves presentation data and images
    ↓
Backend: PresentationGeneratorAgent.create_pptx()
    ↓
Backend: Returns PPTX file as blob
    ↓
Frontend: Triggers browser download
```

### 3. **Edit Flow** (Future Enhancement)
```
User types edit request in ChatEditor
    ↓
Backend: AgenticEditor processes request
    ↓
Updates presentation structure
    ↓
Regenerates affected slide images
    ↓
Frontend: PresentationViewer updates display
```

## Presentation Structure

### JSON Format
```json
{
  "title": "Presentation Title",
  "subtitle": "Subtitle",
  "topic": "Original topic",
  "version": 1,
  "id": "uuid",
  "contentType": "presentation",
  "slides": [
    {
      "type": "title",
      "title": "Main Title",
      "content": "Subtitle text",
      "image_prompt": "Description for image"
    },
    {
      "type": "section",
      "title": "Section Heading",
      "image_prompt": "Section image description"
    },
    {
      "type": "content",
      "title": "Slide Title",
      "content": ["Bullet 1", "Bullet 2", "Bullet 3"],
      "image_prompt": "Content image description"
    },
    {
      "type": "chart",
      "title": "Chart Title",
      "chart_data": {
        "type": "bar",
        "title": "Chart Title",
        "categories": ["A", "B", "C"],
        "values": [10, 20, 30]
      },
      "image_prompt": "Chart supporting image"
    },
    {
      "type": "closing",
      "title": "Thank You!",
      "content": "Contact info",
      "image_prompt": "Closing image"
    }
  ]
}
```

## Slide Types

### 1. **Title Slide**
- Large title and subtitle
- Image at bottom center
- Gradient background (emerald to teal)

### 2. **Section Slide**
- Large section heading
- Centered image below title
- Gradient background (blue to indigo)

### 3. **Content Slide**
- Title at top
- Bullet points on left (2-column grid)
- Image on right
- White background with border

### 4. **Chart Slide**
- Title at top
- Chart visualization on left
- Supporting image on right
- Horizontal bar chart display

### 5. **Closing Slide**
- Large "Thank You" title
- Contact info or closing message
- Image at bottom
- Gradient background (purple to pink)

## Template System

### Template Selection
- Templates stored in `backend/agents/slideTemplates/`
- Random template selected for each presentation
- Currently supports: `Template1.pptx`
- Easy to add more templates - just drop PPTX files in the folder

### Template Requirements
- Must have standard PowerPoint layouts:
  - Layout 0: Title slide
  - Layout 1: Content slide
  - Layout 2: Section header
- Placeholders will be automatically populated

## Modular Design Benefits

### 1. **Easy to Extend**
The architecture makes it simple to add new content types:

```python
# Backend: Add new generator agent
class WorksheetGeneratorAgent:
    def generate_worksheet(self, topic):
        # Generate worksheet structure
        pass

# Add API endpoint
@app.route('/api/generate-worksheet-stream', methods=['POST'])
def generate_worksheet_stream():
    # Stream worksheet generation
    pass
```

```javascript
// Frontend: Add new viewer component
function WorksheetViewer({ worksheet, images }) {
    // Render worksheet
}

// Update routing in LessonGenerator
if (selectedType === 'Worksheet') {
    await generateWorksheetStream(topic, onUpdate);
}
```

### 2. **Shared Infrastructure**
- All generators use the same `ImageGeneratorAgent`
- Common streaming pattern for all content types
- Unified storage in Firebase
- Consistent UI/UX patterns

### 3. **Independent Components**
- Each generator is self-contained
- Can be tested independently
- Easy to maintain and debug
- Clear separation of concerns

## Testing

### Manual Testing Steps

1. **Basic Generation**
   ```
   - Select "Presentation Deck"
   - Enter topic: "Introduction to Solar System"
   - Click "Create"
   - Verify: Slides appear with images
   ```

2. **Download PPTX**
   ```
   - After generation completes
   - Click "Download PPTX" button
   - Verify: PPTX file downloads
   - Open in PowerPoint/Google Slides
   - Verify: All slides and images present
   ```

3. **Different Topics**
   ```
   - Try various topics (science, history, math)
   - Verify: Content is relevant and well-structured
   - Verify: Images match slide content
   ```

4. **Template Variation**
   ```
   - Generate multiple presentations
   - Verify: Templates are being used
   - Verify: Layouts are consistent
   ```

## Future Enhancements

### 1. **Chat-Based Editing**
- Integrate with AgenticEditor
- Support commands like:
  - "Change slide 3 image to realistic style"
  - "Add a new slide about Mars"
  - "Remove the chart slide"

### 2. **More Content Types**
- **Worksheet Generator**: PDF worksheets with exercises
- **Curriculum Generator**: Multi-lesson curriculum plans
- **Flashcard Generator**: Study flashcards
- **Quiz Generator**: Interactive quizzes

### 3. **Advanced Features**
- Custom color themes
- Speaker notes generation
- Animation suggestions
- Slide transitions
- Export to PDF
- Share via link

### 4. **Template Management**
- Template library UI
- Upload custom templates
- Template preview
- Category-based selection (education, business, creative)

## Dependencies

### Backend
```
python-pptx>=0.6.21  # PowerPoint generation
google-generativeai  # AI content generation
```

### Frontend
```
lucide-react  # Icons
```

## File Structure

```
backend/
├── agents/
│   ├── presentation_generator.py  # NEW
│   ├── lesson_generator.py
│   ├── image_generator.py
│   ├── slideTemplates/           # NEW
│   │   └── Template1.pptx
│   └── __init__.py               # UPDATED
├── app.py                         # UPDATED (added endpoints)
└── requirements.txt               # UPDATED

frontend/
├── src/
│   ├── components/
│   │   ├── PresentationViewer.js  # NEW
│   │   ├── LessonGenerator.js     # UPDATED
│   │   └── LessonViewer.js
│   ├── App.js                     # UPDATED
│   └── api.js                     # UPDATED
```

## Summary

The presentation generator is now fully integrated into the system with:

✅ **Modular architecture** - Easy to extend with new content types
✅ **Professional output** - Uses templates and proper layouts
✅ **AI-powered** - Intelligent content and image generation
✅ **Streaming updates** - Real-time feedback during generation
✅ **Download functionality** - Export to PPTX format
✅ **Consistent UX** - Follows same patterns as lesson generator
✅ **Production-ready** - Error handling, loading states, responsive design

The system is ready for testing and can easily be extended with additional content generators (worksheets, curricula, flashcards, quizzes) following the same modular pattern.
