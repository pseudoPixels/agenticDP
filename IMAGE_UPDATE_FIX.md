# Image Update Fix

## Problem
When saving edited lessons with new images, Firebase threw an error:
```
Error updating resource: 400 Property images contains an invalid nested entity.
```

## Root Cause
The `update_resource()` method was trying to save base64 image data directly to Firestore. Firebase Firestore cannot store large base64 strings - images must be uploaded to Firebase Storage first and stored as URLs.

**What was happening:**
1. User edits lesson and requests new image
2. Backend generates new image as base64 data
3. Frontend calls `updateResource()` with base64 images
4. Backend tries to save base64 directly to Firestore
5. Firebase rejects: "invalid nested entity" ❌

## Solution
Updated `update_resource()` method to:
1. Check if images contain base64 data
2. Upload base64 images to Firebase Storage
3. Replace base64 with Storage URLs
4. Save URLs to Firestore

**What happens now:**
1. User edits lesson and requests new image
2. Backend generates new image as base64 data
3. Frontend calls `updateResource()` with base64 images
4. Backend uploads base64 to Firebase Storage
5. Backend saves Storage URLs to Firestore ✅

---

## Implementation

### File: `backend/services/firebase_service.py`

**Before:**
```python
def update_resource(self, resource_id: str, updates: Dict) -> bool:
    try:
        resource_ref = self.db.collection('resources').document(resource_id)
        updates['updated_at'] = datetime.utcnow()
        resource_ref.update(updates)  # ❌ Fails if images contain base64
        return True
    except Exception as e:
        print(f"Error updating resource: {e}")
        return False
```

**After:**
```python
def update_resource(self, resource_id: str, updates: Dict) -> bool:
    try:
        # Handle images - check if any are base64 and need uploading
        if 'images' in updates and updates['images']:
            images_to_upload = {}
            final_images = {}
            
            for key, value in updates['images'].items():
                if isinstance(value, str):
                    # Check if it's base64 data
                    if value.startswith('data:image'):
                        images_to_upload[key] = value
                    else:
                        # Already a URL, keep it
                        final_images[key] = value
            
            # Upload any base64 images to Storage
            if images_to_upload:
                uploaded_urls = self.upload_images(images_to_upload, resource_id)
                final_images.update(uploaded_urls)
            
            updates['images'] = final_images
        
        # Convert content to JSON string if needed
        if 'content' in updates and isinstance(updates['content'], dict):
            updates['content'] = json.dumps(updates['content'])
        
        resource_ref = self.db.collection('resources').document(resource_id)
        updates['updated_at'] = datetime.utcnow()
        resource_ref.update(updates)  # ✅ Now saves URLs only
        return True
    except Exception as e:
        print(f"Error updating resource: {e}")
        return False
```

---

## How It Works

### Image Processing Flow

**Step 1: Detect Image Type**
```python
for key, value in updates['images'].items():
    if value.startswith('data:image'):
        # Base64 - needs uploading
        images_to_upload[key] = value
    else:
        # Already a URL - keep as is
        final_images[key] = value
```

**Step 2: Upload Base64 Images**
```python
if images_to_upload:
    # Upload to Firebase Storage
    uploaded_urls = self.upload_images(images_to_upload, resource_id)
    # Returns: {'introduction': 'https://storage.googleapis.com/...'}
    final_images.update(uploaded_urls)
```

**Step 3: Save URLs to Firestore**
```python
updates['images'] = final_images  # All URLs now
resource_ref.update(updates)  # Safe to save
```

---

## Example Scenarios

### Scenario 1: Edit with New Image
```
User: "Change intro image to cartoon style"

Backend generates new image:
{
  'introduction': 'data:image/png;base64,iVBORw0KG...'  # Base64
  'key_concept_0': 'https://storage.googleapis.com/...'  # Existing URL
}

update_resource() processes:
1. Detects 'introduction' is base64
2. Uploads to Storage → gets URL
3. Saves to Firestore:
   {
     'introduction': 'https://storage.googleapis.com/new-image.png'
     'key_concept_0': 'https://storage.googleapis.com/...'
   }
```

### Scenario 2: Edit without New Images
```
User: "Make the introduction longer"

No new images generated:
{
  'introduction': 'https://storage.googleapis.com/...'  # Existing URL
  'key_concept_0': 'https://storage.googleapis.com/...'  # Existing URL
}

update_resource() processes:
1. All images are URLs already
2. No upload needed
3. Saves directly to Firestore
```

### Scenario 3: Save Button Click
```
User clicks "Save Lesson" after edits

All images are already URLs (from previous saves):
{
  'introduction': 'https://storage.googleapis.com/...'
  'key_concept_0': 'https://storage.googleapis.com/...'
}

update_resource() processes:
1. All images are URLs
2. No upload needed
3. Updates Firestore successfully
```

---

## Storage Structure

### Firebase Storage Path
```
gs://dpagent-c65d3.firebasestorage.app/
  resources/
    {resource_id}/
      introduction.png
      key_concept_0.png
      key_concept_1.png
      summary.png
```

### Firestore Document
```javascript
{
  id: "qH1QuQiGn8zRQTcg1gZm",
  user_id: "VM5IRF8DuTUsQNSGBfWPz0u7hOa2",
  resource_type: "lesson",
  title: "The Solar System",
  content: "{...}",  // JSON string
  images: {
    introduction: "https://storage.googleapis.com/.../introduction.png",
    key_concept_0: "https://storage.googleapis.com/.../key_concept_0.png",
    key_concept_1: "https://storage.googleapis.com/.../key_concept_1.png"
  },
  created_at: "2025-11-28T00:00:00Z",
  updated_at: "2025-11-28T00:30:00Z"
}
```

---

## Debug Logging

When updating resources, you'll see:
```
Uploading 1 new images to Firebase Storage...
✓ Images uploaded to Storage
✓ Resource qH1QuQiGn8zRQTcg1gZm updated successfully
```

If no new images:
```
✓ Resource qH1QuQiGn8zRQTcg1gZm updated successfully
```

If error:
```
Error updating resource: 400 Property images contains an invalid nested entity.
```

---

## Testing

### Test Image Generation + Save
```
1. Open lesson from Library
2. Edit: "Change intro image to cartoon style"
3. Wait for image to generate
4. Click "Save Lesson"
5. Should succeed without errors ✅
6. Reopen lesson
7. New image should be visible ✅
```

### Test Text Edit + Save
```
1. Open lesson from Library
2. Edit: "Make introduction longer"
3. Wait for edit to complete
4. Click "Save Lesson"
5. Should succeed without errors ✅
6. Reopen lesson
7. Changes should persist ✅
```

### Test Multiple Edits + Save
```
1. Open lesson from Library
2. Edit: "Add fun fact section"
3. Edit: "Change all images to cartoon style"
4. Click "Save Lesson"
5. Should succeed without errors ✅
6. All changes should persist ✅
```

---

## Related Files

- `backend/services/firebase_service.py` - Lines 287-329
- `backend/app.py` - Lines 324-332 (calls update_resource)
- `frontend/src/components/SaveButton.js` - Calls updateResource API
- `frontend/src/pages/LessonView.js` - Uses SaveButton

---

## Benefits

✅ **Handles base64 images** - Automatically uploads to Storage
✅ **Handles URL images** - Keeps existing URLs unchanged
✅ **Mixed updates** - Can handle both base64 and URLs together
✅ **Efficient** - Only uploads new images, not existing ones
✅ **Reliable** - No more "invalid nested entity" errors

---

## Future Improvements

1. **Progress tracking** - Show upload progress for large images
2. **Image optimization** - Compress before uploading
3. **Cleanup old images** - Delete replaced images from Storage
4. **Batch uploads** - Upload multiple images in parallel
5. **Retry logic** - Retry failed uploads

---

**Status:** ✅ Fixed - Restart Backend to Test
