import os
import google.generativeai as genai

def generate_hlsd(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()
    prompt = (
        "Summarize the following Python file as a High Level Solution Design (HLSD) document. "
        "Focus on architecture, main components, API endpoints, and integration points. "
        "Use clear sections and bullet points where appropriate.\n\n"
        f"{code}"
    )
    model = genai.GenerativeModel("models/gemini-1.5-flash-8b-latest")
    response = model.generate_content(prompt)
    return response.text

if __name__ == "__main__":
    hlsd = generate_hlsd("main.py")
    with open("hlsd.md", "w", encoding='utf-8') as f:
        f.write(hlsd) 