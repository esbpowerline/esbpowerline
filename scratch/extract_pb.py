import sys, json, pypdf
sys.path.append('scripts')
from parse_daily_reports import parse_petrobangla_file

for d in ['13-07-2026', '14-07-2026']:
    pdf_path = f'c:/Users/hamim/Desktop/{d}.pdf'
    date_iso = d.split('-')[2] + '-' + d.split('-')[1] + '-' + d.split('-')[0]
    json_path = f'public/data/daily/{date_iso}.json'
    
    reader = pypdf.PdfReader(pdf_path)
    text = '\n'.join([p.extract_text() for p in reader.pages])
    with open('pb.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    
    res = parse_petrobangla_file('pb.txt')
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    data['gasProductionData'] = res['gasProductionData']
    data['gasDistributionData'] = res['gasDistributionData']
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        
    print(f'Updated {date_iso}')
