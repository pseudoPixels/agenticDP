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

IMPORTANT GUIDELINES:
1. For translations or theme changes, use "modify_text" with "preserve_structure: true"
2. For image style changes, use "modify_image" with "preserve_content: true"
3. NEVER include "remove_section" unless explicitly requested by user
4. For simple text edits, do NOT include image regeneration unless specifically requested

Create a JSON execution plan with these fields:
{{
  "steps": [
    {{
      "action": "modify_text|modify_image|add_section|remove_section|change_style",
      "target": "introduction|key_concepts|detailed_content|activities|summary|specific_index|all",
      "details": "specific details about what to change",
      "index": null or number if targeting specific item,
      "preserve_structure": true/false (set to true for translations/theme changes)
    }}
  ],
  "requires_image_regeneration": true/false,
  "image_targets": ["introduction", "key_concept_0", etc],
  "new_image_style": "cartoon|realistic|minimalist|diagram|black_and_white|educational|null",
  "preserve_content": true/false (set to true for simple edits like translations)
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
            
            # For simple text modifications like translations or theme changes,
            # ensure we're not regenerating images unless specifically requested
            if intent in [EditIntent.TEXT_MODIFICATION, EditIntent.STYLE_CHANGE, EditIntent.IMAGE_MODIFICATION]:
                # Check if the request is about translation or theming
                translation_keywords = ['translate', 'translation', 'language', 'bangla', 'spanish', 'french']
                theme_keywords = ['theme', 'style', 'tone', 'batman', 'superhero', 'formal', 'casual']
                character_keywords = ['spider man', 'spiderman', 'batman', 'superman', 'wonder woman', 'iron man']
                image_keywords = ['image', 'picture', 'photo', 'illustration']
                
                is_translation = any(keyword in user_request.lower() for keyword in translation_keywords)
                is_theme_change = any(keyword in user_request.lower() for keyword in theme_keywords)
                is_character_theme = any(keyword in user_request.lower() for keyword in character_keywords)
                is_image_request = any(keyword in user_request.lower() for keyword in image_keywords)
                
                # Special handling for character themes (Batman, Spider-Man, etc.)
                if is_character_theme:
                    print(f"🦸 Character theme detected: {user_request}")
                    
                    # If it's about making images as a character
                    if is_image_request:
                        # This is an image modification request
                        plan['requires_image_regeneration'] = True
                        plan['image_targets'] = ['all']
                        plan['preserve_content'] = True
                        
                        # Extract character name for image style
                        character = ''
                        for kw in character_keywords:
                            if kw in user_request.lower():
                                character = kw
                                break
                        
                        plan['new_image_style'] = f"{character} style"
                        print(f"🖼️ Will regenerate all images in {character} style")
                        
                        # Ensure steps are correctly set
                        has_image_step = False
                        for step in plan['steps']:
                            if step['action'] == 'modify_image':
                                step['target'] = 'all'
                                step['details'] = f"Change all images to {character} style"
                                has_image_step = True
                        
                        if not has_image_step:
                            plan['steps'].append({
                                "action": "modify_image",
                                "target": "all",
                                "details": f"Change all images to {character} style",
                                "preserve_structure": True
                            })
                    
                    # If it's about making the whole content themed (Batman themed, etc.)
                    else:
                        # This is both text and image modification
                        plan['requires_image_regeneration'] = True
                        plan['image_targets'] = ['all']
                        plan['preserve_content'] = True
                        
                        # Extract character name
                        character = ''
                        for kw in character_keywords:
                            if kw in user_request.lower():
                                character = kw
                                break
                        
                        plan['new_image_style'] = f"{character} style"
                        print(f"🦸 Will apply {character} theme to text and images")
                        
                        # Ensure we have both text and image steps
                        has_text_step = False
                        has_image_step = False
                        
                        for step in plan['steps']:
                            if step['action'] == 'modify_text':
                                step['target'] = 'all'
                                step['details'] = f"Change text content to {character} theme"
                                step['preserve_structure'] = True
                                has_text_step = True
                            elif step['action'] == 'modify_image':
                                step['target'] = 'all'
                                step['details'] = f"Change all images to {character} style"
                                has_image_step = True
                        
                        if not has_text_step:
                            plan['steps'].append({
                                "action": "modify_text",
                                "target": "all",
                                "details": f"Change text content to {character} theme",
                                "preserve_structure": True
                            })
                        
                        if not has_image_step:
                            plan['steps'].append({
                                "action": "modify_image",
                                "target": "all",
                                "details": f"Change all images to {character} style",
                                "preserve_structure": True
                            })
                
                # Handle regular translations
                elif is_translation:
                    # Override image regeneration settings for translations
                    plan['requires_image_regeneration'] = False
                    plan['image_targets'] = []
                    plan['preserve_content'] = True
                    
                    # Ensure all steps have preserve_structure set to true
                    for step in plan['steps']:
                        step['preserve_structure'] = True
                    
                    print(f"📝 Translation detected. Preserving structure and images.")
                
                # Handle regular theme changes
                elif is_theme_change and not is_image_request:
                    # For theme changes, we want to preserve structure but update both text and images
                    plan['requires_image_regeneration'] = True
                    plan['image_targets'] = ['all']
                    plan['preserve_content'] = True
                    
                    # Extract theme name
                    theme = ''
                    for kw in theme_keywords:
                        if kw in user_request.lower():
                            theme = kw
                            break
                    
                    plan['new_image_style'] = f"{theme} style"
                    
                    # Ensure we have both text and image steps
                    has_text_step = False
                    has_image_step = False
                    
                    for step in plan['steps']:
                        if step['action'] == 'modify_text':
                            step['target'] = 'all'
                            step['details'] = f"Change text content to {theme} theme"
                            step['preserve_structure'] = True
                            has_text_step = True
                        elif step['action'] == 'modify_image':
                            step['target'] = 'all'
                            step['details'] = f"Change all images to {theme} style"
                            has_image_step = True
                    
                    if not has_text_step:
                        plan['steps'].append({
                            "action": "modify_text",
                            "target": "all",
                            "details": f"Change text content to {theme} theme",
                            "preserve_structure": True
                        })
                    
                    if not has_image_step:
                        plan['steps'].append({
                            "action": "modify_image",
                            "target": "all",
                            "details": f"Change all images to {theme} style",
                            "preserve_structure": True
                        })
                    
                    print(f"🎭 Theme change detected. Will update both text and images to {theme} theme.")
            
            return plan
            
        except Exception as e:
            print(f"Error creating execution plan: {e}")
            # Return a basic plan with structure preservation
            return {
                "steps": [{
                    "action": "modify_text", 
                    "target": "all", 
                    "details": user_request,
                    "preserve_structure": True
                }],
                "requires_image_regeneration": False,
                "image_targets": [],
                "new_image_style": None,
                "preserve_content": True
            }
    
    def _execute_plan(self, lesson_data: Dict[str, Any], user_request: str, plan: Dict[str, Any]) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """Execute the planned changes"""
        
        # Check if we need to preserve content (for translations, theme changes, etc.)
        preserve_content = plan.get('preserve_content', False)
        
        # Generate the updated lesson content
        updated_lesson = self._generate_updated_content(lesson_data, user_request, plan)
        
        # Determine image changes
        image_changes = []
        
        # Only regenerate images if explicitly requested
        if plan.get('requires_image_regeneration', False):
            # For content preservation (translations/themes), we need to be extra careful with images
            if preserve_content:
                print("📋 Content preservation enabled - carefully handling image changes")
                # Only update image prompts to include new style/theme without regenerating
                # unless explicitly requested in the plan
                if 'image' in user_request.lower() or len(plan.get('image_targets', [])) > 0:
                    image_changes = self._generate_image_changes(updated_lesson, plan)
            else:
                # Standard image regeneration
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
1. Make ONLY the changes requested by the user
2. PRESERVE ALL existing content structure, sections, and fields that aren't explicitly changed
3. NEVER remove any sections, images, or descriptions unless explicitly requested
4. If translating or changing theme, modify ONLY the text content while keeping all structure intact
5. For style changes (like Batman theme), modify text but PRESERVE all images (just update image_prompts)
6. If adding a new section, create it with proper structure including:
   - heading/title
   - text/description/paragraphs
   - image_prompt (if images are mentioned or would enhance the section)
7. If changing image style, update image_prompt fields to include the new style but KEEP the original subject
8. Keep the lesson_id and version unchanged
9. CRITICAL: Ensure ALL fields from the original lesson are preserved in the output

IMPORTANT IMAGE HANDLING:
- NEVER remove image_prompt fields unless explicitly requested
- For "add images to all sections": Add image_prompt to sections that don't have them
- For "add another image to X section": Convert image_prompt to array format: "image_prompts": ["existing prompt", "new prompt"]
- For "make the second image X style": Update only that specific image's prompt
- For image prompts, be very specific and descriptive
- If user wants a specific style (cartoon, realistic, black and white, etc), include that in the image_prompt
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
            
            # Verification step: Ensure all original sections and structure are preserved
            updated_lesson = self._verify_content_preservation(lesson_data, updated_lesson, plan)
            
            return updated_lesson
            
        except Exception as e:
            print(f"Error generating updated content: {e}")
            import traceback
            traceback.print_exc()
            return lesson_data
    
    def _verify_content_preservation(self, original_lesson: Dict[str, Any], updated_lesson: Dict[str, Any], plan: Dict[str, Any]) -> Dict[str, Any]:
        """Verify that all original content structure is preserved in the updated lesson"""
        
        # Ensure all top-level keys from original are in updated
        for key in original_lesson:
            if key not in updated_lesson and key != 'version':
                print(f"⚠️ Missing key in updated lesson: {key}. Restoring from original.")
                updated_lesson[key] = original_lesson[key]
        
        # Check for introduction
        if 'introduction' in original_lesson and 'introduction' in updated_lesson:
            # Ensure image_prompt is preserved if it existed
            if 'image_prompt' in original_lesson['introduction'] and 'image_prompt' not in updated_lesson['introduction']:
                print("⚠️ Introduction image_prompt was lost. Restoring.")
                updated_lesson['introduction']['image_prompt'] = original_lesson['introduction']['image_prompt']
        
        # Check key_concepts
        if 'key_concepts' in original_lesson and 'key_concepts' in updated_lesson:
            # Ensure we have at least as many key concepts
            if len(updated_lesson['key_concepts']) < len(original_lesson['key_concepts']):
                print(f"⚠️ Key concepts count reduced from {len(original_lesson['key_concepts'])} to {len(updated_lesson['key_concepts'])}. Restoring missing concepts.")
                # Add missing concepts
                updated_lesson['key_concepts'].extend(original_lesson['key_concepts'][len(updated_lesson['key_concepts']):]) 
            
            # Check each concept for image_prompt preservation
            for i, concept in enumerate(original_lesson['key_concepts']):
                if i < len(updated_lesson['key_concepts']):
                    if 'image_prompt' in concept and 'image_prompt' not in updated_lesson['key_concepts'][i]:
                        print(f"⚠️ Key concept {i} image_prompt was lost. Restoring.")
                        updated_lesson['key_concepts'][i]['image_prompt'] = concept['image_prompt']
        
        # Check detailed_content
        if 'detailed_content' in original_lesson and 'detailed_content' in updated_lesson:
            # Ensure we have at least as many detailed content sections
            if len(updated_lesson['detailed_content']) < len(original_lesson['detailed_content']):
                print(f"⚠️ Detailed content count reduced from {len(original_lesson['detailed_content'])} to {len(updated_lesson['detailed_content'])}. Restoring missing sections.")
                # Add missing sections
                updated_lesson['detailed_content'].extend(original_lesson['detailed_content'][len(updated_lesson['detailed_content']):]) 
            
            # Check each section for image_prompt preservation
            for i, section in enumerate(original_lesson['detailed_content']):
                if i < len(updated_lesson['detailed_content']):
                    if 'image_prompt' in section and 'image_prompt' not in updated_lesson['detailed_content'][i]:
                        print(f"⚠️ Detailed content {i} image_prompt was lost. Restoring.")
                        updated_lesson['detailed_content'][i]['image_prompt'] = section['image_prompt']
        
        # Check activities
        if 'activities' in original_lesson and 'activities' in updated_lesson:
            # Ensure image_prompt is preserved if it existed
            if 'image_prompt' in original_lesson['activities'] and 'image_prompt' not in updated_lesson['activities']:
                print("⚠️ Activities image_prompt was lost. Restoring.")
                updated_lesson['activities']['image_prompt'] = original_lesson['activities']['image_prompt']
        
        # Check summary
        if 'summary' in original_lesson and 'summary' in updated_lesson:
            # Ensure image_prompt is preserved if it existed
            if 'image_prompt' in original_lesson['summary'] and 'image_prompt' not in updated_lesson['summary']:
                print("⚠️ Summary image_prompt was lost. Restoring.")
                updated_lesson['summary']['image_prompt'] = original_lesson['summary']['image_prompt']
        
        return updated_lesson
    
    def _generate_image_changes(self, updated_lesson: Dict[str, Any], plan: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate the list of images that need to be regenerated"""
        
        image_changes = []
        image_style = plan.get('new_image_style', 'educational')
        image_targets = plan.get('image_targets', [])
        preserve_content = plan.get('preserve_content', False)
        
        print(f"🖼️  Generating image changes. Targets: {image_targets}, Style: {image_style}, Preserve Content: {preserve_content}")
        
        # For character themes or style changes, we need to enhance the image prompts
        character_keywords = ['batman', 'spider man', 'spiderman', 'superman', 'wonder woman', 'iron man']
        is_character_theme = any(keyword in image_style.lower() for keyword in character_keywords)
        
        # Extract the character/theme name
        theme_name = ''
        if is_character_theme:
            for keyword in character_keywords:
                if keyword in image_style.lower():
                    theme_name = keyword
                    break
            print(f"🦸 Detected character theme: {theme_name}")
        
        # If no specific targets, check all sections that have image prompts
        if not image_targets or 'all' in str(image_targets).lower():
            # Check introduction (supports both single and multiple images)
            if 'introduction' in updated_lesson:
                intro = updated_lesson['introduction']
                # Handle array of prompts
                if 'image_prompts' in intro and isinstance(intro['image_prompts'], list):
                    for img_idx, prompt in enumerate(intro['image_prompts']):
                        # Enhance prompt for character themes
                        enhanced_prompt = prompt
                        if is_character_theme and preserve_content:
                            enhanced_prompt = self._enhance_prompt_with_theme(prompt, theme_name)
                        
                        image_changes.append({
                            'section': 'introduction',
                            'index': None,
                            'sub_index': img_idx,
                            'prompt': enhanced_prompt,
                            'style': image_style
                        })
                # Handle single prompt
                elif 'image_prompt' in intro:
                    # Enhance prompt for character themes
                    enhanced_prompt = intro['image_prompt']
                    if is_character_theme and preserve_content:
                        enhanced_prompt = self._enhance_prompt_with_theme(intro['image_prompt'], theme_name)
                    
                    image_changes.append({
                        'section': 'introduction',
                        'index': None,
                        'sub_index': None,
                        'prompt': enhanced_prompt,
                        'style': image_style
                    })
            
            # Check ALL key concepts (not just first one when regenerating all)
            if 'key_concepts' in updated_lesson:
                for idx, concept in enumerate(updated_lesson['key_concepts']):
                    if 'image_prompt' in concept:
                        # Enhance prompt for character themes
                        enhanced_prompt = concept['image_prompt']
                        if is_character_theme and preserve_content:
                            enhanced_prompt = self._enhance_prompt_with_theme(concept['image_prompt'], theme_name)
                        
                        image_changes.append({
                            'section': 'key_concepts',
                            'index': idx,
                            'prompt': enhanced_prompt,
                            'style': image_style
                        })
            
            # Check detailed content
            if 'detailed_content' in updated_lesson:
                for idx, section in enumerate(updated_lesson['detailed_content']):
                    if 'image_prompt' in section:
                        # Enhance prompt for character themes
                        enhanced_prompt = section['image_prompt']
                        if is_character_theme and preserve_content:
                            enhanced_prompt = self._enhance_prompt_with_theme(section['image_prompt'], theme_name)
                        
                        image_changes.append({
                            'section': 'detailed_content',
                            'index': idx,
                            'prompt': enhanced_prompt,
                            'style': image_style
                        })
            
            # Check activities
            if 'activities' in updated_lesson and 'image_prompt' in updated_lesson['activities']:
                # Enhance prompt for character themes
                enhanced_prompt = updated_lesson['activities']['image_prompt']
                if is_character_theme and preserve_content:
                    enhanced_prompt = self._enhance_prompt_with_theme(updated_lesson['activities']['image_prompt'], theme_name)
                
                image_changes.append({
                    'section': 'activities',
                    'index': None,
                    'prompt': enhanced_prompt,
                    'style': image_style
                })
            
            # Check summary
            if 'summary' in updated_lesson and 'image_prompt' in updated_lesson['summary']:
                # Enhance prompt for character themes
                enhanced_prompt = updated_lesson['summary']['image_prompt']
                if is_character_theme and preserve_content:
                    enhanced_prompt = self._enhance_prompt_with_theme(updated_lesson['summary']['image_prompt'], theme_name)
                
                image_changes.append({
                    'section': 'summary',
                    'index': None,
                    'prompt': enhanced_prompt,
                    'style': image_style
                })
        else:
            # Process specific targets
            for target in image_targets:
                if target == 'introduction':
                    if 'introduction' in updated_lesson and 'image_prompt' in updated_lesson['introduction']:
                        # Enhance prompt for character themes
                        enhanced_prompt = updated_lesson['introduction']['image_prompt']
                        if is_character_theme and preserve_content:
                            enhanced_prompt = self._enhance_prompt_with_theme(updated_lesson['introduction']['image_prompt'], theme_name)
                        
                        image_changes.append({
                            'section': 'introduction',
                            'index': None,
                            'prompt': enhanced_prompt,
                            'style': image_style
                        })
                
                elif target.startswith('key_concept') or target == 'key_concepts':
                    # If target is just 'key_concepts', add images to ALL key concepts
                    if target == 'key_concepts':
                        if 'key_concepts' in updated_lesson:
                            for idx, concept in enumerate(updated_lesson['key_concepts']):
                                if 'image_prompt' in concept:
                                    # Enhance prompt for character themes
                                    enhanced_prompt = concept['image_prompt']
                                    if is_character_theme and preserve_content:
                                        enhanced_prompt = self._enhance_prompt_with_theme(concept['image_prompt'], theme_name)
                                    
                                    image_changes.append({
                                        'section': 'key_concepts',
                                        'index': idx,
                                        'prompt': enhanced_prompt,
                                        'style': image_style
                                    })
                    else:
                        # Target has specific index like 'key_concept_0'
                        try:
                            idx = int(target.split('_')[-1])
                            if 'key_concepts' in updated_lesson and idx < len(updated_lesson['key_concepts']):
                                concept = updated_lesson['key_concepts'][idx]
                                if 'image_prompt' in concept:
                                    # Enhance prompt for character themes
                                    enhanced_prompt = concept['image_prompt']
                                    if is_character_theme and preserve_content:
                                        enhanced_prompt = self._enhance_prompt_with_theme(concept['image_prompt'], theme_name)
                                    
                                    image_changes.append({
                                        'section': 'key_concepts',
                                        'index': idx,
                                        'prompt': enhanced_prompt,
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
                                    # Enhance prompt for character themes
                                    enhanced_prompt = section['image_prompt']
                                    if is_character_theme and preserve_content:
                                        enhanced_prompt = self._enhance_prompt_with_theme(section['image_prompt'], theme_name)
                                    
                                    image_changes.append({
                                        'section': 'detailed_content',
                                        'index': idx,
                                        'prompt': enhanced_prompt,
                                        'style': image_style
                                    })
                    else:
                        # Target has specific index like 'detailed_content_0'
                        try:
                            idx = int(target.split('_')[-1])
                            if 'detailed_content' in updated_lesson and idx < len(updated_lesson['detailed_content']):
                                section = updated_lesson['detailed_content'][idx]
                                if 'image_prompt' in section:
                                    # Enhance prompt for character themes
                                    enhanced_prompt = section['image_prompt']
                                    if is_character_theme and preserve_content:
                                        enhanced_prompt = self._enhance_prompt_with_theme(section['image_prompt'], theme_name)
                                    
                                    image_changes.append({
                                        'section': 'detailed_content',
                                        'index': idx,
                                        'prompt': enhanced_prompt,
                                        'style': image_style
                                    })
                        except ValueError:
                            # If parsing fails, skip this target
                            print(f"⚠️  Warning: Could not parse index from target: {target}")
                
                elif target == 'activities':
                    if 'activities' in updated_lesson and 'image_prompt' in updated_lesson['activities']:
                        # Enhance prompt for character themes
                        enhanced_prompt = updated_lesson['activities']['image_prompt']
                        if is_character_theme and preserve_content:
                            enhanced_prompt = self._enhance_prompt_with_theme(updated_lesson['activities']['image_prompt'], theme_name)
                        
                        image_changes.append({
                            'section': 'activities',
                            'index': None,
                            'prompt': enhanced_prompt,
                            'style': image_style
                        })
                
                elif target == 'summary':
                    if 'summary' in updated_lesson and 'image_prompt' in updated_lesson['summary']:
                        # Enhance prompt for character themes
                        enhanced_prompt = updated_lesson['summary']['image_prompt']
                        if is_character_theme and preserve_content:
                            enhanced_prompt = self._enhance_prompt_with_theme(updated_lesson['summary']['image_prompt'], theme_name)
                        
                        image_changes.append({
                            'section': 'summary',
                            'index': None,
                            'prompt': enhanced_prompt,
                            'style': image_style
                        })
        
        return image_changes
    
    def _enhance_prompt_with_theme(self, original_prompt: str, theme_name: str) -> str:
        """Enhance an image prompt with a character theme while preserving the original content"""
        
        # Don't modify if already contains the theme
        if theme_name.lower() in original_prompt.lower():
            return original_prompt
        
        # For Batman theme
        if theme_name.lower() == 'batman':
            return f"{original_prompt}, in Batman style with dark gothic atmosphere, Batman-themed elements, dramatic lighting"  
        
        # For Spider-Man theme
        elif 'spider' in theme_name.lower():
            return f"{original_prompt}, in Spider-Man style with web patterns, red and blue color scheme, Spider-Man elements"  
        
        # For Superman theme
        elif theme_name.lower() == 'superman':
            return f"{original_prompt}, in Superman style with red and blue color scheme, heroic atmosphere, Superman elements"  
        
        # For Wonder Woman theme
        elif theme_name.lower() == 'wonder woman':
            return f"{original_prompt}, in Wonder Woman style with red, blue and gold color scheme, Amazonian elements"  
        
        # For Iron Man theme
        elif theme_name.lower() == 'iron man':
            return f"{original_prompt}, in Iron Man style with red and gold color scheme, high-tech elements, futuristic design"  
        
        # Generic superhero theme
        else:
            return f"{original_prompt}, in {theme_name} style"  
    
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
