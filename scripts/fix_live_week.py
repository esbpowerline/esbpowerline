import re
from pathlib import Path

ROOT = Path(r"C:\Users\hamim\esbpowerline\components\news\power-grid\petrobangla-live")

def fix_live_week(file_path):
    text = file_path.read_text(encoding='utf-8')
    
    # We need to extract LiveWeekRangeToolbar block and move it to the end
    pattern = re.compile(r"(export function LiveWeekRangeToolbar.*?\}\s+)\s*if \(unified\)", re.DOTALL)
    match = pattern.search(text)
    if match:
        toolbar_code = match.group(1)
        text = text.replace(toolbar_code, "")
        text = text + "\n" + toolbar_code
        file_path.write_text(text, encoding='utf-8')
        print(f"Fixed nested component in {file_path.name}")
    else:
        print("Pattern not found")

def main():
    fix_live_week(ROOT / "PetrobanglaLiveWeekPanel.tsx")

if __name__ == '__main__':
    main()
