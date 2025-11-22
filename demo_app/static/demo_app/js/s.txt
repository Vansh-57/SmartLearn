import os
from google import genai
from google.genai import types
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(r'C:\Users\VANSH\Desktop\Demo\.env')

API_KEY=os.getenv("SMARTLEARN_API_KEY")
AI_MODEL=os.getenv("AI_MODE" , "gemini-2.5-flash")

print("API_KEY =", API_KEY if API_KEY else "no API found") 

client=genai.Client(api_key=API_KEY)

def ask_ai(prompt):
    response= client.models.generate_content(
        model=AI_MODEL,
        contents=prompt

    )
    return response.text
if __name__ == "__main__":
    print(ask_ai("colour of banana"))