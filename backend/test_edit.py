#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')

from agents import LessonEditorAgent
import os
from dotenv import load_dotenv
import json

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"Testing lesson editing...")

agent = LessonEditorAgent(api_key)

# Sample lesson
lesson = {
    "title": "Photosynthesis",
    "subtitle": "How plants make food",
    "introduction": {
        "text": "Photosynthesis is a very long and detailed process that occurs in plants. It is extremely important for life on Earth. Plants use sunlight to convert carbon dioxide and water into glucose and oxygen.",
        "image_prompt": "Educational illustration of photosynthesis process"
    },
    "key_concepts": [
        {
            "title": "Light Reactions",
            "description": "The first stage of photosynthesis",
            "image_prompt": "Diagram of light reactions in chloroplast"
        }
    ],
    "activities": {
        "title": "Practice Activities",
        "items": [],
        "image_prompt": "Students doing science experiments"
    }
}

# Test 1: Make introduction shorter
print("\n=== Test 1: Make introduction shorter ===")
updated, images = agent.process_edit_request(lesson, "Make the introduction shorter")
print(f"Original intro length: {len(lesson['introduction']['text'])}")
print(f"Updated intro length: {len(updated['introduction']['text'])}")
print(f"Images to regenerate: {len(images)}")

# Test 2: Change image style
print("\n=== Test 2: Change introduction image to cartoon ===")
updated, images = agent.process_edit_request(lesson, "Make the introduction image cartoon style")
print(f"Images to regenerate: {len(images)}")
if images:
    print(f"Image section: {images[0]['section']}")
    print(f"Image style: {images[0]['style']}")

# Test 3: Translate to Bangla
print("\n=== Test 3: Translate to Bangla ===")
updated, images = agent.process_edit_request(lesson, "Re-write the article in Bangla")
print(f"Updated title: {updated.get('title', 'N/A')}")
print(f"Title contains Bangla: {'য' in updated.get('title', '') or 'া' in updated.get('title', '')}")

print("\n=== All tests complete ===")
