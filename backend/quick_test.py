#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')

from agents import ImageGeneratorAgent
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"Testing image generation...")
print(f"API Key: {api_key[:20]}...")

agent = ImageGeneratorAgent(api_key)

prompt = "Educational illustration of a plant cell"
print(f"\nGenerating image with prompt: {prompt}")

result = agent.generate_image(prompt, "educational")

if result:
    print(f"SUCCESS! Image generated: {len(result)} characters")
    print(f"Starts with: {result[:50]}")
else:
    print(f"FAILED! No image generated")
