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
from agents import LessonGeneratorAgent, ImageGeneratorAgent, LessonEditorAgent
from agents.agentic_editor import AgenticLessonEditor
from routes.resources import resources_bp
from routes.students import students_bp
from services.firebase_service import FirebaseService

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(resources_bp, url_prefix='/api')
app.register_blueprint(students_bp, url_prefix='/api')

# Initialize agents
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please create a .env file with your API key.")

lesson_generator = LessonGeneratorAgent(GEMINI_API_KEY)
image_generator = ImageGeneratorAgent(GEMINI_API_KEY)
lesson_editor = LessonEditorAgent(GEMINI_API_KEY)
agentic_editor = AgenticLessonEditor(GEMINI_API_KEY)

# Initialize Firebase service
firebase_service = FirebaseService()

# In-memory storage for lessons (in production, use a database)
lessons_store: Dict[str, Dict[str, Any]] = {}

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
            
            if not topic:
                yield f"data: {json.dumps({'error': 'Topic is required'})}\n\n"
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
        if lesson_id not in lessons_store:
            return jsonify({"error": "Lesson not found"}), 404
        
        lesson_store = lessons_store[lesson_id]
        
        return jsonify({
            "success": True,
            "lesson": lesson_store['data'],
            "images": lesson_store['images']
        })
        
    except Exception as e:
        print(f"Error in get_lesson: {e}")
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

if __name__ == '__main__':
    import sys
    print("Starting Lesson Generator API...", flush=True)
    print(f"Gemini API Key configured: {'Yes' if GEMINI_API_KEY else 'No'}", flush=True)
    sys.stdout.flush()
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
