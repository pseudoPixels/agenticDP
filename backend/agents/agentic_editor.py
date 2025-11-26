from google import genai
import json
import re
from typing import Dict, List, Any, Tuple, Optional
from enum import Enum

class EditIntent(Enum):
    """Types of edit intents"""
    TEXT_MODIFICATION = "text_modification"
    IMAGE_MODIFICATION = "image_modification"
    STRUCTURE_MODIFICATION = "structure_modification"
    STYLE_CHANGE = "style_change"
    CONTENT_ADDITION = "content_addition"
    CONTENT_REMOVAL = "content_removal"
    MIXED = "mixed"

class AgenticLessonEditor:
    """
    Advanced agentic lesson editor that can handle complex, multi-faceted edit requests.
    Uses a multi-agent approach with intent classification, planning, and execution.
    """
    
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.5-flash-lite'
        
    def process_edit_request(self, lesson_data: Dict[str, Any], user_request: str) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Main entry point for processing edit requests.
        Uses a multi-step agentic approach:
        1. Classify intent
        2. Create execution plan
        3. Execute plan
        4. Validate results
        """
        
        print(f"\n{'='*60}")
        print(f"🤖 AGENTIC EDITOR: Processing request")
        print(f"Request: {user_request}")
        print(f"{'='*60}\n")
        
        # Step 1: Classify the intent
        intent = self._classify_intent(user_request)
        print(f"📋 Intent classified as: {intent.value}")
        
        # Step 2: Create execution plan
        plan = self._create_execution_plan(lesson_data, user_request, intent)
        print(f"📝 Execution plan created with {len(plan['steps'])} steps")
        
        # Step 3: Execute the plan
        updated_lesson, image_changes = self._execute_plan(lesson_data, user_request, plan)
        print(f"✅ Plan executed successfully")
        print(f"🖼️  Images to regenerate: {len(image_changes)}")
        
        # Step 4: Increment version
        updated_lesson['version'] = lesson_data.get('version', 1) + 1
        
        return updated_lesson, image_changes
    
    def _classify_intent(self, user_request: str) -> EditIntent:
        """Classify the user's intent using AI"""
        
        prompt = f"""Analyze this edit request and classify its primary intent.

User request: "{user_request}"

Classify into ONE of these categories:
- text_modification: Changing existing text content (make longer, shorter, rewrite, change tone)
- image_modification: Changing image styles, adding/removing images
- structure_modification: Adding/removing sections, reorganizing content
- style_change: Changing overall theme, tone, or presentation style
- content_addition: Adding new content, examples, or sections
- content_removal: Removing content or sections
- mixed: Multiple types of changes

Return ONLY the category name, nothing else."""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[prompt]
            )
            
            intent_str = self._extract_text(response).strip().lower()
            
            # Map to enum
            for intent in EditIntent:
                if intent.value in intent_str:
                    return intent
            
            return EditIntent.MIXED
            
        except Exception as e:
            print(f"Error classifying intent: {e}")
            return EditIntent.MIXED
    
    def _create_execution_plan(self, lesson_data: Dict[str, Any], user_request: str, intent: EditIntent) -> Dict[str, Any]:
        """Create a detailed execution plan for the edit"""
        
        prompt = f"""You are a lesson editing planner. Create a detailed execution plan for this edit request.

Current lesson structure:
- Title: {lesson_data.get('title', 'N/A')}
- Has introduction: {'Yes' if 'introduction' in lesson_data else 'No'}
- Number of key concepts: {len(lesson_data.get('key_concepts', []))}
- Number of detailed sections: {len(lesson_data.get('detailed_content', []))}
- Has activities: {'Yes' if 'activities' in lesson_data else 'No'}
- Has summary: {'Yes' if 'summary' in lesson_data else 'No'}

User request: "{user_request}"
Intent type: {intent.value}

Create a JSON execution plan with these fields:
{{
  "steps": [
    {{
      "action": "modify_text|modify_image|add_section|remove_section|change_style",
      "target": "introduction|key_concepts|detailed_content|activities|summary|specific_index",
      "details": "specific details about what to change",
      "index": null or number if targeting specific item
    }}
  ],
  "requires_image_regeneration": true/false,
  "image_targets": ["introduction", "key_concept_0", etc],
  "new_image_style": "cartoon|realistic|minimalist|diagram|black_and_white|educational|null"
}}

Return ONLY valid JSON, no markdown or extra text."""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[prompt]
            )
            
            plan_text = self._extract_text(response).strip()
            plan_text = re.sub(r'^```json\s*', '', plan_text)
            plan_text = re.sub(r'\s*```$', '', plan_text)
            
            plan = json.loads(plan_text)
            return plan
            
        except Exception as e:
            print(f"Error creating execution plan: {e}")
            # Return a basic plan
            return {
                "steps": [{"action": "modify_text", "target": "all", "details": user_request}],
                "requires_image_regeneration": False,
                "image_targets": [],
                "new_image_style": None
            }
    
    def _execute_plan(self, lesson_data: Dict[str, Any], user_request: str, plan: Dict[str, Any]) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """Execute the planned changes"""
        
        # Generate the updated lesson content
        updated_lesson = self._generate_updated_content(lesson_data, user_request, plan)
        
        # Determine image changes
        image_changes = []
        if plan.get('requires_image_regeneration', False):
            image_changes = self._generate_image_changes(updated_lesson, plan)
        
        return updated_lesson, image_changes
    
    def _generate_updated_content(self, lesson_data: Dict[str, Any], user_request: str, plan: Dict[str, Any]) -> Dict[str, Any]:
        """Generate the updated lesson content based on the plan"""
        
        prompt = f"""You are an expert lesson editor. Update this lesson based on the user's request and execution plan.

CURRENT LESSON (JSON):
{json.dumps(lesson_data, indent=2)}

USER REQUEST: "{user_request}"

EXECUTION PLAN:
{json.dumps(plan, indent=2)}

INSTRUCTIONS:
1. Make ALL changes requested by the user
2. If adding a new section, create it with proper structure including:
   - heading/title
   - text/description/paragraphs
   - image_prompt (if images are mentioned or would enhance the section)
3. If changing image style, update ALL image_prompt fields to include the new style
4. If removing images, remove the image_prompt fields
5. If changing text theme/tone, rewrite the content in that theme
6. Maintain the JSON structure and all required fields
7. Keep the lesson_id unchanged

IMPORTANT IMAGE HANDLING:
- For "add images to all sections": Add image_prompt to introduction, ALL key_concepts, ALL detailed_content, activities, and summary
- For "add another image to X section": Convert image_prompt to array format: "image_prompts": ["existing prompt", "new prompt"]
- For "make the second image X style": Identify which is the second image in display order (intro=1st, key_concept_0=2nd) and update that style
- For "add image to summary/activities": Add image_prompt field to that section
- For image prompts, be very specific and descriptive
- If user wants a specific style (cartoon, realistic, black and white, etc), include that in the image_prompt
- If adding a section with an image, create a detailed image_prompt for it
- Support both single image_prompt (string) and multiple image_prompts (array) formats

DISPLAY ORDER OF IMAGES (for reference when user says "second image", "third image", etc):
1. Introduction image (if exists)
2. First key concept image (key_concepts[0])
3. Detailed content images (if any)
4. Activities image (if exists)
5. Summary image (if exists)

Return ONLY the complete updated lesson as valid JSON, no markdown or extra text."""

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[prompt]
            )
            
            lesson_text = self._extract_text(response).strip()
            lesson_text = re.sub(r'^```json\s*', '', lesson_text)
            lesson_text = re.sub(r'\s*```$', '', lesson_text)
            
            updated_lesson = json.loads(lesson_text)
            return updated_lesson
            
        except Exception as e:
            print(f"Error generating updated content: {e}")
            import traceback
            traceback.print_exc()
            return lesson_data
    
    def _generate_image_changes(self, updated_lesson: Dict[str, Any], plan: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate the list of images that need to be regenerated"""
        
        image_changes = []
        image_style = plan.get('new_image_style', 'educational')
        image_targets = plan.get('image_targets', [])
        
        print(f"🖼️  Generating image changes. Targets: {image_targets}, Style: {image_style}")
        
        # If no specific targets, check all sections that have image prompts
        if not image_targets or 'all' in str(image_targets).lower():
            # Check introduction (supports both single and multiple images)
            if 'introduction' in updated_lesson:
                intro = updated_lesson['introduction']
                # Handle array of prompts
                if 'image_prompts' in intro and isinstance(intro['image_prompts'], list):
                    for img_idx, prompt in enumerate(intro['image_prompts']):
                        image_changes.append({
                            'section': 'introduction',
                            'index': None,
                            'sub_index': img_idx,
                            'prompt': prompt,
                            'style': image_style
                        })
                # Handle single prompt
                elif 'image_prompt' in intro:
                    image_changes.append({
                        'section': 'introduction',
                        'index': None,
                        'sub_index': None,
                        'prompt': intro['image_prompt'],
                        'style': image_style
                    })
            
            # Check ALL key concepts (not just first one when regenerating all)
            if 'key_concepts' in updated_lesson:
                for idx, concept in enumerate(updated_lesson['key_concepts']):
                    if 'image_prompt' in concept:
                        image_changes.append({
                            'section': 'key_concepts',
                            'index': idx,
                            'prompt': concept['image_prompt'],
                            'style': image_style
                        })
            
            # Check detailed content
            if 'detailed_content' in updated_lesson:
                for idx, section in enumerate(updated_lesson['detailed_content']):
                    if 'image_prompt' in section:
                        image_changes.append({
                            'section': 'detailed_content',
                            'index': idx,
                            'prompt': section['image_prompt'],
                            'style': image_style
                        })
            
            # Check activities
            if 'activities' in updated_lesson and 'image_prompt' in updated_lesson['activities']:
                image_changes.append({
                    'section': 'activities',
                    'index': None,
                    'prompt': updated_lesson['activities']['image_prompt'],
                    'style': image_style
                })
            
            # Check summary
            if 'summary' in updated_lesson and 'image_prompt' in updated_lesson['summary']:
                image_changes.append({
                    'section': 'summary',
                    'index': None,
                    'prompt': updated_lesson['summary']['image_prompt'],
                    'style': image_style
                })
        else:
            # Process specific targets
            for target in image_targets:
                if target == 'introduction':
                    if 'introduction' in updated_lesson and 'image_prompt' in updated_lesson['introduction']:
                        image_changes.append({
                            'section': 'introduction',
                            'index': None,
                            'prompt': updated_lesson['introduction']['image_prompt'],
                            'style': image_style
                        })
                
                elif target.startswith('key_concept') or target == 'key_concepts':
                    # If target is just 'key_concepts', add images to ALL key concepts
                    if target == 'key_concepts':
                        if 'key_concepts' in updated_lesson:
                            for idx, concept in enumerate(updated_lesson['key_concepts']):
                                if 'image_prompt' in concept:
                                    image_changes.append({
                                        'section': 'key_concepts',
                                        'index': idx,
                                        'prompt': concept['image_prompt'],
                                        'style': image_style
                                    })
                    else:
                        # Target has specific index like 'key_concept_0'
                        try:
                            idx = int(target.split('_')[-1])
                            if 'key_concepts' in updated_lesson and idx < len(updated_lesson['key_concepts']):
                                concept = updated_lesson['key_concepts'][idx]
                                if 'image_prompt' in concept:
                                    image_changes.append({
                                        'section': 'key_concepts',
                                        'index': idx,
                                        'prompt': concept['image_prompt'],
                                        'style': image_style
                                    })
                        except ValueError:
                            print(f"⚠️  Warning: Could not parse index from target: {target}")
                
                elif target.startswith('detailed_content') or target == 'detailed_content':
                    # If target is just 'detailed_content', add images to ALL detailed content sections
                    if target == 'detailed_content':
                        if 'detailed_content' in updated_lesson:
                            for idx, section in enumerate(updated_lesson['detailed_content']):
                                if 'image_prompt' in section:
                                    image_changes.append({
                                        'section': 'detailed_content',
                                        'index': idx,
                                        'prompt': section['image_prompt'],
                                        'style': image_style
                                    })
                    else:
                        # Target has specific index like 'detailed_content_0'
                        try:
                            idx = int(target.split('_')[-1])
                            if 'detailed_content' in updated_lesson and idx < len(updated_lesson['detailed_content']):
                                section = updated_lesson['detailed_content'][idx]
                                if 'image_prompt' in section:
                                    image_changes.append({
                                        'section': 'detailed_content',
                                        'index': idx,
                                        'prompt': section['image_prompt'],
                                        'style': image_style
                                    })
                        except ValueError:
                            # If parsing fails, skip this target
                            print(f"⚠️  Warning: Could not parse index from target: {target}")
                
                elif target == 'activities':
                    if 'activities' in updated_lesson and 'image_prompt' in updated_lesson['activities']:
                        image_changes.append({
                            'section': 'activities',
                            'index': None,
                            'prompt': updated_lesson['activities']['image_prompt'],
                            'style': image_style
                        })
                
                elif target == 'summary':
                    if 'summary' in updated_lesson and 'image_prompt' in updated_lesson['summary']:
                        image_changes.append({
                            'section': 'summary',
                            'index': None,
                            'prompt': updated_lesson['summary']['image_prompt'],
                            'style': image_style
                        })
        
        return image_changes
    
    def _extract_text(self, response) -> str:
        """Extract text from Gemini response"""
        response_text = ""
        if hasattr(response, 'text') and response.text:
            response_text = response.text
        elif hasattr(response, 'candidates') and response.candidates:
            for candidate in response.candidates:
                if hasattr(candidate, 'content') and candidate.content:
                    for part in candidate.content.parts:
                        if hasattr(part, 'text') and part.text:
                            response_text += part.text
        return response_text.strip()
