# 🐛 Bug Fix: "Add image to Detailed Content" Error

## Issue
When requesting "Add relevant image in the Detailed Content", the system crashed with:
```
Error in edit_lesson: invalid literal for int() with base 10: 'content'
```

## Root Cause
The planning agent was returning `image_targets: ['detailed_content']` (without an index), but the image generation code was trying to parse an index from it:

```python
# This line failed when target = 'detailed_content'
idx = int(target.split('_')[-1])  # Tries to do int('content') → ERROR
```

The code assumed targets would always have an index like `'detailed_content_0'`, but the planning agent was returning just `'detailed_content'` to mean "add to all detailed content sections".

## Fix Applied

Updated `backend/agents/agentic_editor.py` to handle both formats:

### 1. For `key_concepts` targets:
```python
elif target.startswith('key_concept') or target == 'key_concepts':
    # If target is just 'key_concepts', add images to ALL key concepts
    if target == 'key_concepts':
        if 'key_concepts' in updated_lesson:
            for idx, concept in enumerate(updated_lesson['key_concepts']):
                if 'image_prompt' in concept:
                    image_changes.append({...})
    else:
        # Target has specific index like 'key_concept_0'
        try:
            idx = int(target.split('_')[-1])
            # ... add specific concept
        except ValueError:
            print(f"⚠️  Warning: Could not parse index from target: {target}")
```

### 2. For `detailed_content` targets:
```python
elif target.startswith('detailed_content') or target == 'detailed_content':
    # If target is just 'detailed_content', add images to ALL detailed content sections
    if target == 'detailed_content':
        if 'detailed_content' in updated_lesson:
            for idx, section in enumerate(updated_lesson['detailed_content']):
                if 'image_prompt' in section:
                    image_changes.append({...})
    else:
        # Target has specific index like 'detailed_content_0'
        try:
            idx = int(target.split('_')[-1])
            # ... add specific section
        except ValueError:
            print(f"⚠️  Warning: Could not parse index from target: {target}")
```

## What Changed

### Before (Broken):
```python
# Assumed target always has index
idx = int(target.split('_')[-1])  # Crashes if target = 'detailed_content'
```

### After (Fixed):
```python
# Check if target is generic or specific
if target == 'detailed_content':
    # Add to ALL detailed content sections
    for idx, section in enumerate(...):
        ...
else:
    # Parse specific index with error handling
    try:
        idx = int(target.split('_')[-1])
    except ValueError:
        print(f"Warning: Could not parse index")
```

## Now Supports

### ✅ Generic Targets (Add to ALL):
- `"Add image to detailed content"` → Adds to all detailed content sections
- `"Add image to key concepts"` → Adds to all key concepts

### ✅ Specific Targets (Add to ONE):
- `"Add image to first detailed content"` → Adds to detailed_content_0
- `"Add image to second key concept"` → Adds to key_concept_1

### ✅ Error Handling:
- Invalid targets are caught and logged
- System continues processing other targets
- No more crashes!

## Testing

### Test 1: Generic Request
```bash
Prompt: "Add relevant image in the Detailed Content"
Expected: All detailed content sections get images
Status: ✅ FIXED
```

### Test 2: Specific Request
```bash
Prompt: "Add image to the first detailed content section"
Expected: Only first detailed content gets image
Status: ✅ Works
```

### Test 3: Multiple Sections
```bash
Prompt: "Add images to all key concepts"
Expected: All key concepts get images
Status: ✅ Works
```

## Benefits

1. **More Flexible**: Handles both generic and specific requests
2. **Robust**: Won't crash on unexpected target formats
3. **User-Friendly**: Users can say "add to detailed content" without specifying which one
4. **Better Logging**: Warnings for unparseable targets

## Summary

✅ **Bug Fixed**: No more crashes when adding images to sections
✅ **Enhanced**: Now supports both generic and specific targeting
✅ **Robust**: Added try-catch for parsing errors
✅ **Tested**: Works with all section types

The agentic editor is now more resilient and user-friendly!
