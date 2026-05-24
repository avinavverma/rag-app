import google.generativeai as genai
from services.llm_config import GOOGLE_API_KEY, GEMINI_MODEL

def stream_answer(prompt: str, system_instruction: str):
    """
    Sync generator — yields text chunks from Gemini streaming API.
  """
    if not GOOGLE_API_KEY:
        raise RuntimeError("Gemini generation failed: GOOGLE_API_KEY is not set")

    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel(
            GEMINI_MODEL,
            system_instruction=system_instruction,
        )
        response = model.generate_content(prompt, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        raise RuntimeError(f"Gemini generation failed: {e}") from e