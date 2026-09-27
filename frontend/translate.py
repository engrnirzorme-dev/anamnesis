import os
import re
import time
from deep_translator import GoogleTranslator

translator = GoogleTranslator(source='ru', target='en')

# Cache translations to speed up and avoid redundant requests
translation_cache = {}

def translate_text(text):
    if text in translation_cache:
        return translation_cache[text]
    try:
        translated = translator.translate(text)
        translation_cache[text] = translated
        time.sleep(0.1) # Be nice to Google Translate
        return translated
    except Exception as e:
        print(f"Failed to translate '{text}': {e}")
        return text

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to match strings containing Cyrillic. 
    # Match contiguous Cyrillic blocks (words + punctuation/spaces between them)
    # We'll use a regex that looks for quotes containing Cyrillic, or JSX text containing Cyrillic.
    # Actually, simpler: just find all Cyrillic sequences and translate them.
    # A sequence is Cyrillic words, separated by spaces or basic punctuation.
    pattern = re.compile(r'([А-Яа-яЁё][А-Яа-яЁё0-9\s.,!?:\-«»()]*[А-Яа-яЁёa-z0-9]?)')
    
    def repl(m):
        txt = m.group(1)
        if not re.search(r'[А-Яа-яЁё]', txt):
            return txt
        
        # Don't translate single character if it's just a letter (unless 'Я', 'В', 'С', 'К', 'О')
        if len(txt) == 1 and txt not in 'ЯВСКОявско':
            return txt
            
        translated = translate_text(txt)
        print(f"[{os.path.basename(filepath)}] '{txt}' -> '{translated}'")
        return translated

    new_content = pattern.sub(repl, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")

def main():
    target_dir = '/data/data/com.termux/files/home/anamnesis/frontend/src'
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
                process_file(filepath)
                
    print("Translation complete!")

if __name__ == '__main__':
    main()
