import re
from pathlib import Path

ROOT = Path(r"C:\Users\hamim\esbpowerline\components\news\power-grid\petrobangla-archive")

def rename_toolbar(file_path):
    text = file_path.read_text(encoding='utf-8')
    # replace toolbar={ to rangeToolbar={
    text = text.replace('toolbar={', 'rangeToolbar={')
    
    # replace toolbar?: ReactNode; to rangeToolbar?: ReactNode;
    text = text.replace('toolbar?: ReactNode;', 'rangeToolbar?: ReactNode;')
    text = text.replace('toolbar?: React.ReactNode;', 'rangeToolbar?: ReactNode;')
    
    # replace {toolbar && <div className="shrink-0">{toolbar}</div>}
    text = text.replace('{toolbar && <div className="shrink-0">{toolbar}</div>}', '{rangeToolbar && <div className="shrink-0">{rangeToolbar}</div>}')
    
    # also in the props destructuring
    text = text.replace('  toolbar,\n', '  rangeToolbar,\n')
    text = text.replace('  toolbar = null,\n', '  rangeToolbar,\n')
    text = text.replace('  toolbar:\n', '  rangeToolbar:\n')
    text = text.replace('  toolbar,', '  rangeToolbar,')
    
    file_path.write_text(text, encoding='utf-8')
    print(f"Fixed {file_path.name}")

def main():
    files = list(ROOT.glob("*.tsx"))
    for f in files:
        rename_toolbar(f)

if __name__ == '__main__':
    main()
