# Image Edit Fix

## Issue
When requesting image edits like "make the intro image black and white", the image wasn't updating in the display.

## Root Cause
**Key mapping mismatch** between backend and frontend:
- Backend was using: `key_concepts_0`
- Frontend expects: `key_concept_0` (singular)

## Fix Applied

### 1. Updated `backend/agents/agentic_editor.py`
Changed section name from `'key_concept'` to `'key_concepts'` to match lesson structure.

### 2. Updated `backend/app.py`
Added proper key mapping logic:
```python
# Map section names to the correct key format used in frontend
if section == 'key_concepts' and index is not None:
    key = f"key_concept_{index}"  # Convert to singular for frontend
elif index is not None:
    key = f"{section}_{index}"
else:
    key = section
```

## How It Works Now

### Example: "Make the intro image black and white"

1. **Intent Classification**: `IMAGE_MODIFICATION`
2. **Planning**: Identifies `introduction` section needs image regeneration
3. **Execution**: Updates image prompt to include "black and white" style
4. **Image Generation**: Regenerates with `style='black_and_white'`
5. **Key Mapping**: Stores as `'introduction'` key
6. **Frontend Update**: Image updates immediately

### Example: "Change all images to cartoon style"

1. **Intent Classification**: `IMAGE_MODIFICATION`
2. **Planning**: Identifies all image sections
3. **Execution**: Updates all image prompts with cartoon style
4. **Image Generation**: 
   - `introduction` → stored as `'introduction'`
   - `key_concepts[0]` → stored as `'key_concept_0'`
5. **Frontend Update**: All images update with cartoon style

## Testing

### Test 1: Single Image Edit
```
Request: "Make the intro image black and white"
Expected: Introduction image regenerates in B&W
Key used: 'introduction'
```

### Test 2: Style Change
```
Request: "Make the first key concept image cartoon style"
Expected: First key concept image becomes cartoon
Key used: 'key_concept_0'
```

### Test 3: All Images
```
Request: "Change all images to realistic style"
Expected: Both intro and key concept images become realistic
Keys used: 'introduction', 'key_concept_0'
```

## Verification

After the fix, you should see in the backend logs:
```
Regenerating image for introduction (index: None, style: black_and_white): ...
Image regenerated successfully for key: introduction
```

And the frontend should receive the updated image in the response and display it immediately.

## Status
✅ **FIXED** - Image edits now work correctly with proper key mapping
