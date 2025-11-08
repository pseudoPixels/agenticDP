from google import genai
import base64
import io
from PIL import Image
from typing import Optional

class ImageGeneratorAgent:
    """Agent responsible for generating images using Imagen (Nano Banana)"""
    
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-2.5-flash-image'
        
    def generate_image(self, prompt: str, style: str = "educational") -> Optional[str]:
        """
        Generate an image based on the prompt
        Returns base64 encoded image string
        """
        try:
            # Enhance prompt based on style
            enhanced_prompt = self._enhance_prompt(prompt, style)
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[enhanced_prompt]
            )
            
            # Extract image from response
            for part in response.parts:
                if part.inline_data is not None:
                    # Get the raw image data
                    image_bytes = part.inline_data.data
                    
                    # Convert to base64
                    base64_image = base64.b64encode(image_bytes).decode('utf-8')
                    return f"data:image/png;base64,{base64_image}"
            
            return None
            
        except Exception as e:
            print(f"Error generating image: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _enhance_prompt(self, prompt: str, style: str) -> str:
        """Enhance the prompt based on the desired style"""
        style_prefixes = {
            "educational": "Professional educational illustration, clean and modern design, ",
            "cartoon": "Colorful cartoon style illustration, friendly and engaging, ",
            "realistic": "Photorealistic image, high quality, professional, ",
            "minimalist": "Minimalist design, simple and clean, modern aesthetic, ",
            "diagram": "Clear educational diagram, well-labeled, professional design, "
        }
        
        prefix = style_prefixes.get(style, style_prefixes["educational"])
        return prefix + prompt + ", high quality, suitable for educational content"
