from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key: {api_key[:20]}...")

client = genai.Client(api_key=api_key)

prompt = "Create a simple educational illustration of a plant cell with chloroplasts"

print(f"Generating image with prompt: {prompt}")

try:
    response = client.models.generate_content(
        model='gemini-2.5-flash-image',
        contents=[prompt]
    )
    
    print(f"Response received")
    print(f"Response parts: {len(response.parts)}")
    
    for i, part in enumerate(response.parts):
        print(f"Part {i}: text={part.text is not None}, inline_data={part.inline_data is not None}")
        if part.text is not None:
            print(f"  Text: {part.text[:100]}")
        if part.inline_data is not None:
            print(f"  Image data found!")
            image = part.as_image()
            image.save("test_output.png")
            print(f"  Image saved to test_output.png")
            
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
