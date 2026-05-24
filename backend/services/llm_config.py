import os

# LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")
# GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
# GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
