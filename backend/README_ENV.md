# Environment Setup

## Setting up your API Key

1. **Get your Gemini API Key**
   - Visit: https://aistudio.google.com/app/apikey
   - Sign in with your Google account
   - Create a new API key

2. **Create the .env file**
   ```bash
   cd backend
   cp .env.example .env
   ```

3. **Add your API key**
   - Open the `.env` file
   - Replace `your_gemini_api_key_here` with your actual API key
   ```
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   ```

4. **Verify setup**
   ```bash
   python app.py
   ```
   
   You should see:
   ```
   Starting Lesson Generator API...
   Gemini API Key configured: Yes
   ```

## Security Notes

- The `.env` file is already in `.gitignore` and will not be committed to git
- Never share your API key publicly
- Never commit the `.env` file to version control
- Use `.env.example` as a template for others to set up their own keys
