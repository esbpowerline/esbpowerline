import pandas as pd
import json
import os
import sys

def clean_val(val):
    if pd.isna(val):
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    # If it is a string, remove commas and try to parse
    val_str = str(val).replace(',', '').replace(' ', '').strip()
    try:
        return float(val_str)
    except ValueError:
        return 0.0

def parse_excel(filepath):
    if not os.path.exists(filepath):
        sys.stderr.write(f"Excel file not found: {filepath}\n")
        return None
    
    try:
        xl = pd.ExcelFile(filepath)
        if 'P1' not in xl.sheet_names:
            sys.stderr.write("Sheet P1 not found in workbook\n")
            return None
        
        df = xl.parse('P1')
        data = {}
        
        # Searching for values dynamically
        for idx, row in df.iterrows():
            # Check Unnamed: 1 (for peaks)
            if 'Unnamed: 1' in df.columns and pd.notna(row['Unnamed: 1']):
                lbl = str(row['Unnamed: 1']).strip()
                if lbl == 'Day Peak Generation':
                    data['dayPeakGen'] = clean_val(row.get('Unnamed: 4', 0))
                elif lbl == 'Day Peak Demand':
                    data['dayPeakDemand'] = clean_val(row.get('Unnamed: 4', 0))
                elif lbl == 'Evening Peak Generation':
                    data['eveningPeakGen'] = clean_val(row.get('Unnamed: 4', 0))
                elif lbl == 'Evening Peak Demand':
                    data['eveningPeakDemand'] = clean_val(row.get('Unnamed: 4', 0))
            
            # Check Unnamed: 7 (for energy, temp, gas, cost)
            if 'Unnamed: 7' in df.columns and pd.notna(row['Unnamed: 7']):
                lbl = str(row['Unnamed: 7']).strip()
                if lbl == 'Energy Generated':
                    data['totalEnergyGen'] = clean_val(row.get('Unnamed: 10', 0))
                elif lbl == 'Total Gas Supplied':
                    data['gasSupply'] = clean_val(row.get('Unnamed: 10', 0))
                elif lbl == 'Production Cost per KWHr':
                    data['avgProductionCost'] = clean_val(row.get('Unnamed: 10', 0))
            
            # Check Unnamed: 5 (for total cost)
            if 'Unnamed: 5' in df.columns and pd.notna(row['Unnamed: 5']):
                lbl = str(row['Unnamed: 5']).strip()
                if lbl == 'Total:':
                    data['totalDailyCost'] = clean_val(row.get('Unnamed: 6', 0))
                    
        # Parse fuel share details from columns 99-102
        fuel_data = {}
        for idx, row in df.iterrows():
            if 'Unnamed: 99' in df.columns and pd.notna(row['Unnamed: 99']):
                fuel_name = str(row['Unnamed: 99']).strip()
                if fuel_name in ['Gas', 'Coal', 'HFO', 'HSD', 'Hydro', 'Solar', 'Import', 'Wind']:
                    gen = clean_val(row.get('Unnamed: 100', 0))
                    cost = clean_val(row.get('Unnamed: 102', 0))
                    fuel_data[fuel_name.lower()] = {
                        'generation': gen,
                        'cost': cost
                    }
        if fuel_data:
            data['fuels'] = fuel_data
            
        return data
    except Exception as e:
        sys.stderr.write(f"Excel parsing error: {e}\n")
        return None

def parse_pdf(filepath):
    if not os.path.exists(filepath):
        sys.stderr.write(f"PDF file not found: {filepath}\n")
        return None
    
    gas_data = {}

    try:
        import pypdf
        reader = pypdf.PdfReader(filepath)
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"

        if not text.strip():
            sys.stderr.write("PDF contains no extractable text stream.\n")
            return None

        import re
        total_match = re.search(r'Total\s+Production\s*:\s*([\d\.,]+)', text, re.IGNORECASE)
        if total_match:
            gas_data["totalGasProduction"] = float(total_match.group(1).replace(',', ''))

        lng_match = re.search(r'LNG\s*:\s*([\d\.,]+)', text, re.IGNORECASE)
        if lng_match:
            gas_data["lngImport"] = float(lng_match.group(1).replace(',', ''))

        chevron_match = re.search(r'Chevron\s*:\s*([\d\.,]+)', text, re.IGNORECASE)
        if chevron_match:
            gas_data["chevronGas"] = float(chevron_match.group(1).replace(',', ''))

        if gas_data.get("totalGasProduction") is None:
            sys.stderr.write("PDF text found but no parseable gas production values.\n")
            return None

        sys.stderr.write("Successfully extracted values from PDF text stream.\n")
        return gas_data
    except Exception as e:
        sys.stderr.write(f"PDF reading error: {e}\n")
        return None

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)
        
    filepath = sys.argv[1]
    ext = os.path.splitext(filepath)[1].lower()
    
    if ext in ['.xlsx', '.xls']:
        res = parse_excel(filepath)
    elif ext == '.pdf':
        res = parse_pdf(filepath)
    else:
        res = {"error": f"Unsupported file extension: {ext}"}
        
    if res:
        print(json.dumps(res))
    else:
        print(json.dumps({"error": "Failed to parse"}))
