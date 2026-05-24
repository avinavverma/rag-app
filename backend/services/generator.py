# import google.generativeai as genai
# from services.llm_config import GOOGLE_API_KEY, GEMINI_MODEL

# def stream_answer(prompt: str, system_instruction: str):
#     """
#     Sync generator — yields text chunks from Gemini streaming API.
#   """
#     if not GOOGLE_API_KEY:
#         raise RuntimeError("Gemini generation failed: GOOGLE_API_KEY is not set")

#     try:
#         genai.configure(api_key=GOOGLE_API_KEY)
#         model = genai.GenerativeModel(
#             GEMINI_MODEL,
#             system_instruction=system_instruction,
#         )
#         response = model.generate_content(prompt, stream=True)
#         for chunk in response:
#             if chunk.text:
#                 yield chunk.text
#     except Exception as e:
#         raise RuntimeError(f"Gemini generation failed: {e}") from e

import os
from typing import Iterator

from openai import OpenAI

from services.llm_config import GROQ_API_KEY, GROQ_MODEL

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=GROQ_API_KEY,
)

def stream_answer(prompt: str, system_instruction: str) -> Iterator[str]:
    try:
        stream = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": system_instruction,
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            stream=True,
            temperature=0.2,
        )

        for chunk in stream:
            delta = chunk.choices[0].delta.content

            if delta:
                yield delta

    except Exception as e:
        raise RuntimeError(f"Groq generation failed: {e}")
