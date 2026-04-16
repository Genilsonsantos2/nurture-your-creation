# Script para subir atualizações do CETI Digital
Write-Host "Iniciando processo de subida..." -ForegroundColor Cyan

git add .
git commit -m "feat: login seguro e sistema de aprovacao de usuarios"
git push

Write-Host "Processo concluído! Verifique se houve erros acima." -ForegroundColor Green
Pause
