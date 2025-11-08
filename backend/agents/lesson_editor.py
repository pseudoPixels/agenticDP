from google import genai
import json
import re
from typing import Dict, List, Any, Tuple

class LessonEditorAgent:
    """Agent responsible for editing lessons based on natural language instructions"""
    
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.5-flash-lite'
        
    def process_edit_request(self, lesson_data: Dict[str, Any], user_request: str) -> Tuple[Dict[str, Any], List[str]]:
        """
        Process a natural language edit request and return updated lesson data
        Returns: (updated_lesson_data, list_of_image_sections_to_regenerate)
        """
        
        prompt = f"""You are an AI assistant helping to edit educational lesson content.

Current lesson structure (JSON):
{json.dumps(lesson_data, indent=2)}

User's edit request: "{user_request}"

Analyze the request and return a JSON response with:
{{
    "action": "modify_text|modify_image|modify_structure|add_content|remove_content",
    "target_section": "introduction|key_concepts|detailed_content|activities|summary|specific_path",
    "target_index": null or number (if targeting array element),
    "modifications": {{
        "field_path": "new_value or modification instruction"
    }},
    "image_changes": [
        {{
            "section": "section_name",
            "index": null or number,
            "new_prompt": "new image prompt",
            "style": "educational|cartoon|realistic|minimalist|diagram"
        }}
    ],
    "explanation": "Brief explanation of what was changed"
}}

Examples:
- "make the first paragraph shorter" -> modify introduction text
- "replace the image in activities with cartoon style" -> change image prompt and style
- "add more examples to key concepts" -> add content to key_concepts array
- "make the title more engaging" -> modify title field

Return ONLY the JSON response, no markdown or extra text."""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[prompt]
            )
            
            # Extract text from response
            edit_instructions = ""
            for part in response.parts:
                if part.text is not None:
                    edit_instructions += part.text
            
            edit_instructions = edit_instructions.strip()
            
            # Clean up markdown formatting
            edit_instructions = re.sub(r'^```json\s*', '', edit_instructions)
            edit_instructions = re.sub(r'\s*```$', '', edit_instructions)
            
            instructions = json.loads(edit_instructions)
            
            # Apply the modifications
            updated_lesson = self._apply_modifications(lesson_data, instructions)
            
            # Extract image sections that need regeneration
            image_sections = []
            if 'image_changes' in instructions:
                for change in instructions['image_changes']:
                    image_sections.append({
                        'section': change['section'],
                        'index': change.get('index'),
                        'prompt': change['new_prompt'],
                        'style': change.get('style', 'educational')
                    })
            
            # Increment version
            updated_lesson['version'] = lesson_data.get('version', 1) + 1
            
            return updated_lesson, image_sections
            
        except Exception as e:
            print(f"Error processing edit request: {e}")
            import traceback
            traceback.print_exc()
            return lesson_data, []
    
    def _apply_modifications(self, lesson_data: Dict[str, Any], instructions: Dict[str, Any]) -> Dict[str, Any]:
        """Apply the modification instructions to the lesson data"""
        import copy
        updated_lesson = copy.deepcopy(lesson_data)
        
        action = instructions.get('action')
        target_section = instructions.get('target_section')
        target_index = instructions.get('target_index')
        modifications = instructions.get('modifications', {})
        
        try:
            if action == 'modify_text':
                # Apply text modifications
                for field_path, new_value in modifications.items():
                    self._set_nested_value(updated_lesson, field_path, new_value)
            
            elif action == 'modify_image':
                # Update image prompts
                for field_path, new_value in modifications.items():
                    self._set_nested_value(updated_lesson, field_path, new_value)
            
            elif action == 'modify_structure':
                # Structural changes
                for field_path, new_value in modifications.items():
                    self._set_nested_value(updated_lesson, field_path, new_value)
            
            elif action == 'add_content':
                # Add new content to arrays
                if target_section and target_section in updated_lesson:
                    if isinstance(updated_lesson[target_section], list):
                        for key, value in modifications.items():
                            if key == 'new_item':
                                updated_lesson[target_section].append(value)
            
            elif action == 'remove_content':
                # Remove content from arrays
                if target_section and target_index is not None:
                    if isinstance(updated_lesson[target_section], list):
                        if 0 <= target_index < len(updated_lesson[target_section]):
                            updated_lesson[target_section].pop(target_index)
        
        except Exception as e:
            print(f"Error applying modifications: {e}")
        
        return updated_lesson
    
    def _set_nested_value(self, data: Dict, path: str, value: Any):
        """Set a value in a nested dictionary using dot notation path"""
        keys = path.split('.')
        current = data
        
        for key in keys[:-1]:
            # Handle array indices
            if '[' in key and ']' in key:
                key_name, index = key.split('[')
                index = int(index.rstrip(']'))
                current = current[key_name][index]
            else:
                if key not in current:
                    current[key] = {}
                current = current[key]
        
        final_key = keys[-1]
        if '[' in final_key and ']' in final_key:
            key_name, index = final_key.split('[')
            index = int(index.rstrip(']'))
            current[key_name][index] = value
        else:
            current[final_key] = value
