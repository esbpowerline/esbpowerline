import re
from pathlib import Path

ROOT = Path(r"C:\Users\hamim\esbpowerline\components\news\power-grid\petrobangla-archive")

def fix_react_node(file_path):
    text = file_path.read_text(encoding='utf-8')
    if "React.ReactNode" in text:
        text = text.replace("React.ReactNode", "ReactNode")
        if "import { ReactNode" not in text and "import type { ReactNode" not in text:
            # Add to react import
            text = re.sub(r"import \{(.*?)\} from 'react';", r"import {\1, type ReactNode} from 'react';", text)
            if "type ReactNode" not in text:
                text = "import type { ReactNode } from 'react';\n" + text
        file_path.write_text(text, encoding='utf-8')
        print(f"Fixed ReactNode in {file_path.name}")

def fix_cn(file_path):
    text = file_path.read_text(encoding='utf-8')
    if "cn(" in text and "import { cn" not in text:
        text = text.replace("import { formatNumber } from '@/lib/utils';", "import { cn, formatNumber } from '@/lib/utils';")
        if "import { cn" not in text:
            text = text.replace("import { PB_ARCHIVE_COLORS } from '@/lib/data/petrobangla/constants';", "import { cn } from '@/lib/utils';\nimport { PB_ARCHIVE_COLORS } from '@/lib/data/petrobangla/constants';")
        file_path.write_text(text, encoding='utf-8')
        print(f"Fixed cn in {file_path.name}")

def fix_bar_prop(file_path):
    text = file_path.read_text(encoding='utf-8')
    # If the error is 'BarProp' is not assignable to type 'ReactNode', it means there's a typo in the JSX like `toolbar={toolbar}`
    # Wait, the error is at `components/news/power-grid/petrobangla-archive/PetrobanglaArchiveFieldCards.tsx(132,51): error TS2322: Type 'BarProp' is not assignable to type 'ReactNode'.`
    # Let's fix everything.

def main():
    files = list(ROOT.glob("*.tsx"))
    for f in files:
        fix_react_node(f)
        fix_cn(f)

if __name__ == '__main__':
    main()
