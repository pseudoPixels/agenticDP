from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import os
from dotenv import load_dotenv
from agents import LessonGeneratorAgent, ImageGeneratorAgent, LessonEditorAgent
import uuid
from typing import Dict, Any
import json
import time

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize agents
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please create a .env file with your API key.")

lesson_generator = LessonGeneratorAgent(GEMINI_API_KEY)
image_generator = ImageGeneratorAgent(GEMINI_API_KEY)
lesson_editor = LessonEditorAgent(GEMINI_API_KEY)

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
    """Edit a lesson based on natural language instructions"""
    try:
        if lesson_id not in lessons_store:
            return jsonify({"error": "Lesson not found"}), 404
        
        data = request.json
        edit_request = data.get('request')
        
        if not edit_request:
            return jsonify({"error": "Edit request is required"}), 400
        
        lesson_store = lessons_store[lesson_id]
        current_lesson = lesson_store['data']
        
        # Process the edit request
        print(f"Processing edit request: {edit_request}")
        updated_lesson, image_sections = lesson_editor.process_edit_request(
            current_lesson, 
            edit_request
        )
        
        print(f"Edit processed. Image sections to regenerate: {len(image_sections)}")
        print(f"Image sections: {image_sections}")
        
        # Update the stored lesson
        lesson_store['data'] = updated_lesson
        
        # Generate new images if needed
        new_images = {}
        for img_change in image_sections:
            section = img_change['section']
            index = img_change.get('index')
            prompt = img_change['prompt']
            style = img_change.get('style', 'educational')
            
            print(f"Regenerating image for {section} (style: {style}): {prompt}", flush=True)
            image_data = image_generator.generate_image(prompt, style)
            
            if image_data:
                if index is not None:
                    key = f"{section}_{index}"
                else:
                    key = section
                lesson_store['images'][key] = image_data
                new_images[key] = image_data
                print(f"Image regenerated successfully for {key}", flush=True)
            else:
                print(f"WARNING: Image regeneration failed for {section}", flush=True)
        
        return jsonify({
            "success": True,
            "lesson": updated_lesson,
            "images": lesson_store['images'],
            "new_images": new_images,
            "message": "Lesson updated successfully"
        })
        
    except Exception as e:
        print(f"Error in edit_lesson: {e}")
        return jsonify({"error": str(e)}), 500

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
