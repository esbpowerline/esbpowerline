import re
from pathlib import Path

ROOT = Path(r"C:\Users\hamim\esbpowerline\components\news\power-grid\petrobangla-archive")

def fix_destructuring(file_path):
    text = file_path.read_text(encoding='utf-8')
    if "rangeToolbar," not in text and "rangeToolbar?:" in text:
        # We need to insert `rangeToolbar,` before `onClose,`
        text = text.replace("  onClose,\n}: {", "  rangeToolbar,\n  onClose,\n}: {")
        file_path.write_text(text, encoding='utf-8')
        print(f"Fixed destructuring in {file_path.name}")

def main():
    files = list(ROOT.glob("*.tsx"))
    for f in files:
        fix_destructuring(f)

if __name__ == '__main__':
    main()
