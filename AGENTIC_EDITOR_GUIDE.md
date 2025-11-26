# 🤖 Agentic Lesson Editor - Complete Guide

## Overview

The Agentic Lesson Editor is an advanced AI-powered system that can intelligently understand and execute complex editing requests on lesson content. It uses a multi-agent approach with intent classification, planning, and execution phases.

## Architecture

### Multi-Agent System

```
User Request
    ↓
Intent Classifier Agent
    ↓
Planning Agent
    ↓
Execution Agent
    ↓
Image Regeneration Agent
    ↓
Updated Lesson
```

### Key Components

1. **Intent Classifier**: Analyzes the user's request and classifies it into categories
2. **Planning Agent**: Creates a detailed execution plan
3. **Execution Agent**: Implements the changes
4. **Image Regeneration Agent**: Handles image modifications

## Capabilities

### 📝 Text Modifications

The editor can handle various text-related changes:

#### Examples:
- **"Make the introduction longer"** - Expands the introduction section
- **"Make the first paragraph shorter"** - Condenses specific content
- **"Rewrite everything in Batman theme"** - Changes the entire tone and style
- **"Add more examples to key concepts"** - Enriches content with examples
- **"Simplify the language for 5th graders"** - Adjusts reading level
- **"Make the summary more concise"** - Reduces summary length

### 🖼️ Image Modifications

Advanced image control with style changes:

#### Style Changes:
- **"Make the intro image black and white"** - Converts to monochrome
- **"Change all images to cartoon style"** - Applies cartoon aesthetic
- **"Make the second image realistic"** - Changes to photorealistic style
- **"Convert images to minimalist diagrams"** - Simplifies to diagrams

#### Image Management:
- **"Add an image to the summary section"** - Inserts new images
- **"Remove all images"** - Clears all images
- **"Remove the activities image"** - Removes specific images
- **"Add a diagram to the key concepts"** - Adds specific image types

### ➕ Structure Modifications

Add, remove, or reorganize content:

#### Adding Sections:
- **"Add a new section called 'Real World Examples'"** - Creates new section
- **"Add a 'Household Example' section with an image"** - Section with image
- **"Insert a 'Common Mistakes' section after key concepts"** - Positioned addition

#### Removing Content:
- **"Remove the activities section"** - Deletes entire sections
- **"Delete the second key concept"** - Removes specific items

#### Reorganizing:
- **"Move the summary to the beginning"** - Reorders sections
- **"Combine the first two key concepts"** - Merges content

### 🎨 Style & Theme Changes

Transform the entire lesson's presentation:

#### Theme Examples:
- **"Rewrite in Batman theme"** - Dark Knight style
- **"Make it sound like Shakespeare"** - Elizabethan English
- **"Write in a casual, friendly tone"** - Conversational style
- **"Make it more formal and academic"** - Scholarly tone
- **"Add humor throughout"** - Inject comedy

### 🔄 Mixed Operations

Combine multiple operations in one request:

#### Complex Examples:
- **"Make the intro longer and add a cartoon image"**
- **"Add a 'Daily Life Examples' section with realistic images and rewrite key concepts in simpler language"**
- **"Remove all images, add a new 'Visual Diagrams' section, and make the text more engaging"**

## How It Works

### Step 1: Intent Classification

The system analyzes your request and classifies it:

```python
Intents:
- TEXT_MODIFICATION: Changing existing text
- IMAGE_MODIFICATION: Changing images
- STRUCTURE_MODIFICATION: Adding/removing sections
- STYLE_CHANGE: Changing theme/tone
- CONTENT_ADDITION: Adding new content
- CONTENT_REMOVAL: Removing content
- MIXED: Multiple types of changes
```

### Step 2: Execution Planning

Creates a detailed plan:

```json
{
  "steps": [
    {
      "action": "modify_text",
      "target": "introduction",
      "details": "Expand with more context"
    },
    {
      "action": "modify_image",
      "target": "introduction",
      "details": "Change to black and white"
    }
  ],
  "requires_image_regeneration": true,
  "image_targets": ["introduction"],
  "new_image_style": "black_and_white"
}
```

### Step 3: Execution

Implements all changes:
- Updates text content
- Modifies structure
- Regenerates images with new styles
- Maintains lesson integrity

## Image Styles Supported

- **educational**: Standard educational illustrations (default)
- **cartoon**: Cartoon/animated style
- **realistic**: Photorealistic images
- **minimalist**: Simple, clean designs
- **diagram**: Technical diagrams
- **black_and_white**: Monochrome images
- **watercolor**: Artistic watercolor style
- **sketch**: Hand-drawn sketches

## Usage Examples

### Example 1: Simple Text Edit
```
User: "Make the introduction longer"
Result: Introduction expanded with more context
```

### Example 2: Image Style Change
```
User: "Make all images cartoon style"
Result: All images regenerated in cartoon aesthetic
```

### Example 3: Add New Section
```
User: "Add a 'Household Example' section with an image"
Result: New section created with:
- Heading: "Household Example"
- Descriptive text
- Relevant image
```

### Example 4: Theme Change
```
User: "Rewrite everything in Batman theme"
Result: Entire lesson rewritten with:
- Dark, dramatic tone
- Batman-related metaphors
- Gotham City references
```

### Example 5: Complex Multi-Operation
```
User: "Add a 'Real World Applications' section, make the intro image black and white, and simplify the language"
Result:
- New "Real World Applications" section added
- Introduction image converted to B&W
- All text simplified for easier reading
```

## Best Practices

### 1. Be Specific
❌ "Change the image"
✅ "Make the introduction image cartoon style"

### 2. Use Clear Section Names
❌ "Change the first part"
✅ "Make the introduction longer"

### 3. Specify Image Positions
❌ "Add an image"
✅ "Add an image to the summary section"

### 4. Combine Related Changes
✅ "Add a 'Examples' section with realistic images and make it engaging"

### 5. Use Natural Language
The system understands conversational requests:
- "Can you make the intro a bit longer?"
- "I'd like to add some real-world examples"
- "Please change all images to cartoon style"

## Technical Details

### Backend Implementation

**File**: `backend/agents/agentic_editor.py`

Key classes:
- `AgenticLessonEditor`: Main editor class
- `EditIntent`: Intent classification enum

### API Endpoint

**POST** `/api/edit-lesson/<lesson_id>`

Request:
```json
{
  "request": "Make the intro image black and white"
}
```

Response:
```json
{
  "success": true,
  "lesson": { /* updated lesson data */ },
  "images": { /* all images including new ones */ },
  "new_images": { /* only newly generated images */ },
  "message": "Lesson updated successfully"
}
```

### Frontend Integration

**File**: `frontend/src/components/ChatEditor.js`

Features:
- Real-time chat interface
- Quick action buttons
- Processing indicators
- Automatic lesson updates

## Limitations

1. **Image Display**: Currently only 2 images are displayed (intro + first key concept)
2. **Processing Time**: Complex edits may take 10-30 seconds
3. **Context Preservation**: Very large lessons may lose some context
4. **Image Quality**: Depends on Imagen API capabilities

## Future Enhancements

- [ ] Real-time streaming of edits
- [ ] Undo/redo functionality
- [ ] Edit history tracking
- [ ] Multi-language support
- [ ] Voice input for edits
- [ ] Collaborative editing
- [ ] Version comparison view

## Troubleshooting

### Issue: Edit not applied
**Solution**: Be more specific about which section to edit

### Issue: Images not regenerating
**Solution**: Explicitly mention "image" in your request

### Issue: Unexpected changes
**Solution**: Review the execution plan in console logs

### Issue: Slow processing
**Solution**: Break complex requests into smaller edits

## Examples Gallery

### Text Transformations
```
Original: "Photosynthesis is a process..."
Request: "Rewrite in Batman theme"
Result: "In the shadows of the chloroplast, a dark transformation occurs..."
```

### Image Transformations
```
Request: "Make intro image look like a comic book"
Result: Image regenerated with comic book style, bold outlines, vibrant colors
```

### Structure Changes
```
Request: "Add a 'Fun Facts' section after key concepts"
Result: New section inserted with interesting trivia about the topic
```

## Support

For issues or questions:
1. Check console logs for detailed execution information
2. Try rephrasing your request
3. Break complex requests into steps
4. Refer to examples in this guide

---

**Built with**: Gemini AI, Flask, React, and advanced agentic workflows
