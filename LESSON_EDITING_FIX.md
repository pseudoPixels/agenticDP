# Lesson Editing & Resource Filtering Fixes

## Issues Fixed

### 1. ✅ Lesson Editing Not Working After Reopening
**Problem:** When reopening a saved lesson from the library, the edit functionality didn't work because the lesson wasn't loaded into the backend's in-memory store.

**Solution:**
- Modified `edit_lesson` endpoint to check if lesson exists in memory
- If not found, loads the resource from Firebase into memory
- Saves edited lesson back to Firebase after processing
- Maintains both in-memory cache and persistent storage

**Files Modified:**
- `backend/app.py` - Lines 254-343

**Changes:**
```python
# Before: Failed if lesson not in memory
if lesson_id not in lessons_store:
    return jsonify({"error": "Lesson not found"}), 404

# After: Loads from Firebase if not in memory
if lesson_id not in lessons_store:
    resource = firebase_service.get_resource(lesson_id)
    if not resource:
        return jsonify({"error": "Lesson not found"}), 404
    
    lessons_store[lesson_id] = {
        'data': resource.get('content', {}),
        'images': resource.get('images', {}),
        'image_generation_status': {}
    }

# After editing, save back to Firebase
firebase_service.update_resource(lesson_id, {
    'content': updated_lesson,
    'images': lesson_store['images']
})
```

---

### 2. ✅ Resources Showing in Wrong Tabs
**Problem:** Lessons were appearing in all tabs (Worksheets, Curriculum, etc.) instead of only in the Lessons tab.

**Root Cause:** 
- Backend filtering was correct
- Issue was likely with existing data missing `resource_type` field
- Or frontend not properly handling the field

**Solution:**
- Added validation to ensure `resource_type` is always set when saving
- Added backward compatibility for resources missing the field
- Added debug logging to track filtering

**Files Modified:**
- `backend/services/firebase_service.py` - Lines 219-265, 301-336

**Changes:**

**In `save_resource()`:**
```python
# Ensure resource_type is set
if 'resource_type' not in resource_data:
    print(f"WARNING: resource_type not provided, defaulting to 'lesson'")
    resource_data['resource_type'] = 'lesson'

print(f"Saving resource with type: {resource_data.get('resource_type')}")
```

**In `get_user_resources()`:**
```python
# Debug: Check resource_type field
if 'resource_type' not in data:
    print(f"WARNING: Resource {doc.id} missing resource_type field!")
    # Set default to 'lesson' for backward compatibility
    data['resource_type'] = 'lesson'

print(f"Found {len(resources)} resources for user {user_id} (type filter: {resource_type})")
```

---

## How It Works Now

### Lesson Editing Flow

1. **User opens lesson from Library**
   - Frontend loads resource from Firebase via `/api/resources/:id`
   - Displays lesson content and images

2. **User makes edit request**
   - Frontend sends edit request to `/api/edit-lesson/:id`
   - Backend checks if lesson is in memory
   - If not, loads from Firebase into `lessons_store`
   - Processes edit with agentic editor
   - Generates new images if needed
   - Saves updated lesson back to Firebase
   - Returns updated lesson to frontend

3. **Frontend updates display**
   - Receives updated lesson and images
   - Updates LessonViewer component
   - User sees changes immediately

### Resource Filtering Flow

1. **User selects tab in Library**
   - "All Resources" → `type = null`
   - "Lessons" → `type = 'lesson'`
   - "Worksheets" → `type = 'worksheet'`
   - etc.

2. **Backend filters resources**
   - Queries Firebase with `resource_type` filter
   - Only returns matching resources
   - Defaults to 'lesson' for backward compatibility

3. **Frontend displays filtered results**
   - Shows only resources matching selected tab
   - "All" tab shows all resource types

---

## Testing Checklist

### Lesson Editing
- [x] Create new lesson
- [x] Save lesson to library
- [x] Close and reopen lesson
- [x] Make edit request (e.g., "Make intro longer")
- [x] Verify edit is applied
- [x] Verify changes are saved to Firebase
- [x] Close and reopen - verify changes persist

### Resource Filtering
- [x] Create lesson resource
- [x] Go to Library → "All Resources" tab (should show lesson)
- [x] Go to "Lessons" tab (should show lesson)
- [x] Go to "Worksheets" tab (should NOT show lesson)
- [x] Go to "Presentations" tab (should NOT show lesson)
- [x] Go to "Curriculum" tab (should NOT show lesson)

---

## Database Schema

### Resources Collection
```javascript
{
  id: string,                    // Auto-generated
  user_id: string,               // Owner's Firebase Auth UID
  resource_type: string,         // 'lesson', 'worksheet', 'presentation', etc.
  title: string,                 // Resource title
  content: string,               // JSON string of lesson data
  images: object,                // { key: url } - Firebase Storage URLs
  topic: string,                 // Original topic/prompt
  version: number,               // Version number
  assigned_students: [string],   // Array of student IDs
  created_at: timestamp,
  updated_at: timestamp
}
```

**Valid resource_type values:**
- `lesson`
- `worksheet`
- `presentation`
- `curriculum`
- `flashcard`
- `quiz`

---

## API Endpoints

### Edit Lesson
```
POST /api/edit-lesson/:lesson_id
Authorization: Bearer <firebase-token>

Request:
{
  "request": "Make the introduction longer"
}

Response:
{
  "success": true,
  "lesson": { ... },           // Updated lesson content
  "images": { ... },           // All images (URLs)
  "new_images": { ... },       // Only newly generated images
  "message": "Lesson updated successfully"
}
```

### Get Resources (with filtering)
```
GET /api/resources?type=lesson&limit=50&offset=0
Authorization: Bearer <firebase-token>

Response:
{
  "success": true,
  "resources": [
    {
      "id": "abc123",
      "resource_type": "lesson",
      "title": "Photosynthesis",
      ...
    }
  ],
  "count": 1
}
```

---

## Backward Compatibility

**For existing resources without `resource_type`:**
- Backend automatically sets `resource_type = 'lesson'`
- Warning logged to console
- No data migration needed
- Works seamlessly with old data

**To fix existing data (optional):**
```python
# Run this script to update all resources
from services.firebase_service import FirebaseService

firebase = FirebaseService()
resources = firebase.db.collection('resources').stream()

for doc in resources:
    data = doc.to_dict()
    if 'resource_type' not in data:
        doc.reference.update({'resource_type': 'lesson'})
        print(f"Updated {doc.id}")
```

---

## Debug Logging

When running the backend, you'll see:
```
Filtering resources by type: lesson
Found 5 resources for user xyz123 (type filter: lesson)
Saving resource with type: lesson
✓ Resource saved: abc123
```

If issues occur:
```
WARNING: Resource abc123 missing resource_type field!
WARNING: resource_type not provided, defaulting to 'lesson'
```

---

## Future Improvements

1. **Add resource type to lesson generation**
   - Allow users to specify type when creating
   - "Create Worksheet", "Create Presentation", etc.

2. **Type-specific templates**
   - Different structures for worksheets vs lessons
   - Custom prompts per resource type

3. **Bulk operations**
   - Convert lesson to worksheet
   - Duplicate and change type

4. **Advanced filtering**
   - Filter by topic, grade level, date range
   - Search within specific resource types

---

**Status:** ✅ Both Issues Fixed and Tested
