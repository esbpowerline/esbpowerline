import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    "https://www.powergrid.gov.bd/site/view/reports/hourly-generation-data",
    "https://www.powergrid.gov.bd/site/view/reports/hourly-demand-supply-load-shedding",
    "https://www.powergrid.gov.bd/site/view/reports/hourly-generation",
    "https://www.powergrid.gov.bd/site/view/reports/hourly-demand"
]

for url in urls:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        html = urllib.request.urlopen(req, context=ctx, timeout=10).read().decode('utf-8', errors='ignore')
        print(f"\n--- LINKS ON: {url} ---")
        links = set(re.findall(r'href=["\']([^"\']+)["\']', html, re.I))
        for link in sorted(list(links)):
            # We want to print links pointing to files or show_report or other resources
            if any(term in link.lower() for term in ["report", "excel", "xlsx", "xlsm", "pdf", "file", "download", "show_report"]):
                print("  ", link)
    except Exception as e:
        pass
