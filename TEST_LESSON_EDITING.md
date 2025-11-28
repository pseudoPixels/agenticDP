# Test: Lesson Editing After Reopening

## The Issue
When you reopen a saved lesson from the library, the edit functionality doesn't work because the lesson isn't loaded into the backend's in-memory store.

## The Fix Applied
Modified `/api/edit-lesson/:id` endpoint to:
1. Check if lesson exists in memory
2. If not, load it from Firebase
3. Process the edit
4. Save back to Firebase

## How to Test

### Step 1: Restart Backend Server
**IMPORTANT:** You must restart the backend for changes to take effect!

```bash
# Stop the current backend (Ctrl+C)
# Then restart:
cd backend
python app.py
```

### Step 2: Create and Save a Lesson
1. Go to http://localhost:3000
2. Create a new lesson (e.g., "Photosynthesis")
3. Wait for it to generate
4. Click "Save Lesson"
5. Go to Library

### Step 3: Reopen the Lesson
1. In Library, click on the saved lesson
2. You should see the lesson content displayed
3. The ChatEditor should be visible on the right (desktop) or bottom (mobile)

### Step 4: Test Editing
1. In the chat input, type: **"Make the introduction longer"**
2. Press Enter or click Send
3. Wait for processing (you'll see a loading spinner)
4. The lesson should update with a longer introduction
5. **Verify the changes persist:**
   - Go back to Library
   - Reopen the same lesson
   - The changes should still be there!

### Step 5: Test Multiple Edits
1. Try another edit: **"Add a fun fact section"**
2. Try image edit: **"Change intro image to cartoon style"**
3. Each edit should work and save automatically

## Expected Behavior

### ✅ What Should Happen
- Lesson loads correctly from Firebase
- Chat editor is functional
- Edit requests are processed
- Changes appear immediately
- Changes are saved to Firebase
- Reopening shows the updated lesson

### ❌ What Was Broken Before
- Edit requests failed with "Lesson not found"
- Backend couldn't find lesson in `lessons_store`
- Had to create lesson again to edit it

## Debugging

If editing still doesn't work, check the backend logs:

### Good Logs (Working):
```
Lesson abc123 not in memory, loading from Firebase...
✓ Loaded lesson from Firebase
Processing edit request with agentic editor: Make the introduction longer
Edit processed. Image sections to regenerate: 0
Lesson abc123 saved to Firebase successfully
```

### Bad Logs (Not Working):
```
Error in edit_lesson: Lesson not found
```

If you see "Lesson not found", it means:
1. Backend server wasn't restarted
2. Or the lesson ID is incorrect
3. Or Firebase isn't configured properly

## Code Changes

### File: `backend/app.py` (Lines 254-343)

**Before:**
```python
@app.route('/api/edit-lesson/<lesson_id>', methods=['POST'])
def edit_lesson(lesson_id):
    if lesson_id not in lessons_store:
        return jsonify({"error": "Lesson not found"}), 404  # ❌ Fails for reopened lessons
```

**After:**
```python
@app.route('/api/edit-lesson/<lesson_id>', methods=['POST'])
def edit_lesson(lesson_id):
    # Check if lesson is in memory, if not, load from Firebase
    if lesson_id not in lessons_store:
        resource = firebase_service.get_resource(lesson_id)  # ✅ Load from Firebase
        if not resource:
            return jsonify({"error": "Lesson not found"}), 404
        
        lessons_store[lesson_id] = {
            'data': resource.get('content', {}),
            'images': resource.get('images', {}),
            'image_generation_status': {}
        }
    
    # ... process edit ...
    
    # Save back to Firebase
    firebase_service.update_resource(lesson_id, {
        'content': updated_lesson,
        'images': lesson_store['images']
    })  # ✅ Persist changes
```

## Alternative Test (Using API Directly)

If the UI doesn't work, test the API directly:

```bash
# 1. Get a lesson ID from your library
LESSON_ID="your-lesson-id-here"

# 2. Test edit endpoint
curl -X POST http://localhost:5000/api/edit-lesson/$LESSON_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"request": "Make the introduction longer"}'

# Expected response:
# {
#   "success": true,
#   "lesson": { ... },
#   "images": { ... },
#   "message": "Lesson updated successfully"
# }
```

## Troubleshooting

### Issue: "Lesson not found" error
**Solution:** 
- Restart backend server
- Verify lesson exists in Firebase Console
- Check Firebase credentials are correct

### Issue: Edit works but changes don't persist
**Solution:**
- Check Firebase write permissions
- Verify `update_resource()` is being called
- Check backend logs for "saved to Firebase successfully"

### Issue: Images not regenerating
**Solution:**
- Check Gemini API key is configured
- Verify image generation service is working
- May take 10-20 seconds per image

---

## Quick Checklist

- [ ] Backend server restarted
- [ ] Created a new lesson
- [ ] Saved lesson to library
- [ ] Reopened lesson from library
- [ ] Chat editor is visible
- [ ] Sent edit request
- [ ] Changes appeared
- [ ] Went back to library
- [ ] Reopened lesson
- [ ] Changes persisted

If all checkboxes are ✅, the fix is working!

---

**Status:** ✅ Fix Applied - Restart Backend to Test
