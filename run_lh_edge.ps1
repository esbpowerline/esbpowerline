$env:CHROME_PATH = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$port = 3006

Write-Host "Starting Next.js production server on port $port..."
$serverProcess = Start-Process -FilePath "npx.cmd" -ArgumentList "next", "start", "-p", "$port" -PassThru -WindowStyle Hidden

Write-Host "Waiting 8 seconds for server to boot..."
Start-Sleep -Seconds 8

Write-Host "Running Lighthouse..."
try {
    npx lighthouse http://localhost:$port --output json --output-path ./lh-edge-test.json --only-categories=performance --chrome-flags="--headless"
    Write-Host "Lighthouse finished successfully."
} catch {
    Write-Host "Lighthouse failed: $_"
}

Write-Host "Killing Next.js server..."
Stop-Process -Id $serverProcess.Id -Force
