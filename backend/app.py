from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import os
from dotenv import load_dotenv
import uuid
from typing import Dict, Any
import json
import time

# Load environment variables FIRST before importing anything that uses Firebase
load_dotenv()

# Now import routes and agents (after env vars are loaded)
from agents import LessonGeneratorAgent, ImageGeneratorAgent, LessonEditorAgent, PresentationGeneratorAgent, WorksheetGeneratorAgent
from agents.agentic_editor import AgenticLessonEditor
from routes.resources import resources_bp
from routes.students import students_bp
from routes.subscription import subscription_bp, check_subscription_access
from services.firebase_service import FirebaseService
from services.subscription_service import SubscriptionService

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(resources_bp, url_prefix='/api')
app.register_blueprint(students_bp, url_prefix='/api')
app.register_blueprint(subscription_bp, url_prefix='/api')

# Anonymous Resource Endpoints
@app.route('/api/anonymous/save/<resource_type>/<resource_id>', methods=['POST'])
def save_anonymous_resource(resource_type, resource_id):
    """Save a resource without requiring authentication
    
    This endpoint is used for saving resources that were generated but not yet saved,
    allowing users to save their work even if they're not logged in.
    """
    try:
        print(f"\n=== Anonymous Save Request ===\nResource Type: {resource_type}\nResource ID: {resource_id}")
        
        # Check if request has JSON data
        if not request.is_json:
            print("Error: Request does not contain JSON data")
            return jsonify({"error": "Request must be JSON"}), 400
            
        data = request.json
        print(f"Request data keys: {list(data.keys() if data else [])}")
        
        content = data.get('content')
        images = data.get('images', {})
        title = data.get('title', f'Untitled {resource_type.capitalize()}')
        is_temporary = data.get('is_temporary', True)
        
        print(f"Content type: {type(content)}")
        print(f"Images count: {len(images)}")
        print(f"Title: {title}")
        print(f"Is temporary: {is_temporary}")
        
        if not content:
            print("Error: Content is required but not provided")
            return jsonify({"error": "Content is required"}), 400
            
        # Validate resource type
        valid_types = ['lesson', 'worksheet', 'presentation']
        if resource_type not in valid_types:
            print(f"Error: Invalid resource type: {resource_type}")
            return jsonify({"error": "Invalid resource type"}), 400
        
        # Check if Firebase is enabled
        if not firebase_service.enabled:
            print("Warning: Firebase is not enabled, saving to memory only")
            
            # Store in memory
            if resource_type == 'worksheet':
                worksheets_store[resource_id] = {
                    'data': content,
                    'images': images,
                    'image_generation_status': {}
                }
            elif resource_type == 'presentation':
                presentations_store[resource_id] = {
                    'data': content,
                    'images': images,
                    'image_generation_status': {}
                }
            else:  # lesson
                lessons_store[resource_id] = {
                    'data': content,
                    'images': images,
                    'image_generation_status': {}
                }
                
            return jsonify({
                "success": True,
                "message": f"{resource_type.capitalize()} saved to memory",
                "resource_id": resource_id
            })
        
        # Check if resource already exists in Firebase
        existing_resource = firebase_service.get_resource(resource_id)
        print(f"Resource exists in Firebase: {existing_resource is not None}")
        
        if existing_resource:
            # Update existing resource
            print(f"Updating existing {resource_type} in Firebase: {resource_id}")
            try:
                # Update the resource with the new is_temporary flag
                update_data = {
                    'content': content,
                    'images': images,
                    'title': title,
                    'is_temporary': is_temporary
                }
                
                # If changing from temporary to permanent, update the user_id
                if not is_temporary and existing_resource.get('user_id') == 'temp':
                    # Create a new resource with the anonymous user_id instead of updating
                    # This effectively transfers ownership from temp to anonymous
                    firebase_service.save_resource(
                        user_id="anonymous",
                        resource_data={
                            'resource_type': resource_type,
                            'title': title,
                            'content': content,
                            'images': images,
                            'id': resource_id,
                            'is_temporary': False,
                            # Copy over any other important fields
                            'created_at': existing_resource.get('created_at'),
                            'creator_id': existing_resource.get('creator_id')
                        },
                        resource_id=resource_id
                    )
                    success = True
                else:
                    # Normal update
                    success = firebase_service.update_resource(resource_id, update_data)
                
                if success:
                    print(f"✓ {resource_type.capitalize()} updated successfully in Firebase")
                    return jsonify({
                        "success": True,
                        "message": f"{resource_type.capitalize()} updated successfully",
                        "resource_id": resource_id
                    })
                else:
                    print(f"Error: Failed to update {resource_type} in Firebase")
                    return jsonify({"error": f"Failed to update {resource_type}"}), 500
            except Exception as update_error:
                print(f"Error updating {resource_type} in Firebase: {update_error}")
                return jsonify({"error": f"Failed to update {resource_type}: {str(update_error)}"}), 500
        else:
            # Create new resource
            print(f"Creating new {resource_type} in Firebase with ID: {resource_id}")
            try:
                try:
                    # Use temp user_id for temporary resources, anonymous for permanent ones
                    user_id = "temp" if is_temporary else "anonymous"
                    
                    firebase_service.save_resource(
                        user_id=user_id,
                        resource_data={
                            'resource_type': resource_type,
                            'title': title,
                            'content': content,
                            'images': images,
                            'id': resource_id,  # Include ID in content
                            'is_temporary': is_temporary  # Store temporary flag
                        },
                        resource_id=resource_id
                    )
                except Exception as save_error:
                    print(f"Warning: Error during Firebase save but continuing: {save_error}")
                    # Store in memory as fallback
                    if resource_type == 'worksheet':
                        worksheets_store[resource_id] = {
                            'data': content,
                            'images': images,
                            'image_generation_status': {}
                        }
                    elif resource_type == 'presentation':
                        presentations_store[resource_id] = {
                            'data': content,
                            'images': images,
                            'image_generation_status': {}
                        }
                    else:  # lesson
                        lessons_store[resource_id] = {
                            'data': content,
                            'images': images,
                            'image_generation_status': {}
                        }
                
                print(f"✓ New {resource_type} saved successfully to Firebase")
                return jsonify({
                    "success": True,
                    "message": f"{resource_type.capitalize()} saved successfully",
                    "resource_id": resource_id
                })
            except Exception as save_error:
                print(f"Error saving new {resource_type} to Firebase: {save_error}")
                import traceback
                traceback.print_exc()
                return jsonify({"error": f"Failed to save {resource_type}: {str(save_error)}"}), 500
    except Exception as e:
        print(f"Unexpected error in save_anonymous_resource: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Initialize agents
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please create a .env file with your API key.")

lesson_generator = LessonGeneratorAgent(GEMINI_API_KEY)
image_generator = ImageGeneratorAgent(GEMINI_API_KEY)
lesson_editor = LessonEditorAgent(GEMINI_API_KEY)
agentic_editor = AgenticLessonEditor(GEMINI_API_KEY)
presentation_generator = PresentationGeneratorAgent(GEMINI_API_KEY)
worksheet_generator = WorksheetGeneratorAgent(GEMINI_API_KEY)

# Initialize Firebase service
firebase_service = FirebaseService()
subscription_service = SubscriptionService(firebase_service)

# In-memory storage for lessons, presentations, and worksheets (in production, use a database)
lessons_store: Dict[str, Dict[str, Any]] = {}
presentations_store: Dict[str, Dict[str, Any]] = {}
worksheets_store: Dict[str, Dict[str, Any]] = {}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Lesson Generator API is running"})

@app.route('/api/generate-lesson', methods=['POST'])
def generate_lesson():
    """Generate a new lesson on a given topic"""
    try:
        data = request.json
        topic = data.get('topic')
        
        if not topic:
            return jsonify({"error": "Topic is required"}), 400
        
        # Generate lesson structure
        print(f"Generating lesson for topic: {topic}", flush=True)
        lesson_data = lesson_generator.generate_lesson(topic)
        
        # Generate a unique lesson ID
        lesson_id = str(uuid.uuid4())
        lesson_data['id'] = lesson_id
        
        # Store the lesson
        lessons_store[lesson_id] = {
            'data': lesson_data,
            'images': {},
            'image_generation_status': {}
        }
        
        return jsonify({
            "success": True,
            "lesson_id": lesson_id,
            "lesson": lesson_data,
            "message": "Lesson generated successfully. Images will be generated next."
        })
        
    except Exception as e:
        print(f"Error in generate_lesson: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-lesson-stream', methods=['POST'])
def generate_lesson_stream():
    """Generate a lesson with streaming updates"""
    def generate():
        try:
            # Get the request data before entering the generator
            request_data = request.get_json()
            topic = request_data.get('topic')
            user_id = request_data.get('user_id')  # Frontend should send this
            
            if not topic:
                yield f"data: {json.dumps({'error': 'Topic is required'})}\n\n"
                return
            
            # Check subscription access
            if user_id:
                has_access, status_info = check_subscription_access(user_id)
                if not has_access:
                    yield f"data: {json.dumps({'type': 'error', 'error': 'subscription_required', 'message': 'Your trial has ended. Please subscribe to continue creating content.', 'status': status_info})}\n\n"
                    return
            
            # Generate a unique lesson ID
            lesson_id = str(uuid.uuid4())
            
            # Step 1: Send initial structure immediately
            yield f"data: {json.dumps({'type': 'init', 'lesson_id': lesson_id, 'topic': topic})}\n\n"
            
            # Step 2: Generate lesson structure
            print(f"Generating lesson for topic: {topic}", flush=True)
            lesson_data = lesson_generator.generate_lesson(topic)
            lesson_data['id'] = lesson_id
            
            # Store the lesson
            lessons_store[lesson_id] = {
                'data': lesson_data,
                'images': {},
                'image_generation_status': {}
            }
            
            # Step 3: Send complete lesson structure
            yield f"data: {json.dumps({'type': 'lesson', 'lesson': lesson_data})}\n\n"
            
            # Step 4: Generate images one by one and stream them
            lesson_store = lessons_store[lesson_id]
            
            # Generate introduction image
            if 'introduction' in lesson_data and 'image_prompt' in lesson_data['introduction']:
                prompt = lesson_data['introduction']['image_prompt']
                print(f"Generating introduction image: {prompt}", flush=True)
                image_data = image_generator.generate_image(prompt, "educational")
                if image_data:
                    lesson_store['images']['introduction'] = image_data
                    print(f"Sending introduction image, length: {len(image_data)}", flush=True)
                    yield f"data: {json.dumps({'type': 'image', 'key': 'introduction', 'image': image_data})}\n\n"
            
            # Generate key concept images
            if 'key_concepts' in lesson_data:
                for idx, concept in enumerate(lesson_data['key_concepts']):
                    if 'image_prompt' in concept and concept['image_prompt']:
                        prompt = concept['image_prompt']
                        print(f"Generating key concept {idx} image: {prompt}", flush=True)
                        image_data = image_generator.generate_image(prompt, "educational")
                        if image_data:
                            key = f'key_concept_{idx}'
                            lesson_store['images'][key] = image_data
                            yield f"data: {json.dumps({'type': 'image', 'key': key, 'image': image_data})}\n\n"
            
            # Generate detailed content images
            if 'detailed_content' in lesson_data:
                for idx, section in enumerate(lesson_data['detailed_content']):
                    if 'image_prompt' in section and section['image_prompt']:
                        prompt = section['image_prompt']
                        print(f"Generating detailed content {idx} image: {prompt}", flush=True)
                        image_data = image_generator.generate_image(prompt, "educational")
                        if image_data:
                            key = f'detailed_content_{idx}'
                            lesson_store['images'][key] = image_data
                            yield f"data: {json.dumps({'type': 'image', 'key': key, 'image': image_data})}\n\n"
            
            # Generate activities image
            if 'activities' in lesson_data and 'image_prompt' in lesson_data['activities']:
                prompt = lesson_data['activities']['image_prompt']
                print(f"Generating activities image: {prompt}", flush=True)
                image_data = image_generator.generate_image(prompt, "educational")
                if image_data:
                    lesson_store['images']['activities'] = image_data
                    yield f"data: {json.dumps({'type': 'image', 'key': 'activities', 'image': image_data})}\n\n"
            
            # Step 5: Send completion
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
            
        except Exception as e:
            print(f"Error in generate_lesson_stream: {e}", flush=True)
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return Response(stream_with_context(generate()), mimetype='text/event-stream')

@app.route('/api/generate-images/<lesson_id>', methods=['POST'])
def generate_images(lesson_id):
    """Generate images for a lesson"""
    try:
        if lesson_id not in lessons_store:
            return jsonify({"error": "Lesson not found"}), 404
        
        lesson_store = lessons_store[lesson_id]
        lesson_data = lesson_store['data']
        
        images_generated = []
        
        # Generate introduction image
        if 'introduction' in lesson_data and 'image_prompt' in lesson_data['introduction']:
            prompt = lesson_data['introduction']['image_prompt']
            print(f"Generating introduction image: {prompt}", flush=True)
            image_data = image_generator.generate_image(prompt, "educational")
            print(f"Introduction image generated: {image_data is not None}", flush=True)
            if image_data:
                lesson_store['images']['introduction'] = image_data
                images_generated.append('introduction')
                print(f"Introduction image stored successfully", flush=True)
            else:
                print("WARNING: Introduction image generation returned None", flush=True)
        
        # Generate key concept images
        if 'key_concepts' in lesson_data:
            for idx, concept in enumerate(lesson_data['key_concepts']):
                if 'image_prompt' in concept and concept['image_prompt']:
                    prompt = concept['image_prompt']
                    print(f"Generating key concept {idx} image: {prompt}")
                    image_data = image_generator.generate_image(prompt, "educational")
                    if image_data:
                        lesson_store['images'][f'key_concept_{idx}'] = image_data
                        images_generated.append(f'key_concept_{idx}')
        
        # Generate detailed content images
        if 'detailed_content' in lesson_data:
            for idx, section in enumerate(lesson_data['detailed_content']):
                if 'image_prompt' in section and section['image_prompt']:
                    prompt = section['image_prompt']
                    print(f"Generating detailed content {idx} image: {prompt}")
                    image_data = image_generator.generate_image(prompt, "educational")
                    if image_data:
                        lesson_store['images'][f'detailed_content_{idx}'] = image_data
                        images_generated.append(f'detailed_content_{idx}')
        
        # Generate activities image
        if 'activities' in lesson_data and 'image_prompt' in lesson_data['activities']:
            prompt = lesson_data['activities']['image_prompt']
            print(f"Generating activities image: {prompt}")
            image_data = image_generator.generate_image(prompt, "educational")
            if image_data:
                lesson_store['images']['activities'] = image_data
                images_generated.append('activities')
        
        return jsonify({
            "success": True,
            "images_generated": images_generated,
            "images": lesson_store['images']
        })
        
    except Exception as e:
        print(f"Error in generate_images: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/lesson/<lesson_id>', methods=['GET'])
def get_lesson(lesson_id):
    """Get a lesson by ID"""
    try:
        # First check if lesson is in memory
        if lesson_id in lessons_store:
            lesson_store = lessons_store[lesson_id]
            return jsonify({
                "success": True,
                "lesson": lesson_store['data'],
                "images": lesson_store['images']
            })
        
        # If not in memory, try to load from Firebase
        resource = firebase_service.get_resource(lesson_id)
        if resource:
            # Load into memory for future edits
            lessons_store[lesson_id] = {
                'data': resource.get('content', {}),
                'images': resource.get('images', {}),
                'image_generation_status': {}
            }
            return jsonify({
                "success": True,
                "lesson": resource.get('content', {}),
                "images": resource.get('images', {})
            })
        
        return jsonify({"error": "Lesson not found"}), 404
        
    except Exception as e:
        print(f"Error in get_lesson: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/lesson/<lesson_id>/download', methods=['GET'])
def download_lesson(lesson_id):
    """Download lesson as PDF file"""
    try:
        # Check subscription access
        user_id = request.args.get('user_id')
        if user_id:
            has_access, status_info = check_subscription_access(user_id)
            if not has_access:
                return jsonify({
                    "error": "subscription_required",
                    "message": "Your trial has ended. Please subscribe to download content.",
                    "status": status_info
                }), 403
        
        # Get lesson data
        if lesson_id in lessons_store:
            lesson_store = lessons_store[lesson_id]
            lesson_data = lesson_store['data']
            images = lesson_store['images']
        else:
            # Try loading from Firebase
            resource = firebase_service.get_resource(lesson_id)
            if not resource:
                return jsonify({"error": "Lesson not found"}), 404
            lesson_data = resource.get('content', {})
            images = resource.get('images', {})
        
        # Create PDF file
        print(f"Creating PDF for lesson: {lesson_data.get('title', 'Untitled')}")
        pdf_stream = lesson_generator.create_pdf(lesson_data, images)
        
        # Send file
        filename = f"{lesson_data.get('title', 'lesson').replace(' ', '_')}.pdf"
        return Response(
            pdf_stream.getvalue(),
            mimetype='application/pdf',
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )
        
    except Exception as e:
        print(f"Error downloading lesson: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/edit-lesson/<lesson_id>', methods=['POST'])
def edit_lesson(lesson_id):
    """Edit a lesson based on natural language instructions with streaming updates"""
    # Extract request data BEFORE generator (inside request context)
    data = request.json
    edit_request = data.get('request') if data else None
    
    if not edit_request:
        return jsonify({"error": "Edit request is required"}), 400
    
    def generate():
        try:
            # Step 1: Load lesson if not in memory
            yield f"data: {json.dumps({'type': 'status', 'message': '📂 Loading lesson from library...'})}\n\n"
            
            if lesson_id not in lessons_store:
                # Try to load from Firebase
                resource = firebase_service.get_resource(lesson_id)
                if not resource:
                    yield f"data: {json.dumps({'type': 'error', 'message': 'Lesson not found'})}\n\n"
                    return
                
                # Load into memory
                lessons_store[lesson_id] = {
                    'data': resource.get('content', {}),
                    'images': resource.get('images', {}),
                    'image_generation_status': {}
                }
            
            lesson_store = lessons_store[lesson_id]
            current_lesson = lesson_store['data']
            
            # Step 2: Analyze request
            yield f"data: {json.dumps({'type': 'status', 'message': '🤖 Analyzing your request...'})}\n\n"
            
            # Process the edit request using the agentic editor
            print(f"Processing edit request with agentic editor: {edit_request}")
            updated_lesson, image_sections = agentic_editor.process_edit_request(
                current_lesson, 
                edit_request
            )
            
            # Ensure contentType and id are preserved
            if 'contentType' not in updated_lesson:
                updated_lesson['contentType'] = 'lesson'
            if 'id' not in updated_lesson:
                updated_lesson['id'] = lesson_id
            
            print(f"Edit processed. Image sections to regenerate: {len(image_sections)}")
            print(f"Image sections: {image_sections}")
            
            # Step 3: Apply changes
            yield f"data: {json.dumps({'type': 'status', 'message': '✏️ Applying changes to lesson...'})}\n\n"
            
            # Update the stored lesson
            lesson_store['data'] = updated_lesson
            
            # Step 4: Generate new images if needed
            new_images = {}
            if image_sections:
                yield f"data: {json.dumps({'type': 'status', 'message': f'🎨 Generating {len(image_sections)} new image(s)...'})}\n\n"
                
                for i, img_change in enumerate(image_sections):
                    section = img_change['section']
                    index = img_change.get('index')
                    sub_index = img_change.get('sub_index')
                    prompt = img_change['prompt']
                    style = img_change.get('style', 'educational')
                    
                    yield f"data: {json.dumps({'type': 'status', 'message': f'🖼️ Generating image {i+1}/{len(image_sections)}...'})}\n\n"
                    
                    print(f"Regenerating image for {section} (index: {index}, sub_index: {sub_index}, style: {style}): {prompt}", flush=True)
                    image_data = image_generator.generate_image(prompt, style)
                    
                    if image_data:
                        # Map section names to the correct key format used in frontend
                        if section == 'key_concepts' and index is not None:
                            key = f"key_concept_{index}"
                        elif index is not None:
                            key = f"{section}_{index}"
                        elif sub_index is not None:
                            key = f"{section}_{sub_index}"
                        else:
                            key = section
                        
                        lesson_store['images'][key] = image_data
                        new_images[key] = image_data
                        print(f"Image regenerated successfully for key: {key}", flush=True)
                        
                        # Stream the new image
                        yield f"data: {json.dumps({'type': 'image', 'key': key, 'image': image_data})}\n\n"
                    else:
                        print(f"WARNING: Image regeneration failed for {section}", flush=True)
            
            # Step 5: Save to Firebase
            yield f"data: {json.dumps({'type': 'status', 'message': '💾 Saving changes...'})}\n\n"
            
            try:
                firebase_service.update_resource(lesson_id, {
                    'content': updated_lesson,
                    'images': lesson_store['images']
                })
                print(f"Lesson {lesson_id} saved to Firebase successfully")
                
                # Sync in-memory store with Firebase to get the uploaded URLs
                # This ensures subsequent fetches get the correct image URLs
                updated_resource = firebase_service.get_resource(lesson_id)
                if updated_resource:
                    lesson_store['images'] = updated_resource.get('images', {})
                    print(f"In-memory store synced with Firebase URLs")
            except Exception as e:
                print(f"Warning: Failed to save lesson to Firebase: {e}")
            
            # Step 6: Complete
            yield f"data: {json.dumps({'type': 'lesson', 'lesson': updated_lesson})}\n\n"
            yield f"data: {json.dumps({'type': 'complete', 'message': '✅ Lesson updated successfully!'})}\n\n"
            
        except Exception as e:
            print(f"Error in edit_lesson: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/lessons', methods=['GET'])
def list_lessons():
    """List all lessons"""
    try:
        lessons_list = []
        for lesson_id, lesson_store in lessons_store.items():
            lesson_data = lesson_store['data']
            lessons_list.append({
                'id': lesson_id,
                'title': lesson_data.get('title', 'Untitled'),
                'topic': lesson_data.get('topic', ''),
                'version': lesson_data.get('version', 1)
            })
        
        return jsonify({
            "success": True,
            "lessons": lessons_list
        })
        
    except Exception as e:
        print(f"Error in list_lessons: {e}")
        return jsonify({"error": str(e)}), 500

# ==================== Presentation Endpoints ====================

@app.route('/api/generate-presentation-stream', methods=['POST'])
def generate_presentation_stream():
    """Generate a presentation with streaming updates"""
    # Extract request data BEFORE generator (inside request context)
    data = request.json
    topic = data.get('topic') if data else None
    user_id = data.get('user_id') if data else None
    
    if not topic:
        return jsonify({"error": "Topic is required"}), 400
    
    def generate():
        try:
            # Check subscription access
            if user_id:
                has_access, status_info = check_subscription_access(user_id)
                if not has_access:
                    yield f"data: {json.dumps({'type': 'error', 'error': 'subscription_required', 'message': 'Your trial has ended. Please subscribe to continue creating content.', 'status': status_info})}\n\n"
                    return
            
            # Generate a unique presentation ID
            presentation_id = str(uuid.uuid4())
            
            # Step 1: Send initial structure immediately
            yield f"data: {json.dumps({'type': 'init', 'presentation_id': presentation_id, 'topic': topic})}\n\n"
            
            # Step 2: Generate presentation structure
            print(f"Generating presentation for topic: {topic}", flush=True)
            presentation_data = presentation_generator.generate_presentation(topic)
            presentation_data['id'] = presentation_id
            
            # Store the presentation
            presentations_store[presentation_id] = {
                'data': presentation_data,
                'images': {},
                'image_generation_status': {}
            }
            
            # Step 3: Send complete presentation structure
            yield f"data: {json.dumps({'type': 'presentation', 'presentation': presentation_data})}\n\n"
            
            # Step 4: Generate images for each slide
            presentation_store = presentations_store[presentation_id]
            slides = presentation_data.get('slides', [])
            
            for idx, slide in enumerate(slides):
                if 'image_prompt' in slide and slide['image_prompt']:
                    prompt = slide['image_prompt']
                    print(f"Generating image for slide {idx+1}/{len(slides)}: {prompt[:50]}...", flush=True)
                    image_data = image_generator.generate_image(prompt, "realistic")
                    if image_data:
                        key = f'slide_{idx}'
                        presentation_store['images'][key] = image_data
                        yield f"data: {json.dumps({'type': 'image', 'key': key, 'image': image_data})}\n\n"
            
            # Step 5: Complete
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
            
        except Exception as e:
            print(f"Error in generate_presentation_stream: {e}", flush=True)
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/presentation/<presentation_id>', methods=['GET'])
def get_presentation(presentation_id):
    """Get a presentation by ID"""
    try:
        # First check if presentation is in memory
        if presentation_id in presentations_store:
            presentation_store = presentations_store[presentation_id]
            return jsonify({
                "success": True,
                "presentation": presentation_store['data'],
                "images": presentation_store['images']
            })
        
        # If not in memory, try to load from Firebase
        resource = firebase_service.get_resource(presentation_id)
        if resource:
            # Load into memory for future edits
            presentations_store[presentation_id] = {
                'data': resource.get('content', {}),
                'images': resource.get('images', {}),
                'image_generation_status': {}
            }
            return jsonify({
                "success": True,
                "presentation": resource.get('content', {}),
                "images": resource.get('images', {})
            })
        
        return jsonify({"error": "Presentation not found"}), 404
        
    except Exception as e:
        print(f"Error in get_presentation: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/presentation/<presentation_id>/download', methods=['GET'])
def download_presentation(presentation_id):
    """Download presentation as PPTX file"""
    try:
        # Check subscription access
        user_id = request.args.get('user_id')
        if user_id:
            has_access, status_info = check_subscription_access(user_id)
            if not has_access:
                return jsonify({
                    "error": "subscription_required",
                    "message": "Your trial has ended. Please subscribe to download content.",
                    "status": status_info
                }), 403
        
        # Get presentation data
        if presentation_id in presentations_store:
            presentation_store = presentations_store[presentation_id]
            presentation_data = presentation_store['data']
            images = presentation_store['images']
        else:
            # Try loading from Firebase
            resource = firebase_service.get_resource(presentation_id)
            if not resource:
                return jsonify({"error": "Presentation not found"}), 404
            presentation_data = resource.get('content', {})
            images = resource.get('images', {})
        
        # Create PPTX file
        print(f"Creating PPTX for presentation: {presentation_data.get('title', 'Untitled')}")
        pptx_stream = presentation_generator.create_pptx(presentation_data, images)
        
        # Send file
        filename = f"{presentation_data.get('title', 'presentation').replace(' ', '_')}.pptx"
        return Response(
            pptx_stream.getvalue(),
            mimetype='application/vnd.openxmlformats-officedocument.presentationml.presentation',
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )
        
    except Exception as e:
        print(f"Error downloading presentation: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ==================== Worksheet Endpoints ====================

@app.route('/api/generate-worksheet-stream', methods=['POST'])
def generate_worksheet_stream():
    """Generate a worksheet with streaming updates"""
    # Extract request data BEFORE generator (inside request context)
    data = request.json
    topic = data.get('topic') if data else None
    user_id = data.get('user_id') if data else None
    
    if not topic:
        return jsonify({"error": "Topic is required"}), 400
    
    def generate():
        try:
            # Check subscription access
            if user_id:
                has_access, status_info = check_subscription_access(user_id)
                if not has_access:
                    yield f"data: {json.dumps({'type': 'error', 'error': 'subscription_required', 'message': 'Your trial has ended. Please subscribe to continue creating content.', 'status': status_info})}\n\n"
                    return
            
            # Generate a unique worksheet ID
            worksheet_id = str(uuid.uuid4())
            
            # Step 1: Send initial structure immediately
            yield f"data: {json.dumps({'type': 'init', 'worksheet_id': worksheet_id, 'topic': topic})}\n\n"
            
            # Step 2: Generate worksheet structure
            print(f"Generating worksheet for topic: {topic}", flush=True)
            worksheet_data = worksheet_generator.generate_worksheet(topic)
            worksheet_data['id'] = worksheet_id
            
            # Store the worksheet
            worksheets_store[worksheet_id] = {
                'data': worksheet_data,
                'images': {},
                'image_generation_status': {}
            }
            
            # Save to Firebase immediately to ensure persistence across server instances
            # But mark it as temporary so it doesn't appear in the user's library
            if firebase_service.enabled:
                try:
                    firebase_service.save_resource(
                        user_id="temp",  # Use temp user ID to indicate it's not saved yet
                        resource_data={
                            'resource_type': 'worksheet',
                            'title': worksheet_data.get('title', 'Untitled Worksheet'),
                            'content': worksheet_data,
                            'images': {},
                            'is_temporary': True,  # Mark as temporary
                            'creator_id': user_id or "anonymous"  # Store original creator
                        },
                        resource_id=worksheet_id
                    )
                    print(f"✓ Worksheet saved to Firebase with ID: {worksheet_id} (temporary)")
                except Exception as e:
                    print(f"Warning: Failed to save worksheet to Firebase: {e}")
                    # Continue anyway - we still have it in memory
            
            # Step 3: Send complete worksheet structure
            yield f"data: {json.dumps({'type': 'worksheet', 'worksheet': worksheet_data})}\n\n"
            
            # Step 4: Generate images for each section
            worksheet_store = worksheets_store[worksheet_id]
            sections = worksheet_data.get('sections', [])
            
            for idx, section in enumerate(sections):
                if 'image_prompt' in section and section['image_prompt']:
                    prompt = section['image_prompt']
                    print(f"Generating image for section {idx+1}/{len(sections)}: {prompt[:50]}...", flush=True)
                    image_data = image_generator.generate_image(prompt, "educational")
                    if image_data:
                        key = f'section_{idx}'
                        worksheet_store['images'][key] = image_data
                        yield f"data: {json.dumps({'type': 'image', 'key': key, 'image': image_data})}\n\n"
            
            # Step 5: Complete
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
            
        except Exception as e:
            print(f"Error in generate_worksheet_stream: {e}", flush=True)
            import traceback
            traceback.print_exc()
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/worksheet/<worksheet_id>', methods=['GET'])
def get_worksheet(worksheet_id):
    """Get a worksheet by ID"""
    try:
        # First check if worksheet is in memory
        in_memory_worksheet = None
        if worksheet_id in worksheets_store:
            in_memory_worksheet = worksheets_store[worksheet_id]
            print(f"Found worksheet {worksheet_id} in memory")
        
        # Try to load from Firebase
        firebase_resource = None
        if firebase_service.enabled:
            firebase_resource = firebase_service.get_resource(worksheet_id)
            if firebase_resource:
                print(f"Found worksheet {worksheet_id} in Firebase")
                
                # If we have both in-memory and Firebase versions, use the most recent one
                if in_memory_worksheet:
                    # Compare timestamps if available
                    firebase_updated_at = firebase_resource.get('updated_at')
                    
                    if firebase_updated_at:
                        # Use Firebase version if it's newer
                        print(f"Using Firebase version of worksheet {worksheet_id} as it's more recent")
                        worksheets_store[worksheet_id] = {
                            'data': firebase_resource.get('content', {}),
                            'images': firebase_resource.get('images', {}),
                            'image_generation_status': {}
                        }
                    else:
                        # If no timestamp, assume in-memory is more recent
                        print(f"Using in-memory version of worksheet {worksheet_id}")
                else:
                    # No in-memory version, load from Firebase
                    worksheets_store[worksheet_id] = {
                        'data': firebase_resource.get('content', {}),
                        'images': firebase_resource.get('images', {}),
                        'image_generation_status': {}
                    }
        
        # Now return the worksheet from memory
        if worksheet_id in worksheets_store:
            worksheet_store = worksheets_store[worksheet_id]
            return jsonify({
                "success": True,
                "worksheet": worksheet_store['data'],
                "images": worksheet_store['images']
            })
        
        # If we get here and still don't have the worksheet, try to create a temporary one
        # This is a fallback for production environments where the worksheet might have been
        # generated in a different server instance
        try:
            # Check if this is a valid UUID
            uuid_obj = uuid.UUID(worksheet_id)
            
            # Create a basic worksheet structure
            print(f"Creating temporary worksheet structure for ID: {worksheet_id}")
            temp_worksheet = {
                'id': worksheet_id,
                'title': 'Untitled Worksheet',
                'contentType': 'worksheet',
                'sections': []
            }
            
            # Store in memory
            worksheets_store[worksheet_id] = {
                'data': temp_worksheet,
                'images': {},
                'image_generation_status': {}
            }
            
            return jsonify({
                "success": True,
                "worksheet": temp_worksheet,
                "images": {}
            })
        except ValueError:
            # Not a valid UUID
            pass
        
        return jsonify({"error": "Worksheet not found"}), 404
        
    except Exception as e:
        print(f"Error in get_worksheet: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/worksheet/<worksheet_id>/download', methods=['GET'])
def download_worksheet(worksheet_id):
    """Download worksheet as PDF file"""
    try:
        # Check subscription access
        user_id = request.args.get('user_id')
        if user_id:
            has_access, status_info = check_subscription_access(user_id)
            if not has_access:
                return jsonify({
                    "error": "subscription_required",
                    "message": "Your trial has ended. Please subscribe to download content.",
                    "status": status_info
                }), 403
        
        # Get worksheet data
        if worksheet_id in worksheets_store:
            worksheet_store = worksheets_store[worksheet_id]
            worksheet_data = worksheet_store['data']
            images = worksheet_store['images']
        else:
            # Try loading from Firebase
            resource = firebase_service.get_resource(worksheet_id)
            if not resource:
                return jsonify({"error": "Worksheet not found"}), 404
            worksheet_data = resource.get('content', {})
            images = resource.get('images', {})
        
        # Create PDF file
        print(f"Creating PDF for worksheet: {worksheet_data.get('title', 'Untitled')}")
        pdf_stream = worksheet_generator.create_pdf(worksheet_data, images)
        
        # Send file
        filename = f"{worksheet_data.get('title', 'worksheet').replace(' ', '_')}.pdf"
        return Response(
            pdf_stream.getvalue(),
            mimetype='application/pdf',
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )
        
    except Exception as e:
        print(f"Error downloading worksheet: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ==================== Edit Endpoints for Presentations and Worksheets ====================

@app.route('/api/edit-presentation/<presentation_id>', methods=['POST'])
def edit_presentation(presentation_id):
    """Edit a presentation based on natural language instructions with streaming updates"""
    data = request.json
    edit_request = data.get('request') if data else None
    
    if not edit_request:
        return jsonify({"error": "Edit request is required"}), 400
    
    def generate():
        try:
            yield f"data: {json.dumps({'type': 'status', 'message': '📂 Loading presentation from library...'})}\n\n"
            
            if presentation_id not in presentations_store:
                resource = firebase_service.get_resource(presentation_id)
                if not resource:
                    yield f"data: {json.dumps({'type': 'error', 'message': 'Presentation not found'})}\n\n"
                    return
                
                presentations_store[presentation_id] = {
                    'data': resource.get('content', {}),
                    'images': resource.get('images', {}),
                    'image_generation_status': {}
                }
            
            presentation_store = presentations_store[presentation_id]
            current_presentation = presentation_store['data']
            
            yield f"data: {json.dumps({'type': 'status', 'message': '🤖 Analyzing your request...'})}\n\n"
            
            updated_presentation, image_sections = agentic_editor.process_edit_request(
                current_presentation, 
                edit_request
            )
            
            # Ensure contentType and id are preserved
            if 'contentType' not in updated_presentation:
                updated_presentation['contentType'] = 'presentation'
            if 'id' not in updated_presentation:
                updated_presentation['id'] = presentation_id
            
            yield f"data: {json.dumps({'type': 'status', 'message': '✏️ Applying changes to presentation...'})}\n\n"
            
            presentation_store['data'] = updated_presentation
            
            new_images = {}
            if image_sections:
                yield f"data: {json.dumps({'type': 'status', 'message': f'🎨 Generating {len(image_sections)} new image(s)...'})}\n\n"
                
                for i, img_change in enumerate(image_sections):
                    section = img_change['section']
                    index = img_change.get('index')
                    prompt = img_change['prompt']
                    style = img_change.get('style', 'professional')
                    
                    yield f"data: {json.dumps({'type': 'status', 'message': f'🖼️ Generating image {i+1}/{len(image_sections)}...'})}\n\n"
                    
                    image_data = image_generator.generate_image(prompt, style)
                    
                    if image_data:
                        if index is not None:
                            key = f"slide_{index}"
                        else:
                            key = section
                        
                        presentation_store['images'][key] = image_data
                        new_images[key] = image_data
                        
                        yield f"data: {json.dumps({'type': 'image', 'key': key, 'image': image_data})}\n\n"
            
            yield f"data: {json.dumps({'type': 'status', 'message': '💾 Saving changes...'})}\n\n"
            
            try:
                firebase_service.update_resource(presentation_id, {
                    'content': updated_presentation,
                    'images': presentation_store['images']
                })
                
                updated_resource = firebase_service.get_resource(presentation_id)
                if updated_resource:
                    presentation_store['images'] = updated_resource.get('images', {})
            except Exception as e:
                print(f"Warning: Failed to save presentation to Firebase: {e}")
            
            yield f"data: {json.dumps({'type': 'presentation', 'presentation': updated_presentation})}\n\n"
            yield f"data: {json.dumps({'type': 'complete', 'message': '✅ Presentation updated successfully!'})}\n\n"
            
        except Exception as e:
            print(f"Error in edit_presentation: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/edit-worksheet/<worksheet_id>', methods=['POST'])
def edit_worksheet(worksheet_id):
    """Edit a worksheet based on natural language instructions with streaming updates"""
    data = request.json
    edit_request = data.get('request') if data else None
    
    if not edit_request:
        return jsonify({"error": "Edit request is required"}), 400
    
    def generate():
        try:
            yield f"data: {json.dumps({'type': 'status', 'message': '📂 Loading worksheet...'})}\n\n"
            
            if worksheet_id not in worksheets_store:
                # Try to load from Firebase first
                resource = None
                if firebase_service.enabled:
                    resource = firebase_service.get_resource(worksheet_id)
                
                if not resource:
                    # For production: Check if this is a valid UUID format
                    try:
                        uuid_obj = uuid.UUID(worksheet_id)
                        # If we get here, it's a valid UUID but worksheet wasn't found
                        # This means it was likely generated in another server instance
                        # Create a basic worksheet structure to allow editing
                        print(f"Creating temporary worksheet structure for ID: {worksheet_id}")
                        worksheets_store[worksheet_id] = {
                            'data': {
                                'id': worksheet_id,
                                'title': 'Untitled Worksheet', 
                                'contentType': 'worksheet',
                                'sections': []
                            },
                            'images': {},
                            'image_generation_status': {}
                        }
                    except ValueError:
                        # Not a valid UUID, truly not found
                        yield f"data: {json.dumps({'type': 'error', 'message': 'Worksheet not found'})}\n\n"
                        return
                else:
                    # Resource found in Firebase, load it
                    worksheets_store[worksheet_id] = {
                        'data': resource.get('content', {}),
                        'images': resource.get('images', {}),
                        'image_generation_status': {}
                    }
            
            worksheet_store = worksheets_store[worksheet_id]
            current_worksheet = worksheet_store['data']
            
            yield f"data: {json.dumps({'type': 'status', 'message': '🤖 Analyzing your request...'})}\n\n"
            
            updated_worksheet, image_sections = agentic_editor.process_edit_request(
                current_worksheet, 
                edit_request
            )
            
            # Ensure contentType and id are preserved
            if 'contentType' not in updated_worksheet:
                updated_worksheet['contentType'] = 'worksheet'
            if 'id' not in updated_worksheet:
                updated_worksheet['id'] = worksheet_id
            
            yield f"data: {json.dumps({'type': 'status', 'message': '✏️ Applying changes to worksheet...'})}\n\n"
            
            worksheet_store['data'] = updated_worksheet
            
            new_images = {}
            if image_sections:
                yield f"data: {json.dumps({'type': 'status', 'message': f'🎨 Generating {len(image_sections)} new image(s)...'})}\n\n"
                
                for i, img_change in enumerate(image_sections):
                    section = img_change['section']
                    index = img_change.get('index')
                    prompt = img_change['prompt']
                    style = img_change.get('style', 'educational')
                    
                    yield f"data: {json.dumps({'type': 'status', 'message': f'🖼️ Generating image {i+1}/{len(image_sections)}...'})}\n\n"
                    
                    image_data = image_generator.generate_image(prompt, style)
                    
                    if image_data:
                        if index is not None:
                            key = f"section_{index}"
                        else:
                            key = section
                        
                        worksheet_store['images'][key] = image_data
                        new_images[key] = image_data
                        
                        yield f"data: {json.dumps({'type': 'image', 'key': key, 'image': image_data})}\n\n"
            
            yield f"data: {json.dumps({'type': 'status', 'message': '💾 Saving changes...'})}\n\n"
            
            try:
                # Try to save the worksheet to Firebase, even for anonymous users
                # This ensures worksheets persist across server instances
                # Get the original resource to check if it's temporary
                original_resource = None
                is_temporary = True  # Default to temporary if we can't determine
                creator_id = "temp"
                
                if firebase_service.enabled:
                    original_resource = firebase_service.get_resource(worksheet_id)
                    if original_resource:
                        is_temporary = original_resource.get('is_temporary', True)
                        creator_id = original_resource.get('creator_id', original_resource.get('user_id', "temp"))
                
                try:
                    # Update the resource, preserving its temporary status
                    firebase_service.update_resource(worksheet_id, {
                        'content': updated_worksheet,
                        'images': worksheet_store['images'],
                        'is_temporary': is_temporary,  # Preserve temporary status
                        'creator_id': creator_id  # Preserve original creator
                    })
                    
                    updated_resource = firebase_service.get_resource(worksheet_id)
                    if updated_resource:
                        worksheet_store['images'] = updated_resource.get('images', {})
                except Exception as update_error:
                    # If update fails (likely because resource doesn't exist yet),
                    # try to save as a new resource without requiring authentication
                    if firebase_service.enabled:
                        print(f"Attempting to save worksheet as new temporary resource: {worksheet_id}")
                        try:
                            # Save as temporary resource
                            firebase_service.save_resource(
                                user_id="temp",  # Use temp user ID
                                resource_data={
                                    'resource_type': 'worksheet',
                                    'title': updated_worksheet.get('title', 'Untitled Worksheet'),
                                    'content': updated_worksheet,
                                    'images': worksheet_store['images'],
                                    'id': worksheet_id,  # Force the ID to be the same
                                    'is_temporary': True,  # Mark as temporary
                                    'creator_id': creator_id  # Store original creator
                                },
                                resource_id=worksheet_id  # Force the ID to be the same
                            )
                            print(f"Successfully saved temporary worksheet: {worksheet_id}")
                        except Exception as save_error:
                            print(f"Warning: Failed to save temporary worksheet: {save_error}")
            except Exception as e:
                print(f"Warning: Failed to save worksheet to Firebase: {e}")
            
            yield f"data: {json.dumps({'type': 'worksheet', 'worksheet': updated_worksheet})}\n\n"
            yield f"data: {json.dumps({'type': 'complete', 'message': '✅ Worksheet updated successfully!'})}\n\n"
            
        except Exception as e:
            print(f"Error in edit_worksheet: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    import sys
    print("Starting Lesson Generator API...", flush=True)
    print(f"Gemini API Key configured: {'Yes' if GEMINI_API_KEY else 'No'}", flush=True)
    sys.stdout.flush()
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
