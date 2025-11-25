#!/usr/bin/env python3
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
client = genai.Client(api_key=api_key)

# Test text generation
print("Testing text generation...")
response = client.models.generate_content(
    model='gemini-2.5-flash-lite',
    contents=['Say hello']
)

print(f"Response type: {type(response)}")
print(f"Response dir: {[attr for attr in dir(response) if not attr.startswith('_')]}")
print(f"\nResponse attributes:")
for attr in ['text', 'parts', 'candidates', 'content']:
    if hasattr(response, attr):
        val = getattr(response, attr)
        print(f"  {attr}: {type(val)} = {val if attr == 'text' else '...'}")

# Test image generation
print("\n\nTesting image generation...")
response2 = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents=['A simple red circle']
)

print(f"Response type: {type(response2)}")
print(f"Response dir: {[attr for attr in dir(response2) if not attr.startswith('_')]}")
print(f"\nResponse attributes:")
for attr in ['text', 'parts', 'candidates', 'content']:
    if hasattr(response2, attr):
        val = getattr(response2, attr)
        print(f"  {attr}: {type(val)}")
