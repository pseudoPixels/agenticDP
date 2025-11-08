import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

print("Testing full lesson generation flow...")
print("=" * 60)

# Step 1: Generate lesson
print("\n1. Generating lesson...")
response = requests.post(f"{BASE_URL}/generate-lesson", json={"topic": "Photosynthesis"})
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    lesson_id = data.get('lesson_id')
    print(f"Lesson ID: {lesson_id}")
    print(f"Title: {data['lesson']['title']}")
    
    # Step 2: Generate images
    print("\n2. Generating images...")
    print("This may take 60-90 seconds...")
    response = requests.post(f"{BASE_URL}/generate-images/{lesson_id}")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Images generated: {data.get('images_generated', [])}")
        print(f"Number of images: {len(data.get('images', {}))}")
        
        # Check if images have data
        for key, value in data.get('images', {}).items():
            if value:
                print(f"  - {key}: {len(value)} bytes")
            else:
                print(f"  - {key}: EMPTY!")
    else:
        print(f"Error: {response.text}")
    
    # Step 3: Test edit
    print("\n3. Testing edit...")
    response = requests.post(
        f"{BASE_URL}/edit-lesson/{lesson_id}",
        json={"request": "Make the introduction shorter"}
    )
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Edit successful: {data.get('success')}")
        print(f"Message: {data.get('message')}")
    else:
        print(f"Error: {response.text}")
else:
    print(f"Error: {response.text}")

print("\n" + "=" * 60)
print("Test complete!")
