# Lance Uvicorn depuis CE dossier uniquement.
# Port par défaut 8010 : souvent un autre programme garde :8000 et répond avec une vieille API
# (tu vois {"ok":true,"service":"csf-api"} sans certificationsApiRevision).
#
# Usage :
#   cd "...\backend"
#   .\run_dev.ps1
#
# Puis dans frontend/.env : BACKEND_URL=http://127.0.0.1:8010
# Pour forcer le port 8000 :  $env:CSF_BACKEND_PORT=8000 ; .\run_dev.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if ($env:CSF_BACKEND_PORT) {
    $Port = [int]$env:CSF_BACKEND_PORT
} else {
    $Port = 8010
}

Write-Host "Nettoyage __pycache__..."
Get-ChildItem -Path . -Recurse -Directory -Filter __pycache__ -ErrorAction SilentlyContinue |
  Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Arrêt des processus en écoute sur le port $Port ..."
Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
netstat -ano | Select-String ":$Port\s+.*LISTENING" | ForEach-Object {
    $parts = ($_.Line -split '\s+') | Where-Object { $_ -ne '' }
    $last = $parts[-1]
    if ($last -match '^\d+$') { taskkill /F /PID $last 2>$null }
}
Start-Sleep -Seconds 2

Write-Host "Vérification du module chargé :"
python -c "import app.main as m; print('  app.main ->', m.__file__)"

Write-Host ""
Write-Host "Démarrage sur le port $Port (définir CSF_BACKEND_PORT pour changer)."
Write-Host "Ouvrir : http://127.0.0.1:$Port/health"
Write-Host "Dans F12 > Réseau > réponse / en-têtes : doit contenir certificationsApiRevision et X-CSF-Backend-Revision: 2"
Write-Host "Si tu utilises le frontend : BACKEND_URL=http://127.0.0.1:$Port"
Write-Host ""
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port $Port
