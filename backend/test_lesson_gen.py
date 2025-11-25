#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')

from agents import LessonGeneratorAgent
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"Testing lesson generation...")

agent = LessonGeneratorAgent(api_key)

lesson = agent.generate_lesson("Photosynthesis")

print(f"Title: {lesson.get('title', 'N/A')}")
print(f"Subtitle: {lesson.get('subtitle', 'N/A')}")
print(f"Has introduction: {'introduction' in lesson}")
print(f"Number of key concepts: {len(lesson.get('key_concepts', []))}")
print(f"SUCCESS!")
