# Uso:  .\deploy.ps1 "mensaje del commit"
# Limpia cualquier lock de git, añade todo, commitea y pushea (Vercel redeploya solo).
param([Parameter(Mandatory = $true)][string]$m)

Get-ChildItem ".git" -Recurse -Filter "*.lock" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
git add .
git commit -m $m
git push
