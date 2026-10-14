while ($true) {
    Write-Host "[Tunnel] Starting localtunnel on port 5050 (subdomain: routewise-prajwal)..."
    & lt --port 5050 --subdomain routewise-prajwal
    Write-Host "[Tunnel] Process exited. Reconnecting in 3 seconds..."
    Start-Sleep -Seconds 3
}
